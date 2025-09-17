# inventory/models.py
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator

class UnitOfMeasurement(models.Model):
    """Model for managing units of measurement"""
    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.abbreviation})"
    
    class Meta:
        ordering = ['name']

# ----- RAW MATERIAL (if you already have this, keep your existing version and remove this block) -----
class RawMaterial(models.Model):
    name = models.CharField(max_length=150)
    unit = models.CharField(max_length=50)  # e.g. "g", "ml", "pcs"
    cost_per_unit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
# ---------------------------------------------------------------------------------------------------

class Recipe(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    yield_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=Decimal("1.000"), validators=[MinValueValidator(Decimal("0.0001"))])
    yield_uom = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class RecipeItem(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="items")
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.PROTECT, related_name="recipe_items")
    quantity = models.DecimalField(max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0.0001"))])

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
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    picture = models.ImageField(upload_to="menu_items/", null=True, blank=True)

    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)

    description = models.TextField(blank=True)

    # optional relationships — menu item may link to a recipe and a category
    recipe = models.ForeignKey(Recipe, on_delete=models.SET_NULL, null=True, blank=True, related_name="menu_items")
    category = models.ForeignKey(MenuCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="menu_items")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

class PurchaseOrder(models.Model):
    """Model for purchase orders/tickets"""
    purchase_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Purchase Order #{self.id} - {self.purchase_date}"
    
    @property
    def total_amount(self):
        return sum(item.total_price for item in self.items.all())
    
    class Meta:
        ordering = ['-purchase_date', '-created_at']

class PurchaseOrderItem(models.Model):
    """Model for individual items in a purchase order"""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    unit = models.ForeignKey(UnitOfMeasurement, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    def save(self, *args, **kwargs):
        # Calculate total price automatically
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.quantity} {self.unit.abbreviation} @ ${self.unit_price}"
    
    class Meta:
        ordering = ['name']
        return self.name

    def clean(self):
        if self.valid_from and self.valid_until and self.valid_until < self.valid_from:
            raise ValidationError({"valid_until": "valid_until must be on or after valid_from"})
