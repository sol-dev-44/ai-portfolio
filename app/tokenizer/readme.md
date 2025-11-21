# 🔤 Tokenizer Comparison

**Understand how different AI models "read" text.**

This tool lets you compare how different OpenAI tokenizers split text into tokens. It's essential for understanding API costs, context window limits, and model behavior.

## ✨ Features

- **Multi-Tokenizer Support**: Compare GPT-2, GPT-3.5, GPT-4, and GPT-4o tokenizers side-by-side.
- **Visual Color Coding**: Each token is highlighted with a unique color to visualize the splitting pattern.
- **Efficiency Metrics**:
    - **Token Count**: Total tokens generated.
    - **Chars/Token Ratio**: Higher ratio = more efficient (cheaper API costs).
- **Real-time Analysis**: See results instantly as you type.

## 🚀 Why This Matters

### 1. Cost Estimation
OpenAI charges by the token, not the character.
- **GPT-4o** is more efficient than **GPT-3.5**, meaning the same text often costs less to process because it uses fewer tokens.

### 2. Context Windows
Models have a limit on how much text they can process (e.g., 8k, 128k tokens).
- Knowing the exact token count helps you stay within limits and avoid truncation errors.

### 3. Debugging
- Weird model behavior can sometimes be traced back to how a word was tokenized.
- Example: "The" vs " The" (leading space) are often different tokens.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React
- **Backend**: FastAPI, `tiktoken` (OpenAI's fast BPE tokenizer)

## 📚 Supported Tokenizers

| ID | Name | Used In |
|----|------|---------|
| `o200k_base` | **GPT-4o** | GPT-4o, GPT-4o-mini |
| `cl100k_base` | **GPT-4 / 3.5** | GPT-4, GPT-3.5 Turbo, Embeddings |
| `p50k_base` | **GPT-3** | Davinci-003, Codex |
| `gpt2` | **GPT-2** | GPT-2, GPT-3 (older) |