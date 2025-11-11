export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
              AI/ML Engineer
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-white tracking-tight">
            Alan Campbell
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Building intelligent systems with TypeScript, Python, and modern AI frameworks. 
            Staff Engineer exploring the intersection of full-stack development and machine learning.
          </p>
          
          <div className="flex gap-4 justify-center pt-4">
            <a 
              href="/tokenizer"
              className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Try Tokenizer
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a 
              href="/projects"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:scale-105"
            >
              View Projects
            </a>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="px-4 py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Tech Stack
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tools and technologies I work with
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'TypeScript', icon: '⚡' },
              { name: 'React', icon: '⚛️' },
              { name: 'Next.js', icon: '▲' },
              { name: 'Node.js', icon: '🟢' },
              { name: 'Python', icon: '🐍' },
              { name: 'FastAPI', icon: '⚙️' },
              { name: 'PyTorch', icon: '🔥' },
              { name: 'TensorFlow', icon: '🧠' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-4xl mb-3">{tech.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tech.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Preview */}
      <section className="px-4 py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Projects
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <a 
              href="/tokenizer"
              className="group p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Tokenizer Comparison
                </h3>
                <span className="text-2xl">🔤</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Interactive tool to compare how different LLM tokenizers (GPT-2, GPT-4, Claude) split text into tokens. Built with Python FastAPI backend and Next.js frontend.
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  Python
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  FastAPI
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  Next.js
                </span>
              </div>
            </a>

            <a 
              href="/projects"
              className="group p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  More Projects
                </h3>
                <span className="text-2xl">🚀</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Explore my full portfolio of AI/ML projects, full-stack applications, and experimental tools. From React applications to Python backends.
              </p>
              <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform inline-block">
                View all projects →
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}