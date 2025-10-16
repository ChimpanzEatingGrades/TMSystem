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
    Branch
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
    # Computed availability based on recipe stock
    is_in_stock = serializers.SerializerMethodField()
    available_portions = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            "id", "name", "price", "picture",
            "valid_from", "valid_until", "description",
            "available_from", "available_to",
            "recipe", "recipe_id", "category", "category_id",
            "is_active", "created_at", "updated_at",
            # Availability
            "is_in_stock", "available_portions",
        ]

    def get_is_in_stock(self, obj):
        portions = self.get_available_portions(obj)
        return portions > 0

    def get_available_portions(self, obj):
        # If no recipe, treat as unlimited stock
        if not obj.recipe:
            return 999999
        # Compute max portions based on limiting ingredient in recipe
        try:
            portions = []
            yield_quantity = obj.recipe.yield_quantity or Decimal('1')
            for recipe_item in obj.recipe.items.all():
                material = recipe_item.raw_material
                if not material or material.quantity is None or recipe_item.quantity is None or yield_quantity == 0:
                    return 0
                # portions = floor(material.quantity / (recipe_item.quantity / yield_quantity))
                required_per_portion = recipe_item.quantity / yield_quantity
                if required_per_portion <= 0:
                    return 0
                portions.append(int(material.quantity // required_per_portion))
            return min(portions) if portions else 0
        except Exception:
            return 0

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
        # Return the full order data including items and calculated fields
        return PurchaseOrderSerializer(instance).data
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        
        # Get the authenticated user
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            encoded_by_user = request.user
            encoded_by_name = request.user.username
        else:
            # Fallback for testing or if no user is authenticated
            encoded_by_user = None
            encoded_by_name = "System"
        
        # Create the purchase order with the encoded_by fields
        purchase_order = PurchaseOrder.objects.create(
            encoded_by=encoded_by_user,
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
        from datetime import timedelta
        from .models import StockBatch
        
        for item in purchase_order.items.all():
            print(f"Processing item: {item.name}, Quantity: {item.quantity}")
            
            # Get shelf_life_days and material_type from the item data if available
            item_shelf_life = getattr(item, 'shelf_life_days', None)
            item_material_type = getattr(item, 'material_type', None) or 'raw'
            
            # Case-insensitive match on name, exact match on unit abbreviation
            material = RawMaterial.objects.filter(
                name__iexact=item.name,
                unit=item.unit.abbreviation,
            ).first()

            if not material:
                # Create new material with the provided shelf life and type
                material = RawMaterial.objects.create(
                    name=item.name.strip(),
                    unit=item.unit.abbreviation,
                    quantity=0,
                    shelf_life_days=item_shelf_life,  # Can be None for supplies
                    material_type=item_material_type
                )
                print(f"Created new material: {material.name} with shelf_life: {material.shelf_life_days} days, type: {material.material_type}")
            
            # Only create batches with expiry dates for perishable items
            if item_shelf_life is not None:
                batch_shelf_life = item_shelf_life
                expiry_date = purchase_order.purchase_date + timedelta(days=batch_shelf_life)
                
                # Create a new stock batch for this purchase with custom shelf life
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
                # For supplies, don't create batch (no expiry tracking)
                print(f"Skipping batch creation for supply item: {material.name} (non-perishable)")
                notes_text = f"Stock in from Purchase Order #{purchase_order.id} (Non-perishable supply item)"
            
            # Add the purchased quantity to existing inventory
            material.quantity += item.quantity
            material.save()
            
            print(f"Material after save - ID: {material.id}, Total Quantity: {material.quantity}")
            
            # Create stock transaction record
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
    """Serializer for stock out operations"""
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
    """Serializer for order items"""
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_description = serializers.CharField(source='menu_item.description', read_only=True)
    menu_item_picture = serializers.ImageField(source='menu_item.picture', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_name', 'menu_item_description', 'menu_item_picture',
            'quantity', 'unit_price', 'total_price', 'special_instructions'
        ]
        # unit_price is computed from MenuItem.price during order creation
        read_only_fields = ['total_price', 'unit_price']

    def validate_menu_item(self, value):
        """Ensure menu item is active"""
        if not value.is_active:
            raise serializers.ValidationError("This menu item is not available")
        return value

    def validate_quantity(self, value):
        """Ensure quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value


class CustomerOrderSerializer(serializers.ModelSerializer):
    """Serializer for customer orders"""
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    processed_by_username = serializers.CharField(source='processed_by.username', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = CustomerOrder
        fields = [
            'id', 'customer_name', 'customer_phone', 'customer_email', 'special_requests',
            'branch', 'branch_name',
            'status', 'status_display', 'subtotal', 'tax_amount', 'total_amount',
            'order_date', 'updated_at', 'processed_by', 'processed_by_username', 
            'processed_by_name', 'notes', 'items'
        ]
        read_only_fields = ['total_amount', 'order_date', 'updated_at']


class CustomerOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating customer orders"""
    items = OrderItemSerializer(many=True, write_only=True)
    
    class Meta:
        model = CustomerOrder
        fields = [
            'customer_name', 'customer_phone', 'customer_email', 'special_requests',
            'branch', 'tax_amount', 'notes', 'items'
        ]
    
    def to_representation(self, instance):
        """Return the full order data including items and calculated fields"""
        return CustomerOrderSerializer(instance).data
    
    def validate_items(self, value):
        """Validate order items"""
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        
        # Check for duplicate menu items
        menu_item_ids = [item['menu_item'].id for item in value]
        if len(menu_item_ids) != len(set(menu_item_ids)):
            raise serializers.ValidationError("Duplicate menu items are not allowed")
        
        return value
    
    def create(self, validated_data):
        """Create order with items"""
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        
        # Calculate subtotal
        subtotal = Decimal('0.00')
        for item_data in items_data:
            menu_item = item_data['menu_item']
            quantity = item_data['quantity']
            unit_price = menu_item.price
            item_data['unit_price'] = unit_price
            subtotal += quantity * unit_price
        
        validated_data['subtotal'] = subtotal
        
        # Get the authenticated user for processing
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            processed_by_user = request.user
            processed_by_name = request.user.username
        else:
            processed_by_user = None
            processed_by_name = "System"
        
        validated_data['processed_by'] = processed_by_user
        validated_data['processed_by_name'] = processed_by_name
        
        # Create the order
        with transaction.atomic():
            order = CustomerOrder.objects.create(**validated_data)
            
            # Create order items
            for item_data in items_data:
                OrderItem.objects.create(order=order, **item_data)
            
            # Update inventory (stock out)
            self.update_inventory(order)
        
        return order
    
    def update_inventory(self, order):
        """Update inventory when order is created"""
        for item in order.items.all():
            if item.menu_item.recipe:
                # Process recipe ingredients
                for recipe_item in item.menu_item.recipe.items.all():
                    # Calculate required quantity based on order quantity
                    required_quantity = (recipe_item.quantity * item.quantity) / item.menu_item.recipe.yield_quantity
                    
                    # Update raw material stock
                    material = recipe_item.raw_material
                    if material.quantity < required_quantity:
                        raise serializers.ValidationError(
                            f"Insufficient stock for {material.name}. "
                            f"Available: {material.quantity} {material.unit}, "
                            f"Required: {required_quantity} {material.unit}"
                        )
                    
                    material.quantity -= required_quantity
                    material.save()
                    
                    # Create stock transaction record
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
    """Serializer for updating order status"""
    
    class Meta:
        model = CustomerOrder
        fields = ['status', 'notes']
    
    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance:
            current_status = self.instance.status
            valid_transitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['preparing', 'cancelled'],
                'preparing': ['ready', 'cancelled'],
                'ready': ['completed'],
                'completed': [],  # Final state
                'cancelled': []    # Final state
            }
            
            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot change status from {current_status} to {value}"
                )
        
        return value


class StockBatchSerializer(serializers.ModelSerializer):
    """Serializer for stock batches"""
    raw_material_name = serializers.CharField(source='raw_material.name', read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = StockBatch
        fields = '__all__'
        read_only_fields = ['expiry_date', 'is_expired', 'created_at']


class StockAlertSerializer(serializers.ModelSerializer):
    """Serializer for stock alerts"""
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