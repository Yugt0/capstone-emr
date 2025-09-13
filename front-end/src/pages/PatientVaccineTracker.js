import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/PatientVaccineTracker.css";
import {
  Table,
  Button,
  ButtonGroup,
  Card,
  Container,
  Row,
  Col,
  Badge,
  Modal,
  Form,
  InputGroup,
  FormControl,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import {
  getPatients, createPatient, updatePatient, deletePatient,
  getNewbornImmunizations, getNewbornImmunizationByPatient, createNewbornImmunization, updateNewbornImmunization, deleteNewbornImmunization,
  getNutrition12Months, getNutrition12MonthsByPatient, createNutrition12Months, updateNutrition12Months, deleteNutrition12Months,
  getOutcomes, getOutcomeByPatient, createOutcome, updateOutcome, deleteOutcome
} from '../api';

const colKeys = Array.from({ length: 24 }, (_, i) => `col${i + 1}`);

const tableConfigs = [
  {
    label: "Registration & Demographics",
    columns: [
      "col1", // No.
      "col2", // Date of Registration
      "col3", // Date of Birth
      "col4", // Family Serial Number
      "col5", // Name of Child
      "col6", // Sex
      "col7", // Complete Name of Mother
      "col8", // Complete Address
      "col9", // CPAB (8a)
      "col10", // CPAB (8b)
      "actions" // Actions column
    ],
    data: [
      {
        col1: 1,
        col2: "06/01/24",
        col3: "01/15/24",
        col4: "FSN-001",
        col5: "Juan D. Cruz",
        col6: "M",
        col7: "Maria L. Cruz",
        col8: "123 Main St, Cityville",
        col9: "√",
        col10: "Yes"
      },
      {
        col1: 2,
        col2: "06/02/24",
        col3: "02/20/24",
        col4: "FSN-002",
        col5: "Ana M. Reyes",
        col6: "F",
        col7: "Luisa P. Reyes",
        col8: "456 Elm St, Townsville",
        col9: "",
        col10: "No"
      }
    ],
    customHeader: ( 
      <>
        <tr>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '50px', lineHeight: '1.3', fontWeight: '600' }}>No.</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600' }}>Reg Date</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600' }}>Birth Date</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600' }}>Family Serial #</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '120px', lineHeight: '1.3', fontWeight: '600' }}>Child Name</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '50px', lineHeight: '1.3', fontWeight: '600' }}>Sex</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '120px', lineHeight: '1.3', fontWeight: '600' }}>Mother Name</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '150px', lineHeight: '1.3', fontWeight: '600' }}>Address</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '80px', lineHeight: '1.3', fontWeight: '600' }}>TT2+ (8a)</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '80px', lineHeight: '1.3', fontWeight: '600' }}>TT3+ (8b)</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '80px', lineHeight: '1.3', fontWeight: '600' }}>Actions</th>
        </tr>
      </>
    ),
  },
  {
    label: "Newborn & Immunization",
    columns: [
      "col1", // Weight at birth (kg)
      "col2", // Status (Birth Weight)
      "col3", // Initiated breast feeding
      "col4", // BCG (date)
      "col5", // Hepa B BD (date)
      "col6", // Age in months
      "col7", // Length (cm) & date taken
      "col8", // Weight (kg) & date taken
      "col9", // 1 mo
      "col10", // 2 mos
      "col11", // 3 mos
      "col12", // DPT-HIB-HepB 1st dose
      "col13", // DPT-HIB-HepB 2nd dose
      "col14", // DPT-HIB-HepB 3rd dose
      "col15", // OPV 1st dose
      "col16", // OPV 2nd dose
      "col17", // OPV 3rd dose
      "col18", // PCV 1st dose
      "col19", // PCV 2nd dose
      "col20", // PCV 3rd dose
      "col21", // IPV 1st dose
    ],
    data: [
      {
        col1: "3.2",
        col2: "Normal",
        col3: "06/01/24",
        col4: "06/02/24",
        col5: "06/03/24",
        col6: "1",
        col7: "50 (06/01/24)",
        col8: "3.2 (06/01/24)",
        col9: "06/10/24",
        col10: "06/15/24",
        col11: "06/20/24",
        col12: "06/05/24",
        col13: "06/12/24",
        col14: "06/19/24",
        col15: "06/26/24",
        col16: "06/30/24",
        col17: "07/05/24",
        col18: "07/12/24",
        col19: "07/19/24",
        col20: "07/26/24",
        col21: "08/01/24"
      }
    ],
  },
  {
    label: "Nutrition & 12 Months",
    columns: [
      "col1", // No.
      "col2", // Age in months
      "col3", // Length (cm) & date taken
      "col4", // Weight (kg) & date taken
      "col5", // Status
      "col6", // Exclusively Breastfed
      "col7", // Introduction of Complementary Feeding
      "col8", // Vitamin A (date given)
      "col9", // MNP (date when 90 sachets given)
      "col10", // MMR Dose 1 at 9th month
      "col11", // IPV Dose 2 at 9th month
      "col12", // MMR Dose 2 at 12th month
      "col13", // FIC (date)
      "col14", // CIC (date)
    ],
    data: [
      {
        col1: 1,
        col2: "6",
        col3: "65 (12/01/24)",
        col4: "7.5 (12/01/24)",
        col5: "Normal",
        col6: "Y",
        col7: "Y",
        col8: "01/01/25",
        col9: "01/15/25",
        col10: "02/01/25",
        col11: "02/15/25",
        col12: "03/01/25",
        col13: "03/10/25",
        col14: "03/15/25"
      }
    ],
  },
  {
    label: "Outcomes & Remarks",
    columns: [
      "MAM: Admitted in SFP",
      "MAM: Cured",
      "MAM: Defaulted",
      "MAM: Died",
      "SAM without Complication: Admitted in OTC",
      "SAM without Complication: Cured",
      "SAM without Complication: Defaulted",
      "SAM without Complication: Died",
      "Remarks"
    ],
    data: [
      {
        "MAM: Admitted in SFP": "Yes",
        "MAM: Cured": "No",
        "MAM: Defaulted": "No",
        "MAM: Died": "No",
        "SAM without Complication: Admitted in OTC": "No",
        "SAM without Complication: Cured": "Yes",
        "SAM without Complication: Defaulted": "No",
        "SAM without Complication: Died": "No",
        "Remarks": "Recovered"
      },
      {
        "MAM: Admitted in SFP": "No",
        "MAM: Cured": "Yes",
        "MAM: Defaulted": "No",
        "MAM: Died": "No",
        "SAM without Complication: Admitted in OTC": "Yes",
        "SAM without Complication: Cured": "No",
        "SAM without Complication: Defaulted": "No",
        "SAM without Complication: Died": "No",
        "Remarks": "Transferred"
      }
    ],
  },
];

