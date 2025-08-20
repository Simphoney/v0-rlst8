// RLST8 Comprehensive Dropdown Data
// All exhaustive, alphabetized lists per specification

export const ENTITY_TYPES = [
  { value: "natural_person", label: "Natural Person" },
  { value: "legal_entity", label: "Legal Entity" },
] as const

export const LEGAL_ENTITY_TYPES = [
  { value: "company_private_limited", label: "Company (Private Limited)" },
  { value: "company_public_limited", label: "Company (Public Limited)" },
  { value: "cooperative_society", label: "Cooperative Society" },
  { value: "foreign_company", label: "Foreign Company" },
  { value: "limited_liability_partnership", label: "Limited Liability Partnership (LLP)" },
  { value: "non_governmental_organization", label: "Non-Governmental Organization (NGO)" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "trust", label: "Trust" },
] as const

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "bungalow", label: "Bungalow" },
  { value: "commercial_building", label: "Commercial Building" },
  { value: "duplex", label: "Duplex" },
  { value: "hostel", label: "Hostel" },
  { value: "maisonette", label: "Maisonette" },
  { value: "mixed_use_building", label: "Mixed Use Building" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "studio", label: "Studio" },
  { value: "townhouse", label: "Townhouse" },
  { value: "warehouse", label: "Warehouse" },
] as const

export const CURRENCIES = [
  { value: "KES", label: "KES (Kenyan Shillings)" },
  { value: "TZS", label: "TZS (Tanzanian Shillings)" },
  { value: "UGX", label: "UGX (Ugandan Shillings)" },
  { value: "USD", label: "USD (US Dollars)" },
] as const

export const USER_ROLES = [
  { value: "company_admin", label: "Company Admin" },
  { value: "agent", label: "Agent" },
  { value: "landlord", label: "Landlord" },
  { value: "tenant", label: "Tenant" },
  { value: "maintenance_provider", label: "Maintenance Provider" },
  { value: "security_guard", label: "Security Guard" },
  { value: "caretaker", label: "Caretaker" },
] as const

export const DEPOSIT_TYPES = [
  { value: "cleaning", label: "Cleaning" },
  { value: "damage", label: "Damage" },
  { value: "electricity", label: "Electricity" },
  { value: "garbage", label: "Garbage" },
  { value: "key", label: "Key" },
  { value: "parking", label: "Parking" },
  { value: "security", label: "Security" },
  { value: "water", label: "Water" },
  { value: "other", label: "Other (Specify)" },
] as const

export const MAINTENANCE_CATEGORIES = [
  { value: "air_conditioning", label: "Air Conditioning" },
  { value: "cctv", label: "CCTV" },
  { value: "cleaning", label: "Cleaning" },
  { value: "electrical", label: "Electrical" },
  { value: "elevator", label: "Elevator" },
  { value: "gardening", label: "Gardening" },
  { value: "generator", label: "Generator" },
  { value: "garbage_collection", label: "Garbage Collection" },
  { value: "internet_isp", label: "Internet/ISP" },
  { value: "painting", label: "Painting" },
  { value: "pest_control", label: "Pest Control" },
  { value: "plumbing", label: "Plumbing" },
  { value: "pool", label: "Pool" },
  { value: "roof", label: "Roof" },
  { value: "security_system", label: "Security System" },
  { value: "water_supply", label: "Water Supply" },
  { value: "window_glass", label: "Window/Glass" },
] as const

export const UNIT_STATUSES = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "on_notice", label: "On Notice" },
  { value: "under_maintenance", label: "Under Maintenance" },
] as const

export const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-PESA" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card Payment" },
] as const

export const PRIORITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const

export const PARKING_SLOT_TYPES = [
  { value: "unit", label: "Unit Assigned" },
  { value: "visitor", label: "Visitor" },
  { value: "general", label: "General" },
  { value: "reserved", label: "Reserved" },
  { value: "disabled", label: "Disabled Access" },
] as const

