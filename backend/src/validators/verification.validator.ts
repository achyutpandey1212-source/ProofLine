import { z } from "zod";

export const verifyCaseParamSchema = z.object({
  caseId: z.string().trim().min(1, "Case identifier is required"),
});
