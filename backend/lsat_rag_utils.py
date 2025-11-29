#!/usr/bin/env python3
# lsat_rag_utils.py - RAG utilities for LSAT pattern analysis
# 
# Usage:
#   python lsat_rag_utils.py ingest --dataset tasksource/lsat-ar --count 50
#   python lsat_rag_utils.py search "conditional reasoning assumption"
#   python lsat_rag_utils.py stats
#   python lsat_rag_utils.py export --output lsat_patterns.json

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx

# Configuration
SERVICE_URL = "http://localhost:8001"
CACHE_DIR = Path("./lsat_cache")

# =============================================================================
# HTTP CLIENT
# =============================================================================

async def call_service(method: str, endpoint: str, data: dict = None) -> dict:
    """Call the LSAT service."""
    url = f"{SERVICE_URL}{endpoint}"
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            if method == "GET":
                response = await client.get(url, params=data)
            else:
                response = await client.post(url, json=data)
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"❌ HTTP Error: {e}")
            return {"error": str(e)}
        except Exception as e:
            print(f"❌ Error: {e}")
            return {"error": str(e)}

async def stream_analysis(question: dict) -> str:
    """Stream analysis from the service."""
    url = f"{SERVICE_URL}/analyze/stream"
    full_text = ""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, json={
            "question": question,
            "use_cache": True,
            "use_rag": True
        }) as response:
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if data.get("type") == "text":
                            text = data.get("content", "")
                            print(text, end="", flush=True)
                            full_text += text
                        elif data.get("type") == "cached":
                            print("📦 Retrieved from cache!")
                            return json.dumps(data.get("analysis", {}), indent=2)
                        elif data.get("type") == "complete":
                            print("\n")
                        elif data.get("type") == "error":
                            print(f"\n❌ Error: {data.get('content')}")
                    except json.JSONDecodeError:
                        continue
    
    return full_text

# =============================================================================
# COMMANDS
# =============================================================================

async def cmd_ingest(args):
    """Fetch and analyze questions to build the cache."""
    print(f"🔄 Ingesting {args.count} questions from {args.dataset}...")
    
    # Fetch questions
    result = await call_service("POST", "/questions", {
        "dataset": args.dataset,
        "split": args.split,
        "count": args.count
    })
    
    if "error" in result:
        print(f"❌ Failed to fetch questions: {result['error']}")
        return
    
    questions = result.get("questions", [])
    print(f"✅ Fetched {len(questions)} questions")
    
    if args.analyze:
        print(f"\n📊 Analyzing questions (this may take a while)...")
        
        # Use batch analysis
        batch_result = await call_service("POST", "/analyze/batch", {
            "questions": questions,
            "use_cache": True
        })
        
        if "error" in batch_result:
            print(f"❌ Batch analysis failed: {batch_result['error']}")
            return
        
        results = batch_result.get("results", [])
        cache_hits = batch_result.get("cache_hits", 0)
        api_calls = batch_result.get("api_calls", 0)
        
        print(f"\n✅ Analysis Complete!")
        print(f"   Total: {len(results)}")
        print(f"   Cache Hits: {cache_hits}")
        print(f"   API Calls: {api_calls}")
        
        # Show pattern distribution
        pattern_counts = {}
        for r in results:
            analysis = r.get("analysis", {})
            pattern = analysis.get("pattern_type", "unknown")
            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
        
        print(f"\n📈 Pattern Distribution:")
        for pattern, count in sorted(pattern_counts.items(), key=lambda x: -x[1]):
            print(f"   {pattern}: {count}")
    else:
        # Just save questions to cache
        print(f"\n💾 Saving questions to cache...")
        for q in questions:
            cache_file = CACHE_DIR / "questions" / f"{q['id'].replace('/', '_')}.json"
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(cache_file, 'w') as f:
                json.dump(q, f, indent=2)
        print(f"✅ Saved {len(questions)} questions")

async def cmd_search(args):
    """Search for patterns or examples."""
    print(f"🔍 Searching for: {args.query}")
    
    result = await call_service("POST", "/patterns/search", {
        "query": args.query,
        "top_k": args.top_k
    })
    
    if "error" in result:
        print(f"❌ Search failed: {result['error']}")
        return
    
    results = result.get("results", [])
    print(f"\n📋 Found {len(results)} results:\n")
    
    for i, item in enumerate(results, 1):
        metadata = item.get("metadata", {})
        print(f"{i}. {metadata.get('display_name', 'Unknown')} ({item.get('id', 'N/A')})")
        print(f"   {metadata.get('description', 'No description')}")
        if metadata.get('key_indicators'):
            print(f"   Indicators: {', '.join(metadata['key_indicators'][:3])}")
        print()

async def cmd_analyze(args):
    """Analyze a single question interactively or from file."""
    if args.file:
        with open(args.file, 'r') as f:
            question = json.load(f)
    else:
        # Interactive mode
        print("📝 Enter question details (or Ctrl+C to cancel):")
        context = input("Context/Stimulus: ")
        question_text = input("Question: ")
        options_raw = input("Options (comma-separated): ")
        options = [o.strip() for o in options_raw.split(",")]
        answer = input("Correct answer (optional): ")
        
        question = {
            "id": "interactive",
            "context": context,
            "question": question_text,
            "options": options,
            "answer": answer or None
        }
    
    print(f"\n🧠 Analyzing question...")
    print("─" * 60)
    
    if args.stream:
        analysis = await stream_analysis(question)
    else:
        result = await call_service("POST", "/analyze", {
            "question": question,
            "use_cache": True,
            "use_rag": True
        })
        
        if "error" in result:
            print(f"❌ Analysis failed: {result['error']}")
            return
        
        analysis = result.get("analysis", {})
        print(json.dumps(analysis, indent=2))
        
        if result.get("from_cache"):
            print("\n📦 Retrieved from cache")

async def cmd_stats(args):
    """Show cache and RAG statistics."""
    print("📊 LSAT Service Statistics\n")
    
    # Health check
    health = await call_service("GET", "/health")
    print("🏥 Service Health:")
    print(f"   Status: {'✅ Healthy' if health.get('status') == 'healthy' else '❌ Unhealthy'}")
    print(f"   Anthropic API: {'✅' if health.get('anthropic_configured') else '❌'}")
    print(f"   Datasets: {'✅' if health.get('datasets_available') else '❌'}")
    print()
    
    # Cache stats
    cache_stats = await call_service("GET", "/cache/stats")
    print("💾 Cache Statistics:")
    print(f"   Pattern Analyses: {cache_stats.get('pattern_analyses_cached', 0)}")
    print(f"   Questions: {cache_stats.get('questions_cached', 0)}")
    print(f"   RAG Patterns: {cache_stats.get('rag_patterns_indexed', 0)}")
    print(f"   RAG Examples: {cache_stats.get('rag_examples_indexed', 0)}")
    print()
    
    # Pattern overview
    patterns = await call_service("GET", "/patterns")
    if patterns and "patterns" in patterns:
        print("📚 Pattern Types Available:")
        for pattern_id, info in patterns["patterns"].items():
            print(f"   • {info.get('display_name', pattern_id)}")

async def cmd_examples(args):
    """List analyzed examples."""
    params = {"limit": args.limit}
    if args.pattern:
        params["pattern_type"] = args.pattern
    
    result = await call_service("GET", "/rag/examples", params)
    
    if "error" in result:
        print(f"❌ Failed to get examples: {result['error']}")
        return
    
    examples = result.get("examples", [])
    total = result.get("total", 0)
    
    print(f"📝 Examples ({len(examples)} of {total}):\n")
    
    for i, ex in enumerate(examples, 1):
        print(f"{i}. [{ex.get('pattern_type', 'unknown')}] {ex.get('question_text', 'N/A')[:60]}...")
        if ex.get("breakdown_preview"):
            print(f"   Preview: {ex['breakdown_preview'][:80]}...")
        print()

async def cmd_export(args):
    """Export cached analyses."""
    print(f"📤 Exporting to {args.output}...")
    
    # Get all examples
    result = await call_service("GET", "/rag/examples", {"limit": 1000})
    
    if "error" in result:
        print(f"❌ Export failed: {result['error']}")
        return
    
    examples = result.get("examples", [])
    
    # Get patterns
    patterns = await call_service("GET", "/patterns")
    
    export_data = {
        "patterns": patterns.get("patterns", {}),
        "analyzed_examples": examples,
        "exported_at": str(Path(args.output).stat().st_mtime if Path(args.output).exists() else "new")
    }
    
    with open(args.output, 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"✅ Exported {len(examples)} examples and {len(patterns.get('patterns', {}))} patterns")

async def cmd_clear(args):
    """Clear cache."""
    print("🗑️ Clearing cache...")
    
    result = await call_service("DELETE", "/cache/clear", {
        "patterns": args.patterns,
        "examples": args.examples
    })
    
    if "error" in result:
        print(f"❌ Clear failed: {result['error']}")
        return
    
    cleared = result.get("cleared", [])
    print(f"✅ Cleared: {', '.join(cleared) if cleared else 'nothing'}")

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="LSAT RAG Utilities - Manage cache and analyze questions"
    )
    parser.add_argument("--service-url", default=SERVICE_URL, help="LSAT service URL")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Ingest command
    ingest_parser = subparsers.add_parser("ingest", help="Fetch and cache questions")
    ingest_parser.add_argument("--dataset", default="tasksource/lsat-ar", help="HuggingFace dataset")
    ingest_parser.add_argument("--split", default="train", help="Dataset split")
    ingest_parser.add_argument("--count", type=int, default=10, help="Number of questions")
    ingest_parser.add_argument("--analyze", action="store_true", help="Also run analysis")
    
    # Search command
    search_parser = subparsers.add_parser("search", help="Search patterns")
    search_parser.add_argument("query", help="Search query")
    search_parser.add_argument("--top-k", type=int, default=5, help="Number of results")
    
    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze a question")
    analyze_parser.add_argument("--file", help="JSON file with question")
    analyze_parser.add_argument("--stream", action="store_true", help="Stream output")
    
    # Stats command
    subparsers.add_parser("stats", help="Show statistics")
    
    # Examples command
    examples_parser = subparsers.add_parser("examples", help="List analyzed examples")
    examples_parser.add_argument("--pattern", help="Filter by pattern type")
    examples_parser.add_argument("--limit", type=int, default=10, help="Max results")
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export cached data")
    export_parser.add_argument("--output", default="lsat_export.json", help="Output file")
    
    # Clear command
    clear_parser = subparsers.add_parser("clear", help="Clear cache")
    clear_parser.add_argument("--patterns", action="store_true", help="Clear pattern cache")
    clear_parser.add_argument("--examples", action="store_true", help="Clear example index")
    
    args = parser.parse_args()
    
    global SERVICE_URL
    SERVICE_URL = args.service_url
    
    if not args.command:
        parser.print_help()
        return
    
    # Run command
    commands = {
        "ingest": cmd_ingest,
        "search": cmd_search,
        "analyze": cmd_analyze,
        "stats": cmd_stats,
        "examples": cmd_examples,
        "export": cmd_export,
        "clear": cmd_clear,
    }
    
    asyncio.run(commands[args.command](args))

if __name__ == "__main__":
    main()