import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/PatientVaccineTracker.css";
import {
  Table,
  Button,
  Modal,
  Form,
  Container,
  Row,
  Col,
  Card,
  Badge,
  InputGroup,
  FormControl,
} from "react-bootstrap";

const initialPatients = [
  {
    id: 1,
    name: "David Juarez",
    tier: "Tier 2",
    ssn: "12345678901",
    birthDate: "1984-12-10",
    gender: "Male",
    email: "juarez@example.com",
  },
  {
    id: 2,
    name: "Robert Lara",
    tier: "Tier 5",
    ssn: "0123459679",
    birthDate: "1981-11-18",
    gender: "Male",
    email: "lara@example.com",
  },
  {
    id: 3,
    name: "Melanie McRoy",
    tier: "Tier 1",
    ssn: "01234567890",
    birthDate: "1998-03-13",
    gender: "Female",
    email: "melanie@example.com",
  },
  {
    id: 4,
    name: "Jessica Stanford",
    tier: "Tier 4",
    ssn: "1234567890",
    birthDate: "2008-07-12",
    gender: "Female",
    email: "jessica@example.com",
  },
  {
    id: 5,
    name: "Edna Moore",
    tier: "Tier 3",
    ssn: "1234567890",
    birthDate: "2001-09-21",
    gender: "Female",
    email: "edna@example.com",
  },
];

export default function PatientVaccineTracker() {
  const [patients, setPatients] = useState(initialPatients);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    tier: "",
    ssn: "",
    birthDate: "",
    gender: "",
    email: "",
  });

  const handleShow = (patient = null) => {
    if (patient) {
      setEditing(patient.id);
      setFormData({ ...patient });
    } else {
      setEditing(null);
      setFormData({
        name: "",
        tier: "",
        ssn: "",
        birthDate: "",
        gender: "",
        email: "",
      });
    }
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (editing) {
      setPatients((prev) =>
        prev.map((p) => (p.id === editing ? { ...p, ...formData } : p))
      );
    } else {
      setPatients((prev) => [...prev, { ...formData, id: prev.length + 1 }]);
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const tierVariant = {
    "Tier 1": "danger",
    "Tier 2": "warning",
    "Tier 3": "secondary",
    "Tier 4": "success",
    "Tier 5": "info",
  };

  return (
    <Container fluid className="my-4 ">
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body>
          <Row className="mb-3 align-items-center">
            <Col>
              <h4 className="fw-bold text-primary">
               Vaccination Tracker
              </h4>
            </Col>
            <Col className="text-end">
              <button className="btn-add" onClick={() => handleShow()}>
                <i className="bi bi-plus-circle me-2"></i>Add Patient
              </button>
            </Col>
          </Row>

          <div className="mb-4 search-bar">
            <input
              placeholder="Search patients by name"
              aria-label="Search"
              className="search-input"
            />
            <button variant="primary" className="search-btn">
              <i className="bi bi-search"></i>
            </button>
          </div>

          <Table responsive hover className="align-middle text-center table-sm">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Tier Group</th>
                <th>National Security Number</th>
                <th>Birth Date</th>
                <th>Gender</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} style={{ height: "40px" }}>
                  <td>{patient.id}</td>
                  <td>{patient.name}</td>
                  <td>
                    <Badge bg={tierVariant[patient.tier] || "secondary"}>
                      {patient.tier}
                    </Badge>
                  </td>
                  <td>{patient.ssn}</td>
                  <td>{patient.birthDate}</td>
                  <td>
                    <Badge
                      bg={patient.gender === "Male" ? "danger" : "warning"}
                    >
                      {patient.gender}
                    </Badge>
                  </td>
                  <td>{patient.email}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      className="me-1 action-icon"
                      onClick={() => handleShow(patient)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="action-icon"
                      onClick={() => handleDelete(patient.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{editing ? "Edit Patient" : "Add Patient"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Tier Group</Form.Label>
              <Form.Control
                name="tier"
                value={formData.tier}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>National Security Number</Form.Label>
              <Form.Control
                name="ssn"
                value={formData.ssn}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Birth Date</Form.Label>
              <Form.Control
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            className="rounded-pill px-3"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="rounded-pill px-3"
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
