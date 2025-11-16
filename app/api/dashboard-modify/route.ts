// app/api/dashboard-modify/route.ts
import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: Request) {
  try {
    const { currentCode, userPrompt } = await request.json();

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!userPrompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // System prompt - this is crucial for quality
    const systemPrompt = `You are an expert React developer modifying a dashboard component.

CRITICAL EXECUTION CONTEXT:
Your code will be executed in a react-live sandbox with these exact constraints:
- Available in scope: React (full object), motion (framer-motion), d3 (D3.js)
- NO imports allowed - they break the sandbox
- NO TypeScript types - use plain JavaScript
- NO template literals in D3 transform attributes - use string concatenation
- Hooks MUST use React.useState, React.useEffect, React.useRef (not destructured)

CURRENT COMPONENT STRUCTURE:
${currentCode}

USER REQUEST: "${userPrompt}"

MODIFICATION RULES:
1. Return ONLY the function code - no imports, no exports, no markdown blocks
2. Start directly with: function DashboardComponent() {
3. Keep the same component name: DashboardComponent
4. Preserve the data structure (metrics array, chartData array)
5. You can modify: colors, styles, layouts, animations, chart types, add/remove sections
6. Use string concatenation for D3 transforms: 'translate(' + x + ',' + y + ')'
7. All className values must be valid Tailwind CSS classes
8. Keep all animations smooth and performant

EXAMPLES OF CORRECT PATTERNS:

✅ CORRECT Hook Usage:
const [count, setCount] = React.useState(0);
React.useEffect(() => { ... }, []);
const ref = React.useRef(null);

❌ WRONG:
const [count, setCount] = useState(0);  // Missing React.

✅ CORRECT D3 Transform:
.attr('transform', 'translate(' + x + ',' + y + ')')

❌ WRONG:
.attr('transform', \`translate(\${x},\${y})\`)  // Template literals break

✅ CORRECT Motion:
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

❌ WRONG:
<motion.div variants={variants}>  // No external variants

RESPONSE FORMAT:
Return only the complete function code. No explanations. No markdown. Just:

function DashboardComponent() {
  // your code here
  return (
    <div>...</div>
  );
}

Now modify the component based on: "${userPrompt}"`;

    console.log('🤖 Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', errorText);
      return NextResponse.json(
        { error: 'Claude API request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    let newCode = data.content[0].text;

    console.log('✅ Claude responded with', newCode.length, 'characters');

    // Strip markdown code blocks if present
    newCode = newCode.replace(/```tsx\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Remove any "use client" directives (not needed in sandbox)
    newCode = newCode.replace(/'use client';?\n?/g, '').replace(/"use client";?\n?/g, '').trim();

    // Basic validation - check if it looks like React code
    if (!newCode.includes('function') && !newCode.includes('const')) {
      console.error('❌ Response doesn\'t look like valid code');
      return NextResponse.json(
        { error: 'Invalid code response from Claude' },
        { status: 500 }
      );
    }

    // Check for common issues
    if (newCode.includes('import ') && newCode.indexOf('import ') < 50) {
      console.warn('⚠️ Code contains import statements - stripping them');
      // Remove import statements from the beginning
      newCode = newCode.split('\n').filter(line => !line.trim().startsWith('import ')).join('\n').trim();
    }

    return NextResponse.json({
      newCode,
      prompt: userPrompt,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Dashboard modification API',
    claudeConfigured: !!ANTHROPIC_API_KEY
  });
}