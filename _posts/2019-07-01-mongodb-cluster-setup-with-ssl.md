---
layout: post
title:  "How to make a mongodb cluster with a hidden replica and secure with SSL"
categories: ubuntu, it, mongo, ssl
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
wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
sudo apt update
sudo apt install -y mongodb-org
```

Optional: Change data directory
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
sudo service mongod restart
sudo systemctl enable mongod
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
sudo systemctl restart mongod
sudo systemctl status mongod
```

Try it out! You want to make sure you can log in!

``` bash
mongo mongodb://admin:password@db.example.com
```

### Enable SSL

Follow the guide for [MongoDB SSL setup](/mongodb-ssl-setup)

Once you wrap up, you'll be able to connect through SSL. Note that the URL now contains the `ssl` param:

``` bash
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
