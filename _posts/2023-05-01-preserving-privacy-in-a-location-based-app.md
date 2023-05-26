---
layout: post
title: "Preserving Privacy (and Battery) in a Location-based App"
categories: gps location algorithm privacy 
---

<img src="/assets/privacy.png" alt="Bad Ceo" class="banner"/>

Life360, a company that claims its product is a “family safety service” has been selling
location data on its 31 million customers, including kids, since 2016.

<!--more-->

PathSense defends itself by citing the app “improved driver safety and saved numerous lives” but was it even technically
necessary to save all that data to the cloud, or could it have been possible to respect user privacy without losing its
major selling points?

That's exactly the challenge I faced when I began work on a location-based app.

I have had the pleasure of working on a new dwell detection algorithm. What started as
a "scholarly" kernel-based approach, making attempts at polling updates at regular intervals, quickly revealed, through
testing, iOS would begin to throttle GPS updates to reduce the amount of time spent background processing. Working
within the limitations of iOS, we discovered how to play nice, and add some top shelf sophistication.

With the help of my crack team of pedestrian and vehicular co-founders, we created
an algorithm that performed...unreasonably well! We reached a hit rate above 90% by using the least amount of updates
possible. Counterintuitively, the GPS remains OFF when in motion, and turns on High
Accuracy during periods of stillness. Our battery usage is below 4% per day.

Basically, we draw a circle around you and move it with you, but when you walk or are still, we allow the circle to
trail behind, sticking to the ground rather than following you. If you ever escape a circle, it becomes a "leave"
event. After backtracking, we can determine the dwell's starting event, being the first location update of the cluster
of updates existing inside the circle.

Many dwells are created from only two points, the activity recognition system triggering an initial GPS poll for the
starting point, and then a second poll when the user has moved a significant distance based off of low power draw
signals from other sensors that the OS uses. I think this is a metric of how efficient a dwell detection algorithm is
because it demonstrates how little the algorithm has to _fight_ against the
data it receives.

I really enjoyed the process of utterly completely understanding everything involved in dwell detection. I specifically
loved how once we landed on the right algorithm, the code for dwell detection was reduced from 200 lines of useless
interpolation, averaging, heuristics and edge case handling, to only the essential 20 lines. Everything just fell
together all at once near the end. I think that satisfaction is a moment in my life I will always remember.

Also, during the entire time, it was never a question of if we needed to send the location updates to a server, that
part was nonsense and should have never come up.
