# NH&T Estates - Luxury Coastal Property Management

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase

1. Create a `.env` file in the project root (copy from `.env.example`):
```bash
cp .env.example .env
```

2. Get your Supabase credentials:
   - Go to https://app.supabase.com
   - Select your project (or create a new one)
   - Go to Settings → API
   - Copy your Project URL and anon/public key

3. Update `.env` with your credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Run the database migrations:
   - In Supabase Dashboard, go to SQL Editor
   - Run the migration file: `supabase/migrations/20251113224939_create_bookings_tables.sql`
   - Run the index migration: `supabase/migrations/20251114000000_improve_booking_indexes.sql`

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at http://localhost:5173

## Features

- **Spa Bookings**: Book spa sessions with duration-based slot blocking
- **Cinema Bookings**: Reserve private cinema with overlap prevention
- **Parking Permits**: Request parking permits for properties
- **Property Listings**: Browse featured luxury properties

## Booking System

The booking system includes:
- Full session-duration blocking (blocks all overlapping time slots)
- Global availability (all users see the same availability)
- Time range overlap detection
- Concurrency safety (prevents double bookings)
