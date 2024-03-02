const Gpio = require('onoff').Gpio;
const fetch = require('node-fetch');
const debounce = require('lodash.debounce');
const sensor = new Gpio(3, 'in', 'both');
const { v4: uuid } = require('uuid');
const nodemailer = require("nodemailer");

function ensureHttp(address) {
  if (!/https?:/.test(address)) address = 'http://' + address;
  return address;
}

const HERALD_ENDPOINT =
  ensureHttp(process.env.HERALD_ENDPOINT || 'localhost');
const SNAP_URL = process.env.SNAP_URL;

const RING_DURATION = process.env.RING_DURATION;
const STILL_DURATION = process.env.STILL_DURATION;
const DEBOUNCE_TIME = process.env.DEBOUNCE_TIME || 0;

const EMAIL_SENDER_ADDRESS = process.env.EMAIL_SENDER_ADDRESS;
const EMAIL_SENDER_NAME =
  process.env.EMAIL_SENDER_NAME || "Southport Driveway";
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT;
const EMAIL_ATTACHMENT_FILENAME =
  process.env.EMAIL_ATTACHMENT_FILENAME || "snap.jpg";

const SMTP_HOSTNAME = process.env.SMTP_HOSTNAME;
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 465;
const SMTP_USERNAME = process.env.SMTP_USERNAME || EMAIL_SENDER_ADDRESS;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

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

const mailer = nodemailer.createTransport({
  host: SMTP_HOSTNAME,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

function sendEmailNotification() {
  const cid = uuid();
  return mailer.sendMail({
    from: `${JSON.stringify(EMAIL_SENDER_NAME)} <${EMAIL_SENDER_ADDRESS}>`,
    to: EMAIL_RECIPIENT,
    subject: `Vehicle Detected from ${
      EMAIL_SENDER_NAME} at ${new Date().toLocaleString()}`,
    text: "Image attached.",
    html: `<img src="cid:${cid}">`,
    attachments: [{
      filename: EMAIL_ATTACHMENT_FILENAME,
      path: SNAP_URL,
      cid }]
  });
}

function postNotifications() {
  const notifications = [notifyHerald()];

  if (EMAIL_RECIPIENT)
    notifications.push(sendEmailNotification());
  
  return Promise.all(notifications.map(p=>p.catch(console.error)));
}

const sensorTriggered = debounce(postNotifications, DEBOUNCE_TIME, {
  leading: true, trailing: false, maxWait: DEBOUNCE_TIME
});

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
