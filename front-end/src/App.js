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
import BackupSystem from './components/BackupSystem';
import UserManagement from './pages/UserManagement';
import DiseaseAnalytics from './pages/DiseaseAnalytics';
import MissingDataPage from './pages/MissingDataPage';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, sidebarCollapsed, isMobile, mobileSidebarOpen } = useAuth();

  return (
    <div className="d-flex min-vh-100">
      {isAuthenticated() && (
        <div className={`
          sidebar-container 
          ${sidebarCollapsed ? 'collapsed' : ''} 
          ${isMobile ? 'mobile-hidden' : ''}
        `}>
          <Sidebar />
        </div>
      )}
      
      {/* Mobile Sidebar - Always render on mobile */}
      {isAuthenticated() && isMobile && (
        <div className="mobile-sidebar-wrapper">
          <Sidebar />
        </div>
      )}
      <div className={`
        main-content 
        ${isAuthenticated() ? (sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded') : 'no-sidebar'}
        ${isMobile ? 'mobile-full-width' : ''}
      `}>
        {isAuthenticated() && <Header />}
        <div className="content-wrapper">
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
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
          
          <Route path="/backup" element={
            <ProtectedRoute requiredPage="backup">
              <BackupSystem />
            </ProtectedRoute>
          } />
          
          <Route path="/user-management" element={
            <ProtectedRoute requiredPage="user-management">
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/register" element={
            <ProtectedRoute requiredPage="register">
              <Register />
            </ProtectedRoute>
          } />
          
          <Route path="/disease-analytics" element={
            <ProtectedRoute requiredPage="disease-analytics">
              <DiseaseAnalytics />
            </ProtectedRoute>
          } />
          
          <Route path="/missing-data" element={
            <ProtectedRoute requiredPage="missing-data">
              <MissingDataPage />
            </ProtectedRoute>
          } />
          
          {/* Redirect to login if not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
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