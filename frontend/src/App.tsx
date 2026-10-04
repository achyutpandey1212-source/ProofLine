import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { CasesListPage } from "./pages/CasesListPage";
import { CreateCasePage } from "./pages/CreateCasePage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { VerificationFlowPage } from "./pages/VerificationFlowPage";
import { VerificationReportPage } from "./pages/VerificationReportPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <CasesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/new"
            element={
              <ProtectedRoute>
                <CreateCasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:caseId"
            element={
              <ProtectedRoute>
                <CaseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:caseId/verify"
            element={
              <ProtectedRoute>
                <VerificationFlowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:caseId/verification"
            element={
              <ProtectedRoute>
                <VerificationReportPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
