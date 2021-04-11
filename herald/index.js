const Gpio = require('onoff').Gpio;

// Relay for ringing the doorbell.
const relay = new Gpio(4, 'high', {activeLow: true});

const morgan = require('morgan');

const fetch = require('node-fetch');

const execa = require('execa');

const app = require('express')();

const DISPLAY = ':0';
const X_UID = 1000;
const X_GID = 1000;
const HOME = '/home/pi'; // feh fails without HOME in the environment
// hardcoding this location is admittedly pretty hacky, but meh

app.use(morgan('[:date[iso]] :remote-addr ":method :url HTTP/:http-version" :status :res[content-length]'));

function ringBell(duration) {
  return new Promise((resolve, reject) => {
    relay.write(1, err => {
      if (err) return reject(err);
      setTimeout(()=> relay.write(0, err => {
        if (err) return reject(err);
        resolve();
      }), duration || 0);
    });
  });
}

app.post('/ring', (req, res) => {
  ringBell(req.query.duration).catch(console.error);
  res.send();
});

let viewerProcess = null;
let viewerTimeout = null;

function logNonSigTermErrors(e) {
  // if the process wasn't terminated by SIGTERM, log this error
  if (e.code != 143) console.error(e);
}

function killViewerProcess() {
  // clear timeout in case this function is being called early
  clearTimeout(viewerTimeout);
  viewerTimeout = null;

  // send the termination signal and return promise for when the process ends
  viewerProcess.kill();
  const lose = () => viewerProcess = null;
  return viewerProcess.then(lose, lose);
}

class HTTPResponseError extends Error {
  constructor(response, ...args) {
    this.response = response;
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
  }
}

const checkStatus = response => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
}

function fetchAndDisplay(location, duration) {
  return fetch(location).then(res => {
    // throw error if image request is not OK
    checkStatus(res);

    // stream image to new viewer process
    return startViewerProcess(res.body, duration);
  });
}

function startViewerProcess(imageStream, duration) {
  // defer to the termination of any existing viewer process
  if (viewerProcess) {
    return killViewerProcess().then(
      startViewerProcess.bind(null, imageStream, duration));
  }

  // set up a new viewer process
  viewerProcess = execa('feh', ['-F', '-'], {
    uid: X_UID, gid: X_GID, env: {DISPLAY, HOME}, input: imageStream});

  // log any errors, except the one we're expecting
  viewerProcess.catch(logNonSigTermErrors);

  // set up timeout if displaying for a limited duration
  if (duration) {
    viewerTimeout = setTimeout(killViewerProcess, duration);
  }

  // ensure that we're returning a resolved Promise context,
  // whether this was called from killViewerProcess.then or not
  return Promise.resolve();
}

app.post('/present/still', (req, res, next) => {
  return Promise.all([
    // wake the display
    execa('xset', 'dpms force on'.split(' '), {
      uid: X_UID, gid: X_GID, env: {DISPLAY}}),
    // present the still
    fetchAndDisplay(req.query.location, req.query.duration)

    ].map(p=>p.catch(next))).then(()=>res.send());
});

app.listen(80);
