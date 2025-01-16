---
title: Root-XMAS 2024 Day 13 - The lost gift
feed: hide
permalink: /RootXMAS_2024_13
date: 13-12-2024
summary: Geoguessing flight
---
### summary

Some OSINT with a pcap file to find the trajectory of a drone, and it's last picture to guess the correct road on Google Maps.

### Solution

We open the pcap file and are immediately greeted with Broadcast frames showing the location of the drone. Drones broadcast [RemoteID](https://enterprise.dronenerds.com/blog/regulation/remoteid-what-it-is-and-why-it-matters/) frames via Wifi and Bluetooth as a safety measure.


![[rmxmas24d13_wireshark.png|straight to the point]]

We copy paste the few last know locations and search on Google maps... last known location is in the middle of a lake in Britanny! (I went there, It's Brocéliande, a beautiful place)!
But the last image of the drone was a road intersection. We know the drone continued it's path on a straight line. So let's trace it!

![[rmxmas24d13_line.png|If we trace a line on the Ronceveaux-Bourges-Carignan axis...]]

We the have very similar images... not surprising as the "drone image" had a Google Maps watermark on it ^^'

![[rmxmas24d13_perfectpoint.png|5000 points]]

Careful, we landed just on the small road of the intersection, not the main one!

```python
"RM{"+ "Clos de la Terre Rouge".lower().replace(" ","") + "}"
	RM{closdelaterrerouge}
```

| Previous day | [[Day 12 - The Naughty Snowman]] |
| ------------ | -------------------------------- |
| Next day     | [[Day 14 - Almost a Gift]]       |
