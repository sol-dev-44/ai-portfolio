Great project idea! The LSAT's logical reasoning and reading comprehension sections do align well with LLM pattern recognition. Let me search for available resources.This is great research. Let me compile what I've found into a comprehensive overview for you.

---

## LSAT Study App: Open Source Data & APIs Overview

You're in luck—there's a solid ecosystem of open-source LSAT and logical reasoning datasets that could power your RAG architecture. Here's what's available:

---

### **Primary LSAT Datasets (HuggingFace)**

| Dataset | Description | Size | Link |
|---------|-------------|------|------|
| **tasksource/lsat-ar** | Analytical Reasoning (Logic Games) from 1991-2016 | ~500 questions | [HuggingFace](https://huggingface.co/datasets/tasksource/lsat-ar) |
| **tasksource/lsat-rc** | Reading Comprehension section | Available | [HuggingFace](https://huggingface.co/datasets/tasksource/lsat-rc) |
| **hails/agieval-lsat-lr** | Logical Reasoning from AGIEval benchmark | Available | [HuggingFace](https://huggingface.co/datasets/hails/agieval-lsat-lr) |
| **saumyamalik/lsat_logic_games** | All publicly available logic games with difficulty metadata | ~Full coverage | [HuggingFace](https://huggingface.co/datasets/saumyamalik/lsat_logic_games-analytical_reasoning) |

---

### **Related Logical Reasoning Datasets**

These aren't LSAT-specific but train the same reasoning patterns:

| Dataset | Source | Size | Use Case |
|---------|--------|------|----------|
| **ReClor** | Graduate admission exams (LSAT/GMAT) | ~6,000 questions | Reading comprehension + logical reasoning |
| **LogiQA 2.0** | Chinese Civil Service Exam | 15,708 MRC + 35k NLI pairs | Deductive reasoning, multiple types |
| **AR-LSAT** | Research dataset | Questions 1991-2016 | Analytical reasoning benchmarking |

---

### **Research Papers to Inform Your Architecture**

1. **AR-LSAT** (2021) introduces a dataset from the Law School Admission Test spanning 1991-2016 and proposes both Transformer-based methods and an "Analytical Reasoning Machine" that extracts symbolic knowledge like participants, facts, and logical functions to deduce solutions.

2. **ReClor** is extracted from standardized graduate admission examinations. The researchers identified that models exploit dataset biases, so they separated data into EASY and HARD sets—state-of-the-art models struggle on the HARD set with performance near random guess.

3. **LogiQA** consists of 8,678 QA instances covering multiple types of deductive reasoning, sourced from expert-written questions. State-of-the-art neural models perform far worse than the human ceiling.

---

### **LLM APIs for Your Backend**

For the reasoning engine, you have several options:

| Provider | Best Model for Reasoning | Notes |
|----------|-------------------------|-------|
| **Anthropic** | Claude Sonnet 4 / Opus 4.5 | Strong logical reasoning, good at chain-of-thought |
| **OpenAI** | o1 / GPT-4o | o1 specifically designed for reasoning tasks |
| **LiteLLM** | Unified API gateway | Call 100+ LLMs with one interface—great for A/B testing models |

---

### **Free Official LSAT Prep Content**

Khan Academy and LSAC provided free LSAT prep since June 2018, helping hundreds of thousands of test takers. As of June 2024, these resources (lessons, videos, articles, practice exercises, question explanations) have transitioned to LSAC's LawHub platform.

LawHub now includes more than 20 Drill Sets containing about 260 Logical Reasoning and Reading Comprehension questions for free.

---

### **Suggested Architecture Approach**

Given your fullstack TS/React/Next background:

1. **Data Layer**: Combine multiple HuggingFace datasets (lsat-ar, lsat-rc, lsat-lr, ReClor, LogiQA)
2. **Embedding/Vector Store**: Use Pinecone, Weaviate, or Chroma to store question patterns + explanations
3. **RAG Pipeline**: On question input, retrieve similar patterns → feed to LLM with pattern-specific prompts
4. **Pattern Recognition Module**: Tag questions by reasoning type (categorical, conditional, sequencing, grouping, etc.)
5. **Explanation Generator**: Have the LLM break down WHY an answer is correct using retrieved similar examples

---

### **For Your Law School Application**

This project would demonstrate:
- Technical proficiency (full-stack + AI/ML integration)
- Understanding of legal reasoning patterns
- Initiative in making legal education more accessible
- Practical application of emerging tech to law

Want me to dive deeper into any of these datasets, sketch out a specific architecture, or explore the reasoning type taxonomies used in these benchmarks?