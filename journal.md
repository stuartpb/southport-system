# Southport System Build Journal

## 2019-02-01

Set up with SSH access and Chromebook's pubkey as authorized_keys (created .ssh directory with chmod 700 for pi user on both)

Set up static DHCP leases on router for 192.168.8.x (for wireless interfaces) and 192.168.7.x (for wired interfaces)

## 2019-02-02

Installing latest LTS Node on both machines via `curl -sL https://deb.nodesource.com/setup_10.x | bash -` and `apt-get install -y nodejs` (after `sudo -i`)

## 2019-02-05

Redid DHCP leases for one RPi after blowing the voltage regulator

## 2019-03-03

Installed feh on homebase pi, renaming and reinstalling services
