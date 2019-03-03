const Gpio = require('onoff').Gpio;

// Relay for ringing the doorbell.
const relay = new Gpio(4, 'high', {activeLow: true});

const morgan = require('morgan');

const execa = require('execa');

const app = require('express')();

const VIEWER = 'feh';
const DISPLAY = ':0';
const X_UID = 1000;
const X_GID = 1000;

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
  ringBell(req.query.duration).catch(console.error)
  res.send();
});

let viewerProcess = null;
let viewerTimeout = null;

function killViewerProcess() {
  // clear timeout in case this function is being called early
  clearTimeout(viewerTimeout);
  viewerTimeout = null;

  // send the termination signal and return promise for when the process ends
  viewerProcess.kill();
  return viewerProcess.then(()=>viewerProcess = null);
}

function startViewerProcess(location, duration) {
  // defer to the termination of any existing viewer process
  if (viewerProcess) {
    return killViewerProcess().then(
      startViewerProcess.bind(null, location, duration));
  }

  // set up a new viewer process
  viewerProcess = execa(VIEWER, [location], {
    uid: X_UID, gid: X_GID, env: {DISPLAY}}).catch(console.error);
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
    startViewerProcess(req.query.location, req.query.duration)

    ]).then(res.send.bind(res), next);
});

app.listen(80);
