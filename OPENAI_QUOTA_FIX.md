# OpenAI Quota Exceeded - Fix Guide

## Error
"OpenAI API quota exceeded. Please check your API key."

## Cause
Your OpenAI account has run out of free credits or your payment method needs to be added.

## Solutions

### 1. Add Credits (Best Solution)
1. Visit: https://platform.openai.com/settings/organization/billing
2. Click "Add payment method"
3. Add a credit card
4. Purchase credits ($5 minimum recommended)
5. Wait 2-5 minutes for activation
6. Restart your dev server: `npm run dev`

### 2. Check Your Usage
1. Visit: https://platform.openai.com/usage
2. See how much you've used
3. Check if you have any credits left

### 3. Get a New API Key
If you have another account:
1. Visit: https://platform.openai.com/api-keys
2. Create new secret key
3. Update `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-new-key-here
   ```
4. Restart server

### 4. Free Trial Info
- New accounts get $5 free credits
- Credits expire after 3 months
- After free credits, you need to add payment

## Cost Estimates

### Your App Usage:
- **Note Enrichment**: ~$0.002 per note (GPT-3.5)
- **Search**: ~$0.0001 per query (embeddings)
- **Q&A Chat**: ~$0.001 per message (GPT-3.5)
- **Topic Clustering**: ~$0.01 per analysis

### Example Costs:
- 100 notes enriched: ~$0.20
- 500 searches: ~$0.05
- 100 chat messages: ~$0.10
- 10 topic analyses: ~$0.10
- **Total for testing**: < $1

### Monthly Estimates:
- Light use (10 notes/day): ~$2/month
- Medium use (50 notes/day): ~$10/month
- Heavy use (200 notes/day): ~$40/month

## Temporary Workaround

While waiting for credits, you can test without AI:

### Disable AI Features:
1. Comment out AI enrichment calls
2. Use mock data for testing
3. Focus on UI/UX development

### Mock Mode (Optional):
Create a mock API that returns fake data instead of calling OpenAI.

## Verify It's Working

After adding credits:
1. Restart dev server
2. Try creating a note
3. Check if AI summary generates
4. Try the Q&A assistant
5. Check browser console for errors

## Still Having Issues?

### Check:
1. API key is correct in `.env.local`
2. No typos in the key
3. Key has proper permissions
4. Billing is active on OpenAI account
5. Server was restarted after changes

### Test API Key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

If this returns models, your key works!

## Alternative: Use Different AI Provider

If you don't want to use OpenAI, you can switch to:
- **Anthropic Claude** (similar pricing)
- **Google Gemini** (has free tier)
- **Ollama** (free, runs locally)
- **Hugging Face** (free tier available)

Would require code changes to switch providers.

---

**Most Common Solution**: Just add $5-10 credits to your OpenAI account and you're good to go! 💳
