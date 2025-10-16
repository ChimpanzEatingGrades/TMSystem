from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import models
from django.utils import timezone

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
    
    def perform_create(self, serializer):
        """Create material and check for alerts"""
        material = serializer.save()
        self.check_and_create_alerts(material)
    
    def perform_update(self, serializer):
        """Update material and check for alerts"""
        material = serializer.save()
        self.check_and_create_alerts(material)
    
    def check_and_create_alerts(self, material):
        """Check material status and create alerts if needed"""
        from django.utils import timezone
        
        # Check for expired batches (not material itself)
        expired_batches = material.get_expired_batches()
        if expired_batches.exists():
            StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expired',
                status='active',
                defaults={
                    'message': f'{material.name} has {expired_batches.count()} expired batch(es)',
                    'current_quantity': material.quantity,
                }
            )
        
        # Check for expiring soon batches (not material itself)
        expiring_soon = material.get_expiring_soon_batches()
        if expiring_soon.exists():
            oldest_expiring = expiring_soon.first()
            if oldest_expiring:
                StockAlert.objects.get_or_create(
                    raw_material=material,
                    alert_type='expiring_soon',
                    status='active',
                    defaults={
                        'message': f'{material.name} has batch(es) expiring soon (earliest: {oldest_expiring.expiry_date})',
                        'current_quantity': material.quantity,
                    }
                )
        
        # Check for out of stock
        if material.quantity <= 0:
            StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='out_of_stock',
                status='active',
                defaults={
                    'message': f'{material.name} is out of stock',
                    'current_quantity': material.quantity,
                    'threshold_value': material.minimum_threshold,
                }
            )
        
        # Check for low stock
        elif material.is_low_stock:
            StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='low_stock',
                status='active',
                defaults={
                    'message': f'{material.name} is running low. Current: {material.quantity} {material.unit}, Minimum: {material.minimum_threshold} {material.unit}',
                    'current_quantity': material.quantity,
                    'threshold_value': material.minimum_threshold,
                }
            )
        
        # Check for reorder level
        elif material.needs_reorder:
            StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='reorder',
                status='active',
                defaults={
                    'message': f'{material.name} has reached reorder level. Current: {material.quantity} {material.unit}, Reorder Level: {material.reorder_level} {material.unit}',
                    'current_quantity': material.quantity,
                    'threshold_value': material.reorder_level,
                }
            )
    
    @action(detail=False, methods=['get'])
    def low_stock_items(self, request):
        """Get all materials with low stock"""
        low_stock = self.get_queryset().filter(quantity__lte=models.F('minimum_threshold'))
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
        try:
            # Delete in the correct order to handle foreign key constraints
            
            # 1. Delete all stock transactions first
            StockTransaction.objects.all().delete()
            
            # 2. Delete all purchase order items
            from .models import PurchaseOrderItem
            PurchaseOrderItem.objects.all().delete()
            
            # 3. Delete all purchase orders
            PurchaseOrder.objects.all().delete()
            
            # 4. Delete all recipe items (they reference raw materials)
            from .models import RecipeItem
            RecipeItem.objects.all().delete()
            
            # 5. Delete all recipes
            from .models import Recipe
            Recipe.objects.all().delete()
            
            # 6. Delete all menu items (they reference recipes)
            from .models import MenuItem
            MenuItem.objects.all().delete()
            
            # 7. Delete all menu categories
            from .models import MenuCategory
            MenuCategory.objects.all().delete()
            
            # 8. Finally delete all raw materials
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
                    'menu_categories': 'All menu categories deleted'
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
    queryset = StockTransaction.objects.select_related('raw_material', 'performed_by').all()
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
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
    
    @action(detail=False, methods=['post'])
    def stock_out(self, request):
        """Process stock out operation"""
        serializer = StockOutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                material = RawMaterial.objects.get(id=serializer.validated_data['raw_material_id'])
                quantity_needed = serializer.validated_data['quantity']
                notes = serializer.validated_data.get('notes', '')
                force_expired = request.data.get('force_expired', False)  # Allow forcing stock-out of expired items
                
                # Get the authenticated user
                if request.user.is_authenticated:
                    performed_by_user = request.user
                    performed_by_name = request.user.username
                else:
                    performed_by_user = None
                    performed_by_name = "System"
                
                # Check if material has enough total stock
                if material.quantity < quantity_needed:
                    return Response({
                        'error': f'Insufficient stock. Available: {material.quantity} {material.unit}, Needed: {quantity_needed} {material.unit}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if material has batches (perishable tracking)
                all_batches = material.batches.filter(quantity__gt=0).order_by('expiry_date')
                
                # If no batches exist (supplies/non-perishables), simple deduction
                if not all_batches.exists():
                    material.quantity -= quantity_needed
                    material.save()
                    
                    stock_transaction = StockTransaction.objects.create(
                        transaction_type='stock_out',
                        raw_material=material,
                        quantity=quantity_needed,
                        unit=material.unit,
                        reference_number=f"SO-{StockTransaction.objects.count() + 1}",
                        notes=notes or f"Stock out - {quantity_needed} {material.unit} (Non-perishable item, no batch tracking)",
                        performed_by=performed_by_user,
                        performed_by_name=performed_by_name
                    )
                    
                    return Response({
                        'message': 'Stock out successful (non-perishable item)',
                        'transaction': StockTransactionSerializer(stock_transaction).data,
                        'remaining_stock': material.quantity
                    }, status=status.HTTP_201_CREATED)
                
                # For items with batches, use FIFO logic
                remaining_quantity = quantity_needed
                batches_used = []
                expired_batches_found = []
                
                # Determine which batches to use
                if force_expired:
                    # Use expired batches when explicitly forced (for disposal)
                    batches_to_use = all_batches.filter(is_expired=True).order_by('expiry_date')
                else:
                    # Use non-expired batches (normal FIFO)
                    batches_to_use = all_batches.filter(is_expired=False).order_by('expiry_date')
                    # Track expired batches for warning
                    expired_batches = all_batches.filter(is_expired=True)
                    for batch in expired_batches:
                        expired_batches_found.append({
                            'batch_id': batch.id,
                            'quantity': float(batch.quantity),
                            'expiry_date': str(batch.expiry_date)
                        })
                
                # Process batches using FIFO
                for batch in batches_to_use:
                    if remaining_quantity <= 0:
                        break
                    
                    if batch.quantity >= remaining_quantity:
                        # This batch has enough
                        batch.quantity -= remaining_quantity
                        batches_used.append({
                            'batch_id': batch.id,
                            'quantity_used': float(remaining_quantity),
                            'expiry_date': str(batch.expiry_date),
                            'was_expired': batch.is_expired
                        })
                        remaining_quantity = 0
                        batch.save()
                    else:
                        # Use all of this batch and continue
                        quantity_from_batch = batch.quantity
                        batches_used.append({
                            'batch_id': batch.id,
                            'quantity_used': float(quantity_from_batch),
                            'expiry_date': str(batch.expiry_date),
                            'was_expired': batch.is_expired
                        })
                        remaining_quantity -= quantity_from_batch
                        batch.quantity = 0
                        batch.save()
                
                # If still insufficient stock after using available batches
                if remaining_quantity > 0:
                    if not force_expired and expired_batches_found:
                        # Suggest using expired batches
                        return Response({
                            'error': f'Insufficient non-expired stock. Needed: {quantity_needed} {material.unit}, Available (non-expired): {quantity_needed - remaining_quantity} {material.unit}',
                            'expired_batches': expired_batches_found,
                            'suggestion': 'Use force_expired=true to stock out expired batches for disposal'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        return Response({
                            'error': f'Insufficient stock. Needed: {quantity_needed} {material.unit}, Available: {quantity_needed - remaining_quantity} {material.unit}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # Update material total quantity
                material.quantity -= quantity_needed
                material.save()
                
                # Create stock transaction with batch details
                if batches_used:
                    batch_type = "expired" if force_expired else "FIFO"
                    batch_details = ', '.join([
                        f"Batch #{b['batch_id']} ({b['quantity_used']} {material.unit}, {'expired' if b['was_expired'] else 'expires'} {b['expiry_date']})"
                        for b in batches_used
                    ])
                    transaction_notes = notes or f"Stock out - {quantity_needed} {material.unit}. {batch_type} batches used: {batch_details}"
                else:
                    transaction_notes = notes or f"Stock out - {quantity_needed} {material.unit}"
                
                stock_transaction = StockTransaction.objects.create(
                    transaction_type='stock_out',
                    raw_material=material,
                    quantity=quantity_needed,
                    unit=material.unit,
                    reference_number=f"SO-{StockTransaction.objects.count() + 1}",
                    notes=transaction_notes,
                    performed_by=performed_by_user,
                    performed_by_name=performed_by_name
                )
                
                # Create/update alerts for remaining expired batches if any
                if not force_expired and expired_batches_found:
                    total_expired = sum(b['quantity'] for b in expired_batches_found)
                    StockAlert.objects.get_or_create(
                        raw_material=material,
                        alert_type='expired',
                        status='active',
                        defaults={
                            'message': f'{material.name} has {len(expired_batches_found)} expired batch(es) totaling {total_expired} {material.unit}. Please stock out for disposal.',
                            'current_quantity': material.quantity,
                        }
                    )
                elif force_expired and not expired_batches_found:
                    # Resolve expired alerts if all expired stock is removed
                    StockAlert.objects.filter(
                        raw_material=material,
                        alert_type='expired',
                        status='active'
                    ).update(status='resolved', resolved_at=timezone.now())
                
                return Response({
                    'message': f'Stock out successful ({batch_type if batches_used else "non-perishable"})',
                    'transaction': StockTransactionSerializer(stock_transaction).data,
                    'remaining_stock': material.quantity,
                    'batches_used': batches_used,
                    'expired_batches_remaining': len(expired_batches_found) if not force_expired else 0
                }, status=status.HTTP_201_CREATED)
                
            except RawMaterial.DoesNotExist:
                return Response(
                    {'error': 'Raw material not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def available_materials(self, request):
        """Get list of materials with available stock"""
        materials = RawMaterial.objects.filter(quantity__gt=0).order_by('name')
        serializer = RawMaterialSerializer(materials, many=True)
        return Response(serializer.data)


# -------------------
# Customer Order Views
# -------------------

class CustomerOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for customer order management"""
    queryset = CustomerOrder.objects.prefetch_related('items__menu_item').all()
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
        
        stats = {
            'total_orders': CustomerOrder.objects.count(),
            'today_orders': CustomerOrder.objects.filter(order_date__date=today).count(),
            'pending_orders': CustomerOrder.objects.filter(status='pending').count(),
            'preparing_orders': CustomerOrder.objects.filter(status='preparing').count(),
            'ready_orders': CustomerOrder.objects.filter(status='ready').count(),
            'today_revenue': CustomerOrder.objects.filter(
                order_date__date=today, 
                status__in=['completed', 'ready']
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'status_breakdown': CustomerOrder.objects.values('status').annotate(
                count=Count('id')
            ).order_by('status')
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
            
            alert, created = StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expiring_soon',
                status='active',
                defaults={
                    'message': f'{material.name} batch expiring on {batch.expiry_date} ({batch.days_until_expiry} days). Quantity: {batch.quantity} {material.unit}. Use soon or plan stock-out.',
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
<<<<<<< HEAD
    
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
            
            alert, created = StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expiring_soon',
                status='active',
                defaults={
                    'message': f'{material.name} batch expiring on {batch.expiry_date} ({batch.days_until_expiry} days). Quantity: {batch.quantity} {material.unit}. Use soon or plan stock-out.',
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
=======


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
>>>>>>> 87df2650c40a73d5111730c16f05b90addb7cc56
