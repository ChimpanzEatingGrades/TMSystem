# inventory/serializers.py
from django.db import transaction
from rest_framework import serializers
from decimal import Decimal
from .models import RawMaterial, Recipe, RecipeItem, MenuCategory, MenuItem, UnitOfMeasurement, PurchaseOrder, PurchaseOrderItem, StockTransaction

class UnitOfMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasurement
        fields = "__all__"

# RawMaterial (read/write)
class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = ["id", "name", "unit", "quantity", "created_at"]

    def validate_name(self, value: str):
        # Enforce case-insensitive uniqueness for name
        name = value.strip()
        qs = RawMaterial.objects.filter(name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Raw material with this name already exists (case-insensitive).")
        return name


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

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    unit_abbreviation = serializers.CharField(source='unit.abbreviation', read_only=True)
    # Accept either a unit ID or an abbreviation string for input
    unit = serializers.PrimaryKeyRelatedField(queryset=UnitOfMeasurement.objects.all())
    # These are computed/server-supplied
    purchase_order = serializers.PrimaryKeyRelatedField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = PurchaseOrderItem
        fields = "__all__"

    def to_internal_value(self, data):
        """Allow unit to be provided as id or abbreviation; coerce numbers as needed."""
        mutable = dict(data)
        # Coerce unit if provided as abbreviation
        unit_value = mutable.get('unit')
        if isinstance(unit_value, str):
            try:
                # if it's numeric in string form, let DRF handle it
                int(unit_value)
            except ValueError:
                # treat as abbreviation
                try:
                    unit_obj = UnitOfMeasurement.objects.get(abbreviation=unit_value)
                    mutable['unit'] = unit_obj.pk
                except UnitOfMeasurement.DoesNotExist:
                    raise serializers.ValidationError({
                        'unit': f"Unknown unit abbreviation '{unit_value}'"
                    })
        # total_price is computed in model save; no need to pass it from client
        return super().to_internal_value(mutable)

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.ReadOnlyField()
    encoded_by_username = serializers.CharField(source='encoded_by.username', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = "__all__"

class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, write_only=True)
    encoded_by = serializers.CharField(
        max_length=150, 
        required=True, 
        allow_blank=False,
        help_text="Name of the person who encoded this purchase order"
    )
    
    class Meta:
        model = PurchaseOrder
        fields = ['purchase_date', 'notes', 'encoded_by', 'items']
    
    def validate_encoded_by(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Encoded by field is required and cannot be empty")
        return value.strip()
    
    def to_representation(self, instance):
        # Return the full order data including items and calculated fields
        return PurchaseOrderSerializer(instance).data
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        encoded_by_name = validated_data.pop('encoded_by')
        
        # Create the purchase order with the encoded_by_name field
        purchase_order = PurchaseOrder.objects.create(
            encoded_by_name=encoded_by_name,
            **validated_data
        )
        
        # items_data is already validated (internal) at this point.
        # Create items directly to avoid double-validation errors on 'unit'.
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item)
        
        # Update inventory automatically
        self.update_inventory(purchase_order)
        
        return purchase_order
    
    def validate(self, data):
        print(f"Validating purchase order data: {data}")
        return data
    
    def update_inventory(self, purchase_order):
        """Automatically update inventory when a purchase order is created"""
        for item in purchase_order.items.all():
            # Case-insensitive match on name, exact match on unit abbreviation
            material = RawMaterial.objects.filter(
                name__iexact=item.name,
                unit=item.unit.abbreviation,
            ).first()

            if not material:
                # Create new material, preserve provided casing
                material = RawMaterial.objects.create(
                    name=item.name.strip(),
                    unit=item.unit.abbreviation,
                    quantity=0
                )
            
            # Add the purchased quantity to existing inventory
            material.quantity += item.quantity
            material.save()
            
            # Create stock transaction record
            StockTransaction.objects.create(
                transaction_type='stock_in',
                raw_material=material,
                quantity=item.quantity,
                unit=item.unit.abbreviation,
                reference_number=f"PO-{purchase_order.id}",
                notes=f"Stock in from Purchase Order #{purchase_order.id}",
                performed_by_name=purchase_order.encoded_by_name
            )
            
            print(f"Updated inventory: {material.name} - Added {item.quantity} {item.unit.abbreviation}")


class StockTransactionSerializer(serializers.ModelSerializer):
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = StockTransaction
        fields = "__all__"
        read_only_fields = ['created_at']


class StockOutSerializer(serializers.Serializer):
    """Serializer for stock out operations"""
    raw_material_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=Decimal('0.0001'))
    performed_by = serializers.CharField(max_length=150, required=True, help_text="Name of the person who performed this stock out")
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_raw_material_id(self, value):
        try:
            material = RawMaterial.objects.get(id=value)
            return value
        except RawMaterial.DoesNotExist:
            raise serializers.ValidationError("Raw material not found")
    
    def validate_quantity(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value
    
    def validate(self, data):
        material = RawMaterial.objects.get(id=data['raw_material_id'])
        if material.quantity < data['quantity']:
            raise serializers.ValidationError(
                f"Insufficient stock. Available: {material.quantity} {material.unit}, Requested: {data['quantity']} {material.unit}"
            )
        return data
