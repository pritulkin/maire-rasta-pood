const PRODUCTS_KEY = 'mairepood.products';
const ORDERS_KEY = 'mairepood.orders';
const ACCESS_KEY = 'mairepood.adminAccess';
const ADMIN_PASSWORD = 'maire2026';
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const orderList = document.getElementById('order-list');
const cancelEditButton = document.getElementById('cancel-edit');
const hiddenId = document.getElementById('product-id');
const imageInput = document.getElementById('product-image');
const imagePreview = document.getElementById('product-image-preview');
const replaceImageButton = document.getElementById('replace-image');
const removeImageButton = document.getElementById('remove-image');
const adminLock = document.getElementById('admin-lock');
const adminPage = document.getElementById('admin-page');
const passwordInput = document.getElementById('admin-password');
const unlockButton = document.getElementById('unlock-admin');
const unlockError = document.getElementById('unlock-error');

let editingProductId = null;
let selectedImageData = null;

// API base URL (update when deployed)
const API_BASE = (() => {
  if (typeof window !== 'undefined' && typeof window.API_URL === 'string' && window.API_URL.trim()) {
    return window.API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return `${protocol}//${hostname}:10000`;
    }

    if (protocol === 'http:' || protocol === 'https:') {
      return '';
    }
  }

  return '';
})();

function loadProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

async function fetchProductsFromBackend() {
  try {
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/api/products`);
      if (!response.ok) {
        throw new Error('Failed to load products from backend');
      }
      const products = await response.json();
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      return products;
    }
  } catch (error) {
    console.warn('Could not fetch products from backend:', error);
  }

  return loadProducts();
}

async function fetchOrdersFromBackend() {
  try {
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/api/orders`);
      if (!response.ok) {
        throw new Error('Failed to load orders from backend');
      }
      const orders = await response.json();
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      return orders;
    }
  } catch (error) {
    console.warn('Could not fetch orders from backend:', error);
  }

  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

