import React, { useState } from 'react';
import "../styles/VaccineList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl } from "react-bootstrap";

const VaccineList = () => {
  const [vaccines, setVaccines] = useState([
    { id: 1, name: "Pfizer-BioNTech", stock: 120, expiry: "2025-01-15" },
    { id: 2, name: "Moderna", stock: 85, expiry: "2025-03-20" },
    { id: 3, name: "Sinovac", stock: 30, expiry: "2024-12-01" },
  ]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newVaccine, setNewVaccine] = useState({
    name: "",
    stock: "",
    expiry: "",
  });

  const handleAdd = () => {
    setVaccines([
      ...vaccines,
      {
        id: vaccines.length + 1,
        ...newVaccine,
        stock: parseInt(newVaccine.stock),
      },
    ]);
    setNewVaccine({ name: "", stock: "", expiry: "" });
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this vaccine?");
    if (confirmed) {
      setVaccines(vaccines.filter((v) => v.id !== id));
    }
  };

  const filteredVaccines = vaccines.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-fluid px-5 my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Vaccine Report</h2>
        <button className=" btn-add-vaccine" onClick={() => setShowModal(true)}>
          <span className="icon">➕</span>
          <span>Add Vaccine</span>
        </button>
      </div>

      <InputGroup className="mb-3 w-50">
        <InputGroup.Text>Search</InputGroup.Text>
        <FormControl
          placeholder="Search vaccine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <div className="reconcile-table shadow rounded overflow-hidden">
        <Table bordered hover className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Str/Form</th>
              <th>NDC/Pkg</th>
              <th>Lot/Exp</th>
              <th>Prgm/Loc</th>
              <th className="text-end">Qty.</th>
              <th>UoM</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVaccines.length > 0 ? (
              filteredVaccines.map((vaccine) => (
                <tr
                  key={vaccine.id}
                  className={vaccine.stock < 50 ? "table-danger" : ""}
                >
                  <td>
                    <div className="fw-bold">{vaccine.name}</div>
                    <div className="text-muted small">Generic Name</div>
                  </td>
                  <td>200mg<br />Tablet</td>
                  <td>1234567890<br />100/box, 10/case</td>
                  <td>1TMS9832<br />{vaccine.expiry}</td>
                  <td>Clinic<br />Med Fridge</td>
                  <td className="text-end fw-semibold">{vaccine.stock}</td>
                  <td>Btl.</td>
                  <td className="text-center">
                    <button className="btn btn-outline-primary btn-sm me-2" disabled>
                      ✎
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(vaccine.id)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-muted">
                  No vaccines found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>


      {/* Add Vaccine Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Vaccine</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Vaccine Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter vaccine name"
                value={newVaccine.name}
                onChange={(e) =>
                  setNewVaccine({ ...newVaccine, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock Quantity</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter quantity"
                value={newVaccine.stock}
                onChange={(e) =>
                  setNewVaccine({ ...newVaccine, stock: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                value={newVaccine.expiry}
                onChange={(e) =>
                  setNewVaccine({ ...newVaccine, expiry: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!newVaccine.name || !newVaccine.stock || !newVaccine.expiry}
          >
            Add Vaccine
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VaccineList;
