from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RawMaterialViewSet, 
    UnitOfMeasurementViewSet, 
    PurchaseOrderViewSet, 
    MenuCategoryViewSet, 
    RecipeViewSet, 
    MenuItemViewSet, 
    StockTransactionViewSet, 
    StockOutViewSet, 
    CustomerOrderViewSet,
    StockAlertViewSet,
    BranchViewSet,
    BranchQuantityViewSet,
    MenuItemBranchAvailabilityViewSet
)
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
router.register(r'customer-orders', CustomerOrderViewSet, basename='customer-order')
router.register(r'stock-alerts', StockAlertViewSet, basename='stock-alert')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'branch-quantities', BranchQuantityViewSet, basename='branch-quantity')
router.register(r'menuitem-branch-availability', MenuItemBranchAvailabilityViewSet, basename='menuitem-branch-availability')

urlpatterns = router.urls
# ...add other urlpatterns as needed...
