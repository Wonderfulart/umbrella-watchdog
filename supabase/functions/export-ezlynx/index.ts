import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ACORD XML Templates for different lines of business
const generateACORDHeader = () => `<?xml version="1.0" encoding="UTF-8"?>
<ACORD xmlns="http://www.ACORD.org/standards/PC_Surety/ACORD1/xml/">
  <SignonRq>
    <SignonPswd>
      <CustId>
        <SPName>EZLynx</SPName>
        <CustLoginId>PolicyRenewalHub</CustLoginId>
      </CustId>
    </SignonPswd>
    <ClientDt>${new Date().toISOString().split('T')[0]}</ClientDt>
    <CustLangPref>en-US</CustLangPref>
    <ClientApp>
      <Org>PolicyRenewalHub</Org>
      <Name>ACORD Export</Name>
      <Version>1.0</Version>
    </ClientApp>
  </SignonRq>`;

const escapeXml = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return date;
  }
};

const generateApplicantInfo = (data: Record<string, any>) => `
  <InsuredOrPrincipal>
    <GeneralPartyInfo>
      <NameInfo>
        <PersonName>
          <Surname>${escapeXml(data.applicant_last_name)}</Surname>
          <GivenName>${escapeXml(data.applicant_first_name)}</GivenName>
          <OtherGivenName>${escapeXml(data.applicant_middle_name || '')}</OtherGivenName>
        </PersonName>
      </NameInfo>
      <Addr>
        <AddrTypeCd>MailingAddress</AddrTypeCd>
        <Addr1>${escapeXml(data.mailing_address)}</Addr1>
        <City>${escapeXml(data.mailing_city)}</City>
        <StateProvCd>${escapeXml(data.mailing_state)}</StateProvCd>
        <PostalCode>${escapeXml(data.mailing_zip)}</PostalCode>
        <CountyCd>${escapeXml(data.mailing_county || '')}</CountyCd>
      </Addr>
      <Communications>
        <PhoneInfo>
          <PhoneTypeCd>Phone</PhoneTypeCd>
          <PhoneNumber>${escapeXml(data.primary_phone)}</PhoneNumber>
        </PhoneInfo>
        <EmailInfo>
          <EmailAddr>${escapeXml(data.email)}</EmailAddr>
        </EmailInfo>
      </Communications>
    </GeneralPartyInfo>
    <InsuredOrPrincipalInfo>
      <PersonInfo>
        <BirthDt>${formatDate(data.date_of_birth)}</BirthDt>
        <GenderCd>${escapeXml(data.gender)}</GenderCd>
        <MaritalStatusCd>${escapeXml(data.marital_status)}</MaritalStatusCd>
        <OccupationClassCd>${escapeXml(data.occupation)}</OccupationClassCd>
      </PersonInfo>
    </InsuredOrPrincipalInfo>
  </InsuredOrPrincipal>`;

const generateDriverInfo = (data: Record<string, any>) => `
  <DriverInfo>
    <PersonInfo>
      <BirthDt>${formatDate(data.date_of_birth)}</BirthDt>
      <GenderCd>${escapeXml(data.gender)}</GenderCd>
      <MaritalStatusCd>${escapeXml(data.marital_status)}</MaritalStatusCd>
    </PersonInfo>
    <License>
      <LicenseTypeCd>Driver</LicenseTypeCd>
      <LicenseNumber>${escapeXml(data.drivers_license_number)}</LicenseNumber>
      <StateProvCd>${escapeXml(data.license_state)}</StateProvCd>
      <LicenseStatusCd>${escapeXml(data.license_status || 'Valid')}</LicenseStatusCd>
      <LicensedDt>${formatDate(data.date_licensed)}</LicensedDt>
    </License>
  </DriverInfo>`;

