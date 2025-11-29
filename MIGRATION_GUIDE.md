# Contract Auditor RAG Migration Guide

## Step 1: Run SQL Schema in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `qcohcaavhwujvagmpbdp`
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `supabase/contract-rag-schema.sql`
5. Click **Run** to execute the schema

This will create:
- `contract_risks` table with vector embeddings
- `contract_examples` table for analyzed contracts
- RPC functions for semantic search
- Indexes for fast vector similarity search

## Step 2: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `supabase==2.11.0` - Supabase Python client
- `openai==1.58.1` - For generating embeddings

## Step 3: Run Migration Script

```bash
# From project root
npx tsx --env-file=.env.local scripts/migrate-contract-rag.ts
```

This will:
1. Load 13 risk definitions
2. Generate embeddings for each
3. Insert into Supabase `contract_risks` table
4. Verify migration with test search

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║  Contract Auditor RAG - Supabase Migration                ║
╚════════════════════════════════════════════════════════════╝

✅ Environment variables loaded

🔄 Migrating risk definitions to Supabase...

   Generating embedding for: Liability Risk
   ✅ Inserted: Liability Risk
   ...
   (13 total)

✅ Risk definitions migration complete!

🔍 Verifying migration...

   ✅ Risk definitions: 13
   ✅ Contract examples: 0

🧪 Testing semantic search...

   Query: "unlimited liability exposure"
   Results: 3 matches

   1. Liability Risk (similarity: 0.842)
   2. Indemnification Risk (similarity: 0.756)
   3. Warranty Risk (similarity: 0.623)

✅ Verification complete!

╔════════════════════════════════════════════════════════════╗
║  Migration Complete! 🎉                                   ║
╚════════════════════════════════════════════════════════════╝
```

## Step 4: Restart Backend

```bash
cd backend
python main.py
```

The backend will now use Supabase for RAG instead of local JSON files.

## Step 5: Test the Feature

1. Go to http://localhost:3000/contract-auditor
2. Upload a contract
3. Analyze it
4. Check the RAG stats - should show 13 risk definitions
5. Analyze another contract - it should be added to examples

## Verification

Check Supabase tables:

```sql
-- Check risk definitions
SELECT risk_type, display_name FROM contract_risks;

-- Check analyzed contracts
SELECT contract_hash, risks_found, overall_score FROM contract_examples;

-- Test semantic search
SELECT * FROM match_contract_risks(
  (SELECT embedding FROM contract_risks LIMIT 1),
  0.3,
  5
);
```

## Rollback (if needed)

The local JSON files are still in `backend/lsat_cache/` as backup.

To rollback:
1. Revert `backend/contract_rag_utils.py` from git
2. Restart backend

## Benefits After Migration

✅ **Persistent** - Data survives deployments
✅ **Shared** - All users benefit from training
✅ **Semantic** - Better search than keyword matching
✅ **Scalable** - Handles millions of contracts
✅ **Fast** - Sub-200ms vector search

## Troubleshooting

### "pgvector extension not found"
Run in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "OPENAI_API_KEY not found"
Add to `.env.local`:
```
OPENAI_API_KEY=sk-proj-...
```

### Migration script fails
Check:
1. Supabase credentials in `.env.local`
2. OpenAI API key is valid
3. Tables were created successfully
4. You have internet connection

### Backend can't connect to Supabase
Check:
1. `NEXT_PUBLIC_SUPABASE_URL` in environment
2. `SUPABASE_SERVICE_ROLE_KEY` in environment
3. Supabase project is active
