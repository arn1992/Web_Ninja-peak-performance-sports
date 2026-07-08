/* ═══════════════════════════════════════════════════════════════════
   PEAK PERFORMANCE SPORTS — script.js
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Theme Manager ── */
(function ThemeManager() {
  const STORAGE_KEY = 'pps-theme';
  const root = document.documentElement;

  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Apply before DOMContentLoaded to avoid flash
  applyTheme(getPreferred());

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferred());
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const current = root.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  });
})();

/* ── Mobile Nav ── */
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on nav link click
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
});

/* ── Sticky Header Shadow ── */
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', function () {
    header.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,0,0,0.12)'
      : '0 1px 3px rgba(0,0,0,0.05)';
  }, { passive: true });
});

/* ── Scroll Fade Animations ── */
document.addEventListener('DOMContentLoaded', function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(function (el) {
    observer.observe(el);
  });
});

/* ── Cart State & Drawer ── */
const CartManager = (function () {
  const STORAGE_KEY = 'pps-cart';
  let state = { items: [] };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) { state = { items: [] }; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getCount() {
    return state.items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getTotal() {
    return state.items.reduce(function (sum, item) { return sum + (item.price * item.qty); }, 0);
  }

  function addItem(product) {
    const existing = state.items.find(function (i) { return i.id === product.id; });
    if (existing) {
      existing.qty += 1;
    } else {
      state.items.push({ id: product.id, name: product.name, price: product.price, img: product.img, qty: 1 });
    }
    save();
    updateUI();
    showAddedFeedback(product.name);
  }

  function removeItem(id) {
    state.items = state.items.filter(function (i) { return i.id !== id; });
    save();
    updateUI();
    renderDrawer();
  }

  function updateQty(id, delta) {
    const item = state.items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) removeItem(id);
    else { save(); updateUI(); renderDrawer(); }
  }

  function updateUI() {
    const count = getCount();
    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function renderDrawer() {
    const body = document.getElementById('cart-body');
    const totalEl = document.getElementById('cart-total-value');
    if (!body) return;

    if (state.items.length === 0) {
      body.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Your cart is empty</p><a href="page.html" class="btn btn-primary btn-sm" style="margin-top:8px">Start Shopping</a></div>';
    } else {
      body.innerHTML = state.items.map(function (item) {
        return '<div class="cart-item">' +
          '<img class="cart-item-img" src="' + item.img + '" alt="' + item.name + '" loading="lazy">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.name + '</div>' +
            '<div class="cart-item-price">$' + (item.price * item.qty).toFixed(2) + '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="qty-btn" data-action="decrease" data-id="' + item.id + '" aria-label="Decrease quantity">−</button>' +
              '<span class="qty-value">' + item.qty + '</span>' +
              '<button class="qty-btn" data-action="increase" data-id="' + item.id + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-item-remove" data-action="remove" data-id="' + item.id + '" aria-label="Remove item">✕</button>' +
        '</div>';
      }).join('');
    }

    if (totalEl) totalEl.textContent = '$' + getTotal().toFixed(2);

    // Bind events
    body.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'remove') removeItem(id);
        else if (action === 'increase') updateQty(id, 1);
        else if (action === 'decrease') updateQty(id, -1);
      });
    });
  }

  function showAddedFeedback(name) {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;
    toast.textContent = '✓ ' + name + ' added to cart';
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
  }

  function openDrawer() {
    renderDrawer();
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-drawer').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    document.body.style.overflow = '';
  }

  load();
  updateUI();

  return { addItem, openDrawer, closeDrawer, getCount };
})();

/* ── Cart Drawer Events ── */
document.addEventListener('DOMContentLoaded', function () {
  const cartBtn = document.getElementById('cart-btn');
  const overlay = document.getElementById('cart-overlay');
  const closeBtn = document.getElementById('cart-close');

  if (cartBtn) cartBtn.addEventListener('click', CartManager.openDrawer);
  if (overlay) overlay.addEventListener('click', CartManager.closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', CartManager.closeDrawer);

  // Add to cart buttons
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="add-to-cart"]');
    if (!btn) return;
    const product = {
      id: btn.getAttribute('data-product-id'),
      name: btn.getAttribute('data-product-name'),
      price: parseFloat(btn.getAttribute('data-product-price')),
      img: btn.getAttribute('data-product-img') || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop'
    };
    CartManager.addItem(product);
  });
});

