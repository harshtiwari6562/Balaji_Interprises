# Cloud Functions API Documentation

Project ID: `balaji-enterprises-restaurant`  
Region: `asia-south1`

All functions require HTTPS Callable interface (`httpsCallable(functions, 'functionName')`) or Auth Event Triggers.

---

## 1. Order Functions

### 1.1 `placeOrder`
Recalculates cart totals using live Firestore `/menu` prices, validates customer details, and creates a new order in `/orders`. Rate-limited to max 1 order per 10 seconds per user.

- **Auth Required**: Yes (`request.auth`)
- **Input Parameters**:
  ```json
  {
    "cartItems": [
      { "itemId": "item_1", "quantity": 2 }
    ],
    "customerName": "Ramesh Kumar",
    "phone": "9876543210",
    "address": "House 14, Kailashpuri, Deoria - 274001",
    "instructions": "Extra green chutney"
  }
  ```
- **Response Output**:
  ```json
  {
    "success": true,
    "orderId": "ORD-582910",
    "totalAmount": 480,
    "status": "pending",
    "createdAt": "2026-08-22T02:25:00.000Z"
  }
  ```

---

### 1.2 `updateOrderStatus`
Updates an existing order's status enforcing state machine logic (`pending` ➔ `confirmed` ➔ `preparing` ➔ `out_for_delivery` ➔ `delivered` / `cancelled`).

- **Auth Required**: Yes (`role == 'admin'` custom claim)
- **Input Parameters**:
  ```json
  {
    "orderId": "ORD-582910",
    "newStatus": "confirmed"
  }
  ```
- **Response Output**:
  ```json
  {
    "success": true,
    "orderId": "ORD-582910",
    "previousStatus": "pending",
    "newStatus": "confirmed"
  }
  ```

---

### 1.3 `cancelOrder`
Cancels an order if it is in `pending` status, or by admin at any stage.

- **Auth Required**: Yes (Order owner if pending, or Admin)
- **Input Parameters**:
  ```json
  {
    "orderId": "ORD-582910"
  }
  ```

---

## 2. Menu Management Functions

### 2.1 `addMenuItem`
Adds a new food or Amul Parlour item to the `/menu` collection.

- **Auth Required**: Yes (`role == 'admin'`)
- **Input Parameters**:
  ```json
  {
    "name": "Amul Butter Pav Bhaji",
    "description": "2 Butter pavs with spicy bhaji topped with Amul Butter",
    "price": 120,
    "category": "Snacks & Pizza",
    "imageUrl": "https://images.unsplash.com/...",
    "isAvailable": true
  }
  ```

---

### 2.2 `updateMenuItem`
Modifies an existing menu item's attributes or price.

- **Auth Required**: Yes (`role == 'admin'`)
- **Input Parameters**:
  ```json
  {
    "itemId": "item_1",
    "price": 250,
    "isAvailable": false
  }
  ```

---

### 2.3 `deleteMenuItem`
Removes a menu item from Firestore.

- **Auth Required**: Yes (`role == 'admin'`)
- **Input Parameters**:
  ```json
  {
    "itemId": "item_1"
  }
  ```

---

## 3. User & Admin Auth Functions

### 3.1 `setUserRole`
Bootstrap function to grant `admin` custom claim to specified user email or UID.

- **Auth Required**: Admin or valid bootstrap secret key (`BALAJI_ADMIN_274001_SECRET`)
- **Input Parameters**:
  ```json
  {
    "targetEmail": "rahul.pandey@balaji.com",
    "role": "admin",
    "secretKey": "BALAJI_ADMIN_274001_SECRET"
  }
  ```

---

### 3.2 `onUserCreated` (Auth Trigger)
Automated trigger that creates a matching `/users/{uid}` document with `role: 'customer'` whenever a user signs up.
