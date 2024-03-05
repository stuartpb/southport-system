# Southport Herald Server

This is the HTTP daemon that runs on a Raspberry Pi hooked up to the living room TV, which is also wired to the doorbell, and receives POSTs from [the Sentinel Server](../sentinel/README.md)

## GPIO setup

The Herald unit holds GPIO 4 high, and brings it low to ring the doorbell.

## Installing prerequisites

First, install all the prerequisites described in [the base README](../README.md). Note that the Herald server is **hard-coded as expecting the desktop user to be named `southport`**: file an issue if this needs to be a configurable value for you.

Once those prerequisites are installed, run `sudo apt install feh` to install the `feh` viewer, which will be used to display camera images on the connected screen when [the sentinel server](../sentinel/README.md) is configured to request it.

## Installing the Herald Service

As the default user (presumably `southport`):

```sh
git clone https://github.com/stuartpb/southport-system.git

cd southport-system/herald
npm install
sudo systemctl enable --now $PWD/southport-herald.service
```

## Testing

You can test the server by POSTing requests to it directly, eg. via `curl`:

```sh
curl -X POST 'http://localhost:3000/ring?duration=5000'
curl -X POST 'http://localhost:3000/present/still?location=https://blogs.library.duke.edu/bitstreams/files/2016/06/indian_head-1024x768.jpg&duration=5000'
```
