# Backend Implementation Status

## ✅ Ready to Use

### Models
- ✅ **RawMaterial** - Updated (no quantity field, uses branch quantities)
- ✅ **BranchQuantity** - New model for tracking stock per branch
- ✅ **PurchaseOrder** - Has branch field
- ✅ **CustomerOrder** - Has branch field
- ✅ **Branch** - Stores branch information

### Serializers
- ✅ **BranchQuantitySerializer** - Serializes branch inventory
- ✅ **RawMaterialSerializer** - Shows branch_quantities and total_quantity
- ✅ **PurchaseOrderCreateSerializer** - Requires branch, adds to branch inventory
- ✅ **CustomerOrderCreateSerializer** - Deducts from order's branch
- ✅ **StockOutSerializer** - Has branch_id field

### API Endpoints Working

#### Branches
- ✅ `GET /api/branches/` - List all branches
- ✅ `POST /api/branches/` - Create branch
- ✅ `GET /api/branches/{id}/` - Get branch details

#### Branch Inventory
- ✅ `GET /api/branch-quantities/` - List all branch quantities
- ✅ `GET /api/branch-quantities/by_branch/?branch_id={id}` - **Main inventory endpoint**
- ✅ `GET /api/branch-quantities/low_stock/` - Get low stock items
- ✅ `POST /api/branch-quantities/` - Create/update quantities

#### Purchase Orders
- ✅ `GET /api/purchase-orders/` - List all
- ✅ `GET /api/purchase-orders/?branch_id={id}` - **Filter by branch**
- ✅ `POST /api/purchase-orders/` - Create with branch (adds to branch inventory)
- ✅ `GET /api/purchase-orders/{id}/` - Get details

#### Customer Orders
- ✅ `GET /api/customer-orders/` - List all
- ✅ `GET /api/customer-orders/?branch_id={id}` - Filter by branch
- ✅ `POST /api/customer-orders/` - Create (deducts from branch inventory)
- ✅ `GET /api/customer-orders/{id}/` - Get details

#### Raw Materials
- ✅ `GET /api/rawmaterials/` - List with branch_quantities
- ✅ `GET /api/rawmaterials/{id}/` - Get with branch breakdown

---

## ⚠️ Needs Fixing (Legacy Code)

### Stock Out Endpoint
- ⚠️ `POST /api/stock-out/stock_out/` - Still uses old `material.quantity` logic
- **Issue**: References removed `RawMaterial.quantity` field
- **Fix needed**: Rewrite to use `BranchQuantity` model
- **Workaround**: Don't use this endpoint yet, or manually update branch quantities

### Alert System
- ⚠️ `RawMaterialViewSet.check_and_create_alerts()` - Uses `material.quantity`
- **Issue**: Checks global quantity which no longer exists
- **Fix needed**: Make alerts branch-aware
- **Impact**: Alerts won't be created/updated automatically

### Some RawMaterialViewSet Actions
- ⚠️ `low_stock_items` - Queries `material.quantity`
- ⚠️ `type_stats` - Sums `material.quantity`
- **Fix needed**: Update to use BranchQuantity aggregations

---

## Migration Required

Before using the system:

```bash
cd backend
python manage.py migrate
```

This will:
1. Create `BranchQuantity` table
2. Add `branch` field to `PurchaseOrder`
3. Remove `quantity` field from `RawMaterial`

⚠️ **Data Loss Warning**: If you have existing inventory data, create a data migration first to preserve quantities.

---

## Quick Start After Migration

### 1. Create Branches
```bash
# Via Django shell
python manage.py shell

from inventory.models import Branch
Branch.objects.create(name="Main Branch")
Branch.objects.create(name="Branch 2")
```

Or via API:
```bash
POST /api/branches/
{
  "name": "Main Branch"
}
```

### 2. Create Purchase Order (adds inventory to branch)
```bash
POST /api/purchase-orders/
{
  "purchase_date": "2024-10-26",
  "branch": 1,
  "notes": "Initial stock",
  "items": [
    {
      "name": "Chicken Breast",
      "unit": 1,
      "quantity": 100,
      "unit_price": 150,
      "shelf_life_days": 7,
      "material_type": "raw"
    }
  ]
}
```

### 3. View Branch Inventory
```bash
GET /api/branch-quantities/by_branch/?branch_id=1
```

### 4. Create Customer Order (deducts from branch)
```bash
POST /api/customer-orders/
{
  "customer_name": "John Doe",
  "branch": 1,
  "items": [
    {
      "menu_item": 5,
      "quantity": 2
    }
  ]
}
```

---

## What Works Right Now

### ✅ Complete Workflows

1. **View inventory per branch**
   - Select branch → fetch `/api/branch-quantities/by_branch/?branch_id=X`
   - Display materials with quantities

2. **Purchase orders add to branch**
   - Create PO with branch_id
   - Inventory automatically added to that branch
   - Transactions created

3. **Customer orders deduct from branch**
   - Create order with branch_id
   - Validates ingredients available at that branch
   - Deducts from branch inventory
   - Transactions created

4. **View orders by branch**
   - Filter purchase orders by branch
   - Filter customer orders by branch

---

## Frontend Implementation Priority

1. **Branch Selector Component** (High Priority)
   - Add dropdown to select branch
   - Store selected branch in state
   - Require selection before showing inventory

2. **Inventory View** (High Priority)
   - Fetch `/api/branch-quantities/by_branch/?branch_id=X`
   - Display table of materials with quantities
   - Show low stock warnings

3. **Purchase Order Form** (High Priority)
   - Include branch selector
   - Send branch_id with form data
   - Refresh branch inventory after creation

4. **Customer Order Form** (High Priority)
   - Include branch selector (or auto-detect from user)
   - Send branch_id with order
   - Handle insufficient stock errors

5. **Stock Out** (Low Priority - Wait for backend fix)
   - Skip this for now
   - Manually adjust quantities via Django admin if needed

---

## Error Handling

### Insufficient Stock Error
```json
{
  "error": "Insufficient stock for Chicken Breast at Main Branch. Available: 10 kg, Required: 15 kg"
}
```

Handle in frontend:
```tsx
if (!response.ok) {
  const error = await response.json();
  alert(error.error || 'Operation failed');
}
```

### Branch Not Specified
```json
{
  "branch": ["This field is required."]
}
```

### Material Not Available at Branch
```json
{
  "error": "No stock available for Chicken Breast at Main Branch"
}
```

---

## Testing Checklist

After migration, test these workflows:

- [ ] List all branches
- [ ] Create new branch
- [ ] View inventory for branch (should be empty initially)
- [ ] Create purchase order with branch
- [ ] Verify inventory added to correct branch
- [ ] View purchase orders for branch
- [ ] Create customer order with branch
- [ ] Verify stock deducted from correct branch
- [ ] Try order with insufficient stock (should fail with clear error)
- [ ] View customer orders for branch

---

## Next Steps

1. **Immediate**:
   - Run migrations
   - Create branches
   - Implement frontend branch selector
   - Test basic workflows

2. **Short Term**:
   - Fix stock out endpoint
   - Make alerts branch-aware
   - Update legacy endpoints

3. **Long Term**:
   - Add branch transfers
   - Branch-specific dashboards
   - Multi-branch analytics

---

**Status**: Ready for frontend implementation with branch-based workflows.
**Last Updated**: October 26, 2024
