import React, { useState, useEffect } from 'react';
import "../styles/VaccineList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl, Spinner, Pagination, Dropdown } from "react-bootstrap";

const API_URL = "http://127.0.0.1:8000/api/vaccine-lists";

const VaccineList = () => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [newVaccine, setNewVaccine] = useState({
    date_received: "",
    product: "",
    beginning_balance: "",
    delivery: "",
    consumption: "",
    stock_trasfer_in: "",
    stock_trasfer_out: "",
    expiration_date: "",
    remaining_balance: ""
  });
  const [editVaccine, setEditVaccine] = useState({
    date_received: "",
    product: "",
    beginning_balance: "",
    delivery: "",
    consumption: "",
    stock_trasfer_in: "",
    stock_trasfer_out: "",
    expiration_date: "",
    remaining_balance: ""
  });

  // Fetch vaccines from backend
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setVaccines(data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  const calculateRemainingBalance = (data) => {
    const beginning = parseInt(data.beginning_balance) || 0;
    const consumption = parseInt(data.consumption) || 0;
    const transferIn = parseInt(data.stock_trasfer_in) || 0;
    const transferOut = parseInt(data.stock_trasfer_out) || 0;
    return beginning - consumption + transferIn - transferOut;
  };

  // CREATE
  const handleAdd = async () => {
    const payload = {
      date_received: newVaccine.date_received,
      product: newVaccine.product,
      beginning_balance: parseInt(newVaccine.beginning_balance) || 0,
      delivery: newVaccine.delivery,
      consumption: parseInt(newVaccine.consumption) || 0,
      stock_trasfer_in: parseInt(newVaccine.stock_trasfer_in) || 0,
      stock_trasfer_out: parseInt(newVaccine.stock_trasfer_out) || 0,
      expiration_date: newVaccine.expiration_date,
      remaining_balance: calculateRemainingBalance(newVaccine)
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to add entry");
      const created = await res.json();
      setVaccines([...vaccines, created]);
      setShowModal(false);
      setNewVaccine({ date_received: "", product: "", beginning_balance: "", delivery: "", consumption: "", stock_trasfer_in: "", stock_trasfer_out: "", expiration_date: "", remaining_balance: "" });
    } catch (err) {
      setError("Failed to add entry");
    }
  };

  // EDIT
  const handleEdit = (index) => {
    setEditIndex(index);
    setEditVaccine({ ...vaccines[index] });
    setShowEditModal(true);
  };

  // UPDATE
  const handleEditSave = async () => {
    const updated = {
      id: editVaccine.id,
      date_received: editVaccine.date_received,
      product: editVaccine.product,
      beginning_balance: parseInt(editVaccine.beginning_balance) || 0,
      delivery: editVaccine.delivery,
      consumption: parseInt(editVaccine.consumption) || 0,
      stock_trasfer_in: parseInt(editVaccine.stock_trasfer_in) || 0,
      stock_trasfer_out: parseInt(editVaccine.stock_trasfer_out) || 0,
      expiration_date: editVaccine.expiration_date,
      remaining_balance: calculateRemainingBalance(editVaccine)
    };
    try {
      const res = await fetch(`${API_URL}/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error("Failed to update entry");
      const newList = [...vaccines];
      newList[editIndex] = updated;
      setVaccines(newList);
      setShowEditModal(false);
    } catch (err) {
      setError("Failed to update entry");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this vaccine entry?");
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
      setVaccines(vaccines.filter((v) => v.id !== id));
    } catch (err) {
      setError("Failed to delete entry");
    }
  };

  // Only filter when search is set (by button or enter)
  const filteredVaccines = vaccines.filter((v) =>
    v.product.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculations
  const totalEntries = filteredVaccines.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentVaccines = filteredVaccines.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="main-content">
      <div className="container-fluid px-4 my-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Vaccine Stock Card</h2>
          <button className="btn-add-vaccine" onClick={() => setShowModal(true)}>
            <span className="icon">➕</span>
            <span>Add Entry</span>
          </button>
        </div>

        {/* Enhanced Search Bar */}
        <div className="search-container">
          <Form
            className="d-flex w-50"
            onSubmit={e => {
              e.preventDefault();
              setSearch(searchInput);
            }}
          >
            <InputGroup>
              <InputGroup.Text>Search</InputGroup.Text>
              <FormControl
                placeholder="Search vaccine..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button
                className="btn-search"
                type="submit"
              >
                Search
              </Button>
            </InputGroup>
          </Form>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <div className="error-container">{error}</div>
        ) : (
        <>
        <div className="stock-card-table">
          <div className="table-responsive">
          <Table bordered hover className="align-middle mb-0">
              <thead className="table-header">
              <tr>
                  <th>Date Received</th>
                  <th>Product</th>
                  <th className="text-end">Beginning Balance</th>
                  <th className="text-end">Delivery Date</th>
                  <th className="text-end">Consumption</th>
                  <th className="text-end">Stock Transfer In</th>
                  <th className="text-end">Stock Transfer Out</th>
                  <th className="text-end">Expiration Date</th>
                  <th className="text-end">Remaining Balance</th>
                  <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentVaccines.length > 0 ? (
                currentVaccines.map((vaccine, idx) => (
                  <tr
                    key={vaccine.id}
                    className={vaccine.remaining_balance < 50 ? "table-warning" : ""}
                  >
                    <td className="fw-semibold">{vaccine.date_received}</td>
                    <td className="fw-bold">{vaccine.product}</td>
                    <td className="text-end fw-semibold">{vaccine.beginning_balance}</td>
                    <td className="text-end fw-semibold">{vaccine.delivery}</td>
                    <td className="text-end fw-semibold negative">{vaccine.consumption}</td>
                    <td className="text-end fw-semibold positive">{vaccine.stock_trasfer_in}</td>
                    <td className="text-end fw-semibold negative">{vaccine.stock_trasfer_out}</td>
                    <td className="text-end fw-semibold warning">{vaccine.expiration_date}</td>
                    <td className="text-end fw-bold primary">{vaccine.remaining_balance}</td>
                    <td className="text-center">
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(startIndex + idx)} title="Edit Entry">
                          ✎
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(vaccine.id)} title="Delete Entry">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center text-muted py-4">
                    No vaccine entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          </div>
        </div>

        {/* Enhanced Pagination Controls */}
        {totalEntries > 0 && (
          <div className="pagination-container">
            <div className="d-flex justify-content-between align-items-center">
              <div className="pagination-info">
                <span>Show:</span>
                <Dropdown className="entries-dropdown" onSelect={(eventKey) => handleRowsPerPageChange(parseInt(eventKey))}>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    {rowsPerPage} entries
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="10">10 entries</Dropdown.Item>
                    <Dropdown.Item eventKey="50">50 entries</Dropdown.Item>
                    <Dropdown.Item eventKey="100">100 entries</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <span className="text-muted">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
                </span>
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mb-0">
                  <Pagination.First 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  })}
                  
                  <Pagination.Next 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              )}
            </div>
          </div>
        )}
        </>
        )}

        {/* Add Vaccine Entry Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Add New Vaccine Entry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date Received</Form.Label>
                    <Form.Control
                      type="date"
                      value={newVaccine.date_received}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, date_received: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Product</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter vaccine name"
                      value={newVaccine.product}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, product: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Beginning Balance</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={newVaccine.beginning_balance}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, beginning_balance: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Delivery Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={newVaccine.delivery}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, delivery: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Consumption</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={newVaccine.consumption}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, consumption: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Transfer In</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={newVaccine.stock_trasfer_in}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, stock_trasfer_in: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Transfer Out</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={newVaccine.stock_trasfer_out}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, stock_trasfer_out: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Expiration Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={newVaccine.expiration_date}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, expiration_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Remaining Balance (Auto-calculated)</Form.Label>
                    <Form.Control
                      type="number"
                      value={calculateRemainingBalance(newVaccine)}
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newVaccine.date_received || !newVaccine.product}
            >
              Add Entry
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Vaccine Entry Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Vaccine Entry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date Received</Form.Label>
                    <Form.Control
                      type="date"
                      value={editVaccine.date_received}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, date_received: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Product</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter vaccine name"
                      value={editVaccine.product}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, product: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Beginning Balance</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={editVaccine.beginning_balance}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, beginning_balance: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Delivery Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editVaccine.delivery}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, delivery: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Consumption</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={editVaccine.consumption}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, consumption: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Transfer In</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={editVaccine.stock_trasfer_in}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, stock_trasfer_in: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Transfer Out</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={editVaccine.stock_trasfer_out}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, stock_trasfer_out: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Expiration Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editVaccine.expiration_date}
                      onChange={(e) =>
                        setEditVaccine({ ...editVaccine, expiration_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Remaining Balance (Auto-calculated)</Form.Label>
                    <Form.Control
                      type="number"
                      value={calculateRemainingBalance(editVaccine)}
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSave}
              disabled={!editVaccine.date_received || !editVaccine.product}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default VaccineList;
