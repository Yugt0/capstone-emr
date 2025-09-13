import React, { useState, useEffect } from 'react';
import "../styles/ContraceptiveList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl, Spinner, Pagination, Dropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const API_URL = "http://127.0.0.1:8000/api/contraceptive-inventory";

const ContraceptiveList = () => {
  const { user, getToken, isAuthenticated } = useAuth();
  const [contraceptives, setContraceptives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUseContraceptiveModal, setShowContraceptiveModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedContraceptiveForUse, setSelectedContraceptiveForUse] = useState(null);
  const [useQuantity, setUseQuantity] = useState("");
  const [showExpirationAlert, setShowExpirationAlert] = useState(false);
  const [expiringContraceptives, setExpiringContraceptives] = useState([]);
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [newContraceptive, setNewContraceptive] = useState({
    contraceptive_name: "",
    contraceptive_type: "",
    batch_number: "",
    quantity: "",
    expiration_date: ""
  });
  const [editContraceptive, setEditContraceptive] = useState({
    contraceptive_name: "",
    contraceptive_type: "",
    batch_number: "",
    quantity: "",
    expiration_date: ""
  });

  // Check for contraceptives nearing expiration (1 month prior)
  const checkExpiringContraceptives = (contraceptiveList) => {
    if (!contraceptiveList || contraceptiveList.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    oneMonthFromNow.setHours(23, 59, 59, 999); // Set to end of day
    
    console.log('Checking expiring contraceptives...');
    console.log('Today:', today);
    console.log('One month from now:', oneMonthFromNow);
    
    const expiring = contraceptiveList.filter(contraceptive => {
      if (!contraceptive.expiration_date) {
        console.log('No expiration date for:', contraceptive.contraceptive_name);
        return false;
      }
      
      const expirationDate = new Date(contraceptive.expiration_date);
      expirationDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      console.log('Checking:', contraceptive.contraceptive_name, 'expires:', expirationDate);
      
      const isExpiring = expirationDate <= oneMonthFromNow && expirationDate >= today;
      const hasStock = contraceptive.quantity > 0;
      
      console.log('Is expiring:', isExpiring, 'Has stock:', hasStock);
      
      return isExpiring && hasStock;
    });
    
    console.log('Found expiring contraceptives:', expiring.length);
    return expiring;
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

  // Show tooltip on notification bell hover
  const showTooltip = (show) => {
    const tooltip = document.getElementById('notification-tooltip');
    if (tooltip) {
      tooltip.style.opacity = show ? '1' : '0';
    }
  };

  // Show automatic notification for expiring contraceptives
  const showExpirationNotification = (expiringList) => {
    console.log('Showing expiration notification for:', expiringList.length, 'items');
    if (expiringList.length > 0) {
      const message = expiringList.length === 1 
        ? `⚠️ ${expiringList[0].contraceptive_name} is expiring in ${getDaysUntilExpiration(expiringList[0].expiration_date)} days!`
        : `⚠️ ${expiringList.length} contraceptives are expiring soon! Check notification bell for details.`;
      
      console.log('Notification message:', message);
      setToastMessage(message);
      setShowToastNotification(true);
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        setShowToastNotification(false);
      }, 8000);
    }
  };

  // Fetch contraceptives from backend
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setContraceptives(data);
        
        // Check for expiring contraceptives
        const expiring = checkExpiringContraceptives(data);
        
        if (expiring.length > 0) {
          setExpiringContraceptives(expiring);
          setShowExpirationAlert(true);
          
          // Show automatic notification
          setTimeout(() => {
            showExpirationNotification(expiring);
          }, 1000); // Delay by 1 second after page loads
        } else {
          setExpiringContraceptives([]);
          setShowExpirationAlert(false);
        }
        
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  // Check for expiring contraceptives every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const expiring = checkExpiringContraceptives(contraceptives);
      if (expiring.length > 0 && expiring.length !== expiringContraceptives.length) {
        setExpiringContraceptives(expiring);
        showExpirationNotification(expiring);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [contraceptives, expiringContraceptives.length]);

  // CREATE
  const handleAdd = async () => {
    const payload = {
      contraceptive_name: newContraceptive.contraceptive_name,
      contraceptive_type: newContraceptive.contraceptive_type,
      batch_number: newContraceptive.batch_number,
      quantity: parseInt(newContraceptive.quantity) || 0,
      expiration_date: newContraceptive.expiration_date
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to add entry");
      const created = await res.json();
      const updatedContraceptives = [...contraceptives, created];
      setContraceptives(updatedContraceptives);
      
      // Check for expiring contraceptives after adding new contraceptive
      const expiring = checkExpiringContraceptives(updatedContraceptives);
      setExpiringContraceptives(expiring);
      if (expiring.length > 0) {
        setShowExpirationAlert(true);
        showExpirationNotification(expiring);
      }
      
      setShowModal(false);
      setNewContraceptive({ contraceptive_name: "", contraceptive_type: "", batch_number: "", quantity: "", expiration_date: "" });
    } catch (err) {
      setError("Failed to add entry");
    }
  };

  // EDIT
  const handleEdit = (index) => {
    setEditIndex(index);
    setEditContraceptive({ ...contraceptives[index] });
    setShowEditModal(true);
  };

  // UPDATE
  const handleEditSave = async () => {
    const updated = {
      id: editContraceptive.id,
      contraceptive_name: editContraceptive.contraceptive_name,
      contraceptive_type: editContraceptive.contraceptive_type,
      batch_number: editContraceptive.batch_number,
      quantity: parseInt(editContraceptive.quantity) || 0,
      expiration_date: editContraceptive.expiration_date
    };
    try {
      const res = await fetch(`${API_URL}/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error("Failed to update entry");
      const newList = [...contraceptives];
      newList[editIndex] = updated;
      setContraceptives(newList);
      
      // Check for expiring contraceptives after editing
      const expiring = checkExpiringContraceptives(newList);
      setExpiringContraceptives(expiring);
      if (expiring.length > 0) {
        setShowExpirationAlert(true);
        showExpirationNotification(expiring);
      } else {
        setShowExpirationAlert(false);
      }
      
      setShowEditModal(false);
    } catch (err) {
      setError("Failed to update entry");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this contraceptive entry?");
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
      const updatedContraceptives = contraceptives.filter((c) => c.id !== id);
      setContraceptives(updatedContraceptives);
      
      // Check for expiring contraceptives after deletion
      const expiring = checkExpiringContraceptives(updatedContraceptives);
      setExpiringContraceptives(expiring);
      if (expiring.length > 0) {
        setShowExpirationAlert(true);
        showExpirationNotification(expiring);
      } else {
        setShowExpirationAlert(false);
      }
    } catch (err) {
      setError("Failed to delete entry");
    }
  };

  // USE CONTRACEPTIVE
  const handleUseContraceptive = (contraceptive) => {
    setSelectedContraceptiveForUse(contraceptive);
    setUseQuantity("");
    setShowContraceptiveModal(true);
  };

  const handleUseContraceptiveSubmit = async () => {
    const quantity = parseInt(useQuantity);
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }

    if (quantity > selectedContraceptiveForUse.quantity) {
      alert(`Insufficient stock! Current stock: ${selectedContraceptiveForUse.quantity}, Requested: ${quantity}`);
      return;
    }

    try {
      // Update the contraceptive with new quantity
      const updatedContraceptive = {
        ...selectedContraceptiveForUse,
        quantity: selectedContraceptiveForUse.quantity - quantity
      };

      const res = await fetch(`${API_URL}/${selectedContraceptiveForUse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedContraceptive)
      });

      if (!res.ok) throw new Error("Failed to update contraceptive usage");

      // Update local state
      const newList = [...contraceptives];
      const index = newList.findIndex(c => c.id === selectedContraceptiveForUse.id);
      if (index !== -1) {
        newList[index] = updatedContraceptive;
        setContraceptives(newList);
        
        // Check for expiring contraceptives after using contraceptive
        const expiring = checkExpiringContraceptives(newList);
        setExpiringContraceptives(expiring);
        if (expiring.length > 0) {
          setShowExpirationAlert(true);
          showExpirationNotification(expiring);
        } else {
          setShowExpirationAlert(false);
        }
      }

      setShowContraceptiveModal(false);
      setSelectedContraceptiveForUse(null);
      setUseQuantity("");
      alert(`Successfully used ${quantity} ${selectedContraceptiveForUse.contraceptive_name}. Remaining stock: ${updatedContraceptive.quantity}`);
    } catch (err) {
      setError("Failed to update contraceptive usage");
    }
  };

  // Only filter when search is set (by button or enter)
  const filteredContraceptives = contraceptives.filter((c) =>
    c.contraceptive_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contraceptive_type.toLowerCase().includes(search.toLowerCase()) ||
    c.batch_number.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculations
  const totalEntries = filteredContraceptives.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentContraceptives = filteredContraceptives.slice(startIndex, endIndex);

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
          <div>
            <h2 className="fw-bold">Contraceptive Inventory</h2>
            {user && (
              <p className="text-muted mb-0">
                <i className="fas fa-user me-2"></i>
                Logged in as: <strong className="text-primary">{user.name}</strong> ({user.role})
              </p>
            )}
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Notification Bell */}
            <div className="position-relative">
              {/* Notification Indicator */}
              {expiringContraceptives.length > 0 && (
                <div className="position-absolute top-0 start-0 translate-middle notification-indicator"></div>
              )}
              <button
                className={`btn btn-outline-warning position-relative notification-bell ${expiringContraceptives.length > 0 ? 'notification-bell-pulse' : ''}`}
                onClick={() => setShowExpirationAlert(!showExpirationAlert)}
                onMouseOver={(e) => {
                  e.target.style.background = '#ffc107';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'scale(1.05)';
                  showTooltip(true);
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#ffc107';
                  e.target.style.transform = 'scale(1)';
                  showTooltip(false);
                }}
              >
                <i className="fas fa-bell notification-icon"></i>
                {/* Notification Badge */}
                {expiringContraceptives.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
                    {expiringContraceptives.length > 9 ? '9+' : expiringContraceptives.length}
                  </span>
                )}
              </button>
              {/* Tooltip */}
              <div className="position-absolute top-100 start-50 translate-middle-x mt-2">
                <div className="bg-dark text-white p-2 rounded notification-tooltip" id="notification-tooltip">
                  {expiringContraceptives.length > 0 
                    ? `${expiringContraceptives.length} contraceptive(s) expiring soon` 
                    : 'No expiring contraceptives'
                  }
                </div>
              </div>
            </div>
            
            <button 
              className="btn-add-contraceptive" 
              onClick={() => setShowModal(true)}
            >
              <span className="icon">➕</span>
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {showToastNotification && (
          <div className="position-fixed top-0 end-0 p-3 toast-container">
            <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
              <div className="toast-header">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong className="me-auto">Contraceptive Expiration Alert</strong>
                  <small>Just now</small>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowToastNotification(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="toast-body">
                <div className="d-flex align-items-center">
                  <i className="fas fa-bell me-3 toast-icon"></i>
                  <div>
                    <p className="mb-1 fw-semibold">{toastMessage}</p>
                    <small className="text-muted">
                      Click the notification bell in the header for more details
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expiration Alert Notification */}
        {showExpirationAlert && expiringContraceptives.length > 0 && (
          <div className="alert alert-warning alert-dismissible fade show mb-4 expiration-alert" role="alert">
            <div className="d-flex align-items-center">
              <div className="alert-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="alert-content">
                <h6 className="alert-heading mb-2">
                  <i className="fas fa-clock me-2"></i>
                  Contraceptive Expiration Alert
                </h6>
                <p className="mb-2">
                  The following contraceptives are nearing their expiration date (within 1 month):
                </p>
                <div className="row">
                  {expiringContraceptives.slice(0, 3).map((contraceptive, idx) => (
                    <div key={idx} className="col-md-4 mb-2">
                      <div className="expiring-item">
                        <strong>{contraceptive.contraceptive_name}</strong><br/>
                        <small>
                          Expires: {formatDate(contraceptive.expiration_date)} 
                          <span className="badge bg-warning text-dark ms-2">
                            {getDaysUntilExpiration(contraceptive.expiration_date)} days
                          </span>
                        </small><br/>
                        <small>
                          Stock: {contraceptive.quantity}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                {expiringContraceptives.length > 3 && (
                  <p className="mb-0 mt-2">
                    <i className="fas fa-info-circle me-1"></i>
                    And {expiringContraceptives.length - 3} more contraceptives are expiring soon...
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-close alert-close"
              onClick={() => setShowExpirationAlert(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

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
                placeholder="Search contraceptive..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button
                className="btn-search"
                type="submit"
              >
                <i className="bi bi-search"></i>
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
        <div className="inventory-table">
          <div className="table-responsive">
          <Table bordered hover className="align-middle mb-0">
              <thead className="table-header">
              <tr>
                  <th>Contraceptive Name</th>
                  <th>Type</th>
                  <th className="text-center">Batch Number</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Expiration Date</th>
                  <th className="text-center">Modified By</th>
                  <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentContraceptives.length > 0 ? (
                currentContraceptives.map((contraceptive, idx) => (
                  <tr
                    key={contraceptive.id}
                    className={contraceptive.quantity < 10 ? "table-warning" : ""}
                  >
                    <td className="fw-semibold">{contraceptive.contraceptive_name}</td>
                    <td className="fw-bold">{contraceptive.contraceptive_type}</td>
                    <td className="text-center fw-semibold">{contraceptive.batch_number}</td>
                    <td className="text-end fw-bold primary">{contraceptive.quantity}</td>
                    <td className="text-end fw-semibold">
                      <div className="expiration-cell">
                        <span className={contraceptive.expiration_date && getDaysUntilExpiration(contraceptive.expiration_date) <= 30 ? 'text-warning fw-bold' : ''}>
                          {formatDate(contraceptive.expiration_date)}
                        </span>
                        {contraceptive.expiration_date && getDaysUntilExpiration(contraceptive.expiration_date) <= 30 && (
                          <span className="badge bg-warning text-dark expiration-badge">
                            {getDaysUntilExpiration(contraceptive.expiration_date)}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="user-info-small">
                        <div className="user-avatar-small">
                          <i className="fas fa-user"></i>
                        </div>
                        <div className="user-details-small">
                          <div className="user-name-small fw-semibold text-primary">
                            {user ? user.name : 'Unknown'}
                          </div>
                          <small className="text-muted">
                            {user ? user.role : 'User'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="action-buttons">
                        <button 
                          className="btn-use" 
                          onClick={() => handleUseContraceptive(contraceptive)} 
                          title="Use Contraceptive"
                          aria-label="Use contraceptive"
                        >
                          <i className="fas fa-pills"></i>
                          <span>Use</span>
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => handleEdit(startIndex + idx)} 
                          title="Edit Entry"
                          aria-label="Edit contraceptive entry"
                        >
                          <i className="fas fa-edit"></i>
                          <span>Edit</span>
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(contraceptive.id)} 
                          title="Delete Entry"
                          aria-label="Delete contraceptive entry"
                        >
                          <i className="fas fa-trash"></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No contraceptive entries found.
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

        {/* Add Contraceptive Entry Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Add New Contraceptive Entry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Contraceptive Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter contraceptive name"
                      value={newContraceptive.contraceptive_name}
                      onChange={(e) =>
                        setNewContraceptive({ ...newContraceptive, contraceptive_name: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Contraceptive Type</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter contraceptive type"
                      value={newContraceptive.contraceptive_type}
                      onChange={(e) =>
                        setNewContraceptive({ ...newContraceptive, contraceptive_type: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Batch Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter batch number"
                      value={newContraceptive.batch_number}
                      onChange={(e) =>
                        setNewContraceptive({ ...newContraceptive, batch_number: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={newContraceptive.quantity}
                      onChange={(e) =>
                        setNewContraceptive({ ...newContraceptive, quantity: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Expiration Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={newContraceptive.expiration_date}
                      onChange={(e) =>
                        setNewContraceptive({ ...newContraceptive, expiration_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowModal(false)}
              className="btn-cancel"
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newContraceptive.contraceptive_name || !newContraceptive.contraceptive_type || !newContraceptive.batch_number}
              className="btn-save"
            >
              <i className="bi bi-plus-circle"></i>
              Add Entry
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Contraceptive Entry Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Contraceptive Entry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Contraceptive Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter contraceptive name"
                      value={editContraceptive.contraceptive_name}
                      onChange={(e) =>
                        setEditContraceptive({ ...editContraceptive, contraceptive_name: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Contraceptive Type</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter contraceptive type"
                      value={editContraceptive.contraceptive_type}
                      onChange={(e) =>
                        setEditContraceptive({ ...editContraceptive, contraceptive_type: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Batch Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter batch number"
                      value={editContraceptive.batch_number}
                      onChange={(e) =>
                        setEditContraceptive({ ...editContraceptive, batch_number: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={editContraceptive.quantity}
                      onChange={(e) =>
                        setEditContraceptive({ ...editContraceptive, quantity: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Expiration Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editContraceptive.expiration_date}
                      onChange={(e) =>
                        setEditContraceptive({ ...editContraceptive, expiration_date: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              className="btn-cancel"
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSave}
              disabled={!editContraceptive.contraceptive_name || !editContraceptive.contraceptive_type || !editContraceptive.batch_number}
              className="btn-save"
            >
              <i className="bi bi-check-circle"></i>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Use Contraceptive Modal */}
        <Modal show={showUseContraceptiveModal} onHide={() => setShowContraceptiveModal(false)} centered>
          <Modal.Header closeButton className="modal-header-use">
            <Modal.Title>
              <i className="fas fa-pills me-2"></i>
              Use Contraceptive
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedContraceptiveForUse && (
              <div>
                <div className="alert alert-info mb-3">
                  <strong>Contraceptive:</strong> {selectedContraceptiveForUse.contraceptive_name}<br/>
                  <strong>Type:</strong> {selectedContraceptiveForUse.contraceptive_type}<br/>
                  <strong>Current Stock:</strong> <span className="text-primary fw-bold">{selectedContraceptiveForUse.quantity}</span><br/>
                  <strong>Batch Number:</strong> {selectedContraceptiveForUse.batch_number}<br/>
                  <strong>Expiration Date:</strong> {formatDate(selectedContraceptiveForUse.expiration_date)}
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Quantity to Use</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter quantity"
                    value={useQuantity}
                    onChange={(e) => setUseQuantity(e.target.value)}
                    min="1"
                    max={selectedContraceptiveForUse.quantity}
                  />
                  <Form.Text className="text-muted">
                    Maximum available: {selectedContraceptiveForUse.quantity}
                  </Form.Text>
                </Form.Group>

                {useQuantity && parseInt(useQuantity) > selectedContraceptiveForUse.quantity && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Insufficient stock! You're requesting {useQuantity} but only {selectedContraceptiveForUse.quantity} are available.
                  </div>
                )}

                {useQuantity && parseInt(useQuantity) > 0 && parseInt(useQuantity) <= selectedContraceptiveForUse.quantity && (
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    After using {useQuantity}, remaining stock will be: <strong>{selectedContraceptiveForUse.quantity - parseInt(useQuantity)}</strong>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowContraceptiveModal(false)}
              className="btn-cancel"
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleUseContraceptiveSubmit}
              disabled={!useQuantity || parseInt(useQuantity) <= 0 || parseInt(useQuantity) > selectedContraceptiveForUse?.quantity}
              className="btn-use-submit"
            >
              <i className="fas fa-pills"></i>
              Use Contraceptive
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default ContraceptiveList;
