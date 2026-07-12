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

// UUS: Funktsioon tellimuste salvestamiseks backendisse
async function saveOrdersToBackend(orders) {
  if (!API_BASE) return false;
  
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save orders to backend:', error);
    return false;
  }
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

async function renderOrders() {
  // Laeme tellimused backendist (mitte localStorage'ist)
  let orders = [];
  if (API_BASE) {
    orders = await fetchOrdersFromBackend();
  } else {
    orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  }
  
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

  const id = hiddenId.value || crypto.randomUUID();
  const productData = {
    id: id,
    name: document.getElementById('product-name').value.trim(),
    description: document.getElementById('product-description').value.trim(),
    price: parseFloat(document.getElementById('product-price').value) || 0,
    stock: parseInt(document.getElementById('product-stock').value, 10) || 0,
    category: document.getElementById('product-category').value,
    image: selectedImageData // Base64 string või null
  };

  try {
    if (API_BASE) {
      const url = editingProductId ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;
      const method = editingProductId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Toote salvestamine backendis ebaõnnestus');
    }

    let products = loadProducts();
    if (editingProductId) {
      products = products.map(p => p.id === editingProductId ? productData : p);
    } else {
      products.push(productData);
    }
    saveProducts(products);
    renderProducts();
    resetForm();
    alert('Toode on edukalt salvestatud!');
  } catch (error) {
    console.error('Viga salvestamisel:', error);
    alert('Viga: Toote salvestamine ebaõnnestus.');
  }
});

productList.addEventListener('click', async (event) => {
  const target = event.target;
  const action = target.getAttribute('data-action');
  const id = target.getAttribute('data-id');
  if (!action || !id) return;

  const products = loadProducts();

  if (action === 'edit') {
    const product = products.find(p => p.id === id);
    if (product) fillForm(product);
  } else if (action === 'delete') {
    if (!confirm('Kas oled kindel, et soovid selle toote kustutada?')) return;

    try {
      if (API_BASE) {
        const response = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Kustutamine backendis ebaõnnestus');
      }

      const updatedProducts = products.filter(p => p.id !== id);
      saveProducts(updatedProducts);
      renderProducts();
      if (editingProductId === id) resetForm();
    } catch (error) {
      console.error('Viga kustutamisel:', error);
      alert('Viga: Toote kustutamine ebaõnnestus.');
    }
  }
});

// MUUDETUD: Tellimuste nimekirja tegevused
orderList.addEventListener('click', async (event) => {
  const target = event.target;
  const action = target.getAttribute('data-action');
  const id = target.getAttribute('data-id');
  if (!action || !id) return;

  // Laeme tellimused backendist
  let orders = [];
  if (API_BASE) {
    const response = await fetch(`${API_BASE}/api/orders`);
    orders = await response.json();
  } else {
    orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  }
  
  const order = orders.find(o => o.id === id);

  if (action === 'toggle-order' && order) {
    const newStatus = order.status === 'processed' ? 'pending' : 'processed';
    
    try {
      if (API_BASE) {
        const response = await fetch(`${API_BASE}/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error('Tellimuse staatuse muutmine ebaõnnestus');
        
        // Uuendame kohalikku koopiat
        order.status = newStatus;
      } else {
        order.status = newStatus;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }

      renderOrders();
    } catch (error) {
      console.error('Viga staatuse muutmisel:', error);
      alert('Viga: Tellimuse staatust ei saanud muuta.');
    }
  } else if (action === 'delete-order') {
    if (!confirm('Kas oled kindel, et soovid selle tellimuse ajaloost kustutada?')) return;

    try {
      if (API_BASE) {
        const response = await fetch(`${API_BASE}/api/orders/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Tellimuse kustutamine ebaõnnestus');
        
        orders = orders.filter(o => o.id !== id);
      } else {
        orders = orders.filter(o => o.id !== id);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }

      renderOrders();
    } catch (error) {
      console.error('Viga tellimuse kustutamisel:', error);
      alert('Viga: Tellimust ei saanud kustutada.');
    }
  }
});

cancelEditButton.addEventListener('click', resetForm);
imageInput.addEventListener('change', handleImageSelection);
removeImageButton.addEventListener('click', removeSelectedImage);
replaceImageButton.addEventListener('click', () => imageInput.click());
unlockButton.addEventListener('click', unlockAdmin);
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') unlockAdmin();
});

(() => {
  if (sessionStorage.getItem(ACCESS_KEY) === 'true') {
    showAdminArea();
    Promise.all([fetchProductsFromBackend(), fetchOrdersFromBackend()]).then(() => {
      renderProducts();
      renderOrders();
    });
  } else {
    showLockScreen();
  }
})();