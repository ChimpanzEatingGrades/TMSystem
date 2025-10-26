# Complete Branch-Based Inventory System Guide

## 🎉 What's Been Updated

### ✅ **Stock Out Modal** - Now Working!
- Fetches materials for the selected branch only
- Shows only available stock at that branch
- Deducts from branch inventory (FIFO logic)
- Fixed to work with `BranchQuantity` model

### ✅ **Menu Items & Orders** - Branch-Aware
- Customer orders deduct ingredients from their branch
- Menu items check branch availability
- Orders validate stock before creation

### ✅ **Complete Branch System**
- All inventory tracked per branch
- Purchase orders add to specific branch
- Stock out removes from specific branch
- Transactions track branch operations

---

## 🚀 Quick Start

### Step 1: Reset Database with Sample Data

Run this command to clear all old data and create sample branches with inventory:

```bash
cd backend
python manage.py reset_inventory --confirm
```

This creates:
- **3 branches**: Main Branch, Branch 2, Branch 3
- **4 raw materials**: Chicken, Rice, Oil, Salt
- **Distributed inventory** across all branches
- **2 menu items**: Fried Chicken, Rice Meal
- **Recipes** linking menu items to ingredients

### Step 2: Start the Backend

```bash
python manage.py runserver
```

### Step 3: Start the Frontend

```bash
cd frontend
npm run dev
```

### Step 4: Login and Test

1. **Go to Inventory Page**
   - Select a branch from the dropdown
   - View that branch's inventory
   
