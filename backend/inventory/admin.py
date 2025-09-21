# inventory/admin.py
from django.contrib import admin
from .models import RawMaterial, Recipe, RecipeItem, MenuCategory, MenuItem

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
    list_display = ("id", "name", "price", "picture",
            "valid_from", "valid_until", "description",
            "available_from", "available_to",  # <-- ADD THESE
            "recipe", "recipe_id", "category",
            "is_active", "created_at", "updated_at",)
    search_fields = ("name", "description")
    list_filter = ("is_active", "category")
