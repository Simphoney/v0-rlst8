-- RLST8 Complete Multitenant Real Estate Management System
-- Comprehensive Database Schema for East African Market
-- Implements full specification with strict tenant isolation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean rebuild)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS document_shares CASCADE;
DROP TABLE IF EXISTS generated_documents CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS parking_assignments CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS visitor_logs CASCADE;
DROP TABLE IF EXISTS maintenance_progress CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS maintenance_providers CASCADE;
DROP TABLE IF EXISTS penalty_waivers CASCADE;
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS co_tenants CASCADE;
DROP TABLE IF EXISTS tenancies CASCADE;
DROP TABLE IF EXISTS unit_deposits CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS unit_types CASCADE;
DROP TABLE IF EXISTS property_media CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS subcounties CASCADE;
DROP TABLE IF EXISTS counties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS maintenance_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS tenancy_status CASCADE;
DROP TYPE IF EXISTS visitor_status CASCADE;
DROP TYPE IF EXISTS alert_type CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS maintenance_category CASCADE;
DROP TYPE IF EXISTS deposit_type CASCADE;
DROP TYPE IF EXISTS unit_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS currency_type CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS legal_entity_type CASCADE;
DROP TYPE IF EXISTS entity_type CASCADE;

-- Create comprehensive enum types
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
CREATE TYPE visitor_status AS ENUM ('entered', 'exited');
CREATE TYPE alert_type AS ENUM ('security', 'maintenance', 'payment', 'general');
CREATE TYPE document_type AS ENUM ('lease_agreement', 'sale_agreement', 'maintenance_order', 'receipt', 'notice');
CREATE TYPE notification_type AS ENUM ('payment_due', 'maintenance', 'visitor', 'alert', 'document');

-- Core tenant table for multitenancy
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  entity_type entity_type NOT NULL,
  legal_entity_type legal_entity_type,
  registration_number VARCHAR(100),
  incorporation_date DATE,
  kra_pin VARCHAR(20),
  vat_number VARCHAR(20),
  contact_person_name VARCHAR(255),
  contact_person_id VARCHAR(50),
  contact_person_phone VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  physical_address TEXT,
  postal_address TEXT,
  website VARCHAR(255),
  business_description TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  payment_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with comprehensive KYC fields
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE, -- Links to Supabase auth.users
  entity_type entity_type NOT NULL,
  legal_entity_type legal_entity_type,
  
  -- Natural Person Fields
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  national_id VARCHAR(50),
  passport_number VARCHAR(50),
  date_of_birth DATE,
  occupation VARCHAR(100),
  
  -- Legal Entity Fields
  registered_name VARCHAR(255),
  business_registration_number VARCHAR(100),
  incorporation_date DATE,
  
  -- Common Fields
  kra_pin VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  residential_address TEXT,
  postal_address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  
  -- Document URLs
  profile_image_url TEXT,
  id_document_url TEXT,
  passport_photo_url TEXT,
  certificate_incorporation_url TEXT,
  additional_documents_urls TEXT[],
  
  -- Status and Metadata
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Counties with custom ordering (first 8, then alphabetical)
CREATE TABLE counties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  is_priority BOOLEAN DEFAULT false
);

