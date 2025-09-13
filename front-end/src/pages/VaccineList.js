import React, { useState, useEffect } from 'react';
import "../styles/VaccineList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl, Spinner, Pagination, Dropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const API_URL = "http://127.0.0.1:8000/api/vaccine-lists";

const VaccineList = () => {
  const { user, getToken, isAuthenticated } = useAuth();
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUseVaccineModal, setShowUseVaccineModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedVaccineForUse, setSelectedVaccineForUse] = useState(null);
  const [useQuantity, setUseQuantity] = useState("");
  const [showExpirationAlert, setShowExpirationAlert] = useState(false);
  const [expiringVaccines, setExpiringVaccines] = useState([]);
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
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

  // Check for vaccines nearing expiration (1 month prior)
  const checkExpiringVaccines = (vaccineList) => {
    if (!vaccineList || vaccineList.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    oneMonthFromNow.setHours(23, 59, 59, 999); // Set to end of day
    
    console.log('Checking expiring vaccines...');
    console.log('Today:', today);
    console.log('One month from now:', oneMonthFromNow);
    
    const expiring = vaccineList.filter(vaccine => {
      if (!vaccine.expiration_date) {
        console.log('No expiration date for:', vaccine.product);
        return false;
      }
      
      const expirationDate = new Date(vaccine.expiration_date);
      expirationDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      console.log('Checking:', vaccine.product, 'expires:', expirationDate);
      
      const isExpiring = expirationDate <= oneMonthFromNow && expirationDate >= today;
      const hasStock = vaccine.remaining_balance > 0;
      
      console.log('Is expiring:', isExpiring, 'Has stock:', hasStock);
      
      return isExpiring && hasStock;
    });
    
    console.log('Found expiring vaccines:', expiring.length);
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

  // Show tooltip on notification bell hover
  const showTooltip = (show) => {
    const tooltip = document.getElementById('notification-tooltip');
    if (tooltip) {
      tooltip.style.opacity = show ? '1' : '0';
    }
  };

  // Show automatic notification for expiring vaccines
  const showExpirationNotification = (expiringList) => {
    console.log('Showing expiration notification for:', expiringList.length, 'items');
    if (expiringList.length > 0) {
      const message = expiringList.length === 1 
        ? `⚠️ ${expiringList[0].product} is expiring in ${getDaysUntilExpiration(expiringList[0].expiration_date)} days!`
        : `⚠️ ${expiringList.length} vaccines are expiring soon! Check notification bell for details.`;
      
      console.log('Notification message:', message);
      setToastMessage(message);
      setShowToastNotification(true);
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        setShowToastNotification(false);
      }, 8000);
    }
  };

  // Fetch vaccines from backend
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setVaccines(data);
        
        // Check for expiring vaccines
        const expiring = checkExpiringVaccines(data);
        
        if (expiring.length > 0) {
          setExpiringVaccines(expiring);
          setShowExpirationAlert(true);
          
          // Show automatic notification
          setTimeout(() => {
            showExpirationNotification(expiring);
          }, 1000); // Delay by 1 second after page loads
        } else {
          setExpiringVaccines([]);
          setShowExpirationAlert(false);
        }
        
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  // Check for expiring vaccines every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const expiring = checkExpiringVaccines(vaccines);
      if (expiring.length > 0 && expiring.length !== expiringVaccines.length) {
        setExpiringVaccines(expiring);
        showExpirationNotification(expiring);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [vaccines, expiringVaccines.length]);

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
      const updatedVaccines = [...vaccines, created];
      setVaccines(updatedVaccines);
      
      // Check for expiring vaccines after adding new vaccine
      const expiring = checkExpiringVaccines(updatedVaccines);
      setExpiringVaccines(expiring);
      if (expiring.length > 0) {
        setShowExpirationAlert(true);
        showExpirationNotification(expiring);
      }
      
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
      
      // Check for expiring vaccines after editing
      const expiring = checkExpiringVaccines(newList);
      setExpiringVaccines(expiring);
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
    const confirmed = window.confirm("Are you sure you want to delete this vaccine entry?");
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
      const updatedVaccines = vaccines.filter((v) => v.id !== id);
      setVaccines(updatedVaccines);
      
      // Check for expiring vaccines after deletion
      const expiring = checkExpiringVaccines(updatedVaccines);
      setExpiringVaccines(expiring);
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

  // USE VACCINE
  const handleUseVaccine = (vaccine) => {
    setSelectedVaccineForUse(vaccine);
    setUseQuantity("");
    setShowUseVaccineModal(true);
  };

  const handleUseVaccineSubmit = async () => {
    const quantity = parseInt(useQuantity);
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }

    if (quantity > selectedVaccineForUse.remaining_balance) {
      alert(`Insufficient stock! Current stock: ${selectedVaccineForUse.remaining_balance}, Requested: ${quantity}`);
      return;
    }

    try {
      // Update the vaccine with new consumption and remaining balance
      const updatedVaccine = {
        ...selectedVaccineForUse,
        consumption: selectedVaccineForUse.consumption + quantity,
        remaining_balance: selectedVaccineForUse.remaining_balance - quantity
      };

      const res = await fetch(`${API_URL}/${selectedVaccineForUse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVaccine)
      });

      if (!res.ok) throw new Error("Failed to update vaccine usage");

      // Update local state
      const newList = [...vaccines];
      const index = newList.findIndex(v => v.id === selectedVaccineForUse.id);
      if (index !== -1) {
        newList[index] = updatedVaccine;
        setVaccines(newList);
        
        // Check for expiring vaccines after using vaccine
        const expiring = checkExpiringVaccines(newList);
        setExpiringVaccines(expiring);
        if (expiring.length > 0) {
          setShowExpirationAlert(true);
          showExpirationNotification(expiring);
        } else {
          setShowExpirationAlert(false);
        }
      }

      setShowUseVaccineModal(false);
      setSelectedVaccineForUse(null);
      setUseQuantity("");
      alert(`Successfully used ${quantity} ${selectedVaccineForUse.product}. Remaining stock: ${updatedVaccine.remaining_balance}`);
    } catch (err) {
      setError("Failed to update vaccine usage");
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
      <style>
        {`
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .notification-bell-pulse {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      <div className="container-fluid px-4 my-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold">Vaccine Stock Card</h2>
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
              {expiringVaccines.length > 0 && (
                <div className="position-absolute top-0 start-0 translate-middle" style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#dc3545',
                  borderRadius: '50%',
                  border: '2px solid white',
                  animation: 'pulse 1s infinite',
                  zIndex: 10
                }}></div>
              )}
              <button
                className={`btn btn-outline-warning position-relative ${expiringVaccines.length > 0 ? 'notification-bell-pulse' : ''}`}
                onClick={() => setShowExpirationAlert(!showExpirationAlert)}
                style={{
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: expiringVaccines.length > 0 ? '3px solid #dc3545' : '2px solid #ffc107',
                  background: expiringVaccines.length > 0 ? '#fff3cd' : 'white',
                  color: expiringVaccines.length > 0 ? '#dc3545' : '#ffc107',
                  transition: 'all 0.3s ease',
                  boxShadow: expiringVaccines.length > 0 
                    ? '0 4px 15px rgba(220, 53, 69, 0.3)' 
                    : '0 2px 8px rgba(255, 193, 7, 0.2)'
                }}
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
                <i className="fas fa-bell" style={{ fontSize: '1.2rem' }}></i>
                {/* Notification Badge */}
                {expiringVaccines.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{
                    fontSize: '0.7rem',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {expiringVaccines.length > 9 ? '9+' : expiringVaccines.length}
                  </span>
                )}
              </button>
              {/* Tooltip */}
              <div className="position-absolute top-100 start-50 translate-middle-x mt-2" style={{ zIndex: 1000 }}>
                <div className="bg-dark text-white p-2 rounded" style={{
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none'
                }} id="notification-tooltip">
                  {expiringVaccines.length > 0 
                    ? `${expiringVaccines.length} vaccine(s) expiring soon` 
                    : 'No expiring vaccines'
                  }
                </div>
              </div>
            </div>
            
            <button 
              className="btn-add-vaccine" 
              onClick={() => setShowModal(true)}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onMouseOver={e => {
                e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #17a2b8 100%)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
              }}
              onMouseOut={e => {
                e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
              }}
            >
              <span className="icon" style={{ fontSize: '16px' }}>➕</span>
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {showToastNotification && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true" style={{
              minWidth: '350px',
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
              border: '2px solid #ffc107',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(255, 193, 7, 0.3)',
              animation: 'slideInRight 0.5s ease-out'
            }}>
              <div className="toast-header" style={{
                background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                color: 'white',
                borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '12px 12px 0 0'
              }}>
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2" style={{ color: 'white' }}></i>
                  <strong className="me-auto">Vaccine Expiration Alert</strong>
                  <small>Just now</small>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowToastNotification(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="toast-body" style={{ color: '#856404', padding: '1rem' }}>
                <div className="d-flex align-items-center">
                  <i className="fas fa-bell me-3" style={{ fontSize: '1.5rem', color: '#ffc107' }}></i>
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
        {showExpirationAlert && expiringVaccines.length > 0 && (
          <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert" style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)',
            animation: 'slideInDown 0.5s ease-out'
          }}>
            <div className="d-flex align-items-center">
              <div style={{
                background: '#ffc107',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px',
                color: 'white',
                fontSize: '1.2rem'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div style={{ flex: 1 }}>
                <h6 className="alert-heading mb-2" style={{ color: '#856404', fontWeight: '600' }}>
                  <i className="fas fa-clock me-2"></i>
                  Vaccine Expiration Alert
                </h6>
                <p className="mb-2" style={{ color: '#856404' }}>
                  The following vaccines are nearing their expiration date (within 1 month):
                </p>
                <div className="row">
                  {expiringVaccines.slice(0, 3).map((vaccine, idx) => (
                    <div key={idx} className="col-md-4 mb-2">
                      <div style={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 193, 7, 0.3)'
                      }}>
                        <strong style={{ color: '#856404' }}>{vaccine.product}</strong><br/>
                        <small style={{ color: '#856404' }}>
                          Expires: {vaccine.expiration_date} 
                          <span className="badge bg-warning text-dark ms-2">
                            {getDaysUntilExpiration(vaccine.expiration_date)} days
                          </span>
                        </small><br/>
                        <small style={{ color: '#856404' }}>
                          Stock: {vaccine.remaining_balance}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                {expiringVaccines.length > 3 && (
                  <p className="mb-0 mt-2" style={{ color: '#856404', fontSize: '0.9rem' }}>
                    <i className="fas fa-info-circle me-1"></i>
                    And {expiringVaccines.length - 3} more vaccines are expiring soon...
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowExpirationAlert(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(255, 193, 7, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#856404'
              }}
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
                placeholder="Search vaccine..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button
                className="btn-search"
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '0 8px 8px 0',
                  padding: '8px 16px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 3px 10px rgba(0, 123, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.4)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 3px 10px rgba(0, 123, 255, 0.3)';
                }}
              >
                <i className="bi bi-search" style={{ fontSize: '14px' }}></i>
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
                  <th className="text-center">Modified By</th>
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
                    <td className="text-end fw-semibold">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px'
                      }}>
                        <span className={vaccine.expiration_date && getDaysUntilExpiration(vaccine.expiration_date) <= 30 ? 'text-warning fw-bold' : ''}>
                          {vaccine.expiration_date}
                        </span>
                        {vaccine.expiration_date && getDaysUntilExpiration(vaccine.expiration_date) <= 30 && (
                          <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                            {getDaysUntilExpiration(vaccine.expiration_date)}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-end fw-bold primary">{vaccine.remaining_balance}</td>
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
                      <div className="action-buttons" style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'nowrap',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <style>
                          {`
                            .action-buttons button:hover {
                              transform: translateY(-2px);
                              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                            }
                            .action-buttons button:active {
                              transform: translateY(0);
                            }
                          `}
                        </style>
                        <button 
                          className="btn-use" 
                          onClick={() => handleUseVaccine(vaccine)} 
                          title="Use Vaccine"
                          aria-label="Use vaccine"
                          style={{
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            border: 'none',
                            color: 'white',
                            width: '80px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-syringe" style={{ fontSize: '12px' }}></i>
                          <span>Use</span>
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => handleEdit(startIndex + idx)} 
                          title="Edit Entry"
                          aria-label="Edit vaccine entry"
                          style={{
                            background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                            border: 'none',
                            color: 'white',
                            width: '80px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(255, 193, 7, 0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-edit" style={{ fontSize: '12px' }}></i>
                          <span>Edit</span>
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(vaccine.id)} 
                          title="Delete Entry"
                          aria-label="Delete vaccine entry"
                          style={{
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            border: 'none',
                            color: 'white',
                            width: '80px',
                            fontSize: '11px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(220, 53, 69, 0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-4">
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
            <Button 
              variant="secondary" 
              onClick={() => setShowModal(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={e => {
                e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={e => {
                e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
              }}
            >
              <i className="bi bi-x-circle" style={{ fontSize: '14px' }}></i>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newVaccine.date_received || !newVaccine.product}
              style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(0, 123, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={e => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.4)';
                }
              }}
              onMouseOut={e => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 3px 10px rgba(0, 123, 255, 0.3)';
                }
              }}
            >
              <i className="bi bi-plus-circle" style={{ fontSize: '14px' }}></i>
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
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={e => {
                e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={e => {
                e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
              }}
            >
              <i className="bi bi-x-circle" style={{ fontSize: '14px' }}></i>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSave}
              disabled={!editVaccine.date_received || !editVaccine.product}
              style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(0, 123, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={e => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.4)';
                }
              }}
              onMouseOut={e => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 3px 10px rgba(0, 123, 255, 0.3)';
                }
              }}
            >
              <i className="bi bi-check-circle" style={{ fontSize: '14px' }}></i>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Use Vaccine Modal */}
        <Modal show={showUseVaccineModal} onHide={() => setShowUseVaccineModal(false)} centered>
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white'
          }}>
            <Modal.Title>
              <i className="fas fa-syringe me-2"></i>
              Use Vaccine
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedVaccineForUse && (
              <div>
                <div className="alert alert-info mb-3">
                  <strong>Vaccine:</strong> {selectedVaccineForUse.product}<br/>
                  <strong>Current Stock:</strong> <span className="text-primary fw-bold">{selectedVaccineForUse.remaining_balance}</span><br/>
                  <strong>Expiration Date:</strong> {selectedVaccineForUse.expiration_date}
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Quantity to Use</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter quantity"
                    value={useQuantity}
                    onChange={(e) => setUseQuantity(e.target.value)}
                    min="1"
                    max={selectedVaccineForUse.remaining_balance}
                  />
                  <Form.Text className="text-muted">
                    Maximum available: {selectedVaccineForUse.remaining_balance}
                  </Form.Text>
                </Form.Group>

                {useQuantity && parseInt(useQuantity) > selectedVaccineForUse.remaining_balance && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Insufficient stock! You're requesting {useQuantity} but only {selectedVaccineForUse.remaining_balance} are available.
                  </div>
                )}

                {useQuantity && parseInt(useQuantity) > 0 && parseInt(useQuantity) <= selectedVaccineForUse.remaining_balance && (
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    After using {useQuantity}, remaining stock will be: <strong>{selectedVaccineForUse.remaining_balance - parseInt(useQuantity)}</strong>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowUseVaccineModal(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={e => {
                e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={e => {
                e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
              }}
            >
              <i className="bi bi-x-circle" style={{ fontSize: '14px' }}></i>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleUseVaccineSubmit}
              disabled={!useQuantity || parseInt(useQuantity) <= 0 || parseInt(useQuantity) > selectedVaccineForUse?.remaining_balance}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(40, 167, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={e => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #17a2b8 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
                }
              }}
              onMouseOut={e => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 3px 10px rgba(40, 167, 69, 0.3)';
                }
              }}
            >
              <i className="fas fa-syringe" style={{ fontSize: '14px' }}></i>
              Use Vaccine
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default VaccineList;
