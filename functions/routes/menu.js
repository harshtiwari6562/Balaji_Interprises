const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { requireAdmin } = require('../middleware/requireAdmin');
const { addMenuItem, updateMenuItem, deleteMenuItem } = require('../services/menuService');

exports.addMenuItem = onCall(async (request) => {
  requireAdmin(request.auth);

  const { name, description, price, category, imageUrl, isAvailable } = request.data || {};
  if (!name || price === undefined || price === null || isNaN(price)) {
    throw new HttpsError('invalid-argument', 'Valid name and numerical price are required.');
  }

  const result = await addMenuItem({ name, description, price, category, imageUrl, isAvailable });
  return { success: true, item: result };
});

exports.updateMenuItem = onCall(async (request) => {
  requireAdmin(request.auth);

  const { itemId, ...updates } = request.data || {};
  if (!itemId) {
    throw new HttpsError('invalid-argument', 'itemId is required.');
  }

  const result = await updateMenuItem(itemId, updates);
  return { success: true, item: result };
});

exports.deleteMenuItem = onCall(async (request) => {
  requireAdmin(request.auth);

  const { itemId } = request.data || {};
  if (!itemId) {
    throw new HttpsError('invalid-argument', 'itemId is required.');
  }

  const result = await deleteMenuItem(itemId);
  return { success: true, ...result };
});
