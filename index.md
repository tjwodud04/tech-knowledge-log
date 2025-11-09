---
layout: default
title: Home
---

# Tech Knowledge Log

Daily AI/CS insights in 1-minute reads.

## Latest Posts

{% assign sorted_posts = site.posts | sort: 'date' | reverse %}
{% for post in sorted_posts limit:5 %}
**{{ post.date | date: "%Y-%m-%d" }}** — [{{ post.title }}]({{ post.url }})
{% endfor %}

[View all →](./archive.html)
