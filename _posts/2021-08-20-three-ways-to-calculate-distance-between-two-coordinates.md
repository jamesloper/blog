---
layout: post title: "Three ways to calculate distance between coordinates"
categories: javascript, web
---

I'm always facing the problem of calculating the distance between two points over the surface of the Earth. This calculation involves some trigonometry a bit more complex than the planar one we all studied in high school, we are talking about spherical trigonometry, and the first thing that pops up is the haversine function.

<!--more-->

## The haversine function

This is a pretty solid way to calculate distances. Its main criticism is that it assumes the earth is a sphere, when it is in fact an ellipsoid. Despite this, the algorithm is more prevalent than the often ignored but more accurate Vicenty algorithm, which is unbelievably computationally expensive. Nevertheless, the haversine algorithm still involves 7 computationally expensive trigonometric functions (4 sin, 2 cos, 1 atan), pows and two square roots and looks like this:

``` javascript
const R = 6378.137;
const toRad = n => n * Math.PI / 180;

export const getDistance = (a, b) => {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const aLat = toRad(a.lat);
    const bLat = toRad(b.lat);
    const f = Math.pow(Math.sin(dLat / 2), 2) + (Math.pow(Math.sin(dLon / 2), 2) * Math.cos(aLat) * Math.cos(bLat));
    const c = 2 * Math.atan2(Math.sqrt(f), Math.sqrt(1 - f));
    return R * c;
};
```

Calculating 2M coordinate pairs took 125.493ms

## Optimizing haversine for small distances: the fast haversine

My own use case allowed me to take some additional shortcuts. I got rid of the Sin calculations. On top of that, the Cos of two close latitudes is approximately the Cos of its average. That allowed me to remove one Cos and assume some error. Finally, the two Pow were inlined, so no need to call an external generic power function if only to multiply a number by itself. The final algorithm, with some additional inlining to optimize even more, looks like this:

``` javascript
const R = 6378.137;
const PI_360 = Math.PI / 360;

export const getDistance = (a, b) => {
    const cLat = Math.cos((a.lat + b.lat) * PI_360);
    const dLat = (b.lat - a.lat) * PI_360;
    const dLon = (b.lon - a.lon) * PI_360;
    const f = dLat * dLat + cLat * cLat * dLon * dLon;
    const c = 2 * Math.atan2(Math.sqrt(f), Math.sqrt(1 - f));   
    return R * c;
};
```

Calculating 2M coordinate pairs like this took 83.486ms. We are doing well with impressive gains. This one took only 67% of the time compared to baseline.

## Reaching the end-game, the sloppy haversine

After finding the fast haversine formula, I could not stand still. For my use case I knew there was one more way to push the formula even further and make it even more sloppy. To do this, I revisited our good friend trigonometry. By now we know that haversine exists to accommodate the earth's spherical math. However when we are looking close to the earth's surface it no longer appears as a sphere and instead looks flat. So if we can find a factor to multiply by the longitude delta, and a factor to multiply by the latitude delta, we can use trigonometry as if we are dealing with a flat plane. That code is this magnificent sloppy boy:

``` javascript
const kRad = Math.PI / 180;
export const getDistance = (a, b) => {
	const kx = Math.cos(a.lat * kRad) * 111.321;
	const dx = (a.lon - b.lon) * kx;
	const dy = (a.lat - b.lat) * 111.139;
	return Math.sqrt(dx * dx + dy * dy);
};
```

This new formula makes a mere square root and cosine call and takes 51.652ms which is only 41% of the baseline!

So, all in all, I can only conclude that haversine is a wonderfully educational and academic exercise but when it comes to the practical side, nothing beats a solution built specifically for a use case. 