-- Subcounties populated by county
CREATE TABLE subcounties (
  id SERIAL PRIMARY KEY,
  county_id INTEGER REFERENCES counties(id),
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Properties with comprehensive fields
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES users(id),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  property_type property_type NOT NULL,
  registration_number VARCHAR(100),
  title_deed_url TEXT,
  
  -- Location
  county_id INTEGER REFERENCES counties(id),
  subcounty_id INTEGER REFERENCES subcounties(id),
  region_area VARCHAR(255),
  closest_landmark VARCHAR(255),
  google_pin_url TEXT,
  full_address TEXT NOT NULL,
  postal_address TEXT,
  
  -- Financial Settings
  currency currency_type NOT NULL DEFAULT 'KES',
  rent_due_day INTEGER CHECK (rent_due_day >= 1 AND rent_due_day <= 28) DEFAULT 1,
  
  -- Payment Integration
  mpesa_paybill VARCHAR(20),
  mpesa_till VARCHAR(20),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(100),
  bank_branch VARCHAR(100),
  
  -- Property Details
  description TEXT,
  amenities TEXT[],
  total_units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  parking_slots INTEGER DEFAULT 0,
  
  -- Media
  primary_image_url TEXT,
  images_urls TEXT[],
  videos_urls TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unit types with flexible configuration
CREATE TABLE unit_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  rent_deposit_months INTEGER DEFAULT 1,
  number_of_units INTEGER NOT NULL DEFAULT 1,
  
  -- Unit Specifications
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  square_feet INTEGER,
  floor_range VARCHAR(50), -- e.g., "1-3", "Ground", "All"
  
  -- Features
  amenities TEXT[],
  description TEXT,
  
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
  
  -- Override pricing if different from unit type
  monthly_rent DECIMAL(12,2),
  currency currency_type,
  
  -- Assignments
  assigned_parking_slots TEXT[],
  
  -- Maintenance
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  
  -- Media
  images_urls TEXT[],
  videos_urls TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- Flexible deposit system per unit type
CREATE TABLE unit_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE CASCADE,
  
  deposit_type deposit_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  other_description VARCHAR(255), -- For 'other' deposit type
  is_refundable BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenancy records with co-tenant support
CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  primary_tenant_id UUID REFERENCES users(id),
  
  -- Lease Details
  lease_start_date DATE NOT NULL,
  lease_end_date DATE,
  monthly_rent DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  
  -- Status and Notices
  status tenancy_status DEFAULT 'active',
  vacation_notice_date DATE,
  minimum_notice_days INTEGER DEFAULT 30,
  actual_move_out_date DATE,
  
  -- Financial
  total_deposit_paid DECIMAL(12,2) DEFAULT 0,
  deposit_refunded DECIMAL(12,2) DEFAULT 0,
  
  -- Documents
  lease_document_url TEXT,
  signed_lease_url TEXT,
  
  -- Payment Settings
  advance_months_paid INTEGER DEFAULT 1,
  payment_day INTEGER, -- Override property default if needed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Co-tenancy support
CREATE TABLE co_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  relationship VARCHAR(100), -- spouse, business_partner, etc.
  responsibility_percentage DECIMAL(5,2) DEFAULT 50.00,
  is_primary_contact BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive payment system
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id),
  payer_user_id UUID REFERENCES users(id),
  
  -- Payment Details
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'KES',
  payment_type VARCHAR(50) NOT NULL, -- 'rent', 'deposit', 'penalty', 'maintenance', etc.
  
  -- Payment Method and Integration
  payment_method VARCHAR(50) DEFAULT 'mpesa',
  mpesa_paybill VARCHAR(20),
  mpesa_till VARCHAR(20),
  transaction_reference VARCHAR(100),
  mpesa_receipt_number VARCHAR(50),
  
  -- Timing
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  months_covered INTEGER DEFAULT 1,
  period_start DATE,
  period_end DATE,
  
  -- Status and Flags
  is_partial BOOLEAN DEFAULT false,
  is_advance BOOLEAN DEFAULT false,
  status payment_status DEFAULT 'completed',
  
  -- Additional Info
  notes TEXT,
  receipt_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment receipts (auto-generated)
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_url TEXT NOT NULL,
  
  -- Sharing
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_whatsapp BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Penalty and waiver system
CREATE TABLE penalty_waivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id),
  tenancy_id UUID REFERENCES tenancies(id),
  
  penalty_amount DECIMAL(12,2) NOT NULL,
  penalty_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  penalty_rate DECIMAL(5,2), -- For percentage penalties
  
  -- Waiver Request
  waiver_requested_by UUID REFERENCES users(id),
  waiver_reason TEXT,
  waiver_requested_at TIMESTAMP WITH TIME ZONE,
  
  -- Approval
  waiver_approved_by UUID REFERENCES users(id),
  waiver_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  waiver_decision_at TIMESTAMP WITH TIME ZONE,
  waiver_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance providers
CREATE TABLE maintenance_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  company_name VARCHAR(255),
  categories maintenance_category[] NOT NULL,
  specialization TEXT,
  
  -- Pricing
  hourly_rate DECIMAL(10,2),
  call_out_fee DECIMAL(10,2),
  currency currency_type DEFAULT 'KES',
  
  -- ISP Specific
  is_isp BOOLEAN DEFAULT false,
  internet_packages JSONB, -- For ISP providers
  
  -- Performance
  rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  
  -- Contact and Availability
  response_time_hours INTEGER DEFAULT 24,
  available_days TEXT[], -- ['monday', 'tuesday', etc.]
  available_hours VARCHAR(50), -- '8:00-17:00'
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance requests with full workflow
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  property_id UUID REFERENCES properties(id),
  requester_id UUID REFERENCES users(id),
  assigned_provider_id UUID REFERENCES maintenance_providers(id),
  
  -- Request Details
  category maintenance_category NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Scheduling
  preferred_dates TIMESTAMP WITH TIME ZONE[] NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Progress and Completion
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status maintenance_status DEFAULT 'pending',
  
  -- Financial
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  cost_responsibility VARCHAR(50) DEFAULT 'landlord', -- 'landlord', 'tenant', 'joint'
  tenant_responsibility_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Media and Documentation
  before_images TEXT[],
  after_images TEXT[],
  videos TEXT[],
  documents TEXT[],
  
  -- Feedback
  tenant_rating INTEGER CHECK (tenant_rating >= 1 AND tenant_rating <= 5),
  tenant_feedback TEXT,
  provider_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily maintenance progress tracking
