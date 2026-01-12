# YATRA 2026 - Backend Documentation

This document provides a comprehensive overview of the backend architecture, database schemas, tables, edge functions, and all backend-related components of the YATRA 2026 project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Database Tables](#database-tables)
4. [Edge Functions](#edge-functions)
5. [Authentication & Authorization](#authentication--authorization)
6. [Email Service](#email-service)
7. [API Endpoints](#api-endpoints)
8. [Environment Variables](#environment-variables)
9. [Row Level Security (RLS)](#row-level-security-rls)
10. [Database Functions & RPCs](#database-functions--rpcs)

---

## Architecture Overview

The YATRA 2026 backend is built on **Supabase**, a PostgreSQL-based Backend-as-a-Service (BaaS) platform. The architecture consists of:

- **PostgreSQL Database**: Stores all application data (registrations, tickets)
- **Supabase Edge Functions**: Serverless Deno functions for backend logic
- **Supabase Auth**: Handles user authentication (Google OAuth)
- **SMTP Email Service**: Native Deno TLS implementation for sending emails

### Technology Stack

- **Database**: PostgreSQL (via Supabase)
- **Backend Runtime**: Deno (Edge Functions)
- **Authentication**: Supabase Auth with Google OAuth
- **Email**: Native SMTP via Gmail (TLS)
- **Client SDK**: `@supabase/supabase-js` (v2.7.1)

---

## Database Schema

The database uses the default `public` schema. All tables are created in this schema unless otherwise specified.

### Schema Diagram

```
public/
├── registrations (table)
│   ├── id (UUID, PK)
│   ├── name (TEXT)
│   ├── email (TEXT, UNIQUE)
│   ├── phone (TEXT)
│   ├── college (TEXT)
│   ├── ticket_type (TEXT, nullable)
│   ├── price (TEXT, nullable)
│   ├── is_rit_student (BOOLEAN)
│   ├── created_at (TIMESTAMPTZ)
│   ├── ticket_generated (BOOLEAN)
│   ├── ticket_email_sent (BOOLEAN)
│   └── ticket_sent_at (TIMESTAMPTZ, nullable)
│
└── tickets (table)
    ├── id (UUID, PK)
    ├── registration_id (UUID, FK → registrations.id)
    ├── email (TEXT)
    ├── name (TEXT)
    ├── college (TEXT)
    ├── six_digit_code (TEXT, UNIQUE)
    ├── qr_payload (TEXT)
    └── ticket_status (TEXT)
```

---

## Database Tables

### 1. `registrations` Table

Stores all user registrations for the YATRA 2026 event.

#### Table Structure

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | `UUID` | PRIMARY KEY, NOT NULL | `gen_random_uuid()` | Unique registration identifier |
| `name` | `TEXT` | NOT NULL | - | Full name of the registrant |
| `email` | `TEXT` | NOT NULL, UNIQUE | - | Email address (lowercase, trimmed) |
| `phone` | `TEXT` | NOT NULL | - | 10-digit Indian mobile number (digits only) |
| `college` | `TEXT` | NOT NULL | - | College/institution name |
| `ticket_type` | `TEXT` | NULLABLE | - | Type of ticket (e.g., "Early Bird", "Event") |
| `price` | `TEXT` | NULLABLE | - | Ticket price (e.g., "₹750", "₹500") |
| `is_rit_student` | `BOOLEAN` | NULLABLE | `false` | Whether registrant is an RIT Chennai student |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | Registration timestamp |
| `ticket_generated` | `BOOLEAN` | NULLABLE | `false` | Whether ticket has been generated |
| `ticket_email_sent` | `BOOLEAN` | NULLABLE | `false` | Whether ticket email has been sent |
| `ticket_sent_at` | `TIMESTAMPTZ` | NULLABLE | - | Timestamp when ticket was sent |

#### Indexes

```sql
CREATE INDEX idx_registrations_email ON registrations(email);
```

#### Business Rules

1. **Email Uniqueness**: Each email can only register once (enforced by UNIQUE constraint)
2. **RIT Student Detection**: Automatically detected based on:
   - Email domain: `@ritchennai.edu.in` or `@{dept}.ritchennai.edu.in`
   - College name: Must contain "Rajalakshmi Institute of Technology" or "RIT"
3. **Phone Validation**: Must be exactly 10 digits, starting with 6, 7, 8, or 9
4. **Price Calculation**:
   - RIT Students: ₹500
   - Early Bird: ₹750
   - Regular: ₹800

#### SQL Creation Script

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  ticket_type TEXT,
  price TEXT,
  is_rit_student BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ticket_generated BOOLEAN DEFAULT false,
  ticket_email_sent BOOLEAN DEFAULT false,
  ticket_sent_at TIMESTAMPTZ
);

CREATE INDEX idx_registrations_email ON registrations(email);
```

---

### 2. `tickets` Table

Stores generated tickets with QR codes for event entry.

#### Table Structure

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | `UUID` | PRIMARY KEY, NOT NULL | - | Unique ticket identifier (UUID) |
| `registration_id` | `UUID` | NOT NULL, FK | - | Reference to `registrations.id` |
| `email` | `TEXT` | NOT NULL | - | Email of ticket holder (denormalized) |
| `name` | `TEXT` | NOT NULL | - | Name of ticket holder (denormalized) |
| `college` | `TEXT` | NOT NULL | - | College name (denormalized) |
| `six_digit_code` | `TEXT` | NOT NULL, UNIQUE | - | 6-digit entry code (100000-999999) |
| `qr_payload` | `TEXT` | NOT NULL | - | JSON payload for QR code generation |
| `ticket_status` | `TEXT` | NOT NULL | `'valid'` | Status of ticket (e.g., 'valid', 'used', 'cancelled') |

#### QR Payload Structure

The `qr_payload` field contains a JSON string with the following structure:

```json
{
  "id": "ticket-uuid",
  "code": "123456"
}
```

Or in batch issuance:

```json
{
  "uid": "ticket-uuid",
  "rid": "registration-id",
  "code": "123456"
}
```

#### Business Rules

1. **Unique 6-Digit Code**: Each ticket has a unique 6-digit code (100000-999999)
2. **One Ticket Per Registration**: Each registration can have at most one ticket
3. **QR Code Generation**: QR codes are generated using external API (`api.qrserver.com`) or `qrcode` library
4. **Ticket Status**: Default status is `'valid'`

#### SQL Creation Script

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  college TEXT NOT NULL,
  six_digit_code TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  ticket_status TEXT NOT NULL DEFAULT 'valid',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX idx_tickets_six_digit_code ON tickets(six_digit_code);
CREATE INDEX idx_tickets_email ON tickets(email);
```

---

## Edge Functions

Supabase Edge Functions are serverless Deno functions that run on Supabase's edge network. They handle backend logic that requires server-side execution.

### 1. `send-registration-email`

**Purpose**: Sends confirmation emails to users after registration and generates tickets automatically.

**Location**: `supabase/functions/send-registration-email/`

**Trigger**: Called manually from frontend after successful registration insertion.

#### Function Signature

```typescript
POST /functions/v1/send-registration-email
Headers:
  - Authorization: Bearer {anon_key}
  - Content-Type: application/json
Body: RegistrationData
```

#### Request Body

```typescript
interface RegistrationData {
  id: string;              // Registration UUID
  name: string;
  email: string;
  phone: string;
  college: string;
  ticket_type: string | null;
  price: string | null;
  is_rit_student: boolean | null;
  created_at: string;
}
```

#### Function Flow

1. **Validation**: Validates required fields (email, name)
2. **Ticket Generation**:
   - Checks if ticket already exists for registration
   - Generates unique 6-digit code (100000-999999)
   - Creates ticket UUID
   - Generates QR code payload (JSON)
   - Inserts ticket into `tickets` table
   - Updates `registrations` table with ticket status
3. **Email Sending**:
   - Constructs HTML and plain text email templates
   - Includes registration details and ticket QR code
   - Sends via SMTP (Gmail)
4. **Response**: Returns success/error status

#### Response Format

```typescript
// Success
{
  message: "Confirmation email sent successfully",
  to: "user@example.com",
  ticket_generated: true,
  debug_error: null
}

// Error
{
  error: "Failed to send confirmation email",
  details: "Error message"
}
```

#### Environment Variables Required

- `EMAIL_USER`: Gmail account email
- `EMAIL_PASS`: Gmail app password
- `FROM_EMAIL`: Sender email (defaults to `EMAIL_USER`)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database operations

#### Email Template Features

- **HTML Email**: Styled with gradient header, registration details table, QR code image
- **Plain Text Fallback**: Text-only version for email clients that don't support HTML
- **Ticket Information**: Displays 6-digit entry code and QR code
- **Branding**: YATRA 2026 branding with purple gradient theme

---

### 2. `issue_tickets_batch`

**Purpose**: Allows admins to batch-issue tickets to multiple registrations at once.

**Location**: `supabase/functions/issue_tickets_batch/`

**Trigger**: Called from admin dashboard when issuing tickets in bulk.

#### Function Signature

```typescript
POST /functions/v1/issue_tickets_batch
Headers:
  - Authorization: Bearer {anon_key}
  - Content-Type: application/json
Body: {
  registration_ids: string[],
  issued_by_admin_email: string
}
```

#### Request Body

```typescript
{
  registration_ids: string[];        // Array of registration UUIDs
  issued_by_admin_email: string;     // Admin email for audit trail
}
```

#### Function Flow

1. **Validation**: Validates input (non-empty array, admin email)
2. **Deduplication**: Removes duplicate registration IDs
3. **Processing Loop** (for each registration):
   - Fetches registration from database
   - **Idempotency Check**: Skips if ticket already sent
   - Generates unique 6-digit code
   - Creates ticket UUID and QR payload
   - Generates QR code image (base64 data URL)
   - Inserts ticket into `tickets` table
   - Sends email with ticket
   - Updates registration status
4. **Response**: Returns summary of processed tickets

#### Response Format

```typescript
{
  success: true,
  issued_count: number,        // Successfully issued tickets
  skipped_count: number,       // Already sent tickets (skipped)
  failed: Array<{              // Failed registrations
    registration_id: string,
    reason: string
  }>
}
```

#### Features

- **Idempotent**: Won't send duplicate tickets
- **Batch Processing**: Handles multiple registrations efficiently
- **Error Handling**: Continues processing even if individual items fail
- **Audit Trail**: Tracks which admin issued the tickets

#### Dependencies

- `qrcode@1.5.1`: For generating QR code images
- `@supabase/supabase-js@2.7.1`: Supabase client

---

## Authentication & Authorization

### Authentication Flow

The application uses **Supabase Auth** with **Google OAuth** for admin authentication.

#### Admin Authentication

1. **Login Page**: `/admin` route
2. **OAuth Flow**: Google Sign-In via Supabase
3. **Admin Verification**: 
   - Hardcoded master admin: `meraryanto@gmail.com`
   - RPC function: `check_is_admin(user_email)`
4. **Session Management**: Supabase handles session persistence

#### Admin Verification Logic

```typescript
// Master admin bypass
if (user.email === 'meraryanto@gmail.com') {
  // Grant access immediately
}

// RPC-based verification
const { data: isAdmin } = await supabase.rpc('check_is_admin', {
  user_email: user.email
});
```

### Authorization

- **Public Access**: Registration form (INSERT only)
- **Authenticated Access**: Admin dashboard (SELECT, UPDATE)
- **RLS Policies**: Enforced at database level

---

## Email Service

### SMTP Configuration

The application uses **native Deno TLS** to connect to Gmail SMTP servers.

#### SMTP Settings

- **Host**: `smtp.gmail.com`
- **Port**: `465` (TLS)
- **Authentication**: AUTH LOGIN (Base64 encoded)
- **Protocol**: TLS/SSL

#### Email Flow

1. **Connection**: Establishes TLS connection to Gmail SMTP
2. **Authentication**: Sends credentials via AUTH LOGIN
3. **Message Construction**: Builds MIME multipart message (HTML + plain text)
4. **Delivery**: Sends email and closes connection

#### Email Templates

Both edge functions use similar email templates with:
- **HTML Version**: Styled with CSS, includes QR code image
- **Plain Text Version**: Fallback for text-only clients
- **Multipart MIME**: Properly formatted for all email clients

#### Environment Variables

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_EMAIL=noreply@yatra2026.com  # Optional, defaults to EMAIL_USER
```

**Note**: Gmail requires an **App Password** (not regular password) for SMTP authentication.

---

## API Endpoints

### Supabase REST API

All database operations use Supabase's auto-generated REST API:

#### Base URL
```
https://{project-ref}.supabase.co/rest/v1/
```

#### Endpoints Used

1. **Registrations**
   - `POST /rest/v1/registrations` - Create registration
   - `GET /rest/v1/registrations` - Fetch registrations (admin)

2. **Tickets**
   - `POST /rest/v1/tickets` - Create ticket
   - `GET /rest/v1/tickets` - Fetch tickets

3. **Edge Functions**
   - `POST /functions/v1/send-registration-email` - Send confirmation email
   - `POST /functions/v1/issue_tickets_batch` - Batch issue tickets

### Authentication Headers

```http
Authorization: Bearer {anon_key}
apikey: {anon_key}
Content-Type: application/json
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://{project-ref}.supabase.co
VITE_SUPABASE_ANON_KEY={anon_key}
```

### Edge Functions (Supabase Secrets)

Set via Supabase Dashboard → Project Settings → Edge Functions → Secrets

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FROM_EMAIL=noreply@yatra2026.com
SUPABASE_URL=https://{project-ref}.supabase.co
SUPABASE_SERVICE_ROLE_KEY={service_role_key}
```

### Environment Variable Usage

| Variable | Used In | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public API key for client operations |
| `EMAIL_USER` | Edge Functions | Gmail account for SMTP |
| `EMAIL_PASS` | Edge Functions | Gmail app password |
| `FROM_EMAIL` | Edge Functions | Sender email address |
| `SUPABASE_URL` | Edge Functions | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Service role key (bypasses RLS) |

---

## Row Level Security (RLS)

Row Level Security policies control access to database tables at the row level.

### Current RLS Policies

#### `registrations` Table

```sql
-- Allow public insert (for registration form)
CREATE POLICY "Allow public insert" ON registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Allow authenticated read" ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update (for ticket status)
CREATE POLICY "Allow authenticated update" ON registrations
  FOR UPDATE
  TO authenticated
  USING (true);
```

#### `tickets` Table

```sql
-- Allow service role to insert (via edge functions)
-- Edge functions use service_role_key which bypasses RLS

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON tickets
  FOR SELECT
  TO authenticated
  USING (true);
```

### RLS Status

- **Enabled**: Yes (recommended for production)
- **Public Insert**: Allowed (for registration form)
- **Authenticated Read**: Allowed (for admin dashboard)
- **Service Role**: Bypasses RLS (used by edge functions)

---

## Database Functions & RPCs

### RPC Functions

#### `check_is_admin(user_email TEXT)`

**Purpose**: Verifies if a user email has admin privileges.

**Returns**: `BOOLEAN`

**Usage**:
```sql
SELECT check_is_admin('user@example.com');
```

**Implementation** (example):
```sql
CREATE OR REPLACE FUNCTION check_is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check against admin table or hardcoded list
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE email = user_email
  );
END;
$$;
```

**Note**: This function should be created in your Supabase database. The current implementation uses a hardcoded master admin email in the frontend as a fallback.

---

## Data Flow Diagrams

### Registration Flow

```
User fills form
    ↓
Frontend validates
    ↓
Insert into registrations table
    ↓
Call send-registration-email edge function
    ↓
Generate ticket (6-digit code + QR)
    ↓
Insert into tickets table
    ↓
Update registrations.ticket_generated = true
    ↓
Send confirmation email with QR code
    ↓
Update registrations.ticket_email_sent = true
```

### Admin Batch Ticket Issuance Flow

```
Admin selects registrations
    ↓
Call issue_tickets_batch edge function
    ↓
For each registration:
    ├─ Check if ticket exists (idempotency)
    ├─ Generate unique 6-digit code
    ├─ Create ticket UUID
    ├─ Generate QR code
    ├─ Insert ticket
    ├─ Send email
    └─ Update registration status
    ↓
Return summary (issued, skipped, failed)
```

---

## Security Considerations

### Current Security Measures

1. **RLS Policies**: Enforce access control at database level
2. **Email Uniqueness**: Prevents duplicate registrations
3. **Service Role Key**: Only used in edge functions (server-side)
4. **Anon Key**: Public key, but RLS restricts operations
5. **OAuth Authentication**: Secure admin access via Google

### Recommendations for Production

1. **Rate Limiting**: Add rate limiting to registration endpoint
2. **Email Verification**: Require email verification before ticket generation
3. **CAPTCHA**: Add CAPTCHA to registration form
4. **Audit Logging**: Log all admin actions
5. **Backup Strategy**: Regular database backups
6. **Monitoring**: Set up error monitoring and alerts
7. **HTTPS**: Ensure all API calls use HTTPS
8. **Input Sanitization**: Validate and sanitize all inputs

---

## Troubleshooting

### Common Issues

#### 1. Email Not Sending

**Symptoms**: Registration succeeds but no email received

**Solutions**:
- Check `EMAIL_USER` and `EMAIL_PASS` are set in Supabase secrets
- Verify Gmail app password is correct
- Check edge function logs in Supabase dashboard
- Ensure FROM_EMAIL is valid

#### 2. Ticket Generation Fails

**Symptoms**: Email sent but no ticket generated

**Solutions**:
- Check `tickets` table exists
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check edge function logs for errors
- Verify registration_id foreign key constraint

#### 3. Duplicate Email Error

**Symptoms**: "duplicate key value violates unique constraint"

**Solutions**:
- This is expected behavior - email must be unique
- User should use a different email or check if already registered

#### 4. RLS Policy Errors

**Symptoms**: "new row violates row-level security policy"

**Solutions**:
- Verify RLS policies are created correctly
- Check user role (anon vs authenticated)
- Ensure service role key is used in edge functions

---

## Database Migrations

### Creating Migrations

Migrations should be created in Supabase Dashboard → SQL Editor or via Supabase CLI.

### Example Migration

```sql
-- Migration: Add ticket tracking fields to registrations
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS ticket_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_sent_at TIMESTAMPTZ;
```

---

## API Rate Limits

Supabase free tier limits:
- **API Requests**: 50,000/month
- **Database Size**: 500 MB
- **Edge Function Invocations**: 500,000/month
- **Email**: Not included (uses external SMTP)

---

## Backup & Recovery

### Backup Strategy

1. **Supabase Dashboard**: Manual backups via dashboard
2. **pg_dump**: Use Supabase CLI for automated backups
3. **Point-in-Time Recovery**: Available on paid plans

### Recovery Process

1. Restore from backup via Supabase dashboard
2. Verify data integrity
3. Test edge functions
4. Notify users if necessary

---

## Monitoring & Logging

### Available Logs

1. **Edge Function Logs**: Supabase Dashboard → Edge Functions → Logs
2. **Database Logs**: Supabase Dashboard → Logs → Postgres Logs
3. **API Logs**: Supabase Dashboard → Logs → API Logs

### Key Metrics to Monitor

- Registration success rate
- Email delivery rate
- Ticket generation success rate
- Edge function execution time
- Database query performance
- Error rates

---

## Future Enhancements

### Planned Features

1. **Email Verification**: Require email verification before ticket generation
2. **Ticket Validation API**: Endpoint to validate tickets at entry
3. **Admin Dashboard Enhancements**: Export data, advanced filtering
4. **Analytics**: Registration analytics and reporting
5. **SMS Notifications**: Send SMS along with email
6. **Payment Integration**: Online payment processing
7. **Multi-event Support**: Support for multiple events

---

## Support & Resources

### Documentation Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Deno Documentation](https://deno.land/docs)

### Contact

For backend-related issues or questions, refer to the project maintainers.

---

**Last Updated**: 2026
**Version**: 1.0.0
