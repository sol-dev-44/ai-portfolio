import re

with open('app/page.tsx', 'r') as f:
    text = f.read()

# 1. Insert the wrapper component
wrapper_code = """
const DisabledFeatureWrapper = ({ children, className, roundedClass = "rounded-3xl" }: { children: React.ReactNode, className?: string, roundedClass?: string }) => {
  return (
    <div 
      className={`relative group cursor-not-allowed ${className || ''}`}
      onClick={(e) => e.preventDefault()}
    >
      <div className={`pointer-events-none transition-all duration-300 ${roundedClass} overflow-hidden`}>
        <div className="group-hover:blur-sm transition-all duration-300 h-full w-full">
          {children}
        </div>
      </div>
      <div className={`absolute inset-0 bg-white/40 dark:bg-gray-950/60 backdrop-blur-[2px] ${roundedClass} z-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300`}>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 border border-gray-200 dark:border-gray-800 text-center mx-4 max-w-sm pointer-events-auto">
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feature Disabled 🥚</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Disabled to save money! I'm fully employed right now, but have you seen the price of eggs? 
          </p>
          <a href="https://github.com/sol-dev-44" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
            View code on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default function Home() {"""

text = text.replace("export default function Home() {", wrapper_code)

# Let's replace the link blocks with DisabledFeatureWrapper
# We will find `<Link href="/...">` that does not contain "http", and we replace `</Link>` with `</DisabledFeatureWrapper>` sequentially.
# It's safer to use manual splits to replace the right `</Link>`.
# But wait, we can just replace the specific <Link> blocks by targeting unique strings inside them.

replacements = [
    # Hero: Contract Auditor
    (('<Link href="/contract-auditor">', 'Try Contract Auditor', '</Link>'), '<DisabledFeatureWrapper roundedClass="rounded-2xl">', '</DisabledFeatureWrapper>'),
    # Hero: RAG Chat
    (('<Link href="/rag-chat">', 'Chat with my Resume', '</Link>'), '<DisabledFeatureWrapper roundedClass="rounded-2xl">', '</DisabledFeatureWrapper>'),
    
    # Grid items
    (('<Link href="/snapfix" className="md:col-span-2">', 'SnapFix AI Diagnostic', '</Link>'), '<DisabledFeatureWrapper className="md:col-span-2">', '</DisabledFeatureWrapper>'),
    (('<Link href="/contract-auditor">', 'RAG-powered legal risk analysis', '</Link>'), '<DisabledFeatureWrapper>', '</DisabledFeatureWrapper>'),
    (('<Link href="/dog-matcher">', 'Find your perfect dog', '</Link>'), '<DisabledFeatureWrapper>', '</DisabledFeatureWrapper>'),
    (('<Link href="/dashboard">', 'Dashboard Studio', '</Link>'), '<DisabledFeatureWrapper>', '</DisabledFeatureWrapper>'),
    (('<Link href="/llm-playground">', 'LLM Arena', '</Link>'), '<DisabledFeatureWrapper>', '</DisabledFeatureWrapper>'),
    (('<Link href="/tokenizer">', 'Tokenizer Visualizer', '</Link>'), '<DisabledFeatureWrapper>', '</DisabledFeatureWrapper>'),
    (('<Link href="/rag-chat">', 'RAG Chat', '</Link>'), '<DisabledFeatureWrapper>', '</DisabledFeatureWrapper>'),
    (('<Link href="/robot" className="md:col-span-2">', 'Interactive 3D Robot', '</Link>'), '<DisabledFeatureWrapper className="md:col-span-2">', '</DisabledFeatureWrapper>'),
    (('<Link href="/mood-lens" className="md:col-span-2">', 'MoodLens', '</Link>'), '<DisabledFeatureWrapper className="md:col-span-2">', '</DisabledFeatureWrapper>'),
    (('<Link href="/generation" className="md:col-span-2">', 'Token Generation Visualizer', '</Link>'), '<DisabledFeatureWrapper className="md:col-span-2">', '</DisabledFeatureWrapper>'),
    
    # Floating button
    (('<Link href="/rag-chat">', 'fixed bottom-6 right-6', '</Link>'), '<DisabledFeatureWrapper roundedClass="rounded-full flex">', '</DisabledFeatureWrapper>')
]

for identifier, new_open, new_close in replacements:
    start_tag, middle_content, end_tag = identifier
    
    # find middle index
    idx_mid = text.find(middle_content)
    if idx_mid == -1:
        print(f"COULD NOT FIND middle content: {middle_content}")
        continue
        
    start_idx = text.rfind(start_tag, 0, idx_mid)
    if start_idx == -1:
        print(f"COULD NOT FIND start tag before middle: {start_tag}")
        continue
        
    end_idx = text.find(end_tag, idx_mid)
    if end_idx == -1:
        print(f"COULD NOT FIND end tag after middle: {end_tag}")
        continue
        
    # piece it all together
    text = text[:start_idx] + new_open + text[start_idx+len(start_tag):end_idx] + new_close + text[end_idx+len(end_tag):]
    print(f"Replaced {middle_content}")

with open('app/page.tsx', 'w') as f:
    f.write(text)

print("SUCCESS")
