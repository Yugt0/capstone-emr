import "../styles/PatientList.css";
import "../styles/Modal.css";
import { useState, useEffect } from "react";

const PATIENTS_API = "http://127.0.0.1:8000/api/patients";
const MEDICAL_RECORDS_API = "http://127.0.0.1:8000/api/patient-medical-records";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addMedicalRecordModal, setAddMedicalRecordModal] = useState(false);
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(null);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(0);
  const [form, setForm] = useState({});
  const [recordForm, setRecordForm] = useState({});
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Fetch patients and their medical records
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

  const handleSearch = () => {
    setFilteredPatients(
      patients.filter((patient) => {
        const nameMatch = patient.full_name.toLowerCase().includes(searchName.toLowerCase());
        if (searchDate) {
          return nameMatch && patient.birth_date === searchDate;
        }
        return nameMatch;
      })
    );
  };

  // Reset search fields and show all patients
  const handleReset = () => {
    setSearchName("");
    setSearchDate("");
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
    let dataToSend = { ...form };
    if (dataToSend.birth_date) {
      // Ensure the date is in YYYY-MM-DD format
      const d = new Date(dataToSend.birth_date);
      if (!isNaN(d)) {
        dataToSend.birth_date = d.toISOString().slice(0, 10);
      }
    }
    console.log('Submitting patient:', dataToSend);
    try {
      const res = await fetch(PATIENTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) throw new Error("Failed to add patient");
      setShowModal(false);
      setForm({});
      fetchPatients();
    } catch (err) {
      alert("Failed to add patient");
    }
  };

  // Edit Patient
  const handleEditPatient = async (e) => {
    e.preventDefault();
    const patient = patients[selectedPatientIdx];
    try {
      const res = await fetch(`${PATIENTS_API}/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update patient");
      setEditModal(false);
      setForm({});
      fetchPatients();
    } catch (err) {
      alert("Failed to update patient");
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
    const patient = patients[selectedPatientIdx];
    // Prepare flat payload
    const payload = {
      patient_id: patient.id,
      temperature: recordForm.temperature,
      weight: recordForm.weight,
      age: recordForm.age,
      respiratory_rate: recordForm.respiratory_rate,
      cardiac_rate: recordForm.cardiac_rate,
      blood_pressure: recordForm.blood_pressure,
      chief_complaint: recordForm.chief_complaint,
      patient_history: recordForm.patient_history,
      history_of_present_illness: recordForm.history_of_present_illness,
      assessment: recordForm.assessment,
      plan: recordForm.plan
    };
    try {
      const res = await fetch(MEDICAL_RECORDS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add medical record");
      setAddMedicalRecordModal(false);
      setRecordForm({});
      fetchMedicalRecords(patient.id);
    } catch (err) {
      alert("Failed to add medical record");
    }
  };

  // Edit Medical Record
  const handleEditMedicalRecord = async (e) => {
    e.preventDefault();
    const patient = patients[selectedPatientIdx];
    const record = medicalRecords[selectedRecordIdx];
    try {
      const res = await fetch(`${MEDICAL_RECORDS_API}/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordForm),
      });
      if (!res.ok) throw new Error("Failed to update medical record");
      setAddMedicalRecordModal(false);
      setRecordForm({});
      fetchMedicalRecords(patient.id);
    } catch (err) {
      alert("Failed to update medical record");
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

  // Handlers for form changes
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleRecordFormChange = (e) => {
    setRecordForm({ ...recordForm, [e.target.name]: e.target.value });
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

  return (
    <div className="patient-list-container">
      <h3 className="page-label">Patient List</h3>
      <div className="search-and-add-container">
        <form className="search-container d-flex align-items-end mb-3" style={{gap: '1rem'}} onSubmit={e => {e.preventDefault(); handleSearch();}}>
          <div className="search-input-container flex-column" style={{background: 'none', boxShadow: 'none', border: 'none', minWidth: '200px'}}>
            <label htmlFor="searchName" style={{fontWeight: 500, marginBottom: 4}}>Name</label>
            <input
              id="searchName"
              type="text"
              className="search-input"
              placeholder="Enter patient name..."
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
          <button
            className="btn-search"
            type="submit"
            style={{marginRight: 8}}
          >
            Search
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleReset}
            style={{borderRadius: 999, padding: '0.5rem 1.2rem', fontWeight: 500, background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb'}}>
            Reset
          </button>
        </form>
        <div style={{marginTop: '0.5rem',marginRight: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
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
        <div className="patient-list">
          <div className="scrollable-table">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Date of birth</th>
                  <th>Baranggay</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, idx) => (
                  <tr key={patient.id}>
                    <td>{patient.full_name}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.birth_date}</td>
                    <td>{patient.barangay}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-view"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            setViewModal(true);
                          }}
                        >
                          <i className="bi bi-eye me-1"></i> View
                        </button>
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => {
                            setSelectedPatientIdx(patients.findIndex(p => p.id === patient.id));
                            setForm(patient);
                            setEditModal(true);
                          }}
                        >
                          <i className="bi bi-pencil-square me-1"></i> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDeletePatient(patients.findIndex(p => p.id === patient.id))}
                        >
                          <i className="bi bi-trash me-1"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
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
              <form onSubmit={handleAddPatient}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    name="full_name"
                    value={form.full_name || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Birth Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="birth_date"
                    value={form.birth_date || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleFormChange}
                    required
                  >
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

      {/* Edit Patient Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Edit Patient</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditPatient}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    name="full_name"
                    value={form.full_name || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Birth Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="birth_date"
                    value={form.birth_date || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleFormChange}
                    required
                  >
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
                <div className="modal-footer d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary me-2">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditModal(false)}
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
          <div className="modal-content shadow rounded patient-info-modal">
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
              <p><strong>Full Name:</strong> {selectedPatient.full_name}</p>
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
              <p><strong>Birth Date:</strong> {selectedPatient.birth_date}</p>
              <p><strong>Barangay:</strong> {selectedPatient.barangay}</p>
              <p><strong>Contact Number:</strong> {selectedPatient.contact_number}</p>
              <p><strong>Address:</strong> {selectedPatient.address}</p>
            </div>
            <div className="modal-footer d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleViewMedicalRecords(patients.findIndex(p => p.id === selectedPatient.id))}
              >
                View Medical Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Records Modal */}
      {viewMedicalRecords && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded medical-records-modal">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">{selectedPatient.full_name}'s Medical Records</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setviewMedicalRecords(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body medical-modal-body-gradient">
              <div className="d-flex justify-content-end mb-4">
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
              <div className="d-flex" style={{minHeight: '300px'}}>
                {/* Timeline on the left */}
                <div className="timeline-list">
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
                          <span className="timeline-date timeline-date-large">{rec.created_at ? rec.created_at.slice(0, 10) : ''}</span>
                          <button
                            className="btn btn-sm btn-outline-danger ms-2 timeline-delete-btn"
                            onClick={e => { e.stopPropagation(); handleDeleteMedicalRecord(idx); }}
                            title="Delete Record"
                            style={{ verticalAlign: 'middle' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Details on the right */}
                <div className="timeline-details flex-grow-1 ms-4">
                  {selectedRecord ? (
                    <>
                      <div className="d-flex align-items-center mb-2">
                        <div className="me-auto section-header">Vitals</div>
                        <div className="record-date-badge">{selectedRecord.date}</div>
                      </div>
                      <div className="medical-records-grid">
                        <div className="info-item">
                          <span className="info-label">🌡️ Temperature:</span>
                          <span className="info-value highlight">{selectedRecord.vitals?.temperature || selectedRecord.temperature}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🧬 Patient History:</span>
                          <span className="info-value">{selectedRecord.patient_history}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">⚖️ Weight:</span>
                          <span className="info-value">{selectedRecord.vitals?.weight || selectedRecord.weight}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🎂 Age:</span>
                          <span className="info-value">{selectedRecord.vitals?.age || selectedRecord.age}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">💨 Respiratory Rate:</span>
                          <span className="info-value">{selectedRecord.respiratory_rate}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">❤️ Cardiac Rate:</span>
                          <span className="info-value">{selectedRecord.cardiac_rate}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🩸 Blood Pressure:</span>
                          <span className="info-value">{selectedRecord.blood_pressure}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🗣️ Chief Complaint:</span>
                          <span className="info-value">{selectedRecord.chief_complaint}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">📖 History of Present Illness:</span>
                          <span className="info-value">{selectedRecord.history_of_present_illness}</span>
                        </div>
                      </div>
                      <div className="section-divider"></div>
                      <div className="section-header mb-2">Doctor Notes</div>
                      <div className="medical-records-grid">
                        <div className="info-item">
                          <span className="info-label">🩺 Assessment:</span>
                          <span className="info-value">{selectedRecord.doctorNotes?.assessment || selectedRecord.assessment}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">📝 Plan:</span>
                          <span className="info-value">{selectedRecord.doctorNotes?.plan || selectedRecord.plan}</span>
                        </div>
                      </div>
                    </>
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
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Add Medical Record for {selectedPatient.full_name}</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAddMedicalRecordModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddMedicalRecord}>
                <div className="section-header mb-2">Vitals</div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Temperature</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 37°C"
                      name="temperature"
                      value={recordForm.temperature || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Weight</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 60kg"
                      name="weight"
                      value={recordForm.weight || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Age</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 25"
                      name="age"
                      value={recordForm.age || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Respiratory Rate</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 18 breaths/min"
                      name="respiratory_rate"
                      value={recordForm.respiratory_rate || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cardiac Rate</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 75 bpm"
                      name="cardiac_rate"
                      value={recordForm.cardiac_rate || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Blood Pressure</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 120/80 mmHg"
                      name="blood_pressure"
                      value={recordForm.blood_pressure || ""}
                      onChange={handleRecordFormChange}
                      required
                    />
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
                <div className="section-header mb-2">Doctor Notes</div>
                <div className="mb-3">
                  <label className="form-label">Assessment</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter doctor's assessment..."
                    name="assessment"
                    value={recordForm.assessment || ""}
                    onChange={handleRecordFormChange}
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Plan</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter treatment plan..."
                    name="plan"
                    value={recordForm.plan || ""}
                    onChange={handleRecordFormChange}
                    required
                  ></textarea>
                </div>
                <div className="modal-footer d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary me-2">
                    <i className="bi bi-save me-1"></i> Save Record
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAddMedicalRecordModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
