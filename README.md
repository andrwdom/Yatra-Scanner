# YATRA Event Entry Scanner

A production-ready QR code and manual entry scanner for college cultural events.

## Features

- 🔐 Password-protected volunteer access
- 📱 QR code scanning via device camera
- ⌨️ Manual 6-digit code entry fallback
- 🔍 Search by email or code for verification
- ✅ Full-screen GREEN/RED result display
- ⚡ Atomic ticket validation (prevents double-entry)
- 📱 Mobile-first, works on low-end Android

## Tech Stack

- React (Vite)
- Supabase (Postgres backend)
- html5-qrcode (camera QR scanning)

## Setup

### 1. Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `VITE_GATE_PASSWORD` - Shared password for volunteers
- `VITE_CURRENT_DAY` - Current event day (1 or 2)

### 2. Database Setup

Run the SQL migration in your Supabase SQL editor:

```bash
# See supabase/migrations/001_tickets_table.sql
```

### 3. Install & Run

```bash
npm install
npm run dev
```

## Ticket Types

| Type | Day 1 | Day 2 |
|------|-------|-------|
| DAY1 | ✅ Once | ❌ |
| DAY2 | ❌ | ✅ Once |
| COMBO | ✅ Once | ✅ Once |

## Usage

1. Volunteer enters shared password
2. Choose QR scan or manual entry
3. Scan ticket QR code OR enter 6-digit code
4. GREEN = Allow entry, RED = Reject
5. Use search for edge cases

## Architecture

```
src/
├── components/
│   ├── PasswordGate.jsx    # Login screen
│   ├── Scanner.jsx         # Main scanner UI
│   ├── QRScanner.jsx       # Camera QR scanning
│   ├── ManualEntry.jsx     # 6-digit code input
│   ├── ResultScreen.jsx    # GREEN/RED result
│   └── FallbackSearch.jsx  # Search by email/code
├── lib/
│   ├── supabase.js         # Supabase client
│   └── ticketVerification.js # Core verification logic
├── App.jsx
└── main.jsx
```

## Critical: Atomic Verification

The `verify_and_mark_ticket` Postgres function ensures:
- Row-level locking prevents race conditions
- Two simultaneous scans → only one succeeds
- No double-entry possible

See `supabase/migrations/001_tickets_table.sql` for implementation.
