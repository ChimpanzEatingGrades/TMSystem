from django.db import models
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

class RawMaterial(models.Model):
    UNIT_CHOICES = [
        ("kg", "Kilograms"),
        ("g", "Grams"),
        ("l", "Liters"),
        ("ml", "Milliliters"),
        ("pcs", "Pieces"),
    ]

    name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default="pcs")

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
