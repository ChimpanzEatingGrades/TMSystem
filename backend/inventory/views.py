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
