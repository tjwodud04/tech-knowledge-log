---
layout: post
type: fundamental
title: "Attention Mechanism: The Core of Modern NLP"
date: 2025-11-11
topic: "Deep Learning"
keywords: ["attention", "transformer", "neural networks"]
reading_time: "1 min"
---

## What is Attention?

Attention allows neural networks to **focus on relevant parts** of input data, much like how humans pay attention to specific words when reading.

## Key Concept

Instead of processing all input equally, attention assigns **weights** to different parts:

```
Input: "The cat sat on the mat"
Query: "What sat?"
→ High attention on "cat", low on "the", "mat"
```

## Why It Matters

- **Transformers** (GPT, BERT) are built entirely on attention
- Enables **long-range dependencies** without recurrence
- Foundation of modern LLMs

## One-Liner

> Attention = learned relevance scoring for inputs

---
*Further reading: "Attention Is All You Need" (Vaswani et al., 2017)*
