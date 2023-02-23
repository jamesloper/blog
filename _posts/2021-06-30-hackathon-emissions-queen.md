---
layout: post 
title: "My hackathon submission: Emissions Queen"
categories: digitalocean hackathon mongo meteor
---

<img src="/assets/queen.png" alt="Emissions Queen" class="banner"/>

For DigitalOcean's 2021 hackathon I set out to create a dashboard for my Emissions station in Duluth, GA.

<!--more-->

You can check progress on the publicly accessible website [queen.jamesloper.com](https://queen.jamesloper.com)

## I am aiming to build the following features...

1. Accounts with ability to link devices
2. Webcam view of the interior of the station from Wyze cam
3. Screen cast of the emissions computer screen (for diagnostics)
4. Call logs for the business phone line (provided by Twilio)
5. To determine the exact time the employee opened and closed for the day, I am making an integration with myQ to see when the garage door is open or closed
6. To check profit, I am making a scraper for the government provided dashboard website

## Development & DigitalOcean

The mongo database will be hosted on DigitalOcean managed MongoDB, and the app will be served by a DigitalOcean droplet. I will run a copy of the development environment on my laptop and then deploy to "production", but to ease the transition, I will connect my development environment straight to the MongoDB since the beginning. This way I don't have to maintain two databases.

## How will I determine the profit?

Each car that buys an emissions test uses up a "ticket" provided by the government. This is recurring cost for the emissions business, and since each test is a fixed cost, profit can be calculated from just the number of used tickets. If I can scrape the government website, I can calculate profit to a high degree of accuracy.

## How will the webcams/streams work?

Depending on the protocol, it can be easy or hard. For the screen cast, it's easy. I bought a [capture card with pass-thru](https://amzn.to/3drkRJ2) to grab the HDMI signal running to the emissions station screen. A [cheap computer](https://amzn.to/3y3n4SY) running [mjpg-streamer](ubuntu-server-install-mjpg-streamer) exposes the feed as a URL. To embed that in a webpage, all I have to do is put an `<img>` tag with the url set as the `src`. Any URL pointing to a MJPEG stream can also be embedded into a web page this way.

I also want to get some networked webcams, so I chose [Wyze Cam V2](https://amzn.to/3dtEUXv). It is capable of serving an RTSP stream, but I had to convert that to something web browsers can view. For this I made an [RTSP to MJPEG proxy server](https://github.com/jamesloper/emissions/blob/main/server/imports/rest/proxy-video.js). I hand off most of the work to FFMPEG, streaming the output from stdout to the client, however care must be taken to build a buffer and flush it upon each frame.

## How are the call logs set up?

When adding a Twilio account, I fetch the historical logs and massage the data into my own format before inserting it into the Mongo DB. From that point, a webhook is enabled so that whenever Twilio gets a phone call, they will make an HTTP call to my REST endpoint. This does mean that while developing the app, I have to make my computer publicly accessible, for example by using [ngrok](https://ngrok.com/) for this.

## How will the garage door sensor be set up?

I integrated myQ and will install a [smart garage door sensor](https://amzn.to/3hlSflA) and will query it every 5 minutes to see if it is up or down.