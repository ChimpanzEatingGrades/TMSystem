from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

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
                quantity = serializer.validated_data['quantity']
                notes = serializer.validated_data.get('notes', '')
                
                # Get the authenticated user
                if request.user.is_authenticated:
                    performed_by_user = request.user
                    performed_by_name = request.user.username
                else:
                    performed_by_user = None
                    performed_by_name = "System"
                
                # Update material quantity
                material.quantity -= quantity
                material.save()
                
                # Create stock transaction record
                stock_transaction = StockTransaction.objects.create(
                    transaction_type='stock_out',
                    raw_material=material,
                    quantity=quantity,
                    unit=material.unit,
                    reference_number=f"SO-{StockTransaction.objects.count() + 1}",
                    notes=notes or f"Stock out - {quantity} {material.unit}",
                    performed_by=performed_by_user,
                    performed_by_name=performed_by_name
                )
                
                return Response({
                    'message': 'Stock out successful',
                    'transaction': StockTransactionSerializer(stock_transaction).data,
                    'remaining_stock': material.quantity
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
