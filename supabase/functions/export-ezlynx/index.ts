import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

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

const formatDisplayDate = (date: string | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

// PDF Generation Functions
const generateACORDPDF = async (submission: any, template: any, policy: any): Promise<Uint8Array> => {
  const data = submission.submission_data || {};
  const lineOfBusiness = template?.line_of_business || ['auto'];
  
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  let yPos = height - 50;
  
  const drawText = (text: string, x: number, y: number, font = helvetica, size = 10) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  };
  
  const drawSectionHeader = (title: string, y: number): number => {
    page.drawRectangle({
      x: 40,
      y: y - 5,
      width: width - 80,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });
    drawText(title, 45, y, helveticaBold, 11);
    return y - 30;
  };
  
  const drawLabelValue = (label: string, value: string | null | undefined, x: number, y: number): number => {
    drawText(label + ':', x, y, helveticaBold, 9);
    drawText(value || 'N/A', x + 120, y, helvetica, 9);
    return y - 15;
  };
  
  const checkPageBreak = (currentY: number, neededSpace: number = 100): number => {
    if (currentY < neededSpace) {
      page = pdfDoc.addPage([612, 792]);
      return height - 50;
    }
    return currentY;
  };

  // Header
  page.drawRectangle({
    x: 40,
    y: yPos - 10,
    width: width - 80,
    height: 35,
    color: rgb(0.2, 0.3, 0.5),
  });
  drawText('ACORD INSURANCE APPLICATION', 45, yPos, helveticaBold, 14);
  page.drawText('ACORD INSURANCE APPLICATION', { x: 45, y: yPos, size: 14, font: helveticaBold, color: rgb(1, 1, 1) });
  yPos -= 20;
  page.drawText(`Generated: ${new Date().toLocaleDateString()}`, { x: 45, y: yPos, size: 9, font: helvetica, color: rgb(1, 1, 1) });
  page.drawText(`Policy #: ${policy?.policy_number || 'N/A'}`, { x: 350, y: yPos, size: 9, font: helvetica, color: rgb(1, 1, 1) });
  yPos -= 40;

  // Agency Information
  yPos = drawSectionHeader('AGENCY INFORMATION', yPos);
  yPos = drawLabelValue('Agency', data.agency_name || policy?.company_name, 50, yPos);
  yPos = drawLabelValue('Agent Name', `${policy?.agent_first_name || ''} ${policy?.agent_last_name || ''}`.trim() || data.agent_name, 50, yPos);
  yPos = drawLabelValue('Agent Email', policy?.agent_email || data.agent_email, 50, yPos);
  yPos -= 15;

  // Applicant Information
  yPos = checkPageBreak(yPos);
  yPos = drawSectionHeader('APPLICANT INFORMATION', yPos);
  yPos = drawLabelValue('Full Name', `${data.applicant_first_name || ''} ${data.applicant_middle_name || ''} ${data.applicant_last_name || ''}`.trim(), 50, yPos);
  yPos = drawLabelValue('Date of Birth', formatDisplayDate(data.date_of_birth), 50, yPos);
  yPos = drawLabelValue('SSN (Last 4)', data.ssn ? `***-**-${data.ssn.slice(-4)}` : 'N/A', 50, yPos);
  yPos = drawLabelValue('Gender', data.gender, 50, yPos);
  yPos = drawLabelValue('Marital Status', data.marital_status, 50, yPos);
  yPos = drawLabelValue('Occupation', data.occupation, 50, yPos);
  yPos -= 10;
  
  // Contact Information
  yPos = drawLabelValue('Primary Phone', data.primary_phone, 50, yPos);
  yPos = drawLabelValue('Email', data.email, 50, yPos);
  yPos -= 10;
  
  // Mailing Address
  yPos = drawLabelValue('Mailing Address', data.mailing_address, 50, yPos);
  yPos = drawLabelValue('City, State ZIP', `${data.mailing_city || ''}, ${data.mailing_state || ''} ${data.mailing_zip || ''}`, 50, yPos);
  yPos -= 15;

  // Vehicle Information (if Auto)
  if (lineOfBusiness.includes('auto')) {
    yPos = checkPageBreak(yPos);
    yPos = drawSectionHeader('VEHICLE INFORMATION', yPos);
    yPos = drawLabelValue('Year/Make/Model', `${data.vehicle_year || ''} ${data.vehicle_make || ''} ${data.vehicle_model || ''}`.trim(), 50, yPos);
    yPos = drawLabelValue('VIN', data.vin, 50, yPos);
    yPos = drawLabelValue('Body Type', data.body_type, 50, yPos);
    yPos = drawLabelValue('Vehicle Use', data.vehicle_use, 50, yPos);
    yPos = drawLabelValue('Annual Mileage', data.annual_mileage, 50, yPos);
    yPos -= 10;
    
    // Driver Information
    yPos = drawLabelValue('License Number', data.drivers_license_number, 50, yPos);
    yPos = drawLabelValue('License State', data.license_state, 50, yPos);
    yPos = drawLabelValue('Date Licensed', formatDisplayDate(data.date_licensed), 50, yPos);
    yPos -= 15;

    // Auto Coverages
    yPos = checkPageBreak(yPos);
    yPos = drawSectionHeader('AUTO COVERAGE INFORMATION', yPos);
    yPos = drawLabelValue('Bodily Injury Limit', `$${data.bi_limit || '100,000'}`, 50, yPos);
    yPos = drawLabelValue('Property Damage Limit', `$${data.pd_limit || '50,000'}`, 50, yPos);
    yPos = drawLabelValue('Comprehensive Deductible', `$${data.comp_deductible || '500'}`, 50, yPos);
    yPos = drawLabelValue('Collision Deductible', `$${data.coll_deductible || '500'}`, 50, yPos);
    yPos = drawLabelValue('Uninsured Motorist', `$${data.um_limit || 'N/A'}`, 50, yPos);
    yPos -= 15;
  }

  // Property Information (if Home/Dwelling)
  if (lineOfBusiness.includes('home') || lineOfBusiness.includes('dwelling')) {
    yPos = checkPageBreak(yPos);
    yPos = drawSectionHeader('PROPERTY INFORMATION', yPos);
    yPos = drawLabelValue('Property Address', data.property_address || data.mailing_address, 50, yPos);
    yPos = drawLabelValue('City, State ZIP', `${data.property_city || data.mailing_city || ''}, ${data.property_state || data.mailing_state || ''} ${data.property_zip || data.mailing_zip || ''}`, 50, yPos);
    yPos = drawLabelValue('Year Built', data.year_built, 50, yPos);
    yPos = drawLabelValue('Construction Type', data.construction_type, 50, yPos);
    yPos = drawLabelValue('Roof Material', data.roof_material, 50, yPos);
    yPos = drawLabelValue('Square Footage', data.square_footage, 50, yPos);
    yPos = drawLabelValue('# of Stories', data.num_stories, 50, yPos);
    yPos = drawLabelValue('# of Bedrooms', data.num_rooms, 50, yPos);
    yPos = drawLabelValue('# of Bathrooms', data.num_bathrooms, 50, yPos);
    yPos -= 15;

    // Home Coverages
    yPos = checkPageBreak(yPos);
    yPos = drawSectionHeader('HOME COVERAGE INFORMATION', yPos);
    yPos = drawLabelValue('Dwelling Coverage', `$${data.dwelling_coverage || '250,000'}`, 50, yPos);
    yPos = drawLabelValue('Other Structures', `$${data.other_structures_coverage || '25,000'}`, 50, yPos);
    yPos = drawLabelValue('Personal Property', `$${data.personal_property_coverage || '125,000'}`, 50, yPos);
    yPos = drawLabelValue('Loss of Use', `$${data.loss_of_use_coverage || '50,000'}`, 50, yPos);
    yPos = drawLabelValue('Personal Liability', `$${data.personal_liability || '100,000'}`, 50, yPos);
    yPos = drawLabelValue('Deductible', `$${data.base_deductible || '1,000'}`, 50, yPos);
    yPos -= 15;
  }

  // Underwriting Questions
  yPos = checkPageBreak(yPos, 150);
  yPos = drawSectionHeader('UNDERWRITING QUESTIONS', yPos);
  const underwritingQuestions = [
    { q: 'Prior insurance cancelled/declined?', a: data.prior_cancelled },
    { q: 'Any losses in past 5 years?', a: data.prior_losses },
    { q: 'Any violations in past 3 years?', a: data.violations },
    { q: 'Currently insured?', a: data.currently_insured },
  ];
  
  for (const item of underwritingQuestions) {
    yPos = checkPageBreak(yPos, 20);
    yPos = drawLabelValue(item.q, item.a === true ? 'Yes' : item.a === false ? 'No' : 'N/A', 50, yPos);
  }
  yPos -= 20;

  // Footer
  yPos = checkPageBreak(yPos, 80);
  page.drawLine({
    start: { x: 40, y: yPos },
    end: { x: width - 40, y: yPos },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPos -= 20;
  drawText('Applicant Signature: _______________________________', 50, yPos, helvetica, 9);
  drawText('Date: _______________', 400, yPos, helvetica, 9);
  yPos -= 30;
  drawText('Agent Signature: _______________________________', 50, yPos, helvetica, 9);
  drawText('Date: _______________', 400, yPos, helvetica, 9);
  yPos -= 30;
  drawText(`Document ID: ${submission.id} | Generated by Policy Renewal Hub`, 50, yPos, helvetica, 8);

  return await pdfDoc.save();
};

// Email PDF to Agent using Composio
const emailPDFToAgent = async (pdfBytes: Uint8Array, submission: any, policy: any, agentEmail: string): Promise<{ success: boolean; message: string }> => {
  const composioApiKey = Deno.env.get('COMPOSIO_API_KEY');
  
  if (!composioApiKey) {
    console.log('[EZLynx Export] COMPOSIO_API_KEY not configured, skipping email');
    return { success: false, message: 'Email service not configured. Please download the PDF instead.' };
  }

  try {
    // Convert PDF to base64
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    const clientName = `${submission.submission_data?.applicant_first_name || ''} ${submission.submission_data?.applicant_last_name || ''}`.trim() || 'Client';
    const policyNumber = policy?.policy_number || 'N/A';
    
    // Call Composio API to send email
    const response = await fetch('https://backend.composio.dev/api/v1/actions/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': composioApiKey,
      },
      body: JSON.stringify({
        actionName: 'outlook_send_email',
        input: {
          to: agentEmail,
          subject: `ACORD Application - ${clientName} (Policy: ${policyNumber})`,
          body: `Please find attached the ACORD Insurance Application for:\n\nClient: ${clientName}\nPolicy Number: ${policyNumber}\nGenerated: ${new Date().toLocaleDateString()}\n\nThis document was generated from Policy Renewal Hub and is ready for EZLynx import.\n\nBest regards,\nPolicy Renewal Hub`,
          attachments: [{
            name: `ACORD_Application_${submission.id.substring(0, 8)}.pdf`,
            contentType: 'application/pdf',
            content: pdfBase64,
          }],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EZLynx Export] Email send failed:', errorText);
      return { success: false, message: 'Failed to send email. Please download the PDF instead.' };
    }

    console.log('[EZLynx Export] Email sent successfully to:', agentEmail);
    return { success: true, message: `PDF sent to ${agentEmail}` };
  } catch (error) {
    console.error('[EZLynx Export] Email error:', error);
    return { success: false, message: 'Email service error. Please download the PDF instead.' };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, format = 'xml', emailToAgent = false, agentEmail } = await req.json();
    
    console.log(`[EZLynx Export] Starting export for submission: ${submissionId}, format: ${format}, emailToAgent: ${emailToAgent}`);
    
    if (!submissionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Submission ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log('[EZLynx Export] Submission found, generating export...');

    // Handle PDF format
    if (format === 'pdf') {
      const pdfBytes = await generateACORDPDF(submission, submission.template, submission.policy);
      
      // If email requested, send it
      if (emailToAgent && agentEmail) {
        const emailResult = await emailPDFToAgent(pdfBytes, submission, submission.policy, agentEmail);
        return new Response(
          JSON.stringify({ success: emailResult.success, message: emailResult.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Otherwise return PDF for download
      console.log('[EZLynx Export] PDF generated successfully');
      return new Response(pdfBytes.buffer as ArrayBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ACORD_Application_${submissionId.substring(0, 8)}.pdf"`,
        },
      });
    }

    // Handle XML format
    const acordXml = generateACORDXML(submission, submission.template, submission.policy);
    console.log('[EZLynx Export] ACORD XML generated successfully');

    if (format === 'xml') {
      return new Response(acordXml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="ACORD_Export_${submissionId}.xml"`,
        },
      });
    }

    // JSON format for debugging
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
