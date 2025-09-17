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


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "test"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    def create(self, request, *args, **kwargs):
        try:
            print(f"Received purchase order data: {request.data}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Error creating purchase order: {e}")
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
