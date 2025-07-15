import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Analysis from "./pages/VaccineList";
import Dashboard from "./pages/Dashboard";
import PatientList from "./pages/PatientList";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorPatientList from "./pages/DoctorPatientList";
import PatientVaccineTracker from './pages/PatientVaccineTracker';
import VaccineList from './pages/VaccineList';
import AuditLogTable from './pages/AuditLogTable';
import FamilyPlanningList from './pages/FamilyPlanningList';

function App() {
  return (
    <>
    <BrowserRouter>
      <div className="d-flex min-vh-100">
        <div className="col-md-3 col-lg-2 sidebar">
          <Sidebar />
        </div>
        <div className="col-md-9 col-lg-10">
          <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patientlist" element={<PatientList />} />
              <Route path="/patient-vaccine-tracker" element={<PatientVaccineTracker />} />
              <Route path="/vaccinelist" element={<VaccineList />} />
              <Route path="/family-planning-list" element={<FamilyPlanningList />} />
            </Routes>
          </div>
        </div>        
    </BrowserRouter>
    </>
  );
}

export default App;
