---
layout: "post"
title: "How to setup MongoDB with SSL"
categories: mongo, ssl, it
---

<img src="/assets/mongodb-ssl.png" alt="MongoDB SSL" class="banner"/>

Hosted MongoDB solutions typically include an SSL certificate, so when you are rolling your own, you'll want to set up
SSL with LetsEncrypt.

<!--more-->

LetsEncrypt requires your server to respond to a challenge in order to fulfill a certificate request, so we'll need a
web server to answer their challenge.

``` bash
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt install nginx
```

At this point, navigating to `db.example.com` will result in the demo page for Nginx. Nothing further is really required
to set up Nginx, and quite frankly no other software should even be running on your production database server.

Next, install Certbot, the official tool that fully automate setup and of course renewal of LetsEncrypt certificates.

### Ubuntu 18

``` bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt update
sudo apt install software-properties-common python-certbot-nginx
```

### Ubuntu 20

``` bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

Create the certificate:

``` bash 
certbot --nginx -d db.example.com
```

Set up a bash script that will concatenate your NGINX certificates together to create your MongoDB server certificate.

``` bash
cd ~
nano renew-mongo-cert.sh
```

``` bash
#!/bin/bash
DOMAIN=db.example.com
newestFull=$(ls -v /etc/letsencrypt/archive/$DOMAIN/fullchain*.pem | tail -n 1)
newestPriv=$(ls -v /etc/letsencrypt/archive/$DOMAIN/privkey*.pem | tail -n 1)
cat $newestFull $newestPriv > /etc/ssl/mongo.pem
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

Set the file permissions for the outputted pem file. This is only needed one time.

``` bash
chmod 600 /etc/ssl/mongo.pem
chown mongodb:mongodb /etc/ssl/mongo.pem
```

Add the script as a cron job with `crontab -e`

```
0 0 1 * * /root/renew-mongo-cert.sh
```

Reboot, and now you can connect through SSL. Note that the URL now contains the `ssl` param:

``` bash
mongo mongodb://admin:password@db.example.com/?ssl=true
```
