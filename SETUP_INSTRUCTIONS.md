# YATRA Scanner - Quick Setup Instructions

## The page is blank? Here's why and how to fix it:

### Problem
The app needs environment variables to work. Without a `.env` file, the app cannot initialize and shows a blank page.

### Solution

**Step 1: Create the `.env` file**

Create a new file called `.env` (note the dot at the start) in the root directory:
```
D:\Productivity\YATRA SCANNER\.env
```

**Step 2: Add these contents to `.env`:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key

# Volunteer Access Password  
VITE_GATE_PASSWORD=volunteer123

# Current Event Day (1 or 2)
VITE_CURRENT_DAY=1
```

**Step 3: Restart the dev server**

1. Stop the current server (Ctrl+C in the terminal)
2. Run `npm run dev` again
3. Refresh your browser at `http://localhost:5173/`

### What you should see:

After adding the `.env` file and restarting, you should see:
- A dark-themed login screen with "YATRA" heading
- A password input field
- "Enter" button

**Test login:** Use password `volunteer123` (or whatever you set in `VITE_GATE_PASSWORD`)

---

## When you're ready for production:

Replace the placeholder values with your real Supabase credentials:

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy your project URL → replace `VITE_SUPABASE_URL`
4. Copy your `anon/public` key → replace `VITE_SUPABASE_ANON_KEY`
5. Set a secure password for volunteers → replace `VITE_GATE_PASSWORD`
6. On event day, change `VITE_CURRENT_DAY` to `1` or `2`

---

## Quick Commands

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

**Still seeing blank page?**
1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Most common issue: Missing or incorrect `.env` file
4. Make sure to restart the server after creating/editing `.env`

**Camera not working?**
- Browser needs HTTPS or localhost
- Check camera permissions in browser settings
- On mobile, use HTTPS (deploy to Vercel/Netlify for free HTTPS)
