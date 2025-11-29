-- ============================================================================
-- Contract Auditor RAG - Supabase Schema
-- ============================================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE: contract_risks
-- Stores risk definitions with embeddings for semantic search
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  key_indicators TEXT[] NOT NULL,
  mitigation_strategy TEXT[] NOT NULL,
  severity_range TEXT NOT NULL,
  content TEXT NOT NULL, -- Concatenated searchable text
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS contract_risks_embedding_idx 
ON contract_risks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for risk_type lookups
CREATE INDEX IF NOT EXISTS contract_risks_type_idx ON contract_risks(risk_type);

-- ============================================================================
-- TABLE: contract_examples
-- Stores analyzed contracts with embeddings
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_hash TEXT NOT NULL UNIQUE,
  text_preview TEXT NOT NULL,
  risks_found TEXT[] NOT NULL,
  overall_score FLOAT,
  full_analysis JSONB NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS contract_examples_embedding_idx 
ON contract_examples USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for hash lookups
CREATE INDEX IF NOT EXISTS contract_examples_hash_idx ON contract_examples(contract_hash);

-- ============================================================================
-- RPC FUNCTION: match_contract_risks
-- Semantic search for relevant risk definitions
-- ============================================================================

CREATE OR REPLACE FUNCTION match_contract_risks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  risk_type TEXT,
  display_name TEXT,
  description TEXT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    contract_risks.id,
    contract_risks.risk_type,
    contract_risks.display_name,
    contract_risks.description,
    contract_risks.content,
    1 - (contract_risks.embedding <=> query_embedding) AS similarity,
    contract_risks.metadata
  FROM contract_risks
  WHERE 1 - (contract_risks.embedding <=> query_embedding) > match_threshold
  ORDER BY contract_risks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- RPC FUNCTION: match_contract_examples
-- Find similar past contracts
-- ============================================================================

CREATE OR REPLACE FUNCTION match_contract_examples(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  text_preview TEXT,
  risks_found TEXT[],
  overall_score FLOAT,
  full_analysis JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    contract_examples.id,
    contract_examples.text_preview,
    contract_examples.risks_found,
    contract_examples.overall_score,
    contract_examples.full_analysis,
    1 - (contract_examples.embedding <=> query_embedding) AS similarity
  FROM contract_examples
  WHERE 1 - (contract_examples.embedding <=> query_embedding) > match_threshold
  ORDER BY contract_examples.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- FUNCTION: get_contract_rag_stats
-- Get statistics about the RAG knowledge base
-- ============================================================================

CREATE OR REPLACE FUNCTION get_contract_rag_stats()
RETURNS TABLE (
  risk_definitions BIGINT,
  analyzed_contracts BIGINT,
  total_documents BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM contract_risks) AS risk_definitions,
    (SELECT COUNT(*) FROM contract_examples) AS analyzed_contracts,
    (SELECT COUNT(*) FROM contract_risks) + (SELECT COUNT(*) FROM contract_examples) AS total_documents;
END;
$$;

-- ============================================================================
-- Enable Row Level Security (Optional - for production)
-- ============================================================================

-- ALTER TABLE contract_risks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contract_examples ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
-- CREATE POLICY "Allow public read access" ON contract_risks FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON contract_examples FOR SELECT USING (true);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE contract_risks IS 'Risk definitions with embeddings for semantic search';
COMMENT ON TABLE contract_examples IS 'Analyzed contracts with embeddings for RAG retrieval';
COMMENT ON FUNCTION match_contract_risks IS 'Semantic search for relevant risk definitions';
COMMENT ON FUNCTION match_contract_examples IS 'Find similar past analyzed contracts';
COMMENT ON FUNCTION get_contract_rag_stats IS 'Get RAG knowledge base statistics';
