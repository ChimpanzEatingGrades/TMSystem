from django.core.management.base import BaseCommand
from inventory.models import UnitOfMeasurement, PurchaseOrder, PurchaseOrderItem, RawMaterial

class Command(BaseCommand):
    help = 'Check database status and create default data'

    def handle(self, *args, **options):
        self.stdout.write("Checking database status...")
        
        # Check units
        units_count = UnitOfMeasurement.objects.count()
        self.stdout.write(f"Units in database: {units_count}")
        
        if units_count == 0:
            self.stdout.write("Creating default units...")
            default_units = [
                {'name': 'Kilograms', 'abbreviation': 'kg'},
                {'name': 'Grams', 'abbreviation': 'g'},
                {'name': 'Liters', 'abbreviation': 'l'},
                {'name': 'Milliliters', 'abbreviation': 'ml'},
                {'name': 'Pieces', 'abbreviation': 'pcs'},
            ]
            
            for unit_data in default_units:
                unit, created = UnitOfMeasurement.objects.get_or_create(
                    abbreviation=unit_data['abbreviation'],
                    defaults=unit_data
                )
                if created:
                    self.stdout.write(f"Created unit: {unit.name} ({unit.abbreviation})")
                else:
                    self.stdout.write(f"Unit already exists: {unit.name} ({unit.abbreviation})")
        
        # Check purchase orders
        po_count = PurchaseOrder.objects.count()
        self.stdout.write(f"Purchase orders in database: {po_count}")
        
        # Check raw materials
        rm_count = RawMaterial.objects.count()
        self.stdout.write(f"Raw materials in database: {rm_count}")
        
        self.stdout.write("Database check complete!")

