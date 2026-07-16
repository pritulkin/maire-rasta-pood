const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 10000;

function testDeleteOrder(orderId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/Orders/${orderId}`,
      method: 'DELETE'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (error) => reject(error));
    req.end();
  });
}

(async () => {
  const orderId = process.env.ORDER_ID || 'debug-test-1';
  
  try {
    console.log(`Testing DELETE order with ID: ${orderId}`);
    console.log(`API: http://${API_HOST}:${API_PORT}`);
    const result = await testDeleteOrder(orderId);
    console.log(`Status: ${result.status}`);
    console.log(`Body: ${result.body}`);
  } catch (error) {
    console.error('Error testing DELETE:', error);
    process.exit(1);
  }
})();
