# southport-system

A set of scripts and files used for a Raspberry-Pi-based home automation solution.

## Initial setup

This documentation assumes that the Raspberry Pi has a fresh installation of [Raspberry Pi OS](https://www.raspberrypi.com/software/), and that the network and initial username (implicitly assumed to be `southport`, in the Herald code at least) have been configured in the initial setup, along with all system updates and any other setup details such as time zone.

## Initial configuration

From the desktop GUI, set the hostname for the system as applicable (consult your local naming plan) and enable SSH from Raspberry Pi's setup dialog, then add a fixed IP address for the system by editing the network connection and pressing "Additional IP Addresses". (There's probably a better way to do this from the command line, but that's not yet detailed here.)

## Installing node.js prerequisite

To install Node.js, from a root terminal (ie. opening a terminal and running `sudo -i`):

```
curl -sL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs
```

## Installing specialization

Consult the README files for the individual devices to complete the setup for each component:

- [herald](herald/README.md)
- [sentinel](sentinel/README.md)
