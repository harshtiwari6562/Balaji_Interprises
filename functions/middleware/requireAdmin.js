const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Middleware / helper to enforce admin permissions
 * @param {object} auth - request.auth object from v2 onCall or v1 context.auth
 */
function requireAdmin(auth) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to perform this action.');
  }

  const token = auth.token || {};
  const isAdmin = token.role === 'admin' || token.admin === true;

  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Only administrators can perform this operation.');
  }
}

module.exports = { requireAdmin };