function renderProducts() {
  const products = loadProducts();
  productList.innerHTML = '';

  if (!products.length) {
    productList.innerHTML = '<p>Ühtegi toodet pole veel lisatud.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <div>${product.category} • ${product.stock} tk • €${product.price}</div>
      </div>
      <div class="small-actions">
        <button class="button secondary" type="button" data-action="edit" data-id="${product.id}">Muuda</button>
        <button class="button primary" type="button" data-action="delete" data-id="${product.id}">Kustuta</button>
      </div>
    `;
    fragment.appendChild(row);
  });

  productList.appendChild(fragment);
}

function renderOrders() {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  orderList.innerHTML = '';

  if (!orders.length) {
    orderList.innerHTML = '<p>Ühtegi tellimust pole veel saabunud.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  orders.slice().reverse().forEach((order) => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    const itemsText = order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ');
    const statusLabel = order.status === 'processed' ? 'Töödeldud' : 'Ootel';
    row.innerHTML = `
      <div>
        <strong>${order.name}</strong>
        <div>${order.email}</div>
        <div>${itemsText}</div>
        <div>${order.message || '—'}</div>
        <div>${new Date(order.createdAt).toLocaleString('et-EE')}</div>
        <span class="order-status">${statusLabel}</span>
      </div>
      <div class="small-actions">
        <button class="button secondary" type="button" data-action="toggle-order" data-id="${order.id}">
          ${order.status === 'processed' ? 'Sea ootele' : 'Märgi töödelduks'}
        </button>
        <button class="button primary" type="button" data-action="delete-order" data-id="${order.id}">Kustuta</button>
      </div>
    `;
    fragment.appendChild(row);
  });

  orderList.appendChild(fragment);
}

function resetForm() {
  productForm.reset();
  hiddenId.value = '';
  editingProductId = null;
  selectedImageData = null;
  imagePreview.style.display = 'none';
  imagePreview.src = '';
}

function showAdminArea() {
  adminLock?.classList.add('hidden');
  adminPage?.classList.remove('hidden');
}

function showLockScreen() {
  adminLock?.classList.remove('hidden');
  adminPage?.classList.add('hidden');
}

async function unlockAdmin() {
  if ((passwordInput?.value || '') === ADMIN_PASSWORD) {
    sessionStorage.setItem(ACCESS_KEY, 'true');
    showAdminArea();
    await fetchProductsFromBackend();
    await fetchOrdersFromBackend();
    renderProducts();
    renderOrders();
    return;
  }

  unlockError.textContent = 'Vale salasõna.';
  passwordInput.value = '';
  passwordInput.focus();
}

function fillForm(product) {
  hiddenId.value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-category').value = product.category;
  editingProductId = product.id;
  selectedImageData = product.image || null;
  if (selectedImageData) {
    imagePreview.src = selectedImageData;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.style.display = 'none';
    imagePreview.src = '';
  }
}

function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleImageSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    selectedImageData = null;
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    return;
  }

  selectedImageData = await resizeImage(file);
  imagePreview.src = selectedImageData;
  imagePreview.style.display = 'block';
}

function removeSelectedImage() {
  selectedImageData = null;
  imagePreview.style.display = 'none';
  imagePreview.src = '';
  imageInput.value = '';
}

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const products = loadProducts();
  const existingProduct = editingProductId ? products.find((item) => item.id === editingProductId) : null;
  const payload = {
    id: hiddenId.value || crypto.randomUUID(),
    name: document.getElementById('product-name').value.trim(),
    description: document.getElementById('product-description').value.trim(),
    price: Number(document.getElementById('product-price').value),
    stock: Number(document.getElementById('product-stock').value),
    category: document.getElementById('product-category').value.trim(),
    image: selectedImageData || existingProduct?.image || null,
  };

  if (!payload.name || !payload.description || !payload.category) return;

  try {
    if (editingProductId) {
      // Update existing product
      const index = products.findIndex((item) => item.id === editingProductId);
      if (index >= 0) {
        products[index] = { ...products[index], ...payload };
      }
      
      // Send to backend
      if (API_BASE) {
        await fetch(`${API_BASE}/api/products/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } else {
      // Create new product
      products.unshift(payload);
      
      // Send to backend
      if (API_BASE) {
        await fetch(`${API_BASE}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    }

    saveProducts(products);
    renderProducts();
    resetForm();
  } catch (error) {
    console.error('Product save error:', error);
    alert('Tõrge toote salvestamisel. Kontrollida serverühendust.');
  }
});

productList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  const products = loadProducts();

  if (action === 'delete') {
    try {
      // Delete from backend
      if (API_BASE) {
        await fetch(`${API_BASE}/api/products/${id}`, {
          method: 'DELETE',
        });
      }
      
      // Delete from local storage
      const filtered = products.filter((product) => product.id !== id);
      saveProducts(filtered);
      renderProducts();
    } catch (error) {
      console.error('Product deletion error:', error);
      alert('Tõrge toote kustutamisel.');
    }
    return;
  }

  if (action === 'edit') {
    const product = products.find((item) => item.id === id);
    if (product) fillForm(product);
  }
});

orderList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');

  if (action === 'delete-order') {
    const filtered = orders.filter((order) => order.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
    renderOrders();
    return;
  }

  if (action === 'toggle-order') {
    const updated = orders.map((order) =>
      order.id === id ? { ...order, status: order.status === 'processed' ? 'pending' : 'processed' } : order
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    renderOrders();
  }
});

cancelEditButton.addEventListener('click', resetForm);
imageInput.addEventListener('change', (event) => {
  handleImageSelection(event);
});
replaceImageButton.addEventListener('click', () => {
  imageInput.click();
});
removeImageButton.addEventListener('click', removeSelectedImage);
unlockButton.addEventListener('click', unlockAdmin);
passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    unlockAdmin();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (sessionStorage.getItem(ACCESS_KEY) === 'true') {
    showAdminArea();
    await fetchProductsFromBackend();
    await fetchOrdersFromBackend();
    renderProducts();
    renderOrders();
    return;
  }

  showLockScreen();
});
