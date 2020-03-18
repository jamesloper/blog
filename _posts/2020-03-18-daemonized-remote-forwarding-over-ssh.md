---
layout: post
title:  "Persistent RemoteForward over SSH"
categories: tech
---

Without sufficient access to the router, it's not possible to expose your computer to the internet so it can act as a server.  This is often the case, you have a powerful computer behind internet you have no control over. Here I will show you how to create a `service` that will ensure connection to a proxy server and reconnect whenever the internet goes down temporarily.

<!--more-->

In the first round, I searched for answers to make the proxy server into a gateway directly to the target server, however this is actually not the way. We could be using the proxy server to host websites locally, run it's own services, etc. So I decided to change gears and have the proxy route traffic according to `server_name`. Additionally we can handle the SSL on the proxy server. Further we can make use of SSH to handle the back link. When you think about it, this sounds more like a flexible SaaS product than a fixed static gateway.

We're going to use a proxy server that will accept the incoming connections and forward them to the proper target server and port, based on the `server_name` in an NGINX server block. This way we will elegantly fit the proxy host in with the rest of the server blocks.

### Configure the target computer to initiate the RemoteForward
We need to make the target computer reach out to the proxy to initiate the forwarding. Edit `~/.ssh/config` and add the following hostname block. This forms the groundwork for all to come.

``` yaml
Host proxy
  HostName example.com
  User ubuntu
  RemoteForward 4000 localhost:4000
  ServerAliveInterval 10
```

At this point, if you run `ssh proxy` on the target computer, you'll be able to navigate to `example.com:4000`

### Configure SSH public key authentication

Since this is going to be a daemon, there will be no prompt for the SSH password, so the remote server is going to have must authenticate with a [public key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-1804).

``` bash
ssh-keygen -t rsa
ssh-copy-id ubuntu@example.com
```

Test your new configuration with `ssh proxy` and you should be able to login without a password prompt. Make sure you can do this now because it'll be harder to diagnose once you begin daemonizing it.

### Use `systemd` to enable launch at boot and persistence

The `systemd` is ideally suited for this. Create the following config file in `/etc/systemd/system/proxy.service`

```
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

Edit the NGINX config file at `/etc/nginx/sites-enabled/default`

Add a new virtual host, in this guide, the proxy server will have the hostname `proxy.example.com` and forward to port 5000.

``` conf
server {
  listen 80;
  server_name proxy.example.com;
  location / {
    proxy_pass http://localhost:5000;
  }
}
```

Restart NGINX with `sudo service nginx reload`. You can now go to proxy.example.com and it should forward to port 4000 on the target computer! 