/* ==========================================================================
   Balaji Enterprises & Restaurant - Client Auth Module
   ========================================================================== */

const AuthManager = {
  currentUser: null,
  userRole: 'customer',

  init() {
    if (!window.auth) return;

    window.auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        // Fetch ID token result to check custom claim
        try {
          const idTokenResult = await user.getIdTokenResult();
          this.userRole = idTokenResult.claims.role || (idTokenResult.claims.admin ? 'admin' : 'customer');
        } catch (e) {
          console.error('Error fetching token claims', e);
          this.userRole = 'customer';
        }
      } else {
        this.userRole = 'customer';
      }

      this.updateAuthUI();
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { user, role: this.userRole }
      }));
    });
  },

  async signUp(email, password, name, phone) {
    try {
      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Run profile update & Firestore user document creation concurrently
      const profilePromise = user.updateProfile({ displayName: name }).catch(e => console.error('Error updating profile:', e));
      const firestorePromise = (window.db && user.uid)
        ? window.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            phone: phone || '',
            role: 'customer',
            createdAt: new Date().toISOString()
          }, { merge: true }).catch(e => console.error('Error saving user doc:', e))
        : Promise.resolve();

      await Promise.allSettled([profilePromise, firestorePromise]);

      CartManager.showToast(`Welcome to Balaji Enterprises, ${name}!`, 'success');
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        CartManager.showToast('This email is already registered — please log in instead', 'error');
      } else {
        CartManager.showToast(error.message, 'error');
      }
      throw error;
    }
  },

  async login(email, password) {
    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      CartManager.showToast('Logged in successfully!', 'success');
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      CartManager.showToast('Invalid email or password.', 'error');
      throw error;
    }
  },

  async logout() {
    try {
      await window.auth.signOut();
      CartManager.showToast('Signed out.', 'info');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  updateAuthUI() {
    const authNavContainer = document.getElementById('nav-auth-container');
    if (!authNavContainer) return;

    if (this.currentUser) {
      const isAdmin = this.userRole === 'admin';
      authNavContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <a href="/orders.html" class="nav-link">My Orders</a>
          ${isAdmin ? `<a href="/admin.html" class="btn btn-sm btn-outline" style="border-color: var(--accent-gold); color: #B38F24;">Admin Portal</a>` : ''}
          <button id="logout-btn" class="btn btn-sm btn-outline">Logout (${this.currentUser.displayName || 'User'})</button>
        </div>
      `;

      document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    } else {
      authNavContainer.innerHTML = `
        <a href="/login.html" class="btn btn-sm btn-primary">Login / Sign Up</a>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AuthManager.init();
});
