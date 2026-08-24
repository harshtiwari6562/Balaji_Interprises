/* ==========================================================================
   Balaji Enterprises & Restaurant - Checkout & UPI/WhatsApp Payment Handler
   ========================================================================== */

const SHOP_PHONE_WHATSAPP = "919450867890"; // Rahul Pandey - Balaji Restaurant Deoria
const SHOP_UPI_ID = "rahulpandey@upi";

const CheckoutManager = {
  cart: [],

  init() {
    this.cart = CartManager.getCart();
    this.renderCheckoutSummary();
    this.setupCheckoutForm();
  },

  renderCheckoutSummary() {
    const summaryContainer = document.getElementById('checkout-items');
    const totalElement = document.getElementById('checkout-total-amount');

    if (!summaryContainer) return;

    if (this.cart.length === 0) {
      summaryContainer.innerHTML = `
        <p style="color: var(--text-muted); text-align: center; padding: 2rem;">Your cart is empty. <a href="/menu.html">Browse Menu</a></p>
      `;
      if (totalElement) totalElement.textContent = '₹0';
      return;
    }

    summaryContainer.innerHTML = this.cart.map(item => `
      <div class="summary-row" style="align-items: center;">
        <div>
          <strong style="color: var(--text-dark);">${item.name}</strong> × ${item.quantity}
          <div style="font-size: 0.8rem; color: var(--text-muted);">₹${item.price} each</div>
        </div>
        <div style="font-weight: 700; color: var(--text-dark);">₹${item.price * item.quantity}</div>
      </div>
    `).join('');

    const subtotal = CartManager.getCartTotal();
    const deliveryCharge = subtotal > 300 ? 0 : 30; // Free delivery above ₹300
    const grandTotal = subtotal + deliveryCharge;

    const deliveryElement = document.getElementById('checkout-delivery-charge');
    if (deliveryElement) deliveryElement.textContent = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
    if (totalElement) totalElement.textContent = `₹${grandTotal}`;
  },

  setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    // Prefill name & phone if user is logged in
    if (AuthManager.currentUser) {
      const nameInput = document.getElementById('customer-name');
      const phoneInput = document.getElementById('customer-phone');
      if (nameInput && AuthManager.currentUser.displayName) {
        nameInput.value = AuthManager.currentUser.displayName;
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.processOrderPlacement();
    });
  },

  async processOrderPlacement() {
    if (this.cart.length === 0) {
      CartManager.showToast('Your cart is empty!', 'error');
      return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const instructions = document.getElementById('order-instructions')?.value.trim() || '';

    if (!name || !phone || !address) {
      CartManager.showToast('Please fill in all required fields.', 'error');
      return;
    }

    const submitBtn = document.getElementById('place-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>
      Securing & Placing Order...
    `;

    try {
      let orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      let grandTotal = CartManager.getCartTotal();
      const deliveryCharge = grandTotal > 300 ? 0 : 30;
      grandTotal += deliveryCharge;

      // Check if Cloud Functions is reachable
      if (window.functions && AuthManager.currentUser) {
        try {
          const placeOrderFunc = window.functions.httpsCallable('placeOrder');
          const result = await placeOrderFunc({
            cartItems: this.cart,
            customerName: name,
            phone: phone,
            address: address,
            instructions: instructions
          });

          if (result.data && result.data.orderId) {
            orderId = result.data.orderId;
            grandTotal = result.data.totalAmount;
          }
        } catch (funcErr) {
          console.warn('Cloud function call failed, writing direct Firestore order fallback:', funcErr);
          if (window.db) {
            const docRef = window.db.collection('orders').doc();
            orderId = docRef.id;
            await docRef.set({
              orderId: orderId,
              userId: AuthManager.currentUser ? AuthManager.currentUser.uid : 'guest',
              customerName: name,
              phone: phone,
              address: address,
              instructions: instructions,
              items: this.cart,
              totalAmount: grandTotal,
              status: 'pending',
              paymentStatus: 'unpaid',
              createdAt: new Date().toISOString()
            });
          }
        }
      } else if (window.db) {
        const docRef = window.db.collection('orders').doc();
        orderId = docRef.id;
        await docRef.set({
          orderId: orderId,
          userId: AuthManager.currentUser ? AuthManager.currentUser.uid : 'guest',
          customerName: name,
          phone: phone,
          address: address,
          instructions: instructions,
          items: this.cart,
          totalAmount: grandTotal,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: new Date().toISOString()
        });
      }

      // Clear cart
      CartManager.clearCart();

      // Show Payment & Confirmation modal/view
      this.showPaymentConfirmationScreen(orderId, grandTotal, name, phone, address);

    } catch (e) {
      console.error('Order placement failed:', e);
      CartManager.showToast(e.message || 'Failed to place order. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '⚡ Place Order & View Payment QR';
    }
  },

  showPaymentConfirmationScreen(orderId, total, name, phone, address) {
    const mainSection = document.getElementById('checkout-main-section');
    if (!mainSection) return;

    // Generate UPI payment string
    const upiString = `upi://pay?pa=${encodeURIComponent(SHOP_UPI_ID)}&pn=${encodeURIComponent('Balaji Enterprises & Restaurant')}&am=${total}&cu=INR&tn=${encodeURIComponent('Order ' + orderId)}`;
    
    // QR Code URL using QRServer API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiString)}`;

    // Prefilled WhatsApp text message
    const waText = `Hello Balaji Enterprises & Restaurant,\n\nI have placed Order *#${orderId}*\n*Total Amount:* ₹${total}\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n\nI am sending payment via UPI QR code. Please confirm my order!`;
    const waUrl = `https://wa.me/${SHOP_PHONE_WHATSAPP}?text=${encodeURIComponent(waText)}`;

    mainSection.innerHTML = `
      <div class="summary-card" style="text-align: center; max-width: 600px; margin: 2rem auto; padding: 2.5rem 1.5rem; animation: slideUp 0.4s ease;">
        <div style="width: 60px; height: 60px; background-color: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem auto;">
          ✓
        </div>
        <h2 style="font-size: 1.8rem; color: var(--text-dark); margin-bottom: 0.5rem;">Order Placed Successfully!</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Order ID: <strong style="color: var(--primary-dark); font-family: monospace;">#${orderId}</strong></p>
        
        <div class="qr-container">
          <h3 style="font-size: 1.2rem; color: var(--text-dark); margin-bottom: 0.5rem;">Scan & Pay via any UPI App</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">GPay, PhonePe, Paytm, BHIM</p>
          <img src="${qrCodeUrl}" alt="UPI Payment QR Code - Balaji Restaurant" class="qr-image" />
          <div style="font-weight: 700; font-size: 1.4rem; color: var(--primary-dark); margin-top: 0.5rem;">
            Total Payable: ₹${total}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem;">UPI ID: ${SHOP_UPI_ID}</div>
        </div>

        <div style="background-color: var(--primary-light); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.75rem; text-align: left;">
          <h4 style="color: var(--primary-dark); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📱</span> Next Step: Confirm Payment on WhatsApp
          </h4>
          <p style="font-size: 0.88rem; color: var(--text-dark); line-height: 1.5;">
            Click the button below to send your payment confirmation & order ID directly to Rahul Pandey on WhatsApp.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <a href="${waUrl}" target="_blank" class="btn btn-whatsapp btn-block" style="font-size: 1.05rem; padding: 0.9rem;">
            <span>💬</span> Confirm Order on WhatsApp
          </a>
          <a href="/orders.html" class="btn btn-outline btn-block">
            Track Order Status
          </a>
        </div>
      </div>
    `;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CheckoutManager.init();
});
