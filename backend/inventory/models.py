from django.db import models

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
