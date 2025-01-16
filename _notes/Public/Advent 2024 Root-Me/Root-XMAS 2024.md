---
title: Root-XMAS 2024
feed: show
permalink: /RootXMAS_2024
date: 16-01-2025
summary: write-ups of Root-me's cyber advent
---
I followed Root-me's cyber advent this year! the event was really fun, and I learned a lot on very different subjects! Challs were progressively harder, and I dropped out after day 18, alas, but still finished top 30. 

I even created a small [slander meme](https://www.youtube.com/watch?v=WxiEVJnXBEY) to try to picture the mood of the community, interacting on Root-me Discord was ver fun during this month!

I also did [TryHackMe's Advent of Cyber 2024](https://tryhackme.com/r/room/adventofcyber2024) , but as they were guided challenges, I did not create write-ups. (*"Side quests"* looked great, but I did not have time to complete them)

### write-ups

<div> <div class="related-wrapper">
{% assign note_items = site.notes | sort: "date" | %}
{% for note_items in note_items %}
{%- if note_items.title contains "Root-XMAS 2024 Day" -%}
<div class="notelist-feed">
<a href="{{ site.baseurl }}{{note_items.url}}"> {{ note_items.title }} </a>

<a href="{{ site.baseurl }}{{note_items.url}}" class="excerpt">{{ note_items.summary | strip_html | strip | remove: "[[" | remove: "]]" | remove: "-" | escape | truncate: 200 }}</a> 
</div>
{%- endif -%}
{%- endfor -%}
</div>
</div>
{% include rmxmas_feed.html %}
