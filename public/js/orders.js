/* ==========================================================================
   Balaji Enterprises & Restaurant - Real-Time Customer Order Tracker
   ========================================================================== */

const OrderTracker = {
  unsubscribe: null,

  init() {
    window.addEventListener('auth-state-changed', (e) => {
      const { user } = e.detail;
      if (user) {
        this.listenToUserOrders(user.uid);
      } else {
        this.showLoginRequired();
      }
    });

    if (AuthManager.currentUser) {
      this.listenToUserOrders(AuthManager.currentUser.uid);
    } else {
      this.showLoginRequired();
    }
  },

  showLoginRequired() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    container.innerHTML = `
      <div class="summary-card" style="text-align: center; padding: 3rem 1.5rem; margin-top: 2rem;">
        <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">Login to Track Your Orders</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Please log in to view real-time order status and history.</p>
        <a href="/login.html" class="btn btn-primary">Login / Sign Up</a>
      </div>
    `;
  },

  listenToUserOrders(userId) {
    const container = document.getElementById('orders-list-container');
    if (!container || !window.db) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: var(--text-muted);">Fetching your active orders...</p>
      </div>
    `;

    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = window.db.collection('orders')
      .where('userId', '==', userId)
      .onSnapshot((snapshot) => {
        if (snapshot.empty) {
          container.innerHTML = `
            <div class="summary-card" style="text-align: center; padding: 3rem 1.5rem; margin-top: 2rem;">
              <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">No Orders Yet</h3>
              <p style="color: var(--text-muted); margin-bottom: 1.5rem;">You haven't placed any food orders with us yet.</p>
              <a href="/menu.html" class="btn btn-primary">Explore Delicious Menu</a>
            </div>
          `;
          return;
        }

        const orders = [];
        snapshot.forEach(doc => {
          orders.push({ orderId: doc.id, ...doc.data() });
        });

        // Sort descending by createdAt
        orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        this.renderOrders(orders, container);
      }, (error) => {
        console.error('Error listening to orders:', error);
        container.innerHTML = `
          <div class="summary-card" style="text-align: center; padding: 2rem; color: var(--status-cancelled);">
            Failed to load live orders. Please check network connection.
          </div>
        `;
      });
  },

  renderOrders(orders, container) {
    const STATUS_MAP = {
      pending: { label: 'Pending Confirmation', color: 'var(--status-pending)', step: 1 },
      confirmed: { label: 'Order Confirmed', color: 'var(--status-confirmed)', step: 2 },
      preparing: { label: 'Preparing Food', color: 'var(--status-preparing)', step: 3 },
      out_for_delivery: { label: 'Out for Delivery', color: 'var(--status-delivery)', step: 4 },
      delivered: { label: 'Delivered', color: 'var(--status-delivered)', step: 5 },
      cancelled: { label: 'Cancelled', color: 'var(--status-cancelled)', step: 0 }
    };

    container.innerHTML = orders.map(order => {
      const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
      const stepNum = statusInfo.step;
      const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '';

      return `
        <div class="summary-card" style="margin-bottom: 2rem; border-left: 5px solid ${statusInfo.color};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Order #${order.orderId}</div>
              <h3 style="font-size: 1.25rem; color: var(--text-dark);">${formattedDate}</h3>
            </div>
            <span class="badge" style="background-color: ${statusInfo.color}; color: #fff; font-size: 0.85rem; padding: 0.4rem 0.8rem;">
              ${statusInfo.label}
            </span>
          </div>

          ${order.status !== 'cancelled' ? `
            <div class="timeline">
              <div class="timeline-step ${stepNum >= 1 ? (stepNum === 1 ? 'active' : 'completed') : ''}">
                <div class="timeline-icon">1</div>
                <div class="timeline-label">Pending</div>
              </div>
              <div class="timeline-step ${stepNum >= 2 ? (stepNum === 2 ? 'active' : 'completed') : ''}">
                <div class="timeline-icon">2</div>
                <div class="timeline-label">Confirmed</div>
              </div>
              <div class="timeline-step ${stepNum >= 3 ? (stepNum === 3 ? 'active' : 'completed') : ''}">
                <div class="timeline-icon">3</div>
                <div class="timeline-label">Preparing</div>
              </div>
              <div class="timeline-step ${stepNum >= 4 ? (stepNum === 4 ? 'active' : 'completed') : ''}">
                <div class="timeline-icon">4</div>
                <div class="timeline-label">On the Way</div>
              </div>
              <div class="timeline-step ${stepNum >= 5 ? 'completed' : ''}">
                <div class="timeline-icon">5</div>
                <div class="timeline-label">Delivered</div>
              </div>
            </div>
          ` : `
            <div style="background: #FDF2F2; color: #9B1C1C; padding: 1rem; border-radius: var(--radius-md); margin: 1rem 0;">
              This order has been cancelled by the restaurant or administrator.
            </div>
          `}

          <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 1rem; margin-top: 1rem;">
            <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--text-dark);">Items Ordered</h4>
            ${(order.items || []).map(item => `
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.25rem 0;">
                <span><strong>${item.quantity}x</strong> ${item.name}</span>
                <span>₹${item.subtotal || (item.price * item.quantity)}</span>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); margin-top: 0.5rem; padding-top: 0.5rem; font-weight: 700; font-size: 1.05rem;">
              <span>Total Amount</span>
              <span style="color: var(--primary-dark);">₹${order.totalAmount}</span>
            </div>
          </div>

          <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              📍 Delivery Address: ${order.address || 'Address provided'}
            </div>
            <a href="https://wa.me/919450867890?text=${encodeURIComponent(`Hello Balaji Restaurant, checking status of Order #${order.orderId}`)}" target="_blank" class="btn btn-sm btn-whatsapp">
              💬 Query on WhatsApp
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OrderTracker.init();
});