2. **Create Purchase Order**
   - Click "Purchase Order"
   - Add items (they'll be added to selected branch)
   - Submit
   
3. **Stock Out Materials**
   - Click "Stock Out"
   - Select material (only shows materials at selected branch)
   - Enter quantity
   - Submit
   
4. **Create Customer Order**
   - Go to Orders page
   - Select branch
   - Add menu items
   - System checks if branch has enough ingredients
   - Order deducts from branch inventory

---

## 📊 Complete Data Flow

### Purchase Order Flow
```
User → Selects "Main Branch"
     → Creates Purchase Order
     → Adds 50kg Chicken
     → System adds to Main Branch inventory
     → BranchQuantity updated
     → Transaction recorded
```

### Customer Order Flow
```
User → Creates order at "Branch 2"
     → Orders "Fried Chicken" (needs 250g chicken, 50ml oil)
     → System checks Branch 2 inventory
     → If sufficient: Deducts from Branch 2
     → If insufficient: Shows error with exact amounts
     → Order created + Transactions recorded
```

### Stock Out Flow
```
User → Selects "Branch 3"
     → Clicks "Stock Out"
     → Sees only Branch 3 materials
     → Stocks out 5kg Rice
     → System deducts from Branch 3 only
     → Transaction recorded
```

---

## 🔄 How Each Component Works

### 1. Inventory Page (`InventoryPage.jsx`)

**Branch Selector** (Top of page):
- Auto-selects first branch on load
- Shows warning if no branch selected
- Disables all actions until branch chosen

**Material List**:
- Fetches from: `/api/branch-quantities/by_branch/?branch_id={id}`
- Shows only that branch's inventory
- Displays: quantity, unit, low stock status

**Purchase Order Button**:
- Opens modal
- Includes `selectedBranch` prop
- Creates PO for that branch

**Stock Out Button**:
- Opens modal
- Includes `selectedBranch` prop
- Shows only materials at that branch

### 2. Stock Out Modal (`StockOutModal.jsx`)

**Material Fetching**:
```javascript
// Fetches materials for selected branch only
const res = await api.get(`/inventory/branch-quantities/by_branch/?branch_id=${selectedBranch}`)
// Filters out zero quantity items
const availableMaterials = res.data.filter(m => m.quantity > 0)
```

**Stock Out Request**:
```javascript
POST /inventory/stock-out/stock_out/
{
  "raw_material_id": 1,
  "branch_id": 2,        // Specifies which branch
  "quantity": 5.0,
  "notes": "Used for event"
}
```

**Backend Processing**:
1. Gets `BranchQuantity` for that branch + material
2. Checks if sufficient stock
3. Deducts from branch quantity
4. Creates transaction record
5. Returns updated quantity

### 3. Purchase Order Modal (`PurchaseOrderModal.jsx`)

**Create Request**:
```javascript
POST /inventory/purchase-orders/
{
  "purchase_date": "2024-10-26",
  "branch": 1,           // Items go to this branch
  "items": [
    {
      "name": "Chicken Breast",
      "quantity": 50,
      "unit": 1,
      "unit_price": 150
    }
  ]
}
```

**Backend Processing**:
1. Creates PurchaseOrder with branch
2. For each item:
   - Creates or gets RawMaterial
   - Gets or creates BranchQuantity for that branch
   - Adds quantity to branch inventory
3. Creates transactions

### 4. Customer Orders

**Already Updated** - The `CustomerOrderCreateSerializer` now:
1. Requires `branch` field
2. Validates ingredients at that branch
3. Deducts from branch quantities
4. Shows clear error if insufficient stock

---

## 🗄️ Database Structure

### Before (Old System)
```
RawMaterial
├── name: "Chicken"
├── quantity: 100 kg    ← Global quantity (REMOVED)
└── unit: "kg"
```

### After (New System)
```
RawMaterial
├── name: "Chicken"
└── unit: "kg"

BranchQuantity (NEW)
├── branch: Main Branch
├── raw_material: Chicken
└── quantity: 50 kg     ← Branch-specific

BranchQuantity
├── branch: Branch 2
├── raw_material: Chicken
└── quantity: 30 kg     ← Branch-specific

BranchQuantity
├── branch: Branch 3
├── raw_material: Chicken
└── quantity: 20 kg     ← Branch-specific
```

---

## 📝 API Endpoints Reference

### Branches
- `GET /api/branches/` - List all branches
- `POST /api/branches/` - Create branch

### Branch Inventory
- `GET /api/branch-quantities/by_branch/?branch_id={id}` - **Main endpoint**
- `GET /api/branch-quantities/low_stock/` - Low stock across branches

### Purchase Orders
- `GET /api/purchase-orders/?branch_id={id}` - Filter by branch
- `POST /api/purchase-orders/` - Create (requires `branch`)

### Stock Out
- `POST /api/stock-out/stock_out/` - Stock out from branch
  - Requires: `raw_material_id`, `branch_id`, `quantity`

### Customer Orders
- `GET /api/customer-orders/?branch_id={id}` - Filter by branch
- `POST /api/customer-orders/` - Create (requires `branch`)

### Raw Materials
- `GET /api/rawmaterials/` - List all with branch breakdown
- `GET /api/rawmaterials/{id}/` - Details with all branch quantities

---

## 🧪 Testing Scenarios

### Scenario 1: Multi-Branch Purchase Orders
1. Select "Main Branch"
2. Create PO for 100kg Rice
3. Switch to "Branch 2"
4. Create PO for 50kg Rice
5. Result: Each branch has its own rice inventory

### Scenario 2: Stock Out from Specific Branch
1. Select "Branch 3"
2. Stock out 10kg Chicken
3. Switch to "Main Branch"
4. Inventory unchanged (only Branch 3 affected)

### Scenario 3: Customer Order with Insufficient Stock
1. Select "Branch 2"
2. Create order for 20 Fried Chicken
3. If insufficient chicken at Branch 2:
   - Error: "Insufficient stock for Chicken Breast at Branch 2. Available: 5 kg, Required: 5 kg"
4. Can't use stock from other branches

### Scenario 4: Menu Item Availability
1. Menu items work at all branches
2. Each branch can have different prices
3. Orders use ingredients from their branch only

---

## ⚡ Performance Notes

- Branch quantities indexed for fast lookup
- Transactions logged for audit trail
- Queries optimized with `select_related` and `prefetch_related`
- Frontend caches branch list

---

## 🔧 Troubleshooting

### "Insufficient stock" error
- Check the correct branch is selected
- Verify branch has the material
- Check quantity is sufficient

### Can't create purchase order
- Ensure branch is selected
- Check form validation
- Verify backend is running

### Materials not showing
- Select a branch first
- Check branch has inventory
- Verify API endpoint working

### Stock out not working
- Select branch before opening modal
- Ensure material exists at branch
- Check quantity is available

---

## 📚 Additional Commands

### Create a New Branch
```bash
python manage.py shell
>>> from inventory.models import Branch
>>> Branch.objects.create(name="Downtown Branch")
```

### View Branch Inventory
```python
from inventory.models import BranchQuantity
BranchQuantity.objects.filter(branch__name="Main Branch")
```

### Transfer Stock Between Branches (Manual)
```python
from inventory.models import BranchQuantity, Branch
from decimal import Decimal

# Get branches
source = Branch.objects.get(name="Main Branch")
target = Branch.objects.get(name="Branch 2")

# Transfer 10kg chicken
material_id = 1  # Chicken
qty = Decimal('10.000')

source_qty = BranchQuantity.objects.get(branch=source, raw_material_id=material_id)
target_qty, _ = BranchQuantity.objects.get_or_create(
    branch=target, 
    raw_material_id=material_id,
    defaults={'quantity': Decimal('0.000')}
)

source_qty.quantity -= qty
target_qty.quantity += qty
source_qty.save()
target_qty.save()
```

---

## 🎯 Summary

**Everything is now branch-based:**
- ✅ Inventory tracked per branch
- ✅ Purchase orders add to specific branch
- ✅ Stock out removes from specific branch
- ✅ Customer orders use branch inventory
- ✅ Menu items check branch availability
- ✅ Database reset script with sample data

**To start fresh:**
```bash
python manage.py reset_inventory --confirm
```

**To test:**
1. Select different branches
2. Create purchase orders
3. Stock out materials
4. Create customer orders
5. See branch-specific inventory updates

**Everything works together seamlessly!** 🎉
