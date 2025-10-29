from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField, CharField
from django.db.models.functions import TruncHour, Cast
from decimal import Decimal
from .models import CustomerOrder, OrderItem, MenuItem, RawMaterial, PurchaseOrderItem, BranchQuantity, StockTransaction

def get_sales_report_data(start_date, end_date, branch_id=None):
    """
    Generates a comprehensive sales report for a given date range and optional branch.
    """
    # Base queryset for orders
    orders = CustomerOrder.objects.filter(
        order_date__date__range=[start_date, end_date],
        status='completed'  # Only include completed orders for revenue
    )
    if branch_id:
        orders = orders.filter(branch_id=branch_id)

    # --- 1. Sales Statistics ---
    sales_stats = orders.aggregate(
        total_orders=Count('id'),
        gross_sales=Sum('total_amount'),
        average_order_value=Avg('total_amount')
    )
    gross_sales = sales_stats.get('gross_sales') or Decimal('0.00')

    # --- 2. Estimated COGS (Cost of Goods Sold) ---
    # This is an estimation. A more accurate COGS would require FIFO/LIFO costing per transaction.
    # Here, we calculate the average cost of each raw material from all purchase orders.
    order_items = OrderItem.objects.filter(order__in=orders)
    estimated_cogs = Decimal('0.00')
    
    # Get average cost for all raw materials
    avg_costs = RawMaterial.objects.annotate(
        avg_cost=ExpressionWrapper(
            Sum('recipe_items__recipe__menu_items__order_items__purchaseorderitem__total_price') / 
            Sum('recipe_items__recipe__menu_items__order_items__purchaseorderitem__quantity'),
            output_field=DecimalField()
        )
    ).values('id', 'avg_cost')

    avg_cost_map = {item['id']: item['avg_cost'] for item in avg_costs if item['avg_cost']}

    for item in order_items.select_related('menu_item__recipe'):
        if item.menu_item and item.menu_item.recipe:
            for recipe_item in item.menu_item.recipe.items.all():
                material = recipe_item.raw_material
                avg_cost = avg_cost_map.get(material.id)
                if avg_cost:
                    # Calculate cost for this specific order item
                    required_qty = (recipe_item.quantity * item.quantity) / item.menu_item.recipe.yield_quantity
                    estimated_cogs += required_qty * avg_cost

    net_income = gross_sales - estimated_cogs

    # --- 3. Top Selling Products ---
    top_products = order_items.values('menu_item__name').annotate(
        total_quantity_sold=Sum('quantity'),
        total_revenue=Sum('total_price')
    ).order_by('-total_revenue')[:10]

    # --- 4. Peak Hours ---
    peak_hours_data = orders.annotate(
        hour=Cast(F('order_date__hour'), output_field=CharField())
    ).values('hour').annotate(
        total_sales=Sum('total_amount')
    ).order_by('hour')

    # --- 5. Sales Over Time (Line Chart) ---
    sales_over_time = orders.values('order_date__date').annotate(
        daily_sales=Sum('total_amount')
    ).order_by('order_date__date')

    # --- 6. Sales by Branch (Pie Chart) ---
    # This query ignores the branch_id filter to show overall distribution
    sales_by_branch = CustomerOrder.objects.filter(
        order_date__date__range=[start_date, end_date],
        status='completed'
    ).values('branch__name').annotate(
        total_sales=Sum('total_amount')
    ).order_by('-total_sales')

    return {
        'summary': {
            'total_orders': sales_stats.get('total_orders') or 0,
            'gross_sales': gross_sales,
            'estimated_cogs': estimated_cogs,
            'net_income': net_income,
            'average_order_value': sales_stats.get('average_order_value') or Decimal('0.00'),
        },
        'top_products': list(top_products),
        'peak_hours': list(peak_hours_data),
        'sales_over_time': list(sales_over_time),
        'sales_by_branch': list(sales_by_branch),
    }

def get_inventory_report_data(start_date, end_date, branch_id):
    """
    Generates an inventory report for a specific branch and date range.
    """
    branch_quantities = BranchQuantity.objects.filter(branch_id=branch_id).select_related('raw_material')
    
    report = []
    for bq in branch_quantities:
        material = bq.raw_material
        
        transactions = StockTransaction.objects.filter(
            raw_material=material,
            created_at__date__range=[start_date, end_date],
        ).order_by('-created_at')
        
        usage = transactions.filter(transaction_type='stock_out').aggregate(total=Sum('quantity'))['total'] or 0
        restocks = transactions.filter(transaction_type='stock_in').aggregate(total=Sum('quantity'))['total'] or 0
        
        report.append({
            'material_id': material.id,
            'material_name': material.name,
            'material_unit': material.unit,
            'current_quantity': bq.quantity,
            'total_usage': abs(usage),
            'total_restocks': restocks,
            'recent_transactions': list(transactions.values(
                'created_at', 'transaction_type', 'quantity', 'reference_number', 'performed_by_name'
            )[:10])
        })
        
    return report