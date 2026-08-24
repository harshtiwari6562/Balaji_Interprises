const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { requireAdmin } = require('../middleware/requireAdmin');
const { db, auth } = require('../config/firebaseAdmin');

/**
 * Cloud Function trigger on user creation
 */
exports.onUserCreatedHandler = async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  const now = new Date().toISOString();

  await userRef.set({
    uid: user.uid,
    email: user.email || '',
    phone: user.phoneNumber || '',
    displayName: user.displayName || '',
    role: 'customer',
    createdAt: now,
    updatedAt: now
  }, { merge: true });
};

/**
 * Callable Function: setUserRole (Admin only or bootstrapping)
 */
exports.setUserRole = onCall(async (request) => {
  const { targetEmail, targetUid, role, secretKey } = request.data || {};

  // Allow bootstrapping admin if secretKey matches or if request is made by existing admin
  const BOOTSTRAP_KEY = process.env.ADMIN_BOOTSTRAP_KEY || 'BALAJI_ADMIN_274001_SECRET';

  const isBootstrap = secretKey && secretKey === BOOTSTRAP_KEY;
  if (!isBootstrap) {
    requireAdmin(request.auth);
  }

  if (!role || !['customer', 'admin'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Valid role (customer or admin) is required.');
  }

  let uid = targetUid;
  if (!uid && targetEmail) {
    const user = await auth.getUserByEmail(targetEmail);
    uid = user.uid;
  }

  if (!uid) {
    throw new HttpsError('invalid-argument', 'Target user UID or Email is required.');
  }

  // Set custom user claim
  await auth.setCustomUserClaims(uid, { role, admin: role === 'admin' });

  // Update user document in Firestore
  await db.collection('users').doc(uid).set({
    role: role,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return { success: true, uid, role };
});

/**
 * Callable Function: getUserProfile
 */
exports.getUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const doc = await db.collection('users').doc(request.auth.uid).get();
  if (!doc.exists) {
    return { uid: request.auth.uid, role: request.auth.token.role || 'customer' };
  }

  return { uid: doc.id, ...doc.data() };
});
