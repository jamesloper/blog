---
layout: "post"
title: "Ubuntu Server Initial Setup"
categories: ubuntu server
---

Here is the song & dance I do every time I start a new Ubuntu server. Nice cheat sheet for me to refer back to.
<!--more-->

## Create non-root user

``` bash
adduser ubuntu
usermod -aG sudo ubuntu
rsync --archive --chown=ubuntu:ubuntu ~/.ssh /home/ubuntu
```

## Install Tailscale

``` bash
curl -fsSL https://tailscale.com/install.sh | sh
```

## Quiet the login message

``` bash
touch .hushlogin
```

## Install Node 14 & PM2

``` bash
curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt-get install -y nodejs jq
sudo npm install -g pm2
pm2 startup
```
