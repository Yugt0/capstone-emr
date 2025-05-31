import React, { useState } from 'react';
import "../styles/ContraceptiveList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl, Badge } from "react-bootstrap";

const ContraceptiveList = () => {
  const [items, setItems] = useState([
    { id: 1, name: "Depo-Provera", dosage: "150mg/mL", form: "Injection", packaging: "1 vial", lot: "DPX2023", expiry: "2025-04-10", location: "Clinic A - Cold Storage", stock: 50, unit: "Vial" },
    { id: 2, name: "Implanon", dosage: "68mg", form: "Subdermal Implant", packaging: "1 rod", lot: "IMP8912", expiry: "2026-01-15", location: "Clinic A - Cabinet 2", stock: 25, unit: "Rod" },
    { id: 3, name: "Oral Contraceptive Pills", dosage: "0.03mg", form: "Tablet", packaging: "28 tablets/pack", lot: "OCP3001", expiry: "2024-12-30", location: "Clinic B - Shelf 1", stock: 100, unit: "Pack" },
    { id: 4, name: "IUD (Copper-T)", dosage: "N/A", form: "Device", packaging: "1 unit", lot: "CPT9908", expiry: "2027-08-20", location: "Clinic A - Drawer 3", stock: 15, unit: "Unit" },
  ]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "", dosage: "", form: "", packaging: "", lot: "", expiry: "", location: "", stock: "", unit: "",
  });

  const handleAdd = () => {
    setItems([
      ...items,
      {
        id: items.length + 1,
        ...newItem,
        stock: parseInt(newItem.stock),
      },
    ]);
    setNewItem({ name: "", dosage: "", form: "", packaging: "", lot: "", expiry: "", location: "", stock: "", unit: "" });
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (confirmed) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-fluid px-5 my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Contraceptive Inventory</h2>
        <button className="btn-add-vaccine" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle-fill"></i>
            <span>Add Vaccine</span>
        </button>
      </div>

      <InputGroup className="mb-4 w-50">
        <InputGroup.Text>🔍</InputGroup.Text>
        <FormControl
          placeholder="Search contraceptive..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <div className="shadow rounded overflow-hidden bg-white">
        <Table bordered hover responsive className="align-middle mb-0">
          <thead className="table-primary">
            <tr>
              <th>Name</th>
              <th>Dosage / Form</th>
              <th>Packaging</th>
              <th>Lot # / Expiry</th>
              <th>Location</th>
              <th className="text-end">Stock</th>
              <th>Unit</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className={item.stock < 20 ? "table-danger" : ""}>
                  <td>
                    <div className="fw-bold">{item.name}</div>
                    <div className="text-muted small">Family Planning</div>
                  </td>
                  <td>{item.dosage}<br />{item.form}</td>
                  <td>{item.packaging}</td>
                  <td>{item.lot}<br />{item.expiry}</td>
                  <td>{item.location}</td>
                  <td className="text-end fw-semibold">
                    {item.stock < 20 ? (
                      <Badge bg="danger">{item.stock}</Badge>
                    ) : (
                      <Badge bg="success">{item.stock}</Badge>
                    )}
                  </td>
                  <td>{item.unit}</td>
                  <td className="text-center">
                    <Button variant="outline-secondary" size="sm" disabled className="me-2">
                      ✎
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                      🗑
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted">
                  No contraceptives found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Contraceptive</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dosage</Form.Label>
              <Form.Control
                type="text"
                value={newItem.dosage}
                onChange={(e) => setNewItem({ ...newItem, dosage: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Form</Form.Label>
              <Form.Control
                type="text"
                value={newItem.form}
                onChange={(e) => setNewItem({ ...newItem, form: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Packaging</Form.Label>
              <Form.Control
                type="text"
                value={newItem.packaging}
                onChange={(e) => setNewItem({ ...newItem, packaging: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lot Number</Form.Label>
              <Form.Control
                type="text"
                value={newItem.lot}
                onChange={(e) => setNewItem({ ...newItem, lot: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                value={newItem.expiry}
                onChange={(e) => setNewItem({ ...newItem, expiry: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control
                type="number"
                value={newItem.stock}
                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Unit</Form.Label>
              <Form.Control
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
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
            disabled={!newItem.name || !newItem.dosage || !newItem.form || !newItem.expiry || !newItem.stock}
          >
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ContraceptiveList;
