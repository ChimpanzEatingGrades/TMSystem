from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RawMaterialViewSet, UnitOfMeasurementViewSet, PurchaseOrderViewSet, MenuCategoryViewSet, RecipeViewSet, MenuItemViewSet, StockTransactionViewSet, StockOutViewSet
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'rawmaterials', RawMaterialViewSet)
router.register(r"categories", MenuCategoryViewSet, basename="menu-category")
router.register(r"recipes", RecipeViewSet, basename="recipe")
router.register(r"menu-items", MenuItemViewSet, basename="menuitem")
router.register(r'units', UnitOfMeasurementViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'stock-transactions', StockTransactionViewSet)
router.register(r'stock-out', StockOutViewSet, basename='stock-out')

urlpatterns = [
    path("", include(router.urls)),
]  

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
