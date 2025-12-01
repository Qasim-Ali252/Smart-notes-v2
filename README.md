# Smart Notes - AI-Powered Personal Knowledge Hub

An intelligent personal knowledge system where users can store notes, get AI-generated summaries, and search using natural language.

## Features

- 🔐 **OTP Authentication** - Secure email-based login
- 📝 **Smart Notes** - Create, edit, and delete notes
- 🤖 **AI Enrichment** - Auto-generated summaries, tags, and key topics
- 📄 **Document Upload** - Upload PDFs and text files
- 🔍 **Smart Search** - Natural language search across all notes
- 💬 **Note Q&A** - Chat with AI about specific notes
- 📊 **Dashboard** - View all notes with topic clusters

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI**: OpenAI GPT-3.5/4

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Enable Email Auth in Authentication settings

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
smart-notes/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   ├── notes/            # Note pages
│   └── layout.tsx        # Root layout
├── lib/
│   ├── store/            # Redux store & slices
│   └── supabase/         # Supabase clients
├── supabase/
│   └── schema.sql        # Database schema
└── .env.local            # Environment variables
```

## Usage

1. **Sign Up/Login**: Use email OTP authentication
2. **Create Notes**: Click "New Note" to create a note
3. **AI Enrichment**: Notes are automatically analyzed for summaries and tags
4. **Search**: Use natural language to find relevant notes
5. **Edit/Delete**: Manage your notes from the dashboard

## API Routes

- `POST /api/enrich-note` - Generate AI summaries and tags
- `POST /api/search` - Semantic search across notes

## Database Schema

- **notes**: Stores user notes with AI-generated metadata
- **documents**: Stores uploaded files and extracted content

## Next Steps

- [ ] Implement document upload functionality
- [ ] Add vector embeddings for semantic search
- [ ] Create note Q&A assistant
- [ ] Add topic clustering
- [ ] Implement real-time sync
- [ ] Add voice notes support

## License

MIT
