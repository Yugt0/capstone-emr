import "../styles/PatientList.css";
import "../styles/Modal.css";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const PATIENTS_API = "http://127.0.0.1:8000/api/patients";
const MEDICAL_RECORDS_API = "http://127.0.0.1:8000/api/patient-medical-records";
export default function PatientList() {
  // Force refresh timestamp: ${new Date().toISOString()}
  const { user, getToken, isAuthenticated } = useAuth();
  


  // Simple function to just return the value as-is, no processing
  const extractValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Combine name fields for display
  const getFullName = (patient) => {
    if (!patient) return '';
    const parts = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean);
    return parts.join(' ');
  };

  // Validation functions
  const validatePatientForm = (formData) => {
    const newErrors = {};
    
    if (!formData.first_name || formData.first_name.trim() === '') {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }
    
    if (!formData.last_name || formData.last_name.trim() === '') {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }
    
    if (formData.middle_name && formData.middle_name.trim().length < 2) {
      newErrors.middle_name = 'Middle name must be at least 2 characters if provided';
    }
    
    if (!formData.birth_date) {
      newErrors.birth_date = 'Birth date is required';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth_date = 'Birth date cannot be in the future';
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 120) {
        newErrors.birth_date = 'Please enter a valid birth date';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.barangay || formData.barangay.trim() === '') {
      newErrors.barangay = 'Barangay is required';
    }
    
    if (formData.contact_number && formData.contact_number.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(formData.contact_number.trim())) {
        newErrors.contact_number = 'Please enter a valid contact number';
      }
    }
    
    return newErrors;
  };

  const validateMedicalRecordForm = (formData) => {
    const newErrors = {};
    
    if (!formData.temperature || formData.temperature.trim() === '') {
      newErrors.temperature = 'Temperature is required';
    }
    
    if (!formData.weight || formData.weight.trim() === '') {
      newErrors.weight = 'Weight is required';
    }
    
    if (!formData.age || formData.age.trim() === '') {
      newErrors.age = 'Age is required';
    }
    
    if (!formData.respiratory_rate || formData.respiratory_rate.trim() === '') {
      newErrors.respiratory_rate = 'Respiratory rate is required';
    }
    
    if (!formData.cardiac_rate || formData.cardiac_rate.trim() === '') {
      newErrors.cardiac_rate = 'Cardiac rate is required';
    }
    
    if (!formData.blood_pressure || formData.blood_pressure.trim() === '') {
      newErrors.blood_pressure = 'Blood pressure is required';
    }
    
    if (!formData.chief_complaint || formData.chief_complaint.trim() === '') {
      newErrors.chief_complaint = 'Chief complaint is required';
    }
    
    if (!formData.history_of_present_illness || formData.history_of_present_illness.trim() === '') {
      newErrors.history_of_present_illness = 'History of present illness is required';
    }
    
    return newErrors;
  };

  const clearErrors = () => {
    setErrors({});
    setSubmitError("");
  };

  // Toast notification functions
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addMedicalRecordModal, setAddMedicalRecordModal] = useState(false);
  const [editMedicalRecordModal, setEditMedicalRecordModal] = useState(false);
  const [medicalSummaryModal, setMedicalSummaryModal] = useState(false);
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(null);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(0);
  const [form, setForm] = useState({});
  const [recordForm, setRecordForm] = useState({});
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchAge, setSearchAge] = useState("");
  const [searchGender, setSearchGender] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Toast notification states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch patients and their medical records
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

  // Auto-filter when age or gender filters change
  useEffect(() => {
    if (searchAge || searchGender || searchGender === "") {
      handleSearch();
    }
  }, [searchAge, searchGender]);

  // Pagination calculations
  const totalEntries = filteredPatients.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredPatients.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPatients, rowsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setFilteredPatients(
      patients.filter((patient) => {
        const fullName = getFullName(patient);
        const nameMatch = fullName.toLowerCase().includes(searchName.toLowerCase()) ||
                         (patient.first_name && patient.first_name.toLowerCase().includes(searchName.toLowerCase())) ||
                         (patient.middle_name && patient.middle_name.toLowerCase().includes(searchName.toLowerCase())) ||
                         (patient.last_name && patient.last_name.toLowerCase().includes(searchName.toLowerCase()));
        const dateMatch = !searchDate || patient.birth_date === searchDate;
        const genderMatch = !searchGender || searchGender === "" || patient.gender === searchGender;
        
        // Calculate age from birth date
        let ageMatch = true;
        if (searchAge) {
          const birthDate = new Date(patient.birth_date);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
            ? age - 1 
            : age;
          ageMatch = calculatedAge.toString() === searchAge;
        }
        
        return nameMatch && dateMatch && genderMatch && ageMatch;
      })
    );
  };

  // Reset search fields and show all patients
  const handleReset = () => {
    setSearchName("");
    setSearchDate("");
    setSearchAge("");
    setSearchGender("");
    setFilteredPatients(patients);
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(PATIENTS_API);
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      alert("Failed to fetch patients");
    }
    setLoading(false);
  };

  const fetchMedicalRecords = async (patientId) => {
    try {
      const recRes = await fetch(`${MEDICAL_RECORDS_API}?patient_id=${patientId}`);
      const recData = await recRes.json();
      setMedicalRecords(recData);
    } catch (err) {
      setMedicalRecords([]);
      alert("Failed to fetch medical records");
    }
  };

  // Add Patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    // Validate form
    const validationErrors = validatePatientForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    
    let dataToSend = { ...form };
    if (dataToSend.birth_date) {
      // Ensure the date is in YYYY-MM-DD format
      const d = new Date(dataToSend.birth_date);
      if (!isNaN(d)) {
        dataToSend.birth_date = d.toISOString().slice(0, 10);
      }
    }
    
    try {
      const res = await fetch(PATIENTS_API, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      setShowModal(false);
      setForm({});
      clearErrors();
      fetchPatients();
      showToast('Patient added successfully!', 'success');
    } catch (err) {
      console.error('Add patient error:', err);
      setSubmitError(err.message || "Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Patient
  const handleEditPatient = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    // Validate form
    const validationErrors = validatePatientForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    
    const patient = patients[selectedPatientIdx];
    try {
      const res = await fetch(`${PATIENTS_API}/${patient.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      setEditModal(false);
      setForm({});
      clearErrors();
      fetchPatients();
      showToast('Patient updated successfully!', 'success');
    } catch (err) {
      console.error('Edit patient error:', err);
      setSubmitError(err.message || "Failed to update patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Patient
  const handleDeletePatient = async (idx) => {
    const patient = patients[idx];
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      const res = await fetch(`${PATIENTS_API}/${patient.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete patient");
      fetchPatients();
    } catch (err) {
      alert("Failed to delete patient");
    }
  };

  // Add Medical Record
  const handleAddMedicalRecord = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    // Validate form
    const validationErrors = validateMedicalRecordForm(recordForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    
    const patient = patients[selectedPatientIdx];
    // Prepare payload - use raw values as-is
    const payload = {
      patient_id: patient.id,
      temperature: recordForm.temperature || '',
      weight: recordForm.weight || '',
      age: recordForm.age || '',
      respiratory_rate: recordForm.respiratory_rate || '',
      cardiac_rate: recordForm.cardiac_rate || '',
      blood_pressure: recordForm.blood_pressure || '',
      chief_complaint: recordForm.chief_complaint,
      patient_history: recordForm.patient_history,
      history_of_present_illness: recordForm.history_of_present_illness,
      medicine_takes: recordForm.medicine_takes || ''
    };
    
    try {
      const res = await fetch(MEDICAL_RECORDS_API, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      setAddMedicalRecordModal(false);
      setRecordForm({});
      clearErrors();
      fetchMedicalRecords(patient.id);
    } catch (err) {
      console.error('Add medical record error:', err);
      setSubmitError(err.message || "Failed to add medical record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Medical Record
  const handleEditMedicalRecord = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    // Validate form
    const validationErrors = validateMedicalRecordForm(recordForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    
    const patient = patients[selectedPatientIdx];
    const record = medicalRecords[selectedRecordIdx];
    
    // Prepare payload - use raw values as-is
    const payload = {
      temperature: recordForm.temperature || '',
      weight: recordForm.weight || '',
      age: recordForm.age || '',
      respiratory_rate: recordForm.respiratory_rate || '',
      cardiac_rate: recordForm.cardiac_rate || '',
      blood_pressure: recordForm.blood_pressure || '',
      chief_complaint: recordForm.chief_complaint,
      patient_history: recordForm.patient_history,
      history_of_present_illness: recordForm.history_of_present_illness,
      medicine_takes: recordForm.medicine_takes || ''
    };
    
    try {
      const res = await fetch(`${MEDICAL_RECORDS_API}/${record.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      setEditMedicalRecordModal(false);
      setRecordForm({});
      clearErrors();
      fetchMedicalRecords(patient.id);
    } catch (err) {
      console.error('Edit medical record error:', err);
      setSubmitError(err.message || "Failed to update medical record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit medical record button click
  const handleEditMedicalRecordClick = (recordIdx) => {
    try {
    const record = medicalRecords[recordIdx];
      if (!record) {
        console.error('Record not found at index:', recordIdx);
        return;
      }
      
    setRecordForm({
      temperature: record.temperature || "",
      weight: record.weight || "",
      age: record.age || "",
      respiratory_rate: record.respiratory_rate || "",
      cardiac_rate: record.cardiac_rate || "",
      blood_pressure: record.blood_pressure || "",
      chief_complaint: record.chief_complaint || "",
      patient_history: record.patient_history || "",
      history_of_present_illness: record.history_of_present_illness || "",
      medicine_takes: record.medicine_takes || ""
    });
    setSelectedRecordIdx(recordIdx);
    setEditMedicalRecordModal(true);
    } catch (error) {
      console.error('Error in handleEditMedicalRecordClick:', error);
      alert('Error loading medical record for editing');
    }
  };

  // Delete Medical Record
  const handleDeleteMedicalRecord = async (recIdx) => {
    const patient = patients[selectedPatientIdx];
    const record = medicalRecords[recIdx];
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;
    try {
      const res = await fetch(`${MEDICAL_RECORDS_API}/${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete medical record");
      fetchMedicalRecords(patient.id);
    } catch (err) {
      alert("Failed to delete medical record");
    }
  };

  // Handlers for form changes with real-time validation
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRecordFormChange = (e) => {
    const { name, value } = e.target;
    setRecordForm({ ...recordForm, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Real-time validation functions
  const validateField = (fieldName, value, formType = 'patient') => {
    const newErrors = { ...errors };
    
    if (formType === 'patient') {
      switch (fieldName) {
        case 'first_name':
          if (!value || value.trim() === '') {
            newErrors.first_name = 'First name is required';
          } else if (value.trim().length < 2) {
            newErrors.first_name = 'First name must be at least 2 characters';
          } else {
            delete newErrors.first_name;
          }
          break;
          
        case 'last_name':
          if (!value || value.trim() === '') {
            newErrors.last_name = 'Last name is required';
          } else if (value.trim().length < 2) {
            newErrors.last_name = 'Last name must be at least 2 characters';
          } else {
            delete newErrors.last_name;
          }
          break;
          
        case 'middle_name':
          if (value && value.trim().length < 2) {
            newErrors.middle_name = 'Middle name must be at least 2 characters if provided';
          } else {
            delete newErrors.middle_name;
          }
          break;
          
        case 'birth_date':
          if (!value) {
            newErrors.birth_date = 'Birth date is required';
          } else {
            const birthDate = new Date(value);
            const today = new Date();
            if (birthDate > today) {
              newErrors.birth_date = 'Birth date cannot be in the future';
            } else {
              const age = today.getFullYear() - birthDate.getFullYear();
              if (age > 120) {
                newErrors.birth_date = 'Please enter a valid birth date';
              } else {
                delete newErrors.birth_date;
              }
            }
          }
          break;
          
        case 'gender':
          if (!value) {
            newErrors.gender = 'Gender is required';
          } else {
            delete newErrors.gender;
          }
          break;
          
        case 'barangay':
          if (!value || value.trim() === '') {
            newErrors.barangay = 'Barangay is required';
          } else {
            delete newErrors.barangay;
          }
          break;
          
        case 'contact_number':
          if (value && value.trim() !== '') {
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(value.trim())) {
              newErrors.contact_number = 'Please enter a valid contact number';
            } else {
              delete newErrors.contact_number;
            }
          } else {
            delete newErrors.contact_number;
          }
          break;
      }
    } else if (formType === 'medical') {
      // Medical record validation
      if (!value || value.trim() === '') {
        newErrors[fieldName] = `${fieldName.replace('_', ' ')} is required`;
      } else {
        delete newErrors[fieldName];
      }
    }
    
    setErrors(newErrors);
  };

  // Enhanced form change handlers with real-time validation
  const handleFormChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validateField(name, value, 'patient');
  };

  const handleRecordFormChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setRecordForm({ ...recordForm, [name]: value });
    validateField(name, value, 'medical');
  };

  // Use the selected patient index to get the patient
  const selectedPatient = selectedPatientIdx !== null ? patients[selectedPatientIdx] : null;
  const filteredRecords = selectedPatient ? medicalRecords.filter(rec => rec.patient_id === selectedPatient.id) : [];
  const records = filteredRecords;
  const selectedRecord = records[selectedRecordIdx] || null;

  // Filtered patients based on search
  // const filteredPatients = patients.filter((patient) => {
  //   const nameMatch = patient.full_name.toLowerCase().includes(searchName.toLowerCase());
  //   if (searchDate) {
  //     return nameMatch && patient.birth_date === searchDate;
  //   }
  //   return nameMatch;
  // });

  // When viewing medical records
  const handleViewMedicalRecords = (idx) => {
    setSelectedPatientIdx(idx);
    setviewMedicalRecords(true);
    fetchMedicalRecords(patients[idx].id);
    setSelectedRecordIdx(0);
  };

  // Generate medical summary data
  const generateMedicalSummary = (patient, records) => {
    if (!records || records.length === 0) {
      return {
        totalRecords: 0,
        latestRecord: null,
        medicineHistory: [],
        commonComplaints: [],
        recentAssessments: [],
        vitalTrends: {
          temperatures: [],
          bloodPressures: [],
          weights: []
        },
        timeline: []
      };
    }

    // Sort records by date (newest first)
    const sortedRecords = [...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Extract medicine history
    const medicineHistory = records
      .filter(record => record.medicine_takes)
      .map(record => ({
        date: record.created_at,
        medicine: record.medicine_takes,
        assessment: record.assessment
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Extract common complaints
    const complaints = records.map(record => record.chief_complaint).filter(Boolean);
    const complaintCounts = complaints.reduce((acc, complaint) => {
      acc[complaint] = (acc[complaint] || 0) + 1;
      return acc;
    }, {});
    const commonComplaints = Object.entries(complaintCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([complaint, count]) => ({ complaint, count }));

    // Extract recent assessments
    const recentAssessments = records
      .map(record => record.assessment)
      .filter(Boolean)
      .slice(0, 5);

    // Extract vital trends
    const vitalTrends = {
      temperatures: records
        .filter(record => record.temperature)
        .map(record => ({
          date: record.created_at,
          value: record.temperature
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      bloodPressures: records
        .filter(record => record.blood_pressure)
        .map(record => ({
          date: record.created_at,
          value: record.blood_pressure
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      weights: records
        .filter(record => record.weight)
        .map(record => ({
          date: record.created_at,
          value: record.weight
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    };

    // Create timeline
    const timeline = records
      .map(record => ({
        date: record.created_at,
        type: 'medical_record',
        title: record.chief_complaint || 'Medical Record',
        details: {
          assessment: record.assessment,
          plan: record.plan,
          medicine: record.medicine_takes
        }
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      totalRecords: records.length,
      latestRecord: sortedRecords[0],
      medicineHistory,
      commonComplaints,
      recentAssessments,
      vitalTrends,
      timeline
    };
  };

  // Handle medical summary modal
  const handleMedicalSummary = (idx) => {
    setSelectedPatientIdx(idx);
    setMedicalSummaryModal(true);
    fetchMedicalRecords(patients[idx].id);
  };

  return (
    <div className="patient-list-container">
      <style>
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
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          
          /* Custom scrollbar styling */
          .patient-list ::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          
          .patient-list ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .patient-list ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          
          .patient-list ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
        `}
      </style>
      
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{
            background: toast.type === 'success' 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : toast.type === 'error'
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '400px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              {toast.type === 'success' ? (
                <i className="bi bi-check-circle"></i>
              ) : toast.type === 'error' ? (
                <i className="bi bi-exclamation-triangle"></i>
              ) : (
                <i className="bi bi-info-circle"></i>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                {toast.type === 'success' ? 'Success!' : toast.type === 'error' ? 'Error!' : 'Info'}
              </div>
              <div style={{ fontSize: '13px', opacity: '0.9' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={hideToast}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="header-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="page-label">Patient List</h3>
          {(searchAge || searchGender) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}>
              <i className="bi bi-funnel"></i>
              <span>Filters Active</span>
              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear all filters"
              >
                ×
              </button>
            </div>
          )}
        </div>
        {user && (
          <p className="user-info-display">
            <i className="fas fa-user me-2"></i>
            Logged in as: <strong className="text-primary">{user.name}</strong> ({user.role})
          </p>
        )}
      </div>
      <div className="search-and-add-container">
        <form className="search-container d-flex align-items-end mb-3" style={{gap: '1rem'}} onSubmit={e => {e.preventDefault(); handleSearch();}}>
          <div className="search-input-container flex-column" style={{background: 'none', boxShadow: 'none', border: 'none', minWidth: '200px'}}>
            <label htmlFor="searchName" style={{fontWeight: 500, marginBottom: 4}}>Search Name</label>
            <input
              id="searchName"
              type="text"
              className="search-input"
              placeholder="Search first, middle, or last name..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              style={{background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 1rem'}}
            />
          </div>
          <div className="date-search-container flex-column" style={{minWidth: '160px', alignItems: 'center', display: 'flex'}}>
            <label htmlFor="searchDate" style={{fontWeight: 500, marginBottom: 4, textAlign: 'center', width: '100%'}}>Birthdate</label>
            <input
              id="searchDate"
              type="date"
              className="date-input"
              placeholder="Birthdate"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              style={{background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 1rem'}}
            />
          </div>
          <div className="search-buttons-container d-flex" style={{gap: '0.5rem', alignItems: 'end'}}>
            <button
              className="btn-search"
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '0.5rem 1.2rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}
              onMouseOver={e => {
                e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }}
              onMouseOut={e => {
                e.target.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
              }}
            >
              <i className="bi bi-search me-1"></i> Search
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleReset}
              style={{
                borderRadius: 8, 
                padding: '0.5rem 1.2rem', 
                fontWeight: 500, 
                background: '#f3f4f6', 
                color: '#374151', 
                border: '1.5px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => {
                e.target.style.background = '#e5e7eb';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'none';
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Reset
            </button>
          </div>
        </form>
        <div style={{marginTop: '0.5rem',marginRight: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
          {/* Add Patient Button - Available for all roles including nursing_attendant */}
          <button
            type="button"
            className="btn-add-patient"
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(90deg, #2ba84a 0%, #38b2ac 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '0.6rem 1.4rem',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 2px 8px rgba(44, 187, 99, 0.10)',
              letterSpacing: '0.3px',
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseOver={e => {
              e.target.style.background = 'linear-gradient(90deg, #24913e 0%, #319795 100%)';
              e.target.style.transform = 'translateY(-2px) scale(1.04)';
              e.target.style.boxShadow = '0 6px 16px rgba(44, 187, 99, 0.15)';
            }}
            onMouseOut={e => {
              e.target.style.background = 'linear-gradient(90deg, #2ba84a 0%, #38b2ac 100%)';
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 2px 8px rgba(44, 187, 99, 0.10)';
            }}
          >
            <i className="bi bi-plus-lg" style={{fontSize: '1.1em', marginRight: '0.2em'}}></i>
            Add Patient
          </button>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="patient-list" style={{
          padding: '0 20px'
        }}>
          <div style={{
            overflowX: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <table className="table table-bordered" style={{
              minWidth: '1200px',
            width: '100%',
            margin: '0',
            fontSize: '13px'
          }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '100px',
                    maxWidth: '120px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-person" style={{ fontSize: '14px' }}></i>
                      <span>First Name</span>
                    </div>
                  </th>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '100px',
                    maxWidth: '120px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-person-badge" style={{ fontSize: '14px' }}></i>
                      <span>Middle Name</span>
                    </div>
                  </th>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '100px',
                    maxWidth: '120px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-person-check" style={{ fontSize: '14px' }}></i>
                      <span>Last Name</span>
                    </div>
                  </th>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '60px',
                    maxWidth: '80px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="bi bi-gender-ambiguous" style={{ fontSize: '14px' }}></i>
                        <span>Sex</span>
                      </div>
                      <select
                        value={searchGender}
                        onChange={e => setSearchGender(e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          width: '90px',
                          textAlign: 'center',
                          fontWeight: '500',
                          color: '#374151',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={e => {
                          e.target.style.background = 'white';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseOut={e => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'none';
                          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        <option value="">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </th>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '100px',
                    maxWidth: '120px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="bi bi-calendar-event" style={{ fontSize: '14px' }}></i>
                        <span>Date of birth</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          placeholder="Age"
                          value={searchAge}
                          onChange={e => setSearchAge(e.target.value)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            width: '70px',
                            textAlign: 'center',
                            fontWeight: '500',
                            color: '#374151',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease'
                          }}
                          min="0"
                          max="120"
                          onMouseOver={e => {
                            e.target.style.background = 'white';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseOut={e => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '10px',
                          color: '#6b7280',
                          pointerEvents: 'none'
                        }}>
                          yrs
                        </div>
                      </div>
                    </div>
                  </th>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '100px',
                    maxWidth: '130px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-geo-alt" style={{ fontSize: '14px' }}></i>
                      <span>Barangay</span>
                    </div>
                  </th>
                  <th style={{
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative',
                    minWidth: '120px',
                    maxWidth: '150px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-person-check" style={{ fontSize: '14px' }}></i>
                      <span>Modified By</span>
                    </div>
                  </th>
                  <th style={{
                    minWidth: '280px',
                    maxWidth: '320px',
                    padding: '10px 6px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-gear" style={{ fontSize: '14px' }}></i>
                      <span>Action</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((patient, idx) => (
                  <tr key={patient.id} style={{
                    transition: 'all 0.2s ease',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <td style={{
                      padding: '8px 6px',
                      fontWeight: '500',
                      color: '#1f2937',
                      border: 'none',
                      fontSize: '13px',
                      wordWrap: 'break-word',
                      maxWidth: '120px'
                    }}>{patient.first_name || ''}</td>
                    <td style={{
                      padding: '8px 6px',
                      fontWeight: '500',
                      color: '#1f2937',
                      border: 'none',
                      fontSize: '13px',
                      wordWrap: 'break-word',
                      maxWidth: '120px'
                    }}>{patient.middle_name || ''}</td>
                    <td style={{
                      padding: '8px 6px',
                      fontWeight: '500',
                      color: '#1f2937',
                      border: 'none',
                      fontSize: '13px',
                      wordWrap: 'break-word',
                      maxWidth: '120px'
                    }}>{patient.last_name || ''}</td>
                    <td style={{
                      padding: '8px 6px',
                      textAlign: 'center',
                      border: 'none',
                      fontSize: '12px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: patient.gender === 'Male' 
                          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                          : patient.gender === 'Female'
                          ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                          : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        <i className={`bi ${patient.gender === 'Male' ? 'bi-gender-male' : patient.gender === 'Female' ? 'bi-gender-female' : 'bi-gender-ambiguous'}`} style={{ fontSize: '10px' }}></i>
                        {patient.gender}
                      </span>
                    </td>
                    <td style={{
                      padding: '8px 6px',
                      textAlign: 'center',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{formatDate(patient.birth_date)}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#9ca3af',
                          background: '#f3f4f6',
                          padding: '2px 4px',
                          borderRadius: '6px'
                        }}>
                          {(() => {
                            const birthDate = new Date(patient.birth_date);
                            const today = new Date();
                            const age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                          })()} years old
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '8px 6px',
                      border: 'none',
                      color: '#374151',
                      fontSize: '12px',
                      wordWrap: 'break-word',
                      maxWidth: '130px'
                    }}>{patient.barangay}</td>
                    <td style={{
                      padding: '8px 6px',
                      border: 'none'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '6px 8px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                        }}>
                          <i className="fas fa-user"></i>
                        </div>
                        <div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#1f2937',
                            lineHeight: '1.2'
                          }}>
                            {user ? user.name : 'Unknown'}
                          </div>
                          <div style={{
                            fontSize: '9px',
                            color: '#6b7280',
                            lineHeight: '1.2'
                          }}>
                            {user ? user.role : 'User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons" style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'nowrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: '280px',
                        maxWidth: '320px',
                        padding: '4px'
                      }}>
                        <style>
                          {`
                            .action-buttons button:hover {
                              transform: translateY(-2px);
                              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                            }
                            .action-buttons button:active {
                              transform: translateY(0);
                            }
                          `}
                        </style>
                        <button
                          type="button"
                          className="btn-view"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            setViewModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                            border: 'none',
                            color: 'white',
                            width: '80px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(23, 162, 184, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px'
                          }}
                          onMouseOver={e => {
                            e.target.style.background = 'linear-gradient(135deg, #138496 0%, #117a8b 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.3)';
                          }}
                          onMouseOut={e => {
                            e.target.style.background = 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = '0 2px 4px rgba(23, 162, 184, 0.2)';
                          }}
                        >
                          <i className="bi bi-eye" style={{ fontSize: '11px' }}></i> View
                        </button>
                        <button
                          type="button"
                          className="btn-medical-summary"
                          onClick={() => handleMedicalSummary(patients.findIndex(p => p.id === patient.id))}
                          style={{
                            background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
                            border: 'none',
                            color: 'white',
                            width: '100px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(111, 66, 193, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px'
                          }}
                          onMouseOver={e => {
                            e.target.style.background = 'linear-gradient(135deg, #5a32a3 0%, #4c2a85 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(111, 66, 193, 0.3)';
                          }}
                          onMouseOut={e => {
                            e.target.style.background = 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = '0 2px 4px rgba(111, 66, 193, 0.2)';
                          }}
                        >
                          <i className="bi bi-file-medical" style={{ fontSize: '11px' }}></i> Summary
                        </button>
                        {/* Edit Button - Hidden for nursing_attendant role */}
                        {user?.role !== 'nursing_attendant' && (
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            setForm(patient);
                            setEditModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                            border: 'none',
                            color: 'white',
                            width: '80px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(255, 193, 7, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px'
                          }}
                          onMouseOver={e => {
                            e.target.style.background = 'linear-gradient(135deg, #e0a800 0%, #d39e00 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                          }}
                          onMouseOut={e => {
                            e.target.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = '0 2px 4px rgba(255, 193, 7, 0.2)';
                          }}
                        >
                          <i className="bi bi-pencil-square" style={{ fontSize: '11px' }}></i> Edit
                        </button>
                        )}
                        {/* Delete Button - Hidden for nursing_attendant role */}
                        {user?.role !== 'nursing_attendant' && (
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDeletePatient(patients.findIndex(p => p.id === patient.id))}
                          style={{
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            border: 'none',
                            color: 'white',
                            width: '80px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px'
                          }}
                          onMouseOver={e => {
                            e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
                          }}
                          onMouseOut={e => {
                            e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.2)';
                          }}
                        >
                          <i className="bi bi-trash" style={{ fontSize: '11px' }}></i> Delete
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
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
        </div>
      )}

      {/* Add Patient Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <i className="bi bi-person-plus" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Add Patient</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowModal(false);
                  clearErrors();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {/* Error Alert */}
              {submitError && (
                <div style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '1px solid #f87171',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <i className="bi bi-exclamation-triangle" style={{ color: '#dc2626', fontSize: '18px' }}></i>
                  <div>
                    <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '14px' }}>Error</div>
                    <div style={{ color: '#991b1b', fontSize: '13px' }}>{submitError}</div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleAddPatient}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                      placeholder="First Name"
                      name="first_name"
                      value={form.first_name || ""}
                    onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('first_name', e.target.value, 'patient')}
                    style={{
                        borderColor: errors.first_name ? '#dc2626' : form.first_name && !errors.first_name ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.first_name 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.first_name && !errors.first_name 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  />
                    {errors.first_name && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                        {errors.first_name}
                    </div>
                  )}
                    {form.first_name && !errors.first_name && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Looks good!
                    </div>
                  )}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Middle Name (Optional)"
                      name="middle_name"
                      value={form.middle_name || ""}
                      onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('middle_name', e.target.value, 'patient')}
                      style={{
                        borderColor: errors.middle_name ? '#dc2626' : form.middle_name && !errors.middle_name ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.middle_name 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.middle_name && !errors.middle_name 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    {errors.middle_name && (
                      <div style={{ 
                        color: '#dc2626', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef2f2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca'
                      }}>
                        <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                        {errors.middle_name}
                      </div>
                    )}
                    {form.middle_name && !errors.middle_name && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Looks good!
                      </div>
                    )}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Last Name"
                      name="last_name"
                      value={form.last_name || ""}
                      onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('last_name', e.target.value, 'patient')}
                      style={{
                        borderColor: errors.last_name ? '#dc2626' : form.last_name && !errors.last_name ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.last_name 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.last_name && !errors.last_name 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      required
                    />
                    {errors.last_name && (
                      <div style={{ 
                        color: '#dc2626', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef2f2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca'
                      }}>
                        <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                        {errors.last_name}
                      </div>
                    )}
                    {form.last_name && !errors.last_name && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Looks good!
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Birth Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="birth_date"
                    value={form.birth_date || ""}
                    onChange={handleFormChangeWithValidation}
                    onBlur={(e) => validateField('birth_date', e.target.value, 'patient')}
                    style={{
                      borderColor: errors.birth_date ? '#dc2626' : form.birth_date && !errors.birth_date ? '#10b981' : '#e5e7eb',
                      boxShadow: errors.birth_date 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.birth_date && !errors.birth_date 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  />
                  {errors.birth_date && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                      {errors.birth_date}
                    </div>
                  )}
                  {form.birth_date && !errors.birth_date && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Valid date!
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Sex</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleFormChangeWithValidation}
                    onBlur={(e) => validateField('gender', e.target.value, 'patient')}
                    style={{
                      borderColor: errors.gender ? '#dc2626' : form.gender && !errors.gender ? '#10b981' : '#e5e7eb',
                      boxShadow: errors.gender 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.gender && !errors.gender 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                      {errors.gender}
                    </div>
                  )}
                  {form.gender && !errors.gender && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Selected!
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contact Number"
                    name="contact_number"
                    value={form.contact_number || ""}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Address"
                    name="address"
                    value={form.address || ""}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Barangay</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Barangay"
                    name="barangay"
                    value={form.barangay || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-success" 
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting 
                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSubmitting 
                        ? '0 2px 8px rgba(156, 163, 175, 0.3)'
                        : '0 4px 15px rgba(16, 185, 129, 0.3)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }}></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i> Save
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => {
                      setShowModal(false);
                      clearErrors();
                    }}
                    style={{
                      background: '#f3f4f6',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <i className="bi bi-pencil-square" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Edit Patient</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setEditModal(false);
                  clearErrors();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {/* Error Alert */}
              {submitError && (
                <div style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '1px solid #f87171',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <i className="bi bi-exclamation-triangle" style={{ color: '#dc2626', fontSize: '18px' }}></i>
                  <div>
                    <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '14px' }}>Error</div>
                    <div style={{ color: '#991b1b', fontSize: '13px' }}>{submitError}</div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleEditPatient}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                      placeholder="First Name"
                      name="first_name"
                      value={form.first_name || ""}
                    onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('first_name', e.target.value, 'patient')}
                    style={{
                        borderColor: errors.first_name ? '#dc2626' : form.first_name && !errors.first_name ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.first_name 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.first_name && !errors.first_name 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  />
                    {errors.first_name && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                        {errors.first_name}
                    </div>
                  )}
                    {form.first_name && !errors.first_name && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Looks good!
                    </div>
                  )}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Middle Name (Optional)"
                      name="middle_name"
                      value={form.middle_name || ""}
                      onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('middle_name', e.target.value, 'patient')}
                      style={{
                        borderColor: errors.middle_name ? '#dc2626' : form.middle_name && !errors.middle_name ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.middle_name 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.middle_name && !errors.middle_name 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    {errors.middle_name && (
                      <div style={{ 
                        color: '#dc2626', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef2f2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca'
                      }}>
                        <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                        {errors.middle_name}
                      </div>
                    )}
                    {form.middle_name && !errors.middle_name && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Looks good!
                      </div>
                    )}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Last Name"
                      name="last_name"
                      value={form.last_name || ""}
                      onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('last_name', e.target.value, 'patient')}
                      style={{
                        borderColor: errors.last_name ? '#dc2626' : form.last_name && !errors.last_name ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.last_name 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.last_name && !errors.last_name 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      required
                    />
                    {errors.last_name && (
                      <div style={{ 
                        color: '#dc2626', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef2f2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca'
                      }}>
                        <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                        {errors.last_name}
                      </div>
                    )}
                    {form.last_name && !errors.last_name && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Looks good!
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Birth Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="birth_date"
                    value={form.birth_date || ""}
                    onChange={handleFormChangeWithValidation}
                    onBlur={(e) => validateField('birth_date', e.target.value, 'patient')}
                    style={{
                      borderColor: errors.birth_date ? '#dc2626' : form.birth_date && !errors.birth_date ? '#10b981' : '#e5e7eb',
                      boxShadow: errors.birth_date 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.birth_date && !errors.birth_date 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  />
                  {errors.birth_date && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                      {errors.birth_date}
                    </div>
                  )}
                  {form.birth_date && !errors.birth_date && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Valid date!
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Sex</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleFormChangeWithValidation}
                    onBlur={(e) => validateField('gender', e.target.value, 'patient')}
                    style={{
                      borderColor: errors.gender ? '#dc2626' : form.gender && !errors.gender ? '#10b981' : '#e5e7eb',
                      boxShadow: errors.gender 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.gender && !errors.gender 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                      {errors.gender}
                    </div>
                  )}
                  {form.gender && !errors.gender && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Selected!
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contact Number"
                    name="contact_number"
                    value={form.contact_number || ""}
                    onChange={handleFormChangeWithValidation}
                    onBlur={(e) => validateField('contact_number', e.target.value, 'patient')}
                    style={{
                      borderColor: errors.contact_number ? '#dc2626' : form.contact_number && !errors.contact_number ? '#10b981' : '#e5e7eb',
                      boxShadow: errors.contact_number 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.contact_number && !errors.contact_number 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  {errors.contact_number && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                      {errors.contact_number}
                    </div>
                  )}
                  {form.contact_number && !errors.contact_number && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Valid format!
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Address"
                    name="address"
                    value={form.address || ""}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Barangay</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Barangay"
                    name="barangay"
                    value={form.barangay || ""}
                    onChange={handleFormChangeWithValidation}
                    onBlur={(e) => validateField('barangay', e.target.value, 'patient')}
                    style={{
                      borderColor: errors.barangay ? '#dc2626' : form.barangay && !errors.barangay ? '#10b981' : '#e5e7eb',
                      boxShadow: errors.barangay 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.barangay && !errors.barangay 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                  />
                  {errors.barangay && (
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #fecaca'
                    }}>
                      <i className="bi bi-exclamation-circle" style={{ fontSize: '14px' }}></i>
                      {errors.barangay}
                    </div>
                  )}
                  {form.barangay && !errors.barangay && (
                    <div style={{ 
                      color: '#059669', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                      Looks good!
                    </div>
                  )}
                </div>
                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-warning" 
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting 
                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSubmitting 
                        ? '0 2px 8px rgba(156, 163, 175, 0.3)'
                        : '0 4px 15px rgba(245, 158, 11, 0.3)',
                      color: 'white',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }}></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i> Update
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => {
                      setEditModal(false);
                      clearErrors();
                    }}
                    style={{
                      background: '#f3f4f6',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {viewModal && selectedPatient && (
        <div className="modal-overlay">
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .patient-info-container {
                animation: fadeInUp 0.3s ease-out;
              }
              .info-section {
                animation: fadeInUp 0.4s ease-out;
              }
            `}
          </style>
          <div className="modal-content shadow rounded patient-info-modal" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              maxWidth: '90vw',
              width: '90vw',
              minWidth: '1000px',
              maxHeight: '85vh',
              height: 'auto'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '1rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px'
                }}>
                  <i className="bi bi-eye" style={{ fontSize: '14px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold" style={{ fontSize: '16px' }}>Patient Information</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: 'white',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2.5rem' }}>
              <div className="patient-info-container" style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}>
                {/* Patient Header Section */}
                <div style={{
                  background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                  padding: '1.5rem 2rem',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      <i className="bi bi-person-circle"></i>
                    </div>
                    <div>
                      <h3 style={{ margin: '0', fontWeight: '600', fontSize: '1.4rem' }}>{getFullName(selectedPatient)}</h3>
                      <p style={{ margin: '0.25rem 0 0', opacity: '0.9', fontSize: '0.9rem' }}>
                        Patient ID: {selectedPatient.id}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', opacity: '0.8', marginBottom: '0.25rem' }}>Last Updated</div>
                    <div style={{ fontSize: '1rem', fontWeight: '500' }}>{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Patient Details Grid */}
                <div style={{ padding: '1.5rem 2rem' }}>
                  <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                  }}>
                    {/* Personal Information */}
                    <div className="info-section">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '1rem',
                          color: 'white'
                        }}>
                          <i className="bi bi-person-badge"></i>
                        </div>
                        <h4 style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>
                          Personal Information
                        </h4>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Sex</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{selectedPatient.gender}</span>
                </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Birth Date</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(selectedPatient.birth_date)}</span>
                </div>
              </div>
            </div>

                    {/* Contact Information */}
                    <div className="info-section">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '2px solid #e5e7eb'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '1rem',
                          color: 'white'
                        }}>
                          <i className="bi bi-geo-alt"></i>
                        </div>
                        <h4 style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '1.1rem' }}>
                          Contact & Location
                        </h4>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Barangay</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{selectedPatient.barangay}</span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Contact Number</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{selectedPatient.contact_number || 'N/A'}</span>
                        </div>
                        
                        <div style={{
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Address</div>
                          <div style={{ fontWeight: '600', color: '#1f2937', lineHeight: '1.4' }}>
                            {selectedPatient.address || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer d-flex justify-content-end align-items-center" style={{ 
              borderTop: '1px solid #e5e7eb', 
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setViewModal(false)}
                  style={{
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    color: '#6b7280',
                    background: 'white'
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i> Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                onClick={() => handleViewMedicalRecords(patients.findIndex(p => p.id === selectedPatient.id))}
                style={{
                  background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                  border: 'none',
                  borderRadius: '12px',
                    padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)',
                  color: 'white'
                }}
              >
                <i className="bi bi-file-medical me-2"></i> View Medical Records
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Records Modal */}
      {viewMedicalRecords && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded medical-records-modal" style={{ 
            maxWidth: '90vw', 
            width: '90vw', 
            minWidth: '800px',
            maxHeight: '90vh',
            height: '90vh',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '1rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px'
                }}>
                  <i className="bi bi-file-medical" style={{ fontSize: '14px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold" style={{ fontSize: '16px' }}>{getFullName(selectedPatient)}'s Medical Records</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setviewMedicalRecords(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: 'white',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body medical-modal-body-gradient" style={{ 
              maxHeight: 'calc(90vh - 120px)', 
              overflowY: 'auto' 
            }}>
              <div className="d-flex justify-content-end mb-4">
                {/* Add Medical Record Button - Available for all roles including nursing_attendant */}
                <button
                  type="button"
                  className="btn btn-success btn-lg shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                  }}
                  onClick={() => setAddMedicalRecordModal(true)}
                >
                  <i className="bi bi-plus-circle-fill me-2" style={{ fontSize: '16px' }}></i> 
                  Add Medical Record
                </button>
              </div>
              <div className="d-flex" style={{minHeight: '400px'}}>
                {/* Timeline on the left */}
                <div className="timeline-list" style={{ minWidth: '200px', maxWidth: '250px' }}>
                  {records.length === 0 ? (
                    <div className="no-records">No medical records found.</div>
                  ) : (
                    <ul className="timeline">
                      {records.map((rec, idx) => (
                        <li
                          key={rec.id}
                          className={idx === selectedRecordIdx ? "active" : ""}
                          onClick={() => setSelectedRecordIdx(idx)}
                        >
                          <span className="timeline-date timeline-date-large">{rec.created_at ? formatDate(rec.created_at) : ''}</span>
                          <div className="timeline-actions">
                            {/* Edit Medical Record Button - Hidden for nursing_attendant role */}
                            {user?.role !== 'nursing_attendant' && (
                            <button
                              className="btn btn-sm btn-outline-primary me-1 timeline-edit-btn"
                              onClick={e => { e.stopPropagation(); handleEditMedicalRecordClick(idx); }}
                              title="Edit Record"
                              style={{ verticalAlign: 'middle' }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            )}
                            
                            {/* Delete Medical Record Button - Hidden for nursing_attendant role */}
                            {user?.role !== 'nursing_attendant' && (
                            <button
                              className="btn btn-sm btn-outline-danger timeline-delete-btn"
                              onClick={e => { e.stopPropagation(); handleDeleteMedicalRecord(idx); }}
                              title="Delete Record"
                              style={{ verticalAlign: 'middle' }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Details on the right */}
                <div className="timeline-details" style={{ flex: 1, padding: '2rem' }}>
                  {selectedRecord ? (
                    <div>
                      <div className="section-header mb-3">Vitals</div>
                      <div className="medical-records-grid">
                        <div className="info-item">
                          <span className="info-label">🌡️ Temperature:</span>
                           <span className="info-value highlight">
                             {selectedRecord.temperature ? `${selectedRecord.temperature}°C` : 'N/A'}
                           </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">⚖️ Weight:</span>
                           <span className="info-value">
                             {selectedRecord.weight ? `${selectedRecord.weight} kg` : 'N/A'}
                           </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🎂 Age:</span>
                           <span className="info-value">
                             {selectedRecord.age ? `${selectedRecord.age} years` : 'N/A'}
                           </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">💨 Respiratory Rate:</span>
                           <span className="info-value">
                             {selectedRecord.respiratory_rate ? `${selectedRecord.respiratory_rate} breaths/min` : 'N/A'}
                           </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">❤️ Cardiac Rate:</span>
                           <span className="info-value">
                             {selectedRecord.cardiac_rate ? `${selectedRecord.cardiac_rate} bpm` : 'N/A'}
                           </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🩸 Blood Pressure:</span>
                           <span className="info-value">
                             {selectedRecord.blood_pressure ? `${selectedRecord.blood_pressure} mmHg` : 'N/A'}
                           </span>
                        </div>
                        </div>
                      
                      <div className="section-divider"></div>
                      <div className="section-header mb-3">Patient Information</div>
                      <div className="medical-records-grid">
                        <div className="info-item full-width">
                          <span className="info-label">🏥 Chief Complaint:</span>
                          <span className="info-value">{selectedRecord.chief_complaint || 'N/A'}</span>
                        </div>
                        <div className="info-item full-width">
                          <span className="info-label">🧬 Patient History:</span>
                          <span className="info-value">{selectedRecord.patient_history || 'N/A'}</span>
                      </div>
                        <div className="info-item full-width">
                          <span className="info-label">📋 History of Present Illness:</span>
                          <span className="info-value">{selectedRecord.history_of_present_illness || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="section-divider"></div>
                      <div className="section-header mb-3">Medical Information</div>
                      <div className="medical-records-grid">
                        <div className="info-item full-width">
                          <span className="info-label">💊 Medicine Takes:</span>
                          <span className="info-value">{selectedRecord.medicine_takes || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-records">Select a record to view details.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer d-flex justify-content-end">
            </div>
          </div>
        </div>
      )}

      {/* Add Medical Record Modal */}
      {addMedicalRecordModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            maxWidth: '800px',
            width: '90vw'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <i className="bi bi-plus-circle" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Add Medical Record for {getFullName(selectedPatient)}</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAddMedicalRecordModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <form onSubmit={handleAddMedicalRecord}>
                <div className="section-header mb-2">Vitals</div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Temperature</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter temperature with measurement (e.g., 37°C)"
                      name="temperature"
                      value={recordForm.temperature || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 37°C)</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Weight</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter weight with measurement (e.g., 60 kg)"
                      name="weight"
                      value={recordForm.weight || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 60 kg)</small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Age</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter age with measurement (e.g., 25 years)"
                      name="age"
                      value={recordForm.age || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 25 years)</small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Respiratory Rate</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter respiratory rate with measurement (e.g., 18 breaths/min)"
                      name="respiratory_rate"
                      value={recordForm.respiratory_rate || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 18 breaths/min)</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cardiac Rate</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter cardiac rate with measurement (e.g., 75 bpm)"
                      name="cardiac_rate"
                      value={recordForm.cardiac_rate || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 75 bpm)</small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Blood Pressure</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter blood pressure with measurement (e.g., 120/80 mmHg)"
                      name="blood_pressure"
                      value={recordForm.blood_pressure || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 120/80 mmHg)</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Chief Complaint</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Cough, fever"
                      name="chief_complaint"
                      value={recordForm.chief_complaint || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Patient History</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter patient's medical history..."
                    name="patient_history"
                    value={recordForm.patient_history || ""}
                    onChange={handleRecordFormChange}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">History of Present Illness</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Describe the history of present illness..."
                    name="history_of_present_illness"
                    value={recordForm.history_of_present_illness || ""}
                    onChange={handleRecordFormChange}
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Medicine Takes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter prescribed medicines and dosage instructions..."
                    name="medicine_takes"
                    value={recordForm.medicine_takes || ""}
                    onChange={handleRecordFormChange}
                  ></textarea>
                  <small className="text-muted">Enter medicine names, dosages, and instructions (e.g., Paracetamol 500mg 3x daily)</small>
                </div>
                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-success" style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                    color: 'white'
                  }}>
                    <i className="bi bi-save me-2"></i> Save Record
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => setAddMedicalRecordModal(false)}
                    style={{
                      background: '#f3f4f6',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medical Record Modal */}
      {editMedicalRecordModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            maxWidth: '800px',
            width: '90vw'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #fd7e14 0%, #e55a00 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <i className="bi bi-pencil-square" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Edit Medical Record for {getFullName(selectedPatient)}</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditMedicalRecordModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <form onSubmit={handleEditMedicalRecord}>
                <div className="section-header mb-2">Vitals</div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Temperature</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter temperature with measurement (e.g., 37°C)"
                      name="temperature"
                      value={recordForm.temperature || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 37°C)</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Weight</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter weight with measurement (e.g., 60 kg)"
                      name="weight"
                      value={recordForm.weight || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 60 kg)</small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Age</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter age with measurement (e.g., 25 years)"
                      name="age"
                      value={recordForm.age || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 25 years)</small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Respiratory Rate</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter respiratory rate with measurement (e.g., 18 breaths/min)"
                      name="respiratory_rate"
                      value={recordForm.respiratory_rate || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 18 breaths/min)</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cardiac Rate</label>
                    <input
                      type="text"
                      className="form-control"
                        placeholder="Enter cardiac rate with measurement (e.g., 75 bpm)"
                      name="cardiac_rate"
                      value={recordForm.cardiac_rate || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 75 bpm)</small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Blood Pressure</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter blood pressure with measurement (e.g., 120/80 mmHg)"
                      name="blood_pressure"
                      value={recordForm.blood_pressure || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                    <small className="text-muted">Enter value with measurement (e.g., 120/80 mmHg)</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Chief Complaint</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Cough, fever"
                      name="chief_complaint"
                      value={recordForm.chief_complaint || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Patient History</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter patient's medical history..."
                    name="patient_history"
                    value={recordForm.patient_history || ""}
                    onChange={handleRecordFormChange}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">History of Present Illness</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Describe the history of present illness..."
                    name="history_of_present_illness"
                    value={recordForm.history_of_present_illness || ""}
                    onChange={handleRecordFormChange}
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Medicine Takes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter prescribed medicines and dosage instructions..."
                    name="medicine_takes"
                    value={recordForm.medicine_takes || ""}
                    onChange={handleRecordFormChange}
                  ></textarea>
                  <small className="text-muted">Enter medicine names, dosages, and instructions (e.g., Paracetamol 500mg 3x daily)</small>
                </div>
                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-warning" style={{
                    background: 'linear-gradient(135deg, #fd7e14 0%, #e55a00 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(253, 126, 20, 0.3)',
                    color: 'white'
                  }}>
                    <i className="bi bi-save me-2"></i> Update Record
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => setEditMedicalRecordModal(false)}
                    style={{
                      background: '#f3f4f6',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Medical Summary Modal */}
      {medicalSummaryModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            maxWidth: '95vw',
            width: '95vw',
            minWidth: '1200px',
            maxHeight: '90vh',
            height: 'auto'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '1rem'
            }}>
              <div className="d-flex align-items-center">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px'
                }}>
                  <i className="bi bi-file-medical" style={{ fontSize: '14px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold" style={{ fontSize: '16px' }}>Medical Summary - {getFullName(selectedPatient)}</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMedicalSummaryModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: 'white',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ 
              padding: '2rem',
              maxHeight: 'calc(90vh - 120px)',
              overflowY: 'auto'
            }}>
              {(() => {
                const summary = generateMedicalSummary(selectedPatient, medicalRecords);
                return (
                  <div>
                    {/* Patient Overview */}
                    <div className="row mb-4">
                      <div className="col-md-8">
                        <div style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <h4 style={{ color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="bi bi-person-circle" style={{ color: '#6f42c1' }}></i>
                            Patient Overview
                          </h4>
                          <div className="row">
                            <div className="col-md-6">
                              <p><strong>Name:</strong> {getFullName(selectedPatient)}</p>
                              <p><strong>Age:</strong> {(() => {
                                const birthDate = new Date(selectedPatient.birth_date);
                                const today = new Date();
                                const age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                              })()} years old</p>
                              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
                            </div>
                            <div className="col-md-6">
                              <p><strong>Total Medical Records:</strong> {summary.totalRecords}</p>
                              <p><strong>Last Visit:</strong> {summary.latestRecord ? formatDate(summary.latestRecord.created_at) : 'N/A'}</p>
                              <p><strong>Barangay:</strong> {selectedPatient.barangay}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          color: 'white',
                          textAlign: 'center'
                        }}>
                          <h5 style={{ marginBottom: '1rem' }}>Quick Stats</h5>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {summary.totalRecords}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                            Medical Records
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1rem' }}>
                            {summary.medicineHistory.length}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                            Medicine Prescriptions
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medicine History */}
                    {summary.medicineHistory.length > 0 && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <div style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #f59e0b'
                          }}>
                            <h4 style={{ color: '#92400e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-capsule" style={{ color: '#f59e0b' }}></i>
                              Medicine History
                            </h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {summary.medicineHistory.slice(0, 5).map((med, idx) => (
                                <div key={idx} style={{
                                  background: 'white',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  marginBottom: '0.5rem',
                                  border: '1px solid #f59e0b'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#92400e' }}>{med.medicine}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDate(med.date)}</span>
                                  </div>
                                  {med.assessment && (
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                      <strong>Assessment:</strong> {med.assessment}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Common Complaints & Recent Assessments */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div style={{
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          border: '1px solid #3b82f6'
                        }}>
                          <h4 style={{ color: '#1e40af', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="bi bi-exclamation-triangle" style={{ color: '#3b82f6' }}></i>
                            Common Complaints
                          </h4>
                          {summary.commonComplaints.length > 0 ? (
                            <div>
                              {summary.commonComplaints.map((complaint, idx) => (
                                <div key={idx} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.5rem',
                                  background: 'white',
                                  borderRadius: '6px',
                                  marginBottom: '0.5rem',
                                  border: '1px solid #3b82f6'
                                }}>
                                  <span style={{ fontSize: '0.9rem' }}>{complaint.complaint}</span>
                                  <span style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                  }}>
                                    {complaint.count}x
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No complaints recorded</p>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div style={{
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          border: '1px solid #22c55e'
                        }}>
                          <h4 style={{ color: '#15803d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="bi bi-clipboard-check" style={{ color: '#22c55e' }}></i>
                            Recent Assessments
                          </h4>
                          {summary.recentAssessments.length > 0 ? (
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {summary.recentAssessments.map((assessment, idx) => (
                                <div key={idx} style={{
                                  background: 'white',
                                  borderRadius: '6px',
                                  padding: '0.75rem',
                                  marginBottom: '0.5rem',
                                  border: '1px solid #22c55e',
                                  fontSize: '0.9rem'
                                }}>
                                  {assessment}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No assessments recorded</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Latest Medical Record */}
                    {summary.latestRecord && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <div style={{
                            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #8b5cf6'
                          }}>
                            <h4 style={{ color: '#6b21a8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-file-medical" style={{ color: '#8b5cf6' }}></i>
                              Latest Medical Record
                            </h4>
                            <div className="row">
                              <div className="col-md-6">
                                <p><strong>Date:</strong> {formatDate(summary.latestRecord.created_at)}</p>
                                <p><strong>Chief Complaint:</strong> {summary.latestRecord.chief_complaint || 'N/A'}</p>
                                <p><strong>Assessment:</strong> {summary.latestRecord.assessment || 'N/A'}</p>
                              </div>
                              <div className="col-md-6">
                                <p><strong>Temperature:</strong> {summary.latestRecord.temperature || 'N/A'}</p>
                                <p><strong>Blood Pressure:</strong> {summary.latestRecord.blood_pressure || 'N/A'}</p>
                                <p><strong>Weight:</strong> {summary.latestRecord.weight || 'N/A'}</p>
                              </div>
                            </div>
                            {summary.latestRecord.medicine_takes && (
                              <div style={{ marginTop: '1rem' }}>
                                <strong>Prescribed Medicine:</strong>
                                <div style={{
                                  background: 'white',
                                  borderRadius: '6px',
                                  padding: '0.75rem',
                                  marginTop: '0.5rem',
                                  border: '1px solid #8b5cf6'
                                }}>
                                  {summary.latestRecord.medicine_takes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Medical Timeline */}
                    {summary.timeline.length > 0 && (
                      <div className="row">
                        <div className="col-12">
                          <div style={{
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #ef4444'
                          }}>
                            <h4 style={{ color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-clock-history" style={{ color: '#ef4444' }}></i>
                              Medical Timeline
                            </h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              {summary.timeline.slice(0, 10).map((item, idx) => (
                                <div key={idx} style={{
                                  display: 'flex',
                                  alignItems: 'start',
                                  padding: '1rem',
                                  background: 'white',
                                  borderRadius: '8px',
                                  marginBottom: '0.5rem',
                                  border: '1px solid #ef4444'
                                }}>
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    background: '#ef4444',
                                    borderRadius: '50%',
                                    marginRight: '1rem',
                                    marginTop: '0.25rem',
                                    flexShrink: 0
                                  }}></div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                      <strong style={{ color: '#dc2626' }}>{item.title}</strong>
                                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDate(item.date)}</span>
                                    </div>
                                    {item.details.assessment && (
                                      <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                        <strong>Assessment:</strong> {item.details.assessment}
                                      </p>
                                    )}
                                    {item.details.medicine && (
                                      <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                        <strong>Medicine:</strong> {item.details.medicine}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer d-flex justify-content-end" style={{ 
              borderTop: '1px solid #e5e7eb', 
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}>
              <button
                type="button"
                className="btn btn-outline-secondary me-3"
                onClick={() => setMedicalSummaryModal(false)}
                style={{
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  color: '#6b7280',
                  background: 'white'
                }}
              >
                <i className="bi bi-x-circle me-2"></i> Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setMedicalSummaryModal(false);
                  handleViewMedicalRecords(patients.findIndex(p => p.id === selectedPatient.id));
                }}
                style={{
                  background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(111, 66, 193, 0.3)',
                  color: 'white'
                }}
              >
                <i className="bi bi-file-medical me-2"></i> View Full Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
