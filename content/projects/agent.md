# 🤖 Tool-Calling AI Agent

An educational implementation of a **ReAct (Reasoning + Action) Agent** that demonstrates how LLMs orchestrate external tools. Features **side-by-side comparison** of Claude vs Open Source models with full pipeline visualization.

![Pattern](https://img.shields.io/badge/Pattern-ReAct_Agent-purple)
![Claude](https://img.shields.io/badge/Claude-Sonnet_4-blue)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Qwen_72B-yellow)
![Next.js](https://img.shields.io/badge/Framework-Next.js_14-black)

---

## 🎯 What This Demonstrates

> **The Big Idea:** LLMs are text generators, not action takers. They can't browse the web, call APIs, or run calculations. But they're excellent at **deciding what to do** and **explaining results**. Your app does the heavy lifting—the LLM provides the intelligence.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔀 **Compare Mode** | Run the same prompt through Claude AND an open source model simultaneously |
| 📊 **Pipeline Visualization** | See every step: who called what, when, with what data |
| 🔧 **4 Real Tools** | Weather, Web Search, Calculator, Time—all with real API calls |
| 🎓 **Educational UI** | Expandable cards showing exact request/response JSON |

---

## 🧠 The Two Things LLMs Actually Do

### 1. Choose Tools
Given a user's question, the LLM decides which tool(s) to call and outputs structured JSON:
```json
{ "tool": "get_weather", "input": { "city": "Tokyo" } }
```

### 2. Synthesize Responses
After receiving tool results, the LLM crafts a natural language response, combining data from multiple sources and presenting it clearly.

**Everything else is done by YOUR APP:**
- Parse tool requests from LLM output
- Execute actual API calls (fetch weather, search web, etc.)
- Run deterministic computations (math, time)
- Feed results back to the LLM

---

## 🏗️ Architecture

### The Agent Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. User: "What's the weather in Tokyo?"                        │
│                           ↓                                     │
│  2. LLM outputs: {"tool": "get_weather", "city": "Tokyo"}       │
│                           ↓                                     │
│  3. Your App: Calls Open-Meteo API → Gets 72°F, Sunny           │
│                           ↓                                     │
│  4. LLM synthesizes: "It's a beautiful day in Tokyo!..."        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│  User  │────▶│  Next.js App │────▶│  Claude / Qwen  │────▶│  Next.js   │
│        │     │              │     │                 │     │    App     │
│ "What's│     │ POST /api/   │     │ Returns JSON:   │     │            │
│  the   │     │ agent/chat   │     │ tool_use:       │     │ Executes   │
│ weather│     │ or           │     │ get_weather     │     │ fetch() to │
│ in     │     │ /api/agent/hf│     │ {city:"Tokyo"}  │     │ Open-Meteo │
│ Tokyo?"│     │              │     │                 │     │            │
└────────┘     └──────────────┘     └─────────────────┘     └────────────┘
                                                                   │
┌────────┐     ┌──────────────┐     ┌─────────────────┐            │
│  User  │◀────│  Next.js App │◀────│  Claude / Qwen  │◀───────────┘
│        │     │              │     │                 │
│"It's   │     │ Streams      │     │ Synthesizes     │   Tool result:
│ 22°C   │     │ response via │     │ natural         │   "22°C, Sunny"
│ and    │     │ NDJSON       │     │ language        │
│ sunny!"│     │              │     │ response        │
└────────┘     └──────────────┘     └─────────────────┘
```

### Key Insight

> **The LLM never touches the internet.** It doesn't "call" APIs—it *asks* your app to call them by outputting structured requests. Your app is the gatekeeper that decides what's actually executed. This is how ChatGPT plugins, Claude MCP, and function calling all work under the hood.

---

## 🔀 Compare Mode

Run both backends **simultaneously** and see results side-by-side:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚖️ Side-by-side comparison                        🔵 Running... │
├────────────────────────────┬────────────────────────────────────┤
│  🧠 Claude Sonnet 4        │  ✨ Qwen 2.5 72B                   │
├────────────────────────────┼────────────────────────────────────┤
│  📍 Pipeline          Live │  📍 Pipeline               Live   │
│  ┌─────────────────────┐   │  ┌──────────────────────────┐     │
│  │ App  Sending...   ⟳ │   │  │ App   Sending...      ⟳ │     │
│  │ Claude Calling ☀️ ✓ │   │  │ LLM   Calling ☀️     ⟳ │     │
│  │ API   Returned   ✓ │   │  └──────────────────────────┘     │
│  └─────────────────────┘   │                                    │
│                            │                                    │
│  ⚡ Tools Used             │  ⚡ Tools Used                     │
│  ┌─────────────────────┐   │  ┌──────────────────────────┐     │
│  │ ☀️ Weather      ✓ ▼ │   │  │ ☀️ Weather          ⟳ ▼ │     │
│  └─────────────────────┘   │  └──────────────────────────┘     │
│                            │                                    │
│  💬 Response               │  💬 Response                       │
│  The weather in Tokyo...   │  _Waiting..._                      │
└────────────────────────────┴────────────────────────────────────┘
```

### Available Models

| Backend | Model | Provider | Cost |
|---------|-------|----------|------|
| **Claude** | Claude Sonnet 4 | Anthropic API | ~$3/1M input tokens |
| **Open Source** | Qwen 2.5 72B | HuggingFace Inference | Free tier available |
| **Open Source** | Llama 3.3 70B | HuggingFace Inference | Free tier available |
| **Open Source** | DeepSeek R1 | HuggingFace Inference | Free tier available |

---

## 🛠️ Available Tools

### 1. Web Search
```typescript
{
  name: "web_search",
  executor: "Your Next.js App",
  dataSources: ["Google News RSS", "Wikipedia API", "DuckDuckGo Instant"],
  description: "Searches news and encyclopedia for current information"
}
```

### 2. Weather
```typescript
{
  name: "get_weather",
  executor: "Your Next.js App",
  dataSource: "Open-Meteo API (free, no key required)",
  description: "Real-time weather data for any city worldwide"
}
```

### 3. Calculator
```typescript
{
  name: "calculate",
  executor: "Your Next.js App",
  dataSource: "JavaScript Math Engine",
  description: "Safe evaluation of mathematical expressions"
}
```

### 4. Time
```typescript
{
  name: "get_time",
  executor: "Your Next.js App",
  dataSource: "Server System Clock",
  description: "Current date and time"
}
```

---

## 📁 File Structure

```
your-portfolio/
├── app/
│   ├── agent/
│   │   └── page.tsx              # Agent page with educational modal
│   ├── api/
│   │   └── agent/
│   │       ├── chat/
│   │       │   └── route.ts      # Claude backend with embedded tools
│   │       ├── hf/
│   │       │   └── route.ts      # HuggingFace backend with tool parsing
│   │       └── status/
│   │           └── route.ts      # Backend availability checker
│   └── page.tsx                  # Homepage featuring agent demo
├── components/
│   └── agent/
│       └── AgentChat.tsx         # Main chat UI with compare mode
├── lib/
│   └── api/
│       └── agentApi.ts           # RTK Query hooks for streaming
└── AGENT-README.md               # This file
```

---

## 🚀 Quick Start

### 1. Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...     # Required for Claude
HF_API_TOKEN=hf_...              # Required for Open Source models
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
# Visit http://localhost:3000/agent
```

---

## 🎨 UI Components

### Three-Way Backend Toggle

```
┌─────────────────────────────────────────────────────┐
│  [🧠 Claude]  [⚖️ Compare]  [✨ Open Source ▼]      │
│                                                     │
│  Using: Claude + Qwen 2.5 72B  side-by-side        │
└─────────────────────────────────────────────────────┘
```

### Pipeline Visualizer

Real-time execution steps with actor badges:

```
┌──────────────────────────────────────────────────────┐
│ 📍 PIPELINE                                    Live  │
├──────────────────────────────────────────────────────┤
│ [App]     Sending to Claude                     ✓    │
│ [Claude]  Calling Weather                       ✓    │
│ [API]     Returned data                         ✓    │
│ [Claude]  Generating response                   ⟳    │
└──────────────────────────────────────────────────────┘
```

### Expandable Tool Cards

```
┌─────────────────────────────────────────────────────┐
│ ☀️ Weather                                      ✓ ▼ │
├─────────────────────────────────────────────────────┤
│ 🖥️ Executed by: Your Next.js App                   │
│ 🌐 Data from: Open-Meteo API ↗                     │
├─────────────────────────────────────────────────────┤
│ Request:                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ { "city": "Tokyo", "unit": "celsius" }          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Result from Open-Meteo API:                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ **Tokyo, Japan**                                │ │
│ │ - Clear sky ☀️                                  │ │
│ │ - Temperature: 22°C                             │ │
│ │ - Humidity: 45%                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Persistent Quick Prompts

```
┌─────────────────────────────────────────────────────┐
│ ⚡ Quick prompts:                                   │
│ [☀️ Weather in Tokyo] [🔍 AI news] [🧮 Calculate]   │
│ [🕐 What time is it?]                              │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 How Tool Calling Works

### Claude (Native Tool Use)

Claude has built-in support for tools via the `tools` parameter:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a city',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string' }
        },
        required: ['city']
      }
    }
  ],
  messages: [{ role: 'user', content: 'Weather in Tokyo?' }]
});

// Claude returns:
// { type: 'tool_use', name: 'get_weather', input: { city: 'Tokyo' } }
```

### HuggingFace (Custom Format)

Open source models use a custom format via system prompt:

```typescript
const systemPrompt = `You have access to tools. To use a tool, output:
<tool>tool_name|param1=value1|param2=value2</tool>

Available tools:
- get_weather: Get weather. Params: city (required), unit (optional)
- web_search: Search web. Params: query (required)
`;

// Model outputs:
// "Let me check the weather. <tool>get_weather|city=Tokyo</tool>"

// Your app parses this and executes the tool
```

---

## 🏛️ Why This Architecture?

| Benefit | Explanation |
|---------|-------------|
| 🔒 **Security** | Your app controls what actions are possible. The LLM can only request tools you've defined. |
| ✅ **Reliability** | Calculations and API calls are deterministic. No LLM hallucination on factual data. |
| 🔄 **Flexibility** | Swap LLMs easily (Claude ↔ Open Source). The tool execution layer stays the same. |
| 📊 **Observability** | Log every tool call, monitor costs, debug issues. Full visibility into what's happening. |

---

## 💰 Cost Analysis

| Component | Cost |
|-----------|------|
| Claude Sonnet 4 | ~$3/1M input, ~$15/1M output tokens |
| HuggingFace Inference | Free tier, then pay-per-use |
| Open-Meteo Weather | Free |
| Google News RSS | Free |
| Wikipedia API | Free |

**Typical query cost:** ~$0.003 with Claude, ~$0 with HuggingFace free tier

---

## 🔧 Adding a New Tool

### 1. Add to Claude endpoint (`app/api/agent/chat/route.ts`)

```typescript
const TOOLS: MCPTool[] = [
  // ... existing tools
  {
    name: 'get_stock_price',
    description: 'Get current stock price',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Ticker symbol (e.g., AAPL)' }
      },
      required: ['symbol']
    },
    metadata: {
      source: 'Stock API',
      source_url: 'https://api.example.com'
    },
    execute: async ({ symbol }) => {
      const res = await fetch(`https://api.example.com/stocks/${symbol}`);
      const data = await res.json();
      return `${symbol}: $${data.price}`;
    }
  }
];
```

### 2. Add to HuggingFace endpoint (`app/api/agent/hf/route.ts`)

```typescript
// Add to TOOLS array (same structure)
// Add to SYSTEM_PROMPT tool descriptions
```

### 3. Add UI metadata (`components/agent/AgentChat.tsx`)

```typescript
const TOOL_META = {
  // ... existing tools
  get_stock_price: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'emerald',
    name: 'Stock Price',
    apiSource: 'Stock API',
    apiUrl: 'https://api.example.com'
  }
};
```

---

## 🌐 Deployment

### Works in Production ✅

Both backends work on serverless platforms (Vercel, Railway):

| Backend | Production Ready | Notes |
|---------|-----------------|-------|
| Claude | ✅ Yes | Requires `ANTHROPIC_API_KEY` |
| HuggingFace | ✅ Yes | Requires `HF_API_TOKEN` |

### Won't Work ❌

- **Ollama/Local LLMs**: Require persistent daemon process, not compatible with serverless
- **LangChain with local models**: Same limitation

---

## 📚 Related Concepts

| Concept | Description |
|---------|-------------|
| **ReAct** | [Paper](https://arxiv.org/abs/2210.03629) - Reasoning + Action pattern |
| **Tool Calling** | Claude's native feature for invoking functions |
| **Function Calling** | OpenAI's equivalent feature |
| **MCP** | Model Context Protocol - Anthropic's standardized tool interface |
| **Agentic AI** | AI that takes autonomous actions via tools |

---

## 🐛 Troubleshooting

### "LLM isn't using tools"
- Check that tool schemas are included in the API call
- For HuggingFace: Ensure system prompt has tool format instructions
- Try being explicit: "Use the weather tool to check Tokyo's weather"

### "Compare mode only shows one result"
- Check both `ANTHROPIC_API_KEY` and `HF_API_TOKEN` are set
- Visit `/api/agent/status` to verify both backends are available

### "HuggingFace returns garbled tool output"
- Some models follow the `<tool>` format better than others
- Qwen 2.5 72B works best; try switching models

### "Tool cards stuck on 'executing'"
- Check browser console for network errors
- The `complete` event should mark all tools as done

---

## 📈 Future Enhancements

- [ ] Conversation memory (multi-turn context)
- [ ] Tool chaining (output of tool A → input of tool B)
- [ ] Response time metrics in Compare mode
- [ ] Cost tracking per query
- [ ] More tools: Image generation, Code execution, Database queries
- [ ] Local LLM option via WebLLM (runs in browser)

---

## 📄 License

MIT License - Use freely in your own projects!

---

Built with ❤️ to demystify AI agents