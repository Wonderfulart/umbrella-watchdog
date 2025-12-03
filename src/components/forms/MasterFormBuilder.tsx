import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Wand2 } from "lucide-react";
import { useFormTemplate } from "@/hooks/useFormTemplate";
import { 
  LineOfBusiness, 
  STATE_OPTIONS, 
  MARITAL_STATUS_OPTIONS,
  GENDER_OPTIONS,
  RESIDENCE_TYPE_OPTIONS,
  CONSTRUCTION_TYPE_OPTIONS,
  ROOF_TYPE_OPTIONS,
  HEATING_TYPE_OPTIONS,
  VEHICLE_USE_OPTIONS,
  COVERAGE_LIMIT_OPTIONS,
  DEDUCTIBLE_OPTIONS,
} from "@/types/insuranceForm";
import { toast } from "@/hooks/use-toast";

interface MasterFormBuilderProps {
  onTemplateCreated?: (templateId: string) => void;
}

export function MasterFormBuilder({ onTemplateCreated }: MasterFormBuilderProps) {
  const { createTemplate, createSection, createFields, loading } = useFormTemplate();
  const [creating, setCreating] = useState(false);
  const [templateName, setTemplateName] = useState("Master Insurance Application");
  const [description, setDescription] = useState("Comprehensive insurance application form matching EZLynx ACORD standards");
  const [selectedLOB, setSelectedLOB] = useState<LineOfBusiness[]>(['auto', 'home', 'dwelling']);

  const toggleLOB = (lob: LineOfBusiness) => {
    setSelectedLOB(prev => 
      prev.includes(lob) 
        ? prev.filter(l => l !== lob)
        : [...prev, lob]
    );
  };

  const createMasterForm = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a template name.",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);

      // Create template
      const template = await createTemplate({
        name: templateName,
        description,
        line_of_business: selectedLOB,
        is_active: true,
        is_master: true,
      });

      // Create sections and fields
      await createAllSections(template.id);

      toast({
        title: "Master Form Created",
        description: "The EZLynx Master Insurance Application form has been created with all sections and fields."
      });

      onTemplateCreated?.(template.id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const createAllSections = async (templateId: string) => {
    // Section 1: Agency Information
    const agencySection = await createSection({
      template_id: templateId,
      name: 'agency_info',
      label: 'Agency Information',
      description: 'Auto-filled from agency settings',
      sort_order: 0,
      line_of_business: [],
      is_collapsible: true,
      is_expanded_default: false,
    });

    await createFields([
      { section_id: agencySection.id, name: 'agency_name', label: 'Agency Name', field_type: 'text', ezlynx_mapping: 'Agency.Name', is_required: true, sort_order: 0, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: agencySection.id, name: 'agency_contact', label: 'Contact Name', field_type: 'text', ezlynx_mapping: 'Agency.Contact', sort_order: 1, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: agencySection.id, name: 'agency_phone', label: 'Phone', field_type: 'phone', ezlynx_mapping: 'Agency.Phone', sort_order: 2, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: agencySection.id, name: 'agency_email', label: 'Email', field_type: 'email', ezlynx_mapping: 'Agency.Email', sort_order: 3, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: agencySection.id, name: 'agency_address', label: 'Address', field_type: 'text', ezlynx_mapping: 'Agency.Address', sort_order: 4, options: [], validation_rules: {}, grid_cols: 2, line_of_business: [] },
      { section_id: agencySection.id, name: 'customer_id', label: 'Customer ID', field_type: 'text', ezlynx_mapping: 'Customer.ID', sort_order: 5, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
    ]);

    // Section 2: Applicant Information
    const applicantSection = await createSection({
      template_id: templateId,
      name: 'applicant_info',
      label: 'Applicant Information',
      sort_order: 1,
      line_of_business: [],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: applicantSection.id, name: 'applicant_first_name', label: 'First Name', field_type: 'text', ezlynx_mapping: 'Primary Contact.First Name', is_required: true, sort_order: 0, options: [], validation_rules: { maxLength: 50 }, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_middle_name', label: 'Middle Name', field_type: 'text', ezlynx_mapping: 'Primary Contact.Middle Name', sort_order: 1, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_last_name', label: 'Last Name', field_type: 'text', ezlynx_mapping: 'Primary Contact.Last Name', is_required: true, sort_order: 2, options: [], validation_rules: { maxLength: 50 }, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_suffix', label: 'Suffix', field_type: 'select', ezlynx_mapping: 'Primary Contact.Suffix', sort_order: 3, options: [{ label: 'Jr.', value: 'Jr' }, { label: 'Sr.', value: 'Sr' }, { label: 'II', value: 'II' }, { label: 'III', value: 'III' }], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_dob', label: 'Date of Birth', field_type: 'date', ezlynx_mapping: 'Primary Contact.Date of Birth', is_required: true, sort_order: 4, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_ssn', label: 'SSN', field_type: 'ssn', ezlynx_mapping: 'Primary Contact.SSN', sort_order: 5, placeholder: 'XXX-XX-XXXX', help_text: 'Required for credit check', options: [], validation_rules: { pattern: '^\\d{3}-?\\d{2}-?\\d{4}$' }, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_gender', label: 'Gender', field_type: 'select', ezlynx_mapping: 'Primary Contact.Gender', sort_order: 6, options: GENDER_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_marital_status', label: 'Marital Status', field_type: 'select', ezlynx_mapping: 'Primary Contact.Marital Status', is_required: true, sort_order: 7, options: MARITAL_STATUS_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_address', label: 'Street Address', field_type: 'text', ezlynx_mapping: 'Primary Contact.Address1', is_required: true, sort_order: 8, options: [], validation_rules: {}, grid_cols: 2, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_city', label: 'City', field_type: 'text', ezlynx_mapping: 'Primary Contact.City', is_required: true, sort_order: 9, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_state', label: 'State', field_type: 'select', ezlynx_mapping: 'Primary Contact.State', is_required: true, sort_order: 10, options: STATE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_zip', label: 'ZIP Code', field_type: 'text', ezlynx_mapping: 'Primary Contact.Zip', is_required: true, sort_order: 11, options: [], validation_rules: { pattern: '^\\d{5}(-\\d{4})?$', patternMessage: 'Enter valid ZIP code' }, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_county', label: 'County', field_type: 'text', ezlynx_mapping: 'Primary Contact.County', sort_order: 12, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_phone', label: 'Primary Phone', field_type: 'phone', ezlynx_mapping: 'Primary Contact.Phone', is_required: true, sort_order: 13, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_phone_alt', label: 'Alternate Phone', field_type: 'phone', ezlynx_mapping: 'Primary Contact.Phone2', sort_order: 14, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_email', label: 'Email', field_type: 'email', ezlynx_mapping: 'Primary Contact.Email', is_required: true, sort_order: 15, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_dl_number', label: "Driver's License #", field_type: 'text', ezlynx_mapping: 'Primary Contact.License Number', sort_order: 16, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: applicantSection.id, name: 'applicant_dl_state', label: 'License State', field_type: 'select', ezlynx_mapping: 'Primary Contact.License State', sort_order: 17, options: STATE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: applicantSection.id, name: 'applicant_occupation', label: 'Occupation', field_type: 'text', ezlynx_mapping: 'Primary Contact.Occupation', sort_order: 18, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: applicantSection.id, name: 'applicant_employer', label: 'Employer', field_type: 'text', ezlynx_mapping: 'Primary Contact.Employer', sort_order: 19, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
    ]);

    // Section 3: Property Information (Home/Dwelling)
    const propertySection = await createSection({
      template_id: templateId,
      name: 'property_info',
      label: 'Property Information',
      sort_order: 2,
      line_of_business: ['home', 'dwelling'],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: propertySection.id, name: 'prop_same_as_mailing', label: 'Property address same as mailing address', field_type: 'checkbox', sort_order: 0, options: [], validation_rules: {}, grid_cols: 2, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_address', label: 'Property Address', field_type: 'text', ezlynx_mapping: 'Property.Address', sort_order: 1, options: [], validation_rules: {}, grid_cols: 2, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_city', label: 'City', field_type: 'text', ezlynx_mapping: 'Property.City', sort_order: 2, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_state', label: 'State', field_type: 'select', ezlynx_mapping: 'Property.State', sort_order: 3, options: STATE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_zip', label: 'ZIP', field_type: 'text', ezlynx_mapping: 'Property.Zip', sort_order: 4, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_residence_type', label: 'Residence Type', field_type: 'select', ezlynx_mapping: 'Property.Residence Type', is_required: true, sort_order: 5, options: RESIDENCE_TYPE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_year_built', label: 'Year Built', field_type: 'number', ezlynx_mapping: 'Property.Year Built', is_required: true, sort_order: 6, options: [], validation_rules: { min: 1800, max: 2030 }, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_square_feet', label: 'Square Feet', field_type: 'number', ezlynx_mapping: 'Property.Square Feet', sort_order: 7, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_num_stories', label: 'Number of Stories', field_type: 'select', ezlynx_mapping: 'Property.Stories', sort_order: 8, options: [{ label: '1', value: '1' }, { label: '1.5', value: '1.5' }, { label: '2', value: '2' }, { label: '2.5', value: '2.5' }, { label: '3+', value: '3' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_num_families', label: 'Number of Families', field_type: 'select', ezlynx_mapping: 'Property.Families', sort_order: 9, options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_construction', label: 'Construction Type', field_type: 'select', ezlynx_mapping: 'Property.Construction', is_required: true, sort_order: 10, options: CONSTRUCTION_TYPE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_roof_type', label: 'Roof Type', field_type: 'select', ezlynx_mapping: 'Property.Roof Type', is_required: true, sort_order: 11, options: ROOF_TYPE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_roof_year', label: 'Roof Year', field_type: 'number', ezlynx_mapping: 'Property.Roof Year', sort_order: 12, options: [], validation_rules: { min: 1900, max: 2030 }, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_heating', label: 'Heating Type', field_type: 'select', ezlynx_mapping: 'Property.Heating', sort_order: 13, options: HEATING_TYPE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_electrical_amps', label: 'Electrical Service (Amps)', field_type: 'select', ezlynx_mapping: 'Property.Electrical', sort_order: 14, options: [{ label: '60', value: '60' }, { label: '100', value: '100' }, { label: '150', value: '150' }, { label: '200', value: '200' }, { label: '400', value: '400' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_wiring_type', label: 'Wiring Type', field_type: 'select', ezlynx_mapping: 'Property.Wiring', sort_order: 15, options: [{ label: 'Copper', value: 'copper' }, { label: 'Aluminum', value: 'aluminum' }, { label: 'Knob & Tube', value: 'knob_tube' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_plumbing_type', label: 'Plumbing Type', field_type: 'select', ezlynx_mapping: 'Property.Plumbing', sort_order: 16, options: [{ label: 'Copper', value: 'copper' }, { label: 'PVC', value: 'pvc' }, { label: 'Galvanized', value: 'galvanized' }, { label: 'PEX', value: 'pex' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_fire_dist', label: 'Distance to Fire Station (miles)', field_type: 'number', ezlynx_mapping: 'Property.Fire Distance', sort_order: 17, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_hydrant_dist', label: 'Distance to Fire Hydrant (feet)', field_type: 'number', ezlynx_mapping: 'Property.Hydrant Distance', sort_order: 18, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_smoke_detectors', label: 'Smoke Detectors', field_type: 'checkbox', ezlynx_mapping: 'Property.Smoke Detectors', sort_order: 19, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_burglar_alarm', label: 'Burglar Alarm', field_type: 'checkbox', ezlynx_mapping: 'Property.Burglar Alarm', sort_order: 20, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_fire_alarm', label: 'Fire Alarm', field_type: 'checkbox', ezlynx_mapping: 'Property.Fire Alarm', sort_order: 21, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_deadbolts', label: 'Deadbolt Locks', field_type: 'checkbox', ezlynx_mapping: 'Property.Deadbolts', sort_order: 22, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propertySection.id, name: 'prop_sprinklers', label: 'Fire Sprinklers', field_type: 'checkbox', ezlynx_mapping: 'Property.Sprinklers', sort_order: 23, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
    ]);

    // Section 4: Vehicle Information (Auto)
    const vehicleSection = await createSection({
      template_id: templateId,
      name: 'vehicle_info',
      label: 'Vehicle Information',
      sort_order: 3,
      line_of_business: ['auto'],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: vehicleSection.id, name: 'veh1_year', label: 'Vehicle Year', field_type: 'number', ezlynx_mapping: 'Vehicle1.Year', is_required: true, sort_order: 0, options: [], validation_rules: { min: 1900, max: 2030 }, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_make', label: 'Make', field_type: 'text', ezlynx_mapping: 'Vehicle1.Make', is_required: true, sort_order: 1, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_model', label: 'Model', field_type: 'text', ezlynx_mapping: 'Vehicle1.Model', is_required: true, sort_order: 2, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_body_type', label: 'Body Type', field_type: 'select', ezlynx_mapping: 'Vehicle1.Body Type', sort_order: 3, options: [{ label: 'Sedan', value: 'sedan' }, { label: 'SUV', value: 'suv' }, { label: 'Truck', value: 'truck' }, { label: 'Van', value: 'van' }, { label: 'Coupe', value: 'coupe' }, { label: 'Convertible', value: 'convertible' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_vin', label: 'VIN', field_type: 'vin', ezlynx_mapping: 'Vehicle1.VIN', is_required: true, sort_order: 4, placeholder: '17 characters', options: [], validation_rules: { minLength: 17, maxLength: 17 }, grid_cols: 2, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_use', label: 'Vehicle Use', field_type: 'select', ezlynx_mapping: 'Vehicle1.Use', is_required: true, sort_order: 5, options: VEHICLE_USE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_annual_miles', label: 'Annual Mileage', field_type: 'number', ezlynx_mapping: 'Vehicle1.Annual Miles', sort_order: 6, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_commute_miles', label: 'One-Way Commute (miles)', field_type: 'number', ezlynx_mapping: 'Vehicle1.Commute Miles', sort_order: 7, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_days_week', label: 'Days/Week Driven', field_type: 'select', ezlynx_mapping: 'Vehicle1.Days Week', sort_order: 8, options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '7', value: '7' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_purchase_date', label: 'Purchase Date', field_type: 'date', ezlynx_mapping: 'Vehicle1.Purchase Date', sort_order: 9, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_new_used', label: 'New/Used', field_type: 'radio', ezlynx_mapping: 'Vehicle1.New Used', sort_order: 10, options: [{ label: 'New', value: 'new' }, { label: 'Used', value: 'used' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_ownership', label: 'Ownership', field_type: 'select', ezlynx_mapping: 'Vehicle1.Ownership', sort_order: 11, options: [{ label: 'Owned', value: 'owned' }, { label: 'Financed', value: 'financed' }, { label: 'Leased', value: 'leased' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_anti_theft', label: 'Anti-Theft Device', field_type: 'checkbox', ezlynx_mapping: 'Vehicle1.Anti Theft', sort_order: 12, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: vehicleSection.id, name: 'veh1_airbags', label: 'Airbags', field_type: 'select', ezlynx_mapping: 'Vehicle1.Airbags', sort_order: 13, options: [{ label: 'None', value: 'none' }, { label: 'Driver Only', value: 'driver' }, { label: 'Driver & Passenger', value: 'both' }, { label: 'Side Curtain', value: 'side' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
    ]);

    // Section 5: Property Coverages
    const propCoverageSection = await createSection({
      template_id: templateId,
      name: 'coverages_property',
      label: 'Property Coverages',
      sort_order: 4,
      line_of_business: ['home', 'dwelling'],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: propCoverageSection.id, name: 'cov_dwelling', label: 'Dwelling Coverage (A)', field_type: 'currency', ezlynx_mapping: 'Coverage.Dwelling', is_required: true, sort_order: 0, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propCoverageSection.id, name: 'cov_other_structures', label: 'Other Structures (B)', field_type: 'currency', ezlynx_mapping: 'Coverage.Other Structures', sort_order: 1, help_text: 'Usually 10% of dwelling', options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propCoverageSection.id, name: 'cov_personal_property', label: 'Personal Property (C)', field_type: 'currency', ezlynx_mapping: 'Coverage.Personal Property', sort_order: 2, help_text: 'Usually 50-70% of dwelling', options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home'] },
      { section_id: propCoverageSection.id, name: 'cov_loss_of_use', label: 'Loss of Use (D)', field_type: 'currency', ezlynx_mapping: 'Coverage.Loss of Use', sort_order: 3, help_text: 'Usually 20% of dwelling', options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propCoverageSection.id, name: 'cov_liability', label: 'Personal Liability (E)', field_type: 'select', ezlynx_mapping: 'Coverage.Liability', sort_order: 4, options: [{ label: '$100,000', value: '100000' }, { label: '$300,000', value: '300000' }, { label: '$500,000', value: '500000' }, { label: '$1,000,000', value: '1000000' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home'] },
      { section_id: propCoverageSection.id, name: 'cov_med_pay', label: 'Medical Payments (F)', field_type: 'select', ezlynx_mapping: 'Coverage.Med Pay', sort_order: 5, options: [{ label: '$1,000', value: '1000' }, { label: '$2,000', value: '2000' }, { label: '$5,000', value: '5000' }], validation_rules: {}, grid_cols: 1, line_of_business: ['home'] },
      { section_id: propCoverageSection.id, name: 'cov_deductible', label: 'All Perils Deductible', field_type: 'select', ezlynx_mapping: 'Coverage.Deductible', is_required: true, sort_order: 6, options: DEDUCTIBLE_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
      { section_id: propCoverageSection.id, name: 'cov_wind_deductible', label: 'Wind/Hail Deductible', field_type: 'select', ezlynx_mapping: 'Coverage.Wind Deductible', sort_order: 7, options: [{ label: '1%', value: '1' }, { label: '2%', value: '2' }, { label: '5%', value: '5' }, ...DEDUCTIBLE_OPTIONS], validation_rules: {}, grid_cols: 1, line_of_business: ['home', 'dwelling'] },
    ]);

    // Section 6: Auto Coverages
    const autoCoverageSection = await createSection({
      template_id: templateId,
      name: 'coverages_auto',
      label: 'Auto Coverages',
      sort_order: 5,
      line_of_business: ['auto'],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: autoCoverageSection.id, name: 'auto_bi', label: 'Bodily Injury', field_type: 'select', ezlynx_mapping: 'Auto.BI Limits', is_required: true, sort_order: 0, options: COVERAGE_LIMIT_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_pd', label: 'Property Damage', field_type: 'select', ezlynx_mapping: 'Auto.PD Limit', is_required: true, sort_order: 1, options: [{ label: '$25,000', value: '25000' }, { label: '$50,000', value: '50000' }, { label: '$100,000', value: '100000' }, { label: '$250,000', value: '250000' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_pip', label: 'PIP/Medical Payments', field_type: 'select', ezlynx_mapping: 'Auto.PIP', sort_order: 2, options: [{ label: '$5,000', value: '5000' }, { label: '$10,000', value: '10000' }, { label: '$25,000', value: '25000' }, { label: '$50,000', value: '50000' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_um', label: 'UM/UIM Bodily Injury', field_type: 'select', ezlynx_mapping: 'Auto.UM Limits', sort_order: 3, options: [...COVERAGE_LIMIT_OPTIONS, { label: 'Reject', value: 'reject' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_comp', label: 'Comprehensive Deductible', field_type: 'select', ezlynx_mapping: 'Auto.Comp Ded', sort_order: 4, options: [...DEDUCTIBLE_OPTIONS, { label: 'No Coverage', value: 'none' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_coll', label: 'Collision Deductible', field_type: 'select', ezlynx_mapping: 'Auto.Coll Ded', sort_order: 5, options: [...DEDUCTIBLE_OPTIONS, { label: 'No Coverage', value: 'none' }], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_towing', label: 'Towing & Labor', field_type: 'checkbox', ezlynx_mapping: 'Auto.Towing', sort_order: 6, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: autoCoverageSection.id, name: 'auto_rental', label: 'Rental Reimbursement', field_type: 'checkbox', ezlynx_mapping: 'Auto.Rental', sort_order: 7, options: [], validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
    ]);

    // Section 7: Prior Coverage
    const priorSection = await createSection({
      template_id: templateId,
      name: 'prior_coverage',
      label: 'Prior Coverage & Loss History',
      sort_order: 6,
      line_of_business: [],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: priorSection.id, name: 'prior_carrier', label: 'Prior Insurance Carrier', field_type: 'text', ezlynx_mapping: 'Prior.Carrier', sort_order: 0, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'prior_policy_number', label: 'Prior Policy Number', field_type: 'text', ezlynx_mapping: 'Prior.Policy Number', sort_order: 1, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'prior_expiration', label: 'Prior Policy Expiration', field_type: 'date', ezlynx_mapping: 'Prior.Expiration', sort_order: 2, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'prior_limits', label: 'Prior BI Limits', field_type: 'select', ezlynx_mapping: 'Prior.Limits', sort_order: 3, options: COVERAGE_LIMIT_OPTIONS, validation_rules: {}, grid_cols: 1, line_of_business: ['auto'] },
      { section_id: priorSection.id, name: 'prior_years_continuous', label: 'Years of Continuous Coverage', field_type: 'number', ezlynx_mapping: 'Prior.Years', sort_order: 4, options: [], validation_rules: { min: 0 }, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'has_losses', label: 'Any losses in past 5 years?', field_type: 'checkbox', sort_order: 5, options: [], validation_rules: {}, grid_cols: 2, line_of_business: [] },
      { section_id: priorSection.id, name: 'loss1_date', label: 'Loss Date', field_type: 'date', ezlynx_mapping: 'Loss1.Date', sort_order: 6, conditional_logic: { field: 'has_losses', operator: 'equals', value: true }, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'loss1_type', label: 'Loss Type', field_type: 'select', ezlynx_mapping: 'Loss1.Type', sort_order: 7, conditional_logic: { field: 'has_losses', operator: 'equals', value: true }, options: [{ label: 'At Fault Accident', value: 'at_fault' }, { label: 'Not At Fault', value: 'not_at_fault' }, { label: 'Comprehensive', value: 'comp' }, { label: 'Weather', value: 'weather' }, { label: 'Theft', value: 'theft' }, { label: 'Fire', value: 'fire' }, { label: 'Water', value: 'water' }], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'loss1_amount', label: 'Loss Amount', field_type: 'currency', ezlynx_mapping: 'Loss1.Amount', sort_order: 8, conditional_logic: { field: 'has_losses', operator: 'equals', value: true }, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: priorSection.id, name: 'loss1_description', label: 'Description', field_type: 'textarea', ezlynx_mapping: 'Loss1.Description', sort_order: 9, conditional_logic: { field: 'has_losses', operator: 'equals', value: true }, options: [], validation_rules: {}, grid_cols: 2, line_of_business: [] },
    ]);

    // Section 8: Signatures
    const sigSection = await createSection({
      template_id: templateId,
      name: 'signatures',
      label: 'Signatures & Acknowledgments',
      sort_order: 7,
      line_of_business: [],
      is_collapsible: true,
      is_expanded_default: true,
    });

    await createFields([
      { section_id: sigSection.id, name: 'fraud_acknowledgment', label: 'I understand that any person who knowingly presents a false or fraudulent claim for payment of a loss or benefit, or knowingly presents false information in an application for insurance, may be guilty of a crime and may be subject to fines and confinement in prison.', field_type: 'checkbox', is_required: true, sort_order: 0, options: [], validation_rules: {}, grid_cols: 2, line_of_business: [] },
      { section_id: sigSection.id, name: 'info_accurate', label: 'I certify that all information provided in this application is true and accurate to the best of my knowledge.', field_type: 'checkbox', is_required: true, sort_order: 1, options: [], validation_rules: {}, grid_cols: 2, line_of_business: [] },
      { section_id: sigSection.id, name: 'signature_name', label: 'Signature (Type Full Name)', field_type: 'text', ezlynx_mapping: 'Signature.Name', is_required: true, sort_order: 2, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
      { section_id: sigSection.id, name: 'signature_date', label: 'Date', field_type: 'date', ezlynx_mapping: 'Signature.Date', is_required: true, sort_order: 3, options: [], validation_rules: {}, grid_cols: 1, line_of_business: [] },
    ]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Create Master Insurance Form
          </CardTitle>
          <CardDescription>
            Build a comprehensive insurance application form matching EZLynx ACORD standards with ~100+ fields across all lines of business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Lines of Business</Label>
            <div className="flex flex-wrap gap-4">
              {(['auto', 'home', 'dwelling', 'commercial'] as LineOfBusiness[]).map((lob) => (
                <div key={lob} className="flex items-center space-x-2">
                  <Checkbox
                    id={`create-lob-${lob}`}
                    checked={selectedLOB.includes(lob)}
                    onCheckedChange={() => toggleLOB(lob)}
                  />
                  <Label htmlFor={`create-lob-${lob}`} className="font-normal cursor-pointer capitalize">
                    {lob === 'auto' ? 'Personal Auto' : 
                     lob === 'home' ? 'Homeowner' :
                     lob === 'dwelling' ? 'Dwelling Fire' : 'Commercial'}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {selectedLOB.map(lob => (
                <Badge key={lob} variant="secondary" className="capitalize">
                  {lob}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Sections Included:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Agency Info</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Applicant Info</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Property Info</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Vehicle Info</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Property Coverages</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Auto Coverages</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Prior Coverage</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Signatures</div>
            </div>
          </div>

          <Button
            onClick={createMasterForm}
            disabled={creating || !templateName.trim() || selectedLOB.length === 0}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Master Form...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Master Insurance Form
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
