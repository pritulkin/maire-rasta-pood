const http = require('http');

http.get('http://localhost:10000/admin.js', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Body length:', body.length);
    console.log('Body starts with:', body.substring(0, 100));
  });
}).on('error', (error) => {
  console.error('Error:', error);
});
