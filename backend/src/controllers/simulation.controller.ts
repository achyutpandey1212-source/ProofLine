import { Request, Response, NextFunction } from "express";
import { SimulationService, SimulationScenario } from "../services/simulation.service";
import { AppError } from "../middleware/error.middleware";

export class SimulationController {
  /**
   * POST /cases/:caseId/simulate
   * Runs an isolated adversarial simulation without persisting changes to MongoDB.
   */
  public static async simulate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params.caseId as string;
      const { scenario } = req.body as { scenario: SimulationScenario };

      const validScenarios: SimulationScenario[] = [
        "WEIGHT_MISMATCH",
        "INVOICE_MISMATCH",
        "TRANSACTION_MISMATCH",
        "EVIDENCE_INCONSISTENCY",
      ];

      if (!scenario || !validScenarios.includes(scenario)) {
        throw new AppError(
          `Invalid simulation scenario. Must be one of: ${validScenarios.join(", ")}`,
          400,
          "INVALID_SCENARIO"
        );
      }

      const simulationResult = await SimulationService.runSimulation({
        userId: user.userDoc._id,
        caseIdOrMongoId,
        scenario,
      });

      res.status(200).json({
        success: true,
        data: simulationResult,
      });
    } catch (error) {
      next(error);
    }
  }
}
