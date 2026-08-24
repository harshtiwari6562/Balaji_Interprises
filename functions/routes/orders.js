const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateCartItems, validateOrderDetails } = require('../middleware/validateInput');
const { createOrder, updateOrderStatus } = require('../services/orderService');
const { db } = require('../config/firebaseAdmin');

// Simple in-memory rate limiting map per instance (for extra protection)
const userLastOrderMap = new Map();

/**
 * Callable Function: placeOrder
 */
exports.placeOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to place an order.');
  }

  const uid = request.auth.uid;
  const now = Date.now();
  const lastOrderTime = userLastOrderMap.get(uid) || 0;

  // Rate limit: 10 seconds minimum between order submissions
  if (now - lastOrderTime < 10000) {
    throw new HttpsError('resource-exhausted', 'Please wait a few seconds before placing another order.');
  }
  userLastOrderMap.set(uid, now);

  const { cartItems, phone, address, customerName, instructions } = request.data || {};

  validateCartItems(cartItems);
  validateOrderDetails({ phone, address });

  const order = await createOrder(uid, cartItems, {
    customerName: customerName || request.auth.token.name || 'Customer',
    phone,
    address,
    instructions
  });

  return {
    success: true,
    orderId: order.orderId,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt
  };
});

/**
 * Callable Function: updateOrderStatus (Admin only)
 */
exports.updateOrderStatus = onCall(async (request) => {
  requireAdmin(request.auth);

  const { orderId, newStatus } = request.data || {};
  if (!orderId || !newStatus) {
    throw new HttpsError('invalid-argument', 'orderId and newStatus are required.');
  }

  const result = await updateOrderStatus(orderId, newStatus);
  return { success: true, ...result };
});

/**
 * Callable Function: cancelOrder (Admin or Order Owner if pending)
 */
exports.cancelOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required.');
  }

  const { orderId } = request.data || {};
  if (!orderId) {
    throw new HttpsError('invalid-argument', 'orderId is required.');
  }

  const orderRef = db.collection('orders').doc(orderId);
  const doc = await orderRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const orderData = doc.data();
  const isAdmin = request.auth.token.role === 'admin' || request.auth.token.admin === true;
  const isOwner = orderData.userId === request.auth.uid;

  if (!isAdmin && !isOwner) {
    throw new HttpsError('permission-denied', 'You cannot cancel this order.');
  }

  if (!isAdmin && orderData.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Orders can only be cancelled while in pending status.');
  }

  await orderRef.update({
    status: 'cancelled',
    updatedAt: new Date().toISOString()
  });

  return { success: true, orderId, status: 'cancelled' };
});
