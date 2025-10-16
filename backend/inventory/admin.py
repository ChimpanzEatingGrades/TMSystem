# inventory/admin.py
from django.contrib import admin
from .models import RawMaterial, Recipe, RecipeItem, MenuCategory, MenuItem, CustomerOrder, OrderItem, Branch
from .models import MenuItemBranchAvailability

@admin.register(RawMaterial)
class RawMaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "unit", "quantity")
    search_fields = ("name",)


class RecipeItemInline(admin.TabularInline):
    model = RecipeItem
    extra = 1
    autocomplete_fields = ["raw_material"]  # optional; ensure raw_material admin has search_fields


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "yield_quantity", "yield_uom", "created_at")
    search_fields = ("name",)
    inlines = [RecipeItemInline]


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = (
        "id", "name", "picture", "description",
        "recipe", "recipe_id", "category",
        "created_at", "updated_at",
    )
    search_fields = ("name", "description")
    list_filter = ("category",)  # <-- removed "is_active"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price',)


@admin.register(CustomerOrder)
class CustomerOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "status", "total_amount", "order_date", "processed_by_name")
    search_fields = ("customer_name", "customer_phone", "customer_email")
    list_filter = ("status", "order_date", "processed_by")
    readonly_fields = ("order_date", "updated_at", "total_amount")
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'special_requests')
        }),
        ('Order Details', {
            'fields': ('status', 'subtotal', 'tax_amount', 'total_amount', 'order_date', 'updated_at')
        }),
        ('Staff Information', {
            'fields': ('processed_by', 'processed_by_name', 'notes')
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "menu_item", "quantity", "unit_price", "total_price")
    search_fields = ("order__customer_name", "menu_item__name")
    list_filter = ("order__status", "menu_item__category")
    readonly_fields = ('total_price',)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(MenuItemBranchAvailability)
class MenuItemBranchAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("menu_item", "branch", "price", "valid_from", "valid_until", "available_from", "available_to", "is_active")
    list_filter = ("branch", "is_active")
    search_fields = ("menu_item__name", "branch__name")