CREATE TABLE maintenance_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES maintenance_providers(id),
  
  date DATE NOT NULL,
  percentage_completed INTEGER NOT NULL CHECK (percentage_completed >= 0 AND percentage_completed <= 100),
  work_description TEXT,
  hours_worked DECIMAL(4,2),
  materials_used TEXT,
  
  -- Media
  progress_images TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visitor and security management
CREATE TABLE visitor_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  guard_id UUID REFERENCES users(id),
  
  -- Visitor Information
  visitor_name VARCHAR(255) NOT NULL,
  visitor_id_number VARCHAR(50) NOT NULL,
  visitor_phone VARCHAR(20),
  visitor_company VARCHAR(255),
  
  -- Visit Details
  unit_to_visit UUID REFERENCES units(id),
  host_name VARCHAR(255),
  purpose_of_visit TEXT,
  
  -- Vehicle Information
  vehicle_registration VARCHAR(20),
  vehicle_make_model VARCHAR(100),
  vehicle_color VARCHAR(50),
  
  -- Timing (immutable after creation)
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  status visitor_status DEFAULT 'entered',
  
  -- Parking
  assigned_parking_slot VARCHAR(50),
  
  -- Media and Security
  visitor_photo_url TEXT,
  id_photo_url TEXT,
  
  -- Approval and Notes
  is_pre_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  guard_notes TEXT,
  
  -- Immutable flag (cannot be edited after save)
  is_locked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parking slot management
CREATE TABLE parking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  slot_number VARCHAR(50) NOT NULL,
  slot_type VARCHAR(20) DEFAULT 'general', -- 'unit', 'visitor', 'general', 'reserved', 'disabled'
  location_description TEXT, -- 'Ground floor, near entrance'
  
  -- Assignment
  assigned_unit_id UUID REFERENCES units(id),
  assigned_tenant_id UUID REFERENCES users(id),
  
  -- Pricing
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  currency currency_type DEFAULT 'KES',
  
  -- Status
  is_occupied BOOLEAN DEFAULT false,
  current_vehicle_reg VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, slot_number)
);

-- Parking assignments for visitors and temporary use
CREATE TABLE parking_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  parking_slot_id UUID REFERENCES parking_slots(id),
  visitor_log_id UUID REFERENCES visitor_logs(id),
  
  vehicle_registration VARCHAR(20) NOT NULL,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT
);

-- Security alerts and notifications
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  
  alert_type alert_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Source
  reported_by UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  
  -- Response
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Recipients (units to notify)
  notify_all_units BOOLEAN DEFAULT false,
  notify_specific_units UUID[],
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document templates and generation
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  document_type document_type NOT NULL,
  template_content TEXT NOT NULL,
  
  -- Template Variables
  variables JSONB, -- Template variables and their types
  auto_select_conditions JSONB, -- Conditions for auto-selection
  
  -- Customization
  is_default BOOLEAN DEFAULT false,
  applies_to_property_types property_type[],
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated documents
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id),
  
  -- Context
  related_entity_type VARCHAR(50), -- 'tenancy', 'payment', 'maintenance', etc.
  related_entity_id UUID,
  
  -- Document Details
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  document_type document_type NOT NULL,
  
  -- Generation
  generated_by UUID REFERENCES users(id),
  variables_used JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document sharing and access