/* ── Shop Page: Filters & Sort ── */
document.addEventListener('DOMContentLoaded', function () {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;

  // View toggle
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      viewBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      productsGrid.className = 'products-grid' + (view === 'list' ? ' list-view' : '');
    });
  });

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      sortProducts(sortSelect.value);
    });
  }

  // Filter checkboxes
  document.querySelectorAll('.filter-option input').forEach(function (input) {
    input.addEventListener('change', function () {
      filterProducts();
    });
  });

  // Price filter
  const priceBtn = document.getElementById('apply-price');
  if (priceBtn) {
    priceBtn.addEventListener('click', function () {
      filterProducts();
    });
  }

  function getCards() {
    return Array.from(productsGrid.querySelectorAll('.product-card'));
  }

  function sortProducts(method) {
    const cards = getCards();
    cards.sort(function (a, b) {
      const priceA = parseFloat(a.getAttribute('data-price') || 0);
      const priceB = parseFloat(b.getAttribute('data-price') || 0);
      const nameA = a.getAttribute('data-name') || '';
      const nameB = b.getAttribute('data-name') || '';
      if (method === 'price-asc') return priceA - priceB;
      if (method === 'price-desc') return priceB - priceA;
      if (method === 'name-asc') return nameA.localeCompare(nameB);
      return 0;
    });
    cards.forEach(function (card) { productsGrid.appendChild(card); });
    updateCount();
  }

  function filterProducts() {
    const checkedCategories = Array.from(document.querySelectorAll('.filter-category:checked')).map(function (i) { return i.value; });
    const checkedBrands = Array.from(document.querySelectorAll('.filter-brand:checked')).map(function (i) { return i.value; });
    const minPrice = parseFloat(document.getElementById('price-min')?.value || 0);
    const maxPrice = parseFloat(document.getElementById('price-max')?.value || Infinity);

    let visible = 0;
    getCards().forEach(function (card) {
      const cat = card.getAttribute('data-category') || '';
      const brand = card.getAttribute('data-brand') || '';
      const price = parseFloat(card.getAttribute('data-price') || 0);

      const catOk = checkedCategories.length === 0 || checkedCategories.includes(cat);
      const brandOk = checkedBrands.length === 0 || checkedBrands.includes(brand);
      const priceOk = price >= (minPrice || 0) && price <= (isNaN(maxPrice) ? Infinity : maxPrice);

      const show = catOk && brandOk && priceOk;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    updateCount(visible);
  }

  function updateCount(count) {
    const countEl = document.getElementById('result-count');
    if (!countEl) return;
    const total = count !== undefined ? count : getCards().filter(function (c) { return c.style.display !== 'none'; }).length;
    countEl.textContent = total;
  }
});

/* ── New Arrivals Filter Chips ── */
document.addEventListener('DOMContentLoaded', function () {
  const chips = document.querySelectorAll('.filter-chip');
  const arrivalsGrid = document.getElementById('arrivals-grid');
  if (!chips.length || !arrivalsGrid) return;

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      const filter = chip.getAttribute('data-filter');

      arrivalsGrid.querySelectorAll('.product-card').forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});

/* ── Contact Form Handler ── */
(function () {
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;
      if (formStatus) formStatus.style.display = 'none';

      const formData = new FormData(contactForm);
      formData.append('access_key', '4a97b632-0740-4392-b87b-de135942e500');
      formData.append('from_name', 'Peak Performance Sports Website');

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (response.ok) {
          formStatus.textContent = '✓ Message sent successfully! We\'ll get back to you soon.';
          formStatus.className = 'form-status success';
          contactForm.reset();
        } else {
          formStatus.textContent = '✗ ' + (data.message || 'Something went wrong. Please try again.');
          formStatus.className = 'form-status error';
        }
      } catch (err) {
        formStatus.textContent = '✗ Network error. Please check your connection and try again.';
        formStatus.className = 'form-status error';
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
})();

/* ── Newsletter Form ── */
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button');
    if (!input || !input.value) return;
    btn.textContent = '✓ Subscribed!';
    btn.style.background = 'rgba(255,255,255,0.95)';
    input.value = '';
    setTimeout(function () {
      btn.textContent = 'Subscribe';
      btn.style.background = '';
    }, 3000);
  });
});
