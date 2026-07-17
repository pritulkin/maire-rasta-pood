const PRODUCTS_KEY = 'mairepood.products';
const CART_KEY = 'mairepood.cart';
const ORDERS_KEY = 'mairepood.orders';

// API base URL (update when deployed)
// Prefer an explicit window.API_URL override when provided. Otherwise use the local backend
// for localhost previews and fall back to a same-origin relative URL for production.
const API_BASE = (() => {
  if (typeof window !== 'undefined' && typeof window.API_URL === 'string' && window.API_URL.trim()) {
    return window.API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Kui avad otse failist, kasuta localhost:10000
    if (protocol === 'file:') {
      return 'http://localhost:10000';
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return `${protocol}//${hostname}:10000`;
    }

    // Kui kasutad IP-aadressi (nt telefonilt), kasuta sama origin
    if (protocol === 'http:' || protocol === 'https:') {
      return '';
    }
  }

  return 'http://localhost:10000';
})();

console.log('API_BASE:', API_BASE);

const defaultProducts = [
  {
    id: 'product-default-1',
    name: 'Vaas',
    description: 'Dekoratiivne vaas.',
    price: 100,
    stock: 1,
    category: 'Käsitöö',
    image: 'img/image1.jpg',
  },
  {
    id: 'product-default-2',
    name: 'Vaas',
    description: 'Vaas lilledele.',
    price: 70,
    stock: 1,
    category: 'Käsitöö',
    image: 'img/image2.jpg',
  },
  {
    id: 'product-default-3',
    name: 'Pudel',
    description: 'Punutud pudelid.',
    price: 100,
    stock: 1,
    category: 'Käsitöö',
    image: 'img/image3.jpg',
  },
];

async function loadProducts() {
  console.log('loadProducts called');
  console.log('API_BASE:', API_BASE);
  console.log('window.location.hostname:', window.location.hostname);
  console.log('window.location.protocol:', window.location.protocol);
  
  if (API_BASE) {
    try {
      // Try to fetch from backend first
      const productsUrl = `${API_BASE}/api/Products`;
      console.log('Fetching products from:', productsUrl);
      const response = await fetch(productsUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response Content-Type:', response.headers.get('content-type'));
      
      if (response.ok) {
        const products = await response.json();
        console.log('Products loaded:', products);
        if (products.length > 0) {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
          return products;
        }
      } else {
        // Log response body to help debugging when backend returns error
        try {
          const txt = await response.text();
          console.warn('Backend returned non-OK for products:', response.status, txt);
        } catch (e) {
          console.warn('Backend returned non-OK for products:', response.status);
        }
      }
    } catch (error) {
      console.warn('Could not fetch products from backend:', error);
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('localStorage error:', error);
    return defaultProducts;
  }
}

function saveProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('localStorage error:', error);
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('localStorage error:', error);
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('localStorage error:', error);
  }
}

function saveOrderLocally(order) {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('localStorage error:', error);
  }
}

function currency(value) {
  return `€${Number(value).toFixed(2)}`;
}

async function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = await loadProducts();
  grid.innerHTML = '';

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    const imageMarkup = product.image ? `<img class="product-image" src="${product.image}" alt="${product.name}" />` : '';
    card.innerHTML = `
      ${imageMarkup}
      <p class="eyebrow">${product.category}</p>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="price">${currency(product.price)}</div>
      <p>Laos: ${product.stock}</p>
      <button class="button primary" data-id="${product.id}">Lisa ostukorvi</button>
    `;
    grid.appendChild(card);
  });
}

async function renderCart() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;

  const products = await loadProducts();
  const cart = loadCart();
  const entries = Object.entries(cart);

  if (!entries.length) {
    cartItems.innerHTML = '<p>Ostukorv on hetkel tühi.</p>';
    return;
  }

  cartItems.innerHTML = '';
  let total = 0;

  entries.forEach(([productId, quantity]) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    total += product.price * quantity;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <div>${quantity} tk</div>
      </div>
      <div class="cart-actions">
        <div>${currency(product.price * quantity)}</div>
        <button class="button secondary cart-remove" data-remove-id="${product.id}" type="button">Kustuta</button>
      </div>
    `;
    cartItems.appendChild(row);
  });

  const totalRow = document.createElement('div');
  totalRow.className = 'cart-item';
  totalRow.innerHTML = `<strong>Kokku</strong><strong>${currency(total)}</strong>`;
  cartItems.appendChild(totalRow);
}

function addToCart(productId) {
  const cart = loadCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  void renderCart();
}

function removeFromCart(productId) {
  const cart = loadCart();
  delete cart[productId];
  saveCart(cart);
  void renderCart();
}

async function handleCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const products = await loadProducts();
  const cart = loadCart();
  const entries = Object.entries(cart);

  if (!entries.length) {
    document.getElementById('checkout-status').textContent = 'Lisa kõigepealt vähemalt üks kaup.';
    return;
  }

  const order = {
    id: 'order-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim(),
    createdAt: new Date().toISOString(),
    items: entries.map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId);
      return { productId, name: product?.name || 'Tundmatu', quantity };
    }),
  };

  const statusEl = document.getElementById('checkout-status');
  statusEl.textContent = 'Tellimusest saadakse teade...';

  try {
    const endpoint = API_BASE ? `${API_BASE}/api/Orders` : '/api/Orders';
    console.log('API_BASE:', API_BASE);
    console.log('Sending order to:', endpoint);
    console.log('Order data:', JSON.stringify(order, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(order),
    });
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      let details = '';
      try {
        details = await response.text();
      } catch (e) {
        // ignore
      }
      throw new Error(`Server error ${response.status}: ${details || response.statusText}`);
    }

    localStorage.removeItem(CART_KEY);
    form.reset();
    await renderCart();
    statusEl.textContent = `Tellimus salvestatud! Kinnitus saadetakse ${order.email}.`;
  } catch (error) {
    console.error('Order submission error:', error);
    statusEl.textContent = `Viga tellimuse saatmisel: ${error.message}. Palun proovi uuesti.`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderProducts();
  await renderCart();

  document.getElementById('product-grid')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    addToCart(button.dataset.id);
  });

  document.getElementById('cart-items')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove-id]');
    if (!button) return;
    removeFromCart(button.dataset.removeId);
  });

  document.getElementById('checkout-form')?.addEventListener('submit', handleCheckout);
});
