from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RawMaterial, UnitOfMeasurement, PurchaseOrder, PurchaseOrderItem
from .serializers import (
    RawMaterialSerializer, 
    UnitOfMeasurementSerializer, 
    PurchaseOrderSerializer, 
    PurchaseOrderCreateSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny

class UnitOfMeasurementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing units of measurement.
    """
    queryset = UnitOfMeasurement.objects.all()
    serializer_class = UnitOfMeasurementSerializer
    permission_classes = [IsAuthenticated]

class RawMaterialViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing, creating, updating, and deleting raw materials.
    """
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated]

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing purchase orders.
    """
    queryset = PurchaseOrder.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Allow unauthenticated create (stock-in) while protecting reads/updates."""
        if self.action in ["create", "test"]:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
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
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent purchase orders"""
        recent_orders = self.get_queryset()[:10]
        serializer = self.get_serializer(recent_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def test(self, request):
        """Test endpoint to verify backend is working"""
        return Response({
            "message": "Backend is working",
            "received_data": request.data,
            "user": str(request.user) if request.user.is_authenticated else "Anonymous"
        })  