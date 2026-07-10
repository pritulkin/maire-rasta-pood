import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
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
  if (!fs.existsSync(path.join(__dirname, '.git'))) {
    console.log('Initializing git repository...');
    try {
      execSync('git init', { cwd: __dirname });
      execSync(`git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`, {
        cwd: __dirname,
        stdio: 'pipe',
      });
    } catch (error) {
      console.error('Git initialization error:', error.message);
    }
  }
}

// Save order and commit to GitHub
async function saveOrderToGitHub(order) {
  const filename = `order-${order.id}.json`;
  const filepath = path.join(ORDERS_DIR, filename);

  // Save order locally
  fs.writeFileSync(filepath, JSON.stringify(order, null, 2));

  try {
    ensureGitRepo();

    // Git commands
    execSync('git add .', { cwd: __dirname });
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
    console.error('Git push error:', error.message);
    // Order is still saved locally, so don't fail
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

// API endpoint for orders
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;

    if (!order.id || !order.email || !order.items?.length) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Save to GitHub
    await saveOrderToGitHub(order);

    // TODO: Send email notification
    // sendConfirmationEmail(order.email, order);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
