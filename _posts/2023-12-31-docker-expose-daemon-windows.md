---
layout: post
title: "Expose Docker Daemon on Windows"
categories: it networking vpn
---

When you enable **Expose daemon on tcp://localhost:2375 without TLS** in Docker Desktop, you'd be forgiven for thinking that you could actually connect to the Docker Daemon from another machine in your network. But why?

<!--more-->

There are actually so many reasons. First, Docker's 2375 is bound to localhost, so you might have looked into creating a proxyport with netsh, but read on. On Windows, Docker is actually running in a VM, so there's a firewall there. There's also a Windows firewall, so how can we connect to the Docker VM remotely?

## Overcoming the complexities of network traversal

[Tailscale](https://tailscale.com/) can be used to get around the issue while keeping everything secure. You are of course always free to install Tailscale directly on your computer. However, installing the Tailscale _Docker Extension_ will allow you to connect to the underlying Docker VM. Crucially, Tailscale provides distinct IP addresses for these distinct machines. This allows you to easily overcome the complexities of network traversal, as you can simply use an IP for the Docker VM.

No need to mess with Firewall, netsh portproxy, or any of that nonsense.

## How to directly connect to the Docker Machine by IP 

1. Install the Tailscale Docker extension
2. Enable the setting "Expose daemon on tcp://localhost:2375 without TLS" in Docker Desktop
3. Copy the IP address from the newly added Docker Machine (This is the Virtual Machine Docker is running under, not the Windows host)
4. Test the connection by running `docker -H tcp://[HOST_IP]:2375 ps`

We can plainly see how solid of a solution this is. Not only is it insanely simple and easy to use, you are now able to remotely access the docker daemon even from outside of your LAN. Incredible!