import {Gpio} from 'onoff';
import morgan from 'morgan';
import {$} from 'execa';
import express from 'express';
import {Readable} from 'stream';

// Relay for ringing the doorbell.
const relay = new Gpio(4, 'high', {activeLow: true});

const app = express();

const DISPLAY = ':0';
const X_UID = 1000;
const X_GID = 1000;
const HOME = '/home/southport'; // feh fails without HOME in the environment
// hardcoding this location is admittedly pretty hacky, but meh
const asDesktopUser = $({uid: X_UID, gid: X_GID, env: {DISPLAY, HOME}});

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
  if (e.exitCode != 143) console.error(e);
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

async function startViewerProcess(imageStream, duration) {
  // defer to the termination of any existing viewer process
  if (viewerProcess) {
    await killViewerProcess();
    return startViewerProcess(imageStream, duration);
  }

  // set up a new viewer process
  viewerProcess = asDesktopUser({input: imageStream})`feh -F -`;

  // log any errors, except the one we're expecting
  viewerProcess.catch(logNonSigTermErrors);

  // set up timeout if displaying for a limited duration
  if (duration) {
    viewerTimeout = setTimeout(killViewerProcess, duration);
  }
}

async function fetchAndDisplay(location, duration) {
  const res = await fetch(location);
  if (!res.ok) throw new Error(
    `HTTP error fetching image: ${response.status} ${response.statusText}`);
  return startViewerProcess(Readable.fromWeb(res.body), duration);
}

app.post('/present/still', (req, res, next) => {
  return Promise.all([
    // wake the display
    asDesktopUser`xset dpms force on`,
    // present the still
    fetchAndDisplay(req.query.location, req.query.duration)

    ].map(p => p.catch(next))).then(() => res.send());
});

app.listen(80);
