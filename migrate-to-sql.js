const fs = require('fs');
const path = require('path');
const http = require('http');

// Read products from JSON files
const productsDir = path.join(__dirname, 'products');
const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));

const products = productFiles.map(file => {
  const data = fs.readFileSync(path.join(productsDir, file), 'utf8');
  return JSON.parse(data);
});

// Read orders from JSON files
const ordersDir = path.join(__dirname, 'orders');
const orderFiles = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));

const orders = orderFiles.map(file => {
  const data = fs.readFileSync(path.join(ordersDir, file), 'utf8');
  return JSON.parse(data);
});

console.log(`Found ${products.length} products and ${orders.length} orders`);

// Helper function to make HTTP request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, status: res.statusCode, body });
        } else {
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(postData);
    req.end();
  });
}

// Migrate products to SQL
async function migrateProducts() {
  for (const product of products) {
    try {
      const response = await makeRequest('/api/Products', product);
      if (response.ok) {
        console.log(`Migrated product: ${product.id}`);
      } else {
        console.error(`Failed to migrate product ${product.id}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error migrating product ${product.id}:`, error);
    }
  }
}

// Migrate orders to SQL
async function migrateOrders() {
  for (const order of orders) {
    try {
      const response = await makeRequest('/api/Orders', order);
      if (response.ok) {
        console.log(`Migrated order: ${order.id}`);
      } else {
        console.error(`Failed to migrate order ${order.id}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error migrating order ${order.id}:`, error);
    }
  }
}

// Run migration
(async () => {
  await migrateProducts();
  await migrateOrders();
  console.log('Migration complete');
})();