const generateVehicleInfo = (data: Record<string, any>) => `
  <PersVeh>
    <VehIdentificationNumber>${escapeXml(data.vin)}</VehIdentificationNumber>
    <ModelYr>${escapeXml(data.vehicle_year)}</ModelYr>
    <Manufacturer>${escapeXml(data.vehicle_make)}</Manufacturer>
    <Model>${escapeXml(data.vehicle_model)}</Model>
    <VehBodyTypeCd>${escapeXml(data.body_type || 'SD')}</VehBodyTypeCd>
    <VehUseCd>${escapeXml(data.vehicle_use || 'Pleasure')}</VehUseCd>
    <NumDaysDrivenPerWeek>${escapeXml(data.days_per_week || '5')}</NumDaysDrivenPerWeek>
    <EstimatedAnnualDistance>
      <NumUnits>${escapeXml(data.annual_mileage || '12000')}</NumUnits>
      <UnitMeasurementCd>Miles</UnitMeasurementCd>
    </EstimatedAnnualDistance>
    <GaragingInfo>
      <Addr>
        <Addr1>${escapeXml(data.garaging_address || data.mailing_address)}</Addr1>
        <City>${escapeXml(data.garaging_city || data.mailing_city)}</City>
        <StateProvCd>${escapeXml(data.garaging_state || data.mailing_state)}</StateProvCd>
        <PostalCode>${escapeXml(data.garaging_zip || data.mailing_zip)}</PostalCode>
      </Addr>
    </GaragingInfo>
  </PersVeh>`;

const generateAutoCoverages = (data: Record<string, any>) => `
  <Coverage>
    <CoverageCd>BI</CoverageCd>
    <CoverageDesc>Bodily Injury Liability</CoverageDesc>
    <Limit>
      <FormatInteger>${escapeXml(data.bi_limit || '100000')}</FormatInteger>
      <LimitAppliesToCd>PerPerson</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Coverage>
    <CoverageCd>PD</CoverageCd>
    <CoverageDesc>Property Damage Liability</CoverageDesc>
    <Limit>
      <FormatInteger>${escapeXml(data.pd_limit || '50000')}</FormatInteger>
      <LimitAppliesToCd>PerOcc</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Coverage>
    <CoverageCd>COMP</CoverageCd>
    <CoverageDesc>Comprehensive</CoverageDesc>
    <Deductible>
      <FormatInteger>${escapeXml(data.comp_deductible || '500')}</FormatInteger>
      <DeductibleAppliesToCd>Coverage</DeductibleAppliesToCd>
    </Deductible>
  </Coverage>
  <Coverage>
    <CoverageCd>COLL</CoverageCd>
    <CoverageDesc>Collision</CoverageDesc>
    <Deductible>
      <FormatInteger>${escapeXml(data.coll_deductible || '500')}</FormatInteger>
      <DeductibleAppliesToCd>Coverage</DeductibleAppliesToCd>
    </Deductible>
  </Coverage>`;

