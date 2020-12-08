---
layout: "post"
title: "Meteor deployments without mup"
categories: meteor, ubuntu, javascript
---

I love [mup](http://meteor-up.com/) and have been using it for years. It's the simplest way to get your meteor project
deployed. However, when it comes to using binaries in your projects, it necessitates a docker image and of the
continuous maintenance of said image. In the spirit of keeping things simple, I opted to switch my deployment strategy
to run a node server directly on the host.

<!--more-->

### Advantages of deploying manually

It goes without saying, familiarity with the inner workings of a large and powerful tool like meteor is always a good
thing. When the "training wheels" are removed, you are free to configure each module in the stack to best suit your
purpose.

1. **There is no longer an SSL error during deployment.** The error is a relic of a long-standing "code smell" from mup
   that I do not like. I believe the cause is that SSL support is handled by a separate docker container which becomes
   part of a docker network, and while that container is down, the certificate is gone.

2. **You can replace the 500 error page that appears during deployments.** When you configure NGINX yourself, you don't
   have to worry about "stepping on toes".

3. **There is no need to author and maintain a docker image.** That's one less thing to worry about.

4. **Faster deployments.** Once your bundle is uploaded, the deployment is running in mere seconds!

### Summary

You can run any number of meteor apps directly on the server, each one bound to a different port. NGINX will provide the
SSL and forward requests to the correct port based on the requested domain. Certbot will auto-renew all certs. There is
no docker. You can install additional software such as ffmpeg on the server.

### Provisioning from a blank server

You'll want to have set up PEM key authentication in SSH, if you don't know how
to, [check out this guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-20-04). And
don't forget to create a non-root user to run your apps under.

``` bash
adduser ubuntu && usermod -aG sudo ubuntu
```

Install nginx, certbot and nodejs...

``` bash
curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt install -y nginx certbot python3-certbot-nginx nodejs jq
sudo npm install -g pm2
```

### Configure NGINX to proxy to node

Node is not running any of our apps yet, but we can stage the config files and get SSL working. Create a vhost for and
app that will run on port 3000...

``` bash
sudo nano /etc/nginx/sites-available/default
```

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
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $host;
    }
}
```

Test the config, restart nginx, and enable SSL:

``` bash
sudo nginx -t
sudo service nginx restart
certbot --nginx -d example.jamesloper.com
```

### Creating the upload script for your laptop

Create `.deploy` folder for your deployment scripts. In that folder create two more folders to contain your staging and
production environment variables.

```
.deploy/
├── example/
│   ├── env.sh
│   └── staging.json
├── example-staging/
│   ├── env.sh
│   └── settings.json
├── deploy.sh
└── remove-script.sh
```

### Contents of `deploy.sh`

``` bash
#!/bin/bash

function log() {
  echo "\033[0;35m\033[1m$1\033[0m$2"
  tput sgr0
}

# Check for the right files inside the deployment folder
[ ! -f "$1/settings.json" ] && log "Could not locate settings.json" && exit 1
[ ! -f "$1/env.sh" ] && log "Could not locate env.sh" && exit 1

cd ../
PROJECT=$(basename $PWD)
SERVER="ubuntu@example.jamesloper.com"

# check cached build directory
log "Building meteor app"
useCache="n"
[ -d "/tmp/$1" ] && read -p "Use cached build? [y/n]: " useCache
if [ $useCache != "y" ]; then
  meteor build /tmp/$1 --architecture os.linux.x86_64
fi

log "Uploading app & settings"
scp -pr /tmp/$1 $SERVER:./
scp -pr .deploy/$1/* $SERVER:./$1

log "Executing remote script"
ssh $SERVER "APP=$1 PROJECT=$PROJECT bash -s" < .deploy/remote-script.sh
```

### Contents of `remote-script.sh`

``` bash
#!/bin/bash

cd $APP
export BIND_IP=127.0.0.1
export HTTP_FORWARDED_COUNT=1
export METEOR_SETTINGS=$(cat settings.json | jq -M -c -r .)
source env.sh

echo "Unzipping"
tar -xf "$PROJECT.tar.gz"

echo "Installing npm packages"
cd bundle/programs/server
meteor npm install --production &> /dev/null

echo "Restarting app"
pm2 stop $APP -s
pm2 flush $APP -s
pm2 start ../../main.js --name $APP --update-env -s
pm2 logs $APP -s
```

### Contents of `example/env.sh`

You can make a new folder for each deployment. In the example directory layout I used above, production files are
in `example/` and staging files are in `example-staging/`. For each deployment, place a `settings.json` file in the
deployment folder, and as for the `env.sh`, here is the one I am using for production (the port is 3000, the root URL is
fully qualified)

``` bash
#!/bin/bash

export PORT=3000
export ROOT_URL=https://example.jamesloper.com
export MAIL_URL=smtp://postmaster%40jamesloper.com:password@smtp.mailgun.org:587
export MONGO_URL=mongodb://app:password@db.jamesloper.com:27017/hotspot
export MONGO_OPLOG_URL=mongodb://oplog:password@db.jamesloper.com:27017/local?authSource=admin
```

### Running your first deployment

To deploy, run the script and give it the argument of the deployment folder.

``` bash
sh deploy example
```

After deploying, you will get the logs. You can also pull up the logs any time like this.

``` bash
ssh ubuntu@example.jamesloper.com
pm2 logs example
```
