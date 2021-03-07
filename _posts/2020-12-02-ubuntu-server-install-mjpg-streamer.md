---
layout: "post"
title: "Setup mjpg-streamer on Ubuntu Server 20"
categories: ubuntu, it, linux, streaming
modified: 2021-03-06
---

<img src="/assets/mjpg-streamer.png" alt="mjpg-streamer" class="banner"/>

mjpg-streamer is good and simple software that does no processing on the video, it just queries the capture device for a
specific resolution and passes it through to the web. I like it.

<!--more-->

### List your webcams

``` bash
sudo ls -ltrh /dev/video*
```

If there are multiple, try the first one first, like video0. If it's not there, check the power or run `lsusb` to check
the USB devices.

### Install from snap and grant permission

``` bash
sudo snap install mjpg-streamer
sudo snap connect mjpg-streamer:camera
```

### Start server

``` bash
mjpg-streamer -i "input_uvc.so -d /dev/video0 -r XGA"
```

### Configure daemon

Normally I'd use `systemctl` but the snap can be configured as a daemon.

``` bash
sudo nano /var/snap/mjpg-streamer/current/config 
```

``` bash
INPUTOPTS="input_uvc.so -d /dev/video0"
PORT="-p 8080"
DAEMON="true"
```

``` bash
sudo snap restart mjpg-streamer
```

If it's not working, try looking at the logs

``` bash
sudo snap logs mjpg-streamer
```