// Add these helper functions after the imports and before the component:
function formatDateToYMD(dateStr) {
  if (!dateStr) return '';
  // If already in YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Otherwise, try to parse and format
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  // If already in YYYY-MM-DD, return as is (perfect for HTML date inputs)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Try to parse various date formats and convert to YYYY-MM-DD
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

// Format date to readable format
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const mapRegFormToPatient = (regForm) => ({
  registration_no: regForm.col1,
  registration_date: regForm.col2,
  birth_date: regForm.col3,
  family_serial_number: regForm.col4,
  child_name: regForm.col5,
  sex: regForm.col6,
  mother_name: regForm.col7,
  address: regForm.col8,
  cpab_8a: regForm.col9,
  cpab_8b: regForm.col10,
});

const mapPatientToRegForm = (patient) => ({
  col1: patient.registration_no,
  col2: patient.registration_date,
  col3: patient.birth_date,
  col4: patient.family_serial_number,
  col5: patient.child_name,
  col6: patient.sex,
  col7: patient.mother_name,
  col8: patient.address,
  col9: patient.cpab_8a,
  col10: patient.cpab_8b,
});

export default function PatientVaccineTracker() {
  const [activePage, setActivePage] = useState(0);
  const [regData, setRegData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [selectedRow, setSelectedRow] = useState(null); // Data for modal
  const [selectedNutritionRow, setSelectedNutritionRow] = useState(null); // Nutrition data for modal
  const [selectedOutcomesRow, setSelectedOutcomesRow] = useState(null); // Outcomes data for modal
  // Add dummy data for the newborn section (move this above useState)
  const dummyNewbornRow = {
    col1: '3.0', // Weight at birth (kg)
    col2: 'N', // Status (Birth Weight)
    col3: '06/01/24', // Initiated breast feeding date
    col4: '06/02/24', // BCG (date)
    col5: '06/03/24', // Hepa B BD (date)
    col6: '1', // Age in months
    col7: '50 (06/01/24)', // Length (cm) & date taken
    col8: '3.0 (06/01/24)', // Weight (kg) & date taken
    col9: 'Normal', // Status
    col10: '06/10/24', // 1 mo Iron
    col11: '06/15/24', // 2 mos Iron
    col12: '06/20/24', // 3 mos Iron
    col13: '06/05/24', // DPT-HIB-HepB 1st dose
    col14: '06/12/24', // DPT-HIB-HepB 2nd dose
    col15: '06/19/24', // DPT-HIB-HepB 3rd dose
    col16: '06/26/24', // OPV 1st dose
    col17: '06/30/24', // OPV 2nd dose
    col18: '07/05/24', // OPV 3rd dose
    col19: '07/12/24', // PCV 1st dose
    col20: '07/19/24', // PCV 2nd dose
    col21: '07/26/24', // PCV 3rd dose
    col22: '08/01/24', // IPV 1st dose
  };
  const [selectedNewbornRow, setSelectedNewbornRow] = useState(null); // Newborn data for modal
  const [newbornLoading, setNewbornLoading] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [outcomesLoading, setOutcomesLoading] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState('registration'); // Which section to show in modal
  // Add state for add/edit modal and form
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({});
  const [editRegIdx, setEditRegIdx] = useState(null);
  // Add state for edit modals and forms
  const [showNewbornEditModal, setShowNewbornEditModal] = useState(false);
  const [newbornForm, setNewbornForm] = useState({});
  const [showNutritionEditModal, setShowNutritionEditModal] = useState(false);
  const [nutritionForm, setNutritionForm] = useState({});
  const [showOutcomesEditModal, setShowOutcomesEditModal] = useState(false);
  const [outcomesForm, setOutcomesForm] = useState({});

  // Medical summary modal state
  const [medicalSummaryModal, setMedicalSummaryModal] = useState(false);
  const [selectedPatientForSummary, setSelectedPatientForSummary] = useState(null);

  // Search functionality state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch all patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Ensure form is populated when modal opens
  useEffect(() => {
    if (showNewbornEditModal && selectedNewbornRow) {
      const formData = {
        length_at_birth: selectedNewbornRow.length_at_birth || '',
        col1: selectedNewbornRow.weight_at_birth || '',
        col2: selectedNewbornRow.birth_weight_status || '',
        col3: formatDateForInput(selectedNewbornRow.breast_feeding_date) || '',
        col4: formatDateForInput(selectedNewbornRow.bcg_date) || '',
        col5: formatDateForInput(selectedNewbornRow.hepa_b_bd_date) || '',
        col6: selectedNewbornRow.age_in_months || '',
        col7: selectedNewbornRow.length_in_threes_months || '',
        col8: selectedNewbornRow.weight_in_threes_months || '',
        col9: selectedNewbornRow.status || '',
        col10: formatDateForInput(selectedNewbornRow.iron_1mo_date) || '',
        col11: formatDateForInput(selectedNewbornRow.iron_2mo_date) || '',
        col12: formatDateForInput(selectedNewbornRow.iron_3mo_date) || '',
        col13: formatDateForInput(selectedNewbornRow.dpt_hib_hepb_1st) || '',
        col14: formatDateForInput(selectedNewbornRow.dpt_hib_hepb_2nd) || '',
        col15: formatDateForInput(selectedNewbornRow.dpt_hib_hepb_3rd) || '',
        col16: formatDateForInput(selectedNewbornRow.opv_1st) || '',
        col17: formatDateForInput(selectedNewbornRow.opv_2nd) || '',
        col18: formatDateForInput(selectedNewbornRow.opv_3rd) || '',
        col19: formatDateForInput(selectedNewbornRow.pcv_1st) || '',
        col20: formatDateForInput(selectedNewbornRow.pcv_2nd) || '',
        col21: formatDateForInput(selectedNewbornRow.pcv_3rd) || '',
        col22: formatDateForInput(selectedNewbornRow.ipv_1st) || '',
      };
      setNewbornForm(formData);
    }
  }, [showNewbornEditModal, selectedNewbornRow]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching patients from API...');
      const res = await getPatients();
      console.log('API Response:', res.data);
      setRegData(res.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // Handler for View button
  const handleView = async (rowIdx) => {
    const patient = regData[rowIdx];
    setSelectedRow(patient);
    
    // Fetch newborn data for this patient
    setNewbornLoading(true);
    try {
      const newbornRes = await getNewbornImmunizationByPatient(patient.id);
      setSelectedNewbornRow(newbornRes.data);
    } catch (err) {
      setSelectedNewbornRow(null);
    } finally {
      setNewbornLoading(false);
    }
    
    // Fetch nutrition data for this patient
    setNutritionLoading(true);
    try {
      const nutritionRes = await getNutrition12MonthsByPatient(patient.id);
      setSelectedNutritionRow(nutritionRes.data);
    } catch (err) {
      console.log('No nutrition data found for patient:', patient.id);
      setSelectedNutritionRow(null);
    } finally {
      setNutritionLoading(false);
    }
    
    // Fetch outcomes data for this patient
    setOutcomesLoading(true);
    try {
      const outcomesRes = await getOutcomeByPatient(patient.id);
      setSelectedOutcomesRow(outcomesRes.data);
    } catch (err) {
      console.log('No outcomes data found for patient:', patient.id);
      setSelectedOutcomesRow(null);
    } finally {
      setOutcomesLoading(false);
    }
    
    setActiveModalSection('registration'); // Default to first section
    setShowModal(true);
  };

  // Handler for Edit button
  const handleEdit = (rowIdx) => {
    const patient = regData[rowIdx];
    setRegForm(mapPatientToRegForm(patient));
    setEditRegIdx(rowIdx);
    setShowRegModal(true);
  };

  // Handler for Delete button
  const handleDelete = async (rowIdx) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const patientId = regData[rowIdx].id;
        console.log('Deleting patient with ID:', patientId);
        await deletePatient(patientId);
        fetchPatients();
      } catch (err) {
        console.error('Error deleting patient:', err);
        alert('Failed to delete patient');
      }
    }
  };

  // Add handlers for add/edit actions for each section
  const handleAddRegistration = () => {
    setRegForm({});
    setEditRegIdx(null);
    setShowRegModal(true);
  };

  const handleCloseRegModal = () => {
    setShowRegModal(false);
    setRegForm({});
    setEditRegIdx(null);
  };
  const handleEditRegistration = () => {
    if (selectedRow) {
      // Find the original patient data from regData
      const originalPatient = regData.find(patient => patient.id === selectedRow.id);
      if (originalPatient) {
        const formData = mapPatientToRegForm(originalPatient);
        // Format dates for HTML date inputs
        formData.col2 = formatDateForInput(formData.col2);
        formData.col3 = formatDateForInput(formData.col3);
        setRegForm(formData);
        setEditRegIdx(regData.findIndex(row => row.id === selectedRow.id));
        setShowRegModal(true);
      }
    }
  };
  const handleAddNutrition = () => alert('Add Nutrition & 12 Months');
  const handleEditNutrition = () => alert('Edit Nutrition & 12 Months');
  const handleAddOutcomes = () => alert('Add Outcomes & Remarks');
  const handleEditOutcomes = () => alert('Edit Outcomes & Remarks');

  // Edit handlers
  const handleEditNewborn = () => {
    if (selectedNewbornRow) {
      // Map backend data to frontend form structure
      const formData = {
        length_at_birth: selectedNewbornRow.length_at_birth || '',
        col1: selectedNewbornRow.weight_at_birth || '',
        col2: selectedNewbornRow.birth_weight_status || '',
        col3: formatDateForInput(selectedNewbornRow.breast_feeding_date) || '',
        col4: formatDateForInput(selectedNewbornRow.bcg_date) || '',
        col5: formatDateForInput(selectedNewbornRow.hepa_b_bd_date) || '',
        col6: selectedNewbornRow.age_in_months || '',
        col7: selectedNewbornRow.length_in_threes_months || '',
        col8: selectedNewbornRow.weight_in_threes_months || '',
        col9: selectedNewbornRow.status || '',
        col10: formatDateForInput(selectedNewbornRow.iron_1mo_date) || '',
        col11: formatDateForInput(selectedNewbornRow.iron_2mo_date) || '',
        col12: formatDateForInput(selectedNewbornRow.iron_3mo_date) || '',
        col13: formatDateForInput(selectedNewbornRow.dpt_hib_hepb_1st) || '',
        col14: formatDateForInput(selectedNewbornRow.dpt_hib_hepb_2nd) || '',
        col15: formatDateForInput(selectedNewbornRow.dpt_hib_hepb_3rd) || '',
        col16: formatDateForInput(selectedNewbornRow.opv_1st) || '',
        col17: formatDateForInput(selectedNewbornRow.opv_2nd) || '',
        col18: formatDateForInput(selectedNewbornRow.opv_3rd) || '',
        col19: formatDateForInput(selectedNewbornRow.pcv_1st) || '',
        col20: formatDateForInput(selectedNewbornRow.pcv_2nd) || '',
        col21: formatDateForInput(selectedNewbornRow.pcv_3rd) || '',
        col22: formatDateForInput(selectedNewbornRow.ipv_1st) || '',
      };
      
      setNewbornForm(formData);
      
      // Use setTimeout to ensure the form is set before opening the modal
      setTimeout(() => {
        setShowNewbornEditModal(true);
      }, 100);
    } else {
      setNewbornForm({});
      setShowNewbornEditModal(true);
    }
  };
  const handleEditNutritionSection = () => {
    if (selectedNutritionRow) {
      // Map backend data to frontend form structure for editing
      const formData = {
        col1: selectedNutritionRow.id,
        col2: selectedNutritionRow.age_in_months,
        col3: selectedNutritionRow.length_cm_date,
        col4: selectedNutritionRow.weight_kg_date,
        col5: selectedNutritionRow.status,
        col6: selectedNutritionRow.exclusively_breastfed,
        col7: selectedNutritionRow.complementary_feeding, // This is for breastfeeding type (1 or 2)
        col8: selectedNutritionRow.complementary_feeding, // This is for complementary feeding Y/N
        col9: formatDateForInput(selectedNutritionRow.vitamin_a_date),
        col10: formatDateForInput(selectedNutritionRow.mnp_date),
        col11: formatDateForInput(selectedNutritionRow.mmr_1st_9mo),
        col12: formatDateForInput(selectedNutritionRow.ipv_2nd_9mo),
        col13: selectedNutritionRow.age_in_months_12,
        col14: selectedNutritionRow.length_cm_date_12,
        col15: selectedNutritionRow.weight_kg_date_12,
        col16: selectedNutritionRow.status_12,
        col17: formatDateForInput(selectedNutritionRow.mmr_2nd_12mo),
        col18: formatDateForInput(selectedNutritionRow.fic_date),
        col19: formatDateForInput(selectedNutritionRow.cic_date),
      };
      setNutritionForm(formData);
    } else {
      // Clear form for adding new nutrition data
      setNutritionForm({});
    }
    setShowNutritionEditModal(true);
  };
  const handleEditOutcomesSection = () => {
    if (selectedOutcomesRow) {
      // Map backend data to frontend form structure
      const formData = {
        "MAM: Admitted in SFP": selectedOutcomesRow.mam_admitted_sfp,
        "MAM: Cured": selectedOutcomesRow.mam_cured,
        "MAM: Defaulted": selectedOutcomesRow.mam_defaulted,
        "MAM: Died": selectedOutcomesRow.mam_died,
        "SAM without Complication: Admitted in OTC": selectedOutcomesRow.sam_admitted_otc,
        "SAM without Complication: Cured": selectedOutcomesRow.sam_cured,
        "SAM without Complication: Defaulted": selectedOutcomesRow.sam_defaulted,
        "SAM without Complication: Died": selectedOutcomesRow.sam_died,
        "Remarks": selectedOutcomesRow.remarks,
      };
      setOutcomesForm(formData);
    } else {
      // Clear form for adding new outcomes data
      setOutcomesForm({});
    }
    setShowOutcomesEditModal(true);
  };

  // Handle form change
  const handleRegFormChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };
  // Handle form submit
  const handleRegFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const mapped = mapRegFormToPatient(regForm);
      mapped.registration_date = formatDateToYMD(mapped.registration_date);
      mapped.birth_date = formatDateToYMD(mapped.birth_date);
      
      console.log('Submitting patient data:', mapped);
      
      if (editRegIdx !== null) {
        const patientId = regData[editRegIdx].id;
        console.log('Updating patient with ID:', patientId);
        await updatePatient(patientId, mapped);
      } else {
        console.log('Creating new patient');
        await createPatient(mapped);
      }
      setShowRegModal(false);
      setRegForm({});
      setEditRegIdx(null);
      fetchPatients();
    } catch (err) {
      console.error('Error saving patient:', err);
      alert('Failed to save patient: ' + (err.response?.data?.message || err.message));
    }
  };

  // Helper function to calculate next dose date (1 month later)
  const calculateNextDoseDate = (currentDate) => {
    if (!currentDate) return '';
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
  };

  // Calculate current age in months
  const calculateAgeInMonths = (birthDate) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
  };

  // Generate comprehensive medical summary
  const generateMedicalSummary = (patient, newbornData, nutritionData, outcomesData) => {
    const currentAge = calculateAgeInMonths(patient.birth_date);
    
    // Calculate current weight (from nutrition data or newborn data)
    let currentWeight = 'Not recorded';
    if (nutritionData && nutritionData.weight_kg_date_12) {
      currentWeight = nutritionData.weight_kg_date_12;
    } else if (nutritionData && nutritionData.weight_kg_date) {
      currentWeight = nutritionData.weight_kg_date;
    } else if (newbornData && newbornData.weight_in_threes_months) {
      currentWeight = newbornData.weight_in_threes_months;
    }

    // Count vaccines received
    const vaccinesReceived = [];
    if (newbornData) {
      if (newbornData.bcg_date) vaccinesReceived.push({ name: 'BCG', doses: 1, lastDate: newbornData.bcg_date });
      if (newbornData.hepa_b_bd_date) vaccinesReceived.push({ name: 'Hepa B BD', doses: 1, lastDate: newbornData.hepa_b_bd_date });
      
      // DPT-HIB-HepB
      let dptDoses = 0;
      if (newbornData.dpt_hib_hepb_1st) dptDoses++;
      if (newbornData.dpt_hib_hepb_2nd) dptDoses++;
      if (newbornData.dpt_hib_hepb_3rd) dptDoses++;
      if (dptDoses > 0) {
        vaccinesReceived.push({ 
          name: 'DPT-HIB-HepB', 
          doses: dptDoses, 
          lastDate: newbornData.dpt_hib_hepb_3rd || newbornData.dpt_hib_hepb_2nd || newbornData.dpt_hib_hepb_1st 
        });
      }

      // OPV
      let opvDoses = 0;
      if (newbornData.opv_1st) opvDoses++;
      if (newbornData.opv_2nd) opvDoses++;
      if (newbornData.opv_3rd) opvDoses++;
      if (opvDoses > 0) {
        vaccinesReceived.push({ 
          name: 'OPV', 
          doses: opvDoses, 
          lastDate: newbornData.opv_3rd || newbornData.opv_2nd || newbornData.opv_1st 
        });
      }

      // PCV
      let pcvDoses = 0;
      if (newbornData.pcv_1st) pcvDoses++;
      if (newbornData.pcv_2nd) pcvDoses++;
      if (newbornData.pcv_3rd) pcvDoses++;
      if (pcvDoses > 0) {
        vaccinesReceived.push({ 
          name: 'PCV', 
          doses: pcvDoses, 
          lastDate: newbornData.pcv_3rd || newbornData.pcv_2nd || newbornData.pcv_1st 
        });
      }

      // IPV
      if (newbornData.ipv_1st) vaccinesReceived.push({ name: 'IPV', doses: 1, lastDate: newbornData.ipv_1st });
    }

    // Additional vaccines from nutrition data
    if (nutritionData) {
      if (nutritionData.mmr_1st_9mo) vaccinesReceived.push({ name: 'MMR (1st)', doses: 1, lastDate: nutritionData.mmr_1st_9mo });
      if (nutritionData.mmr_2nd_12mo) vaccinesReceived.push({ name: 'MMR (2nd)', doses: 1, lastDate: nutritionData.mmr_2nd_12mo });
      if (nutritionData.ipv_2nd_9mo) vaccinesReceived.push({ name: 'IPV (2nd)', doses: 1, lastDate: nutritionData.ipv_2nd_9mo });
    }

    // Calculate total vaccine doses
    const totalVaccineDoses = vaccinesReceived.reduce((sum, vaccine) => sum + vaccine.doses, 0);

    // Growth status
    let growthStatus = 'Not assessed';
    if (nutritionData && nutritionData.status_12) {
      growthStatus = nutritionData.status_12;
    } else if (nutritionData && nutritionData.status) {
      growthStatus = nutritionData.status;
    } else if (newbornData && newbornData.status) {
      growthStatus = newbornData.status;
    }

    // Feeding status
    let feedingStatus = 'Not recorded';
    if (nutritionData) {
      const breastfed = nutritionData.exclusively_breastfed === 'Y' ? 'Yes' : 'No';
      const complementary = nutritionData.complementary_feeding === 'Y' ? 'Yes' : 'No';
      feedingStatus = `Exclusively breastfed: ${breastfed}, Complementary feeding: ${complementary}`;
    }

    // Health outcomes
    let healthOutcomes = 'No outcomes recorded';
    if (outcomesData) {
      const outcomes = [];
      if (outcomesData.mam_cured === 'Yes') outcomes.push('MAM Cured');
      if (outcomesData.sam_cured === 'Yes') outcomes.push('SAM Cured');
      if (outcomesData.mam_defaulted === 'Yes') outcomes.push('MAM Defaulted');
      if (outcomesData.sam_defaulted === 'Yes') outcomes.push('SAM Defaulted');
      if (outcomesData.mam_died === 'Yes') outcomes.push('MAM Died');
      if (outcomesData.sam_died === 'Yes') outcomes.push('SAM Died');
      
      if (outcomes.length > 0) {
        healthOutcomes = outcomes.join(', ');
      } else {
        healthOutcomes = 'No significant outcomes recorded';
      }
    }

    return {
      patientInfo: {
        name: patient.child_name,
        motherName: patient.mother_name,
        birthDate: formatDate(patient.birth_date),
        currentAge,
        sex: patient.sex,
        address: patient.address
      },
      currentWeight,
      vaccinesReceived,
      totalVaccineDoses,
      growthStatus,
      feedingStatus,
      healthOutcomes,
      lastUpdated: formatDate(patient.updated_at || patient.created_at)
    };
  };

  // Handle medical summary
  const handleMedicalSummary = async (rowIdx) => {
    const patient = regData[rowIdx];
    setSelectedPatientForSummary(patient);
    
    // Fetch all related data
    try {
      const [newbornRes, nutritionRes, outcomesRes] = await Promise.all([
        getNewbornImmunizationByPatient(patient.id).catch(() => ({ data: null })),
        getNutrition12MonthsByPatient(patient.id).catch(() => ({ data: null })),
        getOutcomeByPatient(patient.id).catch(() => ({ data: null }))
      ]);

      const summary = generateMedicalSummary(
        patient, 
        newbornRes.data, 
        nutritionRes.data, 
        outcomesRes.data
      );
      
      setSelectedPatientForSummary({ ...patient, summary });
      setMedicalSummaryModal(true);
    } catch (error) {
      console.error('Error fetching data for summary:', error);
      alert('Failed to load patient data for summary');
    }
  };

  // Form change handlers
  const handleNewbornFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...newbornForm, [name]: value };
    
    // Auto-schedule next doses for vaccines
    if (name === 'col13' && value) { // DPT-HIB-HepB 1st dose
      updatedForm.col14 = calculateNextDoseDate(value); // 2nd dose
    }
    if (name === 'col14' && value) { // DPT-HIB-HepB 2nd dose
      updatedForm.col15 = calculateNextDoseDate(value); // 3rd dose
    }
    if (name === 'col16' && value) { // OPV 1st dose
      updatedForm.col17 = calculateNextDoseDate(value); // 2nd dose
    }
    if (name === 'col17' && value) { // OPV 2nd dose
      updatedForm.col18 = calculateNextDoseDate(value); // 3rd dose
    }
    if (name === 'col19' && value) { // PCV 1st dose
      updatedForm.col20 = calculateNextDoseDate(value); // 2nd dose
    }
    if (name === 'col20' && value) { // PCV 2nd dose
      updatedForm.col21 = calculateNextDoseDate(value); // 3rd dose
    }
    
    setNewbornForm(updatedForm);
  };
  const handleNutritionFormChange = (e) => {
    setNutritionForm({ ...nutritionForm, [e.target.name]: e.target.value });
  };
  const handleOutcomesFormChange = (e) => {
    setOutcomesForm({ ...outcomesForm, [e.target.name]: e.target.value });
  };

  // Form submit handlers
  const handleNewbornFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const patientId = selectedRow.id;
      const newbornData = {
        patient_id: patientId,
        length_at_birth: newbornForm.length_at_birth,
        weight_at_birth: newbornForm.col1,
        birth_weight_status: newbornForm.col2,
        breast_feeding_date: formatDateToYMD(newbornForm.col3),
        bcg_date: formatDateToYMD(newbornForm.col4),
        hepa_b_bd_date: formatDateToYMD(newbornForm.col5),
        age_in_months: newbornForm.col6,
        length_in_threes_months: newbornForm.col7,
        weight_in_threes_months: newbornForm.col8,
        status: newbornForm.col9,
        iron_1mo_date: formatDateToYMD(newbornForm.col10),
        iron_2mo_date: formatDateToYMD(newbornForm.col11),
        iron_3mo_date: formatDateToYMD(newbornForm.col12),
        dpt_hib_hepb_1st: formatDateToYMD(newbornForm.col13),
        dpt_hib_hepb_2nd: formatDateToYMD(newbornForm.col14),
        dpt_hib_hepb_3rd: formatDateToYMD(newbornForm.col15),
        opv_1st: formatDateToYMD(newbornForm.col16),
        opv_2nd: formatDateToYMD(newbornForm.col17),
        opv_3rd: formatDateToYMD(newbornForm.col18),
        pcv_1st: formatDateToYMD(newbornForm.col19),
        pcv_2nd: formatDateToYMD(newbornForm.col20),
        pcv_3rd: formatDateToYMD(newbornForm.col21),
        ipv_1st: formatDateToYMD(newbornForm.col22),
      };

      console.log('Submitting newborn data:', newbornData);

      if (selectedNewbornRow && selectedNewbornRow.id) {
        // Update existing newborn record
        await updateNewbornImmunization(selectedNewbornRow.id, newbornData);
        console.log('Updated newborn record');
      } else {
        // Create new newborn record
        await createNewbornImmunization(newbornData);
        console.log('Created new newborn record');
      }

      // Refresh newborn data
      const newbornRes = await getNewbornImmunizationByPatient(patientId);
      setSelectedNewbornRow(newbornRes.data);
      setShowNewbornEditModal(false);
    } catch (err) {
      console.error('Error saving newborn data:', err);
      alert('Failed to save newborn data: ' + (err.response?.data?.message || err.message));
    }
  };
  const handleNutritionFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const patientId = selectedRow.id;
      
      // Clean up the data - remove empty strings and null values
      const nutritionData = {
        patient_id: patientId,
        age_in_months: nutritionForm.col2 || null,
        length_cm_date: nutritionForm.col3 || null,
        weight_kg_date: nutritionForm.col4 || null,
        status: nutritionForm.col5 || null,
        exclusively_breastfed: nutritionForm.col6 || null,
        complementary_feeding: nutritionForm.col8 || null, // Fixed: col8 is for complementary feeding Y/N
        vitamin_a_date: nutritionForm.col9 ? formatDateToYMD(nutritionForm.col9) : null,
        mnp_date: nutritionForm.col10 ? formatDateToYMD(nutritionForm.col10) : null,
        mmr_1st_9mo: nutritionForm.col11 ? formatDateToYMD(nutritionForm.col11) : null,
        ipv_2nd_9mo: nutritionForm.col12 ? formatDateToYMD(nutritionForm.col12) : null,
        age_in_months_12: nutritionForm.col13 || null,
        length_cm_date_12: nutritionForm.col14 || null,
        weight_kg_date_12: nutritionForm.col15 || null,
        status_12: nutritionForm.col16 || null,
        mmr_2nd_12mo: nutritionForm.col17 ? formatDateToYMD(nutritionForm.col17) : null,
        fic_date: nutritionForm.col18 ? formatDateToYMD(nutritionForm.col18) : null,
        cic_date: nutritionForm.col19 ? formatDateToYMD(nutritionForm.col19) : null,
      };

      console.log('Submitting nutrition data:', nutritionData);

      if (selectedNutritionRow && selectedNutritionRow.id) {
        // Update existing nutrition record
        await updateNutrition12Months(selectedNutritionRow.id, nutritionData);
        console.log('Updated nutrition record');
      } else {
        // Create new nutrition record
        await createNutrition12Months(nutritionData);
        console.log('Created new nutrition record');
      }

      // Refresh nutrition data
      const nutritionRes = await getNutrition12MonthsByPatient(patientId);
      setSelectedNutritionRow(nutritionRes.data);
      setShowNutritionEditModal(false);
    } catch (err) {
      console.error('Error saving nutrition data:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      alert('Failed to save nutrition data: ' + errorMessage);
    }
  };
  const handleOutcomesFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const patientId = selectedRow.id;
      
      // Map frontend form data to backend field names
      const outcomesData = {
        patient_id: patientId,
        mam_admitted_sfp: outcomesForm["MAM: Admitted in SFP"] || null,
        mam_cured: outcomesForm["MAM: Cured"] || null,
        mam_defaulted: outcomesForm["MAM: Defaulted"] || null,
        mam_died: outcomesForm["MAM: Died"] || null,
        sam_admitted_otc: outcomesForm["SAM without Complication: Admitted in OTC"] || null,
        sam_cured: outcomesForm["SAM without Complication: Cured"] || null,
        sam_defaulted: outcomesForm["SAM without Complication: Defaulted"] || null,
        sam_died: outcomesForm["SAM without Complication: Died"] || null,
        remarks: outcomesForm["Remarks"] || null,
      };

      console.log('Submitting outcomes data:', outcomesData);

      if (selectedOutcomesRow && selectedOutcomesRow.id) {
        // Update existing outcomes record
        await updateOutcome(selectedOutcomesRow.id, outcomesData);
        console.log('Updated outcomes record');
      } else {
        // Create new outcomes record
        await createOutcome(outcomesData);
        console.log('Created new outcomes record');
      }

      // Refresh outcomes data
      const outcomesRes = await getOutcomeByPatient(patientId);
      setSelectedOutcomesRow(outcomesRes.data);
      setShowOutcomesEditModal(false);
    } catch (err) {
      console.error('Error saving outcomes data:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      alert('Failed to save outcomes data: ' + errorMessage);
    }
  };

  // Search functionality
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredData([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchLower = searchTerm.toLowerCase().trim();
    
    const filtered = regData.filter(patient => {
      const childName = (patient.child_name || '').toLowerCase();
      const motherName = (patient.mother_name || '').toLowerCase();
      
      return childName.includes(searchLower) || motherName.includes(searchLower);
    });

    setFilteredData(filtered);
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredData([]);
    setIsSearching(false);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Map backend data to frontend column structure
  const mapBackendDataToColumns = (patients) => {
    return patients.map(patient => ({
      col1: patient.registration_no || patient.id,
      col2: formatDate(patient.registration_date),
      col3: formatDate(patient.birth_date),
      col4: patient.family_serial_number,
      col5: patient.child_name,
      col6: patient.sex,
      col7: patient.mother_name,
      col8: patient.address,
      col9: patient.cpab_8a,
      col10: patient.cpab_8b,
      id: patient.id // Keep the original ID for CRUD operations
    }));
  };

  const { columns, data, customHeader } =
    activePage === 0
      ? { 
          ...tableConfigs[0], 
          data: filteredData.length > 0 
            ? mapBackendDataToColumns(filteredData) 
            : mapBackendDataToColumns(regData) 
        }
      : tableConfigs[activePage];

  // Pagination calculations
  const totalEntries = data.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData, rowsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  return (
    <Container fluid className="my-4">
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        <Card.Header className="bg-gradient-primary text-white py-4">
          <Row className="align-items-center">
            <Col>
              <h3 className="fw-bold mb-0">
                <i className="bi bi-clipboard-data me-3"></i>
                Target Client List for Immunization and Nutrition Services
              </h3>
              <p className="mb-0 mt-2 opacity-75">Comprehensive patient tracking and management system</p>
            </Col>
          </Row>
          
          {/* Search Section */}
          <Row className="mt-4">
            <Col md={8}>
              <div className="d-flex gap-3 align-items-end">
                <div className="flex-grow-1">
                  <Form.Label className="text-white fw-semibold mb-2">
                    <i className="bi bi-search me-2"></i>
                    Search Patients
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by child's name or mother's name..."
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchKeyPress}
                    className="form-control-lg border-0 shadow-sm"
                    style={{ borderRadius: '12px' }}
                  />
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="light" 
                    className="fw-semibold"
                    onClick={handleSearch}
                    disabled={isSearching}
                    style={{
                      background: isSearching 
                        ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: 'none',
                      color: isSearching ? '#ffffff' : '#495057',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={e => {
                      if (!isSearching) {
                        e.target.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!isSearching) {
                        e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {isSearching ? (
                      <>
                        <i className="bi bi-arrow-clockwise" style={{ fontSize: '14px' }}></i>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search" style={{ fontSize: '14px' }}></i>
                        Search
                      </>
                    )}
            </Button>
                  {filteredData.length > 0 && (
                    <Button 
                      variant="outline-light" 
                      className="fw-semibold"
                      onClick={handleClearSearch}
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '10px 20px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={e => {
                        e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseOut={e => {
                        e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <i className="bi bi-x-circle" style={{ fontSize: '14px' }}></i>
                      Clear
                    </Button>
                  )}
          </div>
              </div>
              {filteredData.length > 0 && (
                <div className="mt-2">
                  <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                    <i className="bi bi-check-circle me-2"></i>
                    Found {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </Col>
            <Col md={4} className="d-flex justify-content-center align-items-center">
              <Button 
                variant="success" 
                className="fw-semibold" 
                onClick={handleAddRegistration}
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #1e7e34 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                }}
              >
                <i className="bi bi-plus-circle" style={{ fontSize: '16px' }}></i> 
                Add Patient
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-4">
          <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table bordered hover className="table-modern mb-0" style={{ fontSize: '11px' }}>
              <thead className="table-header-gradient" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              {customHeader ? customHeader : (
                <tr>
                  {columns.map((col, idx) => (
                      <th key={idx} className="text-white border-0" style={{ 
                        fontSize: '10px', 
                        padding: '6px 4px',
                        whiteSpace: 'nowrap',
                        maxWidth: '140px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.3',
                        fontWeight: '600'
                      }}>
                        {col === "actions" ? "Actions" : col}
                      </th>
                  ))}
              </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length || 24} className="text-center text-muted py-5">
                    <div className="empty-state">
                      <i className="bi bi-arrow-clockwise display-4 text-muted"></i>
                      <p className="mt-3">Loading patients...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length || 24} className="text-center text-danger py-5">
                    <div className="empty-state">
                      <i className="bi bi-exclamation-triangle display-4 text-danger"></i>
                      <p className="mt-3">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                    <td colSpan={columns.length || 24} className="text-center text-muted py-5">
                      <div className="empty-state">
                        {filteredData.length > 0 ? (
                          <>
                            <i className="bi bi-search display-4 text-muted"></i>
                            <p className="mt-3">No patients found matching your search.</p>
                            <p className="text-muted">Try a different search term or clear the search.</p>
                          </>
                        ) : (
                          <>
                        <i className="bi bi-inbox display-4 text-muted"></i>
                        <p className="mt-3">No data available.</p>
                          </>
                        )}
                      </div>
                  </td>
                </tr>
              ) : (
                currentData.map((row, rIdx) => (
                    <tr key={rIdx} className="table-row-hover">
                    {columns.map((col, cIdx) =>
                      col === "actions" && activePage === 0 ? (
                          <td key={cIdx} className="text-center align-middle" style={{ 
                            padding: '6px 4px',
                            fontSize: '11px'
                          }}>
                            <div className="table-actions" style={{
                              display: 'flex',
                              gap: '4px',
                              flexWrap: 'nowrap',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="icon-btn" 
                                onClick={() => handleView(rIdx)} 
                                title="View Details"
                                style={{
                                  background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                  border: 'none',
                                  color: 'white',
                                  width: '60px',
                                  fontSize: '10px',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 6px rgba(23, 162, 184, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '2px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #138496 0%, #117a8b 100%)';
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.4)';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';
                                  e.target.style.transform = 'none';
                                  e.target.style.boxShadow = '0 2px 6px rgba(23, 162, 184, 0.3)';
                                }}
                              >
                                <i className="bi bi-eye" style={{ fontSize: '10px' }}></i>
                                <span>View</span>
                          </Button>
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="icon-btn" 
                                onClick={() => handleEdit(rIdx)} 
                                title="Edit Patient"
                                style={{
                                  background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                                  border: 'none',
                                  color: 'white',
                                  width: '60px',
                                  fontSize: '10px',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 6px rgba(255, 193, 7, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '2px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #e0a800 0%, #d39e00 100%)';
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
                                  e.target.style.transform = 'none';
                                  e.target.style.boxShadow = '0 2px 6px rgba(255, 193, 7, 0.3)';
                                }}
                              >
                                <i className="bi bi-pencil-square" style={{ fontSize: '10px' }}></i>
                                <span>Edit</span>
                          </Button>
                              <Button 
                                size="sm" 
                                variant="outline-info" 
                                className="icon-btn" 
                                onClick={() => handleMedicalSummary(rIdx)} 
                                title="Medical Summary"
                                style={{
                                  background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
                                  border: 'none',
                                  color: 'white',
                                  width: '60px',
                                  fontSize: '10px',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 6px rgba(111, 66, 193, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '2px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #5a32a3 0%, #4c2a8a 100%)';
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(111, 66, 193, 0.4)';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)';
                                  e.target.style.transform = 'none';
                                  e.target.style.boxShadow = '0 2px 6px rgba(111, 66, 193, 0.3)';
                                }}
                              >
                                <i className="bi bi-file-medical" style={{ fontSize: '10px' }}></i>
                                <span>Summary</span>
                          </Button>
                              <Button 
                                size="sm" 
                                variant="outline-danger" 
                                className="icon-btn" 
                                onClick={() => handleDelete(rIdx)} 
                                title="Delete Patient"
                                style={{
                                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                  border: 'none',
                                  color: 'white',
                                  width: '60px',
                                  fontSize: '10px',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 6px rgba(220, 53, 69, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '2px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                                  e.target.style.transform = 'none';
                                  e.target.style.boxShadow = '0 2px 6px rgba(220, 53, 69, 0.3)';
                                }}
                              >
                                <i className="bi bi-trash" style={{ fontSize: '10px' }}></i>
                                <span>Delete</span>
                          </Button>
                            </div>
                        </td>
                      ) : (
                        <td key={cIdx} style={{ 
                          padding: '6px 4px',
                          fontSize: '11px',
                          maxWidth: '140px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.3'
                        }} title={row[col] || ""}>{row[col] || ""}</td>
                      )
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          </div>

          {/* Pagination Controls */}
          {totalEntries > 0 && (
            <div className="pagination-section mt-4 p-3" style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                {/* Rows per page selector */}
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted fw-semibold" style={{ fontSize: '14px' }}>
                    <i className="bi bi-list-ul me-1"></i>
                    Rows per page:
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
                    style={{
                      width: 'auto',
                      minWidth: '80px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="10">10</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Entry counter */}
                <div className="d-flex align-items-center">
                  <span className="text-muted fw-semibold" style={{ fontSize: '14px' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Showing {startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
                  </span>
                </div>

                {/* Page navigation */}
                <div className="d-flex align-items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: '1.5px solid #3b82f6',
                      transition: 'all 0.2s ease',
                      color: '#3b82f6'
                    }}
                  >
                    <i className="bi bi-chevron-left me-1"></i>
                    Previous
                  </button>
                  
                  {/* Smart pagination with ellipsis */}
                  <div className="d-flex align-items-center gap-1" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 7; // Show max 7 page numbers
                      const halfVisible = Math.floor(maxVisiblePages / 2);
                      
                      // Always show first page
                      pages.push(
                        <button
                          key={1}
                          className={`btn btn-sm ${1 === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => handlePageChange(1)}
                          style={{
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            minWidth: '36px',
                            transition: 'all 0.2s ease',
                            ...(1 === currentPage && {
                              backgroundColor: '#3b82f6',
                              borderColor: '#3b82f6',
                              color: 'white'
                            }),
                            ...(1 !== currentPage && {
                              color: '#3b82f6',
                              borderColor: '#3b82f6',
                              backgroundColor: 'transparent'
                            })
                          }}
                        >
                          1
                        </button>
                      );
                      
                      if (totalPages <= maxVisiblePages) {
                        // Show all pages if total is small
                        for (let i = 2; i <= totalPages - 1; i++) {
                          const isCurrentPage = i === currentPage;
                          pages.push(
                            <button
                              key={i}
                          className={`btn btn-sm ${isCurrentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handlePageChange(i)}
                          style={{
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            minWidth: '36px',
                            transition: 'all 0.2s ease',
                            ...(isCurrentPage && {
                              backgroundColor: '#3b82f6',
                              borderColor: '#3b82f6',
                              color: 'white'
                            }),
                            ...(!isCurrentPage && {
                              color: '#3b82f6',
                              borderColor: '#3b82f6',
                              backgroundColor: 'transparent'
                            })
                          }}
                        >
                              {i}
                        </button>
                      );
                        }
                      } else {
                        // Smart pagination with ellipsis
                        let startPage = Math.max(2, currentPage - halfVisible);
                        let endPage = Math.min(totalPages - 1, currentPage + halfVisible);
                        
                        // Adjust if we're near the beginning or end
                        if (currentPage <= halfVisible) {
                          endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
                        }
                        if (currentPage >= totalPages - halfVisible) {
                          startPage = Math.max(2, totalPages - maxVisiblePages + 2);
                        }
                        
                        // Add ellipsis after first page if needed
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 text-muted" style={{ fontSize: '13px' }}>
                              ...
                            </span>
                          );
                        }
                        
                        // Add middle pages
                        for (let i = startPage; i <= endPage; i++) {
                          const isCurrentPage = i === currentPage;
                          pages.push(
                            <button
                              key={i}
                              className={`btn btn-sm ${isCurrentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handlePageChange(i)}
                              style={{
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                fontWeight: '500',
                                minWidth: '36px',
                                transition: 'all 0.2s ease',
                                ...(isCurrentPage && {
                                  backgroundColor: '#3b82f6',
                                  borderColor: '#3b82f6',
                                  color: 'white'
                                }),
                                ...(!isCurrentPage && {
                                  color: '#3b82f6',
                                  borderColor: '#3b82f6',
                                  backgroundColor: 'transparent'
                                })
                              }}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        // Add ellipsis before last page if needed
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 text-muted" style={{ fontSize: '13px' }}>
                              ...
                            </span>
                          );
                        }
                      }
                      
                      // Always show last page (if more than 1 page)
                      if (totalPages > 1) {
                        pages.push(
                          <button
                            key={totalPages}
                            className={`btn btn-sm ${totalPages === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handlePageChange(totalPages)}
                            style={{
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              minWidth: '36px',
                              transition: 'all 0.2s ease',
                              ...(totalPages === currentPage && {
                                backgroundColor: '#3b82f6',
                                borderColor: '#3b82f6',
                                color: 'white'
                              }),
                              ...(totalPages !== currentPage && {
                                color: '#3b82f6',
                                borderColor: '#3b82f6',
                                backgroundColor: 'transparent'
                              })
                            }}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: '1.5px solid #3b82f6',
                      transition: 'all 0.2s ease',
                      color: '#3b82f6'
                    }}
                  >
                    Next
                    <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                  
                  {/* Quick page input for large datasets */}
                  {totalPages > 10 && (
                    <div className="d-flex align-items-center gap-2 ms-3">
                      <span className="text-muted small">Go to:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            handlePageChange(page);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              handlePageChange(page);
                            }
                          }
                        }}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      {/* Modal for viewing row data */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" className="modal-modern">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-person-circle me-3"></i>
            Patient Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <ButtonGroup className="mb-4 w-100 shadow-sm rounded-pill">
              <Button
                variant={activeModalSection === 'newborn' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveModalSection('newborn')}
                className="flex-fill py-3"
              >
                <i className="bi bi-baby me-2"></i>
                Newborn (0-28 days old)
              </Button>
              <Button
                variant={activeModalSection === 'nutrition' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveModalSection('nutrition')}
                className="flex-fill py-3"
              >
                <i className="bi bi-heart-pulse me-2"></i>
                Nutrition & 12 Months
              </Button>
              <Button
                variant={activeModalSection === 'outcomes' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveModalSection('outcomes')}
                className="flex-fill py-3"
              >
                <i className="bi bi-clipboard-check me-2"></i>
                Outcomes & Remarks
              </Button>
            </ButtonGroup>
            
            {activeModalSection === 'newborn' && (
              <div>
                <div className="d-flex justify-content-end mb-3">
                  {newbornLoading ? (
                    <Button 
                      size="sm" 
                      variant="outline-secondary" 
                      disabled 
                      style={{
                        background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="bi bi-arrow-clockwise" style={{ fontSize: '12px' }}></i> 
                      Loading...
                    </Button>
                  ) : selectedNewbornRow ? (
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      onClick={handleEditNewborn}
                      style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        fontSize: '12px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 6px rgba(0, 123, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={e => {
                        e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 10px rgba(0, 123, 255, 0.4)';
                      }}
                      onMouseOut={e => {
                        e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = '0 2px 6px rgba(0, 123, 255, 0.3)';
                      }}
                    >
                      <i className="bi bi-pencil-square" style={{ fontSize: '12px' }}></i> 
                      Edit
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline-success" 
                      onClick={handleEditNewborn}
                      style={{
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        fontSize: '12px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={e => {
                        e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #1e7e34 100%)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 10px rgba(40, 167, 69, 0.4)';
                      }}
                      onMouseOut={e => {
                        e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = '0 2px 6px rgba(40, 167, 69, 0.3)';
                      }}
                    >
                      <i className="bi bi-plus-circle" style={{ fontSize: '12px' }}></i> 
                      Add
                    </Button>
                  )}
                </div>
                {newbornLoading ? (
                  <div className="text-center py-5">
                    <i className="bi bi-arrow-clockwise text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">Loading newborn data...</p>
                  </div>
                ) : selectedNewbornRow ? (
                  <div className="row g-4 flex-column">
                    {/* Growth Assessment */}
                    <div className="col-12 mb-3">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-4">
                          <div className="mb-2 fw-bold text-primary fs-5">Growth Assessment</div>
                          <hr className="my-2" />
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Length at birth (cm)</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.length_at_birth || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Weight at birth (kg)</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.weight_at_birth || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Status (Birth Weight)</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.birth_weight_status || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Initiated breast feeding immediately after birth lasting for 90 minutes (date)</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.breast_feeding_date || ''}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    {/* Nutritional Status Assessment */}
                    <div className="col-12 mb-3">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-4">
                          <div className="mb-2 fw-bold text-primary fs-5">Nutritional Status Assessment</div>
                          <hr className="my-2" />
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Age in months</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.age_in_months || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Length (cm) & date taken</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.length_in_threes_months || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Weight (kg) & date taken</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.weight_in_threes_months || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Status</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.status || ''}</div>
                            <div className="text-muted small mt-1">
                              <b>S</b> = stunted, <b>W-MAM</b> = wasted-MAM, <b>W-SAM</b> = wasted-SAM, <b>O</b> = obese/overweight, <b>N</b> = normal
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    {/* Low birth weight given Iron */}
                    <div className="col-12 mb-3">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-4">
                          <div className="mb-2 fw-bold text-primary fs-5">Low birth weight given Iron (Write the date)</div>
                          <hr className="my-2" />
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">1 mo</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.col10}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">2 mos</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.col11}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">3 mos</small>
                            <div className="fw-bold fs-6">{selectedNewbornRow.col12}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    {/* Immunization & Supplements screenshot-matching design */}
                    <div className="col-12 mb-3">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-4">
                          <div className="mb-2 fw-bold text-primary fs-5">
                            <i className="bi bi-capsule me-2"></i>
                            Immunization & Supplements
                          </div>
                          <hr className="my-2" />
                          <div className="row mb-3 text-center">
                            <div className="col-6">
                              <div className="text-muted fw-semibold">BCG (date)</div>
                              <div className="fw-bold fs-5">{selectedNewbornRow.bcg_date || ''}</div>
                            </div>
                            <div className="col-6">
                              <div className="text-muted fw-semibold">Hepa B BD (date)</div>
                              <div className="fw-bold fs-5">{selectedNewbornRow.hepa_b_bd_date || ''}</div>
                            </div>
                          </div>
                          <div className="row g-3">
                            {/* DPT-HIB-HepB */}
                            <div className="col-12 col-md-6 col-lg-3">
                              <div className="p-3 border rounded-4 bg-white h-100 text-center">
                                <div className="fw-bold mb-2" style={{ color: "#00b4d8" }}>
                                  <i className="bi bi-shield-plus me-1"></i>DPT-HIB-HepB
                                </div>
                                <div>1st dose:</div>
                                <span className="badge rounded-pill bg-success mb-2">{selectedNewbornRow.dpt_hib_hepb_1st || ''}</span>
                                <div>2nd dose:</div>
                                <span className="badge rounded-pill bg-success mb-2">{selectedNewbornRow.dpt_hib_hepb_2nd || ''}</span>
                                <div>3rd dose:</div>
                                <span className="badge rounded-pill bg-success">{selectedNewbornRow.dpt_hib_hepb_3rd || ''}</span>
                              </div>
                            </div>
                            {/* OPV */}
                            <div className="col-12 col-md-6 col-lg-3">
                              <div className="p-3 border rounded-4 bg-white h-100 text-center">
                                <div className="fw-bold mb-2" style={{ color: "#2196f3" }}>
                                  <i className="bi bi-droplet-half me-1"></i>OPV
                                </div>
                                <div>1st dose:</div>
                                <span className="badge rounded-pill bg-info text-dark mb-2">{selectedNewbornRow.opv_1st || ''}</span>
                                <div>2nd dose:</div>
                                <span className="badge rounded-pill bg-info text-dark mb-2">{selectedNewbornRow.opv_2nd || ''}</span>
                                <div>3rd dose:</div>
                                <span className="badge rounded-pill bg-info text-dark">{selectedNewbornRow.opv_3rd || ''}</span>
                              </div>
                            </div>
                            {/* PCV */}
                            <div className="col-12 col-md-6 col-lg-3">
                              <div className="p-3 border rounded-4 bg-white h-100 text-center">
                                <div className="fw-bold mb-2" style={{ color: "#ffb300" }}>
                                  <i className="bi bi-capsule me-1"></i>PCV
                                </div>
                                <div>1st dose:</div>
                                <span className="badge rounded-pill bg-warning text-dark mb-2">{selectedNewbornRow.pcv_1st || ''}</span>
                                <div>2nd dose:</div>
                                <span className="badge rounded-pill bg-warning text-dark mb-2">{selectedNewbornRow.pcv_2nd || ''}</span>
                                <div>3rd dose:</div>
                                <span className="badge rounded-pill bg-warning text-dark">{selectedNewbornRow.pcv_3rd || ''}</span>
                              </div>
                            </div>
                            {/* IPV */}
                            <div className="col-12 col-md-6 col-lg-3">
                              <div className="p-3 border rounded-4 bg-white h-100 text-center">
                                <div className="fw-bold mb-2" style={{ color: "#43aa8b" }}>
                                  <i className="bi bi-shield-check me-1"></i>IPV
                                </div>
                                <div>1st dose:</div>
                                <span className="badge rounded-pill bg-success">{selectedNewbornRow.ipv_1st || ''}</span>
                              </div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-exclamation-circle text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">No newborn data available for this record.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalSection === 'nutrition' && (
              <div>
                <div className="d-flex justify-content-end mb-3">
                  {nutritionLoading ? (
                    <Button size="sm" variant="outline-secondary" disabled className="rounded-pill px-4">
                      <i className="bi bi-arrow-clockwise me-2"></i> Loading...
                    </Button>
                  ) : selectedNutritionRow ? (
                    <Button size="sm" variant="outline-primary" onClick={handleEditNutritionSection} className="rounded-pill px-4">
                      <i className="bi bi-pencil-square me-2"></i> Edit
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline-success" onClick={handleEditNutritionSection} className="rounded-pill px-4">
                      <i className="bi bi-plus-circle me-2"></i> Add
                    </Button>
                  )}
                </div>
                {nutritionLoading ? (
                  <div className="text-center py-5">
                    <i className="bi bi-arrow-clockwise text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">Loading nutrition data...</p>
                  </div>
                ) : selectedNutritionRow ? (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <Card className="h-100 border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-graph-up me-2"></i>
                            Growth Assessment
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Age in months</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.age_in_months || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Length (cm) & date taken</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.length_cm_date || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Weight (kg) & date taken</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.weight_kg_date || ''}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Status</small>
                            <div className="fw-bold">
                              <Badge bg={selectedNutritionRow.status === 'Normal' ? 'success' : 'warning'} className="fs-6 px-3 py-2">
                                {selectedNutritionRow.status || ''}
                              </Badge>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-6">
                      <Card className="h-100 border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-heart me-2"></i>
                            Feeding Status
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Exclusively Breastfed</small>
                            <div className="fw-bold">
                              <Badge bg={selectedNutritionRow.exclusively_breastfed === 'Y' ? 'success' : 'danger'} className="fs-6 px-3 py-2">
                                {selectedNutritionRow.exclusively_breastfed === 'Y' ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Introduction of Complementary Feeding</small>
                            <div className="fw-bold">
                              <Badge bg={selectedNutritionRow.complementary_feeding === 'Y' ? 'success' : 'danger'} className="fs-6 px-3 py-2">
                                {selectedNutritionRow.complementary_feeding === 'Y' ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    {/* Immunization & Supplements clean grid design */}
                    <div className="col-12 mb-3">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-4">
                          <div className="mb-2 fw-bold text-primary fs-5">
                            <i className="bi bi-capsule me-2"></i>
                            Immunization & Supplements
                          </div>
                          <hr className="my-2" />
                          <div className="row text-center">
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">Vitamin A<br/>(date given)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.vitamin_a_date || ''}</div>
                            </div>
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">MMR Dose 1<br/>(9th month)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.mmr_1st_9mo || ''}</div>
                            </div>
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">MMR Dose 2<br/>(12th month)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.mmr_2nd_12mo || ''}</div>
                            </div>
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">MNP<br/>(90 sachets given)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.mnp_date || ''}</div>
                            </div>
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">IPV Dose 2<br/>(9th month)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.ipv_2nd_9mo || ''}</div>
                            </div>
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">FIC (date)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.fic_date || ''}</div>
                            </div>
                            <div className="col-6 col-md-4 mb-3">
                              <div className="text-muted fw-semibold">CIC (date)</div>
                              <div className="fw-bold fs-5">{selectedNutritionRow.cic_date || ''}</div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                    {/* Add 12 months old section as a new card */}
                    <div className="col-12 mb-3">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-4">
                          <div className="mb-2 fw-bold text-primary fs-5">12 months old</div>
                          <hr className="my-2" />
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Age in months</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.age_in_months_12 || 'Not specified'}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Length (cm) & date taken</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.length_cm_date_12 || 'Not specified'}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Weight (kg) & date taken</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.weight_kg_date_12 || 'Not specified'}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Status</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.status_12 || 'Not specified'}</div>
                            <div className="text-muted small mt-1">
                              <b>S</b> = stunted, <b>W-MAM</b> = wasted-MAM, <b>W-SAM</b> = wasted-SAM, <b>O</b> = obese/overweight, <b>N</b> = normal
                            </div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">MMR Dose 2 at 12th month (date given)</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.mmr_2nd_12mo || 'Not specified'}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">FIC (date)</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.fic_date || 'Not specified'}</div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">CIC (date)</small>
                            <div className="fw-bold fs-6">{selectedNutritionRow.cic_date || 'Not specified'}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-exclamation-circle text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">No nutrition data available for this record.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalSection === 'outcomes' && (
              <div>
                <div className="d-flex justify-content-end mb-3">
                  {outcomesLoading ? (
                    <Button size="sm" variant="outline-secondary" disabled className="rounded-pill px-4">
                      <i className="bi bi-arrow-clockwise me-2"></i> Loading...
                    </Button>
                  ) : selectedOutcomesRow ? (
                    <Button size="sm" variant="outline-primary" onClick={handleEditOutcomesSection} className="rounded-pill px-4">
                      <i className="bi bi-pencil-square me-2"></i> Edit
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline-success" onClick={handleEditOutcomesSection} className="rounded-pill px-4">
                      <i className="bi bi-plus-circle me-2"></i> Add
                    </Button>
                  )}
                </div>
                {outcomesLoading ? (
                  <div className="text-center py-5">
                    <i className="bi bi-arrow-clockwise text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">Loading outcomes data...</p>
                  </div>
                ) : selectedOutcomesRow ? (
                  <div className="row g-4">
                    <div className="col-12">
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-clipboard-check me-2"></i>
                            Outcomes & Remarks
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">MAM: Admitted in SFP</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.mam_admitted_sfp || 'Not specified'}</div>
                              </div>
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">MAM: Cured</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.mam_cured || 'Not specified'}</div>
                              </div>
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">MAM: Defaulted</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.mam_defaulted || 'Not specified'}</div>
                              </div>
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">MAM: Died</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.mam_died || 'Not specified'}</div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">SAM without Complication: Admitted in OTC</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.sam_admitted_otc || 'Not specified'}</div>
                              </div>
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">SAM without Complication: Cured</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.sam_cured || 'Not specified'}</div>
                              </div>
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">SAM without Complication: Defaulted</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.sam_defaulted || 'Not specified'}</div>
                              </div>
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">SAM without Complication: Died</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.sam_died || 'Not specified'}</div>
                              </div>
                            </div>
                            <div className="col-12 mt-4">
                              <div className="mb-3">
                                <small className="text-muted fw-semibold">Remarks</small>
                                <div className="fw-bold fs-6">{selectedOutcomesRow.remarks || 'No remarks'}</div>
                              </div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-exclamation-circle text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">No outcomes data available for this record.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            style={{
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={e => {
              e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
            }}
            onMouseOut={e => {
              e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
            }}
          >
            <i className="bi bi-x-circle" style={{ fontSize: '14px' }}></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Add/Edit Registration Modal */}
      <Modal show={showRegModal} onHide={handleCloseRegModal} centered size="xxl" className="modal-modern" style={{ maxWidth: '100vw', width: '100vw' }}>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className={editRegIdx !== null ? "bi bi-pencil-square me-2" : "bi bi-person-plus me-2"}></i>
            {editRegIdx !== null ? 'Edit' : 'Add'} Registration & Demographics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleRegFormSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">No.</Form.Label>
                  <Form.Control 
                    name="col1" 
                    value={regForm.col1 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Date of Registration</Form.Label>
                  <Form.Control 
                    name="col2" 
                    type="date"
                    value={regForm.col2 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Date of Birth</Form.Label>
                  <Form.Control 
                    name="col3" 
                    type="date"
                    value={regForm.col3 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Family Serial Number</Form.Label>
                  <Form.Control 
                    name="col4" 
                    value={regForm.col4 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Name of Child</Form.Label>
                  <Form.Control 
                    name="col5" 
                    value={regForm.col5 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Sex</Form.Label>
                  <Form.Select 
                    name="col6" 
                    value={regForm.col6 || ''} 
                    onChange={handleRegFormChange} 
                    required
                    className="form-control-modern"
                  >
                    <option value="">Select</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Complete Name of Mother</Form.Label>
                  <Form.Control 
                    name="col7" 
                    value={regForm.col7 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Complete Address</Form.Label>
                  <Form.Control 
                    name="col8" 
                    value={regForm.col8 || ''} 
                    onChange={handleRegFormChange} 
                    required 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">CPAB (8a)</Form.Label>
                  <Form.Control 
                    name="col9" 
                    value={regForm.col9 || ''} 
                    onChange={handleRegFormChange} 
                    className="form-control-modern"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">CPAB (8b)</Form.Label>
                  <Form.Control 
                    name="col10" 
                    value={regForm.col10 || ''} 
                    onChange={handleRegFormChange} 
                    className="form-control-modern"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4 gap-3">
              <Button 
                variant="secondary" 
                onClick={handleCloseRegModal}
                style={{
                  background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
                }}
              >
                <i className="bi bi-check-circle" style={{ fontSize: '16px' }}></i>
                {editRegIdx !== null ? 'Update' : 'Save'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Edit Newborn Modal */}
      <Modal show={showNewbornEditModal} onHide={() => setShowNewbornEditModal(false)} centered size="xl" className="modal-modern">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-baby me-2"></i>
            Edit Newborn Section
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleNewbornFormSubmit} key={JSON.stringify(newbornForm)}>
            <div className="row">
              {/* Growth Assessment */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="text-primary fw-bold mb-0">
                      <i className="bi bi-graph-up me-2"></i>
                      Growth Assessment
                    </h6>
                  </div>
                  <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Length at birth (cm)</Form.Label>
                      <Form.Control 
                        name="length_at_birth"
                        type="number"
                        step="0.1"
                        min="0"
                        max="200"
                        value={newbornForm.length_at_birth || newbornForm.col_length_at_birth || ''}
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                        placeholder="e.g., 50.5"
                        key={`length_at_birth_${newbornForm.length_at_birth}`}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Weight at birth (kg)</Form.Label>
                      <Form.Control 
                        name="col1" 
                        type="number"
                        step="0.01"
                        min="0"
                        max="99.99"
                        value={newbornForm.col1 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                        placeholder="e.g., 3.2"
                        key={`col1_${newbornForm.col1}`}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Status (Birth Weight)</Form.Label>
                      <Form.Select 
                        name="col2" 
                        value={newbornForm.col2 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select Status</option>
                        <option value="Normal">Normal</option>
                        <option value="Low">Low</option>
                        <option value="High">High</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Initiated breast feeding immediately after birth lasting for 90 minutes (date)</Form.Label>
                      <Form.Control 
                        name="col3" 
                        type="date"
                        value={newbornForm.col3 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              {/* Immunization */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="text-primary fw-bold mb-0">
                      <i className="bi bi-capsule me-2"></i>
                      Immunization
                    </h6>
                  </div>
                  <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">BCG (date)</Form.Label>
                      <Form.Control 
                        name="col4" 
                        type="date"
                        value={newbornForm.col4 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Hepa B BD (date)</Form.Label>
                      <Form.Control 
                        name="col5" 
                        type="date"
                        value={newbornForm.col5 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              {/* Nutritional Status Assessment */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="text-primary fw-bold mb-0">
                      <i className="bi bi-heart-pulse me-2"></i>
                      Nutritional Status Assessment
                    </h6>
                  </div>
                  <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Age in months</Form.Label>
                      <Form.Control 
                        name="col6" 
                        type="number"
                        min="0"
                        max="36"
                        value={newbornForm.col6 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                        placeholder="e.g., 3"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Length (cm) & date taken</Form.Label>
                      <Form.Control 
                        name="col7" 
                        value={newbornForm.col7 || ''} 
                        onChange={handleNewbornFormChange}
                        placeholder="e.g., 50 (06/01/24)"
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Weight (kg) & date taken</Form.Label>
                      <Form.Control 
                        name="col8" 
                        value={newbornForm.col8 || ''} 
                        onChange={handleNewbornFormChange}
                        placeholder="e.g., 3.2 (06/01/24)"
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-12">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Status</Form.Label>
                      <Form.Select 
                        name="col9" 
                        value={newbornForm.col9 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select Status</option>
                        <option value="S">S - Stunted</option>
                        <option value="W-MAM">W-MAM - Wasted-MAM</option>
                        <option value="W-SAM">W-SAM - Wasted-SAM</option>
                        <option value="O">O - Obese/Overweight</option>
                        <option value="N">N - Normal</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              {/* Low birth weight given Iron */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="text-primary fw-bold mb-0">
                      <i className="bi bi-droplet me-2"></i>
                      Low birth weight given Iron (Write the date)
                    </h6>
                  </div>
                  <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">1 mo</Form.Label>
                      <Form.Control 
                        name="col10" 
                        type="date"
                        value={newbornForm.col10 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">2 mos</Form.Label>
                      <Form.Control 
                        name="col11" 
                        type="date"
                        value={newbornForm.col11 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">3 mos</Form.Label>
                      <Form.Control 
                        name="col12" 
                        type="date"
                        value={newbornForm.col12 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              {/* 1-3 months old Immunization */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="text-primary fw-bold mb-0">
                      <i className="bi bi-shield-plus me-2"></i>
                      1-3 months old Immunization
                    </h6>
                    <small className="text-muted">Auto-scheduling: Next doses will be suggested 1 month after each previous dose</small>
                  </div>
                  <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-info fw-semibold mb-3">DPT-HIB-HepB</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">1st dose 1 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col13" 
                            type="date"
                            value={newbornForm.col13 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            placeholder="Enter first dose date"
                          />
                          <Form.Text className="text-muted small">
                            <i className="bi bi-info-circle me-1"></i>
                            Next dose will be auto-scheduled
                          </Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">2nd dose 2 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col14" 
                            type="date"
                            value={newbornForm.col14 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            style={newbornForm.col13 && !newbornForm.col14 ? { borderColor: '#28a745', backgroundColor: '#f8fff9' } : {}}
                          />
                          {newbornForm.col13 && !newbornForm.col14 && (
                            <Form.Text className="text-success small">
                              <i className="bi bi-calendar-check me-1"></i>
                              Auto-suggested based on 1st dose
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">3rd dose 3 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col15" 
                            type="date"
                            value={newbornForm.col15 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            style={newbornForm.col14 && !newbornForm.col15 ? { borderColor: '#28a745', backgroundColor: '#f8fff9' } : {}}
                          />
                          {newbornForm.col14 && !newbornForm.col15 && (
                            <Form.Text className="text-success small">
                              <i className="bi bi-calendar-check me-1"></i>
                              Auto-suggested based on 2nd dose
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary fw-semibold mb-3">OPV</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">1st dose 1 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col16" 
                            type="date"
                            value={newbornForm.col16 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            placeholder="Enter first dose date"
                          />
                          <Form.Text className="text-muted small">
                            <i className="bi bi-info-circle me-1"></i>
                            Next dose will be auto-scheduled
                          </Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">2nd dose 2 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col17" 
                            type="date"
                            value={newbornForm.col17 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            style={newbornForm.col16 && !newbornForm.col17 ? { borderColor: '#28a745', backgroundColor: '#f8fff9' } : {}}
                          />
                          {newbornForm.col16 && !newbornForm.col17 && (
                            <Form.Text className="text-success small">
                              <i className="bi bi-calendar-check me-1"></i>
                              Auto-suggested based on 1st dose
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">3rd dose 3 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col18" 
                            type="date"
                            value={newbornForm.col18 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            style={newbornForm.col17 && !newbornForm.col18 ? { borderColor: '#28a745', backgroundColor: '#f8fff9' } : {}}
                          />
                          {newbornForm.col17 && !newbornForm.col18 && (
                            <Form.Text className="text-success small">
                              <i className="bi bi-calendar-check me-1"></i>
                              Auto-suggested based on 2nd dose
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <h6 className="text-warning fw-semibold mb-3">PCV</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">1st dose 1 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col19" 
                            type="date"
                            value={newbornForm.col19 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            placeholder="Enter first dose date"
                          />
                          <Form.Text className="text-muted small">
                            <i className="bi bi-info-circle me-1"></i>
                            Next dose will be auto-scheduled
                          </Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">2nd dose 2 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col20" 
                            type="date"
                            value={newbornForm.col20 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            style={newbornForm.col19 && !newbornForm.col20 ? { borderColor: '#28a745', backgroundColor: '#f8fff9' } : {}}
                          />
                          {newbornForm.col19 && !newbornForm.col20 && (
                            <Form.Text className="text-success small">
                              <i className="bi bi-calendar-check me-1"></i>
                              Auto-suggested based on 1st dose
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">3rd dose 3 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col21" 
                            type="date"
                            value={newbornForm.col21 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            style={newbornForm.col20 && !newbornForm.col21 ? { borderColor: '#28a745', backgroundColor: '#f8fff9' } : {}}
                          />
                          {newbornForm.col20 && !newbornForm.col21 && (
                            <Form.Text className="text-success small">
                              <i className="bi bi-calendar-check me-1"></i>
                              Auto-suggested based on 2nd dose
                            </Form.Text>
                          )}
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-success fw-semibold mb-3">IPV</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">1st dose 3 1/2 mos</Form.Label>
                          <Form.Control 
                            name="col22" 
                            type="date"
                            value={newbornForm.col22 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-modern"
                            placeholder="Enter IPV dose date"
                          />
                          <Form.Text className="text-muted small">
                            <i className="bi bi-info-circle me-1"></i>
                            Single dose vaccine
                          </Form.Text>
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4 gap-3">
              <Button variant="secondary" onClick={() => setShowNewbornEditModal(false)} className="rounded-pill px-4">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="rounded-pill px-4">
                <i className="bi bi-check-circle me-2"></i>
                {selectedNutritionRow ? 'Update' : 'Save'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Edit Nutrition & 12 Months Modal */}
      <Modal show={showNutritionEditModal} onHide={() => setShowNutritionEditModal(false)} centered size="xl" className="modal-modern">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className={selectedNutritionRow ? "bi bi-pencil-square me-2" : "bi bi-plus-circle me-2"}></i>
            {selectedNutritionRow ? 'Edit' : 'Add'} Nutrition & 12 Months Section
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleNutritionFormSubmit}>
            <div className="row">
              {/* Nutritional Status Assessment */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-graph-up me-2"></i>
                  Nutritional Status Assessment
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">No.</Form.Label>
                      <Form.Control 
                        name="col1" 
                        value={nutritionForm.col1 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Age in months</Form.Label>
                      <Form.Control 
                        name="col2" 
                        value={nutritionForm.col2 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Length (cm) & date taken</Form.Label>
                      <Form.Control 
                        name="col3" 
                        value={nutritionForm.col3 || ''} 
                        onChange={handleNutritionFormChange}
                        placeholder="e.g., 65 (12/01/24)"
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Weight (kg) & date taken</Form.Label>
                      <Form.Control 
                        name="col4" 
                        value={nutritionForm.col4 || ''} 
                        onChange={handleNutritionFormChange}
                        placeholder="e.g., 7.5 (12/01/24)"
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-12">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Status</Form.Label>
                      <Form.Select 
                        name="col5" 
                        value={nutritionForm.col5 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select Status</option>
                        <option value="S">S - Stunted</option>
                        <option value="W-MAM">W-MAM - Wasted-MAM</option>
                        <option value="W-SAM">W-SAM - Wasted-SAM</option>
                        <option value="O">O - Obese/Overweight</option>
                        <option value="N">N - Normal</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Exclusively Breastfed */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-heart me-2"></i>
                  Exclusively Breastfed* up to 5 months and 29 days
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Y or N</Form.Label>
                      <Form.Select 
                        name="col6" 
                        value={nutritionForm.col6 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">1 - With continuous breastfeeding<br/>2 - no longer breastfeeding or never breastfed</Form.Label>
                      <Form.Select 
                        name="col7" 
                        value={nutritionForm.col7 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="1">1 - With continuous breastfeeding</option>
                        <option value="2">2 - No longer breastfeeding or never breastfed</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Introduction of Complementary Feeding */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-cup-hot me-2"></i>
                  Introduction of Complementary Feeding** at 6 months old
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Y or N</Form.Label>
                      <Form.Select 
                        name="col8" 
                        value={nutritionForm.col8 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Immunization & Supplements */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-capsule me-2"></i>
                  Immunization & Supplements
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Vitamin A (date given)</Form.Label>
                      <Form.Control 
                        name="col9" 
                        type="date"
                        value={nutritionForm.col9 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MNP (date when 90 sachets given)</Form.Label>
                      <Form.Control 
                        name="col10" 
                        type="date"
                        value={nutritionForm.col10 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MMR Dose 1 at 9th month (date given)</Form.Label>
                      <Form.Control 
                        name="col11" 
                        type="date"
                        value={nutritionForm.col11 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">IPV Dose 2 at 9th month (Routine, date given)</Form.Label>
                      <Form.Control 
                        name="col12" 
                        type="date"
                        value={nutritionForm.col12 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* 12 months old */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-calendar-check me-2"></i>
                  12 months old
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Age in months</Form.Label>
                      <Form.Control 
                        name="col13" 
                        value={nutritionForm.col13 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Length (cm) & date taken</Form.Label>
                      <Form.Control 
                        name="col14" 
                        value={nutritionForm.col14 || ''} 
                        onChange={handleNutritionFormChange}
                        placeholder="e.g., 75 (03/01/25)"
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Weight (kg) & date taken</Form.Label>
                      <Form.Control 
                        name="col15" 
                        value={nutritionForm.col15 || ''} 
                        onChange={handleNutritionFormChange}
                        placeholder="e.g., 9.2 (03/01/25)"
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Status</Form.Label>
                      <Form.Select 
                        name="col16" 
                        value={nutritionForm.col16 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select Status</option>
                        <option value="S">S - Stunted</option>
                        <option value="W-MAM">W-MAM - Wasted-MAM</option>
                        <option value="W-SAM">W-SAM - Wasted-SAM</option>
                        <option value="O">O - Obese/Overweight</option>
                        <option value="N">N - Normal</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MMR Dose 2 at 12th month (date given)</Form.Label>
                      <Form.Control 
                        name="col17" 
                        type="date"
                        value={nutritionForm.col17 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">FIC*** (date)</Form.Label>
                      <Form.Control 
                        name="col18" 
                        type="date"
                        value={nutritionForm.col18 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">CIC (date)</Form.Label>
                      <Form.Control 
                        name="col19" 
                        type="date"
                        value={nutritionForm.col19 || ''} 
                        onChange={handleNutritionFormChange}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4 gap-3">
              <Button variant="secondary" onClick={() => setShowNutritionEditModal(false)} className="rounded-pill px-4">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="rounded-pill px-4">
                <i className="bi bi-check-circle me-2"></i>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Edit Outcomes & Remarks Modal */}
      <Modal show={showOutcomesEditModal} onHide={() => setShowOutcomesEditModal(false)} centered size="xl" className="modal-modern">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-clipboard-check me-2"></i>
            Edit Outcomes & Remarks Section
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleOutcomesFormSubmit}>
            <div className="row">
              {/* MAM Outcomes */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  MAM (Moderate Acute Malnutrition) Outcomes
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MAM: Admitted in SFP</Form.Label>
                      <Form.Select 
                        name="MAM: Admitted in SFP" 
                        value={outcomesForm["MAM: Admitted in SFP"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MAM: Cured</Form.Label>
                      <Form.Select 
                        name="MAM: Cured" 
                        value={outcomesForm["MAM: Cured"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MAM: Defaulted</Form.Label>
                      <Form.Select 
                        name="MAM: Defaulted" 
                        value={outcomesForm["MAM: Defaulted"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">MAM: Died</Form.Label>
                      <Form.Select 
                        name="MAM: Died" 
                        value={outcomesForm["MAM: Died"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* SAM Outcomes */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  SAM (Severe Acute Malnutrition) without Complication Outcomes
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">SAM without Complication: Admitted in OTC</Form.Label>
                      <Form.Select 
                        name="SAM without Complication: Admitted in OTC" 
                        value={outcomesForm["SAM without Complication: Admitted in OTC"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">SAM without Complication: Cured</Form.Label>
                      <Form.Select 
                        name="SAM without Complication: Cured" 
                        value={outcomesForm["SAM without Complication: Cured"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">SAM without Complication: Defaulted</Form.Label>
                      <Form.Select 
                        name="SAM without Complication: Defaulted" 
                        value={outcomesForm["SAM without Complication: Defaulted"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">SAM without Complication: Died</Form.Label>
                      <Form.Select 
                        name="SAM without Complication: Died" 
                        value={outcomesForm["SAM without Complication: Died"] || ''} 
                        onChange={handleOutcomesFormChange}
                        className="form-control-modern"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="col-12 mb-4">
                <h6 className="text-primary fw-bold mb-3">
                  <i className="bi bi-chat-text me-2"></i>
                  Remarks
                </h6>
                <div className="row">
                  <div className="col-12">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Remarks</Form.Label>
                      <Form.Control 
                        as="textarea"
                        rows={4}
                        name="Remarks" 
                        value={outcomesForm["Remarks"] || ''} 
                        onChange={handleOutcomesFormChange}
                        placeholder="Enter any additional remarks or notes about the patient's outcomes..."
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4 gap-3">
              <Button variant="secondary" onClick={() => setShowOutcomesEditModal(false)} className="rounded-pill px-4">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="rounded-pill px-4">
                <i className="bi bi-check-circle me-2"></i>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Medical Summary Modal */}
      <Modal show={medicalSummaryModal} onHide={() => setMedicalSummaryModal(false)} centered size="xl" className="modal-modern">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-file-medical me-3"></i>
            Medical Summary
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {selectedPatientForSummary && selectedPatientForSummary.summary ? (
              <div className="row g-4">
                {/* Patient Header Section */}
                <div className="col-12">
                  <div className="patient-info-container" style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid #dee2e6',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    animation: 'fadeInUp 0.6s ease-out'
                  }}>
                    <div className="d-flex align-items-center mb-3">
                      <div className="patient-avatar me-3" style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)'
                      }}>
                        {selectedPatientForSummary.summary.patientInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="mb-1 fw-bold text-primary" style={{ animation: 'pulse 2s infinite' }}>
                          {selectedPatientForSummary.summary.patientInfo.name}
                        </h4>
                        <p className="text-muted mb-0">
                          <i className="bi bi-person me-1"></i>
                          Child of {selectedPatientForSummary.summary.patientInfo.motherName}
                        </p>
                        <p className="text-muted mb-0 small">
                          <i className="bi bi-calendar me-1"></i>
                          Last updated: {selectedPatientForSummary.summary.lastUpdated}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Details Section */}
                <div className="col-12">
                  <div className="row g-4">
                    {/* Personal Information */}
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm h-100" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div className="card-header bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-person-circle me-2"></i>
                            Personal Information
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="row g-3">
                            <div className="col-6">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Current Age</small>
                                <div className="fw-bold fs-5 text-primary">
                                  {selectedPatientForSummary.summary.patientInfo.currentAge} months
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Sex</small>
                                <div className="fw-bold fs-5">
                                  <Badge bg={selectedPatientForSummary.summary.patientInfo.sex === 'M' ? 'primary' : 'danger'} className="fs-6 px-3 py-2">
                                    {selectedPatientForSummary.summary.patientInfo.sex === 'M' ? 'Male' : 'Female'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Birth Date</small>
                                <div className="fw-bold fs-6">{selectedPatientForSummary.summary.patientInfo.birthDate}</div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Address</small>
                                <div className="fw-bold fs-6">{selectedPatientForSummary.summary.patientInfo.address}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Health Status */}
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm h-100" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div className="card-header bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-heart-pulse me-2"></i>
                            Health Status
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="row g-3">
                            <div className="col-12">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Current Weight</small>
                                <div className="fw-bold fs-5 text-success">
                                  {selectedPatientForSummary.summary.currentWeight}
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Growth Status</small>
                                <div className="fw-bold">
                                  <Badge 
                                    bg={
                                      selectedPatientForSummary.summary.growthStatus === 'N' ? 'success' :
                                      selectedPatientForSummary.summary.growthStatus === 'S' ? 'warning' :
                                      selectedPatientForSummary.summary.growthStatus === 'W-MAM' ? 'warning' :
                                      selectedPatientForSummary.summary.growthStatus === 'W-SAM' ? 'danger' :
                                      selectedPatientForSummary.summary.growthStatus === 'O' ? 'info' : 'secondary'
                                    } 
                                    className="fs-6 px-3 py-2"
                                  >
                                    {selectedPatientForSummary.summary.growthStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item">
                                <small className="text-muted fw-semibold d-block">Feeding Status</small>
                                <div className="fw-bold fs-6 text-info">{selectedPatientForSummary.summary.feedingStatus}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vaccination Summary */}
                    <div className="col-12">
                      <div className="card border-0 shadow-sm" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div className="card-header bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-shield-check me-2"></i>
                            Vaccination Summary
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <div className="text-center p-3 bg-primary text-white rounded-3">
                                <h3 className="mb-1 fw-bold">{selectedPatientForSummary.summary.totalVaccineDoses}</h3>
                                <small>Total Vaccine Doses</small>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="text-center p-3 bg-success text-white rounded-3">
                                <h3 className="mb-1 fw-bold">{selectedPatientForSummary.summary.vaccinesReceived.length}</h3>
                                <small>Vaccine Types Received</small>
                              </div>
                            </div>
                          </div>
                          
                          {selectedPatientForSummary.summary.vaccinesReceived.length > 0 ? (
                            <div className="row g-3">
                              {selectedPatientForSummary.summary.vaccinesReceived.map((vaccine, index) => (
                                <div key={index} className="col-md-6 col-lg-4">
                                  <div className="p-3 border rounded-3 bg-white h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <h6 className="mb-0 text-primary fw-bold">{vaccine.name}</h6>
                                      <Badge bg="success" className="fs-6 px-2 py-1">
                                        {vaccine.doses} dose{vaccine.doses !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <small className="text-muted">
                                      <i className="bi bi-calendar me-1"></i>
                                      Last: {formatDate(vaccine.lastDate)}
                                    </small>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <i className="bi bi-exclamation-circle text-muted display-4"></i>
                              <p className="text-muted mt-3">No vaccination records found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Health Outcomes */}
                    <div className="col-12">
                      <div className="card border-0 shadow-sm" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div className="card-header bg-light border-0 rounded-top-3">
                          <h6 className="mb-0 text-primary fw-bold">
                            <i className="bi bi-clipboard-check me-2"></i>
                            Health Outcomes
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="info-item">
                            <small className="text-muted fw-semibold d-block">Outcomes Summary</small>
                            <div className="fw-bold fs-6 text-info">{selectedPatientForSummary.summary.healthOutcomes}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-arrow-clockwise text-muted display-4"></i>
                <p className="text-muted mt-3 fs-5">Loading medical summary...</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button 
            variant="secondary" 
            onClick={() => setMedicalSummaryModal(false)}
            style={{
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={e => {
              e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
            }}
            onMouseOut={e => {
              e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
            }}
          >
            <i className="bi bi-x-circle" style={{ fontSize: '14px' }}></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
