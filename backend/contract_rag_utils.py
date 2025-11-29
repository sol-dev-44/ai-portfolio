import os
import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import asdict
from supabase import create_client, Client
from openai import OpenAI
from contract_logic import RISK_DATABASE, RiskType

# =============================================================================
# CONFIGURATION
# =============================================================================

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# OpenAI client for embeddings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# =============================================================================
# CACHE SYSTEM (Still using local cache for analysis results)
# =============================================================================

from pathlib import Path
import json

CACHE_DIR = Path("./lsat_cache")
CONTRACT_CACHE_DIR = CACHE_DIR / "contracts"
CONTRACT_CACHE_DIR.mkdir(exist_ok=True, parents=True)

class ContractCacheManager:
    """Handles caching of contract analyses."""
    
    @staticmethod
    def get_cache_key(text: str) -> str:
        """Generate a unique cache key from contract text."""
        return hashlib.sha256(text.encode()).hexdigest()[:16]
    
    @staticmethod
    def save_to_cache(key: str, data: Dict[str, Any]) -> None:
        """Save analysis to cache."""
        cache_file = CONTRACT_CACHE_DIR / f"{key}.json"
        with open(cache_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    @staticmethod
    def load_from_cache(key: str) -> Optional[Dict[str, Any]]:
        """Load analysis from cache if exists."""
        cache_file = CONTRACT_CACHE_DIR / f"{key}.json"
        if cache_file.exists():
            with open(cache_file, 'r') as f:
                return json.load(f)
        return None

contract_cache = ContractCacheManager()

# =============================================================================
# EMBEDDING FUNCTIONS
# =============================================================================

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI."""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

def build_risk_content(risk_type: str, info: Any) -> str:
    """Build searchable content from risk info."""
    return (
        f"{info.display_name}: {info.description}. "
        f"Indicators: {', '.join(info.key_indicators)}. "
        f"Mitigation: {' '.join(info.mitigation_strategy)}"
    )

# =============================================================================
# RAG SYSTEM (Supabase-backed)
# =============================================================================

class ContractRAG:
    """RAG system using Supabase for persistent, shared learning."""
    
    def __init__(self):
        """Initialize RAG system."""
        self._ensure_risks_populated()
    
    def _ensure_risks_populated(self):
        """Ensure risk definitions are in Supabase (idempotent)."""
        try:
            # Check if risks exist
            response = supabase.table('contract_risks').select('id').limit(1).execute()
            
            if not response.data:
                print("⚠️  No risk definitions found in Supabase.")
                print("   Run: npx tsx --env-file=.env.local scripts/migrate-contract-rag.ts")
        except Exception as e:
            print(f"Warning: Could not verify risk definitions: {e}")
    
    def search_risks(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant risk definitions using semantic search."""
        try:
            # Generate embedding for query
            query_embedding = generate_embedding(query)
            
            if not query_embedding:
                return []
            
            # Semantic search in Supabase
            response = supabase.rpc('match_contract_risks', {
                'query_embedding': query_embedding,
                'match_threshold': 0.3,
                'match_count': top_k
            }).execute()
            
            if response.data:
                return [
                    {
                        'id': item['risk_type'],
                        'type': 'risk_definition',
                        'content': item['content'],
                        'metadata': {
                            'display_name': item['display_name'],
                            'description': item['description'],
                            'similarity': item['similarity']
                        }
                    }
                    for item in response.data
                ]
            
            return []
            
        except Exception as e:
            print(f"Error in semantic search: {e}")
            # Fallback to empty list
            return []
    
    def search_examples(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search for similar past contracts using semantic search."""
        try:
            # Generate embedding for query
            query_embedding = generate_embedding(query)
            
            if not query_embedding:
                return []
            
            # Semantic search in Supabase
            response = supabase.rpc('match_contract_examples', {
                'query_embedding': query_embedding,
                'match_threshold': 0.3,
                'match_count': top_k
            }).execute()
            
            if response.data:
                return [
                    {
                        'id': item['id'],
                        'type': 'analyzed_contract',
                        'text_preview': item['text_preview'],
                        'risks_found': item['risks_found'],
                        'overall_score': item['overall_score'],
                        'similarity': item['similarity']
                    }
                    for item in response.data
                ]
            
            return []
            
        except Exception as e:
            print(f"Error searching examples: {e}")
            return []
    
    def add_example(self, contract_text: str, analysis: Dict[str, Any]):
        """Add an analyzed contract to the example index."""
        print(f"\n{'='*60}")
        print("📝 RAG: add_example() called")
        print(f"{'='*60}")
        
        try:
            contract_hash = contract_cache.get_cache_key(contract_text)
            print(f"   Contract hash: {contract_hash}")
            print(f"   Contract length: {len(contract_text)} chars")
            
            # Generate embedding
            text_preview = contract_text[:500]
            print(f"   Generating embedding for {len(text_preview)} char preview...")
            embedding = generate_embedding(text_preview)
            
            if not embedding:
                print("   ❌ ERROR: Could not generate embedding for contract")
                print("   Check OPENAI_API_KEY is set correctly")
                return
            
            print(f"   ✅ Embedding generated: {len(embedding)} dimensions")
            
            # Extract risks from analysis
            risks_found = [r.get('type') for r in analysis.get('risks', [])]
            overall_score = analysis.get('overall_risk_score')
            print(f"   Risks found: {risks_found}")
            print(f"   Overall score: {overall_score}")
            
            # Insert into Supabase (upsert to avoid duplicates)
            print(f"   Upserting to Supabase contract_examples table...")
            
            payload = {
                'contract_hash': contract_hash,
                'text_preview': text_preview,
                'risks_found': risks_found,
                'overall_score': overall_score,
                'full_analysis': analysis,
                'embedding': embedding
            }
            
            response = supabase.table('contract_examples').upsert(
                payload, 
                on_conflict='contract_hash'
            ).execute()
            
            # Check response
            if response.data:
                print(f"   ✅ Supabase response: {len(response.data)} row(s) affected")
                print(f"   Row ID: {response.data[0].get('id', 'N/A')}")
            else:
                print(f"   ⚠️  Supabase response had no data")
                print(f"   Full response: {response}")
            
            print(f"✅ Successfully added contract example to RAG index (hash: {contract_hash})")
            print(f"{'='*60}\n")
            
        except Exception as e:
            import traceback
            print(f"   ❌ ERROR adding example: {e}")
            print(f"   Traceback:")
            traceback.print_exc()
            print(f"{'='*60}\n")
    
    def get_context_for_analysis(self, contract_text: str) -> str:
        """Get RAG context for contract analysis."""
        context_parts = []
        
        # Search for relevant risk definitions
        risks = self.search_risks(contract_text[:1000], top_k=5)
        if risks:
            context_parts.append("## Relevant Risk Definitions:")
            for risk in risks:
                context_parts.append(f"- {risk['content']}")
        
        # Search for similar past contracts
        examples = self.search_examples(contract_text[:500], top_k=3)
        if examples:
            context_parts.append("\n## Similar Past Contracts:")
            for ex in examples:
                context_parts.append(
                    f"- Contract with risks: {', '.join(ex['risks_found'])} "
                    f"(score: {ex['overall_score']}, similarity: {ex['similarity']:.2f})"
                )
        
        return "\n".join(context_parts) if context_parts else ""
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about the RAG index."""
        try:
            # Use RPC function for stats
            response = supabase.rpc('get_contract_rag_stats').execute()
            
            if response.data and len(response.data) > 0:
                stats = response.data[0]
                return {
                    "risk_definitions": stats['risk_definitions'],
                    "analyzed_contracts": stats['analyzed_contracts'],
                    "total_documents": stats['total_documents']
                }
            
            # Fallback to individual queries
            risks_count = supabase.table('contract_risks').select('id', count='exact').execute()
            examples_count = supabase.table('contract_examples').select('id', count='exact').execute()
            
            risk_count = risks_count.count or 0
            example_count = examples_count.count or 0
            
            return {
                "risk_definitions": risk_count,
                "analyzed_contracts": example_count,
                "total_documents": risk_count + example_count
            }
            
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {
                "risk_definitions": 0,
                "analyzed_contracts": 0,
                "total_documents": 0
            }

# Global instance
contract_rag = ContractRAG()