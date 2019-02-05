const Gpio = require('onoff').Gpio;
const fetch = require('node-fetch');
const button = new Gpio(3, 'in', 'both');

const RING_ENDPOINT = process.env.RING_ENDPOINT || 'localhost';

const ringEdge = 0; // ring on falling edge

function postRing(duration) {
  return fetch(`http://${RING_ENDPOINT}/ring${
    duration ? '?duration=' + duration : ''}`, {method: 'POST'});
}

button.watch((err, value) => {
  if (err) {
    throw err;
  }

  if (value == ringEdge) {
    console.log('sensor input detected');
    return postRing();
  }
});

process.on('SIGINT', () => {
  button.unexport();
});
