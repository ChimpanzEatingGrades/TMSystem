from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RawMaterialViewSet

router = DefaultRouter()
router.register(r'rawmaterials', RawMaterialViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
