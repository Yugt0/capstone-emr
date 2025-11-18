import "../styles/PatientList.css";
import "../styles/Modal.css";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from '../services/api';
import ModalPortal from '../components/ModalPortal';
export default function DoctorPatientList() {
  // Force refresh timestamp: ${new Date().toISOString()}
  const { user, getToken, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  


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

  // Get individual name fields from patient data
  const getFullName = (patient) => {
    if (!patient) return '';
    const parts = [];
    if (patient.first_name) parts.push(patient.first_name);
    if (patient.middle_name) parts.push(patient.middle_name);
    if (patient.last_name) parts.push(patient.last_name);
    return parts.join(' ');
  };

  const getFirstName = (patient) => {
    return patient?.first_name || '';
  };

  const getMiddleName = (patient) => {
    return patient?.middle_name || '';
  };

  const getLastName = (patient) => {
    return patient?.last_name || '';
  };

  // Calculate patient age from birth date
  const calculatePatientAge = (birthDate) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(formData.contact_number.trim())) {
        newErrors.contact_number = 'Please enter only numbers';
      } else if (formData.contact_number.trim().length > 10) {
        newErrors.contact_number = 'Contact number cannot exceed 10 digits (excluding +63)';
      } else if (formData.contact_number.trim().length < 10) {
        newErrors.contact_number = 'Contact number must be exactly 10 digits';
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
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [addMedicalRecordModal, setAddMedicalRecordModal] = useState(false);
  const [addAssessmentModal, setAddAssessmentModal] = useState(false);
  const [addPlanModal, setAddPlanModal] = useState(false);
  const [addMedicationModal, setAddMedicationModal] = useState(false);
  const [isLoadingMedicalRecords, setIsLoadingMedicalRecords] = useState(false);
  const [medicalSummaryModal, setMedicalSummaryModal] = useState(false);
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(null);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(0);
  const [form, setForm] = useState({});
  const [recordForm, setRecordForm] = useState({});
  const [assessmentForm, setAssessmentForm] = useState({});
  const [planForm, setPlanForm] = useState({});
  const [medicationForm, setMedicationForm] = useState({});
  const [availableMedicalRecords, setAvailableMedicalRecords] = useState([]);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recentMedications, setRecentMedications] = useState([]);
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);
  const [isLoadingMedications, setIsLoadingMedications] = useState(false);
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

  // Archive functionality states
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchivingPatientId, setUnarchivingPatientId] = useState(null);

  // Archived patients search and filter states
  const [archivedSearchTerm, setArchivedSearchTerm] = useState('');
  const [archivedGenderFilter, setArchivedGenderFilter] = useState('');
  const [archivedAgeFilter, setArchivedAgeFilter] = useState('');
  const [archivedDateFilter, setArchivedDateFilter] = useState('');

  // Fetch patients and their medical records
  useEffect(() => {
    fetchPatients();
    // Don't fetch medications on mount - only fetch when modal opens
  }, []);

  // Fetch all recent medications from all patients (optimized)
  const fetchRecentMedications = async (forceRefresh = false) => {
    // Don't refetch if we already have medications and not forcing refresh
    if (!forceRefresh && recentMedications.length > 0) {
      return;
    }
    
    // Prevent multiple simultaneous fetches
    if (isLoadingMedications) {
      return;
    }
    
    setIsLoadingMedications(true);
    try {
      const allRecords = await api.getMedicalRecords();
      
      // Use Map to track medication -> latest date in one pass (much faster)
      const medicationMap = new Map();
      
      // Single pass through records to extract medications and track latest dates
      allRecords.forEach(record => {
        if (record.medicine_takes && record.medicine_takes.trim() !== '') {
          const recordDate = new Date(record.created_at);
          // Split by newlines or semicolons to get individual medications
          const meds = record.medicine_takes
            .split(/[\n;]/)
            .map(med => med.trim())
            .filter(med => med.length > 0);
          
          meds.forEach(med => {
            if (med.length > 0) {
              // Update map with latest date for this medication
              const existing = medicationMap.get(med);
              if (!existing || recordDate > existing.date) {
                medicationMap.set(med, { medication: med, date: recordDate });
              }
            }
          });
        }
      });
      
      // Convert to array and sort by date (most recent first), limit to 50
      const sortedMedications = Array.from(medicationMap.values())
        .sort((a, b) => b.date - a.date)
        .slice(0, 50)
        .map(item => item.medication);
      
      setRecentMedications(sortedMedications);
    } catch (error) {
      console.error('Error fetching recent medications:', error);
      setRecentMedications([]);
    } finally {
      setIsLoadingMedications(false);
    }
  };

  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

  // Handle patientId query parameter from MissingDataPage
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && patients.length > 0) {
      const patientIndex = patients.findIndex(p => p.id === parseInt(patientId));
      if (patientIndex !== -1) {
        // Open medical records modal for this patient
        setSelectedPatientIdx(patientIndex);
        setviewMedicalRecords(true);
        fetchMedicalRecords(parseInt(patientId));
        setSelectedRecordIdx(0);
        // Clear the query parameter
        setSearchParams({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients, searchParams]);

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
        const nameMatch = fullName.toLowerCase().includes(searchName.toLowerCase());
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
      const data = await api.getPatientInformation();
      console.log("Fetched patients data:", data);
      setPatients(data);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      alert("Failed to fetch patients");
    }
    setLoading(false);
  };

  const fetchMedicalRecords = async (patientId) => {
    try {
      const recData = await api.getMedicalRecordsByPatient(patientId);
      setMedicalRecords(recData);
      setAvailableMedicalRecords(recData);
    } catch (err) {
      setMedicalRecords([]);
      setAvailableMedicalRecords([]);
      alert("Failed to fetch medical records");
    }
  };

  // Lazy load medical records when modal opens
  const handleModalOpen = async (modalType, patientId) => {
    setIsLoadingMedicalRecords(true);
    try {
      // Always fetch medical records first (required for modal)
      await fetchMedicalRecords(patientId);
      
      // Open modal immediately - don't wait for medications
      switch(modalType) {
        case 'assessment':
          setAddAssessmentModal(true);
          break;
        case 'plan':
          setAddPlanModal(true);
          break;
        case 'medication':
          setAddMedicationModal(true);
          // Fetch medications in background (non-blocking, uses cache if available)
          fetchRecentMedications().catch(err => {
            console.error('Error loading medications in background:', err);
          });
          break;
      }
    } catch (err) {
      console.error('Error loading medical records:', err);
      alert("Failed to load medical records");
    } finally {
      setIsLoadingMedicalRecords(false);
    }
  };


  // Note: Edit and Delete patient functionality removed for simplified interface

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
      await api.createMedicalRecord(payload);
      
      setAddMedicalRecordModal(false);
      setRecordForm({});
      clearErrors();
      fetchMedicalRecords(patient.id);
      showToast('Medical record added successfully!', 'success');
    } catch (err) {
      console.error('Add medical record error:', err);
      setSubmitError(err.message || "Failed to add medical record. Please try again.");
      showToast(`Failed to add medical record: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Assessment
  const handleAddAssessment = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    const patient = patients[selectedPatientIdx];
    if (!patient) {
      setSubmitError("No patient selected");
      setIsSubmitting(false);
      return;
    }

    if (!selectedMedicalRecordId) {
      setSubmitError("Please select a medical record to add assessment to");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      assessment: assessmentForm.assessment || ''
    };
    
    try {
      await api.updateMedicalRecord(selectedMedicalRecordId, payload);
      
      setAddAssessmentModal(false);
      setAssessmentForm({});
      setSelectedMedicalRecordId(null);
      clearErrors();
      fetchMedicalRecords(patient.id);
      showToast('Assessment added successfully!', 'success');
    } catch (err) {
      console.error('Add assessment error:', err);
      setSubmitError(err.message || "Failed to add assessment. Please try again.");
      showToast(`Failed to add assessment: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    const patient = patients[selectedPatientIdx];
    if (!patient) {
      setSubmitError("No patient selected");
      setIsSubmitting(false);
      return;
    }

    if (!selectedMedicalRecordId) {
      setSubmitError("Please select a medical record to add treatment plan to");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      plan: planForm.plan || ''
    };
    
    try {
      await api.updateMedicalRecord(selectedMedicalRecordId, payload);
      
      setAddPlanModal(false);
      setPlanForm({});
      setSelectedMedicalRecordId(null);
      clearErrors();
      fetchMedicalRecords(patient.id);
      showToast('Treatment plan added successfully!', 'success');
    } catch (err) {
      console.error('Add plan error:', err);
      setSubmitError(err.message || "Failed to add treatment plan. Please try again.");
      showToast(`Failed to add treatment plan: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Medication
  const handleAddMedication = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    const patient = patients[selectedPatientIdx];
    if (!patient) {
      setSubmitError("No patient selected");
      setIsSubmitting(false);
      return;
    }

    if (!selectedMedicalRecordId) {
      setSubmitError("Please select a medical record to add medication to");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      medicine_takes: medicationForm.medication || ''
    };
    
    try {
      await api.updateMedicalRecord(selectedMedicalRecordId, payload);
      
      setAddMedicationModal(false);
      setMedicationForm({});
      setSelectedMedicalRecordId(null);
      clearErrors();
      fetchMedicalRecords(patient.id);
      showToast('Medication added successfully!', 'success');
    } catch (error) {
      console.error('Error adding medication:', error);
      setSubmitError(error.message || 'Failed to add medication');
      showToast(`Failed to add medication: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Note: Edit and Delete medical record functionality removed for simplified interface

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

  const handleAssessmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssessmentForm({ ...assessmentForm, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePlanFormChange = (e) => {
    const { name, value } = e.target;
    setPlanForm({ ...planForm, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMedicationFormChange = (e) => {
    const { name, value } = e.target;
    setMedicationForm({ ...medicationForm, [name]: value });
    
    // Filter suggestions based on input
    if (name === 'medication' && value.trim().length > 0) {
      const filtered = recentMedications.filter(med =>
        med.toLowerCase().includes(value.toLowerCase())
      );
      setMedicationSuggestions(filtered.slice(0, 10)); // Show top 10 matches
      setShowMedicationSuggestions(true);
    } else if (name === 'medication' && value.trim().length === 0) {
      setMedicationSuggestions([]);
      setShowMedicationSuggestions(false);
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMedicationSuggestionClick = (suggestion) => {
    setMedicationForm({ ...medicationForm, medication: suggestion });
    setShowMedicationSuggestions(false);
    setMedicationSuggestions([]);
  };

  const handleMedicalRecordSelection = (e) => {
    setSelectedMedicalRecordId(e.target.value);
  };

  const resetAssessmentForm = () => {
    setAssessmentForm({});
    setSelectedMedicalRecordId(null);
    setAvailableMedicalRecords([]);
  };

  const resetPlanForm = () => {
    setPlanForm({});
    setSelectedMedicalRecordId(null);
    setAvailableMedicalRecords([]);
  };

  const resetMedicationForm = () => {
    setMedicationForm({});
    setSelectedMedicalRecordId(null);
    setAvailableMedicalRecords([]);
    setShowMedicationSuggestions(false);
    setMedicationSuggestions([]);
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
            const phoneRegex = /^[0-9]+$/;
            if (!phoneRegex.test(value.trim())) {
              newErrors.contact_number = 'Please enter only numbers';
            } else if (value.trim().length > 10) {
              newErrors.contact_number = 'Contact number cannot exceed 10 digits (excluding +63)';
            } else if (value.trim().length < 10) {
              newErrors.contact_number = 'Contact number must be exactly 10 digits';
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

  // Archive functionality
  const handleArchivePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to archive this patient? This will hide them from the main list but keep their data in the database.')) {
      return;
    }

    setIsArchiving(true);
    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/patient-information/${patientId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Patient archived successfully', 'success');
        // Refresh the patient list
        fetchPatients();
      } else {
        const errorData = await response.json();
        showToast(`Failed to archive patient: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error archiving patient:', error);
      showToast('Failed to archive patient. Please try again.', 'error');
    }
    setIsArchiving(false);
  };

  const fetchArchivedPatients = async () => {
    try {
      const token = getToken();
      console.log('Fetching archived patients with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('http://127.0.0.1:8000/api/patient-information/archived', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Archived patients response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Archived patients data:', data);
        setArchivedPatients(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch archived patients:', response.status, errorText);
        showToast(`Failed to fetch archived patients: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching archived patients:', error);
      showToast('Failed to fetch archived patients. Please try again.', 'error');
    }
  };

  const handleUnarchivePatient = async (patientId, patientName) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to restore "${patientName}"? This will move the patient back to the active patient list.`)) {
      return;
    }

    setIsUnarchiving(true);
    setUnarchivingPatientId(patientId);
    
    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/patient-information/${patientId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Patient restored successfully', 'success');
        // Refresh both lists
        fetchPatients();
        fetchArchivedPatients();
      } else {
        const errorData = await response.json();
        showToast(`Failed to restore patient: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error restoring patient:', error);
      showToast('Failed to restore patient. Please try again.', 'error');
    } finally {
      setIsUnarchiving(false);
      setUnarchivingPatientId(null);
    }
  };

  const handleShowArchivedModal = () => {
    fetchArchivedPatients();
    setShowArchivedModal(true);
  };

  // Filter archived patients based on search and filter criteria
  const getFilteredArchivedPatients = () => {
    return archivedPatients.filter(patient => {
      // Search term filter (name, ID, contact)
      const searchMatch = archivedSearchTerm === '' || 
        getFullName(patient).toLowerCase().includes(archivedSearchTerm.toLowerCase()) ||
        patient.id.toString().includes(archivedSearchTerm) ||
        (patient.contact_number && patient.contact_number.includes(archivedSearchTerm));

      // Gender filter
      const genderMatch = archivedGenderFilter === '' || 
        patient.gender?.toLowerCase() === archivedGenderFilter.toLowerCase();

      // Age filter
      const ageMatch = archivedAgeFilter === '' || (() => {
        const birthDate = new Date(patient.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 : age;
        
        switch(archivedAgeFilter) {
          case '0-17': return actualAge >= 0 && actualAge <= 17;
          case '18-30': return actualAge >= 18 && actualAge <= 30;
          case '31-50': return actualAge >= 31 && actualAge <= 50;
          case '51-65': return actualAge >= 51 && actualAge <= 65;
          case '65+': return actualAge > 65;
          default: return true;
        }
      })();

      // Date filter (archived date)
      const dateMatch = archivedDateFilter === '' || (() => {
        if (!patient.archived_at) return false;
        const archivedDate = new Date(patient.archived_at);
        const filterDate = new Date(archivedDateFilter);
        const today = new Date();
        
        switch(archivedDateFilter) {
          case 'today': 
            return archivedDate.toDateString() === today.toDateString();
          case 'week': 
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return archivedDate >= weekAgo;
          case 'month': 
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return archivedDate >= monthAgo;
          default: 
            return archivedDate.toDateString() === filterDate.toDateString();
        }
      })();

      return searchMatch && genderMatch && ageMatch && dateMatch;
    });
  };

  // Clear archived filters
  const clearArchivedFilters = () => {
    setArchivedSearchTerm('');
    setArchivedGenderFilter('');
    setArchivedAgeFilter('');
    setArchivedDateFilter('');
  };

  // PDF Generation Function
  const generatePatientPDF = async (patient) => {
    try {
      // Simple check for jsPDF
      if (typeof window.jsPDF === 'undefined') {
        showToast('PDF library not loaded. Please refresh the page and try again.', 'error');
        return;
      }

      showToast('Generating PDF...', 'info');
      
      // Fetch medical records for the patient
      const medicalRecords = await fetchMedicalRecordsForPDF(patient.id);
      
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Patient Medical Record', 20, 20);
      
      // Add patient information
      doc.setFontSize(12);
      doc.text(`Patient Name: ${getFullName(patient)}`, 20, 40);
      doc.text(`Age: ${calculatePatientAge(patient.birth_date)} years`, 20, 50);
      doc.text(`Gender: ${patient.gender || 'Not specified'}`, 20, 60);
      doc.text(`Contact: ${patient.contact_number || 'Not specified'}`, 20, 70);
      
      // Add medical records
      let yPosition = 90;
      doc.setFontSize(14);
      doc.text('Medical Records:', 20, yPosition);
      yPosition += 10;
      
      if (medicalRecords && medicalRecords.length > 0) {
        medicalRecords.forEach((record, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.text(`Record ${index + 1} - ${formatDate(record.created_at)}`, 20, yPosition);
          yPosition += 10;
          
          const recordDetails = [
            { label: 'Date', value: formatDate(record.created_at) },
            { label: 'Chief Complaint', value: record.chief_complaint || 'Not specified' },
            { label: 'Assessment', value: record.assessment || 'Not specified' },
            { label: 'Plan', value: record.plan || 'Not specified' },
            { label: 'Medicine', value: record.medicine_takes || 'Not specified' },
            { label: 'Patient History', value: record.patient_history || 'No additional notes' }
          ];
          
          recordDetails.forEach((detail, detailIndex) => {
            const detailY = yPosition + (detailIndex * 6);
            if (detailY > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFontSize(10);
            doc.text(`${detail.label}: ${detail.value}`, 25, yPosition + (detailIndex * 6));
          });
          
          yPosition += (recordDetails.length * 6) + 10;
        });
      } else {
        doc.setFontSize(10);
        doc.text('No medical records found for this patient.', 20, yPosition);
      }
      
      // Save the PDF
      const patientName = `${getFirstName(patient)}_${getLastName(patient)}`.replace(/\s+/g, '_');
      const filename = `Patient_Record_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      showToast('PDF generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error generating PDF. Please try again.', 'error');
    }
  };

  // Fetch medical records for PDF generation
  const fetchMedicalRecordsForPDF = async (patientId) => {
    try {
      console.log('Fetching medical records for patient ID:', patientId);
      // Use the same API method as the existing fetchMedicalRecords function
      const recData = await api.getMedicalRecordsByPatient(patientId);
      console.log('API response for medical records:', recData);
      console.log('Medical records data:', recData);
      return recData || [];
    } catch (error) {
      console.error('Error fetching medical records for PDF:', error);
      console.error('Error details:', error.response?.data || error.message);
      return [];
    }
  };

  // GUARANTEED WORKING PDF generation - uses browser's native print to PDF
  const generatePatientPDFDownload = async (patient) => {
    try {
      // Show confirmation dialog before printing
      const patientDisplayName = `${getFirstName(patient)} ${getLastName(patient)}`;
      const confirmed = window.confirm(
        `Are you sure you want to print the medical record for ${patientDisplayName}?\n\n` +
        `This will open a print dialog where you can save as PDF or print to paper.`
      );
      
      if (!confirmed) {
        return; // User cancelled
      }
      
      showToast('Preparing patient record for printing...', 'info');
      
      // Fetch medical records
      console.log('Patient ID for PDF:', patient.id);
      const medicalRecords = await fetchMedicalRecordsForPDF(patient.id);
      console.log('Medical records for PDF:', medicalRecords);
      console.log('Number of medical records:', medicalRecords ? medicalRecords.length : 0);
      
      // Ensure medicalRecords is an array
      const records = Array.isArray(medicalRecords) ? medicalRecords : [];
      console.log('Processed records array:', records);
      
      // Debug: Check if medical records have the expected structure
      if (records && records.length > 0) {
        console.log('First medical record structure:', records[0]);
        console.log('Available fields in first record:', Object.keys(records[0]));
      } else {
        console.log('⚠️ No medical records found for patient ID:', patient.id);
        console.log('This could mean:');
        console.log('1. Patient has no medical records');
        console.log('2. API call failed');
        console.log('3. Data structure is different than expected');
      }
      
      // Create a simple, guaranteed-to-work HTML content
      const patientName = `${getFirstName(patient)} ${getMiddleName(patient)} ${getLastName(patient)}`.trim();
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Patient Medical Record - ${patientName}</title>
          <style>
            @page {
              margin: 0.3in;
              size: letter;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              line-height: 1.2;
              color: black;
              background: white;
              margin: 0;
              padding: 0;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 8px;
              text-align: center;
              margin-bottom: 8px;
            }
            .clinic-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .document-title {
              font-size: 12px;
              margin-top: 2px;
            }
            .section {
              margin-bottom: 12px;
              page-break-inside: avoid;
            }
            .section-title {
              color: #3b82f6;
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 4px;
              border-bottom: 1px solid #3b82f6;
              padding-bottom: 2px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 9px;
            }
            .info-table td {
              padding: 3px;
              border: 1px solid #ccc;
              vertical-align: top;
            }
            .info-label {
              background-color: #f5f5f5;
              font-weight: bold;
              width: 20%;
            }
            .record {
              border: 1px solid #ccc;
              margin-bottom: 8px;
              background-color: #fafafa;
              page-break-inside: avoid;
            }
            .record-header {
              background-color: #e9ecef;
              padding: 4px 6px;
              border-bottom: 1px solid #ccc;
            }
            .record-number {
              font-weight: bold;
              color: #3b82f6;
              font-size: 10px;
            }
            .record-date {
              color: #666;
              font-size: 8px;
            }
            .record-content {
              padding: 6px;
            }
            .vitals-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
              font-size: 8px;
            }
            .vitals-table td {
              padding: 2px;
              border: 1px solid #ccc;
            }
            .vital-label {
              background-color: #e3f2fd;
              font-weight: bold;
            }
            .medical-detail {
              margin-bottom: 4px;
            }
            .detail-label {
              font-weight: bold;
              color: #333;
              font-size: 9px;
              margin-bottom: 1px;
            }
            .detail-value {
              color: #000;
              font-size: 9px;
              background-color: white;
              padding: 3px;
              border: 1px solid #ccc;
              margin-bottom: 2px;
            }
            .footer {
              margin-top: 10px;
              padding: 6px;
              background-color: #f8f9fa;
              border-top: 1px solid #ccc;
              font-size: 8px;
              text-align: center;
            }
            .compact-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
              margin-bottom: 6px;
            }
            .compact-detail {
              font-size: 8px;
              padding: 2px;
              border: 1px solid #ddd;
              background: white;
            }
            .compact-label {
              font-weight: bold;
              color: #333;
              font-size: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <img src="images/City Health Office Logo.jpg" alt="City Health Office Logo" style="height: 60px; width: 60px; margin-right: 15px; border-radius: 50%;" />
              <div>
                <div class="clinic-name">CITY HEALTH OFFICE-I</div>
                <div style="font-size: 10px; margin-top: 2px;">CITY OF CABUYAO</div>
              </div>
            </div>
            <div class="document-title">PATIENT MEDICAL RECORD</div>
          </div>
          
          <div class="section">
            <div class="section-title">PATIENT INFORMATION</div>
            <table class="info-table">
              <tr>
                <td class="info-label">Name:</td>
                <td>${patientName}</td>
                <td class="info-label">Gender:</td>
                <td>${patient.gender || 'Not specified'}</td>
                <td class="info-label">ID:</td>
                <td>#${patient.id || 'N/A'}</td>
              </tr>
              <tr>
                <td class="info-label">Birth Date:</td>
                <td>${formatDate(patient.birth_date)}</td>
                <td class="info-label">Age:</td>
                <td>${calculatePatientAge(patient.birth_date)} years</td>
                <td class="info-label">Contact:</td>
                <td>${patient.contact_number || 'Not specified'}</td>
              </tr>
              <tr>
                <td class="info-label">Address:</td>
                <td colspan="3">${patient.address || 'Not specified'}</td>
                <td class="info-label">Barangay:</td>
                <td>${patient.barangay || 'Not specified'}</td>
              </tr>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">MEDICAL RECORDS (${records ? records.length : 0} records)</div>
            ${records && records.length > 0 ? 
              records.map((record, index) => {
                console.log(`Processing medical record ${index + 1}:`, record);
                return `
                <div class="record">
                  <div class="record-header">
                    <span class="record-number">Record #${index + 1}</span>
                    <span class="record-date">${formatDate(record.created_at)} ${new Date(record.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div class="record-content">
                    <table class="vitals-table">
                      <tr>
                        <td class="vital-label">Temp</td>
                        <td>${record.temperature || 'N/A'}</td>
                        <td class="vital-label">Weight</td>
                        <td>${record.weight || 'N/A'}</td>
                        <td class="vital-label">BP</td>
                        <td>${record.blood_pressure || 'N/A'}</td>
                        <td class="vital-label">RR</td>
                        <td>${record.respiratory_rate || 'N/A'}</td>
                        <td class="vital-label">HR</td>
                        <td>${record.cardiac_rate || 'N/A'}</td>
                        <td class="vital-label">Age</td>
                        <td>${record.age || 'N/A'}</td>
                      </tr>
                    </table>
                    
                    <div class="compact-grid">
                      <div class="compact-detail">
                        <div class="compact-label">Chief Complaint:</div>
                        ${record.chief_complaint || 'Not specified'}
                      </div>
                      ${record.assessment ? `
                        <div class="compact-detail">
                          <div class="compact-label">Assessment:</div>
                          ${record.assessment}
                        </div>
                      ` : ''}
                    </div>
                    
                    <div class="compact-grid">
                      ${record.plan ? `
                        <div class="compact-detail">
                          <div class="compact-label">Treatment Plan:</div>
                          ${record.plan}
                        </div>
                      ` : ''}
                      ${record.medicine_takes ? `
                        <div class="compact-detail">
                          <div class="compact-label">Medicine:</div>
                          ${record.medicine_takes}
                        </div>
                      ` : ''}
                    </div>
                    
                    ${record.patient_history ? `
                      <div class="medical-detail">
                        <div class="detail-label">Patient History:</div>
                        <div class="detail-value">${record.patient_history}</div>
                      </div>
                    ` : ''}
                    
                    ${record.history_of_present_illness ? `
                      <div class="medical-detail">
                        <div class="detail-label">History of Present Illness:</div>
                        <div class="detail-value">${record.history_of_present_illness}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
              }).join('') : 
              '<div class="record"><div class="record-content"><div class="detail-value">No medical records found for this patient.</div></div></div>'
            }
          </div>
          
          <div class="footer">
            <div>Medical Records System - Generated by: ${user?.name || 'System Administrator'} on ${currentDate} at ${currentTime}</div>
            <div>Total Records: ${records ? records.length : 0} | Patient ID: #${patient.id || 'N/A'}</div>
          </div>
        </body>
        </html>
      `;
      
      // Debug: Log the HTML content to see if medical records are included
      console.log('Generated HTML content length:', htmlContent.length);
      console.log('HTML content preview (first 1000 chars):', htmlContent.substring(0, 1000));
      
      // Check if medical records section is in the HTML
      if (htmlContent.includes('MEDICAL RECORDS')) {
        console.log('✅ Medical records section found in HTML');
      } else {
        console.log('❌ Medical records section NOT found in HTML');
      }
      
      // Create a new window with the content
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups for this site.');
      }
      
      // Write the content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Show success message
        showToast('Print dialog opened! You can save as PDF or print to paper.', 'success');
        
        // Close the window after a delay (optional)
        setTimeout(() => {
          printWindow.close();
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error generating patient record. Please try again.', 'error');
    }
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
          
          /* Force table header styling */
          .patient-list-container .table thead {
            background: #2563eb !important;
          }
          
          .patient-list-container .table thead tr {
            background: #2563eb !important;
          }
          
          .patient-list-container .table thead th {
            background: #2563eb !important;
            color: white !important;
            font-weight: 600 !important;
            padding: 1rem 0.75rem !important;
            border: none !important;
            font-size: 0.8rem !important;
          }
          
          .patient-list-container .table thead th i {
            color: white !important;
          }
          
          .patient-table-container .table thead {
            background: #2563eb !important;
          }
          
          .patient-table-container .table thead tr {
            background: #2563eb !important;
          }
          
          .patient-table-container .table thead th {
            background: #2563eb !important;
            color: white !important;
            font-weight: 600 !important;
            padding: 1rem 0.75rem !important;
            border: none !important;
            font-size: 0.8rem !important;
          }
          
          .patient-table-container .table thead th i {
            color: white !important;
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
            height: 6px;
            width: 6px;
          }
          
          .patient-list ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          
          .patient-list ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 3px;
            transition: all 0.2s ease;
          }
          
          .patient-list ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
          
          /* Layout Fixes */
          .main-content {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            overflow: visible;
            position: relative;
            width: 100%;
            max-width: 100%;
          }
          
          .content-wrapper {
            flex: 1;
            overflow-y: visible;
            overflow-x: hidden;
            padding: 0;
            margin: 0;
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 100%;
          }
          
          /* Header positioning fix */
          .main-content > header {
            position: sticky;
            top: 0;
            z-index: 1000;
            margin: 0;
            padding: 0;
          }
          
          /* Ensure header keeps its original styling */
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: #ffffff !important;
            padding: 1.25rem 2rem !important;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2) !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          
          /* Modal fixes handled globally in App.css */
          
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
          
          .search-container {
            gap: 0.75rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .search-input, .date-input {
            background: #f8fafc !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.875rem !important;
            transition: all 0.2s ease !important;
          }
          
          .search-input:focus, .date-input:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          }
          
          .btn-search {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            color: white !important;
            transition: all 0.2s ease !important;
          }
          
          .btn-search:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
          }
          
          .btn-add-patient {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 0.75rem 1.25rem !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            color: white !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3) !important;
          }
          
          .btn-add-patient:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4) !important;
          }
          
          .table {
            background: white !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
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
          
          /* Patient Table Cell Designs */
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
          
          .table-wrapper {
            overflow-x: auto;
            max-width: 100%;
            width: 100%;
          }
          
          .patient-name-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
          }
          
          .patient-avatar-small {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.875rem;
            flex-shrink: 0;
          }
          
          .patient-name-info {
            flex: 1;
            min-width: 0;
          }
          
          .patient-full-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.125rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .patient-id {
            font-size: 0.65rem;
            color: #64748b;
            font-weight: 500;
          }
          
          .date-age-cell {
            text-align: center;
          }
          
          .birth-date {
            font-size: 0.75rem;
            color: #1e293b;
            font-weight: 500;
            margin-bottom: 0.25rem;
          }
          
          .age-badge {
            background: #f1f5f9;
            color: #64748b;
            padding: 0.125rem 0.375rem;
            border-radius: 8px;
            font-size: 0.65rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
          }
          
          .location-cell {
            text-align: left;
          }
          
          .address-text {
            font-size: 0.75rem;
            color: #1e293b;
            font-weight: 500;
            margin-bottom: 0.125rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
          }
          
          .barangay-text {
            font-size: 0.65rem;
            color: #64748b;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .contact-cell {
            font-size: 0.75rem;
            color: #1e293b;
            font-weight: 500;
            text-align: center;
          }
          
          /* Simple Table Cell Styles */
          .name-cell {
            font-size: 0.875rem;
            color: #1e293b;
            font-weight: 500;
            padding: 0.75rem 0.5rem;
          }
          
          .gender-cell {
            text-align: center;
            padding: 0.75rem 0.5rem;
          }
          
          .simple-badge {
            background: #f1f5f9;
            color: #475569;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
            display: inline-block;
          }
          
          .date-cell {
            text-align: center;
            padding: 0.75rem 0.5rem;
          }
          
          .birth-date {
            font-size: 0.75rem;
            color: #1e293b;
            font-weight: 500;
            margin-bottom: 0.25rem;
          }
          
          .age-info {
            background: #f8fafc;
            color: #64748b;
            padding: 0.125rem 0.375rem;
            border-radius: 6px;
            font-size: 0.65rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
          }
          
          .location-cell {
            padding: 0.75rem 0.5rem;
          }
          
          .address-text {
            font-size: 0.75rem;
            color: #1e293b;
            font-weight: 500;
            margin-bottom: 0.125rem;
          }
          
          .barangay-text {
            font-size: 0.65rem;
            color: #64748b;
            font-weight: 500;
          }
          
          .contact-cell {
            font-size: 0.75rem;
            color: #1e293b;
            font-weight: 500;
            text-align: center;
            padding: 0.75rem 0.5rem;
          }
          
          /* Simple Action Buttons */
          .simple-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            align-items: center;
            padding: 0.75rem 0.5rem;
            flex-wrap: wrap;
          }
          
          .simple-btn {
            background: #3b82f6;
            border: 1px solid #2563eb;
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
            min-width: 140px;
            white-space: nowrap;
          }
          
          .simple-btn:hover {
            background: #2563eb;
            border-color: #1d4ed8;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
          }
          
          .view-btn {
            background: #10b981;
            border-color: #059669;
            color: white;
            box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3);
          }
          
          .view-btn:hover {
            background: #059669;
            border-color: #047857;
            color: white;
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
          }
          
          .summary-btn {
            background: #f59e0b;
            border-color: #d97706;
            color: white;
            box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
          }
          
          .summary-btn:hover {
            background: #d97706;
            border-color: #b45309;
            color: white;
            box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
          }
          
          /* Responsive Design */
          @media (max-width: 768px) {
            .main-content {
              height: 100vh;
              overflow: hidden;
            }
            
            .content-wrapper {
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            .patient-list-container {
              padding: 0.5rem;
              min-height: calc(100vh - 60px);
            }
            
            .header-section {
              padding: 1rem;
            }
            
            .page-label {
              font-size: 1.5rem;
            }
            
            .table {
              font-size: 0.7rem;
            }
            
            .table th,
            .table td {
              padding: 0.25rem 0.125rem;
            }
            
            .simple-actions {
              flex-direction: column;
              gap: 0.5rem;
            }
            
            .simple-btn {
              padding: 0.5rem 0.75rem;
              font-size: 0.65rem;
              min-width: 120px;
              width: 100%;
            }
          }
          
          @media (max-width: 480px) {
            .patient-list-container {
              padding: 0.25rem;
            }
            
            .search-and-add-container {
              padding: 0.75rem;
            }
            
            .table th,
            .table td {
              padding: 0.125rem;
              font-size: 0.6rem;
            }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-label">
              <i className="bi bi-people-fill me-3 text-primary"></i>
              Doctor Patient Management
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Manage patient information, medical records, assessments, and treatment plans
            </p>
          </div>
          <div className="d-flex align-items-center gap-3">
          {(searchAge || searchGender) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
                padding: '0.5rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}>
                <i className="bi bi-funnel-fill"></i>
              <span>Filters Active</span>
              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                  color: 'white',
                    fontSize: '10px',
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
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-person-search me-1"></i>
                Search Name
              </label>
            <input
              id="searchName"
              type="text"
                className="form-control search-input"
              placeholder="Search first, middle, or last name..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  height: '42px',
                  transition: 'all 0.2s ease'
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
          </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-calendar-event me-1"></i>
                Birth Date
              </label>
            <input
              id="searchDate"
              type="date"
                className="form-control date-input"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  height: '42px',
                  transition: 'all 0.2s ease'
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
          </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-gender-ambiguous me-1"></i>
                Gender
              </label>
              <select
                className="form-select"
                value={searchGender}
                onChange={e => setSearchGender(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  height: '42px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-123 me-1"></i>
                Age
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Age"
                value={searchAge}
                onChange={e => setSearchAge(e.target.value)}
                min="0"
                max="120"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  height: '42px',
                  transition: 'all 0.2s ease'
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
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: 'transparent' }}>
                Actions
              </label>
              <div className="d-flex gap-2">
            <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSearch}
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
                    flex: '1',
                    minWidth: '0'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  <i className="bi bi-search"></i>
                  <span>Search</span>
            </button>
            <button
                  className="btn btn-outline-secondary"
              type="button"
              onClick={handleReset}
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
                    flex: '1',
                    minWidth: '0'
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
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Reset</span>
            </button>
          </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="results-summary">
            <span className="text-muted fw-semibold" style={{ fontSize: '0.875rem' }}>
              <i className="bi bi-people-fill me-2"></i>
              {filteredPatients.length} patients found
            </span>
          </div>
          <div className="d-flex gap-2">
            {/* Archive Button */}
            <button
              type="button"
              className="btn btn-outline-warning"
              onClick={handleShowArchivedModal}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease'
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
                <i className="bi bi-archive me-2"></i>
                View Archived
              </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="patient-table-container">
          <div className="table-wrapper">
            <table className="table"
              style={{
            width: '100%',
            margin: '0',
                fontSize: '0.8rem'
          }}>
              <thead>
                <tr>
                  <th>
                    <i className="bi bi-person me-1"></i>
                    First Name
                  </th>
                  <th>
                    <i className="bi bi-person-badge me-1"></i>
                    Middle Name
                  </th>
                  <th>
                    <i className="bi bi-person-check me-1"></i>
                    Last Name
                  </th>
                  <th>
                    <i className="bi bi-gender-ambiguous me-1"></i>
                    Gender
                  </th>
                  <th>
                    <i className="bi bi-calendar-event me-1"></i>
                    Birth Date & Age
                  </th>
                  <th>
                    <i className="bi bi-geo-alt me-1"></i>
                    Location
                </th>
                  <th>
                    <i className="bi bi-telephone me-1"></i>
                    Contact
                </th>
                  <th>
                    <i className="bi bi-eye me-1"></i>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((patient, idx) => (
                  <tr key={patient.id}>
                    <td className="name-cell">
                      {getFirstName(patient) || 'N/A'}
                    </td>
                    <td className="name-cell">
                      {getMiddleName(patient) || '—'}
                    </td>
                    <td className="name-cell">
                      {getLastName(patient) || 'N/A'}
                    </td>
                    <td className="gender-cell">
                      <span className="simple-badge gender-badge">
                        {patient.gender === 'Male' && '♂ Male'}
                        {patient.gender === 'Female' && '♀ Female'}
                        {(!patient.gender || (patient.gender !== 'Male' && patient.gender !== 'Female')) && '—'}
                      </span>
                    </td>
                    <td className="date-cell">
                      <div className="birth-date">{formatDate(patient.birth_date)}</div>
                      <div className="age-info">
                          {(() => {
                            const birthDate = new Date(patient.birth_date);
                            const today = new Date();
                            const age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                          })()} years old
                      </div>
                    </td>
                    <td className="location-cell">
                      <div className="address-text">{patient.address || 'N/A'}</div>
                      <div className="barangay-text">{patient.barangay || 'N/A'}</div>
                    </td>
                    <td className="contact-cell">
                      {patient.contact_number || 'N/A'}
                    </td>
                    <td>
                      <div className="simple-actions">
                        <button
                          type="button"
                          className="simple-btn view-btn"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            setViewModal(true);
                          }}
                          style={{
                            minWidth: '140px'
                          }}
                        >
                          <i className="bi bi-eye"></i>
                          View
                        </button>
                        <button
                          type="button"
                          className="simple-btn summary-btn"
                          onClick={() => handleMedicalSummary(patients.findIndex(p => p.id === patient.id))}
                          style={{
                            minWidth: '140px'
                          }}
                        >
                          <i className="bi bi-file-medical"></i>
                          Summary
                        </button>
                        <button
                          type="button"
                          className="simple-btn add-assessment-btn"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            handleModalOpen('assessment', patient.id);
                          }}
                          disabled={isLoadingMedicalRecords}
                          style={{
                            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                            border: 'none',
                            color: 'white',
                            minWidth: '140px',
                            opacity: isLoadingMedicalRecords ? 0.6 : 1
                          }}
                        >
                          {isLoadingMedicalRecords ? (
                            <>
                              <i className="bi bi-hourglass-split"></i>
                              Loading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-clipboard-check"></i>
                              Assessment
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="simple-btn add-plan-btn"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            handleModalOpen('plan', patient.id);
                          }}
                          disabled={isLoadingMedicalRecords}
                          style={{
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            border: 'none',
                            color: 'white',
                            minWidth: '140px',
                            opacity: isLoadingMedicalRecords ? 0.6 : 1
                          }}
                        >
                          {isLoadingMedicalRecords ? (
                            <>
                              <i className="bi bi-hourglass-split"></i>
                              Loading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-list-check"></i>
                              Plan
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="simple-btn add-medication-btn"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            handleModalOpen('medication', patient.id);
                          }}
                          disabled={isLoadingMedicalRecords}
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            border: 'none',
                            color: 'white',
                            minWidth: '140px',
                            opacity: isLoadingMedicalRecords ? 0.6 : 1
                          }}
                        >
                          {isLoadingMedicalRecords ? (
                            <>
                              <i className="bi bi-hourglass-split"></i>
                              Loading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-capsule"></i>
                              Medication
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="simple-btn print-btn"
                          onClick={() => generatePatientPDFDownload(patient)}
                          style={{
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            border: 'none',
                            color: 'white'
                          }}
                        >
                          <i className="bi bi-printer"></i>
                          Print PDF
                        </button>
                        {/* Archive Button */}
                        <button
                          type="button"
                          className="simple-btn archive-btn"
                          onClick={() => handleArchivePatient(patient.id)}
                            disabled={isArchiving}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              border: 'none',
                              color: 'white',
                              opacity: isArchiving ? 0.6 : 1,
                              minWidth: '140px'
                            }}
                          >
                            <i className="bi bi-archive"></i>
                            {isArchiving ? 'Archiving...' : 'Archive'}
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Compact Pagination Controls */}
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

      {/* View Patient Modal */}
      <ModalPortal isOpen={viewModal && selectedPatientIdx !== null}>
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
            position: 'relative'
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
                  <i className="bi bi-person" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Patient Information</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewModal(false)}
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
              
              <form>
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
                    max={new Date().toISOString().split('T')[0]}
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
                  <div className="d-flex align-items-center gap-2">
                    <div style={{
                      background: '#e9ecef',
                      border: errors.contact_number 
                        ? '1px solid #dc2626' 
                        : form.contact_number && !errors.contact_number 
                        ? '1px solid #10b981' 
                        : '1px solid #ced4da',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#6c757d',
                      fontWeight: '600',
                      fontSize: '14px',
                      minWidth: '60px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      boxShadow: errors.contact_number 
                        ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                        : form.contact_number && !errors.contact_number 
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                        : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      +63
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter remaining digits (e.g., 9123456789)"
                      name="contact_number"
                      value={form.contact_number || ""}
                      onChange={handleFormChangeWithValidation}
                      onBlur={(e) => validateField('contact_number', e.target.value, 'patient')}
                      onKeyPress={(e) => {
                        // Only allow numbers
                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        // Limit to 10 characters and only numbers
                        let value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length > 10) {
                          value = value.substring(0, 10);
                        }
                        e.target.value = value;
                      }}
                      maxLength="10"
                      style={{
                        borderColor: errors.contact_number ? '#dc2626' : form.contact_number && !errors.contact_number ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.contact_number 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : form.contact_number && !errors.contact_number 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : 'none',
                        transition: 'all 0.2s ease',
                        flex: 1
                      }}
                    />
                  </div>
                  <small className="text-muted" style={{ marginTop: '4px', display: 'block' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Enter 10 digits (e.g., 9123456789) - Total: +63 + your number
                  </small>
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
                      Valid contact number!
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
                    onClick={() => setViewModal(false)}
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
      </ModalPortal>


      {/* View Patient Modal */}
      <ModalPortal isOpen={viewModal && selectedPatientIdx !== null}>
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
              height: 'auto',
              zIndex: 10000,
              position: 'relative'
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
                      <h3 style={{ margin: '0', fontWeight: '600', fontSize: '1.4rem' }}>{getFullName(patients[selectedPatientIdx])}</h3>
                      <p style={{ margin: '0.25rem 0 0', opacity: '0.9', fontSize: '0.9rem' }}>
                        Patient ID: {patients[selectedPatientIdx]?.id}
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
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>First Name</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.first_name || 'N/A'}</span>
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
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Middle Name</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.middle_name || 'N/A'}</span>
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
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Last Name</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.last_name || 'N/A'}</span>
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
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Gender</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.gender || 'Unknown'}</span>
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
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(patients[selectedPatientIdx]?.birth_date)}</span>
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
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Address</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.address || 'N/A'}</span>
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
                          <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem' }}>Barangay</span>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.barangay || 'N/A'}</span>
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
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{patients[selectedPatientIdx]?.contact_number || 'N/A'}</span>
                        </div>
                        
                        <div style={{
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Address</div>
                          <div style={{ fontWeight: '600', color: '#1f2937', lineHeight: '1.4' }}>
                            {patients[selectedPatientIdx]?.address || 'N/A'}
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
                onClick={() => handleViewMedicalRecords(selectedPatientIdx)}
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
      </ModalPortal>

      {/* Medical Records Modal */}
      <ModalPortal isOpen={viewMedicalRecords && selectedPatient}>
        <div className="modal-overlay">
          <div className="modal-content shadow rounded medical-records-modal" style={{ 
            maxWidth: '95vw', 
            width: '95vw', 
            minWidth: '1200px',
            maxHeight: '95vh',
            height: '95vh',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '20px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Enhanced Header */}
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
              color: 'white',
              borderBottom: 'none',
              borderRadius: '20px 20px 0 0',
              padding: '1.5rem 2rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '200px',
                height: '200px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                zIndex: 1
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                zIndex: 1
              }}></div>
              
              <div className="d-flex align-items-center" style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <i className="bi bi-file-medical" style={{ fontSize: '20px' }}></i>
                </div>
                <div>
                  <h5 className="modal-title mb-1 fw-bold" style={{ fontSize: '1.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {getFullName(selectedPatient)}'s Medical Records
                  </h5>
                  <p className="mb-0" style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                    Complete medical history and treatment records
                  </p>
                </div>
              </div>
              
              <div className="d-flex align-items-center gap-3" style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)'
                }}>
                  {records.length} Records
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setviewMedicalRecords(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '10px',
                    width: '40px',
                    height: '40px',
                    color: 'white',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
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
                  &times;
                </button>
              </div>
            </div>

            {/* Enhanced Body */}
            <div className="modal-body" style={{ 
              maxHeight: 'calc(95vh - 100px)', 
              overflowY: 'auto',
              padding: '0',
              background: '#f8fafc'
            }}>
              {/* Action Bar */}
              <div style={{
                background: 'white',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    <i className="bi bi-calendar3 me-2"></i>
                    {records.length > 0 ? `${records.length} Medical Records` : 'No Records Found'}
                  </div>
                  {selectedRecord && (
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      color: '#0369a1'
                    }}>
                      <i className="bi bi-eye me-2"></i>
                      Viewing: {formatDate(selectedRecord.created_at)}
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  className="btn btn-success"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    color: 'white'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                  }}
                  onClick={async () => {
                    await fetchMedicalRecords(selectedPatient.id);
                    setAddAssessmentModal(true);
                  }}
                >
                  <i className="bi bi-clipboard-check me-2"></i> 
                  Add Assessment
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                    color: 'white',
                    marginLeft: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                  }}
                  onClick={async () => {
                    await fetchMedicalRecords(selectedPatient.id);
                    setAddPlanModal(true);
                  }}
                >
                  <i className="bi bi-list-check me-2"></i> 
                  Add Plan
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                    color: 'white',
                    marginLeft: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                  }}
                  onClick={async () => {
                    await fetchMedicalRecords(selectedPatient.id);
                    setAddMedicationModal(true);
                  }}
                >
                  <i className="bi bi-capsule me-2"></i> 
                  Add Medication
                </button>
              </div>

              {/* Main Content Area */}
              <div style={{ display: 'flex', height: 'calc(95vh - 200px)', minHeight: '400px' }}>
                {/* Enhanced Timeline Sidebar */}
                <div style={{ 
                  width: '280px', 
                  background: 'white',
                  borderRight: '2px solid #e5e7eb',
                  overflowY: 'auto',
                  position: 'relative'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h6 style={{ 
                      margin: 0, 
                      color: '#374151', 
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      <i className="bi bi-clock-history me-2"></i>
                      Medical Timeline
                    </h6>
                  </div>
                  
                  {records.length === 0 ? (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: '#6b7280'
                    }}>
                      <i className="bi bi-file-medical" style={{ fontSize: '2rem', opacity: '0.3' }}></i>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>No medical records found</p>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem' }}>
                      {records.map((rec, idx) => (
                        <div
                          key={rec.id}
                          onClick={() => setSelectedRecordIdx(idx)}
                          style={{
                            background: idx === selectedRecordIdx 
                              ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
                              : 'transparent',
                            border: idx === selectedRecordIdx 
                              ? '2px solid #3b82f6' 
                              : '2px solid transparent',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                          onMouseOver={(e) => {
                            if (idx !== selectedRecordIdx) {
                              e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                              e.target.style.borderColor = '#cbd5e1';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (idx !== selectedRecordIdx) {
                              e.target.style.background = 'transparent';
                              e.target.style.borderColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{
                              background: idx === selectedRecordIdx ? '#3b82f6' : '#6b7280',
                              color: 'white',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {formatDate(rec.created_at)}
                            </div>
                            {idx === selectedRecordIdx && (
                              <div style={{
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem'
                              }}>
                                <i className="bi bi-check"></i>
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: idx === selectedRecordIdx ? '#1e40af' : '#6b7280',
                            fontWeight: idx === selectedRecordIdx ? '500' : '400'
                          }}>
                            Medical Record #{rec.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Details Panel */}
                <div style={{ 
                  flex: 1, 
                  background: 'white',
                  overflowY: 'auto'
                }}>
                  {selectedRecord ? (
                    <div style={{ padding: '2rem' }}>
                      {/* Record Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h6 style={{ 
                              margin: '0 0 0.5rem 0', 
                              color: '#374151', 
                              fontWeight: '600',
                              fontSize: '1.1rem'
                            }}>
                              <i className="bi bi-file-medical me-2"></i>
                              Medical Record Details
                            </h6>
                            <p style={{ 
                              margin: 0, 
                              color: '#6b7280', 
                              fontSize: '0.9rem' 
                            }}>
                              Created on {formatDate(selectedRecord.created_at)}
                            </p>
                          </div>
                          <div style={{
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            Active Record
                          </div>
                        </div>
                      </div>

                      {/* Vitals Section */}
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                          color: 'white',
                          borderRadius: '8px 8px 0 0',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}>
                          <i className="bi bi-heart-pulse me-2"></i>
                          Vital Signs
                        </div>
                        <div style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '1.5rem'
                        }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                            gap: '1rem' 
                          }}>
                            <div style={{
                              background: '#fef3c7',
                              border: '1px solid #f59e0b',
                              borderRadius: '8px',
                              padding: '1rem',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '600', marginBottom: '0.25rem' }}>
                                🌡️ Temperature
                              </div>
                              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#92400e' }}>
                                {selectedRecord.temperature ? `${selectedRecord.temperature}°C` : 'N/A'}
                              </div>
                            </div>
                            <div style={{
                              background: '#dbeafe',
                              border: '1px solid #3b82f6',
                              borderRadius: '8px',
                              padding: '1rem',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.25rem' }}>
                                ⚖️ Weight
                              </div>
                              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e40af' }}>
                                {selectedRecord.weight ? `${selectedRecord.weight} kg` : 'N/A'}
                              </div>
                            </div>
                            <div style={{
                              background: '#f0fdf4',
                              border: '1px solid #10b981',
                              borderRadius: '8px',
                              padding: '1rem',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: '600', marginBottom: '0.25rem' }}>
                                ❤️ Heart Rate
                              </div>
                              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#065f46' }}>
                                {selectedRecord.cardiac_rate ? `${selectedRecord.cardiac_rate} bpm` : 'N/A'}
                              </div>
                            </div>
                            <div style={{
                              background: '#fef2f2',
                              border: '1px solid #ef4444',
                              borderRadius: '8px',
                              padding: '1rem',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: '600', marginBottom: '0.25rem' }}>
                                🩸 Blood Pressure
                              </div>
                              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#991b1b' }}>
                                {selectedRecord.blood_pressure ? `${selectedRecord.blood_pressure} mmHg` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patient Information Section */}
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          borderRadius: '8px 8px 0 0',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}>
                          <i className="bi bi-person-lines-fill me-2"></i>
                          Patient Information
                        </div>
                        <div style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '1.5rem'
                        }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#6b7280', 
                              fontWeight: '600', 
                              marginBottom: '0.5rem' 
                            }}>
                              🏥 Chief Complaint
                            </div>
                            <div style={{ 
                              background: '#f8fafc', 
                              padding: '1rem', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              fontSize: '0.9rem',
                              lineHeight: '1.5'
                            }}>
                              {selectedRecord.chief_complaint || 'No chief complaint recorded'}
                            </div>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#6b7280', 
                              fontWeight: '600', 
                              marginBottom: '0.5rem' 
                            }}>
                              🧬 Patient History
                            </div>
                            <div style={{ 
                              background: '#f8fafc', 
                              padding: '1rem', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              fontSize: '0.9rem',
                              lineHeight: '1.5'
                            }}>
                              {selectedRecord.patient_history || 'No patient history recorded'}
                            </div>
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#6b7280', 
                              fontWeight: '600', 
                              marginBottom: '0.5rem' 
                            }}>
                              📋 History of Present Illness
                            </div>
                            <div style={{ 
                              background: '#f8fafc', 
                              padding: '1rem', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              fontSize: '0.9rem',
                              lineHeight: '1.5'
                            }}>
                              {selectedRecord.history_of_present_illness || 'No history of present illness recorded'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assessment Section */}
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                          color: 'white',
                          borderRadius: '8px 8px 0 0',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}>
                          <i className="bi bi-clipboard-check me-2"></i>
                          Assessment
                        </div>
                        <div style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '1.5rem'
                        }}>
                          <div style={{ 
                            background: '#f8fafc', 
                            padding: '1rem', 
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            minHeight: '100px'
                          }}>
                            {selectedRecord.assessment || 'No assessment recorded'}
                          </div>
                        </div>
                      </div>

                      {/* Treatment Plan Section */}
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          color: 'white',
                          borderRadius: '8px 8px 0 0',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}>
                          <i className="bi bi-list-check me-2"></i>
                          Treatment Plan
                        </div>
                        <div style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '1.5rem'
                        }}>
                          <div style={{ 
                            background: '#f8fafc', 
                            padding: '1rem', 
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            minHeight: '100px'
                          }}>
                            {selectedRecord.plan || 'No treatment plan recorded'}
                          </div>
                        </div>
                      </div>

                      {/* Medical Information Section */}
                      <div>
                        <div style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          color: 'white',
                          borderRadius: '8px 8px 0 0',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}>
                          <i className="bi bi-capsule me-2"></i>
                          Medical Information
                        </div>
                        <div style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '1.5rem'
                        }}>
                          <div>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#6b7280', 
                              fontWeight: '600', 
                              marginBottom: '0.5rem' 
                            }}>
                              💊 Medicine Takes
                            </div>
                            <div style={{ 
                              background: '#f8fafc', 
                              padding: '1rem', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              fontSize: '0.9rem',
                              lineHeight: '1.5'
                            }}>
                              {selectedRecord.medicine_takes || 'No medications recorded'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#6b7280',
                      textAlign: 'center',
                      padding: '2rem'
                    }}>
                      <i className="bi bi-file-medical" style={{ fontSize: '3rem', opacity: '0.3', marginBottom: '1rem' }}></i>
                      <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Select a Medical Record</h6>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Choose a record from the timeline to view detailed information</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Add Medical Record Modal */}
      <ModalPortal isOpen={addMedicalRecordModal && selectedPatient}>
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            maxWidth: '800px',
            width: '90vw',
            position: 'relative'
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
                {/* Auto-measurement Notice */}
                <div className="alert alert-info mb-4" style={{
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  border: '1px solid #90caf9',
                  borderRadius: '12px',
                  padding: '1rem',
                  borderLeft: '4px solid #2196f3'
                }}>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle-fill me-3" style={{ 
                      color: '#1976d2', 
                      fontSize: '20px' 
                    }}></i>
                    <div>
                      <h6 className="mb-1 fw-bold" style={{ color: '#1976d2' }}>
                        <i className="bi bi-magic me-2"></i>
                        Auto-Measurement Feature
                      </h6>
                      <p className="mb-0" style={{ color: '#1565c0', fontSize: '14px' }}>
                        Just enter the numbers - measurements (°C, kg, bpm, etc.) will be added automatically!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="section-header mb-2">Vitals</div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Temperature</label>
                    <div className="d-flex align-items-center gap-2">
                    <input
                        type="number"
                      className="form-control"
                        placeholder="Enter temperature (e.g., 37)"
                      name="temperature"
                      value={recordForm.temperature || ""}
                      onChange={handleRecordFormChange}
                        onKeyPress={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                      required
                        min="0"
                        step="1"
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        background: '#e9ecef',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#6c757d',
                        fontWeight: '600',
                        fontSize: '14px',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}>
                        °C
                      </div>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Just enter the number - °C will be added automatically
                    </small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Weight</label>
                    <div className="d-flex align-items-center gap-2">
                    <input
                        type="number"
                      className="form-control"
                        placeholder="Enter weight (e.g., 60)"
                      name="weight"
                      value={recordForm.weight || ""}
                      onChange={handleRecordFormChange}
                        onKeyPress={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                      required
                        min="0"
                        step="1"
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        background: '#e9ecef',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#6c757d',
                        fontWeight: '600',
                        fontSize: '14px',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}>
                        kg
                      </div>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Just enter the number - kg will be added automatically
                    </small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder={`Enter age (min: ${selectedPatient ? calculatePatientAge(selectedPatient.birth_date) : 'N/A'} years)`}
                      name="age"
                      value={recordForm.age || ""}
                      onChange={handleRecordFormChangeWithValidation}
                      onBlur={(e) => validateField('age', e.target.value, 'medical')}
                      onKeyPress={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      min={selectedPatient ? calculatePatientAge(selectedPatient.birth_date) : 0}
                      step="1"
                      required
                      style={{
                        borderColor: errors.age ? '#dc2626' : recordForm.age && !errors.age ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.age 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : recordForm.age && !errors.age 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <small className="text-muted">
                      Patient's current age: {selectedPatient ? calculatePatientAge(selectedPatient.birth_date) : 'N/A'} years
                    </small>
                    {errors.age && (
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
                        {errors.age}
                      </div>
                    )}
                    {recordForm.age && !errors.age && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Valid age!
                      </div>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Respiratory Rate</label>
                    <div className="d-flex align-items-center gap-2">
                    <input
                        type="number"
                      className="form-control"
                        placeholder="Enter respiratory rate (e.g., 18)"
                      name="respiratory_rate"
                      value={recordForm.respiratory_rate || ""}
                      onChange={handleRecordFormChange}
                        onKeyPress={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                      required
                        min="0"
                        step="1"
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        background: '#e9ecef',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#6c757d',
                        fontWeight: '600',
                        fontSize: '14px',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        breaths/min
                      </div>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Just enter the number - breaths/min will be added automatically
                    </small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cardiac Rate</label>
                    <div className="d-flex align-items-center gap-2">
                    <input
                        type="number"
                      className="form-control"
                        placeholder="Enter cardiac rate (e.g., 75)"
                      name="cardiac_rate"
                      value={recordForm.cardiac_rate || ""}
                      onChange={handleRecordFormChange}
                        onKeyPress={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                      required
                        min="0"
                        step="1"
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        background: '#e9ecef',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#6c757d',
                        fontWeight: '600',
                        fontSize: '14px',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}>
                        bpm
                      </div>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Just enter the number - bpm will be added automatically
                    </small>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Blood Pressure</label>
                    <div className="d-flex align-items-center gap-2">
                    <input
                      type="text"
                      className="form-control"
                        placeholder="Enter blood pressure (e.g., 120/80)"
                      name="blood_pressure"
                      value={recordForm.blood_pressure || ""}
                      onChange={handleRecordFormChange}
                        onKeyPress={(e) => {
                          // Allow numbers, forward slash, and backspace
                          const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '/', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                          if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                          }
                        }}
                        onInput={(e) => {
                          // Remove any non-numeric characters except forward slash
                          let value = e.target.value;
                          value = value.replace(/[^0-9/]/g, '');
                          e.target.value = value;
                        }}
                      required
                        style={{ flex: 1 }}
                      />
                      <div style={{
                        background: '#e9ecef',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#6c757d',
                        fontWeight: '600',
                        fontSize: '14px',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>
                        mmHg
                      </div>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Enter systolic/diastolic (e.g., 120/80) - mmHg will be added automatically
                    </small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Chief Complaint</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter the patient's main complaint or reason for visit..."
                      name="chief_complaint"
                      value={recordForm.chief_complaint || ""}
                      onChange={handleRecordFormChange}
                      required
                    ></textarea>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Describe the patient's primary concern or symptoms
                    </small>
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
      </ModalPortal>

      {/* Add Assessment Modal */}
      <ModalPortal isOpen={addAssessmentModal && selectedPatient}>
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              padding: '1.5rem',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  <i className="bi bi-clipboard-check" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Add Assessment for {getFullName(selectedPatient)}</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setAddAssessmentModal(false);
                  resetAssessmentForm();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {isLoadingMedicalRecords ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading medical records...</p>
                </div>
              ) : (
                <form onSubmit={handleAddAssessment}>
                  <div className="mb-4">
                    <label className="form-label fw-bold" style={{ color: '#374151', marginBottom: '0.5rem' }}>
                      Select Medical Record Date
                    </label>
                    <select
                      name="medical_record_id"
                      value={selectedMedicalRecordId || ''}
                      onChange={handleMedicalRecordSelection}
                    className="form-control"
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      fontSize: '14px',
                      marginBottom: '1rem'
                    }}
                    required
                  >
                    <option value="">Choose a medical record date...</option>
                    {availableMedicalRecords.length > 0 ? (
                      availableMedicalRecords.map((record) => (
                        <option key={record.id} value={record.id}>
                          {formatDate(record.created_at)} - {record.chief_complaint || 'Medical Record'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No medical records found</option>
                    )}
                  </select>
                  <small className="text-muted">Select the medical record you want to add an assessment to.</small>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold" style={{ color: '#374151', marginBottom: '0.5rem' }}>
                    Medical Assessment
                  </label>
                  <textarea
                    name="assessment"
                    value={assessmentForm.assessment || ''}
                    onChange={handleAssessmentFormChange}
                    className="form-control"
                    rows="8"
                    placeholder="Enter detailed medical assessment, diagnosis, and clinical findings..."
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '14px',
                      resize: 'vertical',
                      minHeight: '200px'
                    }}
                    required
                  />
                  <small className="text-muted">Provide a comprehensive medical assessment including diagnosis, clinical findings, and patient condition evaluation.</small>
                </div>
                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                    color: 'white'
                  }}>
                    <i className="bi bi-clipboard-check me-2"></i> Save Assessment
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => {
                      setAddAssessmentModal(false);
                      resetAssessmentForm();
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
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Add Plan Modal */}
      <ModalPortal isOpen={addPlanModal && selectedPatient}>
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              border: 'none',
              padding: '1.5rem',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  <i className="bi bi-list-check" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Add Treatment Plan for {getFullName(selectedPatient)}</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setAddPlanModal(false);
                  resetPlanForm();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {isLoadingMedicalRecords ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading medical records...</p>
                </div>
              ) : (
                <form onSubmit={handleAddPlan}>
                  <div className="mb-4">
                    <label className="form-label fw-bold" style={{ color: '#374151', marginBottom: '0.5rem' }}>
                      Select Medical Record Date
                    </label>
                    <select
                      name="medical_record_id"
                      value={selectedMedicalRecordId || ''}
                      onChange={handleMedicalRecordSelection}
                    className="form-control"
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      fontSize: '14px',
                      marginBottom: '1rem'
                    }}
                    required
                  >
                    <option value="">Choose a medical record date...</option>
                    {availableMedicalRecords.length > 0 ? (
                      availableMedicalRecords.map((record) => (
                        <option key={record.id} value={record.id}>
                          {formatDate(record.created_at)} - {record.chief_complaint || 'Medical Record'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No medical records found</option>
                    )}
                  </select>
                  <small className="text-muted">Select the medical record you want to add a treatment plan to.</small>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold" style={{ color: '#374151', marginBottom: '0.5rem' }}>
                    Treatment Plan
                  </label>
                  <textarea
                    name="plan"
                    value={planForm.plan || ''}
                    onChange={handlePlanFormChange}
                    className="form-control"
                    rows="8"
                    placeholder="Enter detailed treatment plan including medications, procedures, follow-up instructions..."
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '14px',
                      resize: 'vertical',
                      minHeight: '200px'
                    }}
                    required
                  />
                  <small className="text-muted">Provide a comprehensive treatment plan including medications, procedures, follow-up instructions, and patient care recommendations.</small>
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
                    <i className="bi bi-list-check me-2"></i> Save Plan
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => {
                      setAddPlanModal(false);
                      resetPlanForm();
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
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Add Medication Modal */}
      <ModalPortal isOpen={addMedicationModal && selectedPatient}>
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              padding: '1.5rem',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  <i className="bi bi-capsule" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Add Medication for {getFullName(selectedPatient)}</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setAddMedicationModal(false);
                  resetMedicationForm();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {isLoadingMedicalRecords ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading medical records...</p>
                </div>
              ) : (
                <form onSubmit={handleAddMedication}>
                  <div className="mb-4">
                    <label className="form-label fw-bold" style={{ color: '#374151', marginBottom: '0.5rem' }}>
                      Select Medical Record Date
                    </label>
                    <select
                      name="medical_record_id"
                      value={selectedMedicalRecordId || ''}
                      onChange={handleMedicalRecordSelection}
                    className="form-control"
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      fontSize: '14px',
                      marginBottom: '1rem'
                    }}
                    required
                  >
                    <option value="">Choose a medical record date...</option>
                    {availableMedicalRecords.length > 0 ? (
                      availableMedicalRecords.map((record) => (
                        <option key={record.id} value={record.id}>
                          {formatDate(record.created_at)} - {record.chief_complaint || 'Medical Record'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No medical records found</option>
                    )}
                  </select>
                  <small className="text-muted">Select the medical record you want to add medication to.</small>
                </div>
                <div className="mb-4" style={{ position: 'relative' }}>
                  <label className="form-label fw-bold" style={{ color: '#374151', marginBottom: '0.5rem' }}>
                    Medication
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                    name="medication"
                    value={medicationForm.medication || ''}
                    onChange={handleMedicationFormChange}
                      onFocus={() => {
                        if (medicationForm.medication && medicationForm.medication.trim().length > 0) {
                          const filtered = recentMedications.filter(med =>
                            med.toLowerCase().includes(medicationForm.medication.toLowerCase())
                          );
                          setMedicationSuggestions(filtered.slice(0, 10));
                          setShowMedicationSuggestions(true);
                        } else {
                          // Show all recent medications when field is empty and focused
                          setMedicationSuggestions(recentMedications.slice(0, 10));
                          setShowMedicationSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click events
                        setTimeout(() => setShowMedicationSuggestions(false), 200);
                      }}
                    className="form-control"
                      placeholder="Start typing to see recent medications..."
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                        padding: '0.75rem 1rem',
                      fontSize: '14px',
                        width: '100%'
                    }}
                    required
                      autoComplete="off"
                  />
                    {showMedicationSuggestions && medicationSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          marginTop: '4px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {medicationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleMedicationSuggestionClick(suggestion)}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: index < medicationSuggestions.length - 1 ? '1px solid #e5e7eb' : 'none',
                              transition: 'background-color 0.2s ease',
                              fontSize: '14px',
                              color: '#374151'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'white';
                            }}
                          >
                            <i className="bi bi-capsule me-2" style={{ color: '#8b5cf6' }}></i>
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <small className="text-muted">Start typing to see suggestions from recent medications. Provide detailed medication information including drug name, dosage, frequency, duration, and any special instructions or warnings.</small>
                </div>
                <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-success" style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                    color: 'white'
                  }}>
                    <i className="bi bi-capsule me-2"></i> Save Medication
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-3"
                    onClick={() => {
                      setAddMedicationModal(false);
                      resetMedicationForm();
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
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Medical Summary Modal - Patient Profile */}
      <ModalPortal isOpen={medicalSummaryModal && selectedPatient}>
        <div className="modal-overlay">
          <div className="modal-content" style={{
            background: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            maxWidth: '95vw',
            width: '95vw',
            minWidth: '1200px',
            height: '92vh',
            maxHeight: '92vh',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Scrollable Content Area */}
            <div style={{ 
              height: 'calc(100% - 80px)',
              overflowY: 'auto',
              background: '#f8fafc'
            }}>
              {/* Patient Profile Header */}
              <div style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              color: 'white',
                padding: '1.25rem 1.5rem',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Patient Avatar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)'
                }}>
                      {getFullName(selectedPatient).split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                    
                    {/* Patient Basic Info */}
                    <div>
                      <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: '700' }}>
                        {getFullName(selectedPatient)}
                      </h2>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', opacity: '0.9' }}>
                        <div><strong>Age:</strong> {(() => {
                          const birthDate = new Date(patients[selectedPatientIdx]?.birth_date);
                          const today = new Date();
                          const age = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                        })()} years</div>
                        <div><strong>Gender:</strong> {patients[selectedPatientIdx]?.gender || 'Unknown'}</div>
                        <div><strong>ID:</strong> #{patients[selectedPatientIdx]?.id}</div>
                        <div>
                          <i className="bi bi-geo-alt me-1"></i>
                          {patients[selectedPatientIdx]?.barangay || 'N/A'}
              </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div style={{ display: 'flex', gap: '0.75rem', textAlign: 'center' }}>
                    {(() => {
                      const summary = generateMedicalSummary(selectedPatient, medicalRecords);
                      return (
                        <>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            minWidth: '70px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{summary.totalRecords}</div>
                            <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Visits</div>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            minWidth: '70px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{summary.medicineHistory.length}</div>
                            <div style={{ fontSize: '0.7rem', opacity: '0.9' }}>Medications</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Close Button */}
              <button
                type="button"
                onClick={() => setMedicalSummaryModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                  color: 'white',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)'
                }}
                    onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                    ×
              </button>
            </div>
              </div>
              {/* Medical Summary Content */}
              {(() => {
                const summary = generateMedicalSummary(selectedPatient, medicalRecords);
                return (
                  <div style={{ padding: '1.5rem', background: '#f8fafc' }}>
                    {/* Latest Visit - Priority Section */}
                    {summary.latestRecord && (
                        <div style={{
                        background: 'linear-gradient(135deg, #fff 0%, #f0f9ff 100%)',
                        borderRadius: '16px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        border: '2px solid #dbeafe',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                          <div style={{
                            background: '#3b82f6',
                            borderRadius: '10px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <i className="bi bi-activity"></i>
                          </div>
                          <div>
                            <h4 style={{ margin: '0', color: '#1e40af', fontSize: '1.3rem', fontWeight: '600' }}>
                              Latest Visit Summary
                          </h4>
                            <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>
                              {formatDate(summary.latestRecord.created_at)}
                            </p>
                            </div>
                            </div>

                        {/* Vital Signs Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>TEMPERATURE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{summary.latestRecord.temperature || 'N/A'}</div>
                          </div>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>BLOOD PRESSURE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{summary.latestRecord.blood_pressure || 'N/A'}</div>
                        </div>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>WEIGHT</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{summary.latestRecord.weight || 'N/A'}</div>
                      </div>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>HEART RATE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{summary.latestRecord.cardiac_rate || 'N/A'}</div>
                          </div>
                          </div>

                        {/* Chief Complaint */}
                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                          <h5 style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '1rem', fontWeight: '600' }}>Chief Complaint</h5>
                          <p style={{ margin: '0', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {summary.latestRecord.chief_complaint || 'No complaint recorded'}
                          </p>
                          {summary.latestRecord.history_of_present_illness && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                              <h6 style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.85rem', fontWeight: '600' }}>History of Present Illness</h6>
                              <p style={{ margin: '0', color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {summary.latestRecord.history_of_present_illness}
                              </p>
                          </div>
                          )}
                    </div>

                        {/* Current Medication */}
                        {summary.latestRecord.medicine_takes && (
                          <div style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginTop: '1rem',
                            border: '1px solid #f59e0b'
                          }}>
                            <h5 style={{ margin: '0 0 0.75rem 0', color: '#92400e', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-capsule"></i>
                              Current Prescription
                            </h5>
                            <p style={{ margin: '0', color: '#78350f', fontSize: '0.95rem', lineHeight: '1.5' }}>
                              {summary.latestRecord.medicine_takes}
                            </p>
                                    </div>
                                  )}
                      </div>
                    )}

                    {/* Medical History Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                      {/* Common Symptoms */}
                        <div style={{
                        background: 'white',
                        borderRadius: '16px',
                          padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b' }}></i>
                          Common Symptoms
                          </h4>
                          {summary.commonComplaints.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {summary.commonComplaints.map((complaint, idx) => (
                                <div key={idx} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #f1f5f9'
                              }}>
                                <span style={{ fontSize: '0.9rem', color: '#374151' }}>{complaint.complaint}</span>
                                  <span style={{
                                  background: '#f59e0b',
                                    color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  {complaint.count} times
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                          <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: '0' }}>No recurring symptoms found</p>
                          )}
                        </div>

                      {/* Medication History */}
                        <div style={{
                        background: 'white',
                        borderRadius: '16px',
                          padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="bi bi-prescription2" style={{ color: '#10b981' }}></i>
                          Medication History
                          </h4>
                        {summary.medicineHistory.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {summary.medicineHistory.slice(0, 5).map((med, idx) => (
                                <div key={idx} style={{
                                background: '#f0fdf4',
                                borderRadius: '8px',
                                padding: '1rem',
                                border: '1px solid #dcfce7'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <strong style={{ color: '#166534', fontSize: '0.9rem' }}>{med.medicine}</strong>
                                  <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{formatDate(med.date)}</span>
                                </div>
                                {med.assessment && (
                                  <p style={{ margin: '0', color: '#16a34a', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    {med.assessment.length > 100 ? med.assessment.substring(0, 100) + '...' : med.assessment}
                                  </p>
                                )}
                                </div>
                              ))}
                            </div>
                          ) : (
                          <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: '0' }}>No medication history found</p>
                          )}
                      </div>
                    </div>

                    {/* Medical Timeline */}
                    {summary.timeline.length > 0 && (
                          <div style={{
                        background: 'white',
                        borderRadius: '16px',
                            padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                          }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="bi bi-clock-history" style={{ color: '#8b5cf6' }}></i>
                              Medical Timeline
                            </h4>
                        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                          {/* Timeline line */}
                                  <div style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '0',
                            bottom: '0',
                            width: '2px',
                            background: 'linear-gradient(to bottom, #8b5cf6, #e5e7eb)'
                          }}></div>
                          
                          {summary.timeline.slice(0, 8).map((item, idx) => (
                            <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                              {/* Timeline dot */}
                              <div style={{
                                position: 'absolute',
                                left: '-2rem',
                                top: '0.5rem',
                                    width: '12px',
                                    height: '12px',
                                background: '#8b5cf6',
                                    borderRadius: '50%',
                                border: '3px solid white',
                                boxShadow: '0 0 0 1px #e5e7eb'
                                  }}></div>
                              
                              <div style={{
                                background: '#fafbfb',
                                borderRadius: '12px',
                                padding: '1rem',
                                border: '1px solid #f1f5f9'
                              }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                  <h6 style={{ margin: '0', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>
                                    {item.title}
                                  </h6>
                                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                    {formatDate(item.date)}
                                  </span>
                                    </div>
                                    {item.details.assessment && (
                                  <p style={{ margin: '0', color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    {item.details.assessment.length > 150 ? item.details.assessment.substring(0, 150) + '...' : item.details.assessment}
                                      </p>
                                    )}
                                    {item.details.medicine && (
                                  <div style={{ 
                                    marginTop: '0.5rem', 
                                    padding: '0.5rem', 
                                    background: '#f0fdf4', 
                                    borderRadius: '6px',
                                    border: '1px solid #dcfce7'
                                  }}>
                                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '500' }}>
                                      💊 {item.details.medicine}
                                    </span>
                                  </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Sticky Action Footer */}
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid #e5e7eb', 
              padding: '0.75rem 2rem',
              background: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '0 0 12px 12px',
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
              zIndex: 10
            }}>
              <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                <i className="bi bi-shield-check me-2"></i>
                Medical summary generated on {new Date().toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMedicalSummaryModal(false)}
                style={{
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                  color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    e.target.style.background = '#e5e7eb';
                    e.target.style.color = '#374151';
                  }}
                  onMouseOut={e => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Close Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMedicalSummaryModal(false);
                  handleViewMedicalRecords(selectedPatientIdx);
                }}
                style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                  transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                  onMouseOver={e => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                  }}
                  onMouseOut={e => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
                  }}
                >
                  <i className="bi bi-file-medical me-2"></i>
                  View Detailed Records
              </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Archived Patients Modal */}
      <ModalPortal isOpen={showArchivedModal}>
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden'
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
                  <i className="bi bi-archive" style={{ fontSize: '18px' }}></i>
                </div>
                <h5 className="modal-title mb-0 fw-bold">Archived Patients</h5>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowArchivedModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Search and Filter Section */}
              <div className="archived-search-section mb-4" style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="row g-3">
                  {/* Search Input */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-search me-2"></i>Search Patients
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, ID, or contact number..."
                      value={archivedSearchTerm}
                      onChange={(e) => setArchivedSearchTerm(e.target.value)}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>
                  
                  {/* Gender Filter */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-gender-ambiguous me-2"></i>Gender
                    </label>
                    <select
                      className="form-select"
                      value={archivedGenderFilter}
                      onChange={(e) => setArchivedGenderFilter(e.target.value)}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  {/* Age Filter */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-calendar3 me-2"></i>Age Range
                    </label>
                    <select
                      className="form-select"
                      value={archivedAgeFilter}
                      onChange={(e) => setArchivedAgeFilter(e.target.value)}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <option value="">All Ages</option>
                      <option value="0-17">0-17 years</option>
                      <option value="18-30">18-30 years</option>
                      <option value="31-50">31-50 years</option>
                      <option value="51-65">51-65 years</option>
                      <option value="65+">65+ years</option>
                    </select>
                  </div>
                  
                  {/* Date Filter */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-calendar-check me-2"></i>Archived Date
                    </label>
                    <select
                      className="form-select"
                      value={archivedDateFilter}
                      onChange={(e) => setArchivedDateFilter(e.target.value)}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  
                  {/* Filter Actions */}
                  <div className="col-md-8 d-flex align-items-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={clearArchivedFilters}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Clear Filters
                    </button>
                    <div className="text-muted" style={{ fontSize: '13px', alignSelf: 'center' }}>
                      Showing {getFilteredArchivedPatients().length} of {archivedPatients.length} archived patients
                    </div>
                  </div>
                </div>
              </div>

              {getFilteredArchivedPatients().length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-archive" style={{ fontSize: '3rem', color: '#e5e7eb' }}></i>
                  <h5 className="mt-3 text-muted">
                    {archivedPatients.length === 0 ? 'No Archived Patients' : 'No Matching Results'}
                  </h5>
                  <p className="text-muted">
                    {archivedPatients.length === 0 
                      ? 'There are currently no archived patients.' 
                      : 'No patients match your current search and filter criteria. Try adjusting your filters.'
                    }
                  </p>
                  {archivedPatients.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={clearArchivedFilters}
                      style={{ marginTop: '1rem' }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="archived-patients-container">
                  {/* Custom Table Header */}
                  <div className="archived-table-header" style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '12px 12px 0 0',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div>Patient Name</div>
                    <div>Age</div>
                    <div>Gender</div>
                    <div>Contact</div>
                    <div>Archived Date</div>
                    <div>Actions</div>
                  </div>

                  {/* Custom Table Body */}
                  <div className="archived-table-body" style={{
                    background: 'white',
                    borderRadius: '0 0 12px 12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {getFilteredArchivedPatients().map((patient, index) => (
                      <div 
                        key={patient.id}
                        className="archived-patient-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr 1fr',
                          gap: '1rem',
                          padding: '1rem',
                          alignItems: 'center',
                          borderBottom: index < archivedPatients.length - 1 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                        }}
                      >
                        {/* Patient Name */}
                        <div>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#1f2937',
                            fontSize: '14px',
                            marginBottom: '2px'
                          }}>
                            {getFullName(patient)}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6b7280' 
                          }}>
                            ID: #{patient.id}
                          </div>
                        </div>

                        {/* Age */}
                        <div style={{ 
                          color: '#374151',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {(() => {
                            const birthDate = new Date(patient.birth_date);
                            const today = new Date();
                            const age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
                              ? age - 1 
                              : age;
                          })()} years
                        </div>

                        {/* Gender */}
                        <div>
                          <span style={{
                            background: '#e5e7eb',
                            color: '#374151',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {patient.gender}
                          </span>
                        </div>

                        {/* Contact */}
                        <div style={{ 
                          color: '#374151',
                          fontSize: '14px'
                        }}>
                          {patient.contact_number || 'N/A'}
                        </div>

                        {/* Archived Date */}
                        <div style={{ 
                          color: '#6b7280',
                          fontSize: '13px'
                        }}>
                          {patient.archived_at ? formatDate(patient.archived_at) : 'Unknown'}
                        </div>

                        {/* Actions */}
                        <div>
                          <button
                            type="button"
                            onClick={() => handleUnarchivePatient(patient.id, getFullName(patient))}
                            disabled={isUnarchiving && unarchivingPatientId === patient.id}
                            style={{
                              background: (isUnarchiving && unarchivingPatientId === patient.id) 
                                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: (isUnarchiving && unarchivingPatientId === patient.id) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: (isUnarchiving && unarchivingPatientId === patient.id) ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!(isUnarchiving && unarchivingPatientId === patient.id)) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!(isUnarchiving && unarchivingPatientId === patient.id)) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                              }
                            }}
                          >
                            {(isUnarchiving && unarchivingPatientId === patient.id) ? (
                              <>
                                <i className="bi bi-arrow-clockwise" style={{ fontSize: '10px', animation: 'spin 1s linear infinite' }}></i>
                                Restoring...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '10px' }}></i>
                                Restore
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ 
              background: '#f8fafc', 
              borderTop: '1px solid #e5e7eb',
              borderRadius: '0 0 16px 16px',
              padding: '1rem 1.5rem'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowArchivedModal(false)}
                style={{
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontWeight: '600'
                }}
              >
                <i className="bi bi-x-circle me-2"></i> Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
