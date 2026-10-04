export interface VerificationConfig {
  /**
   * Allowed variance percentage between claimed and measured weight. Default: 2.0%
   */
  weightTolerancePercent: number;

  /**
   * Minimum extraction confidence required for reliable verification. Default: 0.75
   */
  minExtractionConfidence: number;

  /**
   * Variance percentage above which weight discrepancies become HIGH severity. Default: 10.0%
   */
  highRiskWeightDifferencePercent: number;
}

export const VERIFICATION_CONFIG: VerificationConfig = {
  weightTolerancePercent: 2.0,
  minExtractionConfidence: 0.75,
  highRiskWeightDifferencePercent: 10.0,
};
