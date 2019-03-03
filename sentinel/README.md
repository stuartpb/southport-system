# Southport Sentinel Server

This is the daemon that runs at the end of the driveway, signalling the endpoint in the house when a vehicle is detected at the end of the driveway.

## Installing the Sentinel Service

Edit the parameters in the env.template.conf file here.

Then, as root:

```
mkdir /etc/systemd/system/southport-sentinel.service.d/
cp env.template.conf /etc/systemd/system/southport-sentinel.service.d/env.conf
systemctl enable --now southport-sentinel.service
```
