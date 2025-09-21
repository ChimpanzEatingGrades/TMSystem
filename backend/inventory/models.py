from decimal import Decimal
from django.db import models
from django.db.models.functions import Lower
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

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
    name = models.CharField(max_length=150, unique=True)
    unit = models.CharField(max_length=50)  # e.g. "g", "ml", "pcs"
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal("0.000"),
        validators=[MinValueValidator(Decimal("0.000"))],
        help_text="Current stock quantity"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

    class Meta:
        ordering = ["name"]
        constraints = [
            # Enforce case-insensitive uniqueness on name
            models.UniqueConstraint(
                Lower("name"), name="uniq_rawmaterial_name_ci"
            )
        ]


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
