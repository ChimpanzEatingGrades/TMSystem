# inventory/serializers.py
from django.db import transaction
from rest_framework import serializers
from .models import RawMaterial, Recipe, RecipeItem, MenuCategory, MenuItem

# RawMaterial (read/write)
class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = ["id", "name", "unit", "cost_per_unit", "created_at"]


# RecipeItem serializer: readable nested raw_material, but writes accept raw_material_id
class RecipeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeItem
        fields = ["id", "raw_material", "quantity"]

class RecipeSerializer(serializers.ModelSerializer):
    items = RecipeItemSerializer(many=True, required=False)

    class Meta:
        model = Recipe
        fields = ["id", "name", "description", "yield_quantity", "yield_uom", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        with transaction.atomic():
            recipe = Recipe.objects.create(**validated_data)
            for item in items_data:
                RecipeItem.objects.create(recipe=recipe, **item)
        return recipe

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if items_data is not None:
                instance.items.all().delete()
                for item in items_data:
                    RecipeItem.objects.create(recipe=instance, **item)
        return instance


# MenuCategory serializer
class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ["id", "name"]


# MenuItem serializer: supports image upload (ImageField)
class MenuItemSerializer(serializers.ModelSerializer):
    category = MenuCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=MenuCategory.objects.all(), source="category", write_only=True, allow_null=True, required=False
    )
    recipe = RecipeSerializer(read_only=True)
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(), source="recipe", write_only=True, allow_null=True, required=False
    )
    picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = MenuItem
        fields = [
            "id", "name", "price", "picture",
            "valid_from", "valid_until", "description",
            "recipe", "recipe_id", "category", "category_id",
            "is_active", "created_at", "updated_at",
        ]
