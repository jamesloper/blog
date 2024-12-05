---
layout: "post"
title: "MongoDB setup guide for Ubuntu 20"
categories: ubuntu it mongo ssl
---
<img src="/assets/mongodb-ssl.png" alt="MongoDB SSL" class="banner"/>

While hosted mongodb solutions exist, they aren't for everyone. Scaling, security, and reliability is just one tutorial away. In this fairly deep tutorial we cover everything from the initial installation to optional steps such as SSL and a secondary replica. This guide is targeted for Ubuntu 20.
<!--more-->

## Quick links

1. [Getting started](#getting-started)
2. [Enable automatic startup mongod server on server boot](#enable-automatic-startup-mongod-server-on-server-boot)
3. [Create the admin user](#create-the-admin-user)
4. [Enable SSL](#enable-ssl)
5. [Adding a secondary](#adding-a-secondary)
6. [Enable swap](#enable-swap)
7. [Simple MongoDB backups with mongodump](#simple-mongodb-backups-with-mongodump)
8. [Diagnostics cheat sheet](#diagnostics-cheat-sheet)

## Getting started

In this guide, the primary will be `db.example.com`. Start by logging in and performing the apt ritual. You should already set up a user, in this case my user is `ubuntu`.

``` bash
ssh ubuntu@db.example.com
sudo apt-get install gnupg curl
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update && sudo apt upgrade
sudo apt-get install -y mongodb-org
```

**Optional:** Create a data directory. You'll want to do this so that the database doesn't reside on the boot drive. This is a good practice! XFS is the filesystem of choice for mongodb data directories.

``` bash
sudo mkdir /mnt/db/mongodb
sudo chown -R mongodb:mongodb /mnt/db/mongodb
```

Create a barebones configuration just to get it functioning. Edit `/etc/mongod.conf`.

``` yaml
storage:
  dbPath: /mnt/db/mongodb
  
net:
  bindIp: 0.0.0.0
  
replication:
  replSetName: rs0
  oplogSizeMB: 100
```

- `dbPath` should be set to the path you made. Or you can just remove the whole storage section if you are going to use the default.
- `0.0.0.0` makes your server accessible via the web.

Restart `mongod`:

``` bash
sudo service mongod restart
```

## Enable automatic startup mongod server on server boot

Register it with `systemctl` to start when your server boots

``` bash
sudo systemctl enable mongod
```

At this point you can connect to the db, but it's also wide open for attackers to take over! Next up we will deal with security.

## Create the admin user

In this section, you will configure your database to only accept username & password authentication. While we are in here we might as well take care of initializing the replica set as well. Using your existing SSH session, connect to your database and create an `admin`
user:

``` bash
mongosh
use local
rs.initiate()
use admin

db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [{role: 'root', db: 'admin'}]
})
```

Edit `/etc/mongod.conf` again! Specify a security policy. This one is absolutely required if your server is bound to 0.0.0.0! Once done, you must authenticate every time (even through localhost!)

``` yaml
security:
  authorization: "enabled"
  keyFile: /data/key
```

## Create key file
This step is kind of a song and dance but you just have to do it to appease the mongo gods.

``` bash
sudo touch /data/key
sudo chmod 400 /data/key
sudo nano /data/key
```
And just put some random string in this file!


Restart mongod:

``` bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

Try it out! You want to make sure you can log in.

``` bash
mongo mongodb://admin:password@db.example.com
```

## Enable web server

LetsEncrypt requires your server to respond to a challenge in order to fulfill a certificate request, so we'll need a tiny web server to answer their challenge:

``` bash
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt install nginx
```

At this point, navigating to `db.example.com` will result in the demo page for Nginx. Nothing further is really required to set up Nginx, and quite frankly no other software should even be running on your production database server.

## Install certbot & certificate

``` bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
certbot --nginx -d db.example.com
```

At this point, you should be able to visit the NGINX page again, but this time it will be served over HTTPS! Next, we need to set up automatic renewal and application of the cert to MongoDB. Set up a bash script that will concatenate your NGINX certificates together to create your MongoDB server certificate:

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

## Adding a secondary

Follow the same process above to get mongo installed and configured, switching out `db.example.com` with your secondary's hostname.

All nodes in a cluster must share the same secret key-- that's how they authenticate with each other. We'll make that file next. Do this step on both servers!

``` bash
echo "your-secret-key" > /data/key
```

Edit `/etc/mongod.conf`

``` bash
> security:
>  keyFile: /data/key
```

Then restart the mongo server again

``` bash
service mongod restart
```

Next, log back in to the mongo shell.

```
mongo mongodb://admin:password@db.example.com/?ssl=true
```

The following mongo shell script is to have a `secondary` that your BI tools could beat up without affecting your `primary`. That's why hidden is set to 1 and not 0. This ensures that the node can not become the primary in the event of a primary malfunction.

``` bash
rs.add({host: "secondary.example.com", priority: 0, votes: 0, hidden: 1})
rs.slaveOk()
```

If you want to provide more hosts for your app to connect to, you instead want to make them visible. The minimum number of nodes in a cluster jumps from 1 straight to 3, otherwise a cluster of 2 can not perform a vote to decide which node will become primary.

## Enable swap

In the case of large load, having a few gigs of swap space can help your database not crash. Unfortunately turning swap on can mask critical memory issues which would be better solved by adding more ram. It's always up to you to determine if you want to use swap or not. If you want to go down that route, here is how.

**Tip:** You can verify at any time that your swap is working by running `sudo swapon --show`

Run the following commands:

``` bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Now you have swap space, but it won't persist after reboot. Fix that by editing your fstab file with `sudo nano /etc/fstab` and paste the following `/swapfile swap swap defaults 0 0`

## Simple MongoDB backups with mongodump

This is probably a horrible solution for a database over 1 gig, but I just got it functional so I will share it in the hopes that someone can benefit from it.

``` bash
mkdir backups
mkdir backups/hourly
cd backups
nano backup.sh
```

Create a bash script like this:

``` bash
#!/bin/bash
mongodump --uri="mongodb://user:pass@localhost:27017/test" --out="dump"
zip -r "hourly/$(date +"%Y-%m-%d %I:%M%p").zip" dump
find hourly/* -mtime +1 -exec rm {} \;
```

This script creates a new backup and zips it, and deposits it in the hourly folder, then deletes any hourly backups that are older than a day. You can make this run hourly with `crontab -e`

## Diagnostics cheat sheet

- Clear logs with `echo "" > /var/log/mongodb/mongod.log`
- Get logs with `tail /var/log/mongodb/mongod.log`
- Edit config at `nano /etc/mongod.conf`
- Key file should be 600 permissions
- mongodb user should own `/var/log/mongodb`
- Unlink socket with `rm /tmp/mongodb-27017.sock`
- Start mongod service with `service mongod start`