CREATE TABLE document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES generated_documents(id),
  
  shared_with_user_id UUID REFERENCES users(id),
  shared_by UUID REFERENCES users(id),
  
  -- Sharing Method
  shared_via_email BOOLEAN DEFAULT false,
  shared_via_whatsapp BOOLEAN DEFAULT false,
  
  -- Access Control
  can_view BOOLEAN DEFAULT true,
  can_download BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive notification system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  
  -- Context
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- Delivery
  sent_via_app BOOLEAN DEFAULT true,
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_whatsapp BOOLEAN DEFAULT false,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  -- Change Details
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert counties with custom ordering (first 8, then alphabetical)
INSERT INTO counties (name, sort_order, is_priority) VALUES
-- Priority counties (first 8 in specified order)
('Nairobi', 1, true),
('Kiambu', 2, true),
('Kajiado', 3, true),
('Machakos', 4, true),
('Mombasa', 5, true),
('Kisumu', 6, true),
('Nakuru', 7, true),
('Uasin Gishu', 8, true),
-- Remaining counties alphabetically
('Baringo', 9, false),
('Bomet', 10, false),
('Bungoma', 11, false),
('Busia', 12, false),
('Elgeyo Marakwet', 13, false),
('Embu', 14, false),
('Garissa', 15, false),
('Homa Bay', 16, false),
('Isiolo', 17, false),
('Kakamega', 18, false),
('Kericho', 19, false),
('Kirinyaga', 20, false),
('Kisii', 21, false),
('Kitui', 22, false),
('Kwale', 23, false),
('Laikipia', 24, false),
('Lamu', 25, false),
('Mandera', 26, false),
('Marsabit', 27, false),
('Meru', 28, false),
('Migori', 29, false),
('Makueni', 30, false),
('Muranga', 31, false),
('Narok', 32, false),
('Nandi', 33, false),
('Nyamira', 34, false),
('Nyandarua', 35, false),
('Nyeri', 36, false),
('Samburu', 37, false),
('Siaya', 38, false),
('Taita Taveta', 39, false),
('Tana River', 40, false),
('Tharaka Nithi', 41, false),
('Trans Nzoia', 42, false),
('Turkana', 43, false),
('Vihiga', 44, false),
('Wajir', 45, false),
('West Pokot', 46, false);

-- Insert comprehensive subcounties
INSERT INTO subcounties (county_id, name, sort_order) VALUES
-- Nairobi subcounties
(1, 'Westlands', 1),
(1, 'Dagoretti North', 2),
(1, 'Dagoretti South', 3),
(1, 'Langata', 4),
(1, 'Kibra', 5),
(1, 'Roysambu', 6),
(1, 'Kasarani', 7),
(1, 'Ruaraka', 8),
(1, 'Embakasi South', 9),
(1, 'Embakasi North', 10),
(1, 'Embakasi Central', 11),
(1, 'Embakasi East', 12),
(1, 'Embakasi West', 13),
(1, 'Makadara', 14),
(1, 'Kamukunji', 15),
(1, 'Starehe', 16),
(1, 'Mathare', 17),

-- Kiambu subcounties
(2, 'Thika Town', 1),
(2, 'Ruiru', 2),
(2, 'Juja', 3),
(2, 'Gatundu South', 4),
(2, 'Gatundu North', 5),
(2, 'Githunguri', 6),
(2, 'Kiambu', 7),
(2, 'Kiambaa', 8),
(2, 'Kabete', 9),
(2, 'Kikuyu', 10),
(2, 'Limuru', 11),
(2, 'Lari', 12),

-- Mombasa subcounties
(5, 'Changamwe', 1),
(5, 'Jomba', 2),
(5, 'Kisauni', 3),
(5, 'Nyali', 4),
(5, 'Likoni', 5),
(5, 'Mvita', 6);

-- Create comprehensive indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_entity_type ON users(entity_type);
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_county_id ON properties(county_id);
CREATE INDEX idx_units_tenant_id ON units(tenant_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_tenancies_tenant_id ON tenancies(tenant_id);
CREATE INDEX idx_tenancies_status ON tenancies(status);
CREATE INDEX idx_tenancies_primary_tenant_id ON tenancies(primary_tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_tenancy_id ON payments(tenancy_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_category ON maintenance_requests(category);
CREATE INDEX idx_visitor_logs_tenant_id ON visitor_logs(tenant_id);
CREATE INDEX idx_visitor_logs_property_id ON visitor_logs(property_id);
CREATE INDEX idx_visitor_logs_entry_time ON visitor_logs(entry_time);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
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
INSERT INTO tenants (name, entity_type, legal_entity_type, phone, email, contact_person_name) VALUES 
('RLST8 Demo Agency', 'legal_entity', 'company_private_limited', '+254700000000', 'demo@rlst8.com', 'John Demo Admin');

-- Success message
SELECT 'RLST8 Complete Multitenant Database Schema Created Successfully!' as status,
       'Tables: ' || count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
