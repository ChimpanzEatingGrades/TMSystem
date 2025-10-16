from decimal import Decimal
from django.db import models
from django.db.models.functions import Lower
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.utils import timezone

class UnitOfMeasurement(models.Model):
    """Model for managing units of measurement"""
    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.abbreviation})"

    class Meta:
        ordering = ["name"]


class RawMaterial(models.Model):
    """Model for raw ingredients/materials in inventory"""
    
    MATERIAL_TYPES = [
        ('raw', 'Raw Material'),           # Needs processing (meat, vegetables, flour)
        ('processed', 'Processed Good'),   # Ready to use (sodas, condiments, canned goods)
        ('semi_processed', 'Semi-Processed'), # Partially processed (ground meat, chopped vegetables)
        ('supplies', 'Supplies & Utensils'),  # Non-consumable items (spoons, gloves, napkins, containers)
    ]
    
    name = models.CharField(max_length=150, unique=True)
    unit = models.CharField(max_length=50)  # e.g. "g", "ml", "pcs"
    material_type = models.CharField(
        max_length=20,
        choices=MATERIAL_TYPES,
        default='raw',
        help_text="Type of material - raw, processed, semi-processed, or supplies"
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal("0.000"),
        validators=[MinValueValidator(Decimal("0.000"))],
        help_text="Current stock quantity"
    )
    # New fields for stock management
    minimum_threshold = models.DecimalField(
        max_digits=12, 
        decimal_places=3, 
        default=10,
        help_text="Minimum quantity before low stock alert"
    )
    reorder_level = models.DecimalField(
        max_digits=12, 
        decimal_places=3, 
        default=20,
        help_text="Quantity level to trigger reorder"
    )
    shelf_life_days = models.PositiveIntegerField(
        null=True,  # Allow null for supplies/utensils
        blank=True,  # Allow blank in forms
        help_text="Number of days this material stays fresh after purchase. Leave empty for non-perishable items."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit}) - {self.get_material_type_display()}"

    class Meta:
        ordering = ["name"]
        constraints = [
            # Enforce case-insensitive uniqueness on name
            models.UniqueConstraint(
                Lower("name"), name="uniq_rawmaterial_name_ci"
            )
        ]

    @property
    def is_low_stock(self):
        """Check if stock is below minimum threshold"""
        return self.quantity <= self.minimum_threshold
    
    @property
    def needs_reorder(self):
        """Check if stock needs reordering"""
        return self.quantity <= self.reorder_level
    
    @property
    def is_raw_material(self):
        """Check if this is a raw material"""
        return self.material_type == 'raw'
    
    @property
    def is_processed(self):
        """Check if this is a processed good"""
        return self.material_type == 'processed'
    
    @property
    def is_supplies(self):
        """Check if this is a supply item"""
        return self.material_type == 'supplies'
    
    def get_expired_batches(self):
        """Get all expired batches for this material"""
        from django.utils import timezone
        return self.batches.filter(expiry_date__lt=timezone.now().date())
    
    def get_expiring_soon_batches(self):
        """Get batches expiring within 2 days"""
        from django.utils import timezone
        from datetime import timedelta
        threshold = timezone.now().date() + timedelta(days=2)
        return self.batches.filter(
            expiry_date__lte=threshold,
            expiry_date__gte=timezone.now().date()
        )
    
    def save(self, *args, **kwargs):
        # Auto-set shelf_life_days to None for supplies
        if self.material_type == 'supplies':
            self.shelf_life_days = None
        # Set default shelf life for other types if not provided
        elif self.shelf_life_days is None:
            if self.material_type == 'raw':
                self.shelf_life_days = 7  # Default for raw materials
            elif self.material_type == 'processed':
                self.shelf_life_days = 180  # Default for processed (6 months)
            elif self.material_type == 'semi_processed':
                self.shelf_life_days = 14  # Default for semi-processed
        
        super().save(*args, **kwargs)


