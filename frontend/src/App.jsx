import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { canAccess } from "./config/permissions";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Visits from "./pages/Visits";
import MedicalRecords from "./pages/MedicalRecords";
import MedicalActions from "./pages/MedicalActions";
import Pharmacy from "./pages/Pharmacy";
import Laboratory from "./pages/Laboratory";
import Finance from "./pages/Finance";

function RoleRoute({ module, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(user, module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route
                path="/patients"
                element={
                  <RoleRoute module="patients">
                    <Patients />
                  </RoleRoute>
                }
              />

              <Route
                path="/visits"
                element={
                  <RoleRoute module="visits">
                    <Visits />
                  </RoleRoute>
                }
              />

              <Route
                path="/medical-records"
                element={
                  <RoleRoute module="medicalRecords">
                    <MedicalRecords />
                  </RoleRoute>
                }
              />

              <Route
                path="/medical-actions"
                element={
                  <RoleRoute module="medicalActions">
                    <MedicalActions />
                  </RoleRoute>
                }
              />

              <Route
                path="/pharmacy"
                element={
                  <RoleRoute module="pharmacy">
                    <Pharmacy />
                  </RoleRoute>
                }
              />

              <Route
                path="/laboratory"
                element={
                  <RoleRoute module="laboratory">
                    <Laboratory />
                  </RoleRoute>
                }
              />

              <Route
                path="/finance"
                element={
                  <RoleRoute module="finance">
                    <Finance />
                  </RoleRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
