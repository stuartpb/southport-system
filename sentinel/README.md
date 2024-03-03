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

Edit the parameters in the env.template.conf file here with something like `nano env.template.conf`.

Then, as root (ie. after running `sudo -i`):

```sh
mkdir /etc/systemd/system/southport-sentinel.service.d/
cp env.template.conf /etc/systemd/system/southport-sentinel.service.d/env.conf
systemctl enable --now $PWD/southport-sentinel.service
```
