# 🎨 Dashboard Studio

**Transform dashboards with natural language using AI.**

Built with Claude Sonnet 4, React 19, and react-live for real-time code generation and preview.

---

## ✨ What It Does

Dashboard Studio lets you modify a live React dashboard using plain English. Type "make it cyberpunk" or "add beach vibes" and watch Claude Sonnet 4 generate and render the code instantly.

**Live Demo:** [Your URL Here]

---

## 🎯 Key Features

- **AI-Powered Generation** - Claude Sonnet 4 writes React code from natural language
- **Real-Time Preview** - See changes instantly with react-live sandboxing
- **Unlimited Undo/Redo** - Full version history, never lose your work
- **8 Custom Themes** - One-click presets: Beach, Cyberpunk, Terminal, Glassmorphism, and more
- **Safe Execution** - Sandboxed environment with error boundaries
- **Code Viewer** - See the generated React/D3 code
- **Download Components** - Export as `.tsx` files
- **Share URLs** - Save and share your creations

---

## 🚀 How It Works

```
User Input → Claude API → Code Generation → react-live → Live Preview
     ↓                                                         ↓
  Version History ←──────── Redux State Management ←──────────┘
```

1. **User describes change** in natural language
2. **Claude Sonnet 4** generates production-quality React code
3. **Parser validates** and sanitizes the code
4. **react-live** executes in safe sandbox
5. **Redux stores** version for undo/redo
6. **User sees result** instantly

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest features and concurrent rendering
- **Next.js 16** - App router and server components
- **TypeScript** - Full type safety
- **Redux Toolkit + RTK Query** - State management and API calls
- **react-live** - Safe code execution sandbox
- **Framer Motion** - Smooth animations
- **D3.js** - Data visualizations in generated code
- **Tailwind CSS** - Utility-first styling

### Backend & AI
- **Claude Sonnet 4** - AI code generation via Anthropic API
- **Custom prompt engineering** - Optimized for react-live constraints
- **Markdown stripping** - Clean code extraction
- **Validation pipeline** - Ensures safe, executable code

---

## 💡 Technical Highlights

### AI Integration
- **Context-aware prompts** - Claude knows the execution environment
- **Pattern examples** - Shows correct vs. incorrect code patterns
- **Error recovery** - Graceful handling of generation failures
- **Iterative refinement** - Each generation builds on previous versions

### Sandbox Safety
```tsx
const scope = {
  React,           // Full React with createElement
  useState,        // Hook access
  useEffect,       
  useRef,
  motion,          // Framer Motion
  d3,              // D3.js for charts
};
```

Only these libraries available - no file system, no network, no eval().

### Version Control
```tsx
interface DashboardVersion {
  code: string;
  prompt: string;
  timestamp: string;
  id: string;
}
```

Full history with instant time-travel between versions.

---

## 🎨 Example Prompts

Try these to see the power:

```
🏖️ "Create beach vibe theme"
→ Pastel blues, sandy colors, wave animations

🌃 "Cyberpunk with neon colors"  
→ Dark background, neon accents, glowing effects

💻 "Make it look like a terminal"
→ Monospace fonts, green text, hacker aesthetic

🎨 "Glassmorphism design style"
→ Frosted glass effects, subtle shadows, modern look

📊 "Display charts on top"
→ Restructures layout, moves visualizations

🔤 "I need larger font"
→ Increases text sizes throughout

🎪 "Make animations more springy"
→ Adjusts Framer Motion spring physics
```

---

## 🏗️ Architecture

### Code Generation Flow

```typescript
// 1. User Input
const prompt = "Make it cyberpunk";

// 2. API Call with Context
const response = await fetch('/api/dashboard-modify', {
  method: 'POST',
  body: JSON.stringify({
    currentCode: currentVersion.code,
    userPrompt: prompt,
  }),
});

// 3. Parse & Validate
let newCode = response.content[0].text;
newCode = stripMarkdown(newCode);
newCode = removeImports(newCode);
newCode = validate(newCode);

// 4. Store Version
dispatch(addVersion({ code: newCode, prompt }));

// 5. Render in Sandbox
<LiveProvider code={newCode} scope={scope}>
  <LivePreview />
</LiveProvider>
```

### State Management

```typescript
// Redux slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    versions: [initialVersion],
    currentIndex: 0,
  },
  reducers: {
    addVersion: (state, action) => {
      state.versions.push(action.payload);
      state.currentIndex = state.versions.length - 1;
    },
    undo: (state) => {
      if (state.currentIndex > 0) state.currentIndex--;
    },
    redo: (state) => {
      if (state.currentIndex < state.versions.length - 1) {
        state.currentIndex++;
      }
    },
  },
});
```

---

## 🎓 What I Learned

### AI Integration Challenges
- **Prompt engineering** - Took multiple iterations to get Claude to output clean, sandbox-compatible code
- **Error handling** - AI doesn't always succeed; graceful degradation is critical
- **Context management** - Balancing prompt length with sufficient context

### react-live Gotchas
- No template literals in D3 transforms (use string concatenation)
- Must use `React.useState` not destructured `useState`
- Import statements break the sandbox
- Scope must include full React object for JSX

### Redux Time-Travel
- Simple array of versions works better than complex linked lists
- Immutability is your friend
- Don't serialize huge objects in Redux

### UX Polish Matters
- Success toasts feel great
- Undo/redo pulse indicators guide users
- Welcome messages reduce confusion
- Custom prompt chips lower barrier to entry

---

## 📊 Performance

- **Bundle Size:** ~50KB (just react-live)
- **Generation Time:** 5-10s (Claude thinking)
- **Render Time:** Instant (react-live is fast)
- **Memory:** ~20MB per version
- **Cost per Generation:** ~$0.015

Scales to 50+ versions easily without performance issues.

---

## 🔒 Security

### Sandboxing
- No `eval()` or `Function()` constructor
- Limited scope (no DOM/window access)
- No file system or network
- Error boundaries catch crashes

### Input Validation
- Markdown stripping
- Import statement filtering
- React structure verification
- Max prompt length limits

### API Safety
- Rate limiting ready
- Error logging
- Timeout handling
- Input sanitization

---

## 🚀 Future Ideas

- **Fine-tuned model** - Custom Claude training on react-live patterns
- **Component library** - Pre-built dashboard components users can request
- **Collaborative editing** - Share URLs with live collaboration
- **Export to CodeSandbox** - One-click deployment
- **Video export** - Record transformation animations
- **Voice input** - Speak your changes
- **Mobile app** - Dashboard Studio on the go

---

## 📝 Key Takeaways

### For Developers
1. **AI integration is hard** - Prompt engineering is a skill
2. **Sandboxing is critical** - Never trust AI-generated code completely
3. **UX makes or breaks it** - Polish turns a demo into a product
4. **Version control is essential** - Users need undo

### For AI Engineers
1. **Context is everything** - Claude needs to know the environment
2. **Examples matter** - Show correct patterns explicitly
3. **Validation is key** - Parse and sanitize all AI output
4. **Iterate quickly** - Test prompts extensively

### For Product Builders
1. **Lower the barrier** - Custom prompts make features discoverable
2. **Show, don't tell** - Live preview beats documentation
3. **Forgiveness over permission** - Undo enables experimentation
4. **Make it fun** - Animations and polish create delight

---

## 🙏 Credits

- **Claude Sonnet 4** by Anthropic - The brain behind the magic
- **react-live** by FormidableLabs - Safe code execution
- **Framer Motion** - Buttery smooth animations
- **D3.js** - Powerful data visualizations
- **Redux Toolkit** - Elegant state management

---

## 📬 Contact

Built by **Alan Campbell**

- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]
- GitHub: [Your GitHub]
- Email: [Your Email]

---

## 📄 License

MIT License - Feel free to learn from and build upon this!

---

**Star this repo if you found it interesting! ⭐**

Built during the Byte Byte AI Engineering Cohort 🚀