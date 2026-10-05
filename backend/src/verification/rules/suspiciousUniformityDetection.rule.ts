import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";

/**
 * Rule: SUSPICIOUS_UNIFORMITY_DETECTION
 * Detects suspicious uniformity or measurement recycling across supposedly separate weighings:
 * 1. Duplicate ticket or weighbridge receipt numbers across separate scale slips.
 * 2. Unusually identical decimal weights (e.g. three truckloads weighing exactly 184.62 kg each).
 *
 * Product Principle:
 * "Treat this as a risk signal / integrity anomaly that makes a claim unsafe to approve,
 * not definitive proof of fraud."
 */
export class SuspiciousUniformityDetectionRule implements VerificationRule {
  public readonly ruleId = "SUSPICIOUS_UNIFORMITY_DETECTION";
  public readonly name = "Measurement Uniformity & Ticket Integrity";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const scaleEvidence = context.evidenceDocs.filter((e) => e.type === "SCALE_IMAGE");

    if (scaleEvidence.length < 2) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: scaleEvidence.map((e) => e.evidenceId),
          message: "Single or no scale evidence submitted; uniformity analysis not applicable.",
        },
      };
    }

    // 1. Check for duplicate ticket / slip numbers across separate scale images
    const ticketNumbers = new Map<string, string>(); // ticketNo -> evidenceId
    const duplicateTickets: { ticketNo: string; evidenceId1: string; evidenceId2: string }[] = [];

    for (const sc of scaleEvidence) {
      const data = sc.extraction?.data as Record<string, unknown> | undefined;
      const ticketNo =
        (data?.ticketNumber as string) ||
        (data?.slipNumber as string) ||
        (data?.receiptNumber as string) ||
        (data?.scaleId as string);

      if (ticketNo && typeof ticketNo === "string" && ticketNo.trim().length > 1) {
        const cleanNo = ticketNo.trim().toUpperCase();
        if (ticketNumbers.has(cleanNo)) {
          duplicateTickets.push({
            ticketNo: cleanNo,
            evidenceId1: ticketNumbers.get(cleanNo)!,
            evidenceId2: sc.evidenceId,
          });
        } else {
          ticketNumbers.set(cleanNo, sc.evidenceId);
        }
      }
    }

    if (duplicateTickets.length > 0) {
      const dupeTicket = duplicateTickets[0]!;
      const involvedIds = [dupeTicket.evidenceId1, dupeTicket.evidenceId2];

      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "FAIL",
          severity: "HIGH",
          evidenceIds: involvedIds,
          values: { duplicateTickets },
          message: `Reused weighbridge ticket identifier '${dupeTicket.ticketNo}' detected across separate scale submissions (${involvedIds.join(", ")}).`,
        },
        finding: {
          findingId: generateFindingId(),
          ruleId: this.ruleId,
          type: "REUSED_TICKET_IDENTIFIER",
          severity: "HIGH",
          title: "Reused Weighbridge Ticket Identifier",
          description: `Scale submissions ${involvedIds.join(" and ")} cite the identical weighbridge ticket number '${dupeTicket.ticketNo}'. In physical operations, each distinct consignment load is assigned a unique sequential ticket.`,
          evidenceIds: involvedIds,
          recommendedAction: "Request sequential tare/gross weighbridge slips with distinct consignment identifiers.",
        },
      };
    }

    // 2. Check for suspicious exact decimal weights across supposedly distinct loads
    // In recycling (bulk plastic, scrap), weights have natural variance (decimals fluctuate).
    // Multiple weighings with exact identical decimal figures (e.g. 184.60 kg, 184.60 kg) indicates possible slip duplication.
    const weightsSeen = new Map<number, string[]>(); // weight -> evidenceIds

    for (const sc of scaleEvidence) {
      const data = sc.extraction?.data as Record<string, unknown> | undefined;
      const weight = data?.weight as number | undefined;

      if (typeof weight === "number" && weight > 0) {
        const rounded = Math.round(weight * 100) / 100;
        const currentList = weightsSeen.get(rounded) || [];
        currentList.push(sc.evidenceId);
        weightsSeen.set(rounded, currentList);
      }
    }

    const clonedWeights = Array.from(weightsSeen.entries()).filter(
      ([, ids]) => ids.length >= 2
    );

    // If 2+ scale tickets have the EXACT same non-integer weight (e.g. 184.6 kg)
    const exactClonedNonInteger = clonedWeights.find(
      ([wt]) => wt % 1 !== 0 // non-integer (has decimals)
    );

    if (exactClonedNonInteger) {
      const [weightVal, ids] = exactClonedNonInteger;
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "WARNING",
          severity: "MEDIUM",
          evidenceIds: ids,
          values: { clonedWeight: weightVal, evidenceIds: ids },
          message: `Suspicious identical decimal measurement (${weightVal} kg) recorded across ${ids.length} separate scale slips (${ids.join(", ")}).`,
        },
        finding: {
          findingId: generateFindingId(),
          ruleId: this.ruleId,
          type: "SUSPICIOUS_MEASUREMENT_UNIFORMITY",
          severity: "MEDIUM",
          title: "Identical Weighbridge Measurements Detected",
          description: `Multiple scale tickets (${ids.join(", ")}) report the exact same weight (${weightVal} kg) down to decimal precision. In physical scrap consignments, natural moisture and packing variance typically prevent identical weight decimals across independent truckloads.`,
          evidenceIds: ids,
          recommendedAction: "Inspect original scale displays to verify if the same physical load was photographed multiple times.",
        },
      };
    }

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "PASS",
        severity: "LOW",
        evidenceIds: scaleEvidence.map((e) => e.evidenceId),
        message: "Weighbridge tickets have distinct sequential identifiers and expected physical variance.",
      },
    };
  }
}
