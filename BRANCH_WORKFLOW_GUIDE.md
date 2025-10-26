# Branch-Based Inventory Frontend Implementation Guide

## Overview
Your inventory system now requires **branch selection** to view and manage inventory. Each branch has its own:
- Raw material quantities
- Purchase orders
- Stock out operations
- Customer orders

---

## Frontend Workflow

### 1. Initial Page Load - Branch Selection Required

When users open the inventory page, they **must first select a branch**:

```tsx
// Step 1: Load all branches on page load
const [branches, setBranches] = useState([]);
const [selectedBranch, setSelectedBranch] = useState(null);

useEffect(() => {
  fetch('/api/branches/')
    .then(res => res.json())
    .then(data => setBranches(data));
}, []);

// Step 2: Render branch selector (required)
<select onChange={(e) => setSelectedBranch(e.target.value)}>
  <option value="">-- Select Branch --</option>
  {branches.map(branch => (
    <option key={branch.id} value={branch.id}>{branch.name}</option>
  ))}
</select>
```

**IMPORTANT**: Until a branch is selected, show a message like:
> "Please select a branch to view inventory"

---

### 2. View Inventory for Selected Branch

Once a branch is selected, fetch that branch's inventory:

```tsx
const [inventory, setInventory] = useState([]);

useEffect(() => {
  if (!selectedBranch) return;
  
  fetch(`/api/branch-quantities/by_branch/?branch_id=${selectedBranch}`)
    .then(res => res.json())
    .then(data => setInventory(data));
}, [selectedBranch]);

// Display inventory table
<table>
  <thead>
    <tr>
      <th>Material Name</th>
      <th>Quantity</th>
      <th>Unit</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {inventory.map(item => (
      <tr key={item.id}>
        <td>{item.raw_material_name}</td>
        <td>{item.quantity}</td>
        <td>{item.raw_material_unit}</td>
        <td>
          {item.is_low_stock && <span className="text-red-500">Low Stock</span>}
          {item.needs_reorder && <span className="text-yellow-500">Needs Reorder</span>}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**API Endpoint**: `GET /api/branch-quantities/by_branch/?branch_id={id}`

**Response Structure**:
```json
[
  {
    "id": 1,
    "branch": 1,
    "branch_name": "Main Branch",
    "raw_material": 5,
    "raw_material_name": "Chicken Breast",
    "raw_material_unit": "kg",
    "quantity": "25.500",
    "is_low_stock": false,
    "needs_reorder": false,
    "created_at": "2024-10-26T10:00:00Z",
    "updated_at": "2024-10-26T12:00:00Z"
  }
]
```

---

### 3. Create Purchase Order (Branch-Specific)

Purchase orders **must include a branch** and will add inventory to that branch only:

```tsx
const createPurchaseOrder = async (orderData) => {
  const payload = {
    purchase_date: "2024-10-26",
    branch: selectedBranch,  // REQUIRED
    notes: "Weekly stock replenishment",
    items: [
      {
        name: "Chicken Breast",
        unit: 1,  // Unit ID (e.g., kg)
        quantity: 50,
        unit_price: 150,
        shelf_life_days: 7,
        material_type: "raw"
      }
    ]
  };

  const response = await fetch('/api/purchase-orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    // Refresh inventory for this branch
    fetchBranchInventory(selectedBranch);
  }
};
```

**API Endpoint**: `POST /api/purchase-orders/`

**What happens**:
- Creates purchase order for the selected branch
- Adds materials to **BranchQuantity** for that branch
- Creates stock transactions
- Returns updated purchase order data

---

### 4. View Purchase Orders (Branch-Specific)

View only purchase orders for the selected branch:

```tsx
const [purchaseOrders, setPurchaseOrders] = useState([]);

