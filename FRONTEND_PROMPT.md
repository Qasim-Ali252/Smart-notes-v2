# Frontend Design Prompt for AI-Powered Smart Notes

Use this prompt with Lovable.dev, v0.dev, or any AI frontend builder to generate beautiful UI components.

---

## 🎨 Main Prompt

```
Create a modern, beautiful UI for an AI-powered personal knowledge management app called "Smart Notes". 

Design Requirements:

1. DESIGN STYLE:
- Modern glassmorphism aesthetic with frosted glass effects
- Soft pastel color palette: lavender purple (#9B87F5), mint green, peachy coral, sky blue, rose pink
- Smooth shadows and subtle gradients
- Rounded corners (16px border radius)
- Clean, minimal, and spacious layout
- Inter font for body text, Lexend Deca for headings

2. COLOR SCHEME:
- Primary: Soft lavender purple (#9B87F5)
- Secondary: Mint green (#D3F4E8)
- Accent: Peachy coral (#FFB5A7)
- Background: Very light gray with subtle tint (#FAFAFA)
- Text: Dark gray (#2D3748)
- Muted: Light gray (#E2E8F0)

3. COMPONENTS NEEDED:

A. Dashboard Page:
- Top navbar with logo, search bar, notifications, user avatar
- Left sidebar with navigation (All Notes, Favorites, Recent, Notebooks, Tags)
- Main content area with:
  * Stats cards showing: Total Notes, This Week, AI Enriched, Growth
  * Topic cluster cards (3-7 colorful cards grouping related notes)
  * Notes grid (3 columns on desktop, responsive)
- Each note card shows: title, preview text, AI summary badge, tags, timestamp
- Floating "New Note" button (bottom right)

B. Note Editor Page:
- Clean, distraction-free editor
- Title input (large, bold)
- Tags input (comma-separated, shows as chips)
- Content textarea (full height, minimal styling)
- Top bar with: Back button, Save button, Delete button
- Right sidebar with:
  * AI summary panel (if available)
  * Key topics chips
  * Document upload section
  * AI chat assistant

C. Login Page:
- Centered card on gradient background
- App logo/icon at top
- Email input field
- "Send Magic Link" button
- Subtle animations

D. Search Modal:
- Full-screen overlay with blur backdrop
- Large search input at top
- Results grid below (2 columns)
- Each result shows note card with relevance score

E. AI Chat Component:
- Chat interface with message bubbles
- User messages: purple background, right-aligned
- AI messages: gray background, left-aligned, bot icon
- Input area at bottom with send button
- Quick action buttons: "Summarize", "Create action items", "Suggest improvements"

4. INTERACTIVE ELEMENTS:
- Smooth hover effects on cards (lift up 4px, increase shadow)
- Spring bounce animations on buttons
- Fade-in animations for note cards (staggered)
- Loading states with spinners
- Toast notifications for actions
- Smooth transitions (300ms ease-out)

5. GLASSMORPHISM EFFECTS:
- Cards: semi-transparent white background with blur
- Navbar: frosted glass with backdrop-filter: blur(16px)
- Sidebar: subtle glass effect
- Modals: strong blur backdrop

6. RESPONSIVE DESIGN:
- Mobile: Single column, hamburger menu, bottom navigation
- Tablet: 2 columns for notes, collapsible sidebar
- Desktop: 3 columns for notes, persistent sidebar

7. SPECIAL FEATURES:
- Tag chips with pastel colors (auto-assigned)
- AI summary badges with sparkle icon
- Topic cluster cards with folder icons
- Stats cards with trend icons
- Empty states with friendly illustrations
- Loading skeletons for content

8. ACCESSIBILITY:
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Focus indicators
- Proper ARIA labels
- Color contrast ratios met

Tech Stack: React/Next.js, TypeScript, Tailwind CSS, shadcn/ui components

Generate clean, production-ready code with proper component structure and TypeScript types.
```

---

## 🎯 Specific Component Prompts

### For Individual Components:

#### 1. Note Card Component
```
Create a beautiful note card component with:
- Glassmorphism effect (frosted glass background)
- Title (bold, 18px)
- Content preview (3 lines max, gray text)
- AI summary badge (purple, with sparkle icon)
- Tag chips (pastel colors: lavender, mint, peach, sky, rose)
- Timestamp and read time at bottom
- Hover effect: lift 4px, increase shadow
- Click to open note
- Quick actions on hover: favorite, pin, more options

Style: Modern, clean, with soft shadows and rounded corners
Colors: Use pastel palette
```

#### 2. Search Bar Component
```
Create a search bar with:
- Search icon on left
- Input field with placeholder "Search notes or ask a question..."
- Keyboard shortcut hint (⌘K) on right
- Focus state with purple ring
- Dropdown results on type
- Loading spinner when searching
- Clear button (X) when text entered

Style: Glassmorphism, integrated into navbar
```

#### 3. Topic Cluster Card
```
Create a topic cluster card showing:
- Folder icon and cluster name
- Brief description
- Note count badge
- Preview of 3 notes (clickable)
- Color-coded border (lavender, mint, peach, sky, or rose)
- Hover effect with shadow increase

Style: Colorful, inviting, with glassmorphism
```

#### 4. AI Chat Interface
```
Create a chat interface with:
- Message bubbles (user: purple right, AI: gray left)
- Avatar icons (user icon, bot icon)
- Timestamps
- Auto-scroll to latest message
- Input textarea at bottom
- Send button (paper plane icon)
- Quick action buttons above input
- Loading indicator for AI response

Style: Modern chat UI, smooth animations
```

