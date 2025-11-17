from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.db import models
from django.utils import timezone
from decimal import Decimal

from .models import (
    RawMaterial,
    UnitOfMeasurement,
    PurchaseOrder,
    Recipe,
    RecipeItem,
    MenuCategory,
    MenuItem,
    StockTransaction,
    CustomerOrder,
    OrderItem,
    StockAlert,
    Branch,
    BranchQuantity,
    MenuItemBranchAvailability,
)
from .serializers import (
    RawMaterialSerializer,
    UnitOfMeasurementSerializer,
    PurchaseOrderSerializer,
    PurchaseOrderCreateSerializer,
    RecipeSerializer,
    RecipeItemSerializer,
    MenuCategorySerializer,
    MenuItemSerializer,
    StockTransactionSerializer,
    StockOutSerializer,
    CustomerOrderSerializer,
    CustomerOrderCreateSerializer,
    OrderStatusUpdateSerializer,
    StockAlertSerializer,
    BranchSerializer,
    BranchQuantitySerializer,
    MenuItemBranchAvailabilitySerializer,
)


# -------------------
# Core Inventory Views
# -------------------

class UnitOfMeasurementViewSet(viewsets.ModelViewSet):
    queryset = UnitOfMeasurement.objects.all()
    serializer_class = UnitOfMeasurementSerializer
    permission_classes = [IsAuthenticated]


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter materials by branch if branch_id is provided"""
        from django.db.models import Exists, OuterRef, Subquery, DecimalField, Case, When, Value, BooleanField, Q, F
        
        queryset = RawMaterial.objects.all()
        branch_id = self.request.query_params.get('branch_id', None)
        
        if branch_id is not None:
            # Get branch-specific quantity using subquery
            branch_qty_subquery = BranchQuantity.objects.filter(
                raw_material=OuterRef('pk'),
                branch_id=branch_id
            ).values('quantity')[:1]
            
            # Annotate with branch-specific quantity and is_low_stock status
            queryset = queryset.annotate(
                quantity=Subquery(branch_qty_subquery, output_field=DecimalField()),
                is_low_stock=Case(
                    When(
                        Q(quantity__lte=F('minimum_threshold')) & Q(quantity__isnull=False),
                        then=Value(True)
                    ),
                    default=Value(False),
                    output_field=BooleanField()
                )
            ).filter(
                Exists(
                    BranchQuantity.objects.filter(
                        raw_material=OuterRef('pk'),
                        branch_id=branch_id
                    )
                )
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Create material and check for alerts"""
        material = serializer.save()
        self.check_and_create_alerts(material)
    
    def perform_update(self, serializer):
        """Update material and check for alerts"""
        material = serializer.save()
        self.check_and_create_alerts(material)
    
    def check_and_create_alerts(self, material):
        """Check material status and create/resolve alerts based on current conditions"""
        # First, resolve any outdated alerts for this material
        self.resolve_outdated_alerts(material)
        
        # Check for expired and expiring batches (these are not branch-specific)
        from django.db.models import Sum
        expired_batches = material.get_expired_batches()
        if expired_batches.exists():
            expired_qty = expired_batches.aggregate(total=Sum('quantity'))['total'] or Decimal('0')
            StockAlert.objects.update_or_create(
                raw_material=material,
                alert_type='expired',
                status='active',
                defaults={
                    'message': f'{material.name} has {expired_qty} {material.unit} expired',
                    'current_quantity': material.get_total_quantity(),
                }
            )
        
        expiring_soon = material.get_expiring_soon_batches()
        if expiring_soon.exists():
            oldest_expiring = expiring_soon.first()
            expiring_qty = expiring_soon.aggregate(total=Sum('quantity'))['total'] or Decimal('0')
            if oldest_expiring:
                StockAlert.objects.update_or_create(
                    raw_material=material,
                    alert_type='expiring_soon',
                    status='active',
                    defaults={
                        'message': f'{material.name}: {expiring_qty} {material.unit} expiring soon (earliest: {oldest_expiring.expiry_date})',
                        'current_quantity': material.get_total_quantity(),
                    }
                )
        
        # Check stock levels for each branch where this material exists
        for branch_qty in material.branch_quantities.all():
            branch = branch_qty.branch
            current_qty = branch_qty.quantity
            alerts_to_keep = []
            
            # Out of stock
            if current_qty <= 0:
                alerts_to_keep.append('out_of_stock')
                StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=branch,
                    alert_type='out_of_stock',
                    status='active',
                    defaults={
                        'message': f'{material.name} is out of stock at {branch.name}',
                        'current_quantity': current_qty,
                        'threshold_value': material.minimum_threshold,
                    }
                )
            
            # Low stock (below minimum threshold)
            elif current_qty <= material.minimum_threshold:
                alerts_to_keep.append('low_stock')
                StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=branch,
                    alert_type='low_stock',
                    status='active',
                    defaults={
                        'message': f'{material.name} is running low at {branch.name}. Current: {current_qty} {material.unit}, Minimum: {material.minimum_threshold} {material.unit}',
                        'current_quantity': current_qty,
                        'threshold_value': material.minimum_threshold,
                    }
                )
            
            # Reorder level
            elif current_qty <= material.reorder_level:
                alerts_to_keep.append('reorder')
                StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=branch,
                    alert_type='reorder',
                    status='active',
                    defaults={
                        'message': f'{material.name} at {branch.name} has reached reorder level. Current: {current_qty} {material.unit}, Reorder Level: {material.reorder_level} {material.unit}',
                        'current_quantity': current_qty,
                        'threshold_value': material.reorder_level,
                    }
                )
            
            # Resolve alerts that should no longer exist for this branch
            alerts_to_resolve = StockAlert.objects.filter(
                raw_material=material,
                branch=branch,
                alert_type__in=['out_of_stock', 'low_stock', 'reorder'],
                status='active'
            )
            if alerts_to_keep:
                alerts_to_resolve = alerts_to_resolve.exclude(alert_type__in=alerts_to_keep)
            alerts_to_resolve.update(status='resolved', resolved_at=timezone.now())
    
    def resolve_outdated_alerts(self, material):
        """Resolve alerts that are no longer valid for this material"""
        # Branch-specific alerts (out_of_stock, low_stock, reorder) are handled in check_and_create_alerts
        # This method only handles expired/expiring alerts which are not branch-specific
        
        # If there are no more expired batches with quantity, resolve expired alerts
        if not material.get_expired_batches().exists():
            StockAlert.objects.filter(
                raw_material=material,
                alert_type='expired',
                status='active'
            ).update(status='resolved', resolved_at=timezone.now())
        
        # If there are no more expiring_soon batches with quantity, resolve those alerts
        if not material.get_expiring_soon_batches().exists():
            StockAlert.objects.filter(
                raw_material=material,
                alert_type='expiring_soon',
                status='active'
            ).update(status='resolved', resolved_at=timezone.now())
    
    @action(detail=False, methods=['get'])
    def low_stock_items(self, request):
        """Get all materials with low stock (requires branch_id parameter)"""
        branch_id = request.query_params.get('branch_id')
        if not branch_id:
            return Response(
                {'error': 'branch_id parameter is required'},
                status=400
            )
        
        low_stock = self.get_queryset().filter(is_low_stock=True)
        serializer = self.get_serializer(low_stock, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get materials expiring within 7 days"""
        from datetime import timedelta
        expiry_date = timezone.now().date() + timedelta(days=7)
        expiring = self.get_queryset().filter(
            expiry_date__lte=expiry_date,
            expiry_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(expiring, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired materials"""
        expired = self.get_queryset().filter(expiry_date__lt=timezone.now().date())
        serializer = self.get_serializer(expired, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        """Clear all inventory data including materials, purchase orders, and stock transactions"""
        from django.db import transaction
        from .models import (
            StockTransaction, PurchaseOrderItem, PurchaseOrder, RecipeItem, 
            Recipe, MenuItem, MenuCategory, RawMaterial, BranchQuantity,
            MenuItemBranchAvailability, CustomerOrder, OrderItem, StockAlert
        )
        
        try:
            with transaction.atomic():
                # 1. Delete all order items first (dependencies: CustomerOrder, MenuItem)
                OrderItem.objects.all().delete()
                
                # 2. Delete all customer orders
                CustomerOrder.objects.all().delete()
                
                # 3. Delete all stock transactions
                StockTransaction.objects.all().delete()
                
                # 4. Delete all stock alerts
                StockAlert.objects.all().delete()
                
                # 5. Delete all branch quantities
                BranchQuantity.objects.all().delete()
                
                # 6. Delete all menu item branch availabilities
                MenuItemBranchAvailability.objects.all().delete()
                
                # 7. Delete all purchase order items
                PurchaseOrderItem.objects.all().delete()
                
                # 8. Delete all purchase orders
                PurchaseOrder.objects.all().delete()
                
                # 9. Delete all recipe items (they reference raw materials)
                RecipeItem.objects.all().delete()
                
                # 10. Delete all recipes
                Recipe.objects.all().delete()
                
                # 11. Delete all menu items (they reference recipes)
                MenuItem.objects.all().delete()
                
                # 12. Delete all menu categories
                MenuCategory.objects.all().delete()
                
                # 13. Finally delete all raw materials
                RawMaterial.objects.all().delete()
                
                return Response({
                    'message': 'All inventory data has been cleared successfully',
                    'cleared_items': {
                        'raw_materials': 'All raw materials deleted',
                        'purchase_orders': 'All purchase orders deleted',
                        'stock_transactions': 'All stock transactions deleted',
                        'recipes': 'All recipes deleted',
                        'recipe_items': 'All recipe items deleted',
                        'menu_items': 'All menu items deleted',
                        'menu_categories': 'All menu categories deleted',
                        'customer_orders': 'All customer orders deleted',
                        'order_items': 'All order items deleted',
                        'branch_quantities': 'All branch quantities deleted',
                        'stock_alerts': 'All stock alerts deleted'
                    }
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to clear inventory data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get materials grouped by type"""
        material_type = request.query_params.get('type')
        
        if material_type:
            materials = self.get_queryset().filter(material_type=material_type)
        else:
            materials = self.get_queryset()
        
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def raw_only(self, request):
        """Get only raw materials"""
        raw_materials = self.get_queryset().filter(material_type='raw')
        serializer = self.get_serializer(raw_materials, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def processed_only(self, request):
        """Get only processed goods"""
        processed = self.get_queryset().filter(material_type='processed')
        serializer = self.get_serializer(processed, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def supplies_only(self, request):
        """Get only supplies and utensils"""
        supplies = self.get_queryset().filter(material_type='supplies')
        serializer = self.get_serializer(supplies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def type_stats(self, request):
        """Get statistics by material type"""
        from django.db.models import Count, Sum
        
        stats = {
            'by_type': list(
                self.get_queryset()
                .values('material_type')
                .annotate(
                    count=Count('id'),
                    total_value=Sum('quantity')
                )
            ),
            'raw_count': self.get_queryset().filter(material_type='raw').count(),
            'processed_count': self.get_queryset().filter(material_type='processed').count(),
            'semi_processed_count': self.get_queryset().filter(material_type='semi_processed').count(),
            'supplies_count': self.get_queryset().filter(material_type='supplies').count(),
        }
        
        return Response(stats)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["test"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter purchase orders by branch if provided"""
        queryset = super().get_queryset()
        
        # Filter by branch if provided
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    def create(self, request, *args, **kwargs):
        try:
            # Use the serializer with proper context
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e), "detail": "Failed to create purchase order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        recent_orders = self.get_queryset().order_by("-id")[:10]
        serializer = self.get_serializer(recent_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def test(self, request):
        return Response({
            "message": "Backend is working",
            "received_data": request.data,
            "user": str(request.user) if request.user.is_authenticated else "Anonymous"
        })

    @action(detail=False, methods=["get"])
    def test_orders(self, request):
        """Test endpoint to verify orders API is working"""
        return Response({
            "message": "Orders API is working",
            "orders_count": CustomerOrder.objects.count(),
            "user": str(request.user) if request.user.is_authenticated else "Anonymous"
        })


# -------------------
# Menu + Recipe Views
# -------------------

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.prefetch_related("items__raw_material").all()
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class RecipeItemViewSet(viewsets.ModelViewSet):
    queryset = RecipeItem.objects.select_related("raw_material", "recipe").all()
    serializer_class = RecipeItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category", "recipe").all()
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


# -------------------
# Stock Management Views
# -------------------

class StockTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock transaction history"""
    queryset = StockTransaction.objects.select_related('raw_material', 'performed_by', 'branch').all()
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by branch if provided
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        # Filter by raw material if provided
        raw_material_id = self.request.query_params.get('raw_material_id')
        if raw_material_id:
            queryset = queryset.filter(raw_material_id=raw_material_id)
        
        # Filter by transaction type if provided
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(performed_by_id=user_id)
        
        return queryset


class StockOutViewSet(viewsets.ViewSet):
    """ViewSet for stock out operations"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def available_materials(self, request):
        """Get all materials available for stock out, optionally filtered by branch"""
        branch_id = request.query_params.get('branch_id', None)
        
        if branch_id:
            # Get materials that have quantities in the specified branch
            branch_quantities = BranchQuantity.objects.filter(
                branch_id=branch_id,
                quantity__gt=0  # Only materials with positive quantities
            ).select_related('raw_material')
            
            # Build response with branch-specific quantities
            materials_data = []
            for bq in branch_quantities:
                material = bq.raw_material
                materials_data.append({
                    'id': material.id,
                    'name': material.name,
                    'quantity': bq.quantity,  # Branch-specific quantity
                    'unit': material.unit,
                    'material_type': material.material_type,
                    'material_type_display': material.get_material_type_display(),
                })
            
            return Response(materials_data, status=status.HTTP_200_OK)
        else:
            # Return all materials (fallback)
            materials = RawMaterial.objects.filter(quantity__gt=0)
            serializer = RawMaterialSerializer(materials, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def stock_out(self, request):
        """Process stock out operation from branch-specific inventory"""
        from .models import StockBatch
        from decimal import Decimal
        
        serializer = StockOutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                material = RawMaterial.objects.get(id=serializer.validated_data['raw_material_id'])
                branch_id = serializer.validated_data['branch_id']
                quantity_needed = serializer.validated_data['quantity']
                notes = serializer.validated_data.get('notes', '')
                force_expired = serializer.validated_data.get('force_expired', False)
                
                # Get the authenticated user
                if request.user.is_authenticated:
                    performed_by_user = request.user
                    performed_by_name = request.user.username
                else:
                    performed_by_user = None
                    performed_by_name = "System"
                
                # Get branch quantity
                # Get or create branch quantity; treat missing as zero instead of erroring
                branch_qty, _ = BranchQuantity.objects.get_or_create(
                    branch_id=branch_id,
                    raw_material=material,
                    defaults={'quantity': Decimal('0')}
                )

                available = branch_qty.quantity if branch_qty.quantity > 0 else Decimal('0')
                requested = quantity_needed
                to_deduct = requested if requested <= available else available

                print(f"[STOCK OUT] Material: {material.name}, Available: {available}, Requested: {requested}, Will deduct: {to_deduct}, Force Expired: {force_expired}")

                if to_deduct <= 0:
                    # Nothing to deduct; return success without making changes
                    return Response({
                        'message': 'No stock deducted (insufficient available stock)',
                        'transaction': None,
                        'remaining_stock': Decimal('0')
                    }, status=status.HTTP_200_OK)

                # Smart FIFO: prioritize expiring-soon and expired batches, then regular FIFO
                remaining_to_deduct = to_deduct
                
                if force_expired:
                    # Force expired mode: only target expired batches
                    batches = material.get_expired_batches().order_by('expiry_date')
                    print(f"[STOCK OUT] Force expired mode - targeting {batches.count()} expired batches")
                else:
                    # Smart FIFO: expiring soon first, then regular batches by expiry date
                    from django.utils import timezone
                    from datetime import timedelta
                    
                    expiring_threshold = timezone.now().date() + timedelta(days=2)
                    
                    # Get expiring-soon batches (including expired) with quantity > 0
                    expiring_batches = material.batches.filter(
                        quantity__gt=0,
                        expiry_date__lte=expiring_threshold
                    ).order_by('expiry_date')
                    
                    # Get regular batches (not expiring soon) with quantity > 0
                    regular_batches = material.batches.filter(
                        quantity__gt=0,
                        expiry_date__gt=expiring_threshold
                    ).order_by('expiry_date')
                    
                    # Combine: expiring first, then regular FIFO
                    batches = list(expiring_batches) + list(regular_batches)
                    print(f"[STOCK OUT] Smart FIFO - {len(list(expiring_batches))} expiring/expired, {len(list(regular_batches))} regular batches")

                # Deduct from batches up to remaining_to_deduct
                for batch in batches:
                    if remaining_to_deduct <= 0:
                        break

                    if batch.quantity >= remaining_to_deduct:
                        batch.quantity -= remaining_to_deduct
                        print(f"[STOCK OUT] Deducted {remaining_to_deduct} from batch (Expiry: {batch.expiry_date}), Remaining in batch: {batch.quantity}")
                        remaining_to_deduct = Decimal('0')
                        batch.save()
                    else:
                        deducted = batch.quantity
                        remaining_to_deduct -= batch.quantity
                        batch.quantity = Decimal('0')
                        print(f"[STOCK OUT] Depleted batch (Expiry: {batch.expiry_date}), deducted {deducted}, still need {remaining_to_deduct}")
                        batch.save()

                # Deduct from branch quantity but never below zero
                branch_qty.quantity -= to_deduct
                if branch_qty.quantity < 0:
                    branch_qty.quantity = Decimal('0')
                branch_qty.save()

                # Create stock transaction (only if something was deducted)
                # Note: StockTransaction.save() will sign the quantity as negative for 'stock_out'
                transaction_notes = notes or f"Stock out from branch - {to_deduct} {material.unit}"
                if force_expired:
                    transaction_notes = f"Expired stock disposal - {transaction_notes}"

                stock_transaction = StockTransaction.objects.create(
                    transaction_type='stock_out',
                    raw_material=material,
                    branch_id=branch_id,
                    quantity=to_deduct,
                    unit=material.unit,
                    reference_number=f"SO-{StockTransaction.objects.count() + 1}",
                    notes=transaction_notes,
                    performed_by=performed_by_user,
                    performed_by_name=performed_by_name
                )
                
                # Check and update alerts (this will resolve expired/expiring alerts if batches are gone)
                print(f"[STOCK OUT] Checking alerts for material: {material.name}")
                print(f"[STOCK OUT] Expired batches remaining: {material.get_expired_batches().count()}")
                print(f"[STOCK OUT] Expiring soon remaining: {material.get_expiring_soon_batches().count()}")
                self.check_and_create_alerts(material)
                
                return Response({
                    'message': 'Stock out successful',
                    'requested_quantity': str(requested),
                    'deducted_quantity': str(to_deduct),
                    'transaction': StockTransactionSerializer(stock_transaction).data,
                    'remaining_stock': branch_qty.quantity
                }, status=status.HTTP_201_CREATED)
                
            except RawMaterial.DoesNotExist:
                # Return 200 with a message instead of error
                return Response({
                    'message': 'Raw material not found',
                    'transaction': None,
                    'remaining_stock': Decimal('0')
                }, status=status.HTTP_200_OK)
            except Exception as e:
                import traceback
                print(f"[STOCK OUT ERROR] {str(e)}")
                print(traceback.format_exc())
                # Return 200 even on exceptions to avoid UI errors
                return Response({
                    'message': f'Stock out completed with issues: {str(e)}',
                    'transaction': None,
                    'remaining_stock': Decimal('0')
                }, status=status.HTTP_200_OK)
        
        # Return 200 even for validation errors
        return Response({
            'message': 'Invalid stock out request',
            'errors': serializer.errors,
            'transaction': None
        }, status=status.HTTP_200_OK)


# -------------------
# Customer Order Views
# -------------------

class CustomerOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for customer order management"""
    queryset = CustomerOrder.objects.prefetch_related('items__menu_item').select_related('branch').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerOrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderStatusUpdateSerializer
        return CustomerOrderSerializer
    
    def get_permissions(self):
        """Allow public access for creating orders, authenticated for management"""
        if self.action in ['create', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter orders based on user permissions and query parameters"""
        queryset = super().get_queryset()
        
        # Filter by branch if provided (exact match, exclude nulls)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            try:
                branch_id_int = int(branch_id)
                queryset = queryset.filter(branch_id=branch_id_int)
            except (ValueError, TypeError):
                # Invalid branch_id: return no results instead of falling back to all
                queryset = queryset.none()
        
        # Filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by customer name if provided
        customer_name = self.request.query_params.get('customer_name')
        if customer_name:
            queryset = queryset.filter(customer_name__icontains=customer_name)
        
        # Filter by date range if provided
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(order_date__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(order_date__date__lte=date_to)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new customer order"""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                order = serializer.save()
                return Response(
                    CustomerOrderSerializer(order).data, 
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e), "detail": "Failed to create order"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    def update(self, request, *args, **kwargs):
        """Update order status (staff only)"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                # Update processed_by fields
                if request.user.is_authenticated:
                    serializer.save(
                        processed_by=request.user,
                        processed_by_name=request.user.username
                    )
                else:
                    serializer.save()
                
                return Response(
                    CustomerOrderSerializer(instance).data,
                    status=status.HTTP_200_OK
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e), "detail": "Failed to update order"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending orders"""
        pending_orders = self.get_queryset().filter(status='pending').order_by('order_date')
        serializer = self.get_serializer(pending_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's orders"""
        from django.utils import timezone
        today = timezone.now().date()
        today_orders = self.get_queryset().filter(order_date__date=today).order_by('-order_date')
        serializer = self.get_serializer(today_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get order statistics"""
        from django.db.models import Count, Sum
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Get branch filter if provided
        branch_id = request.query_params.get('branch_id')
        base_query = CustomerOrder.objects.all()
        if branch_id:
            base_query = base_query.filter(branch_id=branch_id)
        
        stats = {
            'total_orders': base_query.count(),
            'today_orders': base_query.filter(order_date__date=today).count(),
            'pending_orders': base_query.filter(status='pending').count(),
            'preparing_orders': base_query.filter(status='preparing').count(),
            'ready_orders': base_query.filter(status='ready').count(),
            'today_revenue': base_query.filter(
                order_date__date=today, 
                status__in=['completed', 'ready']
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'status_breakdown': base_query.values('status').annotate(
                count=Count('id')
            ).order_by('status'),
            'by_branch': CustomerOrder.objects.values('branch__name').annotate(
                count=Count('id'),
                revenue=Sum('total_amount')
            ).order_by('-count')
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm an order"""
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {"error": "Only pending orders can be confirmed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'confirmed'
        if request.user.is_authenticated:
            order.processed_by = request.user
            order.processed_by_name = request.user.username
        order.save()
        
        serializer = CustomerOrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start_preparing(self, request, pk=None):
        """Start preparing an order"""
        order = self.get_object()
        if order.status != 'confirmed':
            return Response(
                {"error": "Only confirmed orders can be started"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'preparing'
        if request.user.is_authenticated:
            order.processed_by = request.user
            order.processed_by_name = request.user.username
        order.save()
        
        serializer = CustomerOrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        """Mark order as ready"""
        order = self.get_object()
        if order.status != 'preparing':
            return Response(
                {"error": "Only preparing orders can be marked as ready"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'ready'
        if request.user.is_authenticated:
            order.processed_by = request.user
            order.processed_by_name = request.user.username
        order.save()
        
        serializer = CustomerOrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete an order"""
        order = self.get_object()
        if order.status != 'ready':
            return Response(
                {"error": "Only ready orders can be completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'completed'
        if request.user.is_authenticated:
            order.processed_by = request.user
            order.processed_by_name = request.user.username
        order.save()
        
        serializer = CustomerOrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        if order.status in ['completed', 'cancelled']:
            return Response(
                {"error": "Cannot cancel completed or already cancelled orders"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        if request.user.is_authenticated:
            order.processed_by = request.user
            order.processed_by_name = request.user.username
        order.save()
        
        serializer = CustomerOrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def qr_data(self, request, pk=None):
        """Get order data for QR code generation"""
        order = self.get_object()
        
        # Create a simple, scannable data structure
        qr_data = {
            'order_id': order.id,
            'customer_name': order.customer_name,
            'total_amount': float(order.total_amount),
            'status': order.status,
            'order_date': order.order_date.isoformat(),
            'items_count': order.items.count()
        }
        
        return Response({
            'qr_data': qr_data,
            'qr_string': f"ORDER:{order.id}",  # Simple format for QR scanning
            'full_order': CustomerOrderSerializer(order).data
        })
    
    @action(detail=False, methods=['post'])
    def retrieve_by_qr(self, request):
        """Retrieve order by QR code data"""
        qr_string = request.data.get('qr_string', '')
        
        # Parse QR string format: "ORDER:123"
        if qr_string.startswith('ORDER:'):
            try:
                order_id = int(qr_string.split(':')[1])
                order = CustomerOrder.objects.get(id=order_id)
                serializer = CustomerOrderSerializer(order)
                return Response(serializer.data)
            except (ValueError, CustomerOrder.DoesNotExist):
                return Response(
                    {'error': 'Invalid or non-existent order ID in QR code'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(
            {'error': 'Invalid QR code format'},
            status=status.HTTP_400_BAD_REQUEST
        )


class StockAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for managing stock alerts"""
    queryset = StockAlert.objects.select_related('raw_material', 'acknowledged_by').all()
    serializer_class = StockAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by alert type
        alert_type = self.request.query_params.get('alert_type')
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        # Filter by material
        material_id = self.request.query_params.get('material_id')
        if material_id:
            queryset = queryset.filter(raw_material_id=material_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active alerts"""
        active_alerts = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get alert counts by type and status"""
        from django.db.models import Count
        
        counts = {
            'total': self.get_queryset().count(),
            'active': self.get_queryset().filter(status='active').count(),
            'by_type': dict(
                self.get_queryset().filter(status='active')
                .values('alert_type')
                .annotate(count=Count('id'))
                .values_list('alert_type', 'count')
            ),
            'by_status': dict(
                self.get_queryset()
                .values('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
            ),
        }
        
        return Response(counts)
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert"""
        alert = self.get_object()
        user = request.user if request.user.is_authenticated else None
        alert.acknowledge(user)
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an alert"""
        alert = self.get_object()
        alert.resolve()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        """Resolve all non-resolved alerts (clears the panel)."""
        to_clear = self.get_queryset().exclude(status='resolved')
        count = to_clear.update(status='resolved', resolved_at=timezone.now())
        return Response({'message': 'Alerts cleared', 'resolved_count': count})
    
    @action(detail=False, methods=['post'])
    def check_all_materials(self, request):
        """Manually trigger alert check for all materials"""
        materials = RawMaterial.objects.all()
        alerts_created = 0
        
        for material in materials:
            # Use the check method from RawMaterialViewSet
            viewset = RawMaterialViewSet()
            viewset.check_and_create_alerts(material)
            alerts_created += 1
        
        return Response({
            'message': f'Checked {materials.count()} materials',
            'active_alerts': StockAlert.objects.filter(status='active').count()
        })
    
    @action(detail=False, methods=['post'])
    def check_expired_batches(self, request):
        """Check all batches for expiration and create alerts"""
        from .models import StockBatch
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Find all expired batches with remaining quantity
        expired_batches = StockBatch.objects.filter(
            expiry_date__lt=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        alerts_created = 0
        materials_affected = set()
        
        for batch in expired_batches:
            material = batch.raw_material
            materials_affected.add(material.id)
            
            # Mark batch as expired
            batch.is_expired = True
            batch.save()
            
            # Create or update alert for this material
            alert, created = StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expired',
                status='active',
                defaults={
                    'message': f'{material.name} has expired batch(es). Total expired: {batch.quantity} {material.unit}. Expires: {batch.expiry_date}. Please remove from stock.',
                    'current_quantity': material.quantity,
                }
            )
            
            if created:
                alerts_created += 1
            elif alert.status == 'active':
                # Update existing alert message with cumulative info
                total_expired = StockBatch.objects.filter(
                    raw_material=material,
                    is_expired=True,
                    quantity__gt=0
                ).aggregate(total=models.Sum('quantity'))['total'] or 0
                
                alert.message = f'{material.name} has {expired_batches.filter(raw_material=material).count()} expired batch(es). Total expired quantity: {total_expired} {material.unit}. Please remove from stock.'
                alert.save()
        
        return Response({
            'message': f'Checked all batches for expiration',
            'expired_batches_found': expired_batches.count(),
            'materials_affected': len(materials_affected),
            'alerts_created': alerts_created,
            'expired_batch_details': [
                {
                    'material': batch.raw_material.name,
                    'quantity': float(batch.quantity),
                    'unit': batch.raw_material.unit,
                    'expiry_date': batch.expiry_date,
                    'days_overdue': (today - batch.expiry_date).days
                }
                for batch in expired_batches[:10]  # Show first 10
            ]
        })
    
    @action(detail=False, methods=['post'])
    def check_expiring_soon(self, request):
        """Check for batches expiring within 2 days"""
        from .models import StockBatch
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        threshold = today + timedelta(days=2)
        
        expiring_soon = StockBatch.objects.filter(
            expiry_date__lte=threshold,
            expiry_date__gte=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        alerts_created = 0
        
        for batch in expiring_soon:
            material = batch.raw_material
            
            # Calculate total expiring quantity for this material
            from django.db.models import Sum
            expiring_qty = material.get_expiring_soon_batches().aggregate(total=Sum('quantity'))['total'] or Decimal('0')
            
            alert, created = StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expiring_soon',
                status='active',
                defaults={
                    'message': f'{material.name}: {expiring_qty} {material.unit} expiring soon (earliest: {batch.expiry_date}). Use soon or plan stock-out.',
                    'current_quantity': material.quantity,
                }
            )
            
            if created:
                alerts_created += 1
        
        return Response({
            'message': f'Checked batches expiring within 2 days',
            'expiring_soon_count': expiring_soon.count(),
            'alerts_created': alerts_created,
            'expiring_batches': [
                {
                    'material': batch.raw_material.name,
                    'quantity': float(batch.quantity),
                    'unit': batch.raw_material.unit,
                    'expiry_date': batch.expiry_date,
                    'days_until_expiry': batch.days_until_expiry
                }
                for batch in expiring_soon
            ]
        })
    
    @action(detail=False, methods=['post'])
    def auto_check_all(self, request):
        """Automatically check all stock conditions and create alerts"""
        from .models import StockBatch
        from datetime import timedelta
        
        today = timezone.now().date()
        alerts_created = {
            'low_stock': 0,
            'out_of_stock': 0,
            'reorder': 0,
            'expired': 0,
            'expiring_soon': 0
        }
        
        # Resolve stale expired/expiring alerts first
        for material in RawMaterial.objects.all():
            if not material.get_expired_batches().exists():
                StockAlert.objects.filter(
                    raw_material=material,
                    alert_type='expired',
                    status='active'
                ).update(status='resolved', resolved_at=timezone.now())
            if not material.get_expiring_soon_batches().exists():
                StockAlert.objects.filter(
                    raw_material=material,
                    alert_type='expiring_soon',
                    status='active'
                ).update(status='resolved', resolved_at=timezone.now())

        # 1. Check all branch quantities for stock levels - collect data per material
        materials_out_of_stock = {}
        materials_low_stock = {}
        materials_reorder = {}
        
        for branch_qty in BranchQuantity.objects.select_related('raw_material', 'branch').all():
            material = branch_qty.raw_material
            branch = branch_qty.branch
            current_qty = branch_qty.quantity
            
            # Categorize by stock level
            if current_qty <= 0:
                if material.id not in materials_out_of_stock:
                    materials_out_of_stock[material.id] = {'material': material, 'branches': []}
                materials_out_of_stock[material.id]['branches'].append((branch, current_qty))
            elif current_qty <= material.minimum_threshold:
                if material.id not in materials_low_stock:
                    materials_low_stock[material.id] = {'material': material, 'branches': []}
                materials_low_stock[material.id]['branches'].append((branch, current_qty))
            elif current_qty <= material.reorder_level:
                if material.id not in materials_reorder:
                    materials_reorder[material.id] = {'material': material, 'branches': []}
                materials_reorder[material.id]['branches'].append((branch, current_qty))
        
        # Create single alert per material for out of stock
        for material_id, info in materials_out_of_stock.items():
            material = info['material']
            branch_details = ', '.join([f'{branch.name} ({qty} {material.unit})' for branch, qty in info['branches']])
            total_qty = sum([qty for _, qty in info['branches']])
            
            alert, created = StockAlert.objects.update_or_create(
                raw_material=material,
                branch=None,
                alert_type='out_of_stock',
                status='active',
                defaults={
                    'message': f'{material.name} is out of stock. Affected branches: {branch_details}. Please restock immediately.',
                    'current_quantity': total_qty,
                    'threshold_value': material.minimum_threshold,
                }
            )
            if created:
                alerts_created['out_of_stock'] += 1
        
        # Create single alert per material for low stock
        for material_id, info in materials_low_stock.items():
            material = info['material']
            branch_details = ', '.join([f'{branch.name} ({qty} {material.unit})' for branch, qty in info['branches']])
            total_qty = sum([qty for _, qty in info['branches']])
            
            alert, created = StockAlert.objects.update_or_create(
                raw_material=material,
                branch=None,
                alert_type='low_stock',
                status='active',
                defaults={
                    'message': f'{material.name} is running low. Minimum: {material.minimum_threshold} {material.unit}. Affected branches: {branch_details}. Please restock soon.',
                    'current_quantity': total_qty,
                    'threshold_value': material.minimum_threshold,
                }
            )
            if created:
                alerts_created['low_stock'] += 1
        
        # Create single alert per material for reorder level
        for material_id, info in materials_reorder.items():
            material = info['material']
            branch_details = ', '.join([f'{branch.name} ({qty} {material.unit})' for branch, qty in info['branches']])
            total_qty = sum([qty for _, qty in info['branches']])
            
            alert, created = StockAlert.objects.update_or_create(
                raw_material=material,
                branch=None,
                alert_type='reorder',
                status='active',
                defaults={
                    'message': f'{material.name} has reached reorder level. Reorder at: {material.reorder_level} {material.unit}. Affected branches: {branch_details}. Consider placing a purchase order.',
                    'current_quantity': total_qty,
                    'threshold_value': material.reorder_level,
                }
            )
            if created:
                alerts_created['reorder'] += 1
        
        # Resolve stale stock-level alerts
        all_materials_with_stock_issues = set(materials_out_of_stock.keys()) | set(materials_low_stock.keys()) | set(materials_reorder.keys())
        for material in RawMaterial.objects.all():
            if material.id not in all_materials_with_stock_issues:
                StockAlert.objects.filter(
                    raw_material=material,
                    branch=None,
                    alert_type__in=['out_of_stock', 'low_stock', 'reorder'],
                    status='active'
                ).update(status='resolved', resolved_at=timezone.now())
        
        # 2. Check for expired batches (with remaining quantity)
        expired_batches = StockBatch.objects.filter(
            expiry_date__lt=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        materials_with_expired = set()
        for batch in expired_batches:
            batch.is_expired = True
            batch.save()
            materials_with_expired.add(batch.raw_material.id)
        
        # Create single alert per material showing all affected branches
        for material_id in materials_with_expired:
            material = RawMaterial.objects.get(id=material_id)
            from django.db.models import Sum
            total_expired = StockBatch.objects.filter(
                raw_material=material,
                is_expired=True,
                quantity__gt=0
            ).aggregate(total=Sum('quantity'))['total'] or Decimal('0')
            
            # Get all branches that have this material in stock
            branches_with_stock = BranchQuantity.objects.filter(
                raw_material=material,
                quantity__gt=0
            ).select_related('branch')
            
            # Build message with all branches
            if branches_with_stock.count() > 0:
                branch_details = ', '.join([
                    f'{bq.branch.name} ({bq.quantity} {material.unit})'
                    for bq in branches_with_stock
                ])
                
                alert, created = StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=None,  # No specific branch - applies to all
                    alert_type='expired',
                    status='active',
                    defaults={
                        'message': f'{material.name} has expired batches. Total expired: {total_expired} {material.unit}. Affected branches: {branch_details}. Remove from stock immediately.',
                        'current_quantity': total_expired,
                    }
                )
                
                if created:
                    alerts_created['expired'] += 1
        
        # 3. Check for expiring soon (within 2 days, with remaining quantity)
        threshold = today + timedelta(days=2)
        expiring_soon = StockBatch.objects.filter(
            expiry_date__lte=threshold,
            expiry_date__gte=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        materials_expiring = {}
        for batch in expiring_soon:
            material = batch.raw_material
            if material.id not in materials_expiring:
                materials_expiring[material.id] = {
                    'material': material,
                    'earliest_date': batch.expiry_date,
                    'total_qty': Decimal('0'),
                    'days_left': batch.days_until_expiry
                }
            materials_expiring[material.id]['total_qty'] += batch.quantity
            if batch.expiry_date < materials_expiring[material.id]['earliest_date']:
                materials_expiring[material.id]['earliest_date'] = batch.expiry_date
                materials_expiring[material.id]['days_left'] = batch.days_until_expiry
        
        # Create single alert per material showing all affected branches
        for material_id, info in materials_expiring.items():
            material = info['material']
            earliest_date = info['earliest_date']
            total_expiring = info['total_qty']
            days_left = info['days_left']
            
            # Get all branches that have this material in stock
            branches_with_stock = BranchQuantity.objects.filter(
                raw_material=material,
                quantity__gt=0
            ).select_related('branch')
            
            if branches_with_stock.count() > 0:
                branch_details = ', '.join([
                    f'{bq.branch.name} ({bq.quantity} {material.unit})'
                    for bq in branches_with_stock
                ])
                
                alert, created = StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=None,  # No specific branch - applies to all
                    alert_type='expiring_soon',
                    status='active',
                    defaults={
                        'message': f'{material.name}: {total_expiring} {material.unit} expiring soon (earliest: {earliest_date}, {days_left} day{"s" if days_left != 1 else ""} left). Affected branches: {branch_details}. Use soon or plan stock-out.',
                        'current_quantity': total_expiring,
                    }
                )
                if created:
                    alerts_created['expiring_soon'] += 1
        
        return Response({
            'message': 'Automatic stock check completed',
            'alerts_created': alerts_created,
            'total_alerts': sum(alerts_created.values()),
            'active_alerts_count': StockAlert.objects.filter(status='active').count()
        })


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class BranchQuantityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing branch quantities"""
    queryset = BranchQuantity.objects.select_related('branch', 'raw_material').all()
    serializer_class = BranchQuantitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by branch
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        # Filter by raw material
        raw_material_id = self.request.query_params.get('raw_material_id')
        if raw_material_id:
            queryset = queryset.filter(raw_material_id=raw_material_id)
        
        # Filter for low stock items
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            queryset = [bq for bq in queryset if bq.is_low_stock]
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_branch(self, request):
        """Get all quantities for a specific branch"""
        branch_id = request.query_params.get('branch_id')
        if not branch_id:
            return Response(
                {'error': 'branch_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quantities = self.get_queryset().filter(branch_id=branch_id)
        serializer = self.get_serializer(quantities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all low stock items across all branches"""
        all_quantities = self.get_queryset()
        low_stock_items = [bq for bq in all_quantities if bq.is_low_stock]
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)


class MenuItemBranchAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = MenuItemBranchAvailability.objects.select_related("menu_item", "branch").all()
    serializer_class = MenuItemBranchAvailabilitySerializer