const generatePropertyInfo = (data: Record<string, any>) => `
  <HomeLineBusiness>
    <Dwell>
      <Construction>
        <ConstructionCd>${escapeXml(data.construction_type || 'Frame')}</ConstructionCd>
        <YearBuilt>${escapeXml(data.year_built)}</YearBuilt>
        <NumStories>${escapeXml(data.num_stories || '1')}</NumStories>
        <RoofMaterialCd>${escapeXml(data.roof_material || 'Composition')}</RoofMaterialCd>
        <FoundationTypeCd>${escapeXml(data.foundation_type || 'Slab')}</FoundationTypeCd>
      </Construction>
      <Addr>
        <Addr1>${escapeXml(data.property_address || data.mailing_address)}</Addr1>
        <City>${escapeXml(data.property_city || data.mailing_city)}</City>
        <StateProvCd>${escapeXml(data.property_state || data.mailing_state)}</StateProvCd>
        <PostalCode>${escapeXml(data.property_zip || data.mailing_zip)}</PostalCode>
      </Addr>
      <ResidenceTypeCd>${escapeXml(data.residence_type || 'Dwelling')}</ResidenceTypeCd>
      <OccupancyTypeCd>${escapeXml(data.occupancy_type || 'Owner')}</OccupancyTypeCd>
      <NumFamilies>${escapeXml(data.num_families || '1')}</NumFamilies>
      <SquareFootage>${escapeXml(data.square_footage)}</SquareFootage>
      <NumRooms>${escapeXml(data.num_rooms)}</NumRooms>
      <NumBathrooms>${escapeXml(data.num_bathrooms)}</NumBathrooms>
      <HeatingTypeCd>${escapeXml(data.heating_type || 'Central')}</HeatingTypeCd>
      <PlumbingTypeCd>${escapeXml(data.plumbing_type || 'Copper')}</PlumbingTypeCd>
      <ElectricalTypeCd>${escapeXml(data.electrical_type || 'Circuit Breaker')}</ElectricalTypeCd>
    </Dwell>
    <ProtectionDeviceInfo>
      <ProtectionDeviceCd>${data.burglar_alarm ? 'BurglarAlarm' : ''}</ProtectionDeviceCd>
      <ProtectionDeviceCd>${data.smoke_detector ? 'SmokeDetector' : ''}</ProtectionDeviceCd>
      <ProtectionDeviceCd>${data.fire_extinguisher ? 'FireExtinguisher' : ''}</ProtectionDeviceCd>
      <ProtectionDeviceCd>${data.deadbolt_locks ? 'DeadboltLocks' : ''}</ProtectionDeviceCd>
    </ProtectionDeviceInfo>
    <FireProtectionInfo>
      <DistanceToFireStation>${escapeXml(data.distance_to_fire_station)}</DistanceToFireStation>
      <DistanceToHydrant>${escapeXml(data.distance_to_hydrant)}</DistanceToHydrant>
    </FireProtectionInfo>
  </HomeLineBusiness>`;

const generateHomeCoverages = (data: Record<string, any>) => `
  <Coverage>
    <CoverageCd>DWELL</CoverageCd>
    <CoverageDesc>Dwelling Coverage</CoverageDesc>
    <Limit>
      <FormatCurrency>${escapeXml(data.dwelling_coverage || '250000')}</FormatCurrency>
      <LimitAppliesToCd>Coverage</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Coverage>
    <CoverageCd>OTHSTRUC</CoverageCd>
    <CoverageDesc>Other Structures</CoverageDesc>
    <Limit>
      <FormatCurrency>${escapeXml(data.other_structures_coverage || '25000')}</FormatCurrency>
      <LimitAppliesToCd>Coverage</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Coverage>
    <CoverageCd>PP</CoverageCd>
    <CoverageDesc>Personal Property</CoverageDesc>
    <Limit>
      <FormatCurrency>${escapeXml(data.personal_property_coverage || '125000')}</FormatCurrency>
      <LimitAppliesToCd>Coverage</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Coverage>
    <CoverageCd>LOSSUSE</CoverageCd>
    <CoverageDesc>Loss of Use</CoverageDesc>
    <Limit>
      <FormatCurrency>${escapeXml(data.loss_of_use_coverage || '50000')}</FormatCurrency>
      <LimitAppliesToCd>Coverage</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Coverage>
    <CoverageCd>PERLIAB</CoverageCd>
    <CoverageDesc>Personal Liability</CoverageDesc>
    <Limit>
      <FormatCurrency>${escapeXml(data.personal_liability || '100000')}</FormatCurrency>
      <LimitAppliesToCd>PerOcc</LimitAppliesToCd>
    </Limit>
  </Coverage>
  <Deductible>
    <FormatCurrency>${escapeXml(data.base_deductible || '1000')}</FormatCurrency>
    <DeductibleAppliesToCd>AllPeril</DeductibleAppliesToCd>
  </Deductible>`;

