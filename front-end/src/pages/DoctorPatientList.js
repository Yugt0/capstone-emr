import "../styles/PatientList.css";
import { useState } from "react";

export default function PatientList() {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [assessmentModal, setAssessmentModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);

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
      <div className="patient-list">
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
            <tr>
              <td>Frensua D. Yutrago</td>
              <td>Male</td>
              <td>April 22, 2004</td>
              <td>Bigaa</td>
              <td>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => {
                      setSelectedPatient({
                        name: "Frensua D. Yutrago",
                        gender: "Male",
                        birthDate: "April 22, 2004",
                        barangay: "Bigaa",
                        contactNumber: "09123456789",
                        address: "Cabuyao, Laguna",
                      });
                      setViewModal(true);
                    }}
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </button>

                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setAssessmentModal(true)}
                    style={{
                      backgroundColor: "#007bff",
                      width: "100px",
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Add Assessment
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => setPlanModal(true)}
                    style={{
                      backgroundColor: "#28a745",
                      width: "100px",
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Add Plan
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td>Frensua D. Yutrago</td>
              <td>Male</td>
              <td>April 22, 2004</td>
              <td>Bigaa</td>
              <td>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => {
                      setSelectedPatient({
                        name: "Frensua D. Yutrago",
                        gender: "Male",
                        birthDate: "April 22, 2004",
                        barangay: "Bigaa",
                        contactNumber: "09123456789",
                        address: "Cabuyao, Laguna",
                      });
                      setViewModal(true);
                    }}
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </button>

                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setAssessmentModal(true)}
                    style={{
                      backgroundColor: "#007bff",
                      width: "100px",
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Add Assessment
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => setPlanModal(true)}
                    style={{
                      backgroundColor: "#28a745",
                      width: "100px",
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Add Plan
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td>Frensua D. Yutrago</td>
              <td>Male</td>
              <td>April 22, 2004</td>
              <td>Bigaa</td>
              <td>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => {
                      setSelectedPatient({
                        name: "Frensua D. Yutrago",
                        gender: "Male",
                        birthDate: "April 22, 2004",
                        barangay: "Bigaa",
                        contactNumber: "09123456789",
                        address: "Cabuyao, Laguna",
                      });
                      setViewModal(true);
                    }}
                  >
                    <i className="bi bi-eye me-1"></i> View
                  </button>

                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setAssessmentModal(true)}
                    style={{
                      backgroundColor: "#007bff",
                      width: "100px",
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Add Assessment
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => setPlanModal(true)}
                    style={{
                      backgroundColor: "#28a745",
                      width: "100px",
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Add Plan
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Add Assessment</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAssessmentModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Enter assessment..."
                    required
                    style={{ width: "100%" }}
                  ></textarea>
                </div>

                <div className="modal-footer d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary me-2">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAssessmentModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {planModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Add Plan</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPlanModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Enter Plan..."
                    required
                    style={{ width: "100%" }}
                  ></textarea>
                </div>

                <div className="modal-footer d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary me-2">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPlanModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
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
                onClick={() => setviewMedicalRecords(true)}
              >
                View Medical Records
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMedicalRecords && (
        <div className="modal-overlay">
          <div className="modal-content shadow rounded">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Patient Medical Records</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setviewMedicalRecords(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body medical-modal-body-gradient">
              <div className="section-header">Vitals</div>
              <div className="medical-records-grid">
                <div className="info-item">
                  <span className="info-label">🌡️ Temperature:</span>
                  <span className="info-value highlight">41°C</span>
                </div>
                <div className="info-item">
                  <span className="info-label">🧬 Patient History:</span>
                  <span className="info-value">n/a</span>
                </div>
                <div className="info-item">
                  <span className="info-label">⚖️ Weight:</span>
                  <span className="info-value">50kg</span>
                </div>
                <div className="info-item">
                  <span className="info-label">📏 Height:</span>
                  <span className="info-value">5'4"</span>
                </div>
                <div className="info-item">
                  <span className="info-label">🎂 Age:</span>
                  <span className="info-value">21</span>
                </div>
              </div>
              <div className="section-divider"></div>
              <div className="section-header">Doctor Notes</div>
              <div className="medical-records-grid">
                <div className="info-item">
                  <span className="info-label">�� Assessment:</span>
                  <span className="info-value">-Doctor Assessment-</span>
                </div>
                <div className="info-item">
                  <span className="info-label">📝 Plan:</span>
                  <span className="info-value">-Doctor Plan-</span>
                </div>
              </div>
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
