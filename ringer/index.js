const Gpio = require('onoff').Gpio;
const relay = new Gpio(4, 'high', {activeLow: true});
const app = require('express')();

function ringBell(duration) {
  return new Promise((resolve, reject) => {
    relay.write(1, err => {
      if (err) return reject(err);
      setTimeout(()=> relay.write(0, err => {
        if (err) return reject(err);
        resolve();
      }), duration || 0)
    })
  });
}

app.post('/ring',(req, res) => {
  console.log('ring received');
  ringBell(req.query.duration).then(() => res.send());
})

app.listen(80);
