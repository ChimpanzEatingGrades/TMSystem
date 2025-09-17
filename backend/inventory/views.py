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
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated]  