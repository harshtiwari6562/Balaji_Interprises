const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Validates cart items structure before placing order
 */
function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Cart must contain at least one item.');
  }

  for (const item of items) {
    if (!item.itemId || typeof item.itemId !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid or missing itemId in cart item.');
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new HttpsError('invalid-argument', 'Quantity must be a positive integer.');
    }
  }
}

/**
 * Validates delivery address and phone
 */
function validateOrderDetails(details) {
  if (!details || typeof details !== 'object') {
    throw new HttpsError('invalid-argument', 'Order details are missing.');
  }
  if (!details.phone || typeof details.phone !== 'string' || details.phone.trim().length < 10) {
    throw new HttpsError('invalid-argument', 'A valid 10-digit phone number is required.');
  }
  if (!details.address || typeof details.address !== 'string' || details.address.trim().length < 5) {
    throw new HttpsError('invalid-argument', 'A valid delivery address is required.');
  }
}

/**
 * Sanitizes input strings to prevent script injection
 */
function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  validateCartItems,
  validateOrderDetails,
  sanitizeText
};
