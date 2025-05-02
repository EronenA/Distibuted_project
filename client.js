// client.js
const net = require('net');

const expressions = [
  "3 + 5",
  "12 / 4",
  "Math.sqrt(64)",
  "2 ** 10",
  "invalid + 1"
];

const client = new net.Socket();
client.connect(4000, 'localhost', () => {
  client.write(JSON.stringify(expressions));
});

client.on('data', (data) => {
  const results = JSON.parse(data.toString());
  results.forEach(r => {
    console.log(`${r.expr} => ${r.result !== null ? r.result : `Error: ${r.error}`}`);
  });
  client.end();
});
