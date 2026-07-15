const http = require('http');

// Test products endpoint
const optionsProducts = {
  hostname: 'localhost',
  port: 10000,
  path: '/api/products',
  method: 'GET'
};

const reqProducts = http.request(optionsProducts, (res) => {
  console.log(`Products Status: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Products Response: ${chunk.substring(0, 200)}...`);
  });
});

reqProducts.on('error', (error) => {
  console.error(`Products Error: ${error.message}`);
});

reqProducts.end();

// Test orders endpoint
const optionsOrders = {
  hostname: 'localhost',
  port: 10000,
  path: '/api/orders',
  method: 'GET'
};

const reqOrders = http.request(optionsOrders, (res) => {
  console.log(`Orders Status: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Orders Response: ${chunk.substring(0, 200)}...`);
  });
});

reqOrders.on('error', (error) => {
  console.error(`Orders Error: ${error.message}`);
});

reqOrders.end();
