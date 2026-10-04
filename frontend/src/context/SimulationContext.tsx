import React, { createContext, useContext, useState, useCallback } from "react";
import { SimulationResultDto, SimulationScenario } from "../types";
import { VerificationClientService } from "../services/verification.service";

interface SimulationContextType {
  isSimulating: boolean;
  activeScenario: SimulationScenario | null;
  simulationResult: SimulationResultDto | null;
  isRunningSimulation: boolean;
  simulationError: string | null;
  startSimulation: (caseId: string, scenario: SimulationScenario) => Promise<SimulationResultDto>;
  exitSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType>({
  isSimulating: false,
  activeScenario: null,
  simulationResult: null,
  isRunningSimulation: false,
  simulationError: null,
  startSimulation: async () => {
    throw new Error("SimulationContext not mounted");
  },
  exitSimulation: () => {},
});

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResultDto | null>(null);
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const startSimulation = useCallback(
    async (caseId: string, scenario: SimulationScenario): Promise<SimulationResultDto> => {
      try {
        setIsRunningSimulation(true);
        setSimulationError(null);
        const result = await VerificationClientService.runSimulation(caseId, scenario);
        setActiveScenario(scenario);
        setSimulationResult(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to run simulation.";
        setSimulationError(msg);
        throw err;
      } finally {
        setIsRunningSimulation(false);
      }
    },
    []
  );

  const exitSimulation = useCallback(() => {
    setActiveScenario(null);
    setSimulationResult(null);
    setSimulationError(null);
    setIsRunningSimulation(false);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        isSimulating: simulationResult !== null,
        activeScenario,
        simulationResult,
        isRunningSimulation,
        simulationError,
        startSimulation,
        exitSimulation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