// Counties with custom ordering (first 8, then alphabetical)
export const COUNTIES = [
  // Priority counties (first 8 in specified order)
  { id: 1, name: "Nairobi", sort_order: 1, is_priority: true },
  { id: 2, name: "Kiambu", sort_order: 2, is_priority: true },
  { id: 3, name: "Kajiado", sort_order: 3, is_priority: true },
  { id: 4, name: "Machakos", sort_order: 4, is_priority: true },
  { id: 5, name: "Mombasa", sort_order: 5, is_priority: true },
  { id: 6, name: "Kisumu", sort_order: 6, is_priority: true },
  { id: 7, name: "Nakuru", sort_order: 7, is_priority: true },
  { id: 8, name: "Uasin Gishu", sort_order: 8, is_priority: true },
  // Remaining counties alphabetically
  { id: 9, name: "Baringo", sort_order: 9, is_priority: false },
  { id: 10, name: "Bomet", sort_order: 10, is_priority: false },
  { id: 11, name: "Bungoma", sort_order: 11, is_priority: false },
  { id: 12, name: "Busia", sort_order: 12, is_priority: false },
  { id: 13, name: "Elgeyo Marakwet", sort_order: 13, is_priority: false },
  { id: 14, name: "Embu", sort_order: 14, is_priority: false },
  { id: 15, name: "Garissa", sort_order: 15, is_priority: false },
  { id: 16, name: "Homa Bay", sort_order: 16, is_priority: false },
  { id: 17, name: "Isiolo", sort_order: 17, is_priority: false },
  { id: 18, name: "Kakamega", sort_order: 18, is_priority: false },
  { id: 19, name: "Kericho", sort_order: 19, is_priority: false },
  { id: 20, name: "Kirinyaga", sort_order: 20, is_priority: false },
  { id: 21, name: "Kisii", sort_order: 21, is_priority: false },
  { id: 22, name: "Kitui", sort_order: 22, is_priority: false },
  { id: 23, name: "Kwale", sort_order: 23, is_priority: false },
  { id: 24, name: "Laikipia", sort_order: 24, is_priority: false },
  { id: 25, name: "Lamu", sort_order: 25, is_priority: false },
  { id: 26, name: "Mandera", sort_order: 26, is_priority: false },
  { id: 27, name: "Marsabit", sort_order: 27, is_priority: false },
  { id: 28, name: "Meru", sort_order: 28, is_priority: false },
  { id: 29, name: "Migori", sort_order: 29, is_priority: false },
  { id: 30, name: "Makueni", sort_order: 30, is_priority: false },
  { id: 31, name: "Muranga", sort_order: 31, is_priority: false },
  { id: 32, name: "Narok", sort_order: 32, is_priority: false },
  { id: 33, name: "Nandi", sort_order: 33, is_priority: false },
  { id: 34, name: "Nyamira", sort_order: 34, is_priority: false },
  { id: 35, name: "Nyandarua", sort_order: 35, is_priority: false },
  { id: 36, name: "Nyeri", sort_order: 36, is_priority: false },
  { id: 37, name: "Samburu", sort_order: 37, is_priority: false },
  { id: 38, name: "Siaya", sort_order: 38, is_priority: false },
  { id: 39, name: "Taita Taveta", sort_order: 39, is_priority: false },
  { id: 40, name: "Tana River", sort_order: 40, is_priority: false },
  { id: 41, name: "Tharaka Nithi", sort_order: 41, is_priority: false },
  { id: 42, name: "Trans Nzoia", sort_order: 42, is_priority: false },
  { id: 43, name: "Turkana", sort_order: 43, is_priority: false },
  { id: 44, name: "Vihiga", sort_order: 44, is_priority: false },
  { id: 45, name: "Wajir", sort_order: 45, is_priority: false },
  { id: 46, name: "West Pokot", sort_order: 46, is_priority: false },
] as const

export const RENT_DUE_DAYS = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${getOrdinalSuffix(i + 1)} of the month`,
}))

export const ADVANCE_MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} month${i === 0 ? "" : "s"}`,
}))

function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return "st"
  if (j === 2 && k !== 12) return "nd"
  if (j === 3 && k !== 13) return "rd"
  return "th"
}

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const