const generateAutoPolicy = (data: Record<string, any>, policyInfo: any) => `
  <PersAutoPolicyQuoteInqRq>
    <RqUID>${crypto.randomUUID()}</RqUID>
    <TransactionRequestDt>${new Date().toISOString().split('T')[0]}</TransactionRequestDt>
    <CurCd>USD</CurCd>
    <PersPolicy>
      <PolicyNumber>${escapeXml(policyInfo?.policy_number || '')}</PolicyNumber>
      <LOBCd>AUTOP</LOBCd>
      <ContractTerm>
        <EffectiveDt>${formatDate(data.effective_date)}</EffectiveDt>
        <ExpirationDt>${formatDate(data.expiration_date || policyInfo?.expiration_date)}</ExpirationDt>
      </ContractTerm>
    </PersPolicy>
    ${generateApplicantInfo(data)}
    ${generateDriverInfo(data)}
    ${generateVehicleInfo(data)}
    <PersAutoLineBusiness>
      ${generateAutoCoverages(data)}
    </PersAutoLineBusiness>
  </PersAutoPolicyQuoteInqRq>`;

const generateHomePolicy = (data: Record<string, any>, policyInfo: any) => `
  <HomePolicyQuoteInqRq>
    <RqUID>${crypto.randomUUID()}</RqUID>
    <TransactionRequestDt>${new Date().toISOString().split('T')[0]}</TransactionRequestDt>
    <CurCd>USD</CurCd>
    <HomePolicy>
      <PolicyNumber>${escapeXml(policyInfo?.policy_number || '')}</PolicyNumber>
      <LOBCd>HOME</LOBCd>
      <ContractTerm>
        <EffectiveDt>${formatDate(data.effective_date)}</EffectiveDt>
        <ExpirationDt>${formatDate(data.expiration_date || policyInfo?.expiration_date)}</ExpirationDt>
      </ContractTerm>
    </HomePolicy>
    ${generateApplicantInfo(data)}
    ${generatePropertyInfo(data)}
    ${generateHomeCoverages(data)}
  </HomePolicyQuoteInqRq>`;

const generateACORDXML = (submission: any, template: any, policy: any): string => {
  const data = submission.submission_data || {};
  const lineOfBusiness = template?.line_of_business || ['auto'];
  
  let policyContent = '';
  
  // Generate content based on line of business
  if (lineOfBusiness.includes('auto')) {
    policyContent += generateAutoPolicy(data, policy);
  }
  if (lineOfBusiness.includes('home') || lineOfBusiness.includes('dwelling')) {
    policyContent += generateHomePolicy(data, policy);
  }
  
  return `${generateACORDHeader()}
  <InsuranceSvcRq>
    <RqUID>${crypto.randomUUID()}</RqUID>
    ${policyContent}
  </InsuranceSvcRq>
</ACORD>`;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, format = 'xml' } = await req.json();
    
    console.log(`[EZLynx Export] Starting export for submission: ${submissionId}, format: ${format}`);
    
    if (!submissionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Submission ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch submission with related data
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .select(`
        *,
        template:form_templates(*),
        policy:policies(*)
      `)
      .eq('id', submissionId)
      .maybeSingle();

    if (submissionError) {
      console.error('[EZLynx Export] Error fetching submission:', submissionError);
      throw new Error(`Failed to fetch submission: ${submissionError.message}`);
    }

    if (!submission) {
      return new Response(
        JSON.stringify({ success: false, error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EZLynx Export] Submission found, generating ACORD XML...');

    // Generate ACORD XML
    const acordXml = generateACORDXML(submission, submission.template, submission.policy);

    console.log('[EZLynx Export] ACORD XML generated successfully');

    // Return based on format
    if (format === 'xml') {
      return new Response(acordXml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="ACORD_Export_${submissionId}.xml"`,
        },
      });
    }

    // For JSON format (useful for debugging or further processing)
    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        xml: acordXml,
        metadata: {
          templateName: submission.template?.name,
          lineOfBusiness: submission.template?.line_of_business,
          submittedAt: submission.submitted_at,
          policyNumber: submission.policy?.policy_number,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EZLynx Export] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});