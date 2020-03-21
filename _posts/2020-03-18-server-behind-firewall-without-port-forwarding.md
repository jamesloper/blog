---
layout: post
title:  "How to run a server behind a firewall without port forwarding"
categories: tech
---

Without sufficient access to the router, it's not possible to expose your computer to the internet so it can act as a server.  This is often the case, you have a powerful computer behind internet you have no control over. Here I will show the best way to circumvent that via a gateway server.

<!--more-->

Initially, I searched for how to create a gateway directly to the target server's network interface, however this is actually not the way. We could be using the gateway to serve other apps, or proxy more than one remote computer. Then, we would need name-based routing anyways, so we'll use NGINX to handle requests and routing, SSH to handle the forwarding, and systemd to persist the forwarding through unstable connections.

### Configure the target computer for basic usage of SSH RemoteForward
We need to make the target computer reach out to the proxy to initiate the forwarding. Edit `~/.ssh/config` and add the following hostname block. This forms the groundwork for all to come.

``` nginx
Host proxy
  HostName example.com
  User ubuntu
  RemoteForward 4000 localhost:4000
  ServerAliveInterval 10
```

At this point, if you run `ssh proxy` on the target computer, you'll be able to navigate to `example.com:4000` If that's all you need, great! Next we'll bulk up this thing by daemonizing it and integrating with NGINX.

### Configure SSH public key authentication

Since this is going to be a daemon, there will be no prompt for the SSH password, so the remote server is going to have must authenticate with a [public key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-1804).

``` bash
ssh-keygen -t rsa
ssh-copy-id ubuntu@example.com
```

Test your new configuration with `ssh proxy` and you should be able to login without a password prompt. Make sure you can do this now because it'll be harder to diagnose once you begin daemonizing it.

### Use systemd to daemonize the SSH RemoteForward process

In Ubuntu, `systemd` is ideally suited for this, since it supports waiting until network access is established after boot, and can restart the process when it exits. Create the following config file in `/etc/systemd/system/proxy.service`

``` make
[Unit]
Description=Proxy
After=network-online.target

[Service]
Restart=always
RestartSec=20
User=ubuntu
ExecStart=/bin/ssh -NT proxy

[Install]
WantedBy=multi-user.target
```

After making the service file, you must reload `systemd`, then start it for the first time and enable it to launch at boot.

``` bash
sudo systemctl daemon-reload
sudo systemctl start proxy
sudo systemctl enable proxy
```

You can diagnose any problems by checking the log with `journalctl -u proxy.service -`

### Install the latest NGINX on the proxy server

``` bash
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt install nginx
```

### Set up host names to forward traffic to the remote computer

Add a new virtual host, in this guide, the proxy server will have the hostname `proxy.example.com` and forward to port 4000. Edit the NGINX config file at `/etc/nginx/sites-enabled/default`

``` nginx
server {
  listen 80;
  server_name proxy.example.com;
  location / {
    proxy_pass http://localhost:4000;
  }
}
```

Restart NGINX with `sudo service nginx reload`. You can now go to proxy.example.com and it should forward to port 4000 on the target computer!