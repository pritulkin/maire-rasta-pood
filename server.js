// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
// #region agent log
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const bodyKeys = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
    fetch('http://127.0.0.1:7762/ingest/feb180af-38b5-451b-a0d3-cd3b48e14c4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978fb6'},body:JSON.stringify({sessionId:'978fb6',location:'server.js:apiMiddleware',message:'API request received',data:{method:req.method,path:req.path,bodyKeys,contentType:req.headers['content-type']||null},timestamp:Date.now(),hypothesisId:'B,C,E'})}).catch(()=>{});
  }
  next();
});
// #endregion
app.use(express.static(__dirname));

// Kataloogide asukohad
const ORDERS_DIR = path.join(__dirname, 'orders');
const PRODUCTS_DIR = path.join(__dirname, 'products');

// Loome vajadusel andmekataloogid
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
  console.log('Created orders directory');
}

if (!fs.existsSync(PRODUCTS_DIR)) {
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  console.log('Created products directory');
}

// ==================== GITHUB SYNC ====================

// Automaatne Git sync funktsioon muutuste salvestamiseks
function syncToGitHub() {
  try {
    const { execSync } = require('child_process');
    
    // Kontrollime, kas asume Git repositooriumis
    const isGitRepo = execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' }).trim() === 'true';
    
    if (isGitRepo) {
      execSync('git add orders/ products/', { encoding: 'utf8' });
      // --allow-empty hoiab ära vea, kui midagi uut polegi committida
      execSync('git commit -m "Auto-sync: Update orders and products" --allow-empty', { encoding: 'utf8' });
      execSync('git push', { encoding: 'utf8' });
      console.log('Changes synced to GitHub');
    }
  } catch (error) {
    console.log('GitHub sync skipped (not a git repository or git not configured)');
  }
}

// ==================== PRODUCTS ====================

// GET: Kõik tooted
app.get('/api/products', (req, res) => {
  try {
    const products = [];
    
    if (fs.existsSync(PRODUCTS_DIR)) {
      const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const filePath = path.join(PRODUCTS_DIR, file);
        const product = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        products.push(product);
      });
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// POST: Uus toode
app.post('/api/products', (req, res) => {
  try {
    const product = req.body;
    
    if (!product || !product.name || !product.price) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    
    if (!product.id) {
      product.id = crypto.randomUUID();
    }
    
    const filename = `product-${product.id}.json`;
    const filepath = path.join(PRODUCTS_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(product, null, 2));
    console.log(`Product saved to ${filepath}`);
    
    // Käivitame giti sünkroniseerimise pärast edukat salvestamist
    syncToGitHub();
    
    res.status(201).json({
      success: true,
      message: 'Product created',
      productId: product.id
    });
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// PUT: Uuenda toodet
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    
    const filename = `product-${id}.json`;
    const filepath = path.join(PRODUCTS_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    product.id = id; 
    fs.writeFileSync(filepath, JSON.stringify(product, null, 2));
    console.log(`Product ${id} updated`);
    
    syncToGitHub();
    
    res.json({
      success: true,
      message: 'Product updated'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE: Kustuta toode
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filename = `product-${id}.json`;
    const filepath = path.join(PRODUCTS_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Product ${id} deleted`);
      
      syncToGitHub();
      
      res.json({ success: true, message: 'Product deleted' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== ORDERS ====================

// GET: Kõik tellimused
app.get('/api/orders', (req, res) => {
  try {
    const orders = [];
    
    if (fs.existsSync(ORDERS_DIR)) {
      const files = fs.readdirSync(ORDERS_DIR).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const filePath = path.join(ORDERS_DIR, file);
        const order = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        orders.push(order);
      });
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// POST: Uus tellimus
app.post('/api/orders', (req, res) => {
  try {
    console.log('POST /api/orders received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const order = req.body;
    
    if (!order || typeof order !== 'object') {
      console.log('Invalid order data: not an object');
      return res.status(400).json({ error: 'Invalid order data' });
    }
    
    if (!order.id || !order.email || !Array.isArray(order.items) || !order.items.length) {
      console.log('Invalid order data: missing required fields', { id: order.id, email: order.email, items: order.items });
      return res.status(400).json({ error: 'Invalid order data' });
    }
    
    order.status = order.status || 'pending';
    
    if (!order.createdAt) {
      order.createdAt = new Date().toISOString();
    }
    
    const filename = `order-${order.id}.json`;
    const filepath = path.join(ORDERS_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(order, null, 2));
    // #region agent log
    fetch('http://127.0.0.1:7762/ingest/feb180af-38b5-451b-a0d3-cd3b48e14c4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'978fb6'},body:JSON.stringify({sessionId:'978fb6',location:'server.js:POST orders',message:'order JSON written',data:{filepath,orderId:order.id,fileExists:fs.existsSync(filepath)},timestamp:Date.now(),hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    console.log(`Order saved to ${filepath}`);
    
    syncToGitHub();
    
    res.status(201).json({
      success: true,
      message: 'Order received',
      orderId: order.id
    });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// PATCH: Uuenda tellimuse staatust
app.patch('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'processed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "pending" or "processed"' });
    }
    
    const filename = `order-${id}.json`;
    const filepath = path.join(ORDERS_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    order.status = status;
    
    fs.writeFileSync(filepath, JSON.stringify(order, null, 2));
    console.log(`Order ${id} status updated to ${status}`);
    
    syncToGitHub();
    
    res.json({
      success: true,
      message: 'Order status updated'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE: Kustuta tellimus
app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filename = `order-${id}.json`;
    const filepath = path.join(ORDERS_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Order ${id} deleted`);
      
      syncToGitHub();
      
      res.json({ success: true, message: 'Order deleted' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ==================== AUTH ====================

// POST: Admin login
app.post('/api/Auth/login', (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Orders directory: ${ORDERS_DIR}`);
  console.log(`Products directory: ${PRODUCTS_DIR}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/products`);
  console.log(`  POST   /api/products`);
  console.log(`  PUT    /api/products/:id`);
  console.log(`  DELETE /api/products/:id`);
  console.log(`  GET    /api/orders`);
  console.log(`  POST   /api/orders`);
  console.log(`  PATCH  /api/orders/:id`);
  console.log(`  DELETE /api/orders/:id`);
});
