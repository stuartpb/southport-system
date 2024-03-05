# Southport Sentinel Server

This is the daemon that runs at the end of the driveway, signalling the endpoint in the house when a vehicle is detected at the end of the driveway.

## GPIO setup

The Sentinel unit watches for GPIO 3 to be pulled low to recognize when the driveway sensor is activated.

## Installing prerequisites

First, install all the prerequisites described in [the base README](../README.md).

## Installing the Sentinel Service

As the default user (presumably `southport`):

```sh
git clone https://github.com/stuartpb/southport-system.git

cd southport-system/sentinel
npm install
```

## Configuring

Edit the parameters in the env.template.conf file here with something like `nano env.template.conf`.

Not all potentially-necessary parameters are included in `env.template.conf`, but most of the missing variables you might need use the names one would intuitively expect: consult the code in `index.js` to make sure.

## Enabling and Starting

Once the configuration has been entered, as root (ie. after running `sudo -i`):

```sh
mkdir /etc/systemd/system/southport-sentinel.service.d/
cp env.template.conf /etc/systemd/system/southport-sentinel.service.d/env.conf
systemctl enable --now $PWD/southport-sentinel.service
```

## Testing

You can simulate a detector trigger by sending SIGUSR1 to the server process:

```sh
systemctl kill -s SIGUSR1 southport-sentinel.service
```

To restrict this simulation to only testing the email functionality, you may set the `SIGUSR1_TEST` environment variable to `email`.

For example, to insert a configuration shim so that all test email will go to an [Ethereal Email](https://ethereal.email/) account, you can create a `/etc/systemd/system/southport-sentinel.service.d/x-testing.conf` file that looks like this:

```ini
[Service]
Environment=EMAIL_SENDER_ADDRESS=ethel6@ethereal.email
Environment=SMTP_PASSWORD=3Pz4v8qw5BcUn8FSWT
Environment=SMTP_HOSTNAME=smtp.ethereal.email
Environment=SMTP_PORT=587
Environment=SIGUSR1_TEST=email
```
