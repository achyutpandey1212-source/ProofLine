import { EvidenceType } from "../models/evidence.model";

export const getExtractionSystemInstruction = (_evidenceType: EvidenceType): string => {
  return `You are Proofline's specialized multimodal evidence extraction system.
Your mission is to perform strictly factual extraction of structured data from untrusted visual/document evidence.

CRITICAL RULES:
1. STRICTLY NO GUESSING OR HALLUCINATION:
   - Extract only what is clearly, legibly visible in the document or image.
   - If a field is illegible, partially obscured, ambiguous, or absent, set its value to null.
   - Never guess numbers, identifiers, entities, or dates.
2. UNCERTAINTY & OBSERVATIONS:
   - Provide an overall extraction confidence between 0.0 and 1.0 based solely on image clarity and legibility.
   - Record specific uncertainty notices or visual defects in the warnings array (e.g. "Scale display partially obscured", "Date blurred").
3. DO NOT PERFORM VERIFICATION OR BUSINESS DECISIONS:
   - Do NOT compare with other documents.
   - Do NOT calculate differences, percentages, or fraud verdicts.
   - Simply extract the factual content present in THIS piece of evidence.
4. RETURN FORMAT:
   - Return valid JSON matching the exact schema requested without markdown ticks, explanations, or extraneous text.`;
};

export const getExtractionPromptForType = (evidenceType: EvidenceType): string => {
  switch (evidenceType) {
    case "SCALE_IMAGE":
      return `Analyze this weighing scale photograph or weighbridge ticket/slip and extract the visible scale or net weight readings.
CRITICAL FOR WEIGHBRIDGE TICKETS:
- Look for the printed "Net Weight" or "Net Wt" line on the ticket (e.g. 184.60, 184.50, 186.50 kg).
- Always extract the explicit printed Net Weight value directly as a floating-point numeric value (e.g. 184.6, 184.5, 186.5).
- Do NOT calculate gross minus tare or drop decimal points when an explicit printed Net Weight line appears on the slip.
- The weight must reflect the actual net cargo weight in decimal kilograms (e.g. 186.5, NOT 18650).

Target JSON Schema:
{
  "weight": number | null,            // Numeric net weight value (e.g. 186.5)
  "unit": string | null,              // Unit shown (e.g. "kg", "lbs", "g")
  "date": string | null,              // Visible date string if display shows it (YYYY-MM-DD), otherwise null
  "time": string | null,              // Visible time string if display shows it (HH:MM:SS), otherwise null
  "scaleIdentifier": string | null,   // Any visible scale ID or serial number, otherwise null
  "visibleText": string | null,       // Any secondary text or indicators shown on the display
  "confidence": number,               // 0.0 to 1.0 (legibility confidence)
  "warnings": string[]                // List of clarity issues, obstructions, or glare
}`;

    case "INVOICE":
      return `Analyze this invoice document and extract the factual transaction and commercial fields.

Target JSON Schema:
{
  "invoiceNumber": string | null,      // Visible invoice identifier (e.g. "INV-104")
  "invoiceDate": string | null,        // Invoice issue date (YYYY-MM-DD or visible format)
  "sellerName": string | null,         // Seller or recycler business entity name
  "buyerName": string | null,          // Buyer or recipient business entity name
  "materialDescription": string | null,// Description of material (e.g. "PET Plastic Flakes")
  "quantity": number | null,           // Invoiced quantity as a numeric value
  "quantityUnit": string | null,       // Unit of quantity (e.g. "kg", "tonnes")
  "transactionValue": number | null,   // Total transaction amount
  "currency": string | null,           // Currency symbol or code (e.g. "INR", "USD")
  "transactionId": string | null,      // Internal or reference transaction ID if present
  "confidence": number,                // 0.0 to 1.0
  "warnings": string[]
}`;

    case "RECEIPT":
      return `Analyze this receipt document and extract the transaction details.

Target JSON Schema:
{
  "receiptNumber": string | null,      // Visible receipt number
  "date": string | null,               // Receipt date (YYYY-MM-DD or visible format)
  "sellerName": string | null,         // Vendor / recycler name
  "buyerName": string | null,          // Customer name
  "materialDescription": string | null,// Material description
  "quantity": number | null,           // Quantity number
  "quantityUnit": string | null,       // Unit (e.g. "kg")
  "amount": number | null,             // Monetary amount
  "currency": string | null,           // Currency code
  "confidence": number,                // 0.0 to 1.0
  "warnings": string[]
}`;

    case "CERTIFICATE":
      return `Analyze this recycling / processing certificate document and extract the certified details.
Note: For Certificate of Analysis / Quality, the overall certified shipment batch quantity may not be specified (only sample quantity). If the total certified consignment/shipment quantity is not explicitly stated, quantity should be null.

Target JSON Schema:
{
  "certificateNumber": string | null,  // Visible certificate identifier
  "issuerName": string | null,         // Issuing authority or certifying agency
  "holderName": string | null,         // Certificate recipient or facility name
  "issueDate": string | null,          // Date of issuance
  "validUntil": string | null,         // Expiration / validity date
  "materialDescription": string | null,// Certified material category
  "quantity": number | null,           // Certified quantity (null if only sample quantity shown)
  "quantityUnit": string | null,       // Certified quantity unit
  "transactionId": string | null,      // Cross-referenced transaction ID if noted
  "confidence": number,                // 0.0 to 1.0
  "warnings": string[]
}`;

    case "MATERIAL_IMAGE":
      return `Analyze this photograph of physical materials and extract visible observations.

Target JSON Schema:
{
  "materialType": string | null,       // Apparent material category (e.g. "Plastic bottles", "Scrap metal")
  "visibleQuantity": string | null,    // Qualitative description (e.g. "Baled stacks", "Loose bulk")
  "packagingType": string | null,      // Packaging observed (e.g. "Bales", "Bags", "Container")
  "observations": string[],            // Factual visible attributes (color, state, condition)
  "confidence": number,                // 0.0 to 1.0
  "warnings": string[]
}`;

    case "DOCUMENT":
    case "VIDEO":
    case "OTHER":
    default:
      return `Analyze this supporting document and extract key general reference fields.

Target JSON Schema:
{
  "documentTitle": string | null,      // Header or title of the document
  "documentDate": string | null,       // Date on document
  "issuerName": string | null,         // Issuing company or party
  "referenceNumber": string | null,    // Reference or tracking number
  "extractedText": string | null,      // Brief summary of essential factual content
  "confidence": number,                // 0.0 to 1.0
  "warnings": string[]
}`;
  }
};
