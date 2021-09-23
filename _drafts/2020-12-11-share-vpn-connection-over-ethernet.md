---
layout: "post"
title: "Share a VPN connection over ethernet"
categories: ubuntu, it, networking
---

<img src="/assets/static-ip.jpg" alt="Static IP" class="banner"/>

I recently learned that Comcast Business is charging for static IP address, so I figured why pay when I can just create
a VPN and use its IP. When completed I should have a USB ethernet interface than I can plug anything in to, and all its
traffic will flow through the VPN which is configured with a fixed IP address, and thus there would be no need to pay
for the fixed IP address.

<!--more-->

## Creating the VPN server

``` bash
curl -O https://raw.githubusercontent.com/angristan/openvpn-install/master/openvpn-install.sh
chmod +x openvpn-install.sh
sudo bash openvpn-install.sh
```

When it finishes, it generates a `client.ovpn` file for your first client to use. I just
used `sudo cat /root/client.ovpn` to copy it to the clipboard since it's just a small text file.

At this point, you can use Tunnelblick on your laptop to log into the server using the `client.ovpn` file. So far so
good!

## Installing OpenVPN on the client

``` bash
cd /etc/openvpn/client
nano client.ovpn
```

Paste in the contents of `client.ovpn`. Now you can try running `sudo openvpn client.ovpn` should
say `Initialization Sequence Completed`. Open up a second SSH window and enter `curl ifconfig.me`. If the command
returns the IP of your VPN server, it was a success and you can continue.

Now, close all the processes. We are going to run OpenVPN as a service.

``` bash
sudo nano /lib/systemd/system/vpn.service 
```

``` unit
[Unit]
Description= VPN Connection to Digital Ocean
After=multi-user.target

[Service]
Type=idle
WorkingDirectory=/etc/openvpn/client
ExecStart=/usr/sbin/openvpn client.ovpn

[Install]
WantedBy=multi-user.target
```

Reload and start the service:

``` bash
sudo systemctl daemon-reload 
sudo systemctl start vpn
sudp sustemctl status vpn
```

Now it's running in the background and you should see the tun0 network interface when you run `ls /sys/class/net`.

## Bridging the LAN interface to the VPN interface

This is as far as I've gotten!