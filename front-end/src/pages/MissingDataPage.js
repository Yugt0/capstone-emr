import "../styles/PatientList.css";
import "../styles/Modal.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from '../services/api';

export default function MissingDataPage() {
  const { user, getToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missingDataPatients, setMissingDataPatients] = useState([]);
  
  // Search and filter states
  const [searchName, setSearchName] = useState("");
  const [searchGender, setSearchGender] = useState("");
  const [filterMissingType, setFilterMissingType] = useState(""); // 'assessment', 'plan', 'medication', or ''
  const [filteredPatients, setFilteredPatients] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Get full name from patient data
  const getFullName = (patient) => {
    if (!patient) return '';
    const parts = [];
    if (patient.first_name) parts.push(patient.first_name);
    if (patient.middle_name) parts.push(patient.middle_name);
    if (patient.last_name) parts.push(patient.last_name);
    return parts.join(' ');
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

  // Fetch patients and their medical records
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching patients data...');
        const patientsData = await api.getPatientInformation();
        console.log('Fetched patients:', patientsData);
        setPatients(patientsData);
        
        // Fetch all medical records at once
        console.log('Fetching all medical records...');
        const allMedicalRecords = await api.getMedicalRecords();
        console.log('Fetched all medical records:', allMedicalRecords);
        
        // Group medical records by patient_id
        const recordsByPatient = {};
        allMedicalRecords.forEach(record => {
          if (!recordsByPatient[record.patient_id]) {
            recordsByPatient[record.patient_id] = [];
          }
          recordsByPatient[record.patient_id].push(record);
        });
        
        // Check each patient's medical records for missing data
        const missingData = [];
        
        patientsData.forEach(patient => {
          const medicalRecords = recordsByPatient[patient.id] || [];
          
          // Check each medical record for missing data
          const recordsWithMissingData = medicalRecords.map(record => {
            const missing = [];
            if (!record.assessment || record.assessment.trim() === '') {
              missing.push('assessment');
            }
            if (!record.plan || record.plan.trim() === '') {
              missing.push('plan');
            }
            if (!record.medicine_takes || record.medicine_takes.trim() === '') {
              missing.push('medication');
            }
            
            return {
              record,
              missing
            };
          }).filter(item => item.missing.length > 0);
          
          if (recordsWithMissingData.length > 0) {
            missingData.push({
              patient,
              recordsWithMissingData,
              totalMissingRecords: recordsWithMissingData.length,
              missingAssessment: recordsWithMissingData.filter(r => r.missing.includes('assessment')).length,
              missingPlan: recordsWithMissingData.filter(r => r.missing.includes('plan')).length,
              missingMedication: recordsWithMissingData.filter(r => r.missing.includes('medication')).length
            });
          }
        });
        
        console.log('Missing data analysis complete:', missingData);
        setMissingDataPatients(missingData);
        setFilteredPatients(missingData);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Failed to fetch data: ${error.message || 'Unknown error'}. Please check the console for details.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter patients based on search and filters
  useEffect(() => {
    let filtered = [...missingDataPatients];
    
    // Search by name
    if (searchName) {
      filtered = filtered.filter(item => {
        const fullName = getFullName(item.patient).toLowerCase();
        return fullName.includes(searchName.toLowerCase());
      });
    }
    
    // Filter by gender
    if (searchGender) {
      filtered = filtered.filter(item => {
        return item.patient.gender?.toLowerCase() === searchGender.toLowerCase();
      });
    }
    
    // Filter by missing type
    if (filterMissingType) {
      filtered = filtered.filter(item => {
        switch (filterMissingType) {
          case 'assessment':
            return item.missingAssessment > 0;
          case 'plan':
            return item.missingPlan > 0;
          case 'medication':
            return item.missingMedication > 0;
          default:
            return true;
        }
      });
    }
    
    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchName, searchGender, filterMissingType, missingDataPatients]);

  // Pagination calculations
  const totalEntries = filteredPatients.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredPatients.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  // Reset filters
  const handleReset = () => {
    setSearchName("");
    setSearchGender("");
    setFilterMissingType("");
    setFilteredPatients(missingDataPatients);
  };

  // Get missing data badge color
  const getMissingBadgeColor = (type) => {
    switch (type) {
      case 'assessment':
        return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'plan':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'medication':
        return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
      default:
        return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  };

  // Navigate to doctor patient list with patient ID
  const handleViewMedicalRecords = (patientId) => {
    navigate(`/doctor-patient-list?patientId=${patientId}`);
  };

  return (
    <div className="patient-list-container">
      <style>
        {`
          .missing-data-container {
            padding: 1rem;
            background: #ffffff;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: visible;
          }
          
          .header-section {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.8);
            margin-bottom: 1rem;
          }
          
          .page-label {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
          }
          
          .search-filters-section {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.8);
            margin-bottom: 1rem;
          }
          
          .table-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(226, 232, 240, 0.8);
            overflow: visible;
          }
          
          .table-wrapper {
            overflow-x: auto;
            overflow-y: visible;
            width: 100%;
            max-width: 100%;
            -webkit-overflow-scrolling: touch;
          }
          
          .table-wrapper::-webkit-scrollbar {
            height: 8px;
          }
          
          .table-wrapper::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .table-wrapper::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
          }
          
          .table-wrapper::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
          
          .table-wrapper table {
            min-width: 1350px;
            width: 100%;
            table-layout: auto;
          }
          
          .table-wrapper th:nth-child(1),
          .table-wrapper td:nth-child(1) {
            min-width: 200px;
          }
          
          .table-wrapper th:nth-child(2),
          .table-wrapper td:nth-child(2) {
            min-width: 100px;
          }
          
          .table-wrapper th:nth-child(3),
          .table-wrapper td:nth-child(3) {
            min-width: 80px;
          }
          
          .table-wrapper th:nth-child(4),
          .table-wrapper td:nth-child(4) {
            min-width: 150px;
          }
          
          .table-wrapper th:nth-child(5),
          .table-wrapper td:nth-child(5) {
            min-width: 250px;
          }
          
          .table-wrapper th:nth-child(6),
          .table-wrapper td:nth-child(6) {
            min-width: 400px;
          }
          
          .table-wrapper th:nth-child(7),
          .table-wrapper td:nth-child(7) {
            min-width: 150px;
          }
          
          .missing-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            margin: 2px;
          }
          
          .record-details {
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 4px;
          }
          
          .record-item {
            padding: 4px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .record-item:last-child {
            border-bottom: none;
          }
        `}
      </style>

      <div className="missing-data-container">
        <div className="header-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-label">
                <i className="bi bi-exclamation-triangle-fill me-3 text-danger"></i>
                Missing Medical Data
              </h1>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Patients with incomplete medical records (missing assessment, plan, or medication)
              </p>
            </div>
            <div className="text-end">
              <div className="text-muted small">Last updated</div>
              <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="search-filters-section">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-person-search me-1"></i>
                Search Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search patient name..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  height: '42px'
                }}
              />
            </div>
            <div className="col-md-3">
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
                  height: '42px'
                }}
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: '#374151' }}>
                <i className="bi bi-funnel me-1"></i>
                Missing Type
              </label>
              <select
                className="form-select"
                value={filterMissingType}
                onChange={e => setFilterMissingType(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  height: '42px'
                }}
              >
                <option value="">All Types</option>
                <option value="assessment">Missing Assessment</option>
                <option value="plan">Missing Plan</option>
                <option value="medication">Missing Medication</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold" style={{ fontSize: '0.875rem', color: 'transparent' }}>
                Actions
              </label>
              <button
                className="btn btn-outline-secondary"
                onClick={handleReset}
                style={{
                  borderRadius: '8px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  height: '42px',
                  width: '100%'
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
            <span className="text-muted fw-semibold" style={{ fontSize: '0.875rem' }}>
              <i className="bi bi-people-fill me-2"></i>
              {filteredPatients.length} patients with missing data found
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading missing data...</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      <i className="bi bi-person me-1"></i>
                      Patient Name
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      <i className="bi bi-gender-ambiguous me-1"></i>
                      Gender
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      <i className="bi bi-calendar-event me-1"></i>
                      Age
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      <i className="bi bi-file-medical me-1"></i>
                      Missing Records
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Missing Types
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                      <i className="bi bi-list-ul me-1"></i>
                      Record Details
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: '700', textAlign: 'center' }}>
                      <i className="bi bi-gear me-1"></i>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mt-3 text-muted">No Missing Data Found</h5>
                        <p className="text-muted">
                          {filteredPatients.length === 0 && missingDataPatients.length > 0
                            ? 'No patients match your current filters.'
                            : 'All medical records are complete!'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentData.map((item) => (
                      <tr key={item.patient.id}>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {getFullName(item.patient)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ID: #{item.patient.id}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span className="badge bg-secondary">
                            {item.patient.gender || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          {calculatePatientAge(item.patient.birth_date)} years
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span className="badge bg-danger" style={{ fontSize: '0.875rem' }}>
                            {item.totalMissingRecords} record{item.totalMissingRecords !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {item.missingAssessment > 0 && (
                              <span 
                                className="missing-badge"
                                style={{ background: getMissingBadgeColor('assessment') }}
                              >
                                Assessment ({item.missingAssessment})
                              </span>
                            )}
                            {item.missingPlan > 0 && (
                              <span 
                                className="missing-badge"
                                style={{ background: getMissingBadgeColor('plan') }}
                              >
                                Plan ({item.missingPlan})
                              </span>
                            )}
                            {item.missingMedication > 0 && (
                              <span 
                                className="missing-badge"
                                style={{ background: getMissingBadgeColor('medication') }}
                              >
                                Medication ({item.missingMedication})
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div className="record-details">
                            {item.recordsWithMissingData.map((recordItem, idx) => (
                              <div key={idx} className="record-item">
                                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                  Record #{idx + 1} - {formatDate(recordItem.record.created_at)}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {recordItem.missing.map(type => (
                                    <span 
                                      key={type}
                                      className="missing-badge"
                                      style={{ background: getMissingBadgeColor(type) }}
                                    >
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </span>
                                  ))}
                                </div>
                                {recordItem.record.chief_complaint && (
                                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px', fontStyle: 'italic' }}>
                                    Complaint: {recordItem.record.chief_complaint.substring(0, 50)}
                                    {recordItem.record.chief_complaint.length > 50 ? '...' : ''}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleViewMedicalRecords(item.patient.id)}
                            style={{
                              background: '#10b981',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              color: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#059669';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#10b981';
                            }}
                          >
                            <i className="bi bi-file-medical" style={{ fontSize: '0.875rem' }}></i>
                            <span>Fill Data</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-section" style={{
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
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
                      fontSize: '0.75rem'
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div className="d-flex align-items-center gap-1">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      borderRadius: '6px',
                      padding: '0.375rem 0.5rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${pageNum === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '13px',
                          minWidth: '36px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      borderRadius: '6px',
                      padding: '0.375rem 0.5rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

