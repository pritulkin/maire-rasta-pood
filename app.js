const PRODUCTS_KEY = 'mairepood.products';
const CART_KEY = 'mairepood.cart';
const ORDERS_KEY = 'mairepood.orders';

const defaultProducts = [
  {
    id: crypto.randomUUID(),
    name: 'Vaas',
    description: 'Dekoratiivne vaas.',
    price: 100,
    stock: 1,
    category: 'Käsitöö',
    image: 'img/image1.jpg',
  },
  {
    id: crypto.randomUUID(),
    name: 'Vaas',
    description: 'Vaas lilledele.',
    price: 70,
    stock: 1,
    category: 'Käsitöö',
    image: 'img/image2.jpg',
  },
  {
    id: crypto.randomUUID(),
    name: 'Pudel',
    description: 'Punutud pudelid.',
    price: 100,
    stock: 1,
    category: 'Käsitöö',
    image: 'img/image3.jpg',
  },
];

function loadProducts() {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  if (!raw) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
  }
  return JSON.parse(raw);
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function currency(value) {
  return `€${Number(value).toFixed(2)}`;
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = loadProducts();
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

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;

  const products = loadProducts();
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
      <div>${currency(product.price * quantity)}</div>
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
  renderCart();
}

function handleCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const products = loadProducts();
  const cart = loadCart();
  const entries = Object.entries(cart);

  if (!entries.length) {
    document.getElementById('checkout-status').textContent = 'Lisa kõigepealt vähemalt üks kaup.';
    return;
  }

  const order = {
    id: crypto.randomUUID(),
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim(),
    createdAt: new Date().toISOString(),
    items: entries.map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId);
      return { productId, name: product?.name || 'Tundmatu', quantity };
    }),
  };

  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  localStorage.removeItem(CART_KEY);
  form.reset();
  renderCart();
  document.getElementById('checkout-status').textContent = `Tellimus salvestatud! Kinnitus saadetakse ${order.email}.`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();

  document.getElementById('product-grid')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    addToCart(button.dataset.id);
  });

  document.getElementById('checkout-form')?.addEventListener('submit', handleCheckout);
});
