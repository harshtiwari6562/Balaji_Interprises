const { db } = require('../config/firebaseAdmin');

async function getMenuItem(itemId) {
  const doc = await db.collection('menu').doc(itemId).get();
  if (!doc.exists) {
    return null;
  }
  return { itemId: doc.id, ...doc.data() };
}

async function addMenuItem(itemData) {
  const docRef = db.collection('menu').doc();
  const newItem = {
    name: itemData.name,
    description: itemData.description || '',
    price: Number(itemData.price),
    category: itemData.category || 'General',
    imageUrl: itemData.imageUrl || '',
    isAvailable: itemData.isAvailable !== undefined ? Boolean(itemData.isAvailable) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await docRef.set(newItem);
  return { itemId: docRef.id, ...newItem };
}

async function updateMenuItem(itemId, itemData) {
  const docRef = db.collection('menu').doc(itemId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Menu item not found.');
  }

  const updates = {
    ...itemData,
    updatedAt: new Date().toISOString()
  };
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.isAvailable !== undefined) updates.isAvailable = Boolean(updates.isAvailable);

  await docRef.update(updates);
  return { itemId, ...doc.data(), ...updates };
}

async function deleteMenuItem(itemId) {
  await db.collection('menu').doc(itemId).delete();
  return { success: true, itemId };
}

module.exports = {
  getMenuItem,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
};
