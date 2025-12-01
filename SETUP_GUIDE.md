# Setup Guide - Smart Notes

## Step-by-Step Setup Instructions

### 1. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project
5. Wait for the project to be provisioned

#### Get Your Credentials
1. Go to Project Settings > API
2. Copy the following:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

#### Set Up Database
1. Go to SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy the entire content from `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables are created in Table Editor

#### Enable Email Authentication
1. Go to Authentication > Providers
2. Enable "Email" provider
3. Configure email templates (optional)
4. For development, you can use the default settings

### 2. OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API Keys section
4. Click "Create new secret key"
5. Copy the key (you won't see it again!)
6. Add billing information if needed

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Testing the Application

### 1. Test Authentication
1. Go to `/auth/login`
2. Enter your email
3. Check your email for the magic link
4. Click the link to log in

### 2. Test Note Creation
1. Click "New Note"
2. Enter a title and content
3. Add some tags
4. Click "Save Note"

### 3. Test AI Enrichment
To manually trigger AI enrichment, you can call the API:

```bash
curl -X POST http://localhost:3000/api/enrich-note \
  -H "Content-Type: application/json" \
  -d '{"noteId": "your-note-id", "content": "Your note content"}'
```

## Common Issues

### Issue: "Invalid API key" error
- Make sure your OpenAI API key is correct in `.env.local`
- Restart the dev server after changing env variables

### Issue: Supabase connection error
- Verify your Supabase URL and anon key
- Check if your Supabase project is active
- Ensure RLS policies are set up correctly

### Issue: Authentication not working
- Check if Email provider is enabled in Supabase
- For development, check spam folder for magic links
- Verify callback URL is correct

### Issue: Notes not saving
- Check browser console for errors
- Verify database schema is set up correctly
- Check RLS policies allow insert/update

## Development Tips

1. **Hot Reload**: Changes to code will auto-reload
2. **Database**: Use Supabase Table Editor to view data
3. **Logs**: Check browser console and terminal for errors
4. **API Testing**: Use tools like Postman or curl

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
Make sure to add all env variables in your hosting platform:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- OPENAI_API_KEY

## Next Features to Implement

1. **Auto-enrichment on save**: Add a hook to call `/api/enrich-note` after creating/updating notes
2. **Document upload**: Implement file upload to Supabase Storage
3. **Search UI**: Create a search bar component
4. **Note Q&A**: Add chat interface for individual notes
5. **Topic clusters**: Group notes by AI-detected topics

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure Supabase schema is correctly set up
4. Check that you have credits in your OpenAI account
