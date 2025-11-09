---
layout: default
title: Archive
---

# Archive

## Fundamentals

{% assign fundamentals = site.posts | where: "type", "fundamental" | sort: 'date' | reverse %}
{% for post in fundamentals %}
- **{{ post.date | date: "%Y-%m-%d" }}** — [{{ post.title }}]({{ post.url }})
{% endfor %}

## Papers

{% assign papers = site.posts | where: "type", "paper" | sort: 'date' | reverse %}
{% for post in papers %}
- **{{ post.date | date: "%Y-%m-%d" }}** — [{{ post.title }}]({{ post.url }})
  <span style="color: #666;">{{ post.category }}</span>
{% endfor %}
