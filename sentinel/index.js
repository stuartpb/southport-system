const Gpio = require('onoff').Gpio;
const fetch = require('node-fetch');
const sensor = new Gpio(3, 'in', 'both');

function ensureHttp(address) {
  if (!/https?:/.test(address)) address = 'http://' + address;
  return address;
}

const HERALD_ENDPOINT = ensureHttp(process.env.HERALD_ENDPOINT || 'localhost');
const RING_DURATION = process.env.RING_DURATION;

const ringEdge = 0; // ring on falling edge

function postRing(duration) {
  return fetch(`${HERALD_ENDPOINT}/ring${
    duration ? '?duration=' + duration : ''}`, {method: 'POST'})
    .then(console.log);
}

sensor.watch((err, value) => {
  if (err) {
    throw err;
  }

  if (value == ringEdge) {
    console.log('sensor input detected');
    return postRing(RING_DURATION);
  }
});

process.on('SIGINT', () => {
  sensor.unexport();
});
