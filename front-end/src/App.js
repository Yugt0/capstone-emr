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
import ContraceptiveList from './pages/ContraceptiveList';
import VaccineList from './pages/VaccineList';
import DoctorSidebar from './Sidebar-Doctor';
import MidwivesSidebar from './Sidebar-Midwives';
import ManagerSidebar from './Sidebar-Manager';
import NurseSidebar from './Sidebar-Nurse';
import AuditLogTable from './pages/AuditLogTable';

function App() {
  return (
    <>
    <AuditLogTable />

    {/* <BrowserRouter>
    <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter> */}

      {/* DOCTOR POV */}
      {/* <BrowserRouter>
      <div className="d-flex min-vh-100">
        <div className="col-md-3 col-lg-2 sidebar">
          <DoctorSidebar />
        </div>
        <div className="col-md-9 col-lg-10">
          <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/doctor-patient-list" element={<DoctorPatientList />} />
              <Route path="/patient-vaccine-tracker" element={<PatientVaccineTracker />} />
              </Routes>
          </div>
        </div>        
    </BrowserRouter> */}

    {/* MIDWIVES POV */}
    {/* <BrowserRouter>
      <div className="d-flex min-vh-100">
        <div className="col-md-3 col-lg-2 sidebar">
          <MidwivesSidebar />
        </div>
        <div className="col-md-9 col-lg-10">
          <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patientlist" element={<PatientList />} />
              <Route path="/contraceptive" element={<ContraceptiveList />} />
            </Routes>
          </div>
        </div>        
    </BrowserRouter> */}

    {/* NURSE POV */}
    {/* <BrowserRouter>
      <div className="d-flex min-vh-100">
        <div className="col-md-3 col-lg-2 sidebar">
          <NurseSidebar />
        </div>
        <div className="col-md-9 col-lg-10">
          <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patientlist" element={<PatientList />} />
            </Routes>
          </div>
        </div>        
    </BrowserRouter> */}
    
    {/* COLD CHAIN MANAGER */}
    {/* <BrowserRouter>
      <div className="d-flex min-vh-100">
        <div className="col-md-3 col-lg-2 sidebar">
          <ManagerSidebar />
        </div>
        <div className="col-md-9 col-lg-10">
          <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vaccinelist" element={<VaccineList />} />
            </Routes>
          </div>
        </div>        
    </BrowserRouter> */}


      {/* ENCODER POV */}
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
              <Route path="/contraceptive" element={<ContraceptiveList />} />
            </Routes>
          </div>
        </div>        
    </BrowserRouter>

    </>
  );
}

export default App;
