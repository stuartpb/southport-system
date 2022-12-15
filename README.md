# southport-system

A set of scripts and files used for a Raspberry-Pi-based home automation solution.

## Installing

As the `southport` user on the system, from the user's home directory:

```sh
git clone https://github.com/stuartpb/southport-system.git

# the following commands use $THIS_END to refer to "ringer" or "sensor"
# adjust as appropriate
cd southport-system/$THIS_END
npm install
sudo systemctl enable --now /home/southport/southport-system/$THIS_END/southport-$THIS_END.service
```
