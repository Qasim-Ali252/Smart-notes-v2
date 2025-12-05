# Supabase Edge Functions Migration Guide

## Overview

This project has been migrated to use Supabase Edge Functions instead of Next.js API Routes. Edge Functions run on Deno at the edge, providing lower latency and better integration with Supabase.

## Migrated Functions

The following critical functions have been converted:

1. **extract-document** - AI document extraction and analysis
2. **enrich-note** - Note enrichment with AI
3. **generate-embedding** - Vector embedding generation
4. **search-semantic** - Semantic search using embeddings

## Prerequisites

1. Install Supabase CLI:
```bash
# Windows (PowerShell)
scoop install supabase

# Or using npm
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
cd smart-notes
supabase link --project-ref your-project-ref
```

## Local Development

### 1. Start Supabase locally:
```bash
cd smart-notes
supabase start
```

This will start:
- PostgreSQL database
- Supabase Studio (http://localhost:54323)
- Edge Functions runtime
- Auth server

### 2. Serve Edge Functions locally:
```bash
supabase functions serve
```

Or serve a specific function:
```bash
supabase functions serve extract-document --env-file supabase/.env
```

### 3. Test a function:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/extract-document' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"filePath":"path/to/file.txt","noteId":"note-id"}'
```

## Deployment

### 1. Set environment variables in Supabase Dashboard:

Go to: Project Settings → Edge Functions → Add secret

Add these secrets:
- `GEMINI_API_KEY` - Your Google Gemini API key

### 2. Deploy all functions:
```bash
supabase functions deploy
```

### 3. Deploy a specific function:
```bash
supabase functions deploy extract-document
supabase functions deploy enrich-note
supabase functions deploy generate-embedding
supabase functions deploy search-semantic
```

### 4. Verify deployment:
```bash
supabase functions list
```

## Update Frontend to Use Edge Functions

Update your frontend code to call Edge Functions instead of Next.js API routes:

### Before (Next.js API Route):
```typescript
const response = await fetch('/api/extract-document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filePath, noteId })
})
```

### After (Edge Function):
```typescript
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/extract-document`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ filePath, noteId })
  }
)
```

## Environment Variables

### Local Development (.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

### Production (.env.production):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## Monitoring & Logs

### View function logs:
```bash
supabase functions logs extract-document
```

### View logs in real-time:
```bash
supabase functions logs extract-document --follow
```

### View logs in Supabase Dashboard:
Project → Edge Functions → Select function → Logs

## Troubleshooting

### Function not found:
- Ensure function is deployed: `supabase functions list`
- Check function name matches exactly

### Authentication errors:
- Verify Authorization header is included
- Check token is valid: `supabase auth verify`

### CORS errors:
- Ensure corsHeaders are included in response
- Check OPTIONS method is handled

### Import errors:
- Use Deno-compatible imports (https://esm.sh/ or https://deno.land/)
- Update import_map.json if needed

## Performance Tips

1. **Keep functions small** - Each function should do one thing
2. **Use connection pooling** - Supabase client handles this automatically
3. **Cache when possible** - Use Supabase's built-in caching
4. **Monitor cold starts** - Functions stay warm with regular traffic

## Cost Considerations

Supabase Edge Functions pricing:
- Free tier: 500K invocations/month, 2M compute seconds
- Pro: $10/month for 2M invocations
- Monitor usage in Dashboard → Settings → Billing

## Next Steps

1. ✅ Deploy Edge Functions to production
2. ✅ Update frontend to call Edge Functions
3. ✅ Remove old Next.js API routes (optional)
4. ✅ Set up monitoring and alerts
5. ✅ Test all functionality end-to-end

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
