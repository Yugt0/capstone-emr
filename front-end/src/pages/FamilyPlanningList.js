import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Row, Col, InputGroup, FormControl, Pagination, Card, Badge } from "react-bootstrap";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      // Show first page, last page, and pages around current
      items.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );

      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }

      if (totalPages > 1) {
        items.push(
          <Pagination.Item
            key={totalPages}
            active={totalPages === currentPage}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }

    return items;
  };

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
    <div className="container-fluid" style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '2rem 3rem 0 0',
    }}>
      <div className="container" style={{ paddingRight: '2rem', paddingLeft: '2rem' }}>
        {/* Header Section */}
        <Card className="mb-4 shadow-sm border-0" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '15px'
        }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="text-white mb-1" style={{ fontWeight: 700 }}>
                  <i className="bi bi-people-fill me-3"></i>
                  Family Planning Services
                </h2>
                <p className="text-white-50 mb-0">Target Client List Management</p>
              </div>
              <div className="text-end">
                <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                  <i className="bi bi-database me-2"></i>
                  {filteredClients.length} Total Records
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Search and Actions Section */}
        <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '12px' }}>
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col lg={7}>
        <Form
          onSubmit={e => {
            e.preventDefault();
            setSearch(searchInput);
                    setCurrentPage(1);
          }}
        >
                  <InputGroup size="md" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <FormControl
              placeholder="Search by name, address, or family serial..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
                      style={{ border: 'none', padding: '8px 16px', fontSize: '0.9rem' }}
                    />
                    <Button 
                      variant="primary" 
                      type="submit"
                      style={{ 
                        borderRadius: '0 20px 20px 0',
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className="bi bi-search me-2"></i>
                      Search
                    </Button>
          </InputGroup>
        </Form>
              </Col>
              <Col lg={5} className="text-end">
          <Button
            variant="success"
                  size="md"
            onClick={() => openModal(null, null)}
                  style={{ 
                    borderRadius: '20px',
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(86, 171, 47, 0.3)',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Client
          </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Pagination Info Section */}
        <Card className="mb-3 shadow-sm border-0" style={{ borderRadius: '10px' }}>
          <Card.Body className="p-3">
            <Row className="align-items-center">
              <Col md={6}>
                <div className="d-flex align-items-center" style={{ gap: 12 }}>
                  <span className="text-muted fw-semibold">Show:</span>
                  <Form.Select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                    style={{ 
                      width: 'auto', 
                      minWidth: 100,
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <option value={10}>10 entries</option>
                    <option value={50}>50 entries</option>
                    <option value={100}>100 entries</option>
                  </Form.Select>
        </div>
              </Col>
              <Col md={6} className="text-end">
                <Badge bg="info" className="fs-6 px-3 py-2" style={{ borderRadius: '20px' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} entries
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Table Section */}
        <Card className="shadow-sm border-0" style={{ overflow: 'hidden' }}>
          <Card.Body className="p-0">
            <div style={{ overflowX: 'auto' }}>
              <Table 
                striped 
                bordered 
                hover 
                responsive 
                className="mb-0 family-planning-table"
                style={{ margin: 0 }}
              >
                <thead style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <tr>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>No.</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Date of Registration</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Family Serial No.</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Complete Name</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Complete Address</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Age/Date of Birth</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Type of Client</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Source</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Previous Method</th>
                    <th colSpan={24} style={{ textAlign: 'center', border: 'none' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1em' }}>
                FOLLOW-UP VISITS
                      </div>
                      <div style={{ fontWeight: 'normal', fontSize: '0.85em', opacity: 0.9 }}>
                        (Upper: Schedule Date / Lower: Actual Date)
                </div>
              </th>
                    <th colSpan={2} style={{ textAlign: 'center', border: 'none' }}>DROP-OUT</th>
                    <th colSpan={2} style={{ textAlign: 'center', border: 'none' }}>Deworming Tablet for WRA</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Remarks / Actions Taken</th>
                    <th rowSpan={3} style={{ border: 'none', verticalAlign: 'middle' }}>Actions</th>
            </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Jan</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Feb</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Mar</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Apr</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>May</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Jun</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Jul</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Aug</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Sep</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Oct</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Nov</th>
                    <th colSpan={2} style={{ border: 'none', textAlign: 'center' }}>Dec</th>
                    <th rowSpan={2} style={{ border: 'none', verticalAlign: 'middle' }}>Date</th>
                    <th rowSpan={2} style={{ border: 'none', verticalAlign: 'middle' }}>Reason</th>
                    <th rowSpan={2} style={{ border: 'none', verticalAlign: 'middle' }}>1st dose</th>
                    <th rowSpan={2} style={{ border: 'none', verticalAlign: 'middle' }}>2nd dose</th>
            </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Scheduled</th>
                    <th style={{ border: 'none', textAlign: 'center', fontSize: '0.85em' }}>Actual</th>
            </tr>
          </thead>
          <tbody>
                  {currentClients.length === 0 ? (
                    <tr>
                      <td colSpan={39} className="text-center text-muted py-5">
                        <div className="py-4">
                          <i className="bi bi-inbox display-4 text-muted"></i>
                          <p className="mt-3 mb-0 fs-5">No records found</p>
                          <small className="text-muted">Try adjusting your search criteria</small>
                        </div>
                </td>
              </tr>
            ) : (
                    currentClients.map((c, idx) => {
                let followUpRaw = c.follow_up;
                if (typeof followUpRaw === 'string') {
                  try {
                    followUpRaw = JSON.parse(followUpRaw);
                  } catch (e) {
                    followUpRaw = {};
                  }
                }
                const followUp = fillFollowUp(followUpRaw);
                
                let deworming = c.deworming;
                if (typeof deworming === 'string') {
                  try {
                    deworming = JSON.parse(deworming);
                  } catch (e) {
                    deworming = {};
                  }
                }
                
                return (
                        <tr key={c.id || idx} style={{ transition: 'all 0.2s ease' }}>
                          <td className="fw-bold text-primary">{startIndex + idx + 1}</td>
                    <td>{formatDate(c.registration_date)}</td>
                          <td className="fw-semibold">{c.family_serial}</td>
                          <td className="fw-semibold">{c.name}</td>
                    <td>{c.address}</td>
                    <td>{formatDate(c.dob)}</td>
                          <td>
                            <Badge bg="info" className="px-2 py-1" style={{ borderRadius: '12px' }}>
                              {c.type}
                            </Badge>
                          </td>
                    <td>{c.source}</td>
                    <td>{c.previous_method}</td>
                          <td className="text-center">{formatDate(followUp.Jan.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Jan.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Feb.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Feb.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Mar.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Mar.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Apr.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Apr.actual)}</td>
                          <td className="text-center">{formatDate(followUp.May.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.May.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Jun.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Jun.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Jul.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Jul.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Aug.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Aug.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Sep.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Sep.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Oct.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Oct.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Nov.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Nov.actual)}</td>
                          <td className="text-center">{formatDate(followUp.Dec.scheduled)}</td>
                          <td className="text-center">{formatDate(followUp.Dec.actual)}</td>
                          <td className="text-center">{formatDate(c.drop_out_date)}</td>
                    <td>{c.drop_out_reason}</td>
                          <td className="text-center">{formatDate(deworming?.deworm1?.scheduled)}</td>
                          <td className="text-center">{formatDate(deworming?.deworm2?.scheduled)}</td>
                          <td style={{ maxWidth: '200px' }}>
                            <small className="text-muted">{c.remarks}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                onClick={() => openModal(c, startIndex + idx)} 
                                title="Edit"
                                style={{ 
                                  borderRadius: '8px',
                                  padding: '6px 10px',
                                  border: '1px solid #007bff',
                                  color: '#007bff'
                                }}
                              >
                        <i className="bi bi-pencil-square"></i>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-danger" 
                                onClick={() => handleDelete(startIndex + idx)} 
                                title="Delete"
                                style={{ 
                                  borderRadius: '8px',
                                  padding: '6px 10px',
                                  border: '1px solid #dc3545',
                                  color: '#dc3545'
                                }}
                              >
                        <i className="bi bi-trash"></i>
                      </Button>
                            </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
          </Card.Body>
        </Card>

        {/* Enhanced Pagination Controls */}
        {totalPages > 1 && (
          <Card className="mt-4 shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} entries
                </div>
                <Pagination className="mb-0">
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    style={{ borderRadius: '8px', margin: '0 2px' }}
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ borderRadius: '8px', margin: '0 2px' }}
                  />
                  {getPaginationItems()}
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ borderRadius: '8px', margin: '0 2px' }}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{ borderRadius: '8px', margin: '0 2px' }}
                  />
                </Pagination>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Enhanced Modal for Add/Edit Client */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered dialogClassName="wider-modal" size="xl">
          <Modal.Header closeButton style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: 'none'
          }}>
            <Modal.Title>
              <i className="bi bi-person-plus me-2"></i>
              {editingIndex !== null ? "Edit" : "Add"} Client
            </Modal.Title>
        </Modal.Header>
          <Modal.Body className="p-4">
          <Form>
            {/* Client Info Section */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: 'none',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <h5 className="mb-0">
                    <i className="bi bi-person-badge me-2 text-primary"></i>
                    Client Information
                  </h5>
                </Card.Header>
                <Card.Body>
            <Row>
              <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Date of Registration</Form.Label>
                  <Form.Control
                    type="date"
                    name="registrationDate"
                    value={toInputDate(form.registrationDate)}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Family Serial No.</Form.Label>
                  <Form.Control
                    type="text"
                    name="familySerial"
                    value={form.familySerial}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Complete Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Age/Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={toInputDate(form.dob)}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Complete Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                      style={{ borderRadius: '8px' }}
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Type of Client</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Source</Form.Label>
                  <Form.Control
                    type="text"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Previous Method</Form.Label>
                  <Form.Control
                    type="text"
                    name="previousMethod"
                    value={form.previousMethod}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
                </Card.Body>
              </Card>
            
            {/* Follow-up Section */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: 'none',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-check me-2 text-success"></i>
                    Follow-up Visits
                  </h5>
                </Card.Header>
                <Card.Body>
            <Row>
              {Object.keys(initialForm.followUp).map(month => (
                <Col xs={12} md={6} lg={4} key={month} className="mb-3">
                        <div className="border rounded p-3" style={{ 
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                          borderRadius: '10px'
                        }}>
                          <h6 className="text-center mb-3 text-primary fw-bold">{month}</h6>
                    <Form.Group className="mb-2">
                            <Form.Label className="fw-semibold">Scheduled Date</Form.Label>
                      <Form.Control
                        type="date"
                        name={`${month}.scheduled`}
                        value={toInputDate(form.followUp[month].scheduled)}
                        onChange={handleChange}
                              style={{ borderRadius: '8px' }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                            <Form.Label className="fw-semibold">Actual Visit Date</Form.Label>
                      <Form.Control
                        type="date"
                        name={`${month}.actual`}
                        value={toInputDate(form.followUp[month].actual)}
                        onChange={handleChange}
                              style={{ borderRadius: '8px' }}
                      />
                    </Form.Group>
                  </div>
                </Col>
              ))}
            </Row>
                </Card.Body>
              </Card>
            
            {/* Drop-out Section */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: 'none',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <h5 className="mb-0">
                    <i className="bi bi-x-circle me-2 text-danger"></i>
                    Drop-out Information
                  </h5>
                </Card.Header>
                <Card.Body>
            <Row>
              <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Drop-out Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="dropOutDate"
                    value={toInputDate(form.dropOutDate)}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Drop-out Reason</Form.Label>
                  <Form.Control
                    type="text"
                    name="dropOutReason"
                    value={form.dropOutReason}
                    onChange={handleChange}
                          style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
                </Card.Body>
              </Card>
            
            {/* Deworming Section */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: 'none',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <h5 className="mb-0">
                    <i className="bi bi-capsule me-2 text-warning"></i>
                    Deworming Schedule
                  </h5>
                </Card.Header>
                <Card.Body>
            <Row>
              <Col md={6}>
                      <div className="border rounded p-3" style={{ 
                        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                        borderRadius: '10px'
                      }}>
                        <h6 className="text-center mb-3 text-warning fw-bold">1st Dose</h6>
                  <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold">Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="deworm1.scheduled"
                      value={toInputDate(form.deworm1.scheduled)}
                      onChange={handleChange}
                            style={{ borderRadius: '8px' }}
                    />
                  </Form.Group>
                </div>
              </Col>
              <Col md={6}>
                      <div className="border rounded p-3" style={{ 
                        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                        borderRadius: '10px'
                      }}>
                        <h6 className="text-center mb-3 text-warning fw-bold">2nd Dose</h6>
                  <Form.Group className="mb-2">
                          <Form.Label className="fw-semibold">Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="deworm2.scheduled"
                      value={toInputDate(form.deworm2.scheduled)}
                      onChange={handleChange}
                            style={{ borderRadius: '8px' }}
                    />
                  </Form.Group>
                </div>
              </Col>
            </Row>
                </Card.Body>
              </Card>
            
            {/* Remarks Section */}
              <Card className="border-0 shadow-sm">
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: 'none',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <h5 className="mb-0">
                    <i className="bi bi-chat-text me-2 text-info"></i>
                    Remarks / Actions Taken
                  </h5>
                </Card.Header>
                <Card.Body>
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                rows={3}
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                      style={{ borderRadius: '8px' }}
                      placeholder="Enter any additional remarks or actions taken..."
              />
            </Form.Group>
                </Card.Body>
              </Card>
          </Form>
        </Modal.Body>
          <Modal.Footer style={{ borderTop: 'none' }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowModal(false)}
              style={{ borderRadius: '8px', padding: '8px 20px' }}
            >
              <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              style={{ 
                borderRadius: '8px', 
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              <i className="bi bi-check-circle me-2"></i>
              Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
  );
} 