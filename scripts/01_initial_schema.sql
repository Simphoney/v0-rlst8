-- RLST8 Platform Database Schema
-- Initial setup for multitenant real estate management system

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
  is_active BOOLEAN DEFAULT true,
  vacation_notice_date DATE,
  minimum_notice_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Co-tenancy support
CREATE TABLE co_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id),
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  payment_type VARCHAR(50) NOT NULL, -- 'rent', 'deposit', 'penalty', etc.
  payment_method VARCHAR(50) DEFAULT 'mpesa',
  transaction_reference VARCHAR(100),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  months_paid INTEGER DEFAULT 1,
  is_partial BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance providers
CREATE TABLE maintenance_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  categories maintenance_category[] NOT NULL,
  is_isp BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  requester_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES maintenance_providers(id),
  category maintenance_category NOT NULL,
  description TEXT NOT NULL,
  preferred_dates TIMESTAMP WITH TIME ZONE[] NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  cost DECIMAL(12,2),
  cost_responsibility VARCHAR(50) DEFAULT 'landlord', -- 'landlord', 'tenant', 'joint'
  status VARCHAR(50) DEFAULT 'pending',
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
  unit_to_visit UUID REFERENCES units(id),
  vehicle_registration VARCHAR(20),
  vehicle_make_model VARCHAR(100),
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  parking_slot VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parking slots
CREATE TABLE parking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  slot_number VARCHAR(50) NOT NULL,
  slot_type VARCHAR(20) DEFAULT 'general', -- 'unit', 'visitor', 'general'
  assigned_unit_id UUID REFERENCES units(id),
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, slot_number)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX idx_units_tenant_id ON units(tenant_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_tenancies_tenant_id ON tenancies(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX idx_visitor_logs_tenant_id ON visitor_logs(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);

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
