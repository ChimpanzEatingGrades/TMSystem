from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from inventory.models import StockBatch, StockAlert, RawMaterial

class Command(BaseCommand):
    help = 'Check for expired and expiring batches and create alerts'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        threshold = today + timedelta(days=2)
        
        # Check expired batches
        expired_batches = StockBatch.objects.filter(
            expiry_date__lt=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        expired_count = 0
        for batch in expired_batches:
            batch.is_expired = True
            batch.save()
            
            material = batch.raw_material
            total_expired = StockBatch.objects.filter(
                raw_material=material,
                is_expired=True,
                quantity__gt=0
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            alert, created = StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expired',
                status='active',
                defaults={
                    'message': f'{material.name} has expired batches. Total: {total_expired} {material.unit}',
                    'current_quantity': material.quantity,
                }
            )
            
            if created:
                expired_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'EXPIRED: {material.name} - {batch.quantity} {material.unit} (expired {(today - batch.expiry_date).days} days ago)'
                    )
                )
        
        # Check expiring soon
        expiring_soon = StockBatch.objects.filter(
            expiry_date__lte=threshold,
            expiry_date__gte=today,
            quantity__gt=0
        ).select_related('raw_material')
        
        expiring_count = 0
        for batch in expiring_soon:
            material = batch.raw_material
            
            # Calculate total expiring quantity for this material
            total_expiring = StockBatch.objects.filter(
                raw_material=material,
                expiry_date__lte=threshold,
                expiry_date__gte=today,
                quantity__gt=0
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            alert, created = StockAlert.objects.get_or_create(
                raw_material=material,
                alert_type='expiring_soon',
                status='active',
                defaults={
                    'message': f'{material.name}: {total_expiring} {material.unit} expiring soon (earliest: {batch.expiry_date}, {batch.days_until_expiry} days left)',
                    'current_quantity': material.quantity,
                }
            )
            
            if created:
                expiring_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'EXPIRING SOON: {material.name} - {batch.quantity} {material.unit} (in {batch.days_until_expiry} days)'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nExpiry check complete:\n'
                f'- {expired_batches.count()} expired batches found ({expired_count} new alerts)\n'
                f'- {expiring_soon.count()} batches expiring soon ({expiring_count} new alerts)'
            )
        )
