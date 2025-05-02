// server.js
const net = require('net');
const { Worker } = require('worker_threads');

const PORT = 4000;

const server = net.createServer((socket) => {
  socket.on('data', async (data) => {
    const expressions = JSON.parse(data.toString());
    console.log('Received expressions:', expressions);

    const results = await Promise.all(expressions.map(expr => {
      return new Promise((resolve) => {
        const worker = new Worker('./worker.js', { workerData: expr });
        worker.on('message', msg => resolve({ expr, ...msg }));
        worker.on('error', err => resolve({ expr, result: null, error: err.message }));
      });
    }));

    socket.write(JSON.stringify(results));
    socket.end();
  });
});

server.listen(PORT, () => {
  console.log(`Calculator server running on port ${PORT}`);
});
