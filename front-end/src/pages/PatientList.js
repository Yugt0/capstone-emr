import "../styles/PatientList.css";
import { useState } from "react";

export default function PatientList() {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMedicalRecords, setviewMedicalRecords] = useState(false);
  const [editModal, setEditModal] = useState(false);

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
        <button
          type="button"
          className="btn-add-patient"
          onClick={() => setShowModal(true)}
        >
          Add Patient
        </button>
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

                  <button type="button" className="btn-edit" onClick = {() => setEditModal(true)}>
                    <i className="bi bi-pencil-square me-1"></i> Edit
                  </button>

                  <button type="button" className="btn-delete">
                    <i className="bi bi-trash me-1"></i> Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td>Frensua D. Yut  rago</td>
              <td>Male</td>
              <td>April 22, 2004</td>
              <td>Bigaa</td>
              <td>
                <div className="action-buttons">
                  <button type="button" className="btn-view">
                    <i className="bi bi-eye me-1"></i> View
                  </button>

                  <button type="button" className="btn-edit">
                    <i className="bi bi-pencil-square me-1"></i> Edit
                  </button>

                  <button type="button" className="btn-delete">
                    <i className="bi bi-trash me-1"></i> Delete
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
                  <button type="button" className="btn-view">
                    <i className="bi bi-eye me-1"></i> View
                  </button>

                  <button type="button" className="btn-edit">
                    <i className="bi bi-pencil-square me-1"></i> Edit
                  </button>

                  <button type="button" className="btn-delete">
                    <i className="bi bi-trash me-1"></i> Delete
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
              <p><strong>Full Name:</strong> {selectedPatient.name}</p>
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
              <p><strong>Birth Date:</strong> {selectedPatient.birthDate}</p>
              <p><strong>Barangay:</strong> {selectedPatient.barangay}</p>
              <p><strong>Contact Number:</strong> {selectedPatient.contactNumber}</p>
              <p><strong>Address:</strong> {selectedPatient.address}</p>
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
            <div className="modal-body">
              <p><strong>Temperature: </strong> 41 </p>
              <p><strong>Patient History: </strong> n/a </p>
              <p><strong>Weight: </strong> 50kg </p>
              <p><strong>Height: </strong> 5'4 </p>
              <p><strong>Age: </strong> 21 </p>
              <p><strong>Assessment: </strong> -Doctor Assessment- </p>
              <p><strong>Plan: </strong> -Doctor Plan- </p>


            </div>
            <div className="modal-footer d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewModal(false)}
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
