const http = require('http');

const url = 'http://localhost:3010/api/sessions/pin/377893';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const q = (json.questions && json.questions[0]) || null;
      console.log('raw imageUrl:', q ? q.imageUrl : json.imageUrl || 'none');
      console.log('full payload keys:', Object.keys(json));
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      console.log(data.substring(0, 1000));
    }
  });
}).on('error', (err) => {
  console.error('Request error', err.message);
});