class Recipe(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    yield_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=Decimal("1.000"),
        validators=[MinValueValidator(Decimal("0.0001"))],
    )
    yield_uom = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class RecipeItem(models.Model):
    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name="items"
    )
    raw_material = models.ForeignKey(
        RawMaterial, on_delete=models.PROTECT, related_name="recipe_items"
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.0001"))],
    )

    class Meta:
        verbose_name = "Recipe Item"
        verbose_name_plural = "Recipe Items"
        unique_together = ("recipe", "raw_material")

    def __str__(self):
        return f"{self.quantity} {self.raw_material.unit} {self.raw_material.name} for {self.recipe.name}"

class MenuCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)

    class Meta:
        verbose_name_plural = "Menu Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    name = models.CharField(max_length=150)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    picture = models.ImageField(upload_to="menu_items/", null=True, blank=True)

    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)

    available_from = models.TimeField(null=True, blank=True)
    available_to = models.TimeField(null=True, blank=True)

    description = models.TextField(blank=True)

    recipe = models.ForeignKey(
        Recipe, on_delete=models.SET_NULL, null=True, blank=True, related_name="menu_items"
    )
    category = models.ForeignKey(
        MenuCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="menu_items"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self):
        return self.name

    def clean(self):
        """Ensure valid_until is not earlier than valid_from"""
        if self.valid_from and self.valid_until and self.valid_until < self.valid_from:
            raise ValidationError(
                {"valid_until": "valid_until must be on or after valid_from"}
            )


class PurchaseOrder(models.Model):
    """Model for purchase orders/tickets"""
    purchase_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    encoded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='purchase_orders',
        help_text="User who created this purchase order"
    )
    encoded_by_name = models.CharField(
        max_length=150, 
        blank=True, 
        null=True,
        help_text="Name of the person who encoded this purchase order"
    )

    def __str__(self):
        return f"Purchase Order #{self.id} - {self.purchase_date}"

    @property
    def total_amount(self):
        return sum(item.total_price for item in self.items.all())

    class Meta:
        ordering = ["-purchase_date", "-created_at"]


class PurchaseOrderItem(models.Model):
    """Model for individual items in a purchase order"""
    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items"
    )
    name = models.CharField(max_length=100)
    unit = models.ForeignKey(UnitOfMeasurement, on_delete=models.CASCADE)
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    total_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Expiration date of this item"
    )
    shelf_life_days = models.PositiveIntegerField(
        null=True,  # Add this
        blank=True,  # Add this
        help_text="Shelf life in days for this specific purchase batch"
    )
    material_type = models.CharField(
        max_length=20,
        default='raw',
        help_text="Type of material for new materials"
    )

    def save(self, *args, **kwargs):
        # Calculate total price automatically
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit.abbreviation})"


