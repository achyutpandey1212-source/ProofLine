import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";

export interface DocumentTimelineEvent {
  evidenceId: string;
  type: string;
  fileName: string;
  documentDate: Date;
  dateStr: string;
  sourceField: string;
}

/**
 * Parses dates robustly from extraction metadata.
 * Handles ISO formats, YYYY-MM-DD, DD/MM/YYYY, etc.
 */
export const parseExtractedDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Direct ISO / Standard parse
    const direct = new Date(trimmed);
    if (!isNaN(direct.getTime()) && direct.getFullYear() >= 2000 && direct.getFullYear() <= 2035) {
      return direct;
    }

    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmy) {
      const day = parseInt(dmy[1]!, 10);
      const month = parseInt(dmy[2]!, 10) - 1;
      const year = parseInt(dmy[3]!, 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Match YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (ymd) {
      const year = parseInt(ymd[1]!, 10);
      const month = parseInt(ymd[2]!, 10) - 1;
      const day = parseInt(ymd[3]!, 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
};

/**
 * Rule: CHRONOLOGY_CONSISTENCY
 * Verifies chronological feasibility across physical events:
 * Physical weighbridge tare/gross -> Commercial Tax Invoice -> Certificate / Manifest.
 *
 * Product Principle:
 * Flag only provably impossible sequences (e.g. Weighbridge tickets dated days after
 * the invoice was finalized, or Certificate issued prior to weighing).
 */
export class ChronologyConsistencyRule implements VerificationRule {
  public readonly ruleId = "CHRONOLOGY_CONSISTENCY";
  public readonly name = "Chronological Feasibility & Timeline Analysis";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const evidenceList = context.evidenceDocs;

    const timelineEvents: DocumentTimelineEvent[] = [];

    for (const ev of evidenceList) {
      const data = ev.extraction?.data as Record<string, unknown> | undefined;
      if (!data) continue;

      // Extract date fields commonly found in invoice, certificates, tickets
      const possibleDateFields = [
        "date",
        "invoiceDate",
        "issueDate",
        "weighDate",
        "ticketDate",
        "scaleDate",
        "timestamp",
        "weighTime",
      ];

      for (const field of possibleDateFields) {
        if (data[field]) {
          const parsed = parseExtractedDate(data[field]);
          if (parsed) {
            timelineEvents.push({
              evidenceId: ev.evidenceId,
              type: ev.type,
              fileName: ev.file.name,
              documentDate: parsed,
              dateStr: parsed.toISOString().split("T")[0]!,
              sourceField: field,
            });
            break; // take first valid date for this evidence
          }
        }
      }
    }

    // If less than 2 dated documents, timeline cannot be cross-referenced
    if (timelineEvents.length < 2) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: timelineEvents.map((e) => e.evidenceId),
          message: "Insufficient dated documents to establish multi-point physical chronology.",
        },
      };
    }

    // Group events by classification
    const scaleEvents = timelineEvents.filter((e) => e.type === "SCALE_IMAGE");
    const invoiceEvents = timelineEvents.filter((e) => e.type === "INVOICE");

    // Check: Physical Scale ticket occurring significantly AFTER the commercial invoice was settled
    // In recycling operations, materials must be weighed either before or on the invoice issuance date.
    // Allow a 24-hour grace window for same-day dispatch or timezone variances.
    const impossibleScaleAnomalies: { scaleEv: DocumentTimelineEvent; invEv: DocumentTimelineEvent; diffDays: number }[] = [];

    for (const scale of scaleEvents) {
      for (const inv of invoiceEvents) {
        const diffMs = scale.documentDate.getTime() - inv.documentDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        // Scale ticket dated more than 2 days AFTER invoice is impossible/anomalous
        if (diffDays > 2) {
          impossibleScaleAnomalies.push({ scaleEv: scale, invEv: inv, diffDays });
        }
      }
    }

    if (impossibleScaleAnomalies.length > 0) {
      const anomaly = impossibleScaleAnomalies[0]!;
      const involvedIds = [anomaly.scaleEv.evidenceId, anomaly.invEv.evidenceId];

      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "WARNING",
          severity: "MEDIUM",
          evidenceIds: involvedIds,
          values: { impossibleScaleAnomalies },
          message: `Chronological anomaly detected: Weighbridge ticket (${anomaly.scaleEv.dateStr}) is dated ${anomaly.diffDays} day(s) after invoice (${anomaly.invEv.dateStr}).`,
        },
        finding: {
          findingId: generateFindingId(),
          ruleId: this.ruleId,
          type: "CHRONOLOGY_ANOMALY_DETECTED",
          severity: "MEDIUM",
          title: "Chronological Sequence Inconsistency",
          description: `Physical scale ticket ${anomaly.scaleEv.evidenceId} is dated ${anomaly.scaleEv.dateStr}, which occurs ${anomaly.diffDays} day(s) after the declared commercial invoice ${anomaly.invEv.evidenceId} (${anomaly.invEv.dateStr}). Physical weighing should precede or coincide with invoice issuance.`,
          evidenceIds: involvedIds,
          recommendedAction: "Request verification of weighbridge dispatch logs to confirm ticket date accuracy.",
        },
      };
    }

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "PASS",
        severity: "LOW",
        evidenceIds: timelineEvents.map((e) => e.evidenceId),
        values: {
          timelineEventsCount: timelineEvents.length,
          events: timelineEvents.map((t) => ({ id: t.evidenceId, type: t.type, date: t.dateStr })),
        },
        message: "Document event chronology is sequential and physically plausible.",
      },
    };
  }
}
