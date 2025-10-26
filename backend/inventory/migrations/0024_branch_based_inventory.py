# Generated migration for branch-based inventory restructure

from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0023_remove_menuitem_price_and_more'),
    ]

    operations = [
        # 1. Add branch field to PurchaseOrder
        migrations.AddField(
            model_name='purchaseorder',
            name='branch',
            field=models.ForeignKey(
                blank=True,
                help_text='Branch where this purchase order is for',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='purchase_orders',
                to='inventory.branch'
            ),
        ),
        
        # 2. Create BranchQuantity model
        migrations.CreateModel(
            name='BranchQuantity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.DecimalField(
                    decimal_places=3,
                    default=Decimal('0.000'),
                    help_text='Current stock quantity for this branch',
                    max_digits=12,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.000'))]
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('branch', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='raw_material_quantities',
                    to='inventory.branch'
                )),
                ('raw_material', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='branch_quantities',
                    to='inventory.rawmaterial'
                )),
            ],
            options={
                'verbose_name_plural': 'Branch Quantities',
                'ordering': ['branch__name', 'raw_material__name'],
            },
        ),
        
        # 3. Add unique constraint for BranchQuantity
        migrations.AddConstraint(
            model_name='branchquantity',
            constraint=models.UniqueConstraint(
                fields=('branch', 'raw_material'),
                name='unique_branch_rawmaterial'
            ),
        ),
        
        # 4. Remove quantity field from RawMaterial
        migrations.RemoveField(
            model_name='rawmaterial',
            name='quantity',
        ),
        
        # 5. Update help text for threshold fields
        migrations.AlterField(
            model_name='rawmaterial',
            name='minimum_threshold',
            field=models.DecimalField(
                decimal_places=3,
                default=10,
                help_text='Minimum quantity before low stock alert (per branch)',
                max_digits=12
            ),
        ),
        migrations.AlterField(
            model_name='rawmaterial',
            name='reorder_level',
            field=models.DecimalField(
                decimal_places=3,
                default=20,
                help_text='Quantity level to trigger reorder (per branch)',
                max_digits=12
            ),
        ),
    ]
