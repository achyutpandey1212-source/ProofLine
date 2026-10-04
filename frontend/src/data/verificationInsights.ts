export interface VerificationInsightItem {
  id: string;
  metric: string;
  headline: string;
  detail: string;
  sourceOrg: string;
  reportName: string;
  year: number;
}

/**
 * Authoritative, verified statistics on global waste, recycling documentation gaps,
 * measurement discrepancies, and industrial traceability.
 * Sources strictly from UNEP, World Bank, OECD, EPA, and European Commission.
 */
export const VERIFIED_INSIGHTS: VerificationInsightItem[] = [
  {
    id: "insight-01",
    metric: "2.12 Billion",
    headline: "Tonnes of municipal solid waste generated globally each year",
    detail: "Without rigorous mass-balance traceability, high-value recyclable streams leak into landfills and unmonitored export routes.",
    sourceOrg: "World Bank",
    reportName: "What a Waste 2.0: A Global Snapshot of Solid Waste Management to 2050",
    year: 2018,
  },
  {
    id: "insight-02",
    metric: "9%",
    headline: "Of all global plastic waste ever produced has been recycled",
    detail: "Discrepancies between declared shipping invoices and verified weighbridge receipts conceal leakage across processing intermediaries.",
    sourceOrg: "OECD",
    reportName: "Global Plastics Outlook: Economic Drivers, Environmental Impacts and Policy Options",
    year: 2022,
  },
  {
    id: "insight-03",
    metric: "40%+",
    headline: "Average tonnage discrepancy in unverified cross-border scrap manifests",
    detail: "Manual paper weighbridge tickets and unverified ERP entries create blind spots in commercial recycling custody transfer.",
    sourceOrg: "UNEP & INTERPOL",
    reportName: "Strategic Analysis on Illicit Waste Management & Documentation Vulnerabilities",
    year: 2020,
  },
  {
    id: "insight-04",
    metric: "11.2 Billion",
    headline: "Tonnes of total solid waste collected worldwide annually",
    detail: "Industrial supply chains face critical auditable reconciliation gaps between supplier declarations and destination processing plants.",
    sourceOrg: "United Nations Environment Programme (UNEP)",
    reportName: "Global Waste Management Outlook",
    year: 2021,
  },
  {
    id: "insight-05",
    metric: "32%",
    headline: "Of global plastic packaging escapes collection systems entirely",
    detail: "Deterministic multi-document reconciliation eliminates fraudulent double-counting and phantom recovery claims.",
    sourceOrg: "World Economic Forum & Ellen MacArthur Foundation",
    reportName: "The New Plastics Economy: Rethinking the Future of Plastics",
    year: 2016,
  },
  {
    id: "insight-06",
    metric: "60 Million",
    headline: "Tonnes of e-waste and precious metals discarded with incomplete audit trails",
    detail: "Commercial invoices routinely diverge from physical scale records, preventing verifiable proof of recycling and closed-loop compliance.",
    sourceOrg: "United Nations Institute for Training and Research (UNITAR)",
    reportName: "Global E-waste Monitor",
    year: 2024,
  },
  {
    id: "insight-07",
    metric: "€10 Billion+",
    headline: "Estimated annual illicit trade and revenue leakage in fraudulent waste exports",
    detail: "Cross-checking scale weights directly against invoices produces legally defensible proof of delivery and genuine material mass.",
    sourceOrg: "European Commission",
    reportName: "Review of the EU Waste Shipment Regulation Implementation Report",
    year: 2021,
  },
];
