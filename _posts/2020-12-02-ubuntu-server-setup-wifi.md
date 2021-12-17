---
layout: "post"
title: "Setup WiFi on Ubuntu Server 20"
categories: ubuntu, it, networking
modified: 2021-03-06
---

<img src="/assets/caveman.png" alt="Caveman with no wifi" class="banner"/>

**Have you ever struggled to do something that sounded so simple such as connecting to a god forsaken wifi network on
Ubuntu Server?** Well me too and here is how you do it. What's more is if you basically don't install
anything you keep the server clean and wifi and lan can both work at the same time without hassle.
<!--more-->

> If you think you are clever and can do this without the internet, sorry. You're going to have to walk over to the router
and plug the thing in.

## Step 1, aka the step that every tutorial leaves out!

`wpasupplicant` handles wifi security. Without it, you can not even hope to use wifi, so I find it preposterous that every tutorial leaves this step out!


``` bash
sudo apt-get install wpasupplicant
```

Now that you have accomplished the most important task, you must now find the interface name of your wifi card:

``` bash
ls /sys/class/net
```

It will output some names but you are going to have to flex your pattern recognition skills and find one that looks like
`wlan0` or `wlp2s0`. That's the wifi.

## Edit your netplan configuration file

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

## More notes

Yeah, so in summary there was no need for learning network-manager, creating unnecessary conflicts by mixing in
deprecated packages like ifconfig. **Really wish this guide wasn't buried by Google!**