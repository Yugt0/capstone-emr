import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "./pages/Dashboard";
import PatientList from "./pages/PatientList";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorPatientList from "./pages/DoctorPatientList";
import PatientVaccineTracker from './pages/PatientVaccineTracker';
import VaccineList from './pages/VaccineList';
import ContraceptiveList from './pages/ContraceptiveList';
import AuditLogTable from './pages/AuditLogTable';
import FamilyPlanningList from './pages/FamilyPlanningList';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="d-flex min-vh-100">
      {isAuthenticated() && (
        <div className="col-md-3 col-lg-2 sidebar">
          <Sidebar />
        </div>
      )}
      <div className={isAuthenticated() ? "col-md-9 col-lg-10" : "col-12"}>
        {isAuthenticated() && <Header />}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute requiredPage="dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/patientlist" element={
            <ProtectedRoute requiredPage="patientlist">
              <PatientList />
            </ProtectedRoute>
          } />
          
          <Route path="/patient-vaccine-tracker" element={
            <ProtectedRoute requiredPage="patient-vaccine-tracker">
              <PatientVaccineTracker />
            </ProtectedRoute>
          } />
          
          <Route path="/vaccinelist" element={
            <ProtectedRoute requiredPage="vaccinelist">
              <VaccineList />
            </ProtectedRoute>
          } />
          
          <Route path="/contraceptive-list" element={
            <ProtectedRoute requiredPage="contraceptive-list">
              <ContraceptiveList />
            </ProtectedRoute>
          } />
          
          <Route path="/family-planning-list" element={
            <ProtectedRoute requiredPage="family-planning-list">
              <FamilyPlanningList />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor-patient-list" element={
            <ProtectedRoute requiredPage="doctor-patient-list">
              <DoctorPatientList />
            </ProtectedRoute>
          } />
          
          <Route path="/audit-log" element={
            <ProtectedRoute requiredPage="audit-log">
              <AuditLogTable />
            </ProtectedRoute>
          } />
          
          {/* Redirect to login if not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
