# LSAT Study App

## Overview

An LSAT (Law School Admission Test) study tool that uses RAG (Retrieval-Augmented Generation) to help students understand logical reasoning patterns and improve their test-taking skills.

## Features

### 📚 **Question Database**
- Access to multiple LSAT datasets from HuggingFace
- Analytical Reasoning (Logic Games)
- Logical Reasoning
- Reading Comprehension

### 🧠 **Pattern Recognition**
- Identifies question types (sequencing, grouping, assumption, strengthen/weaken, etc.)
- Provides pattern-specific solving strategies
- Shows common traps and how to avoid them

### 📊 **RAG-Powered Analysis**
- Retrieves similar questions and patterns from knowledge base
- Provides detailed breakdowns of correct answers
- Explains why incorrect answers fail

### 📈 **Continuous Learning**
- Indexes analyzed questions
- Improves pattern recognition over time
- Builds knowledge base of solving strategies

## Available Datasets

| Dataset | Description | Size | Source |
|---------|-------------|------|--------|
| **tasksource/lsat-ar** | Analytical Reasoning (Logic Games) 1991-2016 | ~500 questions | [HuggingFace](https://huggingface.co/datasets/tasksource/lsat-ar) |
| **tasksource/lsat-rc** | Reading Comprehension | Available | [HuggingFace](https://huggingface.co/datasets/tasksource/lsat-rc) |
| **hails/agieval-lsat-lr** | Logical Reasoning from AGIEval | Available | [HuggingFace](https://huggingface.co/datasets/hails/agieval-lsat-lr) |
| **LogiQA 2.0** | Similar reasoning patterns | 15,708 questions | Research dataset |

## Pattern Types

The system recognizes these LSAT question patterns:

### Analytical Reasoning (Logic Games)
- **Sequencing**: Arranging elements in order
- **Grouping**: Distributing elements into categories
- **Matching**: Pairing elements together
- **Hybrid**: Combination of multiple patterns

### Logical Reasoning
- **Strengthen**: Supporting an argument
- **Weaken**: Undermining an argument
- **Assumption**: Finding unstated premises
- **Inference**: Drawing valid conclusions
- **Flaw**: Identifying reasoning errors
- **Parallel**: Matching argument structures
- **Principle**: Applying general rules
- **Resolve**: Explaining apparent contradictions
- **Evaluate**: Determining what information is needed

## API Endpoints

### Get Available Datasets
```http
GET /api/lsat/datasets
```

### Fetch Questions
```http
POST /api/lsat/questions
Content-Type: application/json

{
  "dataset": "lsat-ar",
  "split": "train",
  "count": 5
}
```

### Analyze Question
```http
POST /api/lsat/analyze
Content-Type: application/json

{
  "question_data": {...},
  "use_cache": true,
  "use_rag": true,
  "stream": false
}
```

**Response**:
```json
{
  "pattern_type": "sequencing",
  "confidence": 0.95,
  "breakdown": {
    "setup": "...",
    "question_stem": "...",
    "key_constraints": [...],
    "logical_chain": [...]
  },
  "correct_answer": {
    "letter": "C",
    "explanation": "...",
    "key_insight": "..."
  },
  "incorrect_answers": [...],
  "pattern_recognition_tips": [...],
  "difficulty": "medium",
  "time_estimate_seconds": 120
}
```

### Get Pattern Information
```http
GET /api/lsat/patterns
GET /api/lsat/patterns/{pattern_type}
```

### Get Cache Statistics
```http
GET /api/lsat/cache/stats
```

## Architecture

### Backend
```
backend/
├── lsat_service.py       # FastAPI routes and question fetching
├── lsat_logic.py          # Pattern definitions and prompt building
└── lsat_rag_utils.py      # RAG system for pattern retrieval
```

### Frontend
```
app/lsat/
├── page.tsx               # Main LSAT study interface
├── quick/page.tsx         # Quick practice mode
└── layout.tsx             # LSAT-specific layout

components/lsat/
└── QuestionCard.tsx       # Question display component

store/
├── lsatSlice.ts           # Redux state management
└── api/lsatApi.ts         # RTK Query API definitions
```

## Usage Example

```typescript
import { useGetLsatQuestionsQuery, useAnalyzeLsatQuestionMutation } from '@/store/api/lsatApi';

function LSATComponent() {
  const { data: questions } = useGetLsatQuestionsQuery({
    dataset: 'lsat-ar',
    count: 5
  });

  const [analyzeQuestion] = useAnalyzeLsatQuestionMutation();

  const handleAnalyze = async (question) => {
    const result = await analyzeQuestion({
      question_data: question,
      use_rag: true
    }).unwrap();

    console.log('Pattern:', result.pattern_type);
    console.log('Explanation:', result.correct_answer.explanation);
  };
}
```

## Related Research

- **AR-LSAT** (2021): Transformer-based methods for analytical reasoning
- **ReClor**: Reading comprehension from graduate admission exams
- **LogiQA**: Deductive reasoning from civil service exams

## Future Enhancements

- [ ] Personalized study plans based on weak areas
- [ ] Timed practice mode
- [ ] Progress tracking and analytics
- [ ] Spaced repetition algorithm
- [ ] Mobile-optimized interface
- [ ] Export study notes and explanations

## License

This is a portfolio demonstration project showcasing RAG implementation for LSAT preparation.