import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Simple request logger to help debug 405 / CORS issues
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.path, 'origin=', req.headers.origin || '-', 'content-type=', req.headers['content-type'] || '-');
  next();
});

// Enable CORS for all routes. Keep this so regular requests work across origins.
app.use(cors());
// Ensure preflight (OPTIONS) requests are handled by the cors middleware as well.
app.options('*', cors());

// In addition to the cors() middleware, add explicit headers and handle OPTIONS early so
// reverse proxies / unusual environments also respond correctly to preflight requests.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Configure GitHub
const GITHUB_REPO = process.env.GITHUB_REPO || 'your-username/your-repo';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORDERS_DIR = path.join(__dirname, 'orders');

// Ensure orders directory exists
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

// Initialize git if needed
function ensureGitRepo() {
  const gitDir = path.join(__dirname, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('Initializing git repository...');
    try {
      execSync('git init', { cwd: __dirname });
    } catch (error) {
      console.error('Git initialization error:', error.message);
      return;
    }
  }

  try {
    execSync('git remote get-url origin', { cwd: __dirname, stdio: 'pipe' });
  } catch {
    if (!GITHUB_TOKEN) {
      console.warn('Git remote not configured and GITHUB_TOKEN is missing. Skipping remote setup.');
      return;
    }

    try {
      execSync(`git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`, {
        cwd: __dirname,
        stdio: 'pipe',
      });
    } catch (error) {
      console.error('Git remote setup error:', error.message);
    }
  }
}

// Save order and commit to GitHub
async function saveOrderToGitHub(order) {
  const filename = `order-${order.id}.json`;
  const filepath = path.join(ORDERS_DIR, filename);

  // Save order locally first
  fs.writeFileSync(filepath, JSON.stringify(order, null, 2));

  try {
    ensureGitRepo();

    execSync('git add .', { cwd: __dirname, stdio: 'pipe' });
    execSync(`git commit -m "Add order ${order.id} from ${order.name}"`, {
      cwd: __dirname,
      stdio: 'pipe',
    });
    execSync('git push origin main', {
      cwd: __dirname,
      stdio: 'pipe',
    });

    console.log(`Order ${order.id} committed to GitHub`);
    return true;
  } catch (error) {
    console.warn('Git sync unavailable, order saved locally:', error.message);
    return false;
  }
}

// Products management
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

function loadProductsFile() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
  return [];
}

function saveProductsFile(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  ensureGitRepo();

  // Commit to GitHub
  try {
    execSync('git add products.json', { cwd: __dirname });
    execSync('git commit -m "Update products"', {
      cwd: __dirname,
      stdio: 'pipe',
    });
    execSync('git push origin main', {
      cwd: __dirname,
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Git push error:', error.message);
  }
}

function loadOrdersFromDir() {
  if (!fs.existsSync(ORDERS_DIR)) {
    return [];
  }

  try {
    return fs.readdirSync(ORDERS_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(ORDERS_DIR, file), 'utf8'));
        } catch (error) {
          console.error(`Could not parse order file ${file}:`, error.message);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error loading orders:', error.message);
    return [];
  }
}

// GET products
app.get('/api/products', (req, res) => {
  try {
    const products = loadProductsFile();
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST new product
app.post('/api/products', (req, res) => {
  try {
    const product = req.body;
    
    if (!product.id || !product.name || !product.description || !product.category) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const products = loadProductsFile();
    products.unshift(product);
    saveProductsFile(products);

    res.status(201).json({
      success: true,
      message: 'Product created',
      product: product,
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = req.body;

    const products = loadProductsFile();
    const index = products.findIndex((p) => p.id === id);

    if (index < 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[index] = { ...products[index], ...updatedProduct };
    saveProductsFile(products);

    res.json({
      success: true,
      message: 'Product updated',
      product: products[index],
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const products = loadProductsFile();
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    saveProductsFile(filtered);

    res.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET orders
app.get('/api/orders', (req, res) => {
  try {
    const orders = loadOrdersFromDir();
    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// API endpoint for orders
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;

    if (!order || typeof order !== 'object') {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    if (!order.id || !order.email || !Array.isArray(order.items) || !order.items.length) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    await saveOrderToGitHub(order);

    res.status(201).json({
      success: true,
      message: 'Order received',
      orderId: order.id,
    });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
