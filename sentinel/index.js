const Gpio = require('onoff').Gpio;
const fetch = require('node-fetch');
const sensor = new Gpio(3, 'in', 'both',
  {debounceTimeout: process.env.DEBOUNCE_TIME || 0});

function ensureHttp(address) {
  if (!/https?:/.test(address)) address = 'http://' + address;
  return address;
}

const HERALD_ENDPOINT = ensureHttp(process.env.HERALD_ENDPOINT || 'localhost');
const SNAP_URL = process.env.SNAP_URL;
const RING_DURATION = process.env.RING_DURATION;
const STILL_DURATION = process.env.STILL_DURATION;

const ringEdge = 0; // ring on falling edge

function notifyHerald() {
  const fetches = [fetch(`${HERALD_ENDPOINT}/ring${
    RING_DURATION ? '?duration=' + RING_DURATION : ''}`,
    {method: 'POST'})];

  if (SNAP_URL) {
    fetches.push(fetch(`${HERALD_ENDPOINT}/present/still?location=${
      encodeURIComponent(SNAP_URL)}${
      STILL_DURATION ? '&duration=' + STILL_DURATION : ''}`,
      {method: 'POST'}));
  }

  return Promise.all(fetches.map(p=>p.catch(console.error)));
}

sensor.watch((err, value) => {
  if (err) {
    throw err;
  }

  if (value == ringEdge) {
    console.log(new Date().toISOString() + ' sensor input detected');
    return notifyHerald();
  }
});

process.on('SIGINT', () => {
  sensor.unexport();
});

console.log('posting to ' + HERALD_ENDPOINT);
