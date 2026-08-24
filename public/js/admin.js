/* ==========================================================================
   Balaji Enterprises & Restaurant - Admin Dashboard Module (Rahul Pandey)
   ========================================================================== */

const AdminDashboard = {
  orders: [],
  menuItems: [],
  activeTab: 'orders',
  statusFilter: 'All',
  updatingOrders: new Set(),

  init() {
    window.addEventListener('auth-state-changed', (e) => {
      const { user, role } = e.detail;
      if (!user || role !== 'admin') {
        this.renderAccessDenied();
      } else {
        this.loadAdminView();
      }
    });

    if (AuthManager.currentUser) {
      if (AuthManager.userRole === 'admin') {
        this.loadAdminView();
      } else {
        this.renderAccessDenied();
      }
    }
  },

  renderAccessDenied() {
    const mainContainer = document.getElementById('admin-container');
    if (!mainContainer) return;

    mainContainer.innerHTML = `
      <div class="summary-card" style="max-width: 500px; margin: 4rem auto; text-align: center; padding: 3rem 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2 style="color: var(--text-dark); margin-bottom: 0.5rem;">Admin Access Restricted</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
          This dashboard is reserved for Rahul Pandey (Restaurant Owner & Admin).
        </p>
        <div style="background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; text-align: left; margin-bottom: 1.5rem;">
          <strong>Quick Admin Bootstrap:</strong><br/>
          Log in with your registered admin credentials. If you are setting up the store for the first time, use the administrative setup link.
        </div>
        <a href="/login.html" class="btn btn-primary">Go to Login</a>
      </div>
    `;
  },

  loadAdminView() {
    const mainContainer = document.getElementById('admin-container');
    if (!mainContainer) return;

    mainContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
        <div>
          <h1 style="font-size: 2rem; color: var(--text-dark);">Owner Dashboard</h1>
          <p style="color: var(--text-muted);">Balaji Enterprises & Restaurant / Amul Parlour, Deoria</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button id="tab-orders-btn" class="btn ${this.activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}" onclick="AdminDashboard.switchTab('orders')">
            📦 Incoming Orders (<span id="pending-count-badge">0</span>)
          </button>
          <button id="tab-menu-btn" class="btn ${this.activeTab === 'menu' ? 'btn-primary' : 'btn-outline'}" onclick="AdminDashboard.switchTab('menu')">
            🍽️ Menu Management
          </button>
        </div>
      </div>

      <!-- Overview Metrics Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
        <div class="summary-card" style="border-left: 4px solid var(--primary);">
          <div style="font-size: 0.85rem; color: var(--text-muted);">Total Orders</div>
          <div id="stat-total-orders" style="font-size: 1.8rem; font-weight: 800; color: var(--text-dark);">0</div>
        </div>
        <div class="summary-card" style="border-left: 4px solid var(--status-pending);">
          <div style="font-size: 0.85rem; color: var(--text-muted);">Pending Action</div>
          <div id="stat-pending-orders" style="font-size: 1.8rem; font-weight: 800; color: var(--status-pending);">0</div>
        </div>
        <div class="summary-card" style="border-left: 4px solid var(--accent-green);">
          <div style="font-size: 0.85rem; color: var(--text-muted);">Total Revenue</div>
          <div id="stat-total-revenue" style="font-size: 1.8rem; font-weight: 800; color: var(--accent-green);">₹0</div>
        </div>
      </div>

      <!-- Main Dynamic Content Area -->
      <div id="admin-tab-content"></div>
    `;

    this.listenToAllOrders();
    this.fetchAdminMenuItems();
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('tab-orders-btn').className = `btn ${tab === 'orders' ? 'btn-primary' : 'btn-outline'}`;
    document.getElementById('tab-menu-btn').className = `btn ${tab === 'menu' ? 'btn-primary' : 'btn-outline'}`;

    if (tab === 'orders') {
      this.renderOrdersTab();
    } else {
      this.renderMenuTab();
    }
  },

  listenToAllOrders() {
    if (!window.db) return;

    window.db.collection('orders').onSnapshot((snapshot) => {
      this.orders = [];
      snapshot.forEach(doc => {
        this.orders.push({ orderId: doc.id, ...doc.data() });
      });

      this.orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      this.updateStats();

      if (this.activeTab === 'orders') {
        this.renderOrdersTab();
      }
    });
  },

  async fetchAdminMenuItems() {
    if (!window.db) return;
    try {
      const snapshot = await window.db.collection('menu').get();
      this.menuItems = [];
      snapshot.forEach(doc => {
        this.menuItems.push({ itemId: doc.id, ...doc.data() });
      });
      if (this.activeTab === 'menu') {
        this.renderMenuTab();
      }
    } catch (e) {
      console.error('Error fetching menu items for admin:', e);
    }
  },

  updateStats() {
    const totalOrdersEl = document.getElementById('stat-total-orders');
    const pendingOrdersEl = document.getElementById('stat-pending-orders');
    const totalRevenueEl = document.getElementById('stat-total-revenue');
    const pendingBadge = document.getElementById('pending-count-badge');

    const totalOrders = this.orders.length;
    const pendingOrders = this.orders.filter(o => o.status === 'pending').length;
    const totalRevenue = this.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue}`;
    if (pendingBadge) pendingBadge.textContent = pendingOrders;
  },

  renderOrdersTab() {
    const contentArea = document.getElementById('admin-tab-content');
    if (!contentArea) return;

    const filterOptions = ['All', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    contentArea.innerHTML = `
      <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;">
        ${filterOptions.map(f => `
          <button class="cat-btn ${this.statusFilter === f ? 'active' : ''}" onclick="AdminDashboard.setStatusFilter('${f}')">
            ${f.replace(/_/g, ' ').toUpperCase()}
          </button>
        `).join('')}
      </div>

      <div id="admin-orders-list"></div>
    `;

    const filtered = this.statusFilter === 'All' 
      ? this.orders 
      : this.orders.filter(o => o.status === this.statusFilter);

    const listContainer = document.getElementById('admin-orders-list');
    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="summary-card" style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted);">No orders found matching filter "${this.statusFilter}".</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(order => `
      <div class="summary-card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.2rem; color: var(--text-dark);">
              Order #${order.orderId} - ₹${order.totalAmount}
            </h3>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Customer: <strong>${order.customerName || 'Guest'}</strong> (${order.phone}) | ${new Date(order.createdAt).toLocaleString('en-IN')}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-dark); margin-top: 0.25rem;">
              📍 Delivery Address: ${order.address}
            </div>
          </div>
          <div>
            <span class="badge" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; background-color: var(--primary-light); color: var(--primary-dark);">
              Status: ${order.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem;">
          <strong>Order Items:</strong>
          ${(order.items || []).map(i => `
            <div style="font-size: 0.88rem; display: flex; justify-content: space-between;">
              <span>• ${i.name} × ${i.quantity}</span>
              <span>₹${i.subtotal || (i.price * i.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 0.85rem;">
          ${order.status === 'pending' ? `
            <button class="btn btn-sm btn-success" onclick="AdminDashboard.updateStatus('${order.orderId}', 'confirmed', this)">
              ✓ Confirm Order
            </button>
          ` : ''}
          ${order.status === 'confirmed' ? `
            <button class="btn btn-sm btn-primary" onclick="AdminDashboard.updateStatus('${order.orderId}', 'preparing', this)">
              🍳 Start Preparing
            </button>
          ` : ''}
          ${order.status === 'preparing' ? `
            <button class="btn btn-sm btn-outline" style="border-color: var(--status-delivery); color: var(--status-delivery);" onclick="AdminDashboard.updateStatus('${order.orderId}', 'out_for_delivery', this)">
              🛵 Send Out for Delivery
            </button>
          ` : ''}
          ${order.status === 'out_for_delivery' ? `
            <button class="btn btn-sm btn-success" onclick="AdminDashboard.updateStatus('${order.orderId}', 'delivered', this)">
              🎉 Mark Delivered
            </button>
          ` : ''}
          ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
            <button class="btn btn-sm btn-outline" style="border-color: var(--status-cancelled); color: var(--status-cancelled);" onclick="AdminDashboard.updateStatus('${order.orderId}', 'cancelled', this)">
              ✕ Cancel Order
            </button>
          ` : ''}
          <a href="https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hello ${order.customerName}, regarding your Balaji Restaurant Order #${order.orderId}: Status is now ${order.status}.`)}" target="_blank" class="btn btn-sm btn-whatsapp">
            💬 WhatsApp Customer
          </a>
        </div>
      </div>
    `).join('');
  },

  setStatusFilter(filter) {
    this.statusFilter = filter;
    this.renderOrdersTab();
  },

  async updateStatus(orderId, newStatus, btnElement) {
    if (!this.updatingOrders) this.updatingOrders = new Set();
    if (this.updatingOrders.has(orderId)) return;

    this.updatingOrders.add(orderId);

    let originalText = '';
    if (btnElement) {
      btnElement.disabled = true;
      originalText = btnElement.innerHTML;
      btnElement.innerHTML = 'Updating...';
    }

    try {
      if (window.functions) {
        const updateFunc = window.functions.httpsCallable('updateOrderStatus');
        await updateFunc({ orderId, newStatus });
      } else if (window.db) {
        await window.db.collection('orders').doc(orderId).update({
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }
      CartManager.showToast(`Order #${orderId} status updated to "${newStatus}"!`, 'success');
    } catch (e) {
      console.error('Error updating status:', e);
      CartManager.showToast(e.message || 'Failed to update order status.', 'error');
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
      }
    } finally {
      this.updatingOrders.delete(orderId);
    }
  },

  renderMenuTab() {
    const contentArea = document.getElementById('admin-tab-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.4rem; color: var(--text-dark);">Live Menu Items (${this.menuItems.length})</h2>
        <button class="btn btn-primary btn-sm" onclick="AdminDashboard.openAddMenuModal()">
          + Add New Menu Item
        </button>
      </div>

      <div class="summary-card" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
              <th style="padding: 0.75rem;">Item</th>
              <th style="padding: 0.75rem;">Category</th>
              <th style="padding: 0.75rem;">Price</th>
              <th style="padding: 0.75rem;">Available</th>
              <th style="padding: 0.75rem;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.menuItems.map(item => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
                  <img src="${item.imageUrl}" width="40" height="40" style="border-radius: 6px; object-fit: cover;" />
                  <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${item.description.substring(0, 40)}...</div>
                  </div>
                </td>
                <td style="padding: 0.75rem;">${item.category}</td>
                <td style="padding: 0.75rem; font-weight: 700;">₹${item.price}</td>
                <td style="padding: 0.75rem;">
                  <button class="btn btn-sm ${item.isAvailable ? 'btn-success' : 'btn-outline'}" onclick="AdminDashboard.toggleAvailability('${item.itemId}', ${!item.isAvailable})">
                    ${item.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td style="padding: 0.75rem;">
                  <button class="btn btn-sm btn-outline" style="border-color: var(--status-cancelled); color: var(--status-cancelled);" onclick="AdminDashboard.deleteMenuItem('${item.itemId}')">
                    Delete
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openAddMenuModal() {
    const name = prompt('Item Name:');
    if (!name) return;
    const price = prompt('Price in ₹:');
    if (!price || isNaN(price)) return;
    const category = prompt('Category (e.g. Amul Ice Creams, Main Course, Snacks & Pizza, Meals & Thalis, Beverages, Breads):', 'Main Course');
    const description = prompt('Short Description:');
    const imageUrl = prompt('Image URL (optional):', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80');

    this.saveNewMenuItem({ name, price: Number(price), category, description, imageUrl });
  },

  async saveNewMenuItem(data) {
    try {
      if (window.functions) {
        const addFunc = window.functions.httpsCallable('addMenuItem');
        await addFunc(data);
      } else if (window.db) {
        const ref = window.db.collection('menu').doc();
        await ref.set({
          ...data,
          itemId: ref.id,
          isAvailable: true,
          createdAt: new Date().toISOString()
        });
      }
      CartManager.showToast('New menu item added!', 'success');
      this.fetchAdminMenuItems();
    } catch (e) {
      console.error('Error adding menu item:', e);
      CartManager.showToast('Failed to add item.', 'error');
    }
  },

  async toggleAvailability(itemId, isAvailable) {
    try {
      if (window.db) {
        await window.db.collection('menu').doc(itemId).update({ isAvailable });
      }
      CartManager.showToast('Availability updated', 'info');
      this.fetchAdminMenuItems();
    } catch (e) {
      console.error('Error toggling availability:', e);
    }
  },

  async deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      if (window.db) {
        await window.db.collection('menu').doc(itemId).delete();
      }
      CartManager.showToast('Item deleted.', 'info');
      this.fetchAdminMenuItems();
    } catch (e) {
      console.error('Error deleting item:', e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminDashboard.init();
});
