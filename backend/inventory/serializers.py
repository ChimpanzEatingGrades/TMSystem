# inventory/serializers.py
from django.db import transaction
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import (
    RawMaterial, 
    Recipe, 
    RecipeItem, 
    MenuCategory, 
    MenuItem, 
    UnitOfMeasurement, 
    PurchaseOrder, 
    PurchaseOrderItem, 
    StockTransaction, 
    CustomerOrder, 
    OrderItem,
    StockAlert,
    StockBatch,
    Branch,
    MenuItemBranchAvailability
)

class UnitOfMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasurement
        fields = "__all__"

# RawMaterial (read/write)
class RawMaterialSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    needs_reorder = serializers.BooleanField(read_only=True)
    expired_batches_count = serializers.SerializerMethodField()
    expiring_soon_count = serializers.SerializerMethodField()
    oldest_batch_expiry = serializers.SerializerMethodField()
    material_type_display = serializers.CharField(source='get_material_type_display', read_only=True)
    is_raw_material = serializers.BooleanField(read_only=True)
    is_processed = serializers.BooleanField(read_only=True)
    is_supplies = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = RawMaterial
        fields = [
            "id", "name", "unit", "material_type", "material_type_display", 
            "quantity", "created_at", "updated_at",
            "minimum_threshold", "reorder_level", "shelf_life_days",
            "is_low_stock", "needs_reorder", "is_raw_material", "is_processed", "is_supplies",
            "expired_batches_count", "expiring_soon_count", "oldest_batch_expiry"
        ]
    
    def get_expired_batches_count(self, obj):
        return obj.get_expired_batches().count()
    
    def get_expiring_soon_count(self, obj):
        return obj.get_expiring_soon_batches().count()
    
    def get_oldest_batch_expiry(self, obj):
        oldest = obj.batches.filter(quantity__gt=0).order_by('expiry_date').first()
        return oldest.expiry_date if oldest else None

    def validate_name(self, value: str):
        # Enforce case-insensitive uniqueness for name
        name = value.strip()
        qs = RawMaterial.objects.filter(name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Raw material with this name already exists (case-insensitive).")
        return name
    
    def validate_shelf_life_days(self, value):
        """Validate shelf life - allow None for supplies"""
        # If it's None, that's okay (for supplies)
        if value is None:
            return value
        
        # If provided, must be positive
        if value <= 0:
            raise serializers.ValidationError("Shelf life must be at least 1 day")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        material_type = data.get('material_type') or (self.instance.material_type if self.instance else 'raw')
        shelf_life = data.get('shelf_life_days')
        
        # Supplies should not have shelf life
        if material_type == 'supplies' and shelf_life is not None:
            data['shelf_life_days'] = None
        
        # Other types should have shelf life (set defaults if missing)
        elif material_type != 'supplies' and shelf_life is None:
            if material_type == 'raw':
                data['shelf_life_days'] = 7
            elif material_type == 'processed':
                data['shelf_life_days'] = 180
            elif material_type == 'semi_processed':
                data['shelf_life_days'] = 14
        
        return data

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
        fields = ["id", "name"]  # Only id and name


# MenuItem serializer: supports image upload (ImageField)
class MenuItemBranchAvailabilitySerializer(serializers.ModelSerializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())

    class Meta:
        model = MenuItemBranchAvailability
        fields = [
            "id", "menu_item", "branch",
            "valid_from", "valid_until",
            "available_from", "available_to",
            "is_active",
        ]

class MenuItemSerializer(serializers.ModelSerializer):
    branch_availability = MenuItemBranchAvailabilitySerializer(many=True, read_only=True)
    recipe = RecipeSerializer(read_only=True)
    recipe_id = serializers.PrimaryKeyRelatedField(
        source='recipe',
        queryset=Recipe.objects.all(),
        write_only=True,
        required=False
    )


    class Meta:
        model = MenuItem
        fields = [
            "id", "name", "price", "picture", "description",
            "recipe", "recipe_id", "category", "created_at", "updated_at",
            "branch_availability"
        ]

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    unit_abbreviation = serializers.CharField(source='unit.abbreviation', read_only=True)
    # Accept either a unit ID or an abbreviation string for input
    unit = serializers.PrimaryKeyRelatedField(queryset=UnitOfMeasurement.objects.all())
    # These are computed/server-supplied
    purchase_order = serializers.PrimaryKeyRelatedField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    shelf_life_days = serializers.IntegerField(required=False, allow_null=True)  # Allow null
    material_type = serializers.CharField(required=False, default='raw')
    
    class Meta:
        model = PurchaseOrderItem
        fields = "__all__"

    def to_internal_value(self, data):
        """Allow unit to be provided as id or abbreviation; coerce numbers as needed."""
        mutable = dict(data)
        
        # Handle expiry_date - convert empty string to None
        if 'expiry_date' in mutable and (mutable['expiry_date'] == '' or mutable['expiry_date'] == 'null'):
            mutable['expiry_date'] = None
        
        # Handle shelf_life_days - allow None for supplies
        material_type = mutable.get('material_type', 'raw')
        if material_type == 'supplies':
            mutable['shelf_life_days'] = None
        elif 'shelf_life_days' not in mutable or not mutable['shelf_life_days']:
            # Set defaults based on type
            if material_type == 'raw':
                mutable['shelf_life_days'] = 7
            elif material_type == 'processed':
                mutable['shelf_life_days'] = 180
            elif material_type == 'semi_processed':
                mutable['shelf_life_days'] = 14
        
        # Coerce unit if provided as abbreviation
        unit_value = mutable.get('unit')
        if isinstance(unit_value, str):
            try:
                int(unit_value)
            except ValueError:
                try:
                    unit_obj = UnitOfMeasurement.objects.get(abbreviation=unit_value)
                    mutable['unit'] = unit_obj.pk
                except UnitOfMeasurement.DoesNotExist:
                    raise serializers.ValidationError({
                        'unit': f"Unknown unit abbreviation '{unit_value}'"
                    })
        return super().to_internal_value(mutable)
    
    def validate_shelf_life_days(self, value):
        """Validate shelf life is positive or None"""
        if value is None:
            return None  # Allowed for supplies
        if value <= 0:
            raise serializers.ValidationError("Shelf life must be at least 1 day")
        return value

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.ReadOnlyField()
    encoded_by_username = serializers.CharField(source='encoded_by.username', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = "__all__"

class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, write_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = ['purchase_date', 'notes', 'items']
    
    def to_representation(self, instance):
        return PurchaseOrderSerializer(instance).data
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            encoded_by_user = request.user
            encoded_by_name = request.user.username
        else:
            encoded_by_user = None
            encoded_by_name = "System"
        
        purchase_order = PurchaseOrder.objects.create(
            encoded_by=encoded_by_user,
            encoded_by_name=encoded_by_name,
            **validated_data
        )
        
        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item)
        
        self.update_inventory(purchase_order)
        
        return purchase_order
    
    def validate(self, data):
        print(f"Validating purchase order data: {data}")
        return data
    
    def update_inventory(self, purchase_order):
        from datetime import timedelta
        from .models import StockBatch
        
        for item in purchase_order.items.all():
            print(f"Processing item: {item.name}, Quantity: {item.quantity}")
            
            item_shelf_life = getattr(item, 'shelf_life_days', None)
            item_material_type = getattr(item, 'material_type', None) or 'raw'
            
            material = RawMaterial.objects.filter(
                name__iexact=item.name,
                unit=item.unit.abbreviation,
            ).first()

            if not material:
                material = RawMaterial.objects.create(
                    name=item.name.strip(),
                    unit=item.unit.abbreviation,
                    quantity=0,
                    shelf_life_days=item_shelf_life,
                    material_type=item_material_type
                )
                print(f"Created new material: {material.name} with shelf_life: {material.shelf_life_days} days, type: {material.material_type}")
            
            if item_shelf_life is not None:
                batch_shelf_life = item_shelf_life
                expiry_date = purchase_order.purchase_date + timedelta(days=batch_shelf_life)
                
                batch = StockBatch.objects.create(
                    raw_material=material,
                    purchase_order=purchase_order,
                    quantity=item.quantity,
                    purchase_date=purchase_order.purchase_date,
                    expiry_date=expiry_date
                )
                print(f"Created batch: {batch.quantity} {material.unit} of {material.name}, expires on {expiry_date} ({batch_shelf_life} days shelf life)")
                notes_text = f"Stock in from Purchase Order #{purchase_order.id} (Batch expires: {expiry_date}, {batch_shelf_life} day shelf life)"
            else:
                print(f"Skipping batch creation for supply item: {material.name} (non-perishable)")
                notes_text = f"Stock in from Purchase Order #{purchase_order.id} (Non-perishable supply item)"
            
            material.quantity += item.quantity
            material.save()
            
            print(f"Material after save - ID: {material.id}, Total Quantity: {material.quantity}")
            
            StockTransaction.objects.create(
                transaction_type='stock_in',
                raw_material=material,
                quantity=item.quantity,
                unit=item.unit.abbreviation,
                reference_number=f"PO-{purchase_order.id}",
                notes=notes_text,
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
    raw_material_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=Decimal('0.0001'))
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


# Customer Order Serializers
class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_description = serializers.CharField(source='menu_item.description', read_only=True)
    menu_item_picture = serializers.ImageField(source='menu_item.picture', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_name', 'menu_item_description', 'menu_item_picture',
            'quantity', 'unit_price', 'total_price', 'special_instructions'
        ]
        read_only_fields = ['total_price', 'unit_price']

    def validate_menu_item(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This menu item is not available")
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value


class CustomerOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    processed_by_username = serializers.CharField(source='processed_by.username', read_only=True)
    
    class Meta:
        model = CustomerOrder
        fields = [
            'id', 'customer_name', 'customer_phone', 'customer_email', 'special_requests',
            'status', 'status_display', 'subtotal', 'tax_amount', 'total_amount',
            'order_date', 'updated_at', 'processed_by', 'processed_by_username', 
            'processed_by_name', 'notes', 'items'
        ]
        read_only_fields = ['total_amount', 'order_date', 'updated_at']


class CustomerOrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, write_only=True)
    
    class Meta:
        model = CustomerOrder
        fields = [
            'customer_name', 'customer_phone', 'customer_email', 'special_requests',
            'tax_amount', 'notes', 'items'
        ]
    
    def to_representation(self, instance):
        return CustomerOrderSerializer(instance).data
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        
        menu_item_ids = [item['menu_item'].id for item in value]
        if len(menu_item_ids) != len(set(menu_item_ids)):
            raise serializers.ValidationError("Duplicate menu items are not allowed")
        
        return value
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        
        subtotal = Decimal('0.00')
        for item_data in items_data:
            menu_item = item_data['menu_item']
            quantity = item_data['quantity']
            unit_price = menu_item.price
            item_data['unit_price'] = unit_price
            subtotal += quantity * unit_price
        
        validated_data['subtotal'] = subtotal
        
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            processed_by_user = request.user
            processed_by_name = request.user.username
        else:
            processed_by_user = None
            processed_by_name = "System"
        
        validated_data['processed_by'] = processed_by_user
        validated_data['processed_by_name'] = processed_by_name
        
        with transaction.atomic():
            order = CustomerOrder.objects.create(**validated_data)
            
            for item_data in items_data:
                OrderItem.objects.create(order=order, **item_data)
            
            self.update_inventory(order)
        
        return order
    
    def update_inventory(self, order):
        for item in order.items.all():
            if item.menu_item.recipe:
                for recipe_item in item.menu_item.recipe.items.all():
                    required_quantity = (recipe_item.quantity * item.quantity) / item.menu_item.recipe.yield_quantity
                    
                    material = recipe_item.raw_material
                    if material.quantity < required_quantity:
                        raise serializers.ValidationError(
                            f"Insufficient stock for {material.name}. "
                            f"Available: {material.quantity} {material.unit}, "
                            f"Required: {required_quantity} {material.unit}"
                        )
                    
                    material.quantity -= required_quantity
                    material.save()
                    
                    StockTransaction.objects.create(
                        transaction_type='stock_out',
                        raw_material=material,
                        quantity=required_quantity,
                        unit=material.unit,
                        reference_number=f"ORDER-{order.id}",
                        notes=f"Stock out for Order #{order.id} - {item.menu_item.name}",
                        performed_by_name=order.processed_by_name or "System"
                    )


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerOrder
        fields = ['status', 'notes']
    
    def validate_status(self, value):
        if self.instance:
            current_status = self.instance.status
            valid_transitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['preparing', 'cancelled'],
                'preparing': ['ready', 'cancelled'],
                'ready': ['completed'],
                'completed': [],
                'cancelled': []
            }
            
            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from {current_status} to {value}"
                )
        
        return value


class StockBatchSerializer(serializers.ModelSerializer):
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = StockBatch
        fields = '__all__'
        read_only_fields = ['expiry_date', 'is_expired', 'created_at']


class StockAlertSerializer(serializers.ModelSerializer):
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    raw_material_unit = serializers.CharField(source='raw_material.unit', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    acknowledged_by_username = serializers.CharField(source='acknowledged_by.username', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'acknowledged_at', 'resolved_at']

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name"]

class MenuItemBranchAvailabilitySerializer(serializers.ModelSerializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())

    class Meta:
        model = MenuItemBranchAvailability
        fields = [
            "id", "menu_item", "branch",
            "valid_from", "valid_until",
            "available_from", "available_to",
            "is_active",
        ]