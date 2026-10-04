import { z } from "zod";

export const extractParamSchema = z.object({
  caseId: z.string().trim().min(1, "Case identifier is required"),
  evidenceId: z.string().trim().min(1, "Evidence identifier is required"),
});
