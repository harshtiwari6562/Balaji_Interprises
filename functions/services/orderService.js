const { db } = require('../config/firebaseAdmin');
const { HttpsError } = require('firebase-functions/v2/https');

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

/**
 * Creates an order after server-side recalculation of totals from live menu prices
 */
async function createOrder(userId, cartItems, orderDetails) {
  let verifiedTotal = 0;
  const processedItems = [];

  for (const item of cartItems) {
    const menuDoc = await db.collection('menu').doc(item.itemId).get();
    if (!menuDoc.exists) {
      throw new HttpsError('not-found', `Item ID ${item.itemId} does not exist in live menu.`);
    }
    const menuData = menuDoc.data();
    if (!menuData.isAvailable) {
      throw new HttpsError('failed-precondition', `Item "${menuData.name}" is currently unavailable.`);
    }

    const price = Number(menuData.price);
    const subtotal = price * item.quantity;
    verifiedTotal += subtotal;

    processedItems.push({
      itemId: item.itemId,
      name: menuData.name,
      price: price,
      quantity: item.quantity,
      subtotal: subtotal
    });
  }

  const orderRef = db.collection('orders').doc();
  const now = new Date().toISOString();

  const newOrder = {
    orderId: orderRef.id,
    userId: userId,
    customerName: orderDetails.customerName || 'Customer',
    items: processedItems,
    totalAmount: verifiedTotal,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'UPI_QR_WHATSAPP',
    address: orderDetails.address.trim(),
    phone: orderDetails.phone.trim(),
    instructions: orderDetails.instructions ? orderDetails.instructions.trim() : '',
    createdAt: now,
    updatedAt: now
  };

  await orderRef.set(newOrder);
  return newOrder;
}

/**
 * Updates order status checking state machine constraints
 */
async function updateOrderStatus(orderId, newStatus) {
  const orderRef = db.collection('orders').doc(orderId);
  const doc = await orderRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const currentStatus = doc.data().status;

  if (currentStatus !== newStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new HttpsError(
        'failed-precondition',
        `Invalid status transition from '${currentStatus}' to '${newStatus}'.`
      );
    }
  }

  const updates = {
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  if (newStatus === 'delivered' || newStatus === 'confirmed') {
    updates.paymentStatus = 'verified';
  }

  await orderRef.update(updates);
  return { orderId, previousStatus: currentStatus, newStatus };
}

module.exports = {
  createOrder,
  updateOrderStatus
};
