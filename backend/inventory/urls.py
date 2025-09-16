from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RawMaterialViewSet, UnitOfMeasurementViewSet, PurchaseOrderViewSet

router = DefaultRouter()
router.register(r'rawmaterials', RawMaterialViewSet)
router.register(r'units', UnitOfMeasurementViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