class StockTransaction(models.Model):
    """Model for tracking all stock movements (in/out) with user attribution"""
    
    TRANSACTION_TYPES = [
        ('stock_in', 'Stock In'),
        ('stock_out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
    ]
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    raw_material = models.ForeignKey(
        RawMaterial, 
        on_delete=models.CASCADE, 
        related_name='stock_transactions'
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.0001"))],
        help_text="Quantity moved (positive for stock in, negative for stock out)"
    )
    unit = models.CharField(max_length=50, help_text="Unit of measurement")
    reference_number = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Reference to purchase order, stock out form, etc."
    )
    notes = models.TextField(blank=True, null=True)
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_transactions',
        help_text="User who performed this transaction"
    )
    performed_by_name = models.CharField(
        max_length=150, 
        blank=True, 
        null=True,
        help_text="Name of the person who performed this transaction"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['raw_material', 'created_at']),
            models.Index(fields=['transaction_type', 'created_at']),
            models.Index(fields=['performed_by', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.raw_material.name} ({self.quantity} {self.unit}) by {self.performed_by or 'System'}"
    
    def save(self, *args, **kwargs):
        # Ensure quantity is negative for stock out transactions
        if self.transaction_type == 'stock_out' and self.quantity > 0:
            self.quantity = -self.quantity
        elif self.transaction_type == 'stock_in' and self.quantity < 0:
            self.quantity = abs(self.quantity)
        
        super().save(*args, **kwargs)


class CustomerOrder(models.Model):
    """Model for customer orders"""
    
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    special_requests = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=20, 
        choices=ORDER_STATUS_CHOICES, 
        default='pending'
    )
    
    subtotal = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    tax_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    
    order_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Staff fields
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_orders',
        help_text="Staff member who processed this order"
    )
    processed_by_name = models.CharField(
        max_length=150, 
        blank=True, 
        null=True,
        help_text="Name of the staff member who processed this order"
    )
    
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['status', 'order_date']),
            models.Index(fields=['customer_name', 'order_date']),
            models.Index(fields=['processed_by', 'order_date']),
        ]
    
    def __str__(self):
        return f"Order #{self.id} - {self.customer_name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # Calculate total amount
        self.total_amount = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """Model for individual items in a customer order"""
    
    order = models.ForeignKey(
        CustomerOrder, 
        on_delete=models.CASCADE, 
        related_name="items"
    )
    menu_item = models.ForeignKey(
        MenuItem, 
        on_delete=models.PROTECT,
        related_name="order_items"
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Quantity ordered"
    )
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Price per unit at time of order"
    )
    total_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Total price for this item (quantity * unit_price)"
    )
    
    # Item customization
    special_instructions = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ["menu_item__name"]
        unique_together = ("order", "menu_item")
    
    def __str__(self):
        return f"{self.menu_item.name} x{self.quantity} - ₱{self.total_price}"
    
    def save(self, *args, **kwargs):
        # Calculate total price automatically
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class StockAlert(models.Model):
    """Model to track stock alerts and notifications"""
    ALERT_TYPES = [
        ('low_stock', 'Low Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('expiring_soon', 'Expiring Soon'),
        ('expired', 'Expired'),
        ('reorder', 'Reorder Level'),
    ]
    
    ALERT_STATUS = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    status = models.CharField(max_length=20, choices=ALERT_STATUS, default='active')
    message = models.TextField()
    current_quantity = models.DecimalField(max_digits=12, decimal_places=3)
    threshold_value = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.raw_material.name}"
    
    def acknowledge(self, user=None):
        """Mark alert as acknowledged"""
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        if user:
            self.acknowledged_by = user
        self.save()
    
    def resolve(self):
        """Mark alert as resolved"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save()


class StockBatch(models.Model):
    """Model to track individual batches of materials with their own expiry dates"""
    raw_material = models.ForeignKey(
        RawMaterial,
        on_delete=models.CASCADE,
        related_name='batches'
    )
    purchase_order = models.ForeignKey(
        'PurchaseOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_batches'
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
        help_text="Quantity in this batch"
    )
    purchase_date = models.DateField(help_text="Date this batch was purchased")
    expiry_date = models.DateField(help_text="Date this batch expires")
    is_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['expiry_date']  # FIFO - First to expire, first out
        verbose_name_plural = 'Stock Batches'
    
    def __str__(self):
        return f"{self.raw_material.name} - {self.quantity} {self.raw_material.unit} (Expires: {self.expiry_date})"
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        from django.utils import timezone
        delta = self.expiry_date - timezone.now().date()
        return delta.days
    
    @property
    def is_expiring_soon(self):
        """Check if batch is expiring within 2 days"""
        days = self.days_until_expiry
        return 0 <= days <= 2
    
    def save(self, *args, **kwargs):
        # Auto-calculate expiry date based on shelf life
        if not self.expiry_date and self.purchase_date and self.raw_material:
            from datetime import timedelta
            self.expiry_date = self.purchase_date + timedelta(days=self.raw_material.shelf_life_days)
        
        # Check if expired
        from django.utils import timezone
        if self.expiry_date < timezone.now().date():
            self.is_expired = True
        
        super().save(*args, **kwargs)


class Branch(models.Model):
    """Represents a restaurant branch/location."""
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name