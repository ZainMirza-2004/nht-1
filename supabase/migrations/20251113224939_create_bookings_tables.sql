/*
  # Create NH&T Estates Booking System Tables

  1. New Tables
    - `spa_bookings`
      - `id` (uuid, primary key) - Unique booking identifier
      - `full_name` (text) - Customer's full name
      - `email` (text) - Customer's email address
      - `phone` (text) - Customer's phone number
      - `booking_date` (date) - Date of the booking
      - `time_slot` (text) - Time slot (e.g., "10:00 AM")
      - `package_type` (text) - Selected package (1 hour, 1.5 hours, 2 hours)
      - `package_price` (integer) - Price in pounds
      - `created_at` (timestamptz) - When booking was created
      
    - `cinema_bookings`
      - `id` (uuid, primary key) - Unique booking identifier
      - `full_name` (text) - Customer's full name
      - `email` (text) - Customer's email address
      - `phone` (text) - Customer's phone number
      - `booking_date` (date) - Date of the booking
      - `time_slot` (text) - Time slot (e.g., "10:00 AM")
      - `package_type` (text) - Selected package
      - `package_price` (integer) - Price in pounds
      - `created_at` (timestamptz) - When booking was created
      
    - `featured_properties`
      - `id` (uuid, primary key) - Unique property identifier
      - `title` (text) - Property name
      - `description` (text) - Property description
      - `image_url` (text) - Property image URL
      - `airbnb_url` (text) - External Airbnb listing URL
      - `location` (text) - Property location
      - `price_per_night` (integer) - Price per night in pounds
      - `bedrooms` (integer) - Number of bedrooms
      - `created_at` (timestamptz) - When property was added
      
  2. Security
    - Enable RLS on all tables
    - Allow public read access for featured_properties
    - Allow public insert access for bookings (no auth required for customers)
    - Restrict updates and deletes to authenticated admin users only
*/

CREATE TABLE IF NOT EXISTS spa_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  package_type text NOT NULL,
  package_price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cinema_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  package_type text NOT NULL,
  package_price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS featured_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  airbnb_url text NOT NULL,
  location text NOT NULL,
  price_per_night integer NOT NULL,
  bedrooms integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE spa_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinema_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view featured properties"
  ON featured_properties
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create spa bookings"
  ON spa_bookings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view spa bookings for availability check"
  ON spa_bookings
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create cinema bookings"
  ON cinema_bookings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view cinema bookings for availability check"
  ON cinema_bookings
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS spa_bookings_date_time_idx ON spa_bookings(booking_date, time_slot);
CREATE INDEX IF NOT EXISTS cinema_bookings_date_time_idx ON cinema_bookings(booking_date, time_slot);