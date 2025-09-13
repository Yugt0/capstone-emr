import "../styles/PatientList.css";
import { useState, useEffect } from "react";

const PATIENTS_API = "http://127.0.0.1:8000/api/patients";
const MEDICAL_RECORDS_API = "http://127.0.0.1:8000/api/patient-medical-records";

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

export default function PatientList() {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [assessmentModal, setAssessmentModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [medicalSummaryModal, setMedicalSummaryModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({ assessment: "" });
  const [planForm, setPlanForm] = useState({ plan: "" });
  const [loading, setLoading] = useState(false);
  
  // Error handling states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Toast notification states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search and filter states
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchAge, setSearchAge] = useState("");
  const [searchGender, setSearchGender] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Initialize filtered patients when patients data changes
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

  // Reset to first page when data changes
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

  // Search and filter functions
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

  // Validation functions
  const validateAssessmentForm = (formData) => {
    const newErrors = {};
    
    if (!formData.assessment || formData.assessment.trim() === '') {
      newErrors.assessment = 'Assessment is required';
    } else if (formData.assessment.trim().length < 10) {
      newErrors.assessment = 'Assessment must be at least 10 characters';
    }
    
    return newErrors;
  };

  const validatePlanForm = (formData) => {
    const newErrors = {};
    
    if (!formData.plan || formData.plan.trim() === '') {
      newErrors.plan = 'Treatment plan is required';
    } else if (formData.plan.trim().length < 10) {
      newErrors.plan = 'Treatment plan must be at least 10 characters';
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

  // Real-time validation functions
  const validateField = (fieldName, value, formType = 'assessment') => {
    const newErrors = { ...errors };
    
    if (formType === 'assessment') {
      if (!value || value.trim() === '') {
        newErrors.assessment = 'Assessment is required';
      } else if (value.trim().length < 10) {
        newErrors.assessment = 'Assessment must be at least 10 characters';
      } else {
        delete newErrors.assessment;
      }
    } else if (formType === 'plan') {
      if (!value || value.trim() === '') {
        newErrors.plan = 'Treatment plan is required';
      } else if (value.trim().length < 10) {
        newErrors.plan = 'Treatment plan must be at least 10 characters';
      } else {
        delete newErrors.plan;
      }
    }
    
    setErrors(newErrors);
  };

  // Enhanced form change handlers with real-time validation
  const handleAssessmentChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setAssessmentForm({ ...assessmentForm, [name]: value });
    validateField(name, value, 'assessment');
  };

  const handlePlanChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setPlanForm({ ...planForm, [name]: value });
    validateField(name, value, 'plan');
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(PATIENTS_API);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      alert("Failed to fetch patients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async (patientId) => {
    try {
      setLoading(true);
      // Use the new endpoint to get medical records by patient ID
      const response = await fetch(`${MEDICAL_RECORDS_API}/patient/${patientId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMedicalRecords(data);
      // Set the first record as selected if available
      if (data.length > 0) {
        setSelectedRecord(data[0]);
      } else {
        setSelectedRecord(null);
      }
    } catch (error) {
      console.error("Failed to fetch medical records:", error);
      setMedicalRecords([]);
      setSelectedRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Assessment Form Change
  const handleAssessmentChange = (e) => {
    setAssessmentForm({ ...assessmentForm, [e.target.name]: e.target.value });
  };

  // Handle Plan Form Change
  const handlePlanChange = (e) => {
    setPlanForm({ ...planForm, [e.target.name]: e.target.value });
  };

  // Handle Add Assessment
  const handleAddAssessment = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    if (!selectedPatientId || !selectedRecord) {
      setSubmitError("Please select a patient and medical record first.");
      setIsSubmitting(false);
      return;
    }

    // Validate form
    const validationErrors = validateAssessmentForm(assessmentForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Update the existing medical record with the assessment
      const response = await fetch(`${MEDICAL_RECORDS_API}/${selectedRecord.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedRecord,
          assessment: assessmentForm.assessment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const updatedRecord = await response.json();
      
      // Update local state
      setMedicalRecords(prev => 
        prev.map(record => 
          record.id === selectedRecord.id ? updatedRecord : record
        )
      );
      setSelectedRecord(updatedRecord);
      
      // Reset form and close modal
      setAssessmentForm({ assessment: "" });
      setAssessmentModal(false);
      clearErrors();
      showToast('Assessment added successfully!', 'success');
    } catch (error) {
      console.error("Failed to add assessment:", error);
      setSubmitError(error.message || "Failed to add assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    if (!selectedPatientId || !selectedRecord) {
      setSubmitError("Please select a patient and medical record first.");
      setIsSubmitting(false);
      return;
    }

    // Validate form
    const validationErrors = validatePlanForm(planForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Update the existing medical record with the plan
      const response = await fetch(`${MEDICAL_RECORDS_API}/${selectedRecord.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedRecord,
          plan: planForm.plan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const updatedRecord = await response.json();
      
      // Update local state
      setMedicalRecords(prev => 
        prev.map(record => 
          record.id === selectedRecord.id ? updatedRecord : record
        )
      );
      setSelectedRecord(updatedRecord);
      
      // Reset form and close modal
      setPlanForm({ plan: "" });
      setPlanModal(false);
      clearErrors();
      showToast('Treatment plan added successfully!', 'success');
    } catch (error) {
      console.error("Failed to add plan:", error);
      setSubmitError(error.message || "Failed to add treatment plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle patient selection for medical records
  const handleViewMedicalRecords = (patient) => {
    setSelectedPatient(patient);
    setSelectedPatientId(patient.id);
    fetchMedicalRecords(patient.id);
    setviewMedicalRecords(true);
  };

  // Handle patient selection for assessment
  const handleAddAssessmentForPatient = (patient) => {
    setSelectedPatient(patient);
    setSelectedPatientId(patient.id);
    fetchMedicalRecords(patient.id);
    setAssessmentModal(true);
  };

  // Handle patient selection for plan
  const handleAddPlanForPatient = (patient) => {
    setSelectedPatient(patient);
    setSelectedPatientId(patient.id);
    fetchMedicalRecords(patient.id);
    setPlanModal(true);
  };

  // Generate medical summary for a patient
  const generateMedicalSummary = (patient, records) => {
    const patientRecords = records.filter(record => record.patient_id === patient.id);
    
    if (patientRecords.length === 0) {
      return {
        totalRecords: 0,
        latestRecord: null,
        medicineHistory: [],
        commonComplaints: [],
        recentAssessments: [],
        timeline: []
      };
    }

    // Sort records by date (newest first)
    const sortedRecords = [...patientRecords].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    // Extract medicine history
    const medicineHistory = sortedRecords
      .filter(record => record.medicine_takes)
      .map(record => ({
        medicine: record.medicine_takes,
        date: record.created_at,
        assessment: record.assessment
      }));

    // Extract common complaints
    const complaints = {};
    sortedRecords.forEach(record => {
      if (record.chief_complaint) {
        const complaint = record.chief_complaint.toLowerCase().trim();
        complaints[complaint] = (complaints[complaint] || 0) + 1;
      }
    });
    
    const commonComplaints = Object.entries(complaints)
      .map(([complaint, count]) => ({ complaint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Extract recent assessments
    const recentAssessments = sortedRecords
      .filter(record => record.assessment)
      .slice(0, 5)
      .map(record => record.assessment);

    // Create timeline
    const timeline = sortedRecords.slice(0, 10).map(record => ({
      title: record.chief_complaint || 'Medical Record',
      date: record.created_at,
      details: {
        assessment: record.assessment,
        medicine: record.medicine_takes
      }
    }));

    return {
      totalRecords: patientRecords.length,
      latestRecord: sortedRecords[0],
      medicineHistory,
      commonComplaints,
      recentAssessments,
      timeline
    };
  };

  // Handle medical summary
  const handleMedicalSummary = (patient) => {
    setSelectedPatient(patient);
    setSelectedPatientId(patient.id);
    fetchMedicalRecords(patient.id);
    setMedicalSummaryModal(true);
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
      </div>
      
      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="patient-list" style={{
        padding: '0 20px'
      }}>
        <div className="table-responsive" style={{ 
          overflowX: 'auto',
          maxWidth: '100%',
          margin: '0 auto',
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
              {currentData.map((patient, index) => (
                <tr key={patient.id || index} style={{
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
                            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                          }
                          .action-buttons button:active {
                            transform: translateY(0);
                          }
                          .action-buttons button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                            transform: none !important;
                          }
                        `}
                      </style>
                      
                      {/* View Patient Button */}
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => {
                          setSelectedPatient({
                              id: patient.id,
                              name: getFullName(patient),
                              gender: patient.gender,
                              birthDate: formatDate(patient.birth_date),
                              barangay: patient.barangay,
                              contactNumber: patient.contact_number,
                              address: patient.address,
                          });
                          setViewModal(true);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                          border: 'none',
                          color: 'white',
                          width: '80px',
                          fontSize: '11px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(23, 162, 184, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title="View patient details and information"
                      >
                        <i className="bi bi-eye-fill" style={{ fontSize: '12px' }}></i>
                        <span>View</span>
                      </button>

                      {/* Medical Summary Button */}
                      <button
                        type="button"
                        className="btn-medical-summary"
                        onClick={() => handleMedicalSummary(patient)}
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
                        title="View comprehensive medical summary for this patient"
                      >
                        <i className="bi bi-file-medical" style={{ fontSize: '11px' }}></i>
                        <span>Summary</span>
                      </button>

                      {/* Assessment Button */}
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleAddAssessmentForPatient(patient)}
                        style={{
                          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                          border: 'none',
                          color: 'white',
                          width: '80px',
                          fontSize: '11px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(0, 123, 255, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title="Add medical assessment for this patient"
                      >
                        <i className="bi bi-clipboard-pulse" style={{ fontSize: '12px' }}></i>
                        <span>Assess</span>
                      </button>
                      
                      {/* Treatment Plan Button */}
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleAddPlanForPatient(patient)}
                        style={{
                          background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
                          border: 'none',
                          color: 'white',
                          width: '80px',
                          fontSize: '11px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title="Add treatment plan for this patient"
                      >
                        <i className="bi bi-clipboard-check" style={{ fontSize: '12px' }}></i>
                        <span>Plan</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Add Patient</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Birth Date</label>
                  <input type="date" className="form-control" required />
                </div>

                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <select className="form-select" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contact Number"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Address"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Barangay</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Barangay"
                    required
                  />
                </div>

                <div className="modal-footer d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary me-2">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {assessmentModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{ 
            maxWidth: '700px',
            width: '90vw',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
                  <i className="bi bi-clipboard-pulse" style={{ fontSize: '14px' }}></i>
                </div>
                <div>
                  <h5 className="modal-title mb-0 fw-bold" style={{ fontSize: '16px' }}>
                    Medical Assessment
                  </h5>
                  <small className="opacity-75" style={{ fontSize: '12px' }}>
                    {selectedPatient?.name}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setAssessmentModal(false);
                  setAssessmentForm({ assessment: "" });
                  clearErrors();
                }}
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
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Loading patient records...</p>
                </div>
              ) : (
                <form onSubmit={handleAddAssessment}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-file-medical me-2"></i>
                      Select Medical Record
                    </label>
                    {medicalRecords.length === 0 ? (
                      <div className="alert alert-warning" style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px',
                        borderLeft: '4px solid #f59e0b'
                      }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        No medical records found for this patient. Please create a medical record first.
                      </div>
                    ) : (
                      <select 
                        className="form-select"
                        value={selectedRecord?.id || ''}
                        onChange={(e) => {
                          const record = medicalRecords.find(r => r.id == e.target.value);
                          setSelectedRecord(record);
                        }}
                        required
                        style={{
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          background: '#fff',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <option value="">Select a medical record</option>
                        {medicalRecords.map((record) => (
                          <option key={record.id} value={record.id}>
                            {record.created_at ? formatDate(record.created_at) : 'Record'} - 
                            {record.chief_complaint ? ` ${record.chief_complaint.substring(0, 30)}...` : ' No complaint'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-clipboard-text me-`2"></i>
                      Medical Assessment
                    </label>
                    <textarea
                      className="form-control"
                      rows="8"
                      placeholder="Enter detailed medical assessment including symptoms, findings, and clinical observations..."
                      name="assessment"
                      value={assessmentForm.assessment}
                      onChange={handleAssessmentChangeWithValidation}
                      onBlur={(e) => validateField('assessment', e.target.value, 'assessment')}
                      required
                      style={{
                        borderColor: errors.assessment ? '#dc2626' : assessmentForm.assessment && !errors.assessment ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.assessment 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : assessmentForm.assessment && !errors.assessment 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                        background: '#fff',
                        resize: 'vertical',
                        minHeight: '120px',
                        transition: 'all 0.2s ease'
                      }}
                    ></textarea>
                    {errors.assessment && (
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
                        {errors.assessment}
                      </div>
                    )}
                    {assessmentForm.assessment && !errors.assessment && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Assessment looks good!
                      </div>
                    )}
                  </div>

                  <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting || medicalRecords.length === 0}
                      style={{
                        background: isSubmitting 
                          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSubmitting 
                          ? '0 2px 8px rgba(156, 163, 175, 0.3)'
                          : '0 4px 15px rgba(59, 130, 246, 0.3)',
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
                          <i className="bi bi-save me-2"></i> Save Assessment
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-3"
                      onClick={() => {
                        setAssessmentModal(false);
                        setAssessmentForm({ assessment: "" });
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
              )}
            </div>
          </div>
        </div>
      )}

      {planModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{ 
            maxWidth: '700px',
            width: '90vw',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="modal-header d-flex justify-content-between align-items-center" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                  <i className="bi bi-clipboard-check" style={{ fontSize: '14px' }}></i>
                </div>
                <div>
                  <h5 className="modal-title mb-0 fw-bold" style={{ fontSize: '16px' }}>
                    Treatment Plan
                  </h5>
                  <small className="opacity-75" style={{ fontSize: '12px' }}>
                    {selectedPatient?.name}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setPlanModal(false);
                  setPlanForm({ plan: "" });
                  clearErrors();
                }}
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
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Loading patient records...</p>
                </div>
              ) : (
                <form onSubmit={handleAddPlan}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-file-medical me-2"></i>
                      Select Medical Record
                    </label>
                    {medicalRecords.length === 0 ? (
                      <div className="alert alert-warning" style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px',
                        borderLeft: '4px solid #f59e0b'
                      }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        No medical records found for this patient. Please create a medical record first.
                      </div>
                    ) : (
                      <select 
                        className="form-select"
                        value={selectedRecord?.id || ''}
                        onChange={(e) => {
                          const record = medicalRecords.find(r => r.id == e.target.value);
                          setSelectedRecord(record);
                        }}
                        required
                        style={{
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          background: '#fff',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <option value="">Select a medical record</option>
                        {medicalRecords.map((record) => (
                          <option key={record.id} value={record.id}>
                            {record.created_at ? formatDate(record.created_at) : 'Record'} - 
                            {record.chief_complaint ? ` ${record.chief_complaint.substring(0, 30)}...` : ' No complaint'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-clipboard-check me-2"></i>
                      Treatment Plan
                    </label>
                    <textarea
                      className="form-control"
                      rows="8"
                      placeholder="Enter detailed treatment plan including medications, procedures, follow-up schedule, and patient instructions..."
                      name="plan"
                      value={planForm.plan}
                      onChange={handlePlanChangeWithValidation}
                      onBlur={(e) => validateField('plan', e.target.value, 'plan')}
                      required
                      style={{
                        borderColor: errors.plan ? '#dc2626' : planForm.plan && !errors.plan ? '#10b981' : '#e5e7eb',
                        boxShadow: errors.plan 
                          ? '0 0 0 3px rgba(220, 38, 38, 0.1)' 
                          : planForm.plan && !errors.plan 
                          ? '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                        background: '#fff',
                        resize: 'vertical',
                        minHeight: '120px',
                        transition: 'all 0.2s ease'
                      }}
                    ></textarea>
                    {errors.plan && (
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
                        {errors.plan}
                      </div>
                    )}
                    {planForm.plan && !errors.plan && (
                      <div style={{ 
                        color: '#059669', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
                        Treatment plan looks good!
                      </div>
                    )}
                  </div>

                  <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={isSubmitting || medicalRecords.length === 0}
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
                          <i className="bi bi-save me-2"></i> Save Plan
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-3"
                      onClick={() => {
                        setPlanModal(false);
                        setPlanForm({ plan: "" });
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
              )}
            </div>
          </div>
        </div>
      )}

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
                onMouseOver={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
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
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0', fontWeight: '700', fontSize: '1.5rem' }}>
                        {selectedPatient.name}
                      </h4>
                      <p style={{ margin: '0.25rem 0 0 0', opacity: '0.9', fontSize: '1rem' }}>
                        Patient ID: #{selectedPatient.id}
              </p>
            </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Last Updated</div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Patient Details Section */}
                <div className="info-section" style={{ padding: '2rem' }}>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        height: '100%'
                      }}>
                        <h6 style={{ 
                          color: '#374151', 
                          fontWeight: '600', 
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <i className="bi bi-person" style={{ color: '#17a2b8' }}></i>
                          Personal Information
                        </h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Full Name:</span>
                            <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedPatient.name}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Gender:</span>
                            <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedPatient.gender}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Birth Date:</span>
                            <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedPatient.birthDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        height: '100%'
                      }}>
                        <h6 style={{ 
                          color: '#374151', 
                          fontWeight: '600', 
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <i className="bi bi-geo-alt" style={{ color: '#17a2b8' }}></i>
                          Contact Information
                        </h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Barangay:</span>
                            <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedPatient.barangay}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Contact:</span>
                            <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedPatient.contactNumber}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontWeight: '500' }}>Address:</span>
                            <span style={{ color: '#1f2937', fontWeight: '600', textAlign: 'right', maxWidth: '60%' }}>{selectedPatient.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              padding: '1.5rem 2.5rem', 
              borderTop: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderRadius: '0 0 16px 16px'
            }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                  onClick={() => setViewModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                onClick={() => handleViewMedicalRecords(selectedPatient)}
                  style={{
                    background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(111, 66, 193, 0.3)',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-file-medical me-2"></i>
                View Medical Records
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMedicalRecords && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded" style={{ 
            maxWidth: '90vw', 
            width: '90vw', 
            minWidth: '800px',
            maxHeight: '90vh',
            height: '90vh'
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
                <h5 className="modal-title mb-0 fw-bold" style={{ fontSize: '16px' }}>{selectedPatient.name}'s Medical Records</h5>
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
                onMouseOver={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body medical-modal-body-gradient" style={{ 
              maxHeight: 'calc(90vh - 120px)', 
              overflowY: 'auto' 
            }}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox display-4 text-muted"></i>
                  <p className="text-muted mt-3 fs-5">No medical records found for this patient.</p>
                  <small className="text-muted">Medical records will appear here once they are created.</small>
                </div>
              ) : (
                <div className="d-flex" style={{minHeight: '400px'}}>
                  {/* Timeline on the left */}
                  <div className="timeline-list" style={{ minWidth: '200px', maxWidth: '250px' }}>
                    <ul className="timeline">
                      {medicalRecords.map((record, idx) => (
                        <li
                          key={record.id}
                          className={selectedRecord && selectedRecord.id === record.id ? "active" : ""}
                          onClick={() => setSelectedRecord(record)}
                        >
                          <span className="timeline-date timeline-date-large">
                            {record.created_at ? formatDate(record.created_at) : 'N/A'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Details on the right */}
                  <div className="timeline-details" style={{ flex: 1, padding: '2rem' }}>
                    {selectedRecord ? (
                      <div>
                        <div className="section-header mb-3">Vitals</div>
                        <div className="medical-records-grid">
                <div className="info-item">
                            <span className="info-label">🌡️ Temperature:</span>
                            <span className="info-value highlight">{selectedRecord.temperature || 'N/A'}</span>
                </div>
                <div className="info-item">
                            <span className="info-label">⚖️ Weight:</span>
                            <span className="info-value">{selectedRecord.weight || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">🎂 Age:</span>
                            <span className="info-value">{selectedRecord.age || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">💨 Respiratory Rate:</span>
                            <span className="info-value">{selectedRecord.respiratory_rate || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">❤️ Cardiac Rate:</span>
                            <span className="info-value">{selectedRecord.cardiac_rate || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">🩸 Blood Pressure:</span>
                            <span className="info-value">{selectedRecord.blood_pressure || 'N/A'}</span>
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
                        <div className="section-header mb-3">Medical Assessment</div>
              <div className="medical-records-grid">
                          <div className="info-item full-width">
                            <span className="info-label">🔍 Assessment:</span>
                            <span className="info-value">{selectedRecord.assessment || 'N/A'}</span>
                </div>
                          <div className="info-item full-width">
                  <span className="info-label">📝 Plan:</span>
                            <span className="info-value">{selectedRecord.plan || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-records">Select a record to view details.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setviewMedicalRecords(false)}
              >
                Close
              </button>
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
                  handleViewMedicalRecords(selectedPatient);
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
