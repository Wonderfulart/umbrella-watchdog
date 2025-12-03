export type LineOfBusiness = 'auto' | 'home' | 'dwelling' | 'commercial';

export type FormFieldType = 
  | 'text' | 'select' | 'date' | 'checkbox' | 'textarea' 
  | 'number' | 'phone' | 'email' | 'ssn' | 'vin' | 'currency' | 'radio' | 'multiselect';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number | boolean;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FormField {
  id: string;
  section_id: string;
  name: string;
  label: string;
  field_type: FormFieldType;
  ezlynx_mapping?: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  sort_order: number;
  line_of_business: LineOfBusiness[];
  options: FormFieldOption[];
  validation_rules: ValidationRules;
  conditional_logic?: ConditionalLogic;
  default_value?: string;
  grid_cols: number;
}

export interface FormSection {
  id: string;
  template_id: string;
  name: string;
  label: string;
  description?: string;
  sort_order: number;
  line_of_business: LineOfBusiness[];
  is_collapsible: boolean;
  is_expanded_default: boolean;
  fields?: FormField[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  line_of_business: LineOfBusiness[];
  is_active: boolean;
  is_master: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  sections?: FormSection[];
}

export interface FormSubmission {
  id: string;
  template_id: string;
  policy_id?: string;
  submission_data: Record<string, any>;
  status: 'draft' | 'submitted' | 'processed';
  submitted_by?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

// Master form field definitions matching EZLynx ACORD forms
export const MASTER_FORM_SECTIONS = [
  { name: 'agency_info', label: 'Agency Information', sort_order: 0 },
  { name: 'applicant_info', label: 'Applicant Information', sort_order: 1 },
  { name: 'co_applicant_info', label: 'Co-Applicant Information', sort_order: 2 },
  { name: 'property_info', label: 'Property Information', sort_order: 3, lob: ['home', 'dwelling'] },
  { name: 'vehicle_info', label: 'Vehicle Information', sort_order: 4, lob: ['auto'] },
  { name: 'driver_info', label: 'Driver Information', sort_order: 5, lob: ['auto'] },
  { name: 'coverages_property', label: 'Property Coverages', sort_order: 6, lob: ['home', 'dwelling'] },
  { name: 'coverages_auto', label: 'Auto Coverages', sort_order: 7, lob: ['auto'] },
  { name: 'underwriting', label: 'Underwriting Questions', sort_order: 8 },
  { name: 'prior_coverage', label: 'Prior Coverage & Loss History', sort_order: 9 },
  { name: 'additional_interest', label: 'Additional Interest', sort_order: 10 },
  { name: 'signatures', label: 'Signatures & Disclosures', sort_order: 11 },
] as const;

export const STATE_OPTIONS: FormFieldOption[] = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
];

export const MARITAL_STATUS_OPTIONS: FormFieldOption[] = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Separated', value: 'separated' },
  { label: 'Domestic Partner', value: 'domestic_partner' },
];

export const GENDER_OPTIONS: FormFieldOption[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-Binary', value: 'non_binary' },
  { label: 'Prefer Not to Say', value: 'not_specified' },
];

export const RESIDENCE_TYPE_OPTIONS: FormFieldOption[] = [
  { label: 'Single Family', value: 'single_family' },
  { label: 'Condo/Townhouse', value: 'condo' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Mobile Home', value: 'mobile_home' },
  { label: 'Duplex', value: 'duplex' },
  { label: 'Multi-Family', value: 'multi_family' },
];

export const CONSTRUCTION_TYPE_OPTIONS: FormFieldOption[] = [
  { label: 'Frame', value: 'frame' },
  { label: 'Masonry', value: 'masonry' },
  { label: 'Masonry Veneer', value: 'masonry_veneer' },
  { label: 'Fire Resistive', value: 'fire_resistive' },
  { label: 'Superior', value: 'superior' },
];

export const ROOF_TYPE_OPTIONS: FormFieldOption[] = [
  { label: 'Asphalt Shingle', value: 'asphalt_shingle' },
  { label: 'Wood Shingle', value: 'wood_shingle' },
  { label: 'Tile', value: 'tile' },
  { label: 'Metal', value: 'metal' },
  { label: 'Slate', value: 'slate' },
  { label: 'Flat/Built-up', value: 'flat' },
];

export const HEATING_TYPE_OPTIONS: FormFieldOption[] = [
  { label: 'Central Gas', value: 'central_gas' },
  { label: 'Central Electric', value: 'central_electric' },
  { label: 'Heat Pump', value: 'heat_pump' },
  { label: 'Oil', value: 'oil' },
  { label: 'Wood/Pellet', value: 'wood' },
  { label: 'Space Heater', value: 'space_heater' },
];

export const VEHICLE_USE_OPTIONS: FormFieldOption[] = [
  { label: 'Pleasure', value: 'pleasure' },
  { label: 'Commute', value: 'commute' },
  { label: 'Business', value: 'business' },
  { label: 'Farm', value: 'farm' },
];

export const COVERAGE_LIMIT_OPTIONS: FormFieldOption[] = [
  { label: '$15,000/$30,000', value: '15/30' },
  { label: '$25,000/$50,000', value: '25/50' },
  { label: '$50,000/$100,000', value: '50/100' },
  { label: '$100,000/$300,000', value: '100/300' },
  { label: '$250,000/$500,000', value: '250/500' },
  { label: '$500,000/$500,000', value: '500/500' },
];

export const DEDUCTIBLE_OPTIONS: FormFieldOption[] = [
  { label: '$250', value: '250' },
  { label: '$500', value: '500' },
  { label: '$1,000', value: '1000' },
  { label: '$2,500', value: '2500' },
  { label: '$5,000', value: '5000' },
  { label: '$10,000', value: '10000' },
];
