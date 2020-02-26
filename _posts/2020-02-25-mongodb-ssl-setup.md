---
layout: post
title:  "How to setup MongoDB with SSL"
categories: mongo
---

<img src="/assets/mongodb-ssl.png" alt="MongoDB SSL" class="banner"/>

Hosted MongoDB solutions typically include an SSL certificate, so when you are rolling your own, you'll want to set up SSL. Hosted databases aren't for everyone, fortunately security is just one tutorial away.

<!--more-->

In this example, the primary is already set up on `db.example.com`, so that is the domain this tutorial will use to demonstrate the certificate renewal process. 

LetsEncrypt requires your server to respond to a challenge in order to fulfill a certificate request, so we'll need a web server to answer their challenge.

``` bash
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt install nginx
```

At this point, navigating to `db.example.com` will result in the demo page for Nginx. Nothing further is really required to set up Nginx.

Next, install Certbot, the official tool that fully automate setup and of course renewal of LetsEncrypt certificates.

``` bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt update
sudo apt install software-properties-common python-certbot-nginx
```

Create the certificate for this host:
``` bash 
certbot --nginx -d db.example.com
```

Set up a bash script that will adapt this certificate for usage in MongoDB:

``` bash
cd ~
nano renew-mongo-cert.sh
```

This will be the script contents:

``` bash
#!/bin/bash
DOMAIN=db.example.com

certbot renew
newestFull=$(ls -v /etc/letsencrypt/archive/"$DOMAIN"/fullchain*.pem | tail -n 1)
newestPriv=$(ls -v /etc/letsencrypt/archive/"$DOMAIN"/privkey*.pem | tail -n 1)
cat {$newestFull,$newestPriv} | tee /etc/ssl/mongo.pem
chmod 600 /etc/ssl/mongo.pem
chown mongodb:mongodb /etc/ssl/mongo.pem
service mongod restart
```

Make it executable:

``` bash
chmod +x renew-mongo-cert.sh
```

Enable SSL in the mongo server configuration in `/etc/mongod.conf` by adding this under the `net` declaration:

``` yaml
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/ssl/mongo.pem
```

Run the script for the first time:

``` bash
./renew-mongo-cert.sh
```

Add the script as a cron job with `crontab -e`

```
0 0 1 * * renew-mongo-cert.sh
```

Reboot, and now you can connect through SSL. Note that the URL now contains the `ssl` param:

``` bash
mongo mongodb://admin:password@db.example.com/?ssl=true
```