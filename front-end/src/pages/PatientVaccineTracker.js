import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useAuth } from "../contexts/AuthContext";

const colKeys = Array.from({ length: 24 }, (_, i) => `col${i + 1}`);

// Split child_name into first, middle, last names
const splitName = (fullName) => {
  if (!fullName) return { first: '', middle: '', last: '' };
  const nameParts = fullName.trim().split(' ');
  return {
    first: nameParts[0] || '',
    middle: nameParts[1] || '',
    last: nameParts.slice(2).join(' ') || ''
  };
};

const tableConfigs = [
  {
    label: "Registration & Demographics",
    columns: [
      "registration_no", // Registration Number
      "registration_date", // Date of Registration
      "birth_date", // Date of Birth
      "family_serial_number", // Family Serial Number
      "child_name", // Child Name
      "sex", // Sex
      "mother_name", // Mother Name
      "address", // Address
      "cpab_8a", // TT2+ (8A)
      "cpab_8b", // TT3+ (8B)
      "actions" // Actions column
    ],
    data: [
      {
        registration_no: "REG-001",
        registration_date: "06/01/24",
        birth_date: "01/15/24",
        family_serial_number: "FSN-001",
        child_name: "Juan D. Cruz",
        sex: "M",
        mother_name: "Maria L. Cruz",
        address: "123 Main St, Cityville",
        cpab_8a: "√",
        cpab_8b: "Yes",
        actions: "actions"
      },
      {
        registration_no: "REG-002",
        registration_date: "06/02/24",
        birth_date: "02/20/24",
        family_serial_number: "FSN-002",
        child_name: "Ana M. Reyes",
        sex: "F",
        mother_name: "Luisa P. Reyes",
        address: "456 Elm St, Townsville",
        cpab_8a: "",
        cpab_8b: "No",
        actions: "actions"
      }
    ],
    customHeader: ( 
      <>
        <tr>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Reg. No.</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Reg. Date</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Birth Date</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '120px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Family Serial #</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '150px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Child Name</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '60px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center', verticalAlign: 'middle' }}>Sex</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '150px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Mother Name</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '200px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center', verticalAlign: 'middle' }}>Address</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '80px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>TT2+ (8A)</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '80px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>TT3+ (8B)</th>
          <th style={{ fontSize: '10px', padding: '6px 4px', maxWidth: '100px', lineHeight: '1.3', fontWeight: '600', textAlign: 'center' }}>Actions</th>
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
      "actions" // Actions column
    ],
    data: [], // Empty data by default
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
      "actions" // Actions column
    ],
    data: [], // Empty data by default
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
      "Remarks",
      "actions" // Actions column
    ],
    data: [], // Empty data by default
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

const mapRegFormToPatient = (regForm) => {
  return {
    registration_no: regForm.col1,
    registration_date: regForm.col2,
    birth_date: regForm.col3,
    family_serial_number: regForm.col4,
    child_name: regForm.col5, // Name of Child
    sex: regForm.col6, // Sex
    mother_name: regForm.col7, // Complete Name of Mother
    address: regForm.col8, // Complete Address
    cpab_8a: regForm.col9, // CPAB (8a)
    cpab_8b: regForm.col10, // CPAB (8b)
  };
};

const mapPatientToRegForm = (patient) => ({
  col1: patient.registration_no,
  col2: patient.registration_date,
  col3: patient.birth_date,
  col4: patient.family_serial_number,
  col5: patient.child_name, // Name of Child
  col6: patient.sex, // Sex
  col7: patient.mother_name, // Complete Name of Mother
  col8: patient.address, // Complete Address
  col9: patient.cpab_8a, // CPAB (8a)
  col10: patient.cpab_8b, // CPAB (8b)
});

export default function PatientVaccineTracker() {
  const { user, getToken, isAuthenticated } = useAuth();
  
  // Add CSS for search animation
  const searchAnimationStyle = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  
  // Helper function for authenticated API requests
  const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Helper function to log audit activities
  const logAuditActivity = async (action, model, modelId, description) => {
    try {
      const token = getToken();
      if (token) {
        await fetch('http://127.0.0.1:8000/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            model,
            model_id: modelId,
            description,
          }),
        });
      }
    } catch (error) {
      // Silent fail for audit logging
    }
  };

  const [activePage, setActivePage] = useState(0);
  const [regData, setRegData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [selectedRow, setSelectedRow] = useState(null); // Data for modal
  const [selectedNutritionRow, setSelectedNutritionRow] = useState(null); // Nutrition data for modal
  const [selectedOutcomesRow, setSelectedOutcomesRow] = useState(null); // Outcomes data for modal
  const [selectedNewbornRow, setSelectedNewbornRow] = useState(null); // Newborn data for modal
  const [newbornLoading, setNewbornLoading] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [outcomesLoading, setOutcomesLoading] = useState(false);
  
  // State for all patient data
  const [allNewbornData, setAllNewbornData] = useState([]);
  const [allNutritionData, setAllNutritionData] = useState([]);
  const [allOutcomesData, setAllOutcomesData] = useState([]);
  // Note: recentlyCreatedPatients mechanism removed - now always fetch data including placeholders
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
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Archive functionality states
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchivingPatientId, setUnarchivingPatientId] = useState(null);
  
  // Archived modal search and filter states
  const [archivedSearchTerm, setArchivedSearchTerm] = useState('');
  const [archivedSexFilter, setArchivedSexFilter] = useState('all');
  const [filteredArchivedPatients, setFilteredArchivedPatients] = useState([]);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const [archivedRowsPerPage, setArchivedRowsPerPage] = useState(10);

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
      const res = await getPatients();
      setRegData(res.data);
      
      // Fetch all newborn, nutrition, and outcomes data for all patients
      await fetchAllPatientData(res.data);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all newborn, nutrition, and outcomes data for all patients
  const fetchAllPatientData = async (patients) => {
    try {
      // Clear existing data first
      setAllNewbornData([]);
      setAllNutritionData([]);
      setAllOutcomesData([]);
      
        // Fetch all newborn data
        const newbornResponse = await getNewbornImmunizations();
        setAllNewbornData(newbornResponse.data || []);
        
        // Fetch all nutrition data
        const nutritionResponse = await getNutrition12Months();
        setAllNutritionData(nutritionResponse.data || []);
        
        // Fetch all outcomes data
        const outcomesResponse = await getOutcomes();
        setAllOutcomesData(outcomesResponse.data || []);
    } catch (err) {
      // Set empty arrays on error
      setAllNewbornData([]);
      setAllNutritionData([]);
      setAllOutcomesData([]);
    }
  };

  // Force refresh all data
  const refreshAllData = async () => {
    await fetchAllPatientData();
  };

  // Simple approach: Check if any meaningful field has real data
  const hasRealData = (data) => {
    if (!data) return false;
    
    // List of key fields that indicate real user data entry
    const keyFields = [
      'weight_at_birth', 'length_at_birth', 'birth_weight_status', 'breast_feeding_date', 'bcg_date', 'hepa_b_bd_date',
      'dpt_hib_hepb_1st', 'dpt_hib_hepb_2nd', 'dpt_hib_hepb_3rd', 'opv_1st', 'opv_2nd', 'opv_3rd',
      'pcv_1st', 'pcv_2nd', 'pcv_3rd', 'ipv_1st', 'iron_1mo_date', 'iron_2mo_date', 'iron_3mo_date',
      'age_in_months_6', 'length_cm_date_6', 'weight_kg_date_6', 'age_in_months_12', 'length_cm_date_12', 'weight_kg_date_12',
      'exclusively_breastfed', 'complementary_feeding', 'vitamin_a_date', 'mnp_date', 'mmr_1st_9mo', 'mmr_2nd_12mo',
      'outcome', 'remarks', 'mam_cured', 'sam_cured', 'mam_defaulted', 'sam_defaulted', 'mam_died', 'sam_died'
    ];
    
    // Check if any key field has meaningful data
    for (const field of keyFields) {
      if (data[field] && data[field].toString().trim() !== '' && data[field] !== '0' && data[field] !== 'N/A') {
        return true;
      }
    }
    
    return false;
  };

  // Handler for View button
  const handleView = async (rowIdx) => {
    // Determine which dataset to use based on search state
    const dataSource = hasSearched ? filteredData : regData;
    const dataSourceName = hasSearched ? 'filteredData' : 'regData';
    
    // Calculate the actual index in the current dataset
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIdx;
    const patient = dataSource[actualIndex];
    
    setSelectedRow(patient);
    
    // Check if patient exists
    if (!patient) {
      alert('Patient not found. Please try again.');
      return;
    }
    
    // Log view activity
    await logAuditActivity(
      'Viewed',
      'PatientInformation',
      patient.id,
      `Viewed patient record: ${patient.child_name} (ID: ${patient.id})`
    );
    
    // Fetch newborn data for this patient
    setNewbornLoading(true);
    try {
      const newbornRes = await getNewbornImmunizationByPatient(patient.id);
      
      // Handle the response data properly - it might be an array or single object
      let newbornData = null;
      if (newbornRes.data) {
        if (Array.isArray(newbornRes.data)) {
          newbornData = newbornRes.data.length > 0 ? newbornRes.data[0] : null;
        } else {
          newbornData = newbornRes.data;
        }
      }
      
      setSelectedNewbornRow(newbornData);
      } catch (err) {
        setSelectedNewbornRow(null);
    } finally {
      setNewbornLoading(false);
    }
    
    // Fetch nutrition data for this patient
    setNutritionLoading(true);
    try {
      const nutritionRes = await getNutrition12MonthsByPatient(patient.id);
      
      // Handle the response data properly - it might be an array or single object
      let nutritionData = null;
      if (nutritionRes.data) {
        if (Array.isArray(nutritionRes.data)) {
          nutritionData = nutritionRes.data.length > 0 ? nutritionRes.data[0] : null;
        } else {
          nutritionData = nutritionRes.data;
        }
      }
      
      setSelectedNutritionRow(nutritionData);
      } catch (err) {
        setSelectedNutritionRow(null);
    } finally {
      setNutritionLoading(false);
    }
    
    // Fetch outcomes data for this patient
    setOutcomesLoading(true);
    try {
      const outcomesRes = await getOutcomeByPatient(patient.id);
      
      // Handle the response data properly - it might be an array or single object
      let outcomesData = null;
      if (outcomesRes.data) {
        if (Array.isArray(outcomesRes.data)) {
          outcomesData = outcomesRes.data.length > 0 ? outcomesRes.data[0] : null;
        } else {
          outcomesData = outcomesRes.data;
        }
      }
      
      setSelectedOutcomesRow(outcomesData);
      } catch (err) {
        setSelectedOutcomesRow(null);
    } finally {
      setOutcomesLoading(false);
    }
    
    setActiveModalSection('registration'); // Default to first section
    setShowModal(true);
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
      // Use the correct data source for finding the patient
      const dataSource = hasSearched ? filteredData : regData;
      const originalPatient = dataSource.find(patient => patient.id === selectedRow.id);
      
      
      if (originalPatient) {
        const formData = mapPatientToRegForm(originalPatient);
        // Format dates for HTML date inputs
        formData.col2 = formatDateForInput(formData.col2);
        formData.col3 = formatDateForInput(formData.col3);
        setRegForm(formData);
        setEditRegIdx(dataSource.findIndex(row => row.id === selectedRow.id));
        setShowRegModal(true);
      } else {
        alert('Patient not found. Please try again.');
      }
    }
  };
  const handleAddNutrition = () => alert('Add Nutrition & 12 Months');

  // Validation function for name fields (child name and mother name)
  const validateNameField = (value) => {
    // Allow only letters, spaces, hyphens, commas, and periods
    // Remove any characters that are not letters, spaces, hyphens, commas, or periods
    return value.replace(/[^a-zA-Z\s\-,.]/g, '');
  };

  // Handle form change - use callback to prevent recreation
  const handleRegFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Apply name validation for child name (col5) and mother name (col7)
    if (name === 'col5' || name === 'col7') {
      const validatedValue = validateNameField(value);
      setRegForm(prevForm => ({ ...prevForm, [name]: validatedValue }));
    } else {
      setRegForm(prevForm => ({ ...prevForm, [name]: value }));
    }
  }, []);
  // Handle form submit
  const handleRegFormSubmit = async (e) => {
    e.preventDefault();
      try {
        const mapped = mapRegFormToPatient(regForm);
        mapped.registration_date = formatDateToYMD(mapped.registration_date);
        mapped.birth_date = formatDateToYMD(mapped.birth_date);
      
      // Validate required fields
      if (!mapped.registration_no || !mapped.registration_date || !mapped.birth_date || 
          !mapped.family_serial_number || !mapped.child_name || !mapped.sex || 
          !mapped.mother_name || !mapped.address) {
        alert('Please fill in all required fields');
        return;
      }
      
        if (editRegIdx !== null) {
          // Update existing patient
          const patientId = regData[editRegIdx].id;
          const originalPatient = regData[editRegIdx];
        
        // Log update activity
        await logAuditActivity(
          'Updated',
          'PatientInformation',
          patientId,
          `Updated patient record: ${mapped.child_name} (ID: ${patientId})`
        );
        
        await updatePatient(patientId, mapped);
        
        // Optimistically update the local data instead of full reload
        setRegData(prevData => 
          prevData.map((patient, index) => 
            index === editRegIdx ? { ...patient, ...mapped } : patient
          )
        );
        
        } else {
          // Create new patient
          const result = await createPatient(mapped);
        
        // Log create activity
        await logAuditActivity(
          'Created',
          'PatientInformation',
          result.data?.id || 'new',
          `Created new patient record: ${mapped.child_name}`
        );
        
        // Create empty placeholder records for newborn, nutrition, and outcomes
          if (result.data?.id) {
            const patientId = result.data.id;
          
          try {
            // Create empty newborn record
            const emptyNewbornData = {
              patient_id: patientId,
              weight_at_birth: '',
              birth_weight_status: '',
              breast_feeding_date: '',
              bcg_date: '',
              hepa_b_bd_date: '',
              age_in_months: '',
              length_in_threes_months: '',
              weight_in_threes_months: '',
              status: '',
              iron_1mo_date: '',
              iron_2mo_date: '',
              iron_3mo_date: '',
              dpt_hib_hepb_1st: '',
              dpt_hib_hepb_2nd: '',
              dpt_hib_hepb_3rd: '',
              opv_1st: '',
              opv_2nd: '',
              opv_3rd: '',
              pcv_1st: '',
              pcv_2nd: '',
              pcv_3rd: '',
              ipv_1st: ''
              };
              await createNewbornImmunization(emptyNewbornData);
            
            // Create empty nutrition record
            const emptyNutritionData = {
              patient_id: patientId,
              record_number: '',
              age_in_months: '',
              length_cm_date: '',
              weight_kg_date: '',
              status: '',
              exclusively_breastfed: '',
              complementary_feeding: '',
              vitamin_a_date: '',
              mnp_date: '',
              mmr_1st_9mo: '',
              ipv_2nd_9mo: '',
              mmr_2nd_12mo: '',
              fic_date: '',
              cic_date: ''
              };
              await createNutrition12Months(emptyNutritionData);
            
            // Create empty outcomes record
            const emptyOutcomesData = {
              patient_id: patientId,
              mam_admitted_sfp: '',
              mam_cured: '',
              mam_defaulted: '',
              mam_died: '',
              sam_admitted_otc: '',
              sam_cured: '',
              sam_defaulted: '',
              sam_died: '',
              remarks: ''
              };
              await createOutcome(emptyOutcomesData);
            
            // Log the creation of placeholder records
            await logAuditActivity(
              'Created',
              'PlaceholderRecords',
              patientId,
              `Created empty placeholder records for newborn, nutrition, and outcomes for patient: ${mapped.child_name}`
            );
            
          } catch (placeholderError) {
            // Don't fail the entire patient creation if placeholder creation fails
          }
          
          // Note: No need to mark as recently created since we now fetch all data including placeholders
        }
        
        // Optimistically add new patient to local data instead of full reload
        if (result.data?.id) {
          const newPatient = { ...mapped, id: result.data.id };
          setRegData(prevData => [...prevData, newPatient]);
        }
      }
      setShowRegModal(false);
      setRegForm({});
      setEditRegIdx(null);
    } catch (err) {
      alert('Failed to save patient: ' + (err.response?.data?.message || err.message));
    }
  };

  // Helper function to calculate next dose date (1 month later) - memoized
  const calculateNextDoseDate = useCallback((currentDate) => {
    if (!currentDate) return '';
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  // Enhanced auto-scheduling with suggestions - memoized
  const getVaccineSuggestions = useCallback((vaccineType, currentDose, date) => {
    if (!date) return null;
    
    const suggestions = {
      'DPT-HIB-HepB': {
        1: { nextDose: 2, nextDate: calculateNextDoseDate(date), message: '2nd dose suggested for next month' },
        2: { nextDose: 3, nextDate: calculateNextDoseDate(date), message: '3rd dose suggested for next month' }
      },
      'OPV': {
        1: { nextDose: 2, nextDate: calculateNextDoseDate(date), message: '2nd dose suggested for next month' },
        2: { nextDose: 3, nextDate: calculateNextDoseDate(date), message: '3rd dose suggested for next month' }
      },
      'PCV': {
        1: { nextDose: 2, nextDate: calculateNextDoseDate(date), message: '2nd dose suggested for next month' },
        2: { nextDose: 3, nextDate: calculateNextDoseDate(date), message: '3rd dose suggested for next month' }
      }
    };
    
    return suggestions[vaccineType]?.[currentDose] || null;
  }, [calculateNextDoseDate]);

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
    
    // Check if data has real content before using it
    const hasNewbornData = hasRealData(newbornData);
    const hasNutritionData = hasRealData(nutritionData);
    const hasOutcomesData = hasRealData(outcomesData);
    
    // Calculate current weight (from nutrition data or newborn data)
    let currentWeight = 'Not recorded';
    if (hasNutritionData && nutritionData.weight_kg_date_12) {
      currentWeight = nutritionData.weight_kg_date_12;
    } else if (hasNutritionData && nutritionData.weight_kg_date) {
      currentWeight = nutritionData.weight_kg_date;
    } else if (hasNewbornData && newbornData.weight_in_threes_months) {
      currentWeight = newbornData.weight_in_threes_months;
    }

    // Count vaccines received
    const vaccinesReceived = [];
    if (hasNewbornData && newbornData) {
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
    if (hasNutritionData && nutritionData) {
      if (nutritionData.mmr_1st_9mo) vaccinesReceived.push({ name: 'MMR (1st)', doses: 1, lastDate: nutritionData.mmr_1st_9mo });
      if (nutritionData.mmr_2nd_12mo) vaccinesReceived.push({ name: 'MMR (2nd)', doses: 1, lastDate: nutritionData.mmr_2nd_12mo });
      if (nutritionData.ipv_2nd_9mo) vaccinesReceived.push({ name: 'IPV (2nd)', doses: 1, lastDate: nutritionData.ipv_2nd_9mo });
    }

    // Calculate total vaccine doses
    const totalVaccineDoses = vaccinesReceived.reduce((sum, vaccine) => sum + vaccine.doses, 0);

    // Growth status
    let growthStatus = 'Not assessed';
    if (hasNutritionData && nutritionData && nutritionData.status_12) {
      growthStatus = nutritionData.status_12;
    } else if (hasNutritionData && nutritionData && nutritionData.status) {
      growthStatus = nutritionData.status;
    } else if (hasNewbornData && newbornData && newbornData.status) {
      growthStatus = newbornData.status;
    }

    // Feeding status
    let feedingStatus = 'Not recorded';
    if (hasNutritionData && nutritionData) {
      const breastfed = nutritionData.exclusively_breastfed === 'Y' ? 'Yes' : 'No';
      const complementary = nutritionData.complementary_feeding === 'Y' ? 'Yes' : 'No';
      feedingStatus = `Exclusively breastfed: ${breastfed}, Complementary feeding: ${complementary}`;
    }

    // Health outcomes
    let healthOutcomes = 'No outcomes recorded';
    if (hasOutcomesData && outcomesData) {
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

    const splitNames = splitName(patient.child_name);
    return {
      patientInfo: {
        name: `${splitNames.first} ${splitNames.middle} ${splitNames.last}`.trim(),
        firstName: splitNames.first,
        middleName: splitNames.middle,
        lastName: splitNames.last,
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
    // Determine which dataset to use based on search state
    const dataSource = hasSearched ? filteredData : regData;
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIdx;
    const patient = dataSource[actualIndex];
    
    
    if (!patient) {
      alert('Patient not found. Please try again.');
      return;
    }
    
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
      alert('Failed to load patient data for summary');
    }
  };

  // Form change handlers
  const handleNewbornFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setNewbornForm(prevForm => {
      const updatedForm = { ...prevForm, [name]: value };
      
      // Enhanced auto-schedule next doses for vaccines with suggestions
      if (name === 'col13' && value) { // DPT-HIB-HepB 1st dose
        updatedForm.col14 = calculateNextDoseDate(value); // 2nd dose
        updatedForm.vaccineSuggestion = {
          type: 'DPT-HIB-HepB',
          dose: 2,
          suggestedDate: calculateNextDoseDate(value),
          message: '2nd dose auto-scheduled for next month'
        };
      }
      if (name === 'col14' && value) { // DPT-HIB-HepB 2nd dose
        updatedForm.col15 = calculateNextDoseDate(value); // 3rd dose
        updatedForm.vaccineSuggestion = {
          type: 'DPT-HIB-HepB',
          dose: 3,
          suggestedDate: calculateNextDoseDate(value),
          message: '3rd dose auto-scheduled for next month'
        };
      }
      if (name === 'col16' && value) { // OPV 1st dose
        updatedForm.col17 = calculateNextDoseDate(value); // 2nd dose
        updatedForm.vaccineSuggestion = {
          type: 'OPV',
          dose: 2,
          suggestedDate: calculateNextDoseDate(value),
          message: '2nd dose auto-scheduled for next month'
        };
      }
      if (name === 'col17' && value) { // OPV 2nd dose
        updatedForm.col18 = calculateNextDoseDate(value); // 3rd dose
        updatedForm.vaccineSuggestion = {
          type: 'OPV',
          dose: 3,
          suggestedDate: calculateNextDoseDate(value),
          message: '3rd dose auto-scheduled for next month'
        };
      }
      if (name === 'col19' && value) { // PCV 1st dose
        updatedForm.col20 = calculateNextDoseDate(value); // 2nd dose
        updatedForm.vaccineSuggestion = {
          type: 'PCV',
          dose: 2,
          suggestedDate: calculateNextDoseDate(value),
          message: '2nd dose auto-scheduled for next month'
        };
      }
      if (name === 'col20' && value) { // PCV 2nd dose
        updatedForm.col21 = calculateNextDoseDate(value); // 3rd dose
        updatedForm.vaccineSuggestion = {
          type: 'PCV',
          dose: 3,
          suggestedDate: calculateNextDoseDate(value),
          message: '3rd dose auto-scheduled for next month'
        };
      }
      
      return updatedForm;
    });
  }, []);
  const handleNutritionFormChange = useCallback((e) => {
    setNutritionForm(prevForm => ({ ...prevForm, [e.target.name]: e.target.value }));
  }, []);
  
  const handleOutcomesFormChange = useCallback((e) => {
    setOutcomesForm(prevForm => ({ ...prevForm, [e.target.name]: e.target.value }));
  }, []);

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

      if (selectedNewbornRow && selectedNewbornRow.id) {
        // Update existing newborn record
        await updateNewbornImmunization(selectedNewbornRow.id, newbornData);
        
        // Optimistically update local newborn data
        setAllNewbornData(prevData => 
          prevData.map(record => 
            record.patient_id === patientId ? { ...record, ...newbornData } : record
          )
        );
      } else {
        // Create new newborn record
        const result = await createNewbornImmunization(newbornData);
        
        // Optimistically add new newborn record to local data
        if (result.data) {
          setAllNewbornData(prevData => [...prevData, result.data]);
        }
      }

      // Update selected newborn row optimistically
      setSelectedNewbornRow(prev => ({ ...prev, ...newbornData }));
      setShowNewbornEditModal(false);
    } catch (err) {
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

      if (selectedNutritionRow && selectedNutritionRow.id) {
        // Update existing nutrition record
        await updateNutrition12Months(selectedNutritionRow.id, nutritionData);
        
        // Optimistically update local nutrition data
        setAllNutritionData(prevData => 
          prevData.map(record => 
            record.patient_id === patientId ? { ...record, ...nutritionData } : record
          )
        );
      } else {
        // Create new nutrition record
        const result = await createNutrition12Months(nutritionData);
        
        // Optimistically add new nutrition record to local data
        if (result.data) {
          setAllNutritionData(prevData => [...prevData, result.data]);
        }
      }

      // Update selected nutrition row optimistically
      setSelectedNutritionRow(prev => ({ ...prev, ...nutritionData }));
      setShowNutritionEditModal(false);
    } catch (err) {
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

      if (selectedOutcomesRow && selectedOutcomesRow.id) {
        // Update existing outcomes record
        await updateOutcome(selectedOutcomesRow.id, outcomesData);
        
        // Optimistically update local outcomes data
        setAllOutcomesData(prevData => 
          prevData.map(record => 
            record.patient_id === patientId ? { ...record, ...outcomesData } : record
          )
        );
      } else {
        // Create new outcomes record
        const result = await createOutcome(outcomesData);
        
        // Optimistically add new outcomes record to local data
        if (result.data) {
          setAllOutcomesData(prevData => [...prevData, result.data]);
        }
      }

      // Update selected outcomes row optimistically
      setSelectedOutcomesRow(prev => ({ ...prev, ...outcomesData }));
      setShowOutcomesEditModal(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      alert('Failed to save outcomes data: ' + errorMessage);
    }
  };

  // Search functionality
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredData([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Add a small delay to show loading state
    setTimeout(() => {
      const filtered = regData.filter(patient => {
        const childName = (patient.child_name || '').toLowerCase();
        const motherName = (patient.mother_name || '').toLowerCase();
        
        return childName.includes(searchLower) || motherName.includes(searchLower);
      });

      setFilteredData(filtered);
      setHasSearched(true); // Mark that a search has been performed AFTER filtering completes
      setIsSearching(false);
      
      // Log search results for debugging
      console.log(`🔍 Search completed for "${searchTerm}": ${filtered.length} results found`);
    }, 300); // Small delay to show loading state
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredData([]);
    setIsSearching(false);
    setHasSearched(false);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    
    // Clear filtered data if search term is empty
    if (!e.target.value.trim()) {
      setFilteredData([]);
      setIsSearching(false);
      setHasSearched(false);
    } else {
      // Reset hasSearched when user starts typing a new search
      setHasSearched(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Map backend data to frontend column structure
  const mapBackendDataToColumns = (patients) => {
    
    const mappedData = patients.map(patient => ({
      registration_no: patient.registration_no || patient.id,
      registration_date: formatDate(patient.registration_date),
      birth_date: formatDate(patient.birth_date),
      family_serial_number: patient.family_serial_number,
      child_name: patient.child_name,
      sex: patient.sex,
      mother_name: patient.mother_name,
      address: patient.address,
      cpab_8a: patient.cpab_8a,
      cpab_8b: patient.cpab_8b,
      actions: "actions", // Add actions column for proper header display
      id: patient.id // Keep the original ID for CRUD operations
    }));
    
    return mappedData;
  };

  // Map newborn data to table columns
  const mapNewbornDataToColumns = (newbornData) => {
    if (!newbornData) return [];
    
    // Check if this is an empty placeholder record (all fields are empty)
    const isEmptyPlaceholder = !newbornData.weight_at_birth && 
                              !newbornData.birth_weight_status && 
                              !newbornData.breast_feeding_date && 
                              !newbornData.bcg_date && 
                              !newbornData.hepa_b_bd_date;
    
    return [{
      col1: newbornData.weight_at_birth || '',
      col2: newbornData.birth_weight_status || '',
      col3: formatDate(newbornData.breast_feeding_date) || '',
      col4: formatDate(newbornData.bcg_date) || '',
      col5: formatDate(newbornData.hepa_b_bd_date) || '',
      col6: newbornData.age_in_months || '',
      col7: newbornData.length_at_birth || '', // Fixed: was length_in_threes_months
      col8: newbornData.weight_in_threes_months || '',
      col9: formatDate(newbornData.iron_1mo_date) || '',
      col10: formatDate(newbornData.iron_2mo_date) || '',
      col11: formatDate(newbornData.iron_3mo_date) || '',
      col12: formatDate(newbornData.dpt_hib_hepb_1st) || '',
      col13: formatDate(newbornData.dpt_hib_hepb_2nd) || '',
      col14: formatDate(newbornData.dpt_hib_hepb_3rd) || '',
      col15: formatDate(newbornData.opv_1st) || '',
      col16: formatDate(newbornData.opv_2nd) || '',
      col17: formatDate(newbornData.opv_3rd) || '',
      col18: formatDate(newbornData.pcv_1st) || '',
      col19: formatDate(newbornData.pcv_2nd) || '',
      col20: formatDate(newbornData.pcv_3rd) || '',
      col21: formatDate(newbornData.ipv_1st) || '',
      actions: "actions",
      id: newbornData.id,
      isEmptyPlaceholder: isEmptyPlaceholder
    }];
  };

  // Map all newborn data to table columns
  const mapAllNewbornDataToColumns = (allNewbornData) => {
    if (!allNewbornData || allNewbornData.length === 0) {
      return [];
    }
    
    return allNewbornData.map(newbornData => {
      // More comprehensive check for empty placeholder record
      const isEmptyPlaceholder = !newbornData.weight_at_birth && 
                                !newbornData.birth_weight_status && 
                                !newbornData.breast_feeding_date && 
                                !newbornData.bcg_date && 
                                !newbornData.hepa_b_bd_date &&
                                !newbornData.age_in_months &&
                                !newbornData.length_at_birth &&
                                !newbornData.weight_in_threes_months &&
                                !newbornData.status &&
                                !newbornData.iron_1mo_date &&
                                !newbornData.iron_2mo_date &&
                                !newbornData.iron_3mo_date &&
                                !newbornData.dpt_hib_hepb_1st &&
                                !newbornData.dpt_hib_hepb_2nd &&
                                !newbornData.dpt_hib_hepb_3rd &&
                                !newbornData.opv_1st &&
                                !newbornData.opv_2nd &&
                                !newbornData.opv_3rd &&
                                !newbornData.pcv_1st &&
                                !newbornData.pcv_2nd &&
                                !newbornData.pcv_3rd &&
                                !newbornData.ipv_1st;
      
      
      return {
        col1: newbornData.weight_at_birth || '',
        col2: newbornData.birth_weight_status || '',
        col3: formatDate(newbornData.breast_feeding_date) || '',
        col4: formatDate(newbornData.bcg_date) || '',
        col5: formatDate(newbornData.hepa_b_bd_date) || '',
        col6: newbornData.age_in_months || '',
        col7: newbornData.length_at_birth || '', // Fixed: was length_in_threes_months
        col8: newbornData.weight_in_threes_months || '',
        col9: formatDate(newbornData.iron_1mo_date) || '',
        col10: formatDate(newbornData.iron_2mo_date) || '',
        col11: formatDate(newbornData.iron_3mo_date) || '',
        col12: formatDate(newbornData.dpt_hib_hepb_1st) || '',
        col13: formatDate(newbornData.dpt_hib_hepb_2nd) || '',
        col14: formatDate(newbornData.dpt_hib_hepb_3rd) || '',
        col15: formatDate(newbornData.opv_1st) || '',
        col16: formatDate(newbornData.opv_2nd) || '',
        col17: formatDate(newbornData.opv_3rd) || '',
        col18: formatDate(newbornData.pcv_1st) || '',
        col19: formatDate(newbornData.pcv_2nd) || '',
        col20: formatDate(newbornData.pcv_3rd) || '',
        col21: formatDate(newbornData.ipv_1st) || '',
        actions: "actions",
        id: newbornData.id,
        isEmptyPlaceholder: isEmptyPlaceholder
      };
    });
  };

  // Map nutrition data to table columns
  const mapNutritionDataToColumns = (nutritionData) => {
    if (!nutritionData) return [];
    
    // Check if this is an empty placeholder record (all fields are empty)
    const isEmptyPlaceholder = !nutritionData.record_number && 
                              !nutritionData.age_in_months && 
                              !nutritionData.length_cm_date && 
                              !nutritionData.weight_kg_date && 
                              !nutritionData.status;
    
    return [{
      col1: nutritionData.record_number || '',
      col2: nutritionData.age_in_months || '',
      col3: nutritionData.length_cm_date || '',
      col4: nutritionData.weight_kg_date || '',
      col5: nutritionData.status || '',
      col6: nutritionData.exclusively_breastfed || '',
      col7: nutritionData.complementary_feeding || '',
      col8: formatDate(nutritionData.vitamin_a_date) || '',
      col9: formatDate(nutritionData.mnp_date) || '',
      col10: formatDate(nutritionData.mmr_1st_9mo) || '',
      col11: formatDate(nutritionData.ipv_2nd_9mo) || '',
      col12: formatDate(nutritionData.mmr_2nd_12mo) || '',
      col13: formatDate(nutritionData.fic_date) || '',
      col14: formatDate(nutritionData.cic_date) || '',
      actions: "actions",
      id: nutritionData.id,
      isEmptyPlaceholder: isEmptyPlaceholder
    }];
  };

  // Map all nutrition data to table columns
  const mapAllNutritionDataToColumns = (allNutritionData) => {
    if (!allNutritionData || allNutritionData.length === 0) {
      return [];
    }
    
    return allNutritionData.map(nutritionData => {
      // More comprehensive check for empty placeholder record
      const isEmptyPlaceholder = !nutritionData.record_number && 
                                !nutritionData.age_in_months && 
                                !nutritionData.length_cm_date && 
                                !nutritionData.weight_kg_date && 
                                !nutritionData.status &&
                                !nutritionData.exclusively_breastfed &&
                                !nutritionData.complementary_feeding &&
                                !nutritionData.vitamin_a_date &&
                                !nutritionData.mnp_date &&
                                !nutritionData.mmr_1st_9mo &&
                                !nutritionData.ipv_2nd_9mo &&
                                !nutritionData.mmr_2nd_12mo &&
                                !nutritionData.fic_date &&
                                !nutritionData.cic_date;
      
      
      return {
        col1: nutritionData.record_number || '',
        col2: nutritionData.age_in_months || '',
        col3: nutritionData.length_cm_date || '',
        col4: nutritionData.weight_kg_date || '',
        col5: nutritionData.status || '',
        col6: nutritionData.exclusively_breastfed || '',
        col7: nutritionData.complementary_feeding || '',
        col8: formatDate(nutritionData.vitamin_a_date) || '',
        col9: formatDate(nutritionData.mnp_date) || '',
        col10: formatDate(nutritionData.mmr_1st_9mo) || '',
        col11: formatDate(nutritionData.ipv_2nd_9mo) || '',
        col12: formatDate(nutritionData.mmr_2nd_12mo) || '',
        col13: formatDate(nutritionData.fic_date) || '',
        col14: formatDate(nutritionData.cic_date) || '',
        actions: "actions",
        id: nutritionData.id,
        isEmptyPlaceholder: isEmptyPlaceholder
      };
    });
  };

  // Map outcomes data to table columns
  const mapOutcomesDataToColumns = (outcomesData) => {
    if (!outcomesData) return [];
    
    // Check if this is an empty placeholder record (all fields are empty)
    const isEmptyPlaceholder = !outcomesData.mam_admitted_sfp && 
                              !outcomesData.mam_cured && 
                              !outcomesData.mam_defaulted && 
                              !outcomesData.mam_died && 
                              !outcomesData.sam_admitted_otc;
    
    return [{
      "MAM: Admitted in SFP": outcomesData.mam_admitted_sfp || '',
      "MAM: Cured": outcomesData.mam_cured || '',
      "MAM: Defaulted": outcomesData.mam_defaulted || '',
      "MAM: Died": outcomesData.mam_died || '',
      "SAM without Complication: Admitted in OTC": outcomesData.sam_admitted_otc || '',
      "SAM without Complication: Cured": outcomesData.sam_cured || '',
      "SAM without Complication: Defaulted": outcomesData.sam_defaulted || '',
      "SAM without Complication: Died": outcomesData.sam_died || '',
      "Remarks": outcomesData.remarks || '',
      "actions": "actions",
      "id": outcomesData.id,
      "isEmptyPlaceholder": isEmptyPlaceholder
    }];
  };

  // Map all outcomes data to table columns
  const mapAllOutcomesDataToColumns = (allOutcomesData) => {
    if (!allOutcomesData || allOutcomesData.length === 0) {
      return [];
    }
    
    return allOutcomesData.map(outcomesData => {
      // More comprehensive check for empty placeholder record
      const isEmptyPlaceholder = !outcomesData.mam_admitted_sfp && 
                                !outcomesData.mam_cured && 
                                !outcomesData.mam_defaulted && 
                                !outcomesData.mam_died && 
                                !outcomesData.sam_admitted_otc &&
                                !outcomesData.sam_cured &&
                                !outcomesData.sam_defaulted &&
                                !outcomesData.sam_died &&
                                !outcomesData.remarks;
      
      return {
        "MAM: Admitted in SFP": outcomesData.mam_admitted_sfp || '',
        "MAM: Cured": outcomesData.mam_cured || '',
        "MAM: Defaulted": outcomesData.mam_defaulted || '',
        "MAM: Died": outcomesData.mam_died || '',
        "SAM without Complication: Admitted in OTC": outcomesData.sam_admitted_otc || '',
        "SAM without Complication: Cured": outcomesData.sam_cured || '',
        "SAM without Complication: Defaulted": outcomesData.sam_defaulted || '',
        "SAM without Complication: Died": outcomesData.sam_died || '',
        "Remarks": outcomesData.remarks || '',
        "actions": "actions",
        "id": outcomesData.id,
        "isEmptyPlaceholder": isEmptyPlaceholder
      };
    });
  };

  // Memoize data processing to prevent unnecessary re-renders
  const { columns, data, customHeader } = useMemo(() => {
    if (activePage === 0) {
      return { 
        ...tableConfigs[0], 
        data: hasSearched 
          ? mapBackendDataToColumns(filteredData) 
          : mapBackendDataToColumns(regData) 
      };
    } else if (activePage === 1) {
      return {
        ...tableConfigs[1],
        data: mapAllNewbornDataToColumns(allNewbornData)
      };
    } else if (activePage === 2) {
      return {
        ...tableConfigs[2],
        data: mapAllNutritionDataToColumns(allNutritionData)
      };
    } else if (activePage === 3) {
      return {
        ...tableConfigs[3],
        data: mapAllOutcomesDataToColumns(allOutcomesData)
      };
    } else {
      return tableConfigs[activePage];
    }
  }, [activePage, hasSearched, filteredData, regData, allNewbornData, allNutritionData, allOutcomesData]);

  // Debug logging removed to prevent re-render issues

  // Memoize pagination calculations to prevent unnecessary re-renders
  const { totalEntries, totalPages, startIndex, endIndex, currentData } = useMemo(() => {
    const totalEntries = data.length;
    const totalPages = Math.ceil(totalEntries / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentData = data.slice(startIndex, endIndex);
    
    return { totalEntries, totalPages, startIndex, endIndex, currentData };
  }, [data.length, rowsPerPage, currentPage, data]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData, rowsPerPage]);

  // Note: Removed automatic refresh on active page change to avoid unnecessary reloads
  // Data is now updated optimistically when edits are made

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  // Archive functionality
  const handleArchivePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to archive this patient? This will hide them from the main list but keep their data in the database.')) {
      return;
    }

    setIsArchiving(true);
    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/patients/${patientId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Show success message (you can implement a toast notification system)
        alert('Patient archived successfully');
        
        // Optimistically remove patient from local data instead of full reload
        setRegData(prevData => prevData.filter(patient => patient.id !== patientId));
        setAllNewbornData(prevData => prevData.filter(record => record.patient_id !== patientId));
        setAllNutritionData(prevData => prevData.filter(record => record.patient_id !== patientId));
        setAllOutcomesData(prevData => prevData.filter(record => record.patient_id !== patientId));
      } else {
        const errorData = await response.json();
        alert(`Failed to archive patient: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error archiving patient:', error);
      alert('Failed to archive patient. Please try again.');
    }
    setIsArchiving(false);
  };

  const fetchArchivedPatients = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://127.0.0.1:8000/api/patients/archived', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setArchivedPatients(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch archived patients:', response.status, errorText);
        alert(`Failed to fetch archived patients: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching archived patients:', error);
      alert('Failed to fetch archived patients. Please try again.');
    }
  };

  const handleUnarchivePatient = async (patientId, patientName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to unarchive ${patientName}?\n\nThis will restore the patient to the active patient list.`
    );
    
    if (!confirmed) {
      return; // User cancelled
    }

    try {
      setIsUnarchiving(true);
      setUnarchivingPatientId(patientId);
      
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/patients/${patientId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Show success message
        alert('Patient unarchived successfully');
        
        // Optimistically remove from archived list and add to main list
        setArchivedPatients(prevData => prevData.filter(patient => patient.id !== patientId));
        // Note: We don't add to main list here as it would require fetching the full patient data
        // The user can refresh or navigate to see the unarchived patient
      } else {
        const errorData = await response.json();
        alert(`Failed to unarchive patient: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error unarchiving patient:', error);
      alert('Failed to unarchive patient. Please try again.');
    } finally {
      setIsUnarchiving(false);
      setUnarchivingPatientId(null);
    }
  };

  const handleShowArchivedModal = () => {
    fetchArchivedPatients();
    setShowArchivedModal(true);
  };

  // Filter and search archived patients
  useEffect(() => {
    let filtered = [...archivedPatients];
    
    // Apply search filter
    if (archivedSearchTerm.trim()) {
      const searchLower = archivedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(patient => {
        const childName = (patient.child_name || '').toLowerCase();
        const motherName = (patient.mother_name || '').toLowerCase();
        const address = (patient.address || '').toLowerCase();
        
        return childName.includes(searchLower) || 
               motherName.includes(searchLower) || 
               address.includes(searchLower);
      });
    }
    
    // Apply sex filter
    if (archivedSexFilter !== 'all') {
      filtered = filtered.filter(patient => 
        patient.sex && patient.sex.toLowerCase() === archivedSexFilter.toLowerCase()
      );
    }
    
    setFilteredArchivedPatients(filtered);
    setArchivedCurrentPage(1); // Reset to first page when filters change
  }, [archivedPatients, archivedSearchTerm, archivedSexFilter]);

  const handleArchivedSearchChange = (e) => {
    setArchivedSearchTerm(e.target.value);
  };

  const handleArchivedClearSearch = () => {
    setArchivedSearchTerm('');
    setArchivedSexFilter('all');
  };

  return (
    <div className="patient-list-container">
      <style>
        {searchAnimationStyle}
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          /* Compact Patient List Styling */
          .patient-list-container {
            padding: 1rem;
            background: #ffffff;
            max-width: 100%;
            overflow-x: hidden;
            overflow-y: visible;
            box-sizing: border-box;
            border-radius: 0;
            width: 100%;
            margin: 0;
            position: relative;
            min-height: calc(100vh - 80px);
          }
          
          .header-section {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.8);
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .page-label {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
            letter-spacing: -0.025em;
          }
          
          .user-info-display {
            font-size: 0.9rem;
            color: #64748b;
            margin: 0.5rem 0 0 0;
          }
          
          .search-and-add-container {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.8);
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .search-input {
            background: #f8fafc !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.875rem !important;
            transition: all 0.2s ease !important;
          }
          
          .search-input:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          }
          
          .table {
            background: white !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .table thead tr {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          }
          
          .table th {
            padding: 0.75rem 0.5rem !important;
            font-size: 0.75rem !important;
            font-weight: 700 !important;
            color: white !important;
            border: none !important;
            text-align: center !important;
          }
          
          .table td {
            padding: 0.5rem !important;
            font-size: 0.75rem !important;
            border: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          
          .table tbody tr:hover {
            background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }
          
          .table-modern thead th {
            position: static !important;
            top: auto !important;
          }
          .table-modern thead {
            position: static !important;
            top: auto !important;
          }
          
          .table-wrapper {
            overflow-x: auto;
            max-width: 100%;
            width: 100%;
          }
          
          .table td.text-center {
            text-align: center !important;
          }
          
          .table th.text-center {
            text-align: center !important;
          }
          
          .patient-table-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.8);
            overflow: hidden;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 1rem;
          }
        `}
      </style>
      
      <div className="header-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-label">
              <i className="bi bi-clipboard-data me-3 text-primary"></i>
              Patient Vaccine Tracker
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Comprehensive immunization and nutrition tracking
            </p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="text-muted small">Last updated</div>
              <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        {user && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="user-info-display d-flex align-items-center gap-2 mb-0">
              <div style={{
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem'
              }}>
                <i className="bi bi-person-circle"></i>
              </div>
              <span>
                Logged in as: <strong className="text-primary">{user.name}</strong> 
                <span className="ms-1 badge bg-light text-dark" style={{ fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </span>
            </p>
          </div>
        )}
      </div>
      
      <div className="search-and-add-container">
        <div className="search-filters-section">
          <div className="row g-3 align-items-end">
            <div className="col-md-9">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-search me-1"></i>
                Search
              </label>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search by child's name or mother's name..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    height: '42px',
                    transition: 'all 0.2s ease',
                    flex: 1
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    height: '42px',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSearching) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSearching) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                >
                  {isSearching ? (
                    <>
                      <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }}></i>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search"></i>
                      Search
                    </>
                  )}
                </button>
                {filteredData.length > 0 && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      borderRadius: '8px',
                      padding: '0.625rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      height: '42px',
                      border: '1.5px solid #d1d5db',
                      background: 'white',
                      color: '#6b7280',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f3f4f6';
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.color = '#374151';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.color = '#6b7280';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <i className="bi bi-x-circle"></i>
                    Clear
                  </button>
                )}
              </div>
              {filteredData.length > 0 && (
                <div className="mt-2">
                  <small style={{ 
                    color: '#059669',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    <i className="bi bi-check-circle me-1"></i>
                    Found {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} for "<span className="fw-bold">{searchTerm}</span>"
                  </small>
                </div>
              )}
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: 'transparent' }}>
                Actions
              </label>
              <div className="d-flex gap-2" style={{ width: '100%', flexWrap: 'nowrap' }}>
                <button
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={handleShowArchivedModal}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    height: '42px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    whiteSpace: 'nowrap',
                    flex: '1',
                    minWidth: '0',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                  }}
                >
                  <i className="bi bi-archive" style={{ fontSize: '0.875rem', flexShrink: 0 }}></i>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Archive</span>
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleAddRegistration}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    height: '42px',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    whiteSpace: 'nowrap',
                    flex: '1',
                    minWidth: '0',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                  }}
                >
                  <i className="bi bi-plus-circle-fill" style={{ fontSize: '0.875rem', flexShrink: 0 }}></i>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="results-summary">
            <span className="text-muted fw-semibold" style={{ fontSize: '0.875rem' }}>
              <i className="bi bi-people-fill me-2"></i>
              {filteredData.length > 0 ? filteredData.length : data.length} {activePage === 0 ? 'patients' : activePage === 1 ? 'newborn records' : activePage === 2 ? 'nutrition records' : 'outcome records'} found
            </span>
          </div>
        </div>
      </div>
      
      <div className="patient-table-container">
        <div className="table-wrapper">
          <table className="table" style={{
            width: '100%',
            margin: '0',
            fontSize: '0.8rem',
            minWidth: '1200px'
          }}>
              <thead>
              {customHeader ? customHeader : (
                <tr>
                  {columns.map((col, idx) => (
                      <th key={idx} style={{ textAlign: 'center' }}>
                        {col === "actions" ? "Actions" : 
                         col === "registration_no" ? "Reg. No." :
                         col === "registration_date" ? "Reg. Date" :
                         col === "birth_date" ? "Birth Date" :
                         col === "family_serial_number" ? "Family Serial #" :
                         col === "child_name" ? "Child Name" :
                         col === "sex" ? "Sex" :
                         col === "mother_name" ? "Mother Name" :
                         col === "address" ? "Address" :
                         col === "cpab_8a" ? "TT2+ (8A)" :
                         col === "cpab_8b" ? "TT3+ (8B)" :
                         col}
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
              ) : isSearching ? (
                <tr>
                  <td colSpan={columns.length || 24} className="text-center text-muted py-5">
                    <div className="empty-state">
                      <i className="bi bi-search display-4 text-primary" style={{ animation: 'spin 1s linear infinite' }}></i>
                      <p className="mt-3">Searching for patients...</p>
                      <p className="text-muted small">Looking for: "<span className="fw-semibold text-primary">{searchTerm}</span>"</p>
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
                 {hasSearched && searchTerm.trim() && filteredData.length === 0 ? (
                   <>
                     <i className="bi bi-search display-4 text-warning"></i>
                     <p className="mt-3 fw-bold text-warning">No patients found matching your search.</p>
                     <p className="text-muted mb-3">Search term: "<span className="fw-semibold text-primary">{searchTerm}</span>"</p>
                     <div className="d-flex justify-content-center gap-2">
                       <button 
                         className="btn btn-outline-primary btn-sm"
                         onClick={handleClearSearch}
                         style={{
                           borderRadius: '8px',
                           padding: '0.5rem 1rem',
                           fontSize: '0.875rem'
                         }}
                       >
                         <i className="bi bi-x-circle me-1"></i>
                         Clear Search
                       </button>
                       <button 
                         className="btn btn-outline-secondary btn-sm"
                         onClick={() => {
                           setSearchTerm('');
                           setFilteredData([]);
                           setIsSearching(false);
                           setHasSearched(false);
                         }}
                         style={{
                           borderRadius: '8px',
                           padding: '0.5rem 1rem',
                           fontSize: '0.875rem'
                         }}
                       >
                         <i className="bi bi-arrow-clockwise me-1"></i>
                         Try Again
                       </button>
                     </div>
                     <p className="text-muted small mt-3">
                       <i className="bi bi-info-circle me-1"></i>
                       Try searching by child name or mother name
                     </p>
                   </>
                 ) : (
                   <>
                     <i className="bi bi-inbox display-4 text-muted"></i>
                     <p className="mt-3">
                       {activePage === 0 ? "No patients registered yet." :
                        activePage === 1 ? "No newborn & immunization data available." :
                        activePage === 2 ? "No nutrition & 12 months data available." :
                        activePage === 3 ? "No outcomes & remarks data available." :
                        "No data available."}
                     </p>
                     {activePage > 0 && (
                       <p className="text-muted small">
                         Data will appear here once you add information for this section.
                       </p>
                     )}
                   </>
                 )}
               </div>
             </td>
           </tr>
              ) : (
                currentData.map((row, rIdx) => (
                    <tr key={rIdx} className={`table-row-hover ${row.isEmptyPlaceholder ? 'placeholder-row' : ''}`} 
                        style={row.isEmptyPlaceholder ? { 
                          backgroundColor: '#f8f9fa', 
                          borderLeft: '4px solid #6c757d',
                          opacity: 0.8 
                        } : {}}>
                    {columns.map((col, cIdx) =>
                      col === "actions" ? (
                          <td key={cIdx} className="text-center align-middle" style={{ 
                            padding: '6px 4px',
                            fontSize: '11px'
                          }}>
                            <div className="table-actions" style={{
                              display: 'flex',
                              gap: '0.5rem',
                              flexWrap: 'nowrap',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Button 
                                size="sm" 
                                variant="primary" 
                                onClick={() => handleView(rIdx)} 
                                title="View Details"
                                style={{
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                  border: 'none',
                                  color: 'white',
                                  width: '70px',
                                  height: '32px',
                                  fontSize: '0.55rem',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.3rem',
                                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                                  textTransform: 'none',
                                  letterSpacing: '0.025em'
                                }}
                                onMouseOver={e => {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)';
                                }}
                                onMouseOut={e => {
                                  e.target.style.transform = 'none';
                                  e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.25)';
                                }}
                              >
                                <i className="bi bi-eye" style={{ fontSize: '0.75rem' }}></i>
                                <span>View</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="success" 
                                onClick={() => handleMedicalSummary(rIdx)} 
                                title="Medical Summary"
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  border: 'none',
                                  color: 'white',
                                  width: '95px',
                                  height: '32px',
                                  fontSize: '0.5rem',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                  textTransform: 'none',
                                  letterSpacing: '0.025em',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                  e.target.style.transform = 'none';
                                  e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.25)';
                                }}
                              >
                                <i className="bi bi-file-medical" style={{ fontSize: '0.6rem' }}></i>
                                <span style={{ fontSize: '0.5rem' }}>Summary</span>
                              </Button>
                              {/* Archive Button */}
                              <Button 
                                size="sm" 
                                variant="warning" 
                                onClick={() => handleArchivePatient(row.id)} 
                                  title="Archive Patient"
                                  disabled={isArchiving}
                                  style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    border: 'none',
                                    color: 'white',
                                    width: '75px',
                                    height: '32px',
                                    fontSize: '0.55rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.3rem',
                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                                    textTransform: 'none',
                                    letterSpacing: '0.025em',
                                    opacity: isArchiving ? 0.6 : 1
                                  }}
                                  onMouseOver={e => {
                                    if (!isArchiving) {
                                      e.target.style.background = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
                                      e.target.style.transform = 'translateY(-1px)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.35)';
                                    }
                                  }}
                                  onMouseOut={e => {
                                    if (!isArchiving) {
                                      e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                                      e.target.style.transform = 'none';
                                      e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.25)';
                                    }
                                  }}
                                >
                                  <i className="bi bi-archive" style={{ fontSize: '0.75rem' }}></i>
                                  <span>{isArchiving ? 'Archiving...' : 'Archive'}</span>
                                </Button>
                            </div>
                        </td>
                      ) : (
                        <td 
                          key={cIdx} 
                          className={(col === "registration_no" || col === "registration_date" || col === "sex" || col === "address" || col === "cpab_8a" || col === "cpab_8b") ? "text-center" : ""}
                          style={{ 
                            textAlign: (col === "registration_no" || col === "registration_date" || col === "sex" || col === "address" || col === "cpab_8a" || col === "cpab_8b") ? 'center' : undefined
                          }} 
                          title={row[col] || ""}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: (col === "registration_no" || col === "registration_date" || col === "sex" || col === "address" || col === "cpab_8a" || col === "cpab_8b") ? 'center' : 'flex-start',
                            alignItems: 'center',
                            width: '100%'
                          }}>
                            {row.isEmptyPlaceholder && !row[col] ? (
                              <span style={{ 
                                color: '#6c757d', 
                                fontStyle: 'italic',
                                fontSize: '10px'
                              }}>
                                Empty
                              </span>
                            ) : (
                              row[col] || ""
                            )}
                          </div>
                        </td>
                      )
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalEntries > 0 && (
        <div className="pagination-section" style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          padding: '0.75rem 1rem',
          marginTop: '1rem'
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            {/* Compact pagination info */}
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>
                <i className="bi bi-info-circle me-1"></i>
                {startIndex + 1}-{Math.min(endIndex, totalEntries)} of {totalEntries}
              </span>
              <select
                className="form-select form-select-sm"
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
                style={{
                  width: '70px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  background: '#f8fafc'
                }}
              >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            {/* Compact Page navigation */}
            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  borderRadius: '6px',
                  padding: '0.375rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  border: '1px solid #667eea',
                  color: '#667eea',
                  background: 'transparent'
                }}
              >
                <i className="bi bi-chevron-left"></i>
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
                                borderRadius: '4px',
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
                              borderRadius: '4px',
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
                          borderRadius: '4px',
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
      
      {/* Modal for viewing row data */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" className="modal-modern modal-centered">
        <style>
          {`
            .modal-centered {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .modal-centered .modal-dialog {
              max-width: 95vw !important;
              width: 95vw !important;
              max-height: 90vh !important;
              margin: 0 !important;
              position: relative !important;
              transform: none !important;
            }
            .modal-centered .modal-content {
              width: 100% !important;
              max-width: 100% !important;
              max-height: 90vh !important;
              border-radius: 12px !important;
              margin: 0 !important;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
              position: relative !important;
            }
            .modal-centered .container-fluid {
              max-width: 100% !important;
              padding-left: 1rem !important;
              padding-right: 1rem !important;
            }
            .modal-centered .row {
              margin-left: -0.5rem !important;
              margin-right: -0.5rem !important;
            }
            .modal-centered .col-md-4 {
              flex: 0 0 33.333333% !important;
              max-width: 33.333333% !important;
            }
            .modal-centered .col-md-3 {
              flex: 0 0 25% !important;
              max-width: 25% !important;
            }
            .modal-centered .col-md-6 {
              flex: 0 0 50% !important;
              max-width: 50% !important;
            }
            .modal-centered .modal-backdrop {
              background-color: rgba(0, 0, 0, 0.5) !important;
            }
          `}
        </style>
        <Modal.Body className="p-0" style={{ maxHeight: '85vh', height: 'auto', overflowY: 'auto', position: 'relative', padding: '0' }}>
          {/* Modern Professional Header */}
          <div className="border-0" style={{ 
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            padding: '2.5rem 3rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }}></div>
            <div className="d-flex align-items-center justify-content-between position-relative">
              <div className="d-flex align-items-center text-white">
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1.5rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <i className="bi bi-person-circle" style={{ fontSize: '1.75rem' }}></i>
                </div>
                <div>
                  <h3 className="mb-1 text-white fw-bold" style={{ fontSize: '1.75rem', letterSpacing: '-0.025em' }}>Patient Details</h3>
                  <p className="text-white mb-0" style={{ fontSize: '1.1rem', opacity: 0.9, fontWeight: '500' }}>Comprehensive medical information and records</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="bi bi-shield-check me-2"></i>
                  Secure Medical Records
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '12px',
                    width: '50px',
                    height: '50px',
                    color: 'white',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <div className="p-1" style={{ padding: '0.5rem' }}>
            {/* Professional Navigation Tabs */}
            <div className="mb-5">
              <div className="bg-light rounded-4 p-2 shadow-sm">
                <div className="row g-2">
                  <div className="col-3">
                    <button
                      className={`btn w-100 py-3 rounded-3 border-0 ${activeModalSection === 'registration' ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setActiveModalSection('registration')}
                      style={{
                        background: activeModalSection === 'registration' 
                          ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                          : 'white',
                        color: activeModalSection === 'registration' ? 'white' : '#6c757d',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        boxShadow: activeModalSection === 'registration' 
                          ? '0 4px 15px rgba(0, 123, 255, 0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <i className="bi bi-person me-2" style={{ fontSize: '16px' }}></i>
                      Patient Info
                    </button>
                  </div>
                  <div className="col-3">
                    <button
                      className={`btn w-100 py-3 rounded-3 border-0 ${activeModalSection === 'newborn' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => setActiveModalSection('newborn')}
                      style={{
                        background: activeModalSection === 'newborn' 
                          ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                          : 'white',
                        color: activeModalSection === 'newborn' ? 'white' : '#6c757d',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        boxShadow: activeModalSection === 'newborn' 
                          ? '0 4px 15px rgba(0, 123, 255, 0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <i className="bi bi-baby me-2" style={{ fontSize: '16px' }}></i>
                      Newborn Care
                    </button>
                  </div>
                  <div className="col-3">
                    <button
                      className={`btn w-100 py-3 rounded-3 border-0 ${activeModalSection === 'nutrition' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => setActiveModalSection('nutrition')}
                      style={{
                        background: activeModalSection === 'nutrition' 
                          ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                          : 'white',
                        color: activeModalSection === 'nutrition' ? 'white' : '#6c757d',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        boxShadow: activeModalSection === 'nutrition' 
                          ? '0 4px 15px rgba(0, 123, 255, 0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <i className="bi bi-heart-pulse me-2" style={{ fontSize: '16px' }}></i>
                      Nutrition
                    </button>
                  </div>
                  <div className="col-3">
                    <button
                      className={`btn w-100 py-3 rounded-3 border-0 ${activeModalSection === 'outcomes' ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setActiveModalSection('outcomes')}
                      style={{
                        background: activeModalSection === 'outcomes' 
                          ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                          : 'white',
                        color: activeModalSection === 'outcomes' ? 'white' : '#6c757d',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        boxShadow: activeModalSection === 'outcomes' 
                          ? '0 4px 15px rgba(0, 123, 255, 0.3)' 
                          : '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <i className="bi bi-clipboard-check me-2" style={{ fontSize: '16px' }}></i>
                      Outcomes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {activeModalSection === 'registration' && (
              <div className="registration-section">
                {/* Section Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-person text-info" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold text-dark">Patient Information</h5>
                      <p className="text-muted mb-0 small">Registration and demographic details</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-info"
                      size="sm" 
                      onClick={handleEditRegistration}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </Button>
                  </div>
                </div>
                
                {selectedRow ? (
                  <div className="row g-4">
                    {/* Patient Basic Information */}
                    <div className="col-12">
                      <Card className="border-0 shadow-lg rounded-4" style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        border: '1px solid #e9ecef'
                      }}>
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-person text-info" style={{ fontSize: '18px' }}></i>
                            </div>
                            <h6 className="mb-0 fw-bold text-dark">Patient Details</h6>
                          </div>
                          <hr className="my-3" style={{ borderColor: '#dee2e6' }} />
                          <div className="row g-3">
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-hash text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Registration Number</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.registration_no || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-calendar text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Registration Date</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.registration_date || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-calendar-date text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Birth Date</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.birth_date || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-people text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Family Serial Number</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.family_serial_number || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-person text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Child Name</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.child_name || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-gender-ambiguous text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Sex</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.sex || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-person-heart text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Mother Name</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.mother_name || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-geo-alt text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Address</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.address || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-check-circle text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">CPAB (8a)</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.cpab_8a || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-check-circle-fill text-info me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">CPAB (8b)</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedRow.cpab_8b || 'Not recorded'}</div>
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
                    <p className="text-muted mt-3 fs-5">No patient information available.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalSection === 'newborn' && (
              <div className="newborn-section">
                {/* Section Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-baby text-primary" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold text-dark">Newborn Care Records</h5>
                      <p className="text-muted mb-0 small">Infant health monitoring (0-28 days)</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {newbornLoading && (
                      <div className="d-flex align-items-center text-muted me-3">
                        <i className="bi bi-arrow-clockwise me-2" style={{ fontSize: '14px' }}></i>
                        <small>Loading...</small>
                      </div>
                    )}
                    {selectedNewbornRow && !newbornLoading && (
                    <Button 
                        variant="outline-primary"
                      size="sm" 
                        onClick={() => {
                          setNewbornForm({
                            length_at_birth: selectedNewbornRow.length_at_birth || '',
                            weight_at_birth: selectedNewbornRow.weight_at_birth || '',
                            birth_weight_status: selectedNewbornRow.birth_weight_status || '',
                            breast_feeding_date: selectedNewbornRow.breast_feeding_date || '',
                            age_in_months: selectedNewbornRow.age_in_months || '',
                            length_in_threes_months: selectedNewbornRow.length_in_threes_months || '',
                            weight_in_threes_months: selectedNewbornRow.weight_in_threes_months || '',
                            weight_for_length: selectedNewbornRow.weight_for_length || '',
                            muac: selectedNewbornRow.muac || '',
                            oedema: selectedNewbornRow.oedema || '',
                            z_score: selectedNewbornRow.z_score || '',
                            nutritional_status: selectedNewbornRow.nutritional_status || '',
                            date_taken: selectedNewbornRow.date_taken || ''
                          });
                          setShowNewbornEditModal(true);
                        }}
                      style={{
                        fontSize: '12px',
                          padding: '6px 12px',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                    </Button>
                  )}
                  </div>
                </div>
                {newbornLoading ? (
                  <div className="text-center py-5">
                    <i className="bi bi-arrow-clockwise text-muted display-4"></i>
                    <p className="text-muted mt-3 fs-5">Loading newborn data...</p>
                  </div>
                ) : selectedNewbornRow ? (
                  <div className="row g-4">
                    {/* Growth Assessment */}
                    <div className="col-12">
                      <Card className="border-0 shadow-lg rounded-4" style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        border: '1px solid #e9ecef'
                      }}>
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-graph-up text-primary" style={{ fontSize: '18px' }}></i>
                            </div>
                            <h6 className="mb-0 fw-bold text-dark">Growth Assessment</h6>
                          </div>
                          <hr className="my-3" style={{ borderColor: '#dee2e6' }} />
                          <div className="row g-3">
                            <div className="col-md-3">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-rulers text-primary me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Length at birth (cm)</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedNewbornRow.length_at_birth || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-speedometer2 text-primary me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Weight at birth (kg)</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedNewbornRow.weight_at_birth || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-check-circle text-primary me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Birth Weight Status</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedNewbornRow.birth_weight_status || 'Not recorded'}</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="bg-white rounded-3 p-3 border" style={{ borderColor: '#e9ecef' }}>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-calendar-check text-primary me-2" style={{ fontSize: '14px' }}></i>
                                  <small className="text-muted fw-semibold">Breastfeeding Date</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedNewbornRow.breast_feeding_date || 'Not recorded'}</div>
                              </div>
                            </div>
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
                            <div className="fw-bold fs-6">
                              {selectedNewbornRow.iron_1mo_date || selectedNewbornRow.col10 || 'Not recorded'}
                            </div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">2 mos</small>
                            <div className="fw-bold fs-6">
                              {selectedNewbornRow.iron_2mo_date || selectedNewbornRow.col11 || 'Not recorded'}
                            </div>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted fw-semibold">3 mos</small>
                            <div className="fw-bold fs-6">
                              {selectedNewbornRow.iron_3mo_date || selectedNewbornRow.col12 || 'Not recorded'}
                            </div>
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
              <div className="nutrition-section">
                {/* Section Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-heart-pulse text-success" style={{ fontSize: '20px' }}></i>
                    </div>
              <div>
                      <h5 className="mb-1 fw-bold text-dark">Nutrition & 12 Months</h5>
                      <p className="text-muted mb-0 small">Nutritional assessment and monitoring</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {nutritionLoading && (
                      <div className="d-flex align-items-center text-muted me-3">
                        <i className="bi bi-arrow-clockwise me-2" style={{ fontSize: '14px' }}></i>
                        <small>Loading...</small>
                      </div>
                    )}
                    {selectedNutritionRow && !nutritionLoading && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => {
                          setNutritionForm({
                            age_in_months: selectedNutritionRow.age_in_months || '',
                            length: selectedNutritionRow.length || '',
                            weight: selectedNutritionRow.weight || '',
                            muac: selectedNutritionRow.muac || '',
                            oedema: selectedNutritionRow.oedema || '',
                            z_score: selectedNutritionRow.z_score || '',
                            nutritional_status: selectedNutritionRow.nutritional_status || '',
                            date_taken: selectedNutritionRow.date_taken || ''
                          });
                          setShowNutritionEditModal(true);
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                    </Button>
                  )}
                  </div>
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
              <div className="outcomes-section">
                {/* Section Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-clipboard-check text-warning" style={{ fontSize: '20px' }}></i>
                    </div>
              <div>
                      <h5 className="mb-1 fw-bold text-dark">Outcomes & Remarks</h5>
                      <p className="text-muted mb-0 small">Treatment outcomes and final remarks</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {outcomesLoading && (
                      <div className="d-flex align-items-center text-muted me-3">
                        <i className="bi bi-arrow-clockwise me-2" style={{ fontSize: '14px' }}></i>
                        <small>Loading...</small>
                      </div>
                    )}
                    {selectedOutcomesRow && !outcomesLoading && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => {
                          setOutcomesForm({
                            sam_cured: selectedOutcomesRow.sam_cured || '',
                            sam_defaulted: selectedOutcomesRow.sam_defaulted || '',
                            sam_died: selectedOutcomesRow.sam_died || '',
                            remarks: selectedOutcomesRow.remarks || ''
                          });
                          setShowOutcomesEditModal(true);
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                    </Button>
                  )}
                  </div>
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
      </Modal>

      {/* Newborn Edit Modal */}
      <Modal show={showNewbornEditModal} onHide={() => setShowNewbornEditModal(false)} size="xl" className="modal-modern modal-centered">
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-baby me-3"></i>
            Edit Newborn Care Records
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleNewbornFormSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Length at Birth (cm)</Form.Label>
                  <Form.Control
                    type="text"
                    name="length_at_birth"
                    value={newbornForm.length_at_birth}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter length"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Weight at Birth (kg)</Form.Label>
                  <Form.Control
                    type="text"
                    name="weight_at_birth"
                    value={newbornForm.weight_at_birth}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter weight"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Birth Weight Status</Form.Label>
                  <Form.Control
                    type="text"
                    name="birth_weight_status"
                    value={newbornForm.birth_weight_status}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter status"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Breastfeeding Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="breast_feeding_date"
                    value={newbornForm.breast_feeding_date}
                    onChange={handleNewbornFormChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Age in Months</Form.Label>
                  <Form.Control
                    type="text"
                    name="age_in_months"
                    value={newbornForm.age_in_months}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter age"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Length (cm) & Date</Form.Label>
                  <Form.Control
                    type="text"
                    name="length_in_threes_months"
                    value={newbornForm.length_in_threes_months}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter length and date"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Weight (kg) & Date</Form.Label>
                  <Form.Control
                    type="text"
                    name="weight_in_threes_months"
                    value={newbornForm.weight_in_threes_months}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter weight and date"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Weight for Length</Form.Label>
                  <Form.Control
                    type="text"
                    name="weight_for_length"
                    value={newbornForm.weight_for_length}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter weight for length"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">MUAC</Form.Label>
                  <Form.Control
                    type="text"
                    name="muac"
                    value={newbornForm.muac}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter MUAC"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Oedema</Form.Label>
                  <Form.Control
                    type="text"
                    name="oedema"
                    value={newbornForm.oedema}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter oedema status"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Z-Score</Form.Label>
                  <Form.Control
                    type="text"
                    name="z_score"
                    value={newbornForm.z_score}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter Z-score"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Nutritional Status</Form.Label>
                  <Form.Control
                    type="text"
                    name="nutritional_status"
                    value={newbornForm.nutritional_status}
                    onChange={handleNewbornFormChange}
                    placeholder="Enter nutritional status"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Date Taken</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_taken"
                    value={newbornForm.date_taken}
                    onChange={handleNewbornFormChange}
                  />
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowNewbornEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Nutrition Edit Modal */}
      <Modal show={showNutritionEditModal} onHide={() => setShowNutritionEditModal(false)} size="xl" className="modal-modern modal-centered">
        <Modal.Header closeButton className="bg-success text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-heart-pulse me-3"></i>
            Edit Nutrition Records
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleNutritionFormSubmit}>
            <div className="container-fluid">
              <div className="row g-3">
                {/* Basic Measurements Card */}
                <div className="col-12">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-rulers me-2"></i>
                        Basic Measurements
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Age in Months</Form.Label>
                            <Form.Control
                              type="number"
                              name="age_in_months"
                              value={nutritionForm.age_in_months}
                              onChange={handleNutritionFormChange}
                              placeholder="Enter age in months"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Child's age in months</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Length (cm)</Form.Label>
                            <Form.Control
                              type="number"
                              name="length"
                              value={nutritionForm.length}
                              onChange={handleNutritionFormChange}
                              placeholder="Enter length in cm"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Child's height/length</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Weight (kg)</Form.Label>
                            <Form.Control
                              type="number"
                              name="weight"
                              value={nutritionForm.weight}
                              onChange={handleNutritionFormChange}
                              placeholder="Enter weight in kg"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Child's weight</Form.Text>
                          </Form.Group>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>

                {/* Nutritional Assessment Card */}
                <div className="col-12">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-clipboard-data me-2"></i>
                        Nutritional Assessment
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">MUAC (cm)</Form.Label>
                            <Form.Control
                              type="number"
                              name="muac"
                              value={nutritionForm.muac}
                              onChange={handleNutritionFormChange}
                              placeholder="Enter MUAC measurement"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Mid-Upper Arm Circumference</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Oedema Status</Form.Label>
                            <Form.Select
                              name="oedema"
                              value={nutritionForm.oedema}
                              onChange={handleNutritionFormChange}
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            >
                              <option value="">Select oedema status</option>
                              <option value="None">None</option>
                              <option value="Mild">Mild</option>
                              <option value="Moderate">Moderate</option>
                              <option value="Severe">Severe</option>
                            </Form.Select>
                            <Form.Text className="text-muted">Presence of oedema</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Z-Score</Form.Label>
                            <Form.Control
                              type="number"
                              name="z_score"
                              value={nutritionForm.z_score}
                              onChange={handleNutritionFormChange}
                              placeholder="Enter Z-score"
                              step="0.1"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Standard deviation score</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Nutritional Status</Form.Label>
                            <Form.Select
                              name="nutritional_status"
                              value={nutritionForm.nutritional_status}
                              onChange={handleNutritionFormChange}
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            >
                              <option value="">Select nutritional status</option>
                              <option value="Normal">Normal</option>
                              <option value="Mild Malnutrition">Mild Malnutrition</option>
                              <option value="Moderate Malnutrition">Moderate Malnutrition</option>
                              <option value="Severe Malnutrition">Severe Malnutrition</option>
                              <option value="SAM (Severe Acute Malnutrition)">SAM (Severe Acute Malnutrition)</option>
                            </Form.Select>
                            <Form.Text className="text-muted">Overall nutritional assessment</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Assessment Date</Form.Label>
                            <Form.Control
                              type="date"
                              name="date_taken"
                              value={nutritionForm.date_taken}
                              onChange={handleNutritionFormChange}
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Date when assessment was taken</Form.Text>
                          </Form.Group>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowNutritionEditModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Outcomes Edit Modal */}
      <Modal show={showOutcomesEditModal} onHide={() => setShowOutcomesEditModal(false)} size="xl" className="modal-modern modal-centered">
        <Modal.Header closeButton className="bg-warning text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-clipboard-check me-3"></i>
            Edit Outcomes & Remarks
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleOutcomesFormSubmit}>
            <div className="container-fluid">
              <div className="row g-3">
                {/* SAM Outcomes Card */}
                <div className="col-12">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-warning text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-heart-pulse me-2"></i>
                        SAM (Severe Acute Malnutrition) Outcomes
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">SAM Cured</Form.Label>
                            <Form.Control
                              type="number"
                              name="sam_cured"
                              value={outcomesForm.sam_cured}
                              onChange={handleOutcomesFormChange}
                              placeholder="Enter number of cured cases"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Number of SAM cases successfully cured</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">SAM Defaulted</Form.Label>
                            <Form.Control
                              type="number"
                              name="sam_defaulted"
                              value={outcomesForm.sam_defaulted}
                              onChange={handleOutcomesFormChange}
                              placeholder="Enter number of defaulted cases"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Number of SAM cases that defaulted from treatment</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">SAM Died</Form.Label>
                            <Form.Control
                              type="number"
                              name="sam_died"
                              value={outcomesForm.sam_died}
                              onChange={handleOutcomesFormChange}
                              placeholder="Enter number of deaths"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Number of SAM cases that resulted in death</Form.Text>
                          </Form.Group>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>

                {/* Additional Remarks Card */}
                <div className="col-12">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-chat-text me-2"></i>
                        Additional Remarks & Notes
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group>
                        <Form.Label className="text-dark fw-semibold">Remarks</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={5}
                          name="remarks"
                          value={outcomesForm.remarks}
                          onChange={handleOutcomesFormChange}
                          placeholder="Enter any additional remarks, notes, or observations about the outcomes..."
                          className="form-control-lg"
                          style={{ fontSize: '16px', padding: '12px' }}
                        />
                        <Form.Text className="text-muted">Add any additional notes, observations, or important remarks about the treatment outcomes</Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowOutcomesEditModal(false)}>
                Cancel
              </Button>
              <Button variant="warning" type="submit">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add/Edit Registration Modal */}
      <Modal 
        show={showRegModal} 
        onHide={handleCloseRegModal} 
        size="xl" 
        className="modal-modern modal-centered"
        centered
        style={{ 
          display: 'flex !important',
          alignItems: 'center !important',
          justifyContent: 'center !important'
        }}
      >
        <style>
          {`
            .modal-centered {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .modal-modern .modal-content {
              border: none;
              border-radius: 20px;
              box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
              overflow: hidden;
              width: 95vw !important;
              max-width: 1400px !important;
              margin: 0 auto;
            }
            .modal-modern .modal-header {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              border: none;
              padding: 2rem 2.5rem;
            }
            .modal-modern .modal-body {
              padding: 0;
              max-height: 85vh;
              overflow-y: auto;
            }
            .modal-backdrop {
              background-color: rgba(0, 0, 0, 0.6) !important;
            }
          `}
        </style>
        <Modal.Header closeButton className="bg-primary text-white border-0" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          padding: '2rem 2.5rem'
        }}>
          <Modal.Title className="d-flex align-items-center" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            <i className={editRegIdx !== null ? "bi bi-pencil-square me-3" : "bi bi-person-plus me-3"} style={{ fontSize: '1.5rem' }}></i>
            {editRegIdx !== null ? 'Edit' : 'Add'} Registration & Demographics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ 
          padding: '2.5rem', 
          maxHeight: '85vh', 
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}>
          <Form onSubmit={handleRegFormSubmit}>
            <div className="container-fluid">
              <div className="row g-3">
                {/* Basic Information Card */}
                <div className="col-12">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-person me-2"></i>
                        Basic Information
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Patient Number</Form.Label>
                            <Form.Control 
                              name="col1" 
                              value={regForm.col1 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              placeholder="Enter patient number"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Unique patient identifier</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Registration Date</Form.Label>
                            <Form.Control 
                              name="col2" 
                              type="date"
                              value={regForm.col2 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Date when patient was registered</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Date of Birth</Form.Label>
                            <Form.Control 
                              name="col3" 
                              type="date"
                              value={regForm.col3 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              max={new Date().toISOString().split('T')[0]}
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Child's date of birth (cannot be in the future)</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Family Serial Number</Form.Label>
                            <Form.Control 
                              name="col4" 
                              value={regForm.col4 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              placeholder="Enter family serial number"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Family identification number</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Child's Name</Form.Label>
                            <Form.Control 
                              name="col5" 
                              value={regForm.col5 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              placeholder="Enter child's full name"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Full name of the child (letters, spaces, hyphens, commas, and periods only)</Form.Text>
                          </Form.Group>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>

                {/* Demographics Card */}
                <div className="col-12">
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-house me-2"></i>
                        Demographics & Contact Information
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Sex</Form.Label>
                            <Form.Select 
                              name="col6" 
                              value={regForm.col6 || ''} 
                              onChange={handleRegFormChange} 
                              required
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            >
                              <option value="">Select gender</option>
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </Form.Select>
                            <Form.Text className="text-muted">Child's gender</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-8">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Mother's Name</Form.Label>
                            <Form.Control 
                              name="col7" 
                              value={regForm.col7 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              placeholder="Enter mother's complete name"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Complete name of the child's mother (letters, spaces, hyphens, commas, and periods only)</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-12">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">Complete Address</Form.Label>
                            <Form.Control 
                              name="col8" 
                              value={regForm.col8 || ''} 
                              onChange={handleRegFormChange} 
                              required 
                              placeholder="Enter complete address"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Full residential address</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">CPAB (8a)</Form.Label>
                            <Form.Control 
                              name="col9" 
                              value={regForm.col9 || ''} 
                              onChange={handleRegFormChange} 
                              placeholder="Enter CPAB 8a information"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Conditional Pregnancy Assistance Benefit (8a)</Form.Text>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label className="text-dark fw-semibold">CPAB (8b)</Form.Label>
                            <Form.Control 
                              name="col10" 
                              value={regForm.col10 || ''} 
                              onChange={handleRegFormChange} 
                              placeholder="Enter CPAB 8b information"
                              className="form-control-lg"
                              style={{ fontSize: '16px', padding: '12px' }}
                            />
                            <Form.Text className="text-muted">Conditional Pregnancy Assistance Benefit (8b)</Form.Text>
                          </Form.Group>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={handleCloseRegModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editRegIdx !== null ? 'Update' : 'Save'} Registration
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* Edit Newborn Modal */}
      <Modal show={showNewbornEditModal} onHide={() => setShowNewbornEditModal(false)} size="xl" className="modal-modern modal-centered">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-baby me-2"></i>
            Newborn Care Records
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleNewbornFormSubmit}>
            {/* Birth Information */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-heart-pulse me-2"></i>
                  Birth Information
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Length at Birth (cm)</Form.Label>
                      <Form.Control 
                        name="length_at_birth"
                        type="number"
                        step="0.1"
                        min="0"
                        max="200"
                        value={newbornForm.length_at_birth || newbornForm.col_length_at_birth || ''}
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        placeholder="Enter length in cm"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Weight at Birth (kg)</Form.Label>
                      <Form.Control 
                        name="col1" 
                        type="number"
                        step="0.01"
                        min="0"
                        max="99.99"
                        value={newbornForm.col1 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        placeholder="Enter weight in kg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Birth Weight Status</Form.Label>
                      <Form.Select 
                        name="col2" 
                        value={newbornForm.col2 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      >
                        <option value="">Select Status</option>
                        <option value="Normal">Normal (2.5-4.0 kg)</option>
                        <option value="Low">Low Birth Weight (&lt;2.5 kg)</option>
                        <option value="High">High Birth Weight (&gt;4.0 kg)</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Breastfeeding Initiation Date</Form.Label>
                      <Form.Control 
                        name="col3" 
                        type="date"
                        value={newbornForm.col3 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Immunization */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-shield-check me-2"></i>
                  Initial Immunization
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">BCG Vaccine Date</Form.Label>
                      <Form.Control 
                        name="col4" 
                        type="date"
                        value={newbornForm.col4 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                      <Form.Text className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Usually given at birth
                      </Form.Text>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Hepatitis B Birth Dose Date</Form.Label>
                      <Form.Control 
                        name="col5" 
                        type="date"
                        value={newbornForm.col5 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                      <Form.Text className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        First dose of Hepatitis B series
                      </Form.Text>
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Monitoring */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-graph-up me-2"></i>
                  Growth Monitoring
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Age (months)</Form.Label>
                      <Form.Control 
                        name="col6" 
                        type="number"
                        min="0"
                        max="36"
                        value={newbornForm.col6 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        placeholder="Enter age"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Length (cm)</Form.Label>
                      <Form.Control 
                        name="col7" 
                        type="number"
                        step="0.1"
                        min="0"
                        max="200"
                        value={newbornForm.col7 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        placeholder="Enter length"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Weight (kg)</Form.Label>
                      <Form.Control 
                        name="col8" 
                        type="number"
                        step="0.01"
                        min="0"
                        max="99.99"
                        value={newbornForm.col8 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        placeholder="Enter weight"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">Nutritional Status</Form.Label>
                      <Form.Select 
                        name="col9" 
                        value={newbornForm.col9 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      >
                        <option value="">Select Status</option>
                        <option value="N">Normal</option>
                        <option value="S">Stunted</option>
                        <option value="W-MAM">Wasted - MAM</option>
                        <option value="W-SAM">Wasted - SAM</option>
                        <option value="O">Overweight/Obese</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>

            {/* Iron Supplementation */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-warning text-dark">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-droplet me-2"></i>
                  Iron Supplementation Schedule
                </h6>
                <small className="text-muted">For low birth weight infants</small>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">1 Month</Form.Label>
                      <Form.Control 
                        name="col10" 
                        type="date"
                        value={newbornForm.col10 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">2 Months</Form.Label>
                      <Form.Control 
                        name="col11" 
                        type="date"
                        value={newbornForm.col11 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">3 Months</Form.Label>
                      <Form.Control 
                        name="col12" 
                        type="date"
                        value={newbornForm.col12 || ''} 
                        onChange={handleNewbornFormChange}
                        className="form-control-lg"
                        style={{ fontSize: '16px', padding: '12px' }}
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up Immunization */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-secondary text-white">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-shield-plus me-2"></i>
                  Follow-up Immunization (1-3 months)
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="text-primary fw-semibold mb-3">DPT-HIB-HepB Series</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">1st Dose</Form.Label>
                          <Form.Control 
                            name="col13" 
                            type="date"
                            value={newbornForm.col13 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col13 && (
                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded border-start border-info border-3">
                              <small className="text-info fw-semibold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Next: 2nd Dose - {newbornForm.col14 || 'Suggested: ' + (new Date(new Date(newbornForm.col13).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">2nd Dose</Form.Label>
                          <Form.Control 
                            name="col14" 
                            type="date"
                            value={newbornForm.col14 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col14 && (
                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded border-start border-info border-3">
                              <small className="text-info fw-semibold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Next: 3rd Dose - {newbornForm.col15 || 'Suggested: ' + (new Date(new Date(newbornForm.col14).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">3rd Dose</Form.Label>
                          <Form.Control 
                            name="col15" 
                            type="date"
                            value={newbornForm.col15 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col15 && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded border-start border-success border-3">
                              <small className="text-success fw-semibold">
                                <i className="bi bi-check-circle me-1"></i>
                                Series Complete! Next: MMR at 9 months
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-success fw-semibold mb-3">OPV Series</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">1st Dose</Form.Label>
                          <Form.Control 
                            name="col16" 
                            type="date"
                            value={newbornForm.col16 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col16 && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded border-start border-success border-3">
                              <small className="text-success fw-semibold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Next: 2nd Dose - {newbornForm.col17 || 'Suggested: ' + (new Date(new Date(newbornForm.col16).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">2nd Dose</Form.Label>
                          <Form.Control 
                            name="col17" 
                            type="date"
                            value={newbornForm.col17 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col17 && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded border-start border-success border-3">
                              <small className="text-success fw-semibold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Next: 3rd Dose - {newbornForm.col18 || 'Suggested: ' + (new Date(new Date(newbornForm.col17).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">3rd Dose</Form.Label>
                          <Form.Control 
                            name="col18" 
                            type="date"
                            value={newbornForm.col18 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col18 && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded border-start border-success border-3">
                              <small className="text-success fw-semibold">
                                <i className="bi bi-check-circle me-1"></i>
                                Series Complete! Next: MMR at 9 months
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-warning fw-semibold mb-3">PCV Series</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">1st Dose</Form.Label>
                          <Form.Control 
                            name="col19" 
                            type="date"
                            value={newbornForm.col19 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col19 && (
                            <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded border-start border-warning border-3">
                              <small className="text-warning fw-semibold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Next: 2nd Dose - {newbornForm.col20 || 'Suggested: ' + (new Date(new Date(newbornForm.col19).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">2nd Dose</Form.Label>
                          <Form.Control 
                            name="col20" 
                            type="date"
                            value={newbornForm.col20 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col20 && (
                            <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded border-start border-warning border-3">
                              <small className="text-warning fw-semibold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Next: 3rd Dose - {newbornForm.col21 || 'Suggested: ' + (new Date(new Date(newbornForm.col20).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">3rd Dose</Form.Label>
                          <Form.Control 
                            name="col21" 
                            type="date"
                            value={newbornForm.col21 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col21 && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded border-start border-success border-3">
                              <small className="text-success fw-semibold">
                                <i className="bi bi-check-circle me-1"></i>
                                Series Complete! Next: MMR at 9 months
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-info fw-semibold mb-3">IPV</h6>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <Form.Group>
                          <Form.Label className="fw-semibold text-dark">Single Dose</Form.Label>
                          <Form.Control 
                            name="col22" 
                            type="date"
                            value={newbornForm.col22 || ''} 
                            onChange={handleNewbornFormChange}
                            className="form-control-lg"
                            style={{ fontSize: '16px', padding: '12px' }}
                          />
                          {newbornForm.col22 && (
                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded border-start border-info border-3">
                              <small className="text-info fw-semibold">
                                <i className="bi bi-check-circle me-1"></i>
                                IPV Complete! Next: MMR at 9 months
                              </small>
                            </div>
                          )}
                        </Form.Group>
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
      <Modal show={showNutritionEditModal} onHide={() => setShowNutritionEditModal(false)} size="xl" className="modal-modern modal-centered">
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
      <Modal show={showOutcomesEditModal} onHide={() => setShowOutcomesEditModal(false)} size="xl" className="modal-modern modal-centered">
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
        <Modal show={medicalSummaryModal} onHide={() => setMedicalSummaryModal(false)} size="xl" className="modal-modern modal-centered">
          <style>
            {`
              .modal-centered {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .modal-centered .modal-dialog {
                max-width: 95vw !important;
                width: 95vw !important;
                max-height: 95vh !important;
                margin: 0 !important;
                position: relative !important;
                transform: none !important;
              }
              .modal-centered .modal-content {
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                border-radius: 24px !important;
                margin: 0 !important;
                position: relative !important;
                top: auto !important;
                border: none;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
                overflow: hidden;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: translateX(30px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              .modal-modern .modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 0;
                min-height: 400px;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              }
              .info-item:hover {
                transform: translateY(-3px);
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
              }
              .card-hover:hover {
                transform: translateY(-5px);
                transition: all 0.3s ease;
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2) !important;
              }
              .gradient-bg {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .glass-effect {
                backdrop-filter: blur(10px);
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
              }
              .pulse-animation {
                animation: pulse 2s infinite;
              }
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              }
            `}
          </style>
          <Modal.Body className="p-0" style={{ padding: '0' }}>
          {/* Modern Header with Glass Effect */}
          <div className="position-relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2.5rem 3rem',
            position: 'relative'
          }}>
            {/* Background Pattern */}
            <div className="position-absolute top-0 start-0 w-100 h-100" style={{
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }}></div>
            
            <div className="d-flex align-items-center justify-content-between position-relative">
              <div className="d-flex align-items-center text-white">
                <div className="me-4 position-relative">
                  <div className="rounded-circle pulse-animation d-flex align-items-center justify-content-center" style={{ 
                    width: '70px', 
                    height: '70px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}>
                    <i className="bi bi-file-medical text-white" style={{ fontSize: '28px' }}></i>
                  </div>
                  <div className="position-absolute top-0 end-0 bg-success rounded-circle" style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid white',
                    animation: 'fadeInUp 0.6s ease-out'
                  }}>
                    <i className="bi bi-check text-white" style={{ fontSize: '10px' }}></i>
                  </div>
                </div>
                <div>
                  <h2 className="mb-2 text-white fw-bold" style={{ 
                    fontSize: '2rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    animation: 'fadeInUp 0.6s ease-out'
                  }}>
                    Medical Summary
                  </h2>
                  <p className="text-white mb-0" style={{ 
                    fontSize: '1.1rem', 
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    animation: 'fadeInUp 0.8s ease-out'
                  }}>
                    Complete patient medical overview and health records
                  </p>
                  <div className="d-flex align-items-center mt-2">
                    <div className="rounded-pill px-4 py-2 me-3" style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}>
                      <i className="bi bi-shield-check me-2 text-white" style={{ fontSize: '14px' }}></i>
                      <span className="text-white fw-bold" style={{ fontSize: '14px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Comprehensive Report</span>
                </div>
                    <div className="rounded-pill px-4 py-2" style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}>
                      <i className="bi bi-clock me-2 text-white" style={{ fontSize: '14px' }}></i>
                      <span className="text-white fw-bold" style={{ fontSize: '14px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Real-time Data</span>
              </div>
                </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMedicalSummaryModal(false)}
                  className="btn btn-light btn-lg rounded-circle"
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1.1) rotate(90deg)';
                    e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1) rotate(0deg)';
                    e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="position-relative" style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
            minHeight: '70vh', 
            padding: '2rem 2.5rem',
            position: 'relative'
          }}>
            {/* Background Pattern */}
            <div className="position-absolute top-0 start-0 w-100 h-100" style={{
              background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23e2e8f0" fill-opacity="0.3"%3E%3Cpath d="M20 20c0-11.046-8.954-20-20-20v20h20z"/%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.5
            }}></div>
            
            {selectedPatientForSummary && selectedPatientForSummary.summary ? (
              <div className="row g-4 position-relative">
                {/* Patient Header Section */}
                <div className="col-12">
                  <div className="patient-info-container card-hover" style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    borderRadius: '24px',
                    padding: '2rem',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
                    animation: 'fadeInUp 0.6s ease-out',
                    marginBottom: '1.5rem',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative Elements */}
                    <div className="position-absolute top-0 end-0" style={{
                      width: '100px',
                      height: '100px',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: '50%',
                      transform: 'translate(30px, -30px)'
                    }}></div>
                    <div className="position-absolute bottom-0 start-0" style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderRadius: '50%',
                      transform: 'translate(-20px, 20px)'
                    }}></div>
                    <div className="d-flex align-items-center mb-4 position-relative">
                      <div className="patient-avatar me-4 position-relative" style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '36px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                        border: '4px solid #ffffff',
                        animation: 'fadeInUp 0.8s ease-out'
                      }}>
                        {selectedPatientForSummary.summary.patientInfo.name.charAt(0).toUpperCase()}
                        <div className="position-absolute top-0 end-0 bg-success rounded-circle" style={{
                          width: '24px',
                          height: '24px',
                          border: '3px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="bi bi-check text-white" style={{ fontSize: '12px' }}></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h3 className="mb-3 fw-bold text-dark" style={{ 
                          fontSize: '1.8rem',
                          animation: 'fadeInUp 0.8s ease-out'
                        }}>
                          {selectedPatientForSummary.summary.patientInfo.name}
                        </h3>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center p-4 rounded-4" style={{
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                              border: '2px solid rgba(102, 126, 234, 0.3)',
                              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.1)'
                            }}>
                              <div className="rounded-circle p-3 me-3" style={{
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                                border: '2px solid rgba(102, 126, 234, 0.4)',
                                boxShadow: '0 4px 10px rgba(102, 126, 234, 0.2)'
                              }}>
                                <i className="bi bi-person-fill text-primary" style={{ fontSize: '20px' }}></i>
                          </div>
                              <div>
                                <small className="text-primary fw-bold d-block mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mother's Name</small>
                                <span className="fw-bold text-dark" style={{ fontSize: '16px' }}>{selectedPatientForSummary.summary.patientInfo.motherName}</span>
                          </div>
                        </div>
                      </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center p-4 rounded-4" style={{
                              background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.15) 0%, rgba(25, 135, 84, 0.15) 100%)',
                              border: '2px solid rgba(40, 167, 69, 0.3)',
                              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.1)'
                            }}>
                              <div className="rounded-circle p-3 me-3" style={{
                                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(25, 135, 84, 0.2) 100%)',
                                border: '2px solid rgba(40, 167, 69, 0.4)',
                                boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)'
                              }}>
                                <i className="bi bi-calendar-check text-success" style={{ fontSize: '20px' }}></i>
                              </div>
                              <div>
                                <small className="text-success fw-bold d-block mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Updated</small>
                                <span className="fw-bold text-dark" style={{ fontSize: '16px' }}>{selectedPatientForSummary.summary.lastUpdated}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Details Section */}
                <div className="col-12">
                  <div className="row g-4">
                    {/* Personal Information */}
                    <div className="col-md-6 mb-4">
                      <div className="card border-0 shadow-lg h-100 card-hover" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)',
                        animation: 'fadeInUp 0.8s ease-out',
                        minHeight: '400px'
                      }}>
                        <div className="card-header border-0 rounded-top-4" style={{ 
                          padding: '1.5rem',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                          borderBottom: '3px solid rgba(102, 126, 234, 0.4)',
                          boxShadow: '0 2px 10px rgba(102, 126, 234, 0.1)'
                        }}>
                          <h6 className="mb-0 text-primary fw-bold d-flex align-items-center" style={{ fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <div className="rounded-circle p-3 me-3" style={{
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
                              border: '2px solid rgba(102, 126, 234, 0.5)',
                              boxShadow: '0 4px 10px rgba(102, 126, 234, 0.2)'
                            }}>
                              <i className="bi bi-person-circle text-primary" style={{ fontSize: '20px' }}></i>
                            </div>
                            Personal Information
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="row g-4">
                            <div className="col-md-6">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                border: '2px solid rgba(102, 126, 234, 0.2)',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-calendar3 text-primary" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-primary fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Age</small>
                                </div>
                                <div className="fw-bold fs-4 text-primary">
                                  {selectedPatientForSummary.summary.patientInfo.currentAge} months
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                border: '2px solid rgba(102, 126, 234, 0.2)',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-gender-ambiguous text-primary" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-primary fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sex</small>
                                </div>
                                <div className="fw-bold">
                                  <Badge bg={selectedPatientForSummary.summary.patientInfo.sex === 'M' ? 'primary' : 'danger'} className="fs-5 px-3 py-2">
                                    {selectedPatientForSummary.summary.patientInfo.sex === 'M' ? 'Male' : 'Female'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                border: '2px solid rgba(102, 126, 234, 0.2)',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-calendar-date text-primary" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-primary fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Birth Date</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedPatientForSummary.summary.patientInfo.birthDate}</div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                border: '2px solid rgba(102, 126, 234, 0.2)',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-geo-alt text-primary" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-primary fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</small>
                                </div>
                                <div className="fw-bold fs-5 text-dark">{selectedPatientForSummary.summary.patientInfo.address}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Health Status */}
                    <div className="col-md-6 mb-4">
                      <div className="card border-0 shadow-lg h-100 card-hover" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)',
                        animation: 'fadeInUp 0.8s ease-out',
                        minHeight: '400px'
                      }}>
                        <div className="card-header border-0 rounded-top-4" style={{ 
                          padding: '1.5rem',
                          background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(25, 135, 84, 0.2) 100%)',
                          borderBottom: '3px solid rgba(40, 167, 69, 0.4)',
                          boxShadow: '0 2px 10px rgba(40, 167, 69, 0.1)'
                        }}>
                          <h6 className="mb-0 text-success fw-bold d-flex align-items-center" style={{ fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <div className="rounded-circle p-3 me-3" style={{
                              background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.3) 0%, rgba(25, 135, 84, 0.3) 100%)',
                              border: '2px solid rgba(40, 167, 69, 0.5)',
                              boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)'
                            }}>
                              <i className="bi bi-heart-pulse text-success" style={{ fontSize: '20px' }}></i>
                            </div>
                            Health Status
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="row g-4">
                            <div className="col-12">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(25, 135, 84, 0.1) 100%)',
                                border: '2px solid rgba(40, 167, 69, 0.2)',
                                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-speedometer2 text-success" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-success fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Weight</small>
                                </div>
                                <div className="fw-bold fs-3 text-success">
                                  {selectedPatientForSummary.summary.currentWeight}
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(25, 135, 84, 0.1) 100%)',
                                border: '2px solid rgba(40, 167, 69, 0.2)',
                                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-graph-up text-success" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-success fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth Status</small>
                                </div>
                                <div className="fw-bold">
                                  <Badge 
                                    bg={
                                      selectedPatientForSummary.summary.growthStatus === 'N' ? 'success' :
                                      selectedPatientForSummary.summary.growthStatus === 'S' ? 'warning' :
                                      selectedPatientForSummary.summary.growthStatus === 'W-MAM' ? 'warning' :
                                      selectedPatientForSummary.summary.growthStatus === 'W-SAM' ? 'danger' :
                                      selectedPatientForSummary.summary.growthStatus === 'O' ? 'info' : 'secondary'
                                    } 
                                    className="fs-5 px-4 py-2"
                                  >
                                    {selectedPatientForSummary.summary.growthStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="info-item p-3 rounded-4" style={{ 
                                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(25, 135, 84, 0.1) 100%)',
                                border: '2px solid rgba(40, 167, 69, 0.2)',
                                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.1)'
                              }}>
                                <div className="d-flex align-items-center mb-2">
                                  <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="bi bi-cup text-success" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <small className="text-success fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feeding Status</small>
                                </div>
                                <div className="fw-bold fs-5 text-success">{selectedPatientForSummary.summary.feedingStatus}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vaccination Summary */}
                    <div className="col-12 mb-4">
                      <div className="card border-0 shadow-lg" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '16px',
                        border: '2px solid #e9ecef',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div className="card-header bg-warning bg-opacity-10 border-0 rounded-top-4" style={{ padding: '1.2rem' }}>
                          <h6 className="mb-0 text-warning fw-bold" style={{ fontSize: '1rem' }}>
                            <i className="bi bi-shield-check me-2"></i>
                            Vaccination Summary
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <div className="text-center p-3 bg-primary text-white rounded-3" style={{ boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)' }}>
                                <i className="bi bi-shield-plus display-6 mb-2"></i>
                                <h3 className="mb-1 fw-bold">{selectedPatientForSummary.summary.totalVaccineDoses}</h3>
                                <p className="mb-0 fs-6">Total Vaccine Doses</p>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="text-center p-3 bg-success text-white rounded-3" style={{ boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)' }}>
                                <i className="bi bi-list-check display-6 mb-2"></i>
                                <h3 className="mb-1 fw-bold">{selectedPatientForSummary.summary.vaccinesReceived.length}</h3>
                                <p className="mb-0 fs-6">Vaccine Types Received</p>
                              </div>
                            </div>
                          </div>
                          
                          {selectedPatientForSummary.summary.vaccinesReceived.length > 0 ? (
                            <div className="row g-4">
                              {selectedPatientForSummary.summary.vaccinesReceived.map((vaccine, index) => (
                                <div key={index} className="col-md-6 col-lg-4">
                                  <div className="p-3 border-0 rounded-3 bg-white h-100 shadow-sm" style={{ 
                                    border: '2px solid #e9ecef',
                                    transition: 'all 0.3s ease',
                                    ':hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }
                                  }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <h6 className="mb-0 text-primary fw-bold fs-6">{vaccine.name}</h6>
                                      <Badge bg="success" className="fs-6 px-2 py-1">
                                        {vaccine.doses} dose{vaccine.doses !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <i className="bi bi-calendar-check text-success me-2" style={{ fontSize: '14px' }}></i>
                                      <small className="text-muted fs-6">
                                        <strong>Last:</strong> {formatDate(vaccine.lastDate)}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-5">
                              <div className="p-4 rounded-4" style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6' }}>
                                <i className="bi bi-exclamation-circle text-muted display-1 mb-3"></i>
                                <h5 className="text-muted mb-2">No Vaccination Records</h5>
                                <p className="text-muted mb-0">No vaccination data available for this patient</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Health Outcomes */}
                    <div className="col-12 mb-4">
                      <div className="card border-0 shadow-lg" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        borderRadius: '16px',
                        border: '2px solid #e9ecef',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div className="card-header bg-info bg-opacity-10 border-0 rounded-top-4" style={{ padding: '1.2rem' }}>
                          <h6 className="mb-0 text-info fw-bold" style={{ fontSize: '1rem' }}>
                            <i className="bi bi-clipboard-check me-2"></i>
                            Health Outcomes
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          <div className="info-item p-3 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '2px solid #e9ecef' }}>
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-clipboard-data text-info me-2" style={{ fontSize: '18px' }}></i>
                              <h6 className="text-muted fw-semibold mb-0">Outcomes Summary</h6>
                            </div>
                            <div className="fw-bold fs-5 text-info">{selectedPatientForSummary.summary.healthOutcomes}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="p-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6' }}>
                  <i className="bi bi-arrow-clockwise text-primary display-4 mb-2" style={{ animation: 'spin 1s linear infinite' }}></i>
                  <h6 className="text-muted mb-2">Loading Medical Summary</h6>
                  <p className="text-muted mb-0 fs-6">Please wait while we gather patient information...</p>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* Archived Patients Modal */}
      <Modal 
        show={showArchivedModal} 
        onHide={() => {
          setShowArchivedModal(false);
          setArchivedSearchTerm('');
          setArchivedSexFilter('all');
        }} 
        size="xl" 
        dialogClassName="archived-modal-dialog"
        centered
      >
        <style>
          {`
            .archived-modal-dialog {
              display: flex !important;
              align-items: center !important;
              min-height: calc(100vh - 3.5rem) !important;
              margin: 1.75rem auto !important;
            }
            
            .archived-modal-dialog .modal-content {
              border: none;
              border-radius: 20px;
              box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
              overflow: hidden;
              width: 95vw !important;
              max-width: 1400px !important;
              margin: 0 auto;
            }
            
            .archived-modal-dialog .modal-header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              border: none;
              padding: 1.5rem 2rem;
              border-radius: 20px 20px 0 0;
              color: white;
            }
            
            .archived-modal-dialog .modal-body {
              padding: 1.5rem;
              max-height: 75vh;
              overflow-y: auto;
              background: #f9fafb;
            }
            
            .archived-patient-row:hover {
              background-color: #f3f4f6 !important;
              transform: translateX(5px);
            }
            
            .modal-backdrop {
              background-color: rgba(0, 0, 0, 0.6) !important;
            }

            .archived-search-input:focus {
              border-color: #f59e0b !important;
              box-shadow: 0 0 0 0.2rem rgba(245, 158, 11, 0.25) !important;
            }
          `}
        </style>
        <Modal.Header className="border-0 d-flex justify-content-between align-items-center" style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '1.5rem 2rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <div className="d-flex align-items-center">
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              <i className="bi bi-archive" style={{ fontSize: '20px', color: 'white' }}></i>
            </div>
            <div>
              <h5 className="modal-title mb-0 fw-bold" style={{ 
                fontSize: '1.5rem',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                Archived Patients
              </h5>
              <small style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem'
              }}>
                {archivedPatients.length} total archived patient{archivedPatients.length !== 1 ? 's' : ''}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => {
              setShowArchivedModal(false);
              setArchivedSearchTerm('');
              setArchivedSexFilter('all');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '16px', color: 'white' }}></i>
          </button>
        </Modal.Header>
        <Modal.Body>
          {archivedPatients.length === 0 ? (
            <div className="text-center py-5">
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '3rem 2rem',
                border: '2px dashed #dee2e6',
                margin: '2rem 0'
              }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '3px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <i className="bi bi-archive" style={{ fontSize: '2.5rem', color: '#f59e0b' }}></i>
                </div>
                <h4 className="mt-3 mb-2" style={{ color: '#374151', fontWeight: '600' }}>
                  No Archived Patients
                </h4>
                <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                  There are currently no archived patients in the system.
                </p>
                <small className="text-muted d-block mt-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Archived patients will appear here when they are moved to archive status.
                </small>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Filter Section */}
              <div className="mb-4" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <Row className="g-3 align-items-end">
                  <Col md={5}>
                    <label className="form-label fw-semibold text-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                      <i className="bi bi-search me-2"></i>Search Patients
                    </label>
                    <input
                      type="text"
                      className="form-control archived-search-input"
                      placeholder="Search by child name, mother's name, or address..."
                      value={archivedSearchTerm}
                      onChange={handleArchivedSearchChange}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        padding: '0.625rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    />
                  </Col>
                  <Col md={3}>
                    <label className="form-label fw-semibold text-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                      <i className="bi bi-funnel me-2"></i>Filter by Sex
                    </label>
                    <select
                      className="form-select"
                      value={archivedSexFilter}
                      onChange={(e) => setArchivedSexFilter(e.target.value)}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        padding: '0.625rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="all">All</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </Col>
                  <Col md={2}>
                    <label className="form-label fw-semibold text-secondary mb-2" style={{ fontSize: '0.875rem' }}>
                      Show
                    </label>
                    <select
                      className="form-select"
                      value={archivedRowsPerPage}
                      onChange={(e) => {
                        setArchivedRowsPerPage(Number(e.target.value));
                        setArchivedCurrentPage(1);
                      }}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        padding: '0.625rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </Col>
                  <Col md={2} className="text-end">
                    {(archivedSearchTerm || archivedSexFilter !== 'all') && (
                      <Button
                        variant="outline-secondary"
                        onClick={handleArchivedClearSearch}
                        style={{
                          borderRadius: '8px',
                          padding: '0.625rem 1.25rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          width: '100%'
                        }}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Clear
                      </Button>
                    )}
                  </Col>
                </Row>
                {filteredArchivedPatients.length < archivedPatients.length && (
                  <div className="mt-3">
                    <small style={{ 
                      color: '#059669',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}>
                      <i className="bi bi-check-circle me-1"></i>
                      Showing {filteredArchivedPatients.length} of {archivedPatients.length} archived patient{archivedPatients.length !== 1 ? 's' : ''}
                    </small>
                  </div>
                )}
              </div>

              {/* Table Section */}
              {filteredArchivedPatients.length === 0 ? (
                <div className="text-center py-5" style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    border: '2px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <i className="bi bi-search" style={{ fontSize: '1.75rem', color: '#f59e0b' }}></i>
                  </div>
                  <h5 className="mb-2" style={{ color: '#374151', fontWeight: '600' }}>
                    No Results Found
                  </h5>
                  <p className="text-muted mb-3">
                    No archived patients match your search criteria.
                  </p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleArchivedClearSearch}
                    style={{
                      borderRadius: '8px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="archived-patients-container" style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
                      <thead style={{
                        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                        color: 'white'
                      }}>
                        <tr>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', borderBottom: 'none' }}>
                            <i className="bi bi-person me-2"></i>Child Name
                          </th>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', borderBottom: 'none' }}>
                            <i className="bi bi-person-heart me-2"></i>Mother's Name
                          </th>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', borderBottom: 'none' }}>
                            <i className="bi bi-gender-ambiguous me-2"></i>Sex
                          </th>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', borderBottom: 'none' }}>
                            <i className="bi bi-calendar-event me-2"></i>Birth Date
                          </th>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', borderBottom: 'none' }}>
                            <i className="bi bi-geo-alt me-2"></i>Address
                          </th>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', borderBottom: 'none' }}>
                            <i className="bi bi-clock-history me-2"></i>Archived Date
                          </th>
                          <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', textAlign: 'center', borderBottom: 'none' }}>
                            <i className="bi bi-gear me-2"></i>Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const startIndex = (archivedCurrentPage - 1) * archivedRowsPerPage;
                          const endIndex = startIndex + archivedRowsPerPage;
                          const paginatedPatients = filteredArchivedPatients.slice(startIndex, endIndex);
                          
                          return paginatedPatients.map((patient, index) => (
                            <tr 
                              key={patient.id}
                              className="archived-patient-row"
                              style={{
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                transition: 'all 0.2s ease',
                                borderBottom: '1px solid #e5e7eb'
                              }}
                            >
                              <td style={{ padding: '1rem', fontWeight: '600', color: '#1f2937' }}>
                                {patient.child_name || <span className="text-muted">N/A</span>}
                              </td>
                              <td style={{ padding: '1rem', color: '#6b7280' }}>
                                {patient.mother_name || <span className="text-muted">N/A</span>}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  background: patient.sex?.toLowerCase() === 'male' 
                                    ? 'rgba(59, 130, 246, 0.1)' 
                                    : patient.sex?.toLowerCase() === 'female'
                                    ? 'rgba(236, 72, 153, 0.1)'
                                    : 'rgba(107, 114, 128, 0.1)',
                                  color: patient.sex?.toLowerCase() === 'male' 
                                    ? '#3b82f6' 
                                    : patient.sex?.toLowerCase() === 'female'
                                    ? '#ec4899'
                                    : '#6b7280'
                                }}>
                                  {patient.sex || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', color: '#6b7280' }}>
                                {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : <span className="text-muted">N/A</span>}
                              </td>
                              <td style={{ padding: '1rem', color: '#6b7280', maxWidth: '200px' }}>
                                <div style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }} title={patient.address}>
                                  {patient.address || <span className="text-muted">N/A</span>}
                                </div>
                              </td>
                              <td style={{ padding: '1rem', color: '#6b7280' }}>
                                {patient.archived_at ? new Date(patient.archived_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : <span className="text-muted">N/A</span>}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <Button 
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleUnarchivePatient(patient.id, patient.child_name || 'this patient')}
                                  disabled={isUnarchiving && unarchivingPatientId === patient.id}
                                  style={{
                                    background: isUnarchiving && unarchivingPatientId === patient.id
                                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    cursor: isUnarchiving && unarchivingPatientId === patient.id ? 'not-allowed' : 'pointer',
                                    opacity: isUnarchiving && unarchivingPatientId === patient.id ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {isUnarchiving && unarchivingPatientId === patient.id ? (
                                    <>
                                      <i className="bi bi-arrow-repeat" style={{ 
                                        fontSize: '0.8rem',
                                        animation: 'spin 1s linear infinite'
                                      }}></i>
                                      Restoring...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '0.8rem' }}></i>
                                      Restore
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredArchivedPatients.length > archivedRowsPerPage && (
                    <div className="d-flex justify-content-between align-items-center px-4 py-3" style={{
                      borderTop: '1px solid #e5e7eb',
                      background: '#f9fafb'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Showing {((archivedCurrentPage - 1) * archivedRowsPerPage) + 1} to{' '}
                        {Math.min(archivedCurrentPage * archivedRowsPerPage, filteredArchivedPatients.length)} of{' '}
                        {filteredArchivedPatients.length} entries
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled={archivedCurrentPage === 1}
                          onClick={() => setArchivedCurrentPage(archivedCurrentPage - 1)}
                          style={{
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </Button>
                        <div className="d-flex gap-1">
                          {(() => {
                            const totalPages = Math.ceil(filteredArchivedPatients.length / archivedRowsPerPage);
                            const pages = [];
                            for (let i = 1; i <= totalPages; i++) {
                              if (i === 1 || i === totalPages || (i >= archivedCurrentPage - 1 && i <= archivedCurrentPage + 1)) {
                                pages.push(
                                  <Button
                                    key={i}
                                    variant={i === archivedCurrentPage ? "primary" : "outline-secondary"}
                                    size="sm"
                                    onClick={() => setArchivedCurrentPage(i)}
                                    style={{
                                      borderRadius: '8px',
                                      padding: '0.5rem 0.75rem',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      minWidth: '38px',
                                      background: i === archivedCurrentPage 
                                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                        : 'transparent',
                                      borderColor: i === archivedCurrentPage ? 'transparent' : '#dee2e6'
                                    }}
                                  >
                                    {i}
                                  </Button>
                                );
                              } else if (i === archivedCurrentPage - 2 || i === archivedCurrentPage + 2) {
                                pages.push(<span key={i} style={{ padding: '0.5rem 0.25rem' }}>...</span>);
                              }
                            }
                            return pages;
                          })()}
                        </div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled={archivedCurrentPage === Math.ceil(filteredArchivedPatients.length / archivedRowsPerPage)}
                          onClick={() => setArchivedCurrentPage(archivedCurrentPage + 1)}
                          style={{
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
