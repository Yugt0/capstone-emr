import "../styles/PatientList.css";
import { useState, useEffect } from "react";

const PATIENTS_API = "http://127.0.0.1:8000/api/patients";
const MEDICAL_RECORDS_API = "http://127.0.0.1:8000/api/patient-medical-records";

export default function PatientList() {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [assessmentModal, setAssessmentModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({ assessment: "" });
  const [planForm, setPlanForm] = useState({ plan: "" });
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Pagination calculations
  const totalEntries = patients.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = patients.slice(startIndex, endIndex);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [patients, rowsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
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
    
    if (!selectedPatientId || !selectedRecord) {
      alert("Please select a patient and medical record first.");
      return;
    }

    if (!assessmentForm.assessment.trim()) {
      alert("Please enter an assessment.");
      return;
    }

    try {
      setLoading(true);
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
        throw new Error("Failed to update assessment");
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
      
      alert("Assessment added successfully!");
    } catch (error) {
      console.error("Failed to add assessment:", error);
      alert("Failed to add assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    
    if (!selectedPatientId || !selectedRecord) {
      alert("Please select a patient and medical record first.");
      return;
    }

    if (!planForm.plan.trim()) {
      alert("Please enter a treatment plan.");
      return;
    }

    try {
      setLoading(true);
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
        throw new Error("Failed to update plan");
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
      
      alert("Treatment plan added successfully!");
    } catch (error) {
      console.error("Failed to add plan:", error);
      alert("Failed to add treatment plan. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="patient-list-container">
      <h3 className="page-label">Patient List</h3>
      <div className="search-and-add-container d-flex justify-content-between align-items-center">
        <div className="search-container d-flex justify-content-between align-items-center mb-3">
          <div className="search-input-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
            />
          </div>
          <div className="date-search-container">
            <input type="date" className="date-input" placeholder="Birthdate" />
          </div>
          <button className="btn-search" type="button">
            Search
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="patient-list">
        <div className="table-responsive" style={{ 
          overflowX: 'auto',
          maxWidth: '100%',
          margin: '0 auto'
        }}>
          <table className="table table-bordered" style={{
            minWidth: '800px',
            width: '100%',
            margin: '0'
          }}>
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Name</th>
                <th style={{ minWidth: '80px' }}>Gender</th>
                <th style={{ minWidth: '120px' }}>Date of birth</th>
                <th style={{ minWidth: '150px' }}>Baranggay</th>
                <th style={{ minWidth: '400px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((patient, index) => (
                <tr key={patient.id || index}>
                  <td style={{ wordWrap: 'break-word', maxWidth: '150px' }}>{patient.full_name}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.birth_date}</td>
                  <td style={{ wordWrap: 'break-word', maxWidth: '150px' }}>{patient.barangay}</td>
                  <td>
                    <div className="action-buttons" style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => {
                          setSelectedPatient({
                              id: patient.id,
                              name: patient.full_name,
                              gender: patient.gender,
                              birthDate: patient.birth_date,
                              barangay: patient.barangay,
                              contactNumber: patient.contact_number,
                              address: patient.address,
                          });
                          setViewModal(true);
                        }}
                        style={{
                          minWidth: '80px',
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </button>

                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleAddAssessmentForPatient(patient)}
                        style={{
                          backgroundColor: "#007bff",
                          minWidth: '120px',
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}
                      >
                        <i className="bi bi-pencil-square me-1"></i> Assessment
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleAddPlanForPatient(patient)}
                        style={{
                          backgroundColor: "#28a745",
                          minWidth: '100px',
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}
                      >
                        <i className="bi bi-check-circle me-1"></i> Plan
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
            <div className="d-flex align-items-center gap-2">
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
              
              {/* Page numbers - simplified like the image */}
              <div className="d-flex align-items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const isCurrentPage = pageNumber === currentPage;
                  
                  // Show all page numbers for simplicity (like the image)
                  return (
                    <button
                      key={pageNumber}
                      className={`btn btn-sm ${isCurrentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handlePageChange(pageNumber)}
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
                      {pageNumber}
                    </button>
                  );
                })}
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
                  <i className="bi bi-clipboard-pulse" style={{ fontSize: '18px' }}></i>
                </div>
                <div>
                  <h5 className="modal-title mb-0 fw-bold">
                    Medical Assessment
                  </h5>
                  <small className="opacity-75">
                    {selectedPatient?.full_name || selectedPatient?.name}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setAssessmentModal(false);
                  setAssessmentForm({ assessment: "" });
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
                            {record.created_at ? record.created_at.slice(0, 10) : 'Record'} - 
                            {record.chief_complaint ? ` ${record.chief_complaint.substring(0, 30)}...` : ' No complaint'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#374151', fontSize: '14px' }}>
                      <i className="bi bi-clipboard-text me-2"></i>
                      Medical Assessment
                    </label>
                    <textarea
                      className="form-control"
                      rows="8"
                      placeholder="Enter detailed medical assessment including symptoms, findings, and clinical observations..."
                      name="assessment"
                      value={assessmentForm.assessment}
                      onChange={handleAssessmentChange}
                      required
                      style={{
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                        background: '#fff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        resize: 'vertical',
                        minHeight: '120px'
                      }}
                    ></textarea>
                  </div>

                  <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading || medicalRecords.length === 0}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <i className="bi bi-save me-2"></i> Save Assessment
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-3"
                      onClick={() => {
                        setAssessmentModal(false);
                        setAssessmentForm({ assessment: "" });
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
                  <i className="bi bi-clipboard-check" style={{ fontSize: '18px' }}></i>
                </div>
                <div>
                  <h5 className="modal-title mb-0 fw-bold">
                    Treatment Plan
                  </h5>
                  <small className="opacity-75">
                    {selectedPatient?.full_name || selectedPatient?.name}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setPlanModal(false);
                  setPlanForm({ plan: "" });
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
                            {record.created_at ? record.created_at.slice(0, 10) : 'Record'} - 
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
                      onChange={handlePlanChange}
                      required
                      style={{
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                        background: '#fff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        resize: 'vertical',
                        minHeight: '120px'
                      }}
                    ></textarea>
                  </div>

                  <div className="modal-footer d-flex justify-content-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={loading || medicalRecords.length === 0}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <i className="bi bi-save me-2"></i> Save Plan
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-3"
                      onClick={() => {
                        setPlanModal(false);
                        setPlanForm({ plan: "" });
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
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Patient Information</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Full Name:</strong> {selectedPatient.name}
              </p>
              <p>
                <strong>Gender:</strong> {selectedPatient.gender}
              </p>
              <p>
                <strong>Birth Date:</strong> {selectedPatient.birthDate}
              </p>
              <p>
                <strong>Barangay:</strong> {selectedPatient.barangay}
              </p>
              <p>
                <strong>Contact Number:</strong> {selectedPatient.contactNumber}
              </p>
              <p>
                <strong>Address:</strong> {selectedPatient.address}
              </p>
            </div>
            <div className="modal-footer d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleViewMedicalRecords(selectedPatient)}
              >
                View Medical Records
              </button>
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
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">{selectedPatient.name}'s Medical Records</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setviewMedicalRecords(false)}
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
                            {record.created_at ? record.created_at.slice(0, 10) : 'N/A'}
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
    </div>
  );
}
