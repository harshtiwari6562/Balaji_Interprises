/* ==========================================================================
   Balaji Enterprises & Restaurant - Menu Renderer & Filter
   ========================================================================== */

const DEFAULT_MENU_ITEMS = [
  {
    itemId: 'item_1',
    name: 'Special Veg Thali',
    description: 'Paneer sabzi, Dal fry, Jeera rice, 4 Butter Roti, Raita, Salad & Sweet',
    price: 240,
    category: 'Meals & Thalis',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isBestseller: true
  },
  {
    itemId: 'item_2',
    name: 'Paneer Butter Masala',
    description: 'Rich cottage cheese gravy cooked in authentic Amul Butter and cashew paste',
    price: 220,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isBestseller: true
  },
  {
    itemId: 'item_3',
    name: 'Amul Tricone Choco Crunch',
    description: 'Crispy wafer cone filled with rich chocolate Amul ice cream and chocochips',
    price: 60,
    category: 'Amul Ice Creams',
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isAmulSpecial: true
  },
  {
    itemId: 'item_4',
    name: 'Amul Malai Kulfi Stick',
    description: 'Traditional creamy rich kulfi made with pure condensed Amul milk',
    price: 45,
    category: 'Amul Ice Creams',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isAmulSpecial: true
  },
  {
    itemId: 'item_5',
    name: 'Amul Butter Dal Tadka',
    description: 'Yellow lentils tempered with cumin, garlic, Kashmiri chillies and topped with Amul Butter',
    price: 160,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=600&q=80',
    isAvailable: true
  },
  {
    itemId: 'item_6',
    name: 'Amul Cheese Garlic Pizza',
    description: 'Fresh 8-inch thin crust pizza loaded with 100% real Amul Mozzarella Cheese',
    price: 180,
    category: 'Snacks & Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isAmulSpecial: true
  },
  {
    itemId: 'item_7',
    name: 'Butter Naan (2 Pcs)',
    description: 'Soft tandoori naan brushed generously with fresh Amul Butter',
    price: 65,
    category: 'Breads',
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
    isAvailable: true
  },
  {
    itemId: 'item_8',
    name: 'Refreshing Amul Rose Lassi',
    description: 'Chilled thick sweet curd beverage flavored with natural rose water',
    price: 40,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1571006682858-a458b8a69288?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isAmulSpecial: true
  }
];

const MenuManager = {
  items: [],
  currentCategory: 'All',

  async init() {
    await this.fetchMenu();
    this.setupCategoryFilters();
    this.setupSearch();
  },

  async fetchMenu() {
    const gridContainer = document.getElementById('menu-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: var(--text-muted);">Loading fresh menu items...</p>
      </div>
    `;

    try {
      if (window.db) {
        const snapshot = await window.db.collection('menu').get();
        if (!snapshot.empty) {
          this.items = [];
          snapshot.forEach(doc => {
            this.items.push({ itemId: doc.id, ...doc.data() });
          });
        } else {
          // If empty in Firestore, use default menu items and seed Firestore
          this.items = DEFAULT_MENU_ITEMS;
          this.seedDefaultMenu();
        }
      } else {
        this.items = DEFAULT_MENU_ITEMS;
      }
    } catch (e) {
      console.warn('Firestore fetch failed, using fallback menu:', e);
      this.items = DEFAULT_MENU_ITEMS;
    }

    this.renderMenu();
  },

  async seedDefaultMenu() {
    if (!window.db) return;
    try {
      const batch = window.db.batch();
      DEFAULT_MENU_ITEMS.forEach(item => {
        const ref = window.db.collection('menu').doc(item.itemId);
        batch.set(ref, item);
      });
      await batch.commit();
      console.log('Seeded initial menu items to Firestore successfully.');
    } catch (e) {
      console.error('Error seeding menu to Firestore:', e);
    }
  },

  setupCategoryFilters() {
    const categoryBar = document.getElementById('category-bar');
    if (!categoryBar) return;

    const categories = ['All', 'Amul Ice Creams', 'Meals & Thalis', 'Main Course', 'Snacks & Pizza', 'Beverages', 'Breads'];
    categoryBar.innerHTML = categories.map((cat, idx) => `
      <button class="cat-btn ${idx === 0 ? 'active' : ''}" data-category="${cat}">
        ${cat === 'Amul Ice Creams' ? '🍦 ' : ''}${cat}
      </button>
    `).join('');

    categoryBar.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        categoryBar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category;
        this.renderMenu();
      });
    });
  },

  setupSearch() {
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.renderMenu(query);
      });
    }
  },

  renderMenu(searchQuery = '') {
    const gridContainer = document.getElementById('menu-grid');
    if (!gridContainer) return;

    let filtered = this.items;

    if (this.currentCategory !== 'All') {
      filtered = filtered.filter(item => item.category === this.currentCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <h3 style="margin-bottom: 0.5rem; color: var(--text-dark);">No items found</h3>
          <p style="color: var(--text-muted);">Try selecting a different category or search term.</p>
        </div>
      `;
      return;
    }

    const cart = CartManager.getCart();

    gridContainer.innerHTML = filtered.map(item => {
      const cartItem = cart.find(c => c.itemId === item.itemId);
      const qty = cartItem ? cartItem.quantity : 0;

      return `
        <div class="food-card" data-item-id="${item.itemId}">
          <div class="food-card-img-container">
            <img src="${item.imageUrl}" alt="${item.name} - Balaji Restaurant Deoria" class="food-card-img" loading="lazy" />
            <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
              <span class="badge badge-veg">Veg</span>
              ${item.isAmulSpecial ? '<span class="badge badge-amul">Amul Parlour</span>' : ''}
              ${item.isBestseller ? '<span class="badge badge-bestseller">★ Bestseller</span>' : ''}
            </div>
          </div>
          <div class="food-card-body">
            <div class="food-card-header">
              <h3 class="food-card-title">${item.name}</h3>
            </div>
            <p class="food-card-desc">${item.description}</p>
            <div class="food-card-footer">
              <div class="food-price">₹${item.price}</div>
              <div class="action-slot">
                ${qty === 0 ? `
                  <button class="btn btn-sm btn-outline add-btn" onclick="MenuManager.handleAddToCart('${item.itemId}')">
                    + Add to Cart
                  </button>
                ` : `
                  <div class="stepper">
                    <button class="stepper-btn" onclick="MenuManager.handleUpdateQty('${item.itemId}', ${qty - 1})">-</button>
                    <span class="stepper-val">${qty}</span>
                    <button class="stepper-btn" onclick="MenuManager.handleUpdateQty('${item.itemId}', ${qty + 1})">+</button>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  handleAddToCart(itemId) {
    const item = this.items.find(i => i.itemId === itemId);
    if (item) {
      CartManager.addToCart(item);
      this.renderMenu();
    }
  },

  handleUpdateQty(itemId, newQty) {
    CartManager.updateQuantity(itemId, newQty);
    this.renderMenu();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MenuManager.init();
});
