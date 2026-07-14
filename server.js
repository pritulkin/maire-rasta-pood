import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Logimine
app.use((req, res, next) => {
  console.log(
    new Date().toISOString(),
    req.method,
    req.path,
    'origin=', req.headers.origin || '-',
    'content-type=', req.headers['content-type'] || '-'
  );
  next();
});

app.use(cors());
app.options('*', cors());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Serve static
app.use(express.static(path.join(__dirname)));

// GitHub config
const GITHUB_REPO = process.env.GITHUB_REPO || 'your-username/your-repo';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// *** OLULINE PARANDUS ***
// Kasuta alati projekti juurkausta, mitte serveri faili asukohta
const ORDERS_DIR = path.resolve('./orders');
const PRODUCTS_FILE = path.resolve('./products.json');

console.log("ORDERS_DIR =", ORDERS_DIR);
console.log("PRODUCTS_FILE =", PRODUCTS_FILE);

// Ensure orders dir exists
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

// Git init
function ensureGitRepo() {
  const gitDir = path.resolve('./.git');

  if (!fs.existsSync(gitDir)) {
    console.log('Initializing git repository...');
    try {
      execSync('git init', { cwd: process.cwd() });
    } catch (error) {
      console.error('Git initialization error:', error.message);
      return;
    }
  }

  try {
    execSync('git remote get-url origin', { cwd: process.cwd(), stdio: 'pipe' });
  } catch {
    if (!GITHUB_TOKEN) {
      console.warn('Git remote not configured and GITHUB_TOKEN missing.');
      return;
    }

    try {
      execSync(
        `git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`,
        { cwd: process.cwd(), stdio: 'pipe' }
      );
    } catch (error) {
      console.error('Git remote setup error:', error.message);
    }
  }
}

// Save order
async function saveOrderToGitHub(order) {
  const filename = `order-${order.id}.json`;
  const filepath = path.join(ORDERS_DIR, filename);

  // Add createdAt if missing
  if (!order.createdAt) {
    order.createdAt = new Date().toISOString();
  }

  // Write file ALWAYS
  fs.writeFileSync(filepath, JSON.stringify(order, null, 2));
  console.log("Order saved locally:", filepath);

  // Try Git sync but NEVER fail order saving
  try {
    ensureGitRepo();
    execSync('git add .', { cwd: process.cwd() });
    execSync(`git commit -m "Add order ${order.id}"`, {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    execSync('git push origin main', {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    console.log(`Order ${order.id} pushed to GitHub`);
  } catch (error) {
    console.warn('Git push failed:', error.message);
  }
}

// Load products
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

// Save products
function saveProductsFile(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log("Products saved:", PRODUCTS_FILE);

  try {
    ensureGitRepo();
    execSync('git add products.json', { cwd: process.cwd() });
    execSync('git commit -m "Update products"', {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    execSync('git push origin main', {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Git push error:', error.message);
  }
}

// Load orders
function loadOrdersFromDir() {
  if (!fs.existsSync(ORDERS_DIR)) return [];

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

// API routes
app.get('/api/products', (req, res) => {
  res.json(loadProductsFile());
});

app.post('/api/products', (req, res) => {
  const product = req.body;

  if (!product.id || !product.name || !product.description || !product.category) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  const products = loadProductsFile();
  products.unshift(product);
  saveProductsFile(products);

  res.status(201).json({ success: true, product });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updatedProduct = req.body;

  const products = loadProductsFile();
  const index = products.findIndex((p) => p.id === id);

  if (index < 0) return res.status(404).json({ error: 'Product not found' });

  products[index] = { ...products[index], ...updatedProduct };
  saveProductsFile(products);

  res.json({ success: true, product: products[index] });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const products = loadProductsFile();
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) {
    return res.status(404).json({ error: 'Product not found' });
  }

  saveProductsFile(filtered);
  res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
  res.json(loadOrdersFromDir());
});

app.post('/api/orders', async (req, res) => {
  const order = req.body;

  if (!order || !order.id || !order.email || !Array.isArray(order.items)) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  await saveOrderToGitHub(order);

  res.status(201).json({
    success: true,
    orderId: order.id,
  });
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
