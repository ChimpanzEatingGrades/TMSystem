from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from inventory.models import StockBatch, StockAlert, RawMaterial, BranchQuantity

class Command(BaseCommand):
    help = 'Check for expired and expiring batches and create branch-specific alerts'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        threshold = today + timedelta(days=2)
        
        # Check expired batches
        expired_batches = StockBatch.objects.filter(
            expiry_date__lt=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        expired_count = 0
        materials_with_expired = set()
        
        for batch in expired_batches:
            batch.is_expired = True
            batch.save()
            materials_with_expired.add(batch.raw_material.id)
        
        # Create single alert per material showing all affected branches
        for material_id in materials_with_expired:
            material = RawMaterial.objects.get(id=material_id)
            total_expired = StockBatch.objects.filter(
                raw_material=material,
                is_expired=True,
                quantity__gt=0
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            # Get all branches that have this material in stock
            branches_with_stock = BranchQuantity.objects.filter(
                raw_material=material,
                quantity__gt=0
            ).select_related('branch')
            
            # Build message with all branches
            if branches_with_stock.count() > 0:
                branch_details = ', '.join([
                    f'{bq.branch.name} ({bq.quantity} {material.unit})'
                    for bq in branches_with_stock
                ])
                
                alert, created = StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=None,  # No specific branch - applies to all
                    alert_type='expired',
                    status='active',
                    defaults={
                        'message': f'{material.name} has expired batches. Total expired: {total_expired} {material.unit}. Affected branches: {branch_details}. Remove from stock immediately.',
                        'current_quantity': total_expired,
                    }
                )
                
                if created:
                    expired_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'EXPIRED ALERT: {material.name} - {total_expired} {material.unit} expired across {branches_with_stock.count()} branch(es)'
                        )
                    )
        
        # Check expiring soon
        expiring_soon = StockBatch.objects.filter(
            expiry_date__lte=threshold,
            expiry_date__gte=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        expiring_count = 0
        materials_expiring = {}
        
        for batch in expiring_soon:
            material = batch.raw_material
            if material.id not in materials_expiring:
                materials_expiring[material.id] = {
                    'material': material,
                    'earliest_date': batch.expiry_date,
                    'total_qty': 0,
                    'days_left': batch.days_until_expiry
                }
            materials_expiring[material.id]['total_qty'] += batch.quantity
            if batch.expiry_date < materials_expiring[material.id]['earliest_date']:
                materials_expiring[material.id]['earliest_date'] = batch.expiry_date
                materials_expiring[material.id]['days_left'] = batch.days_until_expiry
        
        # Create single alert per material showing all affected branches
        for material_id, info in materials_expiring.items():
            material = info['material']
            earliest_date = info['earliest_date']
            total_expiring = info['total_qty']
            days_left = info['days_left']
            
            # Get all branches that have this material in stock
            branches_with_stock = BranchQuantity.objects.filter(
                raw_material=material,
                quantity__gt=0
            ).select_related('branch')
            
            if branches_with_stock.count() > 0:
                branch_details = ', '.join([
                    f'{bq.branch.name} ({bq.quantity} {material.unit})'
                    for bq in branches_with_stock
                ])
                
                alert, created = StockAlert.objects.update_or_create(
                    raw_material=material,
                    branch=None,  # No specific branch - applies to all
                    alert_type='expiring_soon',
                    status='active',
                    defaults={
                        'message': f'{material.name}: {total_expiring} {material.unit} expiring soon (earliest: {earliest_date}, {days_left} day{"s" if days_left != 1 else ""} left). Affected branches: {branch_details}. Use soon or plan stock-out.',
                        'current_quantity': total_expiring,
                    }
                )
                
                if created:
                    expiring_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'EXPIRING SOON ALERT: {material.name} - {total_expiring} {material.unit} (in {days_left} days) across {branches_with_stock.count()} branch(es)'
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nExpiry check complete:\n'
                f'- {expired_batches.count()} expired batches found ({expired_count} branch alerts created)\n'
                f'- {expiring_soon.count()} batches expiring soon ({expiring_count} branch alerts created)'
            )
        )
