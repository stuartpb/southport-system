const Gpio = require('onoff').Gpio;
const fetch = require('node-fetch');
const debounce = require('lodash.debounce');
const sensor = new Gpio(3, 'in', 'both');

function ensureHttp(address) {
  if (!/https?:/.test(address)) address = 'http://' + address;
  return address;
}

const HERALD_ENDPOINT = ensureHttp(process.env.HERALD_ENDPOINT || 'localhost');
const SNAP_URL = process.env.SNAP_URL;
const RING_DURATION = process.env.RING_DURATION;
const STILL_DURATION = process.env.STILL_DURATION;
const DEBOUNCE_TIME = process.env.DEBOUNCE_TIME || 0;

const ringEdge = 0; // ring on falling edge

function notifyHerald() {
  console.log('notifying herald')
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

const sensorTriggered = debounce(notifyHerald, DEBOUNCE_TIME, {
  leading: true, trailing: false, maxWait: DEBOUNCE_TIME
})

sensor.watch((err, value) => {
  if (err) {
    throw err;
  }

  if (value == ringEdge) {
    console.log(new Date().toISOString() + ' sensor input detected');
    return sensorTriggered();
  }
});

process.on('SIGINT', () => {
  sensor.unexport();
});

console.log('posting to ' + HERALD_ENDPOINT);
