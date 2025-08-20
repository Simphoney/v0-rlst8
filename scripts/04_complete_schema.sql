-- RLST8 Complete Database Schema
-- Full implementation based on specification document

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean rebuild)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS visitor_logs CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS maintenance_providers CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS co_tenants CASCADE;
DROP TABLE IF EXISTS tenancies CASCADE;
DROP TABLE IF EXISTS unit_deposits CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS unit_types CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS subcounties CASCADE;
DROP TABLE IF EXISTS counties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS maintenance_category CASCADE;
DROP TYPE IF EXISTS deposit_type CASCADE;
DROP TYPE IF EXISTS unit_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS currency_type CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS legal_entity_type CASCADE;
DROP TYPE IF EXISTS entity_type CASCADE;

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

CREATE TYPE maintenance_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE tenancy_status AS ENUM ('active', 'terminated', 'on_notice');

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
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
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
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
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
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(100),
  description TEXT,
  amenities TEXT[],
  total_units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
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
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  square_feet INTEGER,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  floor_number INTEGER,
  status unit_status DEFAULT 'vacant',
  parking_slot VARCHAR(50),
  monthly_rent DECIMAL(12,2),
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- Deposits configuration per unit type
CREATE TABLE unit_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE CASCADE,
  deposit_type deposit_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  other_description VARCHAR(255), -- For 'other' deposit type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenancy records
CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  tenant_user_id UUID REFERENCES users(id),
  lease_start_date DATE NOT NULL,
  lease_end_date DATE,
  monthly_rent DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  status tenancy_status DEFAULT 'active',
  vacation_notice_date DATE,
  minimum_notice_days INTEGER DEFAULT 30,
  deposit_paid DECIMAL(12,2) DEFAULT 0,
  deposit_refunded DECIMAL(12,2) DEFAULT 0,
  lease_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Co-tenancy support
CREATE TABLE co_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  relationship VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id),
  payer_user_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  payment_type VARCHAR(50) NOT NULL, -- 'rent', 'deposit', 'penalty', 'maintenance', etc.
  payment_method VARCHAR(50) DEFAULT 'mpesa',
  transaction_reference VARCHAR(100),
  mpesa_receipt_number VARCHAR(50),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  months_paid INTEGER DEFAULT 1,
  is_partial BOOLEAN DEFAULT false,
  status payment_status DEFAULT 'completed',
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance providers
CREATE TABLE maintenance_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  company_name VARCHAR(255),
  categories maintenance_category[] NOT NULL,
  hourly_rate DECIMAL(10,2),
  is_isp BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  property_id UUID REFERENCES properties(id),
  requester_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES maintenance_providers(id),
  category maintenance_category NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  preferred_dates TIMESTAMP WITH TIME ZONE[] NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  cost_responsibility VARCHAR(50) DEFAULT 'landlord', -- 'landlord', 'tenant', 'joint'
  status maintenance_status DEFAULT 'pending',
  before_images TEXT[],
  after_images TEXT[],
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visitor logs for security
CREATE TABLE visitor_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  guard_id UUID REFERENCES users(id),
  visitor_name VARCHAR(255) NOT NULL,
  visitor_id_number VARCHAR(50) NOT NULL,
  visitor_phone VARCHAR(20),
  visitor_company VARCHAR(255),
  unit_to_visit UUID REFERENCES units(id),
  host_name VARCHAR(255),
  purpose_of_visit TEXT,
  vehicle_registration VARCHAR(20),
  vehicle_make_model VARCHAR(100),
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  parking_slot VARCHAR(50),
  visitor_photo_url TEXT,
  id_photo_url TEXT,
  is_approved BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parking slots
CREATE TABLE parking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  slot_number VARCHAR(50) NOT NULL,
  slot_type VARCHAR(20) DEFAULT 'general', -- 'unit', 'visitor', 'general', 'reserved'
  assigned_unit_id UUID REFERENCES units(id),
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  is_occupied BOOLEAN DEFAULT false,
  current_vehicle_reg VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, slot_number)
);

-- Document templates and generation
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'lease_agreement', 'rent_receipt', 'notice', etc.
  template_content TEXT NOT NULL,
  variables JSONB, -- Template variables and their types
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated documents
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id),
  related_entity_type VARCHAR(50), -- 'tenancy', 'payment', 'maintenance', etc.
  related_entity_id UUID,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'payment_due', 'maintenance', 'visitor', etc.
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for all actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert counties data
INSERT INTO counties (name, sort_order) VALUES
('Nairobi', 1), ('Kiambu', 2), ('Kajiado', 3), ('Machakos', 4),
('Mombasa', 5), ('Kisumu', 6), ('Nakuru', 7), ('Uasin Gishu', 8),
('Baringo', 9), ('Bomet', 10), ('Bungoma', 11), ('Busia', 12),
('Elgeyo Marakwet', 13), ('Embu', 14), ('Garissa', 15), ('Homa Bay', 16),
('Isiolo', 17), ('Kakamega', 18), ('Kericho', 19), ('Kirinyaga', 20),
('Kisii', 21), ('Kitui', 22), ('Kwale', 23), ('Laikipia', 24),
('Lamu', 25), ('Mandera', 26), ('Marsabit', 27), ('Meru', 28),
('Migori', 29), ('Makueni', 30), ('Muranga', 31), ('Narok', 32),
('Nandi', 33), ('Nyamira', 34), ('Nyandarua', 35), ('Nyeri', 36),
('Samburu', 37), ('Siaya', 38), ('Taita Taveta', 39), ('Tana River', 40),
('Tharaka Nithi', 41), ('Trans Nzoia', 42), ('Turkana', 43), ('Vihiga', 44),
('Wajir', 45), ('West Pokot', 46);

-- Insert sample subcounties
INSERT INTO subcounties (county_id, name) VALUES
(1, 'Westlands'), (1, 'Dagoretti North'), (1, 'Dagoretti South'), (1, 'Langata'),
(1, 'Kibra'), (1, 'Roysambu'), (1, 'Kasarani'), (1, 'Ruaraka'),
(1, 'Embakasi South'), (1, 'Embakasi North'), (1, 'Embakasi Central'),
(1, 'Embakasi East'), (1, 'Embakasi West'), (1, 'Makadara'),
(1, 'Kamukunji'), (1, 'Starehe'), (1, 'Mathare'),
(2, 'Thika Town'), (2, 'Ruiru'), (2, 'Juja'), (2, 'Gatundu South'),
(2, 'Gatundu North'), (2, 'Githunguri'), (2, 'Kiambu'), (2, 'Kiambaa'),
(2, 'Kabete'), (2, 'Kikuyu'), (2, 'Limuru'), (2, 'Lari'),
(5, 'Changamwe'), (5, 'Jomba'), (5, 'Kisauni'), (5, 'Nyali'),
(5, 'Likoni'), (5, 'Mvita');

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_units_tenant_id ON units(tenant_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_tenancies_tenant_id ON tenancies(tenant_id);
CREATE INDEX idx_tenancies_status ON tenancies(status);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_tenancy_id ON payments(tenancy_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_visitor_logs_tenant_id ON visitor_logs(tenant_id);
CREATE INDEX idx_visitor_logs_property_id ON visitor_logs(property_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

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
CREATE TRIGGER update_tenancies_updated_at BEFORE UPDATE ON tenancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO tenants (name, entity_type, phone, email, contact_person_name) VALUES 
('RLST8 Demo Agency', 'legal_entity', '+254700000000', 'demo@rlst8.com', 'John Demo');

-- Success message
SELECT 'RLST8 Complete Database Schema Created Successfully!' as status,
       'Tables: ' || count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
