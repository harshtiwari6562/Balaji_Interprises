# Balaji Enterprises & Restaurant / Amul Parlour Platform

Online food ordering & delivery web application built for **Balaji Enterprises & Restaurant** (Operating an official Amul Parlour counter in Deoria, UP). Owned and operated by **Rahul Pandey**.

---

## 🌟 Key Features

- **Live Restaurant & Amul Parlour Menu**: Category filters (Amul Ice Creams, Thalis & Meals, Main Course, Snacks & Pizza, Beverages, Breads), search bar, and real-time availability badges.
- **Client Cart & Persistence**: `localStorage` backed shopping cart with quantity steppers and real-time total updates.
- **Server-Verified Order Placement**: Callable Cloud Function (`placeOrder`) recalculating totals from live Firestore `/menu` prices to prevent client-side price tampering.
- **Instant UPI QR & WhatsApp Confirmation**: Scan-to-pay static UPI QR code + pre-filled WhatsApp (`wa.me`) deep link with Order ID and total amount for owner verification.
- **Real-Time Customer Order Tracking**: Step-by-step progress timeline (`Pending` -> `Confirmed` -> `Preparing` -> `Out for Delivery` -> `Delivered`).
- **Owner Admin Dashboard**: Protected route (`/admin.html`) for Rahul Pandey with real-time order state machine updates, sales revenue metrics, and menu item CRUD actions.
- **Security Hardened**: Deny-by-default Firestore rules, input validation, role-based access control, security headers, and rate limiting.
- **SEO Optimized**: `schema.org` `Restaurant` JSON-LD structured data, meta descriptions, Open Graph & Twitter Cards, `sitemap.xml`, and `robots.txt`.

---

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System with Terracotta `#C85A32` & Cream `#FAF7F2` theme), Vanilla JavaScript (Modular ES6).
- **Backend Services**: Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions (Node.js 18), Firebase Hosting.
- **Project ID**: `balaji-enterprises-restaurant`

---

## 🚀 Running Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/RahulPandey-Balaji/balaji-enterprises-restaurant.git
   cd balaji-enterprises-restaurant
   ```

2. **Serve Static Web App**:
   ```bash
   npx serve public
   ```
   Open `http://localhost:3000` in your browser.

3. **Run Functions Locally (Optional)**:
   ```bash
   cd functions
   npm install
   npm run serve
   ```

---

## 📦 Firebase Deployment Instructions

Deploy to live Firebase Hosting and Cloud Functions using the Firebase CLI:

```bash
# Login to Firebase
npx firebase login

# Select active project
npx firebase use balaji-enterprises-restaurant

# Deploy all services (Hosting, Functions, Firestore Rules, Storage Rules)
npm run deploy
```

Live Deployed URL: [https://balaji-enterprises-restaurant.web.app](https://balaji-enterprises-restaurant.web.app)

---

## 📍 Store Information

- **Business Name**: Balaji Enterprises & Restaurant / Amul Parlour
- **Owner**: Rahul Pandey
- **Address**: Gorakhpur Rd, Kailashpuri, Deoria, Uttar Pradesh - 274001
- **Phone / WhatsApp**: +91 9450867890
- **Hours**: 9:00 AM – 10:30 PM (7 Days a Week)
