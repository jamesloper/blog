---
layout: post
title:  "Docker cheat sheet"
categories: ubuntu, it, docker, linux
modified: 2021-03-06
---

<img src="/assets/docker.png" alt="Docker" class="banner"/>

I've set up quite a few Docker hosts, so I always wind up doing a variation of repetitive tasks. Mix and match these bad boys to get a very functional host. 
<!--more-->

## Add a non-root user
``` bash
adduser ubuntu && usermod -aG sudo ubuntu
```

## Install latest Docker Engine
Pro tip: The one in apt is not actually docker, so `sudo apt remove docker` if you accidentally added it!

``` bash
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
```

To enable Docker Engine HTTP access, edit the config file and add the tcp arg:
```bash
sudo nano /lib/systemd/system/docker.service
```
``` bash
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://127.0.0.1:5555
```

``` bash
sudo service docker restart
```

Note that 127.0.0.1 allows access only from localhost, so use SSH to proxy your laptop to port 5555. You could use 0.0.0.0 but that would allow anyone to manipulate your machine!

## SSH Config
Edit the config at `sudo nano ~/.ssh/config` and add this section:
``` bash
Host docker
  HostName example.com
  User ubuntu
  LocalForward 5555 localhost:5555
``` 
Now you can type `ssh docker` to log in and handle the forwarding!

## Install latest NGINX
The preloaded nginx is outdated, add the PPA to get the latest one.
``` bash
sudo add-apt-repository ppa:nginx/stable && sudo apt-get update && sudo apt-get install nginx
```

## Nginx HTTP Basic Auth
``` bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

Edit the config file at `sudo nano /etc/nginx/sites-enabled/default` and add:
``` conf 
auth_basic Admin;
auth_basic_user_file /etc/nginx/.htpasswd; 
```