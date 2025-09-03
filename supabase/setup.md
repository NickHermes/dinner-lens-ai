# Supabase Setup Instructions for DinnerLens AI

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a name like "dinner-lens-ai"
3. Set a strong database password
4. Choose a region close to you

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env.local` file in your project root with:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run** to create all tables, functions, and policies

## 4. Enable Vector Extension

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Search for "vector" and enable it
3. This enables the embedding similarity search functionality

## 5. Set Up Storage

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket called "dinner-photos"
3. Set it to **Public** for easy access
4. Configure the following policies:

```sql
-- Allow users to upload their own photos
CREATE POLICY "Users can upload own photos" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own photos
CREATE POLICY "Users can view own photos" ON storage.objects
FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own photos
CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 6. Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your_project_ref
```

4. Deploy the functions:
```bash
supabase functions deploy ai-search
supabase functions deploy ai-vision-analysis
```

## 7. Set Up Environment Variables for Edge Functions

1. In Supabase dashboard, go to **Settings** → **Edge Functions**
2. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)

## 8. Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Open http://localhost:8080
3. Try creating a new dinner with a photo
4. Check if AI analysis works

## 9. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Go to **API Keys** and create a new key
4. Add it to your `.env.local` file

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Make sure your `.env.local` file exists and has the correct variables
   - Restart your development server after adding environment variables

2. **"OpenAI API key not configured"**
   - Check that your OpenAI API key is set in both `.env.local` and Supabase Edge Functions secrets

3. **Database connection errors**
   - Verify your Supabase URL and anon key are correct
   - Check that the database schema was created successfully

4. **Storage upload errors**
   - Ensure the "dinner-photos" bucket exists and is public
   - Check that the storage policies are set up correctly

5. **Edge Functions not working**
   - Verify the functions are deployed: `supabase functions list`
   - Check the function logs: `supabase functions logs ai-search`

### Testing Commands:

```bash
# Test database connection
supabase db ping

# View function logs
supabase functions logs ai-search
supabase functions logs ai-vision-analysis

# Test local development
supabase start
```

## Next Steps

Once everything is set up:

1. Create some test dinners with photos
2. Test the AI tag suggestions
3. Try the AI search functionality
4. Set up some places with location data
5. Test the insights and analytics features

Your DinnerLens AI app should now be fully functional with all AI features enabled!
