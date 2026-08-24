const { setGlobalOptions } = require('firebase-functions/v2');
const { auth } = require('firebase-functions/v1');

// Enforce Asia (Mumbai) or default region for functions performance
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const ordersRoutes = require('./routes/orders');
const menuRoutes = require('./routes/menu');
const usersRoutes = require('./routes/users');

// Export Callable Cloud Functions
exports.placeOrder = ordersRoutes.placeOrder;
exports.updateOrderStatus = ordersRoutes.updateOrderStatus;
exports.cancelOrder = ordersRoutes.cancelOrder;

exports.addMenuItem = menuRoutes.addMenuItem;
exports.updateMenuItem = menuRoutes.updateMenuItem;
exports.deleteMenuItem = menuRoutes.deleteMenuItem;

exports.setUserRole = usersRoutes.setUserRole;
exports.getUserProfile = usersRoutes.getUserProfile;

// Export Auth Triggers
exports.onUserCreated = auth.user().onCreate(usersRoutes.onUserCreatedHandler);