useEffect(() => {
  if (!selectedBranch) return;
  
  fetch(`/api/purchase-orders/?branch_id=${selectedBranch}`)
    .then(res => res.json())
    .then(data => setPurchaseOrders(data));
}, [selectedBranch]);
```

**API Endpoint**: `GET /api/purchase-orders/?branch_id={id}`

---

### 5. Stock Out (Branch-Specific)

⚠️ **NOTE**: The stock out endpoint needs updating to work with branch quantities. Here's the intended usage:

```tsx
const stockOut = async (materialId, quantity, notes) => {
  const payload = {
    raw_material_id: materialId,
    branch_id: selectedBranch,  // REQUIRED
    quantity: quantity,
    notes: notes,
    force_expired: false
  };

  const response = await fetch('/api/stock-out/stock_out/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    // Refresh inventory
    fetchBranchInventory(selectedBranch);
  }
};
```

**API Endpoint**: `POST /api/stock-out/stock_out/`

---

### 6. Customer Orders (Branch-Specific)

Customer orders deduct ingredients from the specified branch:

```tsx
const createCustomerOrder = async (orderData) => {
  const payload = {
    customer_name: "John Doe",
    customer_phone: "09123456789",
    branch: selectedBranch,  // REQUIRED - ingredients come from this branch
    items: [
      {
        menu_item: 5,  // Menu item ID
        quantity: 2
      }
    ],
    special_requests: "No onions",
    processed_by_name: "Staff Name"
  };

  const response = await fetch('/api/customer-orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};
```

**What happens**:
1. System checks if menu item has a recipe
2. For each ingredient in the recipe:
   - Calculates required quantity based on order quantity
   - Checks if **that branch** has enough stock
   - Deducts from **BranchQuantity** for that branch only
3. Creates stock transactions
4. Creates the order

**Error handling**:
```tsx
const response = await fetch('/api/customer-orders/', {
  method: 'POST',
  body: JSON.stringify(orderData)
});

if (!response.ok) {
  const error = await response.json();
  // Error will be like:
  // "Insufficient stock for Chicken Breast at Main Branch. 
  //  Available: 10 kg, Required: 15 kg"
  alert(error.error || error.detail);
}
```

---

### 7. View Customer Orders (Branch-Specific)

```tsx
useEffect(() => {
  if (!selectedBranch) return;
  
  fetch(`/api/customer-orders/?branch_id=${selectedBranch}`)
    .then(res => res.json())
    .then(data => setOrders(data));
}, [selectedBranch]);
```

**API Endpoint**: `GET /api/customer-orders/?branch_id={id}`

---

## Complete API Reference

### Branches
- `GET /api/branches/` - List all branches
- `POST /api/branches/` - Create new branch
- `GET /api/branches/{id}/` - Get branch details

### Branch Inventory
- `GET /api/branch-quantities/by_branch/?branch_id={id}` - **Main inventory endpoint**
- `GET /api/branch-quantities/?branch_id={id}` - Alternative (returns same data)
- `GET /api/branch-quantities/low_stock/` - Get low stock items across all branches
- `POST /api/branch-quantities/` - Create/update branch quantity (admin)

### Purchase Orders
- `GET /api/purchase-orders/?branch_id={id}` - Get purchase orders for branch
- `POST /api/purchase-orders/` - Create purchase order (requires `branch` field)
- `GET /api/purchase-orders/{id}/` - Get purchase order details

### Stock Out
- `POST /api/stock-out/stock_out/` - Stock out from branch (requires `branch_id`)

### Customer Orders
- `GET /api/customer-orders/?branch_id={id}` - Get orders for branch
- `POST /api/customer-orders/` - Create order (requires `branch` field)
- `GET /api/customer-orders/{id}/` - Get order details

### Raw Materials (Global View)
- `GET /api/rawmaterials/` - List all materials with all branch quantities
- `GET /api/rawmaterials/{id}/` - Get material details with branch breakdown

---

## UI Recommendations

### Branch Selector Component
```tsx
function BranchSelector({ selectedBranch, onBranchChange, branches }) {
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Branch to View Inventory
      </label>
      <select
        value={selectedBranch || ''}
        onChange={(e) => onBranchChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      >
        <option value="">-- Select a Branch --</option>
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      {!selectedBranch && (
        <p className="mt-2 text-sm text-red-600">
          ⚠️ Please select a branch to view inventory and perform operations
        </p>
      )}
    </div>
  );
}
```

### Inventory Page Structure
```tsx
function InventoryPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [inventory, setInventory] = useState([]);

  // Load branches on mount
  useEffect(() => {
    fetch('/api/branches/').then(r => r.json()).then(setBranches);
  }, []);

  // Load inventory when branch changes
  useEffect(() => {
    if (!selectedBranch) {
      setInventory([]);
      return;
    }
    
    fetch(`/api/branch-quantities/by_branch/?branch_id=${selectedBranch}`)
      .then(r => r.json())
      .then(setInventory);
  }, [selectedBranch]);

  return (
    <div>
      <h1>Inventory Management</h1>
      
      <BranchSelector
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
      />

      {!selectedBranch ? (
        <div className="text-center py-12 text-gray-500">
          <p>Select a branch above to view its inventory</p>
        </div>
      ) : (
        <div>
          <h2>Inventory for {branches.find(b => b.id == selectedBranch)?.name}</h2>
          <InventoryTable data={inventory} />
        </div>
      )}
    </div>
  );
}
```

---

## Data Flow Examples

### Example 1: Viewing Branch Inventory
```
User Action: Selects "Main Branch" from dropdown
↓
Frontend: GET /api/branch-quantities/by_branch/?branch_id=1
↓
Backend: Returns all raw materials with quantities for Branch #1
↓
Frontend: Displays table with materials, quantities, and stock status
```

### Example 2: Creating Purchase Order
```
User Action: Fills out purchase order form for "Main Branch"
↓
Frontend: POST /api/purchase-orders/ with branch: 1
↓
Backend: 
  1. Creates PurchaseOrder with branch_id=1
  2. For each item, creates/updates BranchQuantity for branch_id=1
  3. Creates StockTransaction records
↓
Frontend: Refreshes inventory list for Branch #1
```

### Example 3: Customer Orders Menu Item
```
User Action: Customer orders "Chicken Sandwich" at "Branch 2"
↓
Frontend: POST /api/customer-orders/ with branch: 2
↓
Backend:
  1. Gets recipe for "Chicken Sandwich"
  2. Calculates ingredient quantities needed
  3. Checks BranchQuantity for each ingredient at Branch #2
  4. If sufficient: Deducts from Branch #2 quantities
  5. If insufficient: Returns error with details
  6. Creates StockTransaction records
↓
Frontend: Shows success or error message
```

---

## Migration Checklist

Before going live with branch-based inventory:

- [ ] Run migrations: `python manage.py migrate`
- [ ] Create initial branches via admin or API
- [ ] Migrate existing inventory data to branch quantities
- [ ] Test purchase order creation for each branch
- [ ] Test customer order creation and stock deduction
- [ ] Verify stock transactions are created correctly
- [ ] Test branch selector on frontend
- [ ] Ensure all operations require branch selection
- [ ] Add branch name to all relevant displays

---

## Common Pitfalls to Avoid

1. **Forgetting to include branch in requests**
   - ❌ Creating purchase orders without `branch` field
   - ✅ Always include `branch` in POST requests

2. **Not filtering by branch**
   - ❌ Showing all purchase orders from all branches
   - ✅ Use `?branch_id={id}` parameter

3. **Using old quantity field**
   - ❌ Trying to access `raw_material.quantity`
   - ✅ Use `BranchQuantity` or `get_total_quantity()`

4. **Not handling branch selection**
   - ❌ Showing empty inventory without explanation
   - ✅ Show "Select branch" message when none selected

5. **Cross-branch operations**
   - ❌ Trying to stock out from a different branch
   - ✅ Ensure all operations use the selected branch

---

## Future Enhancements

Consider implementing:

1. **Branch Transfers**: Move stock between branches
2. **Branch-specific Alerts**: Low stock alerts per branch
3. **Branch Performance**: Sales/usage statistics per branch
4. **Multi-branch View**: Dashboard showing all branches
5. **Branch Permissions**: Restrict users to specific branches

---

## Support

For issues or questions:
- Check `BRANCH_INVENTORY_CHANGES.md` for technical details
- Review API responses in browser dev tools
- Verify branch_id is being sent in requests
- Check backend logs for error details

**Last Updated**: October 26, 2024
