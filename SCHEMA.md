# Cloud Firestore Database Schema Architecture

Project ID: `balaji-enterprises-restaurant`

This document details the Firestore database schema, collection definitions, indexing strategy, and Security Rules enforcement for the Balaji Enterprises & Restaurant platform.

---

## 📁 Collections Overview

```
/users/{uid}             -> User profiles & roles (customer / admin)
/menu/{itemId}           -> Food & Amul Parlour menu items
/orders/{orderId}        -> Incoming & past customer orders
```

---

## 1. `users` Collection

Stores customer and administrator profile details. Created automatically on user signup or via custom claim scripts.

```json
{
  "uid": "String (Document ID = Auth UID)",
  "name": "String (Customer / Admin Full Name)",
  "email": "String (Registered Email Address)",
  "phone": "String (10-Digit Mobile / WhatsApp Number)",
  "role": "String ('customer' | 'admin')",
  "createdAt": "Timestamp (ISO 8601)",
  "updatedAt": "Timestamp (ISO 8601)"
}
```

### Security Rules Access:
- **Read**: User can read own profile (`request.auth.uid == userId`) or Admin role.
- **Write**: User can update own profile or Admin role.

---

## 2. `menu` Collection

Stores live restaurant menu items and Amul Parlour counter items.

```json
{
  "itemId": "String (Unique ID)",
  "name": "String (e.g., 'Paneer Butter Masala')",
  "description": "String (Short description & ingredient notes)",
  "price": "Number (Numerical price in ₹)",
  "category": "String ('Amul Ice Creams' | 'Meals & Thalis' | 'Main Course' | 'Snacks & Pizza' | 'Beverages' | 'Breads')",
  "imageUrl": "String (HTTPS URL of item photo)",
  "isAvailable": "Boolean (true = available for ordering, false = out of stock)",
  "isAmulSpecial": "Boolean (Optional flag for Amul Parlour items)",
  "isBestseller": "Boolean (Optional flag for top seller badge)",
  "createdAt": "Timestamp (ISO 8601)",
  "updatedAt": "Timestamp (ISO 8601)"
}
```

### Security Rules Access:
- **Read**: Public read access (`allow read: if true;`).
- **Write**: Restricted strictly to Admin role (`allow write: if isAdmin();`).

---

## 3. `orders` Collection

Stores incoming food orders placed by customers. Direct client writes are disabled; orders are created via the `placeOrder` callable Cloud Function with server-side price recalculation.

```json
{
  "orderId": "String (Unique Order Identifier e.g., 'ORD-482910')",
  "userId": "String (Customer Auth UID or 'guest')",
  "customerName": "String (Name of person receiving delivery)",
  "phone": "String (10-Digit contact number)",
  "address": "String (Complete delivery address in Deoria)",
  "instructions": "String (Optional delivery / cooking notes)",
  "items": [
    {
      "itemId": "String",
      "name": "String",
      "price": "Number (Verified menu price)",
      "quantity": "Number",
      "subtotal": "Number (price * quantity)"
    }
  ],
  "totalAmount": "Number (Recalculated server-side sum of subtotals + delivery)",
  "status": "String ('pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled')",
  "paymentStatus": "String ('unpaid' | 'verified')",
  "paymentMethod": "String ('UPI_QR_WHATSAPP')",
  "createdAt": "Timestamp (ISO 8601)",
  "updatedAt": "Timestamp (ISO 8601)"
}
```

### State Machine Transitions:
`pending` ➔ `confirmed` ➔ `preparing` ➔ `out_for_delivery` ➔ `delivered`  
*Or any state ➔ `cancelled` (Admin only)*

### Security Rules Access:
- **Read**: Authenticated user can read own orders (`resource.data.userId == request.auth.uid`) or Admin.
- **Write**: Blocked for direct client SDK calls (`allow create, update, delete: if false;`). Admin SDK in Cloud Functions writes order records.

---

## 🔍 Database Indexes

Defines composite indexes configured in `firestore.indexes.json`:

1. `orders`: `userId` ASC, `createdAt` DESC (Fast query for customer order tracking).
2. `orders`: `status` ASC, `createdAt` DESC (Fast filtering for Admin Dashboard).
