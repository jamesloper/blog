---
layout: post
title:  "How to set up a Ubuntu desktop on a VPS"
categories: linux ubuntu desktop
---

<img alt="Ubuntu Cloud Computer" src="/assets/ubuntu-xfce.png" title="Ubuntu Cloud Computer" class="banner"/>

An always-online server running a full Ubuntu Desktop can be useful for many reasons. I usually use DigitalOcean but the popular [France-based host OVH](https://www.ovh.com/world/vps/) seems perfect for this scenario.
    
<!--more-->

## Install xfce4 desktop environment
The familiar desktops Unity and Gnome don't work without a display plugged in so the next best choice is Xfce which is like the Raspberry Pi desktop.

``` bash
sudo apt install xfce4 xfce4-goodies tightvncserver
```

## Create a user and start VNC
Each user gets a VNC server. In this example, we set up an account called user1 and give them sudoer permissions.

``` bash 
adduser user1
usermod -a -G sudo user1
```

At this point we are ready to log in as user1 and start the VNC server. The `:1` is a screen number. Increment this number for each additional user and write down which screen number belongs to each user.

``` bash
su user1
vncserver -geometry 1280x800 :1
```

At this point you can use a VNC app like [RealVNC](https://www.realvnc.com/en/connect/download/viewer/) to connect. The first screen will be on port `590X` where `X` is the screen number to connect to.

## Run vncserver at startup using systemctl
We can take this to the next level by creating a service that will run at startup. Create a service for each user. First, kill any running VNC servers with
``` bash 
vncserver -kill :1
vncserver -kill :2
vncserver -kill :3
...
```

In this example we are making a service for `user1` using the screen `:1` so create a new service file at `/etc/systemd/system/vnc1.service`:

``` make
[Unit]
Description=VNC server for user1
After=syslog.target network.target

[Service]
Type=normal
User=user1
Group=user1
WorkingDirectory=/home/user1

PIDFile=/home/user1/.vnc/%H:1.pid
ExecStartPre=/usr/bin/vncserver -kill :1 > /dev/null 2>&1
ExecStart=/usr/bin/vncserver -geometry 1280x800 :1
ExecStop=/usr/bin/vncserver -kill :1

[Install]
WantedBy=multi-user.target
```

Now reload systemctl and start the VNC service.

``` bash 
sudo systemctl daemon-reload
sudo systemctl start vnc1
sudo systemctl enable vnc1
```