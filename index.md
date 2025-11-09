---
layout: default
title: Home
---

# Tech Knowledge Log

> Quick, focused insights on AI, NLP, Speech, and CS fundamentals.

## Latest Posts

{% assign sorted_posts = site.posts | sort: 'date' | reverse %}
{% for post in sorted_posts limit:5 %}
- **{{ post.date | date: "%Y-%m-%d" }}** — [{{ post.title }}]({{ post.url }})
  <span style="color: #666; font-size: 0.9em;">{{ post.category }}</span>
{% endfor %}

[→ View all posts](./archive.html)

---

**Schedule:**
- Mon/Wed/Fri: Fundamentals
- Tue/Thu/Sat: Papers
