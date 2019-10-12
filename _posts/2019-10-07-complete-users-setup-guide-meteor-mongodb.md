---
layout: post
title: "Complete users setup guide for meteor and mongodb"
categories: javascript
---
Meteor is one of the few frameworks to make use of the oplog feature in mongodb. It's quite a feat of engineering and the way it is done uses it heavily. It's very important to set it up correctly.

<!--more-->

We need to create at two users. A "Meteor User" who has read/write abilities & an "Oplog User" for oplog tailing. This guide assumes the database is named `app`, [SSL is enabled, and the replicaSet is named rs0](/mongodb-cluster-setup-with-ssl).

### Create the Meteor User
Outside of meteor, this is called an "application user". This user will be used for the `MONGO_URL`. Note the user name doesn't have to match the database name, but I think it helps keep things simple.


```bash
use app
db.createUser({user: 'app', pwd: 'password', roles: [{role: 'readWrite', db: 'app'}]});
```

### Creating the oplog user
This user will be used for the `MONGO_OPLOG_URL`. You may notice the db is `local`. This where the oplog collection is.

```bash
use admin
db.createUser({user: 'oplog', pwd: 'password', roles: [{role: 'read', db: 'local'}]})
```

### Check users
You can verify that you have created your two users correctly by connecting to the database via the mongo shell:

```
// List all the databases on the primary node.
show dbs

// Meteor apps will normally only have 3 dbs
admin   0.000GB  // For dbs authentication
local   0.000GB  // For oplog
app     0.000GB  // To store our Meteor collections. Won't exist until it's created

// Check the users
use admin
db.system.users.find().pretty()
Meteor User should have: {role: 'readWrite', db: 'app'}
Oplog User should have: {role: 'read', db: 'local'}
```

### Generate connection strings
Create the `MONGO_URL` and `MONGO_OPLOG_URL` connection strings using the passwords from earlier.

```bash
MONGO_URL=mongodb://app:password@db.example.com/app?ssl=true
MONGO_OPLOG_URL=mongodb://oplog:password@db.example.com/local?ssl=true&authSource=admin&replicaSet=rs0
```

That's it! We now have the two URLs needed to connect our Meteor app with our database.