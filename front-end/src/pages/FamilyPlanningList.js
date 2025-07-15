import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Row, Col, InputGroup, FormControl } from "react-bootstrap";
import "../styles/Modal.css";

const API_URL = "http://localhost:8000/api/family-planning-clients";

const initialForm = {
  registrationDate: "",
  familySerial: "",
  name: "",
  address: "",
  dob: "",
  type: "",
  source: "",
  previousMethod: "",
  followUp: {
    Jan: { scheduled: "", actual: "" },
    Feb: { scheduled: "", actual: "" },
    Mar: { scheduled: "", actual: "" },
    Apr: { scheduled: "", actual: "" },
    May: { scheduled: "", actual: "" },
    Jun: { scheduled: "", actual: "" },
    Jul: { scheduled: "", actual: "" },
    Aug: { scheduled: "", actual: "" },
    Sep: { scheduled: "", actual: "" },
    Oct: { scheduled: "", actual: "" },
    Nov: { scheduled: "", actual: "" },
    Dec: { scheduled: "", actual: "" },
  },
  dropOutDate: "",
  dropOutReason: "",
  deworm1: { scheduled: ""},
  deworm2: { scheduled: ""},
  remarks: ""
};

const allMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const fillFollowUp = (followUp = {}) => {
  const filled = {};
  allMonths.forEach(month => {
    filled[month] = {
      scheduled: followUp[month]?.scheduled ?? "",
      actual: followUp[month]?.actual ?? ""
    };
  });
  return filled;
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function toInputDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function toBackendDate(dateStr) {
  if (!dateStr) return null;
  // Accepts both '2025-07-30' and '2025-07-30T00:00:00.000000Z'
  return dateStr.split("T")[0];
}

export default function FamilyPlanningList() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Fetch all clients from backend
  const fetchClients = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filtered clients based on search
  const filteredClients = clients.filter(c => {
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.address?.toLowerCase().includes(s) ||
      c.family_serial?.toLowerCase().includes(s)
    );
  });

  // Open modal for add or edit
  const openModal = (client, idx) => {
    if (client) {
      // Debug log
      // Parse follow_up if it's a string
      let followUpData = client.follow_up;
      if (typeof followUpData === 'string') {
        try {
          followUpData = JSON.parse(followUpData);
        } catch {
          followUpData = {};
        }
      }
      
      // Parse deworming if it's a string
      let dewormingData = client.deworming;
      if (typeof dewormingData === 'string') {
        try {
          dewormingData = JSON.parse(dewormingData);
        } catch {
          dewormingData = {};
        }
      }
      
      setForm({
        registrationDate: client.registration_date || "",
        familySerial: client.family_serial || "",
        name: client.name || "",
        address: client.address || "",
        dob: client.dob || "",
        type: client.type || "",
        source: client.source || "",
        previousMethod: client.previous_method || "",
        followUp: fillFollowUp(followUpData),
        dropOutDate: client.drop_out_date || "",
        dropOutReason: client.drop_out_reason || "",
        deworm1: (dewormingData && dewormingData.deworm1) ? dewormingData.deworm1 : { scheduled: ""},
        deworm2: (dewormingData && dewormingData.deworm2) ? dewormingData.deworm2 : { scheduled: ""},
        remarks: client.remarks || ""
      });
    } else {
      setForm(initialForm);
    }
    setEditingIndex(idx);
    setShowModal(true);
  };

  // Save (add or update)
  const handleSave = async () => {
    // Format all date fields for backend
    const formattedFollowUp = {};
    Object.keys(form.followUp).forEach(month => {
      formattedFollowUp[month] = {
        scheduled: toBackendDate(form.followUp[month].scheduled),
        actual: toBackendDate(form.followUp[month].actual)
      };
    });
    const dbData = {
      registration_date: toBackendDate(form.registrationDate),
      family_serial: form.familySerial,
      name: form.name,
      address: form.address,
      dob: toBackendDate(form.dob),
      type: form.type,
      source: form.source,
      previous_method: form.previousMethod,
      follow_up: formattedFollowUp,
      drop_out_date: toBackendDate(form.dropOutDate),
      drop_out_reason: form.dropOutReason,
      deworming: {
        deworm1: {
          scheduled: toBackendDate(form.deworm1.scheduled)
        },
        deworm2: {
          scheduled: toBackendDate(form.deworm2.scheduled)
        }
      },
      remarks: form.remarks,
    };
    console.log('Saving dbData:', dbData);
    try {
      let res;
      if (editingIndex !== null && clients[editingIndex]?.id) {
        // Update
        res = await fetch(`${API_URL}/${clients[editingIndex].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbData),
        });
      } else {
        // Create
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbData),
        });
      }
      if (!res.ok) throw new Error("Failed to save client");
      setShowModal(false);
      setForm(initialForm);
      setEditingIndex(null);
      fetchClients();
    } catch (err) {
      alert("Failed to save client. Please check your input and try again.");
      console.error(err);
    }
  };

  // Delete
  const handleDelete = async (idx) => {
    if (window.confirm("Delete this record?")) {
      try {
        const id = clients[idx].id;
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete client");
        fetchClients();
      } catch (err) {
        alert("Failed to delete client.");
        console.error(err);
      }
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [field, subfield] = name.split('.');
      if (field in form.followUp) {
        setForm({ 
          ...form, 
          followUp: { 
            ...form.followUp, 
            [field]: { ...form.followUp[field], [subfield]: value } 
          } 
        });
      } else if (field === 'deworm1' || field === 'deworm2') {
        setForm(prev => {
          const updated = { 
            ...prev, 
            [field]: { ...prev[field], [subfield]: value } 
          };
          console.log('Form after deworm change:', updated);
          return updated;
        });
      }
    } else {
      setForm(prev => {
        const updated = { ...prev, [name]: value };
        console.log('Form after change:', updated);
        return updated;
      });
    }
  };

  return (
    <div className="container-fluid my-5 p-10">
      <h2 className="mb-4">Target Client List for Family Planning Services</h2>
      <div className="d-flex align-items-center mb-3" style={{ gap: 16 }}>
        {/* Search Bar with Button */}
        <Form
          className="d-flex mb-0 w-50"
          onSubmit={e => {
            e.preventDefault();
            setSearch(searchInput);
          }}
        >
          <InputGroup>
            <FormControl
              placeholder="Search by name, address, or family serial..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <Button variant="primary" type="submit">Search</Button>
          </InputGroup>
        </Form>
        <div className="ms-auto" style={{ marginRight: 90 }}>
          <Button
            variant="success"
            onClick={() => openModal(null, null)}
            style={{ borderRadius: 20, fontWeight: 600, minWidth: 160 }}
          >
            + Add Client
          </Button>
        </div>
      </div>
      <div style={{ overflowX: 'auto', width: '95%' }}>
        <Table striped bordered hover responsive className="mt-3 family-planning-table">
          <thead>
            <tr>
              <th rowSpan={3}>No.</th>
              <th rowSpan={3}>Date of Registration</th>
              <th rowSpan={3}>Family Serial No.</th>
              <th rowSpan={3}>Complete Name</th>
              <th rowSpan={3}>Complete Address</th>
              <th rowSpan={3}>Age/Date of Birth</th>
              <th rowSpan={3}>Type of Client</th>
              <th rowSpan={3}>Source</th>
              <th rowSpan={3}>Previous Method</th>
              <th colSpan={24} style={{ textAlign: 'center' }}>
                FOLLOW-UP VISITS
                <div style={{ fontWeight: 'normal', fontSize: '0.85em' }}>
                  (Upper Space: Schedule Date of next visit / Lower Space: Actual Date of Visit)
                </div>
              </th>
              <th colSpan={2} style={{ textAlign: 'center' }}>DROP-OUT</th>
              <th colSpan={2} style={{ textAlign: 'center' }}>Deworming Tablet for WRA</th>
              <th rowSpan={3}>Remarks / Actions Taken</th>
              <th rowSpan={3}>Actions</th>
            </tr>
            <tr>
              <th colSpan={2}>Jan</th>
              <th colSpan={2}>Feb</th>
              <th colSpan={2}>Mar</th>
              <th colSpan={2}>Apr</th>
              <th colSpan={2}>May</th>
              <th colSpan={2}>Jun</th>
              <th colSpan={2}>Jul</th>
              <th colSpan={2}>Aug</th>
              <th colSpan={2}>Sep</th>
              <th colSpan={2}>Oct</th>
              <th colSpan={2}>Nov</th>
              <th colSpan={2}>Dec</th>
              <th rowSpan={2}>Date</th>
              <th rowSpan={2}>Reason</th>
              <th rowSpan={2}>1st dose</th>
              <th rowSpan={2}>2nd dose</th>
            </tr>
            <tr>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Scheduled</th>
              <th>Actual</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={39} className="text-center text-muted">
                  No records found.
                </td>
              </tr>
            ) : (
              filteredClients.map((c, idx) => {
                let followUpRaw = c.follow_up;
                if (typeof followUpRaw === 'string') {
                  try {
                    followUpRaw = JSON.parse(followUpRaw);
                  } catch (e) {
                    followUpRaw = {};
                  }
                }
                const followUp = fillFollowUp(followUpRaw);
                
                // Parse deworming if it's a string
                let deworming = c.deworming;
                if (typeof deworming === 'string') {
                  try {
                    deworming = JSON.parse(deworming);
                  } catch (e) {
                    deworming = {};
                  }
                }
                
                return (
                  <tr key={c.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{formatDate(c.registration_date)}</td>
                    <td>{c.family_serial}</td>
                    <td>{c.name}</td>
                    <td>{c.address}</td>
                    <td>{formatDate(c.dob)}</td>
                    <td>{c.type}</td>
                    <td>{c.source}</td>
                    <td>{c.previous_method}</td>
                    <td>{formatDate(followUp.Jan.scheduled)}</td>
                    <td>{formatDate(followUp.Jan.actual)}</td>
                    <td>{formatDate(followUp.Feb.scheduled)}</td>
                    <td>{formatDate(followUp.Feb.actual)}</td>
                    <td>{formatDate(followUp.Mar.scheduled)}</td>
                    <td>{formatDate(followUp.Mar.actual)}</td>
                    <td>{formatDate(followUp.Apr.scheduled)}</td>
                    <td>{formatDate(followUp.Apr.actual)}</td>
                    <td>{formatDate(followUp.May.scheduled)}</td>
                    <td>{formatDate(followUp.May.actual)}</td>
                    <td>{formatDate(followUp.Jun.scheduled)}</td>
                    <td>{formatDate(followUp.Jun.actual)}</td>
                    <td>{formatDate(followUp.Jul.scheduled)}</td>
                    <td>{formatDate(followUp.Jul.actual)}</td>
                    <td>{formatDate(followUp.Aug.scheduled)}</td>
                    <td>{formatDate(followUp.Aug.actual)}</td>
                    <td>{formatDate(followUp.Sep.scheduled)}</td>
                    <td>{formatDate(followUp.Sep.actual)}</td>
                    <td>{formatDate(followUp.Oct.scheduled)}</td>
                    <td>{formatDate(followUp.Oct.actual)}</td>
                    <td>{formatDate(followUp.Nov.scheduled)}</td>
                    <td>{formatDate(followUp.Nov.actual)}</td>
                    <td>{formatDate(followUp.Dec.scheduled)}</td>
                    <td>{formatDate(followUp.Dec.actual)}</td>
                    <td>{formatDate(c.drop_out_date)}</td>
                    <td>{c.drop_out_reason}</td>
                    <td>{formatDate(deworming?.deworm1?.scheduled)}</td>
                    <td>{formatDate(deworming?.deworm2?.scheduled)}</td>
                    <td>{c.remarks}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => openModal(c, idx)} title="Edit">
                        <i className="bi bi-pencil-square"></i>
                      </Button>{" "}
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(idx)} title="Delete">
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
      {/* Modal for Add/Edit Client */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered dialogClassName="wider-modal" size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{editingIndex !== null ? "Edit" : "Add"} Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Client Info Section */}
            <h5 className="mb-3 mt-2">Client Info</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Date of Registration</Form.Label>
                  <Form.Control
                    type="date"
                    name="registrationDate"
                    value={toInputDate(form.registrationDate)}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Family Serial No.</Form.Label>
                  <Form.Control
                    type="text"
                    name="familySerial"
                    value={form.familySerial}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Complete Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Age/Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={toInputDate(form.dob)}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Complete Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Type of Client</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Source</Form.Label>
                  <Form.Control
                    type="text"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Previous Method</Form.Label>
                  <Form.Control
                    type="text"
                    name="previousMethod"
                    value={form.previousMethod}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Follow-up Section */}
            <h5 className="mb-3 mt-4">Follow-up Visits</h5>
            <Row>
              {Object.keys(initialForm.followUp).map(month => (
                <Col xs={12} md={6} lg={4} key={month} className="mb-3">
                  <div className="border rounded p-3">
                    <h6 className="text-center mb-3">{month}</h6>
                    <Form.Group className="mb-2">
                      <Form.Label>Scheduled Date</Form.Label>
                      <Form.Control
                        type="date"
                        name={`${month}.scheduled`}
                        value={toInputDate(form.followUp[month].scheduled)}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Actual Visit Date</Form.Label>
                      <Form.Control
                        type="date"
                        name={`${month}.actual`}
                        value={toInputDate(form.followUp[month].actual)}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>
                </Col>
              ))}
            </Row>
            
            {/* Drop-out Section */}
            <h5 className="mb-3 mt-4">Drop-out</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Drop-out Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="dropOutDate"
                    value={toInputDate(form.dropOutDate)}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Drop-out Reason</Form.Label>
                  <Form.Control
                    type="text"
                    name="dropOutReason"
                    value={form.dropOutReason}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Deworming Section */}
            <h5 className="mb-3 mt-4">Deworming</h5>
            <Row>
              <Col md={6}>
                <div className="border rounded p-3">
                  <h6 className="text-center mb-3">1st Dose</h6>
                  <Form.Group className="mb-2">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="deworm1.scheduled"
                      value={toInputDate(form.deworm1.scheduled)}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              </Col>
              <Col md={6}>
                <div className="border rounded p-3">
                  <h6 className="text-center mb-3">2nd Dose</h6>
                  <Form.Group className="mb-2">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="deworm2.scheduled"
                      value={toInputDate(form.deworm2.scheduled)}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              </Col>
            </Row>
            
            {/* Remarks Section */}
            <h5 className="mb-3 mt-4">Remarks / Actions Taken</h5>
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                rows={3}
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 