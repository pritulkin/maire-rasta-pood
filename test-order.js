const http = require('http');

const orderData = JSON.stringify({
  id: 'test-order-002',
  name: 'Test User',
  email: 'test@example.com',
  message: 'Test message',
  items: [
    {
      productId: 'test-1',
      name: 'Test Product',
      quantity: 1
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 10000,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(orderData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.write(orderData);
req.end();
