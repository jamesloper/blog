---
layout: post
title:  "How to set up a Ubuntu desktop on a VPS"
categories: linux
---

<img alt="Ubuntu Cloud Computer" src="/assets/ubuntu-xfce.png" title="Ubuntu Cloud Computer" class="banner"/>

An always-online server running a full Ubuntu Desktop can be useful for many reasons. I usually use DigitalOcean but the popular [France-based host OVH](https://www.ovh.com/world/vps/) seems perfect for this scenario.
    
<!--more-->

### Install Desktop
The familiar desktops Unity and Gnome don't work without a display plugged in so the next best choice is Xfce which is like the Raspberry Pi desktop.

``` bash
sudo apt install xfce4 xfce4-goodies tightvncserver
```

### Configure Accounts
For each user you want to add, run `adduser username`. Each will have it's own desktop environment. If you'd like the user to be a sudoer run `usermod -a -G sudo username`.

### Configure VNC
Repeat this process until all users are configured. Each user will have its own configuration.

1. Run `su username` to change to the test user.
2. Run `vncserver -geometry 1024x768` and choose a password.

### Connect
Use your favorite VNC app to connect.

### Diagnostics
- Kill VNC with `vncserver -kill :1`
- Check the PID with `pgrep vnc`