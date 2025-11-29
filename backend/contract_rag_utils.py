import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import asdict
from contract_logic import RISK_DATABASE, RiskType

# =============================================================================
# CONFIGURATION
# =============================================================================

CACHE_DIR = Path("./lsat_cache") # Reusing existing cache dir structure
CONTRACT_CACHE_DIR = CACHE_DIR / "contracts"
RAG_INDEX_DIR = CACHE_DIR / "rag_index"

# Ensure directories exist
CONTRACT_CACHE_DIR.mkdir(exist_ok=True, parents=True)
RAG_INDEX_DIR.mkdir(exist_ok=True, parents=True)

# =============================================================================
# CACHE SYSTEM
# =============================================================================

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
# RAG SYSTEM
# =============================================================================

class ContractRAG:
    """RAG system for retrieving relevant risk definitions and past contract examples."""
    
    def __init__(self):
        self.risk_index: List[Dict[str, Any]] = []
        self.contract_index: List[Dict[str, Any]] = []
        self._load_indices()
    
    def _load_indices(self):
        """Load existing indices from disk."""
        risk_index_file = RAG_INDEX_DIR / "risks.json"
        contract_index_file = RAG_INDEX_DIR / "contracts.json"
        
        if risk_index_file.exists():
            with open(risk_index_file, 'r') as f:
                self.risk_index = json.load(f)
        else:
            # Initialize with risk database
            self._build_risk_index()
        
        if contract_index_file.exists():
            with open(contract_index_file, 'r') as f:
                self.contract_index = json.load(f)
    
    def _build_risk_index(self):
        """Build initial risk index from risk database."""
        self.risk_index = []
        for risk_type, info in RISK_DATABASE.items():
            self.risk_index.append({
                "id": risk_type.value,
                "type": "risk_definition",
                "content": f"{info.display_name}: {info.description}. " +
                          f"Indicators: {', '.join(info.key_indicators)}. " +
                          f"Mitigation: {' '.join(info.mitigation_strategy)}",
                "metadata": asdict(info)
            })
        self._save_indices()
    
    def _save_indices(self):
        """Save indices to disk."""
        with open(RAG_INDEX_DIR / "risks.json", 'w') as f:
            json.dump(self.risk_index, f, indent=2)
        with open(RAG_INDEX_DIR / "contracts.json", 'w') as f:
            json.dump(self.contract_index, f, indent=2)
    
    def add_example(self, contract_text: str, analysis: Dict[str, Any]):
        """Add an analyzed contract to the example index."""
        # Store a summarized version or snippets to avoid huge index files
        # For now, we'll store the risks found
        
        example_entry = {
            "id": contract_cache.get_cache_key(contract_text),
            "type": "analyzed_contract",
            "text_preview": contract_text[:500],
            "risks_found": [r.get("type") for r in analysis.get("risks", [])],
            "overall_score": analysis.get("overall_risk_score"),
            "full_analysis": analysis
        }
        
        # Avoid duplicates
        existing_ids = {e["id"] for e in self.contract_index}
        if example_entry["id"] not in existing_ids:
            self.contract_index.append(example_entry)
            self._save_indices()
    
    def search_risks(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant risk definitions based on query keywords."""
        query_lower = query.lower()
        scored_results = []
        
        for item in self.risk_index:
            content = item["content"].lower()
            # Simple keyword matching
            score = sum(1 for word in query_lower.split() if word in content)
            if score > 0:
                scored_results.append((score, item))
        
        # Sort by score and return top_k
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in scored_results[:top_k]]
    
    def get_context_for_analysis(self, contract_text: str) -> str:
        """Build RAG context for analyzing a contract."""
        # In a real system, we would chunk the contract and search for risks per chunk.
        # For now, we will include ALL risk definitions to ensure comprehensive coverage,
        # as the risk database is relatively small.
        
        context_parts = ["## Risk Knowledge Base\n"]
        
        for item in self.risk_index:
            metadata = item.get("metadata", {})
            context_parts.append(f"### {metadata.get('display_name', 'Risk')}")
            context_parts.append(f"**Description:** {metadata.get('description', '')}")
            context_parts.append(f"**Key Indicators:** {', '.join(metadata.get('key_indicators', []))}")
            context_parts.append(f"**Severity Factors:** {', '.join(metadata.get('severity_factors', []))}")
            context_parts.append(f"**Mitigation Strategy:**")
            for step in metadata.get('mitigation_strategy', []):
                context_parts.append(f"  - {step}")
            context_parts.append("")
        
        # Add a few relevant past examples if available
        if self.contract_index:
             context_parts.append("## Similar Past Analyses\n")
             # Simple logic: just take the last 2 examples
             for ex in self.contract_index[-2:]:
                 context_parts.append(f"**Contract Preview:** {ex.get('text_preview')}...")
                 context_parts.append(f"**Risks Found:** {', '.join(ex.get('risks_found', []))}")
                 context_parts.append("")

        return "\n".join(context_parts)
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about the RAG index."""
        return {
            "risk_definitions": len(self.risk_index),
            "analyzed_contracts": len(self.contract_index),
            "total_documents": len(self.risk_index) + len(self.contract_index)
        }

# Initialize RAG
contract_rag = ContractRAG()
