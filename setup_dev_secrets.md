# Setup Development Supabase Secrets

## Step 1: Add OpenAI API Key Secret

1. Go to your **Development Supabase**: https://supabase.com/dashboard/project/bvzclxdppwpayawrnrkz
2. Click **Edge Functions** → **Secrets**
3. Add a new secret:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: [Your OpenAI API Key - same as production]

## Step 2: Create match_embeddings SQL Function

1. Go to **SQL Editor** in your development Supabase
2. Run the contents of `create_match_embeddings_function.sql`

## Step 3: Test AI Analysis

After completing steps 1 and 2, test the AI analysis in your local development app!
