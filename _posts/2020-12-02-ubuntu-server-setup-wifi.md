---
layout: "post"
title: "Setup WiFi on Ubuntu Server 20"
categories: ubuntu, it, networking
---

<img src="/assets/caveman.png" alt="Caveman with no wifi" class="banner"/>

**Have you ever struggled to do something that sounded so simple such as connecting to a godforsaken wifi network on
Ubuntu Server?** Well me too and here is how you do it. What's more is if you basically don't install
anything you keep the server clean and wifi and lan can both work at the same time without hassle.
<!--more-->

### A quick note...

If you think you are clever and can do this without the internet, sorry, you're going to have to walk over to the router
and plug the thing in, because apparently it's not really 2020 yet.

### Step 1, every tutorial leaves this out...

``` bash
sudo apt-get install wpasupplicant
```

### Next, find the interface name

``` bash
ls /sys/class/net
```

It will output some names but you are going to have to flex your pattern recognition skills and find one that looks like
wlan0 or wlp2s0. That's the wifi.

### Edit your netplan configuration file

``` bash
sudo nano /etc/netplan/00-installer-config.yaml
```

``` yml
network:
  ethernets:
    eno1:
      dhcp4: true
      optional: true
  version: 2
  wifis:
    wlp2s0:
      optional: true
      access-points:
        "FBI Surveillance Van":
          password: "SeriesOfTubes"
      dhcp4: true
```

``` bash
sudo netplan --debug generate
sudo netplan --debug apply
sudo reboot
```

### More notes

Yeah so in summary there was no need for learning network-manager, creating unnecessary conflicts by mixing in
deprecated ifconfig commands. Really wish this guide wasn't buried by Google.