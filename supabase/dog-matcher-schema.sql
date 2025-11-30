-- ============================================================================
-- Dog Breed Matcher RAG - Supabase Schema
-- ============================================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE: dog_breeds
-- Stores breed information with embeddings for semantic matching
-- ============================================================================

CREATE TABLE IF NOT EXISTS dog_breeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breed_id TEXT NOT NULL UNIQUE, -- From dogapi.dog
  name TEXT NOT NULL,
  description TEXT,
  
  -- Physical attributes
  size_category TEXT, -- Small, Medium, Large
  male_weight_min INTEGER,
  male_weight_max INTEGER,
  female_weight_min INTEGER,
  female_weight_max INTEGER,
  life_min INTEGER,
  life_max INTEGER,
  
  -- Behavioral attributes
  breed_group TEXT, -- Sporting, Hound, Working, Terrier, Toy, Non-Sporting, Herding
  temperament TEXT[], -- Array of temperament traits
  energy_level TEXT, -- Low, Medium, High, Very High
  exercise_needs TEXT, -- Low, Medium, High
  trainability TEXT, -- Low, Medium, High, Very High
  
  -- Living situation
  apartment_friendly BOOLEAN,
  good_with_kids BOOLEAN,
  good_with_pets BOOLEAN,
  
  -- Grooming
  grooming_needs TEXT, -- Low, Medium, High
  shedding_level TEXT, -- Minimal, Low, Moderate, Heavy
  hypoallergenic BOOLEAN,
  
  -- Images
  image_urls TEXT[], -- Array of image URLs from dog.ceo
  
  -- Search content
  profile_text TEXT NOT NULL, -- Rich text description for embedding
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  
  metadata JSONB, -- Store any additional API data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS dog_breeds_embedding_idx 
ON dog_breeds USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS dog_breeds_name_idx ON dog_breeds(name);
CREATE INDEX IF NOT EXISTS dog_breeds_group_idx ON dog_breeds(breed_group);
CREATE INDEX IF NOT EXISTS dog_breeds_size_idx ON dog_breeds(size_category);

-- ============================================================================
-- TABLE: user_matches
-- Stores user quiz results and matches for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  user_profile_text TEXT NOT NULL,
  user_profile_embedding VECTOR(1536),
  quiz_answers JSONB NOT NULL,
  top_matches JSONB NOT NULL, -- Array of matched breeds with scores
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_matches_session_idx ON user_matches(session_id);

-- ============================================================================
-- RPC FUNCTION: match_dog_breeds
-- Semantic search for breed matches based on user profile
-- ============================================================================

CREATE OR REPLACE FUNCTION match_dog_breeds(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  breed_id TEXT,
  name TEXT,
  description TEXT,
  size_category TEXT,
  breed_group TEXT,
  temperament TEXT[],
  energy_level TEXT,
  exercise_needs TEXT,
  apartment_friendly BOOLEAN,
  good_with_kids BOOLEAN,
  good_with_pets BOOLEAN,
  shedding_level TEXT,
  hypoallergenic BOOLEAN,
  image_urls TEXT[],
  profile_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dog_breeds.id,
    dog_breeds.breed_id,
    dog_breeds.name,
    dog_breeds.description,
    dog_breeds.size_category,
    dog_breeds.breed_group,
    dog_breeds.temperament,
    dog_breeds.energy_level,
    dog_breeds.exercise_needs,
    dog_breeds.apartment_friendly,
    dog_breeds.good_with_kids,
    dog_breeds.good_with_pets,
    dog_breeds.shedding_level,
    dog_breeds.hypoallergenic,
    dog_breeds.image_urls,
    dog_breeds.profile_text,
    1 - (dog_breeds.embedding <=> query_embedding) AS similarity
  FROM dog_breeds
  WHERE dog_breeds.embedding IS NOT NULL
  ORDER BY dog_breeds.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- FUNCTION: get_dog_matcher_stats
-- Get statistics about the dog breed database
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dog_matcher_stats()
RETURNS TABLE (
  total_breeds BIGINT,
  breeds_with_embeddings BIGINT,
  total_matches_performed BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM dog_breeds) AS total_breeds,
    (SELECT COUNT(*) FROM dog_breeds WHERE embedding IS NOT NULL) AS breeds_with_embeddings,
    (SELECT COUNT(*) FROM user_matches) AS total_matches_performed;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE dog_breeds IS 'Dog breed data with embeddings for semantic matching';
COMMENT ON TABLE user_matches IS 'User quiz results and match history for analytics';
COMMENT ON FUNCTION match_dog_breeds IS 'Semantic search for best breed matches based on user profile';
COMMENT ON FUNCTION get_dog_matcher_stats IS 'Get dog matcher database statistics';
