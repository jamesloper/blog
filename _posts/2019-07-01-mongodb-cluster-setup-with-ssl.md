---
layout: post
title:  "How to make a mongodb cluster with a hidden replica and secure with SSL"
categories: javascript
---
While hosted mongodb solutions exist, they aren't for everyone. Scaling, security, and reliability is just one tutorial away.  
<!--more-->

### Set up your primary server

In this example, the primary is `db.example.com`. Start by creating a data directory on a mounted volume. Remember, WiredTiger has the best performance on XFS.

``` bash
ssh root@db.example.com
apt update && apt upgrade
```

Install mongodb:

``` bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
apt update
apt install -y mongodb-org
```

Create a data directory
``` bash
mkdir /mnt/db/mongodb
chown -R mongodb:mongodb /mnt/db/mongodb
```

Create a bare bones configuration just to get it functioning. Edit `/etc/mongod.conf`.

``` conf
storage:
  dbPath: /mnt/db/mongodb
net:
  bindIp: 0.0.0.0
replication:
  replSetName: rs0
  oplogSizeMB: 100
```

`dbPath` is now set to the path you made. `0.0.0.0` makes your server accessible via the web.

Restart `mongod` and register it with `systemctl` to start when your server boots:

``` bash
service mongod restart
systemctl enable mongod
```

### Create the admin user

In this section, you will configure your database to only accept username & password authentication. Create an `admin` user:

``` bash
mongo
use local
rs.initiate()
use admin

db.createUser({
  user: "admin",
  pwd: "password",
  roles: [ { role: "root", db: "admin" } ]
})
```

Edit `/etc/mongod.conf` again! Specify a security policy. This one is absolutely required if your server is bound to 0.0.0.0! Once done, you must authenticate every time (even through localhost!)

``` yaml
security:
  authorization: "enabled"
```

Restart mongod:

``` bash
systemctl restart mongod
systemctl status mongod
```

Try it out! You want to make sure you can log in!

``` bash
mongo mongodb://admin:password@db.example.com
```

### Enable SSL

First, you need to have a minimal web server running to connect to LetsEncrypt. Install NGINX and Certbot:

``` bash
apt install nginx
add-apt-repository ppa:certbot/certbot
apt update
apt install software-properties-common python-certbot-nginx
```

Create the certificate for this host:
``` bash 
certbot --nginx -d db.example.com
```

Set up automatic creation of the SSL certificate:

``` bash
cd ~
nano renew-mongo-cert.sh
```

Paste in this script:

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

Make it executable

``` bash
chmod +x renew-mongo-cert.sh
```

Enable SSL in the mongo server configuration in `/etc/mongod.conf` by adding this under the `net` declaration:

``` yaml
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/ssl/mongo.pem
```

Run the script for the first time:

``` bash
./renew-mongo-cert.sh
```

Add the script as a cron job with `crontab -e`

```
0 0 1 * * renew-mongo-cert.sh
```

Reboot, and now you can connect through SSL. Note that the URL now contains the ssl param:

```
mongo mongodb://admin:password@db.example.com/?ssl=true
```


### Adding a secondary

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
