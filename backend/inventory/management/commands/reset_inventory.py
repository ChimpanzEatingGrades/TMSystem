"""
Management command to reset inventory and create sample branch-based data
Usage: python manage.py reset_inventory
"""
from django.core.management.base import BaseCommand
from inventory.models import (
    Branch, BranchQuantity, RawMaterial, UnitOfMeasurement,
    PurchaseOrder, PurchaseOrderItem, StockTransaction,
    CustomerOrder, OrderItem, MenuCategory, MenuItem, Recipe, RecipeItem,
    StockAlert, MenuItemBranchAvailability
)
from decimal import Decimal


class Command(BaseCommand):
    help = 'Reset all inventory data and create sample branches with inventory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of all data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  This will DELETE ALL inventory data!\n'
                    'Run with --confirm to proceed:\n'
                    'python manage.py reset_inventory --confirm'
                )
            )
            return

        self.stdout.write(self.style.WARNING('Deleting all inventory data...'))

        # Delete in correct order to handle foreign key constraints
        StockTransaction.objects.all().delete()
        OrderItem.objects.all().delete()
        CustomerOrder.objects.all().delete()
        MenuItemBranchAvailability.objects.all().delete()
        MenuItem.objects.all().delete()
        RecipeItem.objects.all().delete()
        Recipe.objects.all().delete()
        MenuCategory.objects.all().delete()
        PurchaseOrderItem.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        StockAlert.objects.all().delete()
        BranchQuantity.objects.all().delete()
        RawMaterial.objects.all().delete()
        Branch.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('✓ All data deleted'))

        # Create sample data
        self.stdout.write('Creating sample data...')

        # Create units
        kg, _ = UnitOfMeasurement.objects.get_or_create(
            abbreviation='kg',
            defaults={'name': 'Kilogram', 'description': 'Weight in kilograms'}
        )
        pcs, _ = UnitOfMeasurement.objects.get_or_create(
            abbreviation='pcs',
            defaults={'name': 'Pieces', 'description': 'Count of items'}
        )
        liter, _ = UnitOfMeasurement.objects.get_or_create(
            abbreviation='L',
            defaults={'name': 'Liter', 'description': 'Volume in liters'}
        )

        self.stdout.write(self.style.SUCCESS('✓ Units created'))

        # Create branches
        main_branch = Branch.objects.create(name='Main Branch')
        branch_2 = Branch.objects.create(name='Branch 2')
        branch_3 = Branch.objects.create(name='Branch 3')

        self.stdout.write(self.style.SUCCESS(f'✓ Created {Branch.objects.count()} branches'))

        # Create raw materials
        chicken = RawMaterial.objects.create(
            name='Chicken Breast',
            unit='kg',
            material_type='raw',
            minimum_threshold=Decimal('10.000'),
            reorder_level=Decimal('20.000'),
            shelf_life_days=7
        )
        rice = RawMaterial.objects.create(
            name='Rice',
            unit='kg',
            material_type='raw',
            minimum_threshold=Decimal('50.000'),
            reorder_level=Decimal('100.000'),
            shelf_life_days=180
        )
        oil = RawMaterial.objects.create(
            name='Cooking Oil',
            unit='L',
            material_type='processed',
            minimum_threshold=Decimal('5.000'),
            reorder_level=Decimal('10.000'),
            shelf_life_days=365
        )
        salt = RawMaterial.objects.create(
            name='Salt',
            unit='kg',
            material_type='processed',
            minimum_threshold=Decimal('2.000'),
            reorder_level=Decimal('5.000'),
            shelf_life_days=None  # Non-perishable
        )

        self.stdout.write(self.style.SUCCESS(f'✓ Created {RawMaterial.objects.count()} raw materials'))

        # Create branch quantities (distribute inventory across branches)
        BranchQuantity.objects.create(branch=main_branch, raw_material=chicken, quantity=Decimal('25.000'))
        BranchQuantity.objects.create(branch=branch_2, raw_material=chicken, quantity=Decimal('15.000'))
        BranchQuantity.objects.create(branch=branch_3, raw_material=chicken, quantity=Decimal('10.000'))

        BranchQuantity.objects.create(branch=main_branch, raw_material=rice, quantity=Decimal('100.000'))
        BranchQuantity.objects.create(branch=branch_2, raw_material=rice, quantity=Decimal('80.000'))
        BranchQuantity.objects.create(branch=branch_3, raw_material=rice, quantity=Decimal('60.000'))

        BranchQuantity.objects.create(branch=main_branch, raw_material=oil, quantity=Decimal('10.000'))
        BranchQuantity.objects.create(branch=branch_2, raw_material=oil, quantity=Decimal('8.000'))
        BranchQuantity.objects.create(branch=branch_3, raw_material=oil, quantity=Decimal('5.000'))

        BranchQuantity.objects.create(branch=main_branch, raw_material=salt, quantity=Decimal('5.000'))
        BranchQuantity.objects.create(branch=branch_2, raw_material=salt, quantity=Decimal('3.000'))
        BranchQuantity.objects.create(branch=branch_3, raw_material=salt, quantity=Decimal('2.000'))

        self.stdout.write(self.style.SUCCESS(f'✓ Created {BranchQuantity.objects.count()} branch quantities'))

        # Create menu categories
        main_dishes = MenuCategory.objects.create(name='Main Dishes')
        beverages = MenuCategory.objects.create(name='Beverages')

        self.stdout.write(self.style.SUCCESS(f'✓ Created {MenuCategory.objects.count()} menu categories'))

        # Create recipes
        fried_chicken_recipe = Recipe.objects.create(
            name='Fried Chicken Recipe',
            description='Recipe for fried chicken',
            yield_quantity=Decimal('1.000'),
            yield_uom='serving'
        )

        RecipeItem.objects.create(
            recipe=fried_chicken_recipe,
            raw_material=chicken,
            quantity=Decimal('0.250')  # 250g chicken per serving
        )
        RecipeItem.objects.create(
            recipe=fried_chicken_recipe,
            raw_material=oil,
            quantity=Decimal('0.050')  # 50ml oil per serving
        )
        RecipeItem.objects.create(
            recipe=fried_chicken_recipe,
            raw_material=salt,
            quantity=Decimal('0.005')  # 5g salt per serving
        )

        rice_meal_recipe = Recipe.objects.create(
            name='Rice Meal Recipe',
            description='Recipe for rice meal',
            yield_quantity=Decimal('1.000'),
            yield_uom='serving'
        )

        RecipeItem.objects.create(
            recipe=rice_meal_recipe,
            raw_material=rice,
            quantity=Decimal('0.200')  # 200g rice per serving
        )

        self.stdout.write(self.style.SUCCESS(f'✓ Created {Recipe.objects.count()} recipes'))

        # Create menu items
        fried_chicken = MenuItem.objects.create(
            name='Fried Chicken',
            description='Crispy fried chicken with special seasoning',
            category=main_dishes,
            recipe=fried_chicken_recipe
        )

        rice_meal = MenuItem.objects.create(
            name='Rice Meal',
            description='Steamed rice',
            category=main_dishes,
            recipe=rice_meal_recipe
        )

        self.stdout.write(self.style.SUCCESS(f'✓ Created {MenuItem.objects.count()} menu items'))

        # Create menu item branch availability with prices
        MenuItemBranchAvailability.objects.create(
            menu_item=fried_chicken,
            branch=main_branch,
            price=Decimal('150.00'),
            is_active=True
        )
        MenuItemBranchAvailability.objects.create(
            menu_item=fried_chicken,
            branch=branch_2,
            price=Decimal('145.00'),
            is_active=True
        )
        MenuItemBranchAvailability.objects.create(
            menu_item=fried_chicken,
            branch=branch_3,
            price=Decimal('140.00'),
            is_active=True
        )

        MenuItemBranchAvailability.objects.create(
            menu_item=rice_meal,
            branch=main_branch,
            price=Decimal('30.00'),
            is_active=True
        )
        MenuItemBranchAvailability.objects.create(
            menu_item=rice_meal,
            branch=branch_2,
            price=Decimal('30.00'),
            is_active=True
        )
        MenuItemBranchAvailability.objects.create(
            menu_item=rice_meal,
            branch=branch_3,
            price=Decimal('25.00'),
            is_active=True
        )

        self.stdout.write(self.style.SUCCESS(
            f'✓ Created {MenuItemBranchAvailability.objects.count()} menu item branch availabilities'
        ))

        self.stdout.write(self.style.SUCCESS('\n✅ Database reset complete!'))
        self.stdout.write(self.style.SUCCESS('\nSample data created:'))
        self.stdout.write(f'  • {Branch.objects.count()} branches')
        self.stdout.write(f'  • {RawMaterial.objects.count()} raw materials')
        self.stdout.write(f'  • {BranchQuantity.objects.count()} branch quantities')
        self.stdout.write(f'  • {MenuCategory.objects.count()} menu categories')
        self.stdout.write(f'  • {MenuItem.objects.count()} menu items')
        self.stdout.write(f'  • {Recipe.objects.count()} recipes')
        self.stdout.write('\nYou can now:')
        self.stdout.write('  1. View inventory by selecting a branch')
        self.stdout.write('  2. Create purchase orders for any branch')
        self.stdout.write('  3. Create customer orders using menu items')
        self.stdout.write('  4. Stock out materials from branches')
