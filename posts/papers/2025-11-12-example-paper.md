---
layout: post
type: paper
title: "Chain-of-Thought Prompting Elicits Reasoning in LLMs"
date: 2025-11-12
category: "dialog"
arxiv_id: "2201.11903"
keywords: ["prompting", "reasoning", "few-shot", "LLM"]
reading_time: "1 min"
---

## Paper Summary

**Chain-of-Thought (CoT)** prompting dramatically improves LLM reasoning by showing intermediate steps in examples.

## Key Finding

Standard prompting:
```
Q: Roger has 5 balls. He buys 2 more. How many?
A: 7
```

CoT prompting:
```
Q: Roger has 5 balls. He buys 2 more. How many?
A: Roger started with 5 balls. 2 more means 5 + 2 = 7.
```

**Result**: 50%+ accuracy gain on math/reasoning tasks

## Method

1. Add "Let's think step by step" to prompts
2. Show reasoning chain in few-shot examples
3. Works best with larger models (>100B params)

## Impact

- Foundation for reasoning in ChatGPT, Claude
- Spawned variants: Tree-of-Thought, Self-Consistency
- Key technique for complex problem-solving

---
*[Read full paper →](https://arxiv.org/abs/2201.11903)*
