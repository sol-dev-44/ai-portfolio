# 📊 Generation Visualization

**Visualize the inner workings of a Language Model.**

This feature allows you to see the probability distribution of the next token as predicted by GPT-2. It's a powerful educational tool to understand how LLMs make decisions.

## ✨ Features

- **Real-time Probability Analysis**: See the top 10 predicted next tokens for any prompt.
- **Interactive D3.js Chart**: Visual bar chart showing probability scores.
- **Token Details**: View exact probability percentages and token IDs.
- **Educational**: Learn about "Greedy" vs "Sampling" by seeing the choices the model has.

## 🚀 How It Works

1.  **Input**: You type a prompt (e.g., "The future of AI is").
2.  **Backend**:
    *   Tokenizes the input using GPT-2 tokenizer.
    *   Runs a forward pass through the GPT-2 model.
    *   Extracts the logits for the last token position.
    *   Applies Softmax to get probabilities.
    *   Returns the top-k (10) most likely next tokens.
3.  **Frontend**:
    *   Receives the data.
    *   Renders a D3.js bar chart visualizing the probabilities.

## 🛠️ Tech Stack

- **Frontend**: Next.js, D3.js, RTK Query
- **Backend**: FastAPI, PyTorch, Hugging Face Transformers (GPT-2)

## 📚 Learn More

For a deep dive into the architecture and data flow, check out the [Architecture Guide](./architecture.md).
