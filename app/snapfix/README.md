# SnapFix AI 🔧
**Your Intelligent Repair Assistant**

## Overview
SnapFix AI is a sophisticated multi-agent system designed to diagnose repair issues directly from photos. It orchestrates specialized AI agents to analyze visual data, retrieve technical knowledge, search the web for real-time solutions, and estimate repair costs metrics.

## 🚀 Key Features
- **Visual Diagnosis**: Leverages GPT-4o Vision to identify mechanical, structural, and cosmetic defects from user-uploaded photos.
- **Multi-Agent Orchestration**:
  - **Vision Agent**: Analyzes image content and hypothesizes the root cause.
  - **Knowledge Agent**: Searches an internal RAG (Retrieval-Augmented Generation) vector database for historical solution patterns.
  - **Search Agent**: Finds live repair guides, tutorials, and parts via You.com.
  - **Estimation Agent**: Calculates estimated costs, time required, and difficulty levels.
- **Synthesis Engine**: Uses Claude 3.5 Sonnet to integrate all agent outputs into a cohesive, step-by-step repair guide.
- **Cyclical Learning**: Successful diagnoses are automatically fed back into the system's knowledge base, allowing it to get smarter over time.
- **Interactive Modes**:
  1. **AI Analyzer**: The core diagnostic tool for users.
  2. **Knowledge Trainer**: Interface to review, editing, and managing the system's learned database.
  3. **System Architecture**: Live visualization of the agent orchestration flow and state.

## 🛠️ Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion (for animations)
- **AI Orchestration**: Custom multi-agent backend implemented via Next.js Edge/Serverless Functions.
- **Models**:
  - **Vision**: OpenAI GPT-4o
  - **Synthesis**: Anthropic Claude 3.5 Sonnet
  - **Estimation**: OpenAI GPT-4o-mini
  - **Search**: You.com API
- **Database**: Supabase (pgvector for RAG Knowledge Base)

## 📦 Setup & Installation
1. **Prerequisites**: Ensure you have Node.js installed and dependencies derived from the root `package.json`.

2. **Environment Variables**:
   Configure your `.env.local` file with the necessary API keys:
   ```bash
   # OpenAI - Vision analysis, embeddings, estimation
   OPENAI_API_KEY=sk-...

   # Anthropic - Claude synthesis
   ANTHROPIC_API_KEY=sk-ant-...

   # You.com - Web search
   YOU_API_KEY=...

   # Supabase - RAG knowledge base
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Run Application**:
   ```bash
   npm run dev
   ```

4. **Access SnapFix**:
   Navigate to `http://localhost:3000/snapfix` in your browser.

## ⚠️ Disclaimer
SnapFix AI provides suggestions based on probabilistic AI analysis. It is **not** a replacement for professional human judgment. Always consult a certified professional for repairs involving electricity, gas, structural integrity, high pressure, or other hazardous situations.
