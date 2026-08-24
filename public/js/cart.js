/* ==========================================================================
   Balaji Enterprises & Restaurant - Client Cart State Manager
   ========================================================================== */

const CART_KEY = 'balaji_restaurant_cart';

const CartManager = {
  getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading cart from localStorage', e);
      return [];
    }
  },

  saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      this.updateCartBadge();
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  },

  addToCart(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(i => i.itemId === item.itemId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += (item.quantity || 1);
    } else {
      cart.push({
        itemId: item.itemId,
        name: item.name,
        price: Number(item.price),
        category: item.category || 'General',
        imageUrl: item.imageUrl || '',
        quantity: item.quantity || 1
      });
    }

    this.saveCart(cart);
    this.showToast(`Added "${item.name}" to cart!`, 'success');
  },

  updateQuantity(itemId, newQty) {
    let cart = this.getCart();
    if (newQty <= 0) {
      cart = cart.filter(i => i.itemId !== itemId);
    } else {
      const item = cart.find(i => i.itemId === itemId);
      if (item) {
        item.quantity = newQty;
      }
    }
    this.saveCart(cart);
  },

  removeFromCart(itemId) {
    const cart = this.getCart().filter(i => i.itemId !== itemId);
    this.saveCart(cart);
    this.showToast('Item removed from cart', 'info');
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
    this.updateCartBadge();
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
  },

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  updateCartBadge() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : 'ℹ'}</span>
      <div>${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
};

// Initialize cart badge on DOM load
document.addEventListener('DOMContentLoaded', () => {
  CartManager.updateCartBadge();
});
