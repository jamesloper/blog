---
layout: "post"
title: "NGINX cheatsheet for Ubuntu Server 20"
categories: ubuntu, it, networking, nginx
---

It's no secret I love NGINX. I use it in all my projects.

<!--more-->

## Create a non-root user

``` bash
adduser ubuntu && usermod -aG sudo ubuntu
```

## Install latest NGINX

``` bash
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

## Proxy config

``` conf
server {
    listen 80;
    server_name example.jamesloper.com;
    location / {
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
        proxy_pass http://localhost:3000;
    }
}
```

## Proxy config with WebSockets

``` conf
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name example.jamesloper.com;
    root /var/www/html;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $host;
    }
}
```

## Custom 500 error

Goes *inside* a server block!

``` conf
    error_page 500 502 503 504 /500.html;
    location = /500.html {
        root /var/www/html;
        internal;
    }
```

## HTTP redirect block

``` conf
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

## Enable SSL

``` bash
sudo apt install certbot python3-certbot-nginx
certbot --nginx -d db.example.com
```
