-- RLST8 Database Setup Script
-- Run this in your Supabase SQL Editor
-- Connection: https://cexecmlvjvhpeamdiopq.supabase.co

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for better data integrity
CREATE TYPE entity_type AS ENUM ('natural_person', 'legal_entity');
CREATE TYPE legal_entity_type AS ENUM (
  'company_private_limited',
  'company_public_limited', 
  'cooperative_society',
  'foreign_company',
  'limited_liability_partnership',
  'non_governmental_organization',
  'partnership',
  'sole_proprietorship',
  'trust'
);

CREATE TYPE property_type AS ENUM (
  'apartment',
  'bungalow', 
  'commercial_building',
  'duplex',
  'hostel',
  'maisonette',
  'mixed_use_building',
  'office',
  'shop',
  'studio',
  'townhouse',
  'warehouse'
);

CREATE TYPE currency_type AS ENUM ('KES', 'TZS', 'UGX', 'USD');

CREATE TYPE user_role AS ENUM (
  'company_admin',
  'agent',
  'landlord', 
  'tenant',
  'maintenance_provider',
  'security_guard',
  'caretaker'
);

CREATE TYPE unit_status AS ENUM ('vacant', 'occupied', 'on_notice', 'under_maintenance');

CREATE TYPE deposit_type AS ENUM (
  'cleaning',
  'damage',
  'electricity', 
  'garbage',
  'key',
  'parking',
  'security',
  'water',
  'other'
);

CREATE TYPE maintenance_category AS ENUM (
  'air_conditioning',
  'cctv',
  'cleaning',
  'electrical',
  'elevator', 
  'gardening',
  'generator',
  'garbage_collection',
  'internet_isp',
  'painting',
  'pest_control',
  'plumbing',
  'pool',
  'roof',
  'security_system',
  'water_supply',
  'window_glass'
);

-- Core tenant table for multitenancy
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  entity_type entity_type NOT NULL,
  legal_entity_type legal_entity_type,
  registration_number VARCHAR(100),
  kra_pin VARCHAR(20),
  contact_person_name VARCHAR(255),
  contact_person_id VARCHAR(50),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  physical_address TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with tenant isolation
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE, -- Links to Supabase auth.users
  entity_type entity_type NOT NULL,
  legal_entity_type legal_entity_type,
  full_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(50),
  passport_number VARCHAR(50),
  date_of_birth DATE,
  kra_pin VARCHAR(20),
  occupation VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  residential_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Counties reference table
CREATE TABLE counties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL
);

-- Subcounties reference table  
CREATE TABLE subcounties (
  id SERIAL PRIMARY KEY,
  county_id INTEGER REFERENCES counties(id),
  name VARCHAR(100) NOT NULL
);

-- Insert counties data with custom ordering (first 8, then alphabetical)
INSERT INTO counties (name, sort_order) VALUES
-- First 8 counties in specified order
('Nairobi', 1),
('Kiambu', 2),
('Kajiado', 3),
('Machakos', 4),
('Mombasa', 5),
('Kisumu', 6),
('Nakuru', 7),
('Uasin Gishu', 8),
-- Remaining counties alphabetically
('Baringo', 9),
('Bomet', 10),
('Bungoma', 11),
('Busia', 12),
('Elgeyo Marakwet', 13),
('Embu', 14),
('Garissa', 15),
('Homa Bay', 16),
('Isiolo', 17),
('Kakamega', 18),
('Kericho', 19),
('Kirinyaga', 20),
('Kisii', 21),
('Kitui', 22),
('Kwale', 23),
('Laikipia', 24),
('Lamu', 25),
('Mandera', 26),
('Marsabit', 27),
('Meru', 28),
('Migori', 29),
('Makueni', 30),
('Muranga', 31),
('Narok', 32),
('Nandi', 33),
('Nyamira', 34),
('Nyandarua', 35),
('Nyeri', 36),
('Samburu', 37),
('Siaya', 38),
('Taita Taveta', 39),
('Tana River', 40),
('Tharaka Nithi', 41),
('Trans Nzoia', 42),
('Turkana', 43),
('Vihiga', 44),
('Wajir', 45),
('West Pokot', 46);

-- Sample subcounties for major counties
INSERT INTO subcounties (county_id, name) VALUES
-- Nairobi subcounties
(1, 'Westlands'),
(1, 'Dagoretti North'),
(1, 'Dagoretti South'),
(1, 'Langata'),
(1, 'Kibra'),
(1, 'Roysambu'),
(1, 'Kasarani'),
(1, 'Ruaraka'),
(1, 'Embakasi South'),
(1, 'Embakasi North'),
(1, 'Embakasi Central'),
(1, 'Embakasi East'),
(1, 'Embakasi West'),
(1, 'Makadara'),
(1, 'Kamukunji'),
(1, 'Starehe'),
(1, 'Mathare'),

-- Kiambu subcounties
(2, 'Thika Town'),
(2, 'Ruiru'),
(2, 'Juja'),
(2, 'Gatundu South'),
(2, 'Gatundu North'),
(2, 'Githunguri'),
(2, 'Kiambu'),
(2, 'Kiambaa'),
(2, 'Kabete'),
(2, 'Kikuyu'),
(2, 'Limuru'),
(2, 'Lari'),

-- Mombasa subcounties
(5, 'Changamwe'),
(5, 'Jomba'),
(5, 'Kisauni'),
(5, 'Nyali'),
(5, 'Likoni'),
(5, 'Mvita');

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  property_type property_type NOT NULL,
  registration_number VARCHAR(100),
  county_id INTEGER REFERENCES counties(id),
  subcounty_id INTEGER REFERENCES subcounties(id),
  region_area VARCHAR(255),
  landmark VARCHAR(255),
  google_pin_url TEXT,
  full_address TEXT NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  rent_due_day INTEGER CHECK (rent_due_day >= 1 AND rent_due_day <= 28) DEFAULT 1,
  mpesa_paybill VARCHAR(20),
  mpesa_till VARCHAR(20),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unit types for properties
CREATE TABLE unit_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  rent_deposit_months INTEGER DEFAULT 1,
  number_of_units INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  status unit_status DEFAULT 'vacant',
  parking_slot VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX idx_units_tenant_id ON units(tenant_id);
CREATE INDEX idx_units_property_id ON units(property_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test tenant for verification
INSERT INTO tenants (name, entity_type, phone, email) VALUES 
('Test Agency', 'legal_entity', '+254700000000', 'test@rlst8.com');

-- Success message
SELECT 'RLST8 Database setup completed successfully!' as status;