#### 5. Stats Dashboard Cards
```
Create 4 stat cards showing:
- Icon (FileText, Calendar, Sparkles, TrendingUp)
- Large number (total count)
- Label below
- Subtle background color
- Hover effect

Layout: 4 cards in a row (responsive to 2x2 on mobile)
Style: Minimal, clean, with icons
```

---

## 🎨 Design System Specifications

### Colors (HSL Format)
```css
/* Primary */
--primary: 260 60% 65%;           /* Lavender purple */
--primary-foreground: 0 0% 100%;  /* White */

/* Secondary */
--secondary: 160 50% 92%;         /* Mint green */
--secondary-foreground: 160 60% 25%;

/* Accent */
--accent: 15 85% 70%;             /* Peachy coral */
--accent-foreground: 15 85% 15%;

/* Tag Colors */
--tag-lavender: 260 60% 85%;
--tag-mint: 160 50% 85%;
--tag-peach: 15 85% 85%;
--tag-sky: 200 70% 85%;
--tag-rose: 340 70% 85%;

/* Backgrounds */
--background: 240 20% 99%;
--foreground: 240 10% 15%;
--muted: 240 15% 96%;
--border: 240 15% 90%;
```

### Typography
```css
/* Fonts */
font-family: 'Inter', sans-serif;           /* Body */
font-family: 'Lexend Deca', sans-serif;     /* Headings */

/* Sizes */
h1: 2rem (32px), bold
h2: 1.5rem (24px), semibold
h3: 1.25rem (20px), semibold
body: 1rem (16px), normal
small: 0.875rem (14px), normal
```

### Spacing
```css
/* Consistent spacing scale */
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

### Shadows
```css
/* Glassmorphism shadows */
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.06);
--shadow-glass-hover: 0 12px 40px rgba(0, 0, 0, 0.1);
--shadow-inner: inset 0 1px 0 rgba(255, 255, 255, 0.5);
```

### Border Radius
```css
--radius-sm: 0.5rem (8px)
--radius-md: 1rem (16px)
--radius-lg: 1.5rem (24px)
--radius-full: 9999px
```

---

## 📱 Page Layouts

### Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  Navbar (Logo | Search | Notifications | Avatar) │
├──────┬──────────────────────────────────────┤
│      │  Stats Cards (4 across)              │
│ Side │  ┌────┬────┬────┬────┐              │
│ bar  │  │ 24 │ +5 │ 18 │ ↑  │              │
│      │  └────┴────┴────┴────┘              │
│ Nav  │                                      │
│ Tags │  Topic Clusters                      │
│      │  ┌─────────┬─────────┬─────────┐   │
│      │  │Marketing│ Product │Personal │   │
│      │  │ 5 notes │ 3 notes │ 4 notes │   │
│      │  └─────────┴─────────┴─────────┘   │
│      │                                      │
│      │  All Notes                           │
│      │  ┌────────┬────────┬────────┐      │
│      │  │ Note 1 │ Note 2 │ Note 3 │      │
│      │  │ AI ✨  │ AI ✨  │        │      │
│      │  └────────┴────────┴────────┘      │
│      │  ┌────────┬────────┬────────┐      │
│      │  │ Note 4 │ Note 5 │ Note 6 │      │
│      │  └────────┴────────┴────────┘      │
└──────┴──────────────────────────────────────┘
                                    [+ New Note]
```

### Note Editor Layout
```
┌─────────────────────────────────────────────┐
│  ← Back          [Save] [Delete]            │
├─────────────────────────────┬───────────────┤
│                             │               │
│  Title Input (Large)        │  AI Summary   │
│  ─────────────────────      │  ┌──────────┐│
│                             │  │ Summary  ││
│  Tags: tag1, tag2           │  │ text...  ││
│  ─────────────────────      │  └──────────┘│
│                             │               │
│  Content Area               │  Key Topics   │
│  (Full height textarea)     │  • Topic 1   │
│                             │  • Topic 2   │
│                             │               │
│                             │  Documents    │
│                             │  [Upload]     │
│                             │               │
│                             │  AI Chat      │
│                             │  ┌──────────┐│
│                             │  │ Chat UI  ││
│                             │  └──────────┘│
└─────────────────────────────┴───────────────┘
```

---

## 🎬 Animation Specifications

```css
/* Note card entrance */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hover lift effect */
.note-card:hover {
  transform: translateY(-4px);
  transition: all 0.3s ease-out;
}

/* Spring bounce for buttons */
.spring-bounce {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Fade in for modals */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Staggered animation for note grid */
.note-card:nth-child(1) { animation-delay: 0ms; }
.note-card:nth-child(2) { animation-delay: 50ms; }
.note-card:nth-child(3) { animation-delay: 100ms; }
```

---

## 💡 Usage Tips

1. **For Lovable.dev**: Paste the main prompt, then iterate with specific component prompts
2. **For v0.dev**: Use component-specific prompts for individual pieces
3. **For Claude/ChatGPT**: Ask for complete page layouts with the main prompt
4. **For Figma**: Use design system specs to create design tokens

---

## 🔄 Iteration Prompts

After initial generation, refine with:

```
"Make the glassmorphism effect stronger with more blur"
"Add smooth spring animations to all buttons"
"Make the note cards more colorful with gradient borders"
"Add empty states with friendly illustrations"
"Improve mobile responsiveness for the sidebar"
"Add loading skeletons for better perceived performance"
"Make the AI chat interface more conversational"
```

---

**Copy any section above and paste into your AI frontend builder!** 🎨
