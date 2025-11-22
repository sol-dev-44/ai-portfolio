# 🏟️ LLM Arena (Playground)

**Compare 5 diverse Language Models side-by-side with real-time performance metrics.**

This feature is a comprehensive playground for experimenting with different LLMs, observing their generation speeds, and understanding their unique strengths.

## ✨ Features

### 🤖 5 Diverse Models
We've integrated a spectrum of models to demonstrate different capabilities:

| Icon | Model | Size | Best For |
|------|-------|------|----------|
| ⚡ | **Gemma 2B** | 2B | Speed, quick queries, casual chat |
| 📜 | **Qwen 7B** | 7B | Long context (1M tokens), documents |
| 🔧 | **GPT-OSS 120B** | 120B | Tool calling, structured output |
| 💻 | **Qwen Coder** | 480B | Programming, debugging, technical docs |
| 🧠 | **DeepSeek R1** | Large | Complex reasoning, math, logic |

### ⚡ Real-Time Streaming (SSE)
Text is generated token-by-token using **Server-Sent Events (SSE)**. This provides an instant, responsive experience similar to ChatGPT, allowing you to read the output as it's being created.

### 📊 Performance Visualization
A real-time **D3.js bar chart** visualizes the generation speed (tokens/second) for each model.
- **Compare Mode**: Run all models simultaneously to see a direct speed race!
- **Metrics**: Track total time, token count, and throughput.

### ⚔️ Compare Mode
Toggle "Compare" to send the same prompt to ALL models at once. This is perfect for:
- **A/B Testing**: See how different models answer the same question.
- **Speed Benchmarking**: Visualize the trade-off between model size and speed.
- **Quality Comparison**: Compare reasoning capabilities vs. speed.

## 🚀 How to Use

1.  **Select a Model**: Choose from the dropdown (or enable Compare Mode).
2.  **Enter a Prompt**: Type your question or use one of the "Try these" examples.
3.  **Generate**: Click the rocket button 🚀.
4.  **Watch**:
    *   See text stream in real-time.
    *   Watch the D3 chart populate with performance data.
    *   Read the detailed metrics below the chart.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, D3.js, Framer Motion
- **Backend**: FastAPI, PyTorch (simulated or proxying to Hugging Face/vLLM)
- **Streaming**: Server-Sent Events (SSE)

## 🎓 Educational Value

This tool demonstrates:
- **Latency vs. Throughput**: How model size affects generation speed.
- **Specialization**: Why you might choose a "Coder" model over a generalist.
- **Streaming Architecture**: How modern AI apps handle long-running requests.