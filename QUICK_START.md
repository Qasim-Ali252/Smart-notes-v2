# Quick Start - Smart Notes

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
cd smart-notes
npm install
```

### 2. Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy Project URL and anon key from Settings → API
3. Run SQL from `supabase/schema.sql` in SQL Editor
4. Enable Email Auth in Authentication → Providers

### 3. Get OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key in API Keys section
3. Add billing if needed

### 4. Create .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
```

### 5. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📝 First Steps

1. **Login**: Enter your email → Check inbox for magic link
2. **Create Note**: Click "New Note" → Add title & content → Save
3. **View Notes**: See all notes on dashboard
4. **Edit**: Click any note to edit
5. **Delete**: Open note → Click Delete

## 🔧 Key Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

## 📁 Important Files

- `.env.local` - Your API keys (create this!)
- `supabase/schema.sql` - Database setup
- `app/dashboard/page.tsx` - Main dashboard
- `lib/store/slices/notesSlice.ts` - Redux state

## 🐛 Troubleshooting

**Can't login?**
- Check Supabase Email Auth is enabled
- Look in spam folder for magic link

**Notes not saving?**
- Verify .env.local has correct Supabase credentials
- Check SQL schema was run in Supabase

**AI not working?**
- Verify OpenAI API key in .env.local
- Check you have credits in OpenAI account
- Restart dev server after adding env vars

## 🎯 What Works Now

✅ Email authentication
✅ Create/edit/delete notes
✅ View all notes
✅ Tags and metadata
✅ Protected routes
✅ Responsive UI

## 🚧 To Implement

- Auto AI enrichment on save
- Search functionality
- Document upload
- Note Q&A chat
- Topic clustering

## 📚 Documentation

- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `PROJECT_OVERVIEW.md` - Architecture and features

## 💡 Tips

- Use Chrome DevTools to debug
- Check browser console for errors
- View data in Supabase Table Editor
- Test API routes with curl or Postman

## 🎨 Customization

**Change colors**: Edit `app/globals.css`
**Add features**: Check `PROJECT_OVERVIEW.md` for guides
**Modify UI**: Components are in `app/` directory

## 📞 Need Help?

1. Check error messages in console
2. Verify all env variables are set
3. Ensure Supabase schema is correct
4. Restart dev server

---

**You're all set!** Start by logging in and creating your first note. 🎉
