import React, { useState, useEffect } from 'react';
import "../styles/VaccineList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl, Spinner, Pagination, Dropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Toast from "../components/Toast";

const API_URL = "http://127.0.0.1:8000/api/vaccine-lists";

const VaccineList = () => {
  const { user, getToken, isAuthenticated } = useAuth();
  
  // Helper function for authenticated API requests
  const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };
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
  const [showExpirationAlert, setShowExpirationAlert] = useState(true);
  const [expiringVaccines, setExpiringVaccines] = useState([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  const [lowStockVaccines, setLowStockVaccines] = useState([]);
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showViewAllExpiringModal, setShowViewAllExpiringModal] = useState(false);
  const [showViewAllLowStockModal, setShowViewAllLowStockModal] = useState(false);
  
  // Search states for modals
  const [expiringSearch, setExpiringSearch] = useState("");
  const [lowStockSearch, setLowStockSearch] = useState("");
  
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
  const [beginningBalanceError, setBeginningBalanceError] = useState(false);
  const [consumptionError, setConsumptionError] = useState(false);
  const [stockInError, setStockInError] = useState(false);
  const [stockOutError, setStockOutError] = useState(false);
  const [editBeginningBalanceError, setEditBeginningBalanceError] = useState(false);
  const [editConsumptionError, setEditConsumptionError] = useState(false);
  const [editStockInError, setEditStockInError] = useState(false);
  const [editStockOutError, setEditStockOutError] = useState(false);
  const [useQuantityError, setUseQuantityError] = useState(false);
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

  // Check for vaccines with low stock (less than 100)
  const checkLowStockVaccines = (vaccineList) => {
    if (!vaccineList || vaccineList.length === 0) {
      console.log('No vaccine list provided or empty list');
      return [];
    }
    
    console.log('=== CHECKING LOW STOCK VACCINES ===');
    console.log('Total vaccines to check:', vaccineList.length);
    
    const lowStock = vaccineList.filter(vaccine => {
      console.log('--- Checking vaccine stock:', vaccine.product || 'Unknown');
      console.log('Vaccine data:', vaccine);
      
      if (!vaccine.remaining_balance && vaccine.remaining_balance !== 0) {
        console.log('❌ No remaining balance for:', vaccine.product);
        return false;
      }
      
      const stock = parseInt(vaccine.remaining_balance) || 0;
      console.log('📦 Current stock:', stock);
      
      const isLowStock = stock > 0 && stock < 100;
      console.log('⚠️ Is low stock (< 100):', isLowStock);
      
      return isLowStock;
    });
    
    console.log('🎯 Found low stock vaccines:', lowStock.length);
    console.log('Low stock vaccines:', lowStock);
    return lowStock;
  };

  // Check for vaccines nearing expiration (30 days prior)
  const checkExpiringVaccines = (vaccineList) => {
    if (!vaccineList || vaccineList.length === 0) {
      console.log('No vaccine list provided or empty list');
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999); // Set to end of day
    
    console.log('=== CHECKING EXPIRING VACCINES ===');
    console.log('Today:', today.toISOString());
    console.log('Thirty days from now:', thirtyDaysFromNow.toISOString());
    console.log('Total vaccines to check:', vaccineList.length);
    
    const expiring = vaccineList.filter(vaccine => {
      console.log('--- Checking vaccine:', vaccine.product || 'Unknown');
      console.log('Vaccine data:', vaccine);
      
      if (!vaccine.expiration_date) {
        console.log('❌ No expiration date for:', vaccine.product);
        return false;
      }
      
      const expirationDate = new Date(vaccine.expiration_date);
      
      // Check if the date is valid
      if (isNaN(expirationDate.getTime())) {
        console.log('❌ Invalid expiration date for:', vaccine.product, 'date:', vaccine.expiration_date);
        return false;
      }
      
      expirationDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      console.log('📅 Expiration date:', expirationDate.toISOString());
      
      // Calculate days until expiration
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log('📊 Days until expiry:', daysUntilExpiry);
      
      // More robust expiration checking
      const isExpiring = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      const hasStock = vaccine.remaining_balance > 0;
      
      // Additional debugging for edge cases
      if (daysUntilExpiry < 0) {
        console.log('⚠️ Product already expired:', vaccine.product, 'expired', Math.abs(daysUntilExpiry), 'days ago');
      } else if (daysUntilExpiry === 0) {
        console.log('🚨 Product expires today:', vaccine.product);
      } else if (daysUntilExpiry <= 7) {
        console.log('🔥 Product expires within a week:', vaccine.product, 'in', daysUntilExpiry, 'days');
      }
      
      console.log('⏰ Is expiring (within 30 days):', isExpiring);
      console.log('📦 Has stock:', hasStock, '(remaining_balance:', vaccine.remaining_balance, ')');
      
      const shouldInclude = isExpiring && hasStock;
      console.log('✅ Should include in expiring list:', shouldInclude);
      
      return shouldInclude;
    });
    
    console.log('🎯 Found expiring vaccines:', expiring.length);
    console.log('Expiring vaccines:', expiring);
    return expiring;
  };

  // Calculate days until expiration with better date handling
  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0); // Reset to start of day
    
    // Check if date is valid
    if (isNaN(expDate.getTime())) {
      console.warn('Invalid expiration date:', expirationDate);
      return null;
    }
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('📅 Date calculation - Today:', today.toISOString().split('T')[0], 'Expiry:', expDate.toISOString().split('T')[0], 'Days:', diffDays);
    
    return diffDays;
  };

  // Note: Audit logging is handled automatically by the backend Auditable trait
  // All activities are logged in the audit logs table, not displayed on this page

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

  // Show automatic notification for low stock vaccines
  const showLowStockNotification = (lowStockList) => {
    console.log('Showing low stock notification for:', lowStockList.length, 'items');
    if (lowStockList.length > 0) {
      const message = lowStockList.length === 1 
        ? `📦 ${lowStockList[0].product} has low stock (${lowStockList[0].remaining_balance} units)! Restock needed.`
        : `📦 ${lowStockList.length} vaccines have low stock! Check notification bell for details.`;
      
      console.log('Low stock notification message:', message);
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
    console.log('🔄 Fetching vaccines from:', API_URL);
    authenticatedFetch(API_URL)
      .then(res => {
        console.log('📡 API Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📊 Received vaccine data:', data);
        console.log('📊 Number of vaccines:', data.length);
        
        setVaccines(data);
        
        // Note: View activity is logged automatically by the backend VaccineListController
        
        // Check for expiring vaccines
        console.log('🔍 Checking for expiring vaccines...');
        const expiring = checkExpiringVaccines(data);
        
        if (expiring.length > 0) {
          console.log('⚠️ Found expiring vaccines, setting alert');
          setExpiringVaccines(expiring);
          setShowExpirationAlert(true); // Always show when items exist
          
          // Show automatic notification
          setTimeout(() => {
            showExpirationNotification(expiring);
          }, 1000); // Delay by 1 second after page loads
        } else {
          console.log('✅ No expiring vaccines found');
          setExpiringVaccines([]);
          setShowExpirationAlert(false);
        }

        // Check for low stock vaccines
        console.log('🔍 Checking for low stock vaccines...');
        const lowStock = checkLowStockVaccines(data);
        
        if (lowStock.length > 0) {
          console.log('📦 Found low stock vaccines, setting alert');
          setLowStockVaccines(lowStock);
          setShowLowStockAlert(true); // Always show when items exist
          
          // Show automatic notification
          setTimeout(() => {
            showLowStockNotification(lowStock);
          }, 2000); // Delay by 2 seconds after page loads
        } else {
          console.log('✅ No low stock vaccines found');
          setLowStockVaccines([]);
          setShowLowStockAlert(false);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching vaccines:', err);
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, [user, isAuthenticated]);

  // Check for expiring vaccines and low stock every 5 minutes and also on page focus
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Periodic check for expiring vaccines and low stock...');
      
      // Check expiring vaccines
      const expiring = checkExpiringVaccines(vaccines);
      console.log('📊 Current expiring vaccines count:', expiring.length);
      console.log('📊 Previous expiring vaccines count:', expiringVaccines.length);
      
      if (expiring.length > 0) {
        setExpiringVaccines(expiring);
        setShowExpirationAlert(true); // Always show when items exist
        
        // Only show notification if count changed
        if (expiring.length !== expiringVaccines.length) {
          showExpirationNotification(expiring);
        }
      } else {
        setExpiringVaccines([]);
        setShowExpirationAlert(false);
      }

      // Check low stock vaccines
      const lowStock = checkLowStockVaccines(vaccines);
      console.log('📊 Current low stock vaccines count:', lowStock.length);
      console.log('📊 Previous low stock vaccines count:', lowStockVaccines.length);
      
      if (lowStock.length > 0) {
        setLowStockVaccines(lowStock);
        setShowLowStockAlert(true); // Always show when items exist
        
        // Only show notification if count changed
        if (lowStock.length !== lowStockVaccines.length) {
          showLowStockNotification(lowStock);
        }
      } else {
        setLowStockVaccines([]);
        setShowLowStockAlert(false);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Also check when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, checking expiring vaccines and low stock...');
        
        const expiring = checkExpiringVaccines(vaccines);
        if (expiring.length > 0) {
          setExpiringVaccines(expiring);
          setShowExpirationAlert(true); // Always show when items exist
        } else {
          setExpiringVaccines([]);
          setShowExpirationAlert(false);
        }

        const lowStock = checkLowStockVaccines(vaccines);
        if (lowStock.length > 0) {
          setLowStockVaccines(lowStock);
          setShowLowStockAlert(true); // Always show when items exist
        } else {
          setLowStockVaccines([]);
          setShowLowStockAlert(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [vaccines, expiringVaccines.length, lowStockVaccines.length]);

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
      const res = await authenticatedFetch(API_URL, {
        method: "POST",
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

      // Check for low stock vaccines after adding new vaccine
      const lowStock = checkLowStockVaccines(updatedVaccines);
      setLowStockVaccines(lowStock);
      if (lowStock.length > 0) {
        setShowLowStockAlert(true);
        showLowStockNotification(lowStock);
      }
      
      setShowModal(false);
      setNewVaccine({ date_received: "", product: "", beginning_balance: "", delivery: "", consumption: "", stock_trasfer_in: "", stock_trasfer_out: "", expiration_date: "", remaining_balance: "" });
      
      // Show success notification
      setToastMessage("Vaccine added successfully!");
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    } catch (err) {
      console.error('Error adding vaccine:', err);
      setError("Failed to add entry");
      setToastMessage(`Failed to add vaccine: ${err.message || 'Unknown error'}`);
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    }
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Extract just the date part (YYYY-MM-DD) from any date format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Invalid date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // EDIT
  const handleEdit = (index) => {
    setEditIndex(index);
    const vaccine = vaccines[index];
    setEditVaccine({ 
      ...vaccine,
      date_received: formatDateForInput(vaccine.date_received),
      delivery: formatDateForInput(vaccine.delivery),
      expiration_date: formatDateForInput(vaccine.expiration_date)
    });
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
      const res = await authenticatedFetch(`${API_URL}/${updated.id}`, {
        method: "PUT",
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

      // Check for low stock vaccines after editing
      const lowStock = checkLowStockVaccines(newList);
      setLowStockVaccines(lowStock);
      if (lowStock.length > 0) {
        setShowLowStockAlert(true);
        showLowStockNotification(lowStock);
      } else {
        setShowLowStockAlert(false);
      }
      
      setShowEditModal(false);
      
      // Show success notification
      setToastMessage("Vaccine updated successfully!");
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    } catch (err) {
      console.error('Error updating vaccine:', err);
      setError("Failed to update entry");
      setToastMessage(`Failed to update vaccine: ${err.message || 'Unknown error'}`);
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this vaccine entry?");
    if (!confirmed) return;
    
    try {
      const res = await authenticatedFetch(`${API_URL}/${id}`, { method: "DELETE" });
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

      // Check for low stock vaccines after deletion
      const lowStock = checkLowStockVaccines(updatedVaccines);
      setLowStockVaccines(lowStock);
      if (lowStock.length > 0) {
        setShowLowStockAlert(true);
        showLowStockNotification(lowStock);
      } else {
        setShowLowStockAlert(false);
      }
      
      // Show success notification
      setToastMessage("Vaccine deleted successfully!");
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    } catch (err) {
      console.error('Error deleting vaccine:', err);
      setError("Failed to delete entry");
      setToastMessage(`Failed to delete vaccine: ${err.message || 'Unknown error'}`);
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
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

      const res = await authenticatedFetch(`${API_URL}/${selectedVaccineForUse.id}/use`, {
        method: "POST",
        body: JSON.stringify({ 
          ...updatedVaccine,
          quantity: quantity 
        })
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

        // Check for low stock vaccines after using vaccine
        const lowStock = checkLowStockVaccines(newList);
        setLowStockVaccines(lowStock);
        if (lowStock.length > 0) {
          setShowLowStockAlert(true);
          showLowStockNotification(lowStock);
        } else {
          setShowLowStockAlert(false);
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
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .modal-responsive .modal-dialog {
              margin: 0.5rem;
              max-width: calc(100% - 1rem);
            }
            
            .modal-responsive .modal-content {
              border-radius: 8px;
            }
            
            .modal-responsive .modal-body {
              padding: 1rem;
              font-size: 0.9rem;
            }
            
            .modal-responsive .modal-header {
              padding: 0.75rem 1rem;
            }
            
            .modal-responsive .modal-footer {
              padding: 0.75rem 1rem;
            }
            
            .table-responsive {
              font-size: 0.8rem;
            }
            
            .action-buttons {
              flex-direction: column;
              gap: 0.25rem;
            }
            
            .action-buttons button {
              width: 100%;
              font-size: 0.75rem;
              padding: 0.25rem 0.5rem;
            }
          }
          
          @media (max-width: 576px) {
            .search-container .form-control {
              font-size: 0.8rem;
            }
            
            .search-container .btn {
              font-size: 0.75rem;
              padding: 0.375rem 0.5rem;
            }
            
            .table-responsive {
              font-size: 0.75rem;
            }
            
            .modal-responsive .modal-dialog {
              margin: 0.25rem;
              max-width: calc(100% - 0.5rem);
            }
          }
        `}
      </style>
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
          
          .modal-fullscreen-lg-down .modal-dialog {
            max-width: 95vw !important;
            width: 95vw !important;
            max-height: 95vh !important;
            height: 95vh !important;
            margin: 2.5vh auto !important;
            padding: 0 !important;
          }
          
          .modal-fullscreen-lg-down .modal-content {
            height: 100% !important;
            border-radius: 20px !important;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4) !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          .modal-fullscreen-lg-down .modal-header {
            flex-shrink: 0 !important;
            padding: 1.5rem 2rem !important;
          }
          
          .modal-fullscreen-lg-down .modal-body {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 2rem !important;
          }
          
          .modal-fullscreen-lg-down .modal-footer {
            flex-shrink: 0 !important;
            padding: 1rem 2rem !important;
          }
          
          .modal-backdrop {
            background-color: rgba(0, 0, 0, 0.7) !important;
            backdrop-filter: blur(3px) !important;
          }
          
          @media (max-width: 991.98px) {
            .modal-fullscreen-lg-down .modal-dialog {
              max-width: 98vw !important;
              width: 98vw !important;
              max-height: 98vh !important;
              height: 98vh !important;
              margin: 1vh auto !important;
            }
          }
          
          .notification-bell-pulse {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      <div className="container-fluid px-4 my-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold">Vaccine Inventory</h2>
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
              {(expiringVaccines.length > 0 || lowStockVaccines.length > 0) && (
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
                className={`btn btn-outline-warning position-relative ${(expiringVaccines.length > 0 || lowStockVaccines.length > 0) ? 'notification-bell-pulse' : ''}`}
                onClick={() => {
                  // Scroll to alerts instead of toggling
                  const expirationAlert = document.querySelector('.alert-warning');
                  const lowStockAlert = document.querySelector('.alert-danger');
                  if (expirationAlert) {
                    expirationAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else if (lowStockAlert) {
                    lowStockAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                style={{
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: (expiringVaccines.length > 0 || lowStockVaccines.length > 0) ? '3px solid #dc3545' : '2px solid #ffc107',
                  background: (expiringVaccines.length > 0 || lowStockVaccines.length > 0) ? '#fff3cd' : 'white',
                  color: (expiringVaccines.length > 0 || lowStockVaccines.length > 0) ? '#dc3545' : '#ffc107',
                  transition: 'all 0.3s ease',
                  boxShadow: (expiringVaccines.length > 0 || lowStockVaccines.length > 0) 
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
                {(expiringVaccines.length > 0 || lowStockVaccines.length > 0) && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{
                    fontSize: '0.7rem',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(expiringVaccines.length + lowStockVaccines.length) > 9 ? '9+' : (expiringVaccines.length + lowStockVaccines.length)}
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
                  {expiringVaccines.length > 0 && lowStockVaccines.length > 0
                    ? `${expiringVaccines.length} expiring, ${lowStockVaccines.length} low stock`
                    : expiringVaccines.length > 0 
                      ? `${expiringVaccines.length} vaccine(s) expiring soon`
                      : lowStockVaccines.length > 0
                        ? `${lowStockVaccines.length} vaccine(s) low stock`
                        : 'No alerts'
                  }
                </div>
              </div>
            </div>
            
            <button 
              className="btn-refresh-vaccines" 
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                const expiring = checkExpiringVaccines(vaccines);
                if (expiring.length > 0) {
                  setExpiringVaccines(expiring);
                  setShowExpirationAlert(true);
                  showExpirationNotification(expiring);
                } else {
                  setExpiringVaccines([]);
                  setShowExpirationAlert(false);
                }

                const lowStock = checkLowStockVaccines(vaccines);
                if (lowStock.length > 0) {
                  setLowStockVaccines(lowStock);
                  setShowLowStockAlert(true);
                  showLowStockNotification(lowStock);
                } else {
                  setLowStockVaccines([]);
                  setShowLowStockAlert(false);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 20px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
              onMouseOver={e => {
                e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={e => {
                e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.3)';
              }}
            >
              <span className="icon" style={{ fontSize: '16px' }}>🔄</span>
              <span>Refresh</span>
            </button>
            
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

        {/* User Accountability Banner */}
        {user && (
          <div className="alert alert-info border-0 shadow-sm mb-4" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: '12px'
          }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="fas fa-user-shield fa-2x opacity-75"></i>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">
                    <i className="fas fa-fingerprint me-2"></i>
                    Activity Accountability
                  </h6>
                  <p className="mb-0 opacity-90">
                    All vaccine activities are tracked and attributed to: <strong>{user.name}</strong> ({user.role})
                  </p>
                  <small className="opacity-75 d-flex align-items-center mt-1">
                    <i className="fas fa-history me-1"></i>
                    Check the Audit Logs page to view all activities
                  </small>
                </div>
              </div>
              <div className="text-end">
                <div className="badge bg-light text-dark px-3 py-2" style={{ fontSize: '0.9rem' }}>
                  <i className="fas fa-clock me-1"></i>
                  Session Active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        <Toast
          show={showToastNotification}
          onClose={() => setShowToastNotification(false)}
          message={toastMessage}
          type="warning"
          title="Vaccine Expiration Alert"
          duration={8000}
        />

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
                  The following vaccines are nearing their expiration date (within 30 days):
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
                <div className="mt-3">
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => setShowViewAllExpiringModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = 'linear-gradient(135deg, #e0a800 0%, #d39e00 100%)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
                      e.target.style.transform = 'none';
                    }}
                  >
                    <i className="fas fa-list me-1"></i>
                    View All ({expiringVaccines.length})
                  </button>
                </div>
              </div>
            </div>
            {/* Remove close button - alerts should always be visible when items exist */}
          </div>
        )}

        {/* Low Stock Alert Notification */}
        {showLowStockAlert && lowStockVaccines.length > 0 && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert" style={{
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            border: '2px solid #dc3545',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.2)',
            animation: 'slideInDown 0.5s ease-out'
          }}>
            <div className="d-flex align-items-center">
              <div style={{
                background: '#dc3545',
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
                <i className="fas fa-boxes"></i>
              </div>
              <div style={{ flex: 1 }}>
                <h6 className="alert-heading mb-2" style={{ color: '#721c24', fontWeight: '600' }}>
                  <i className="fas fa-exclamation-circle me-2"></i>
                  Low Stock Alert - Restock Needed
                </h6>
                <p className="mb-2" style={{ color: '#721c24' }}>
                  The following vaccines have low stock (less than 100 units) and need restocking:
                </p>
                <div className="row">
                  {lowStockVaccines.slice(0, 3).map((vaccine, idx) => (
                    <div key={idx} className="col-md-4 mb-2">
                      <div style={{
                        background: 'rgba(220, 53, 69, 0.1)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220, 53, 69, 0.3)'
                      }}>
                        <strong style={{ color: '#721c24' }}>{vaccine.product}</strong><br/>
                        <small style={{ color: '#721c24' }}>
                          Current Stock: 
                          <span className="badge bg-danger text-white ms-2">
                            {vaccine.remaining_balance} units
                          </span>
                        </small><br/>
                        <small style={{ color: '#721c24' }}>
                          <i className="fas fa-arrow-up text-danger me-1"></i>
                          Restock needed
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                {lowStockVaccines.length > 3 && (
                  <p className="mb-0 mt-2" style={{ color: '#721c24', fontSize: '0.9rem' }}>
                    <i className="fas fa-info-circle me-1"></i>
                    And {lowStockVaccines.length - 3} more vaccines need restocking...
                  </p>
                )}
                <div className="mt-3">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowViewAllLowStockModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                      e.target.style.transform = 'none';
                    }}
                  >
                    <i className="fas fa-list me-1"></i>
                    View All ({lowStockVaccines.length})
                  </button>
                </div>
              </div>
            </div>
            {/* Remove close button - alerts should always be visible when items exist */}
          </div>
        )}

        {/* Enhanced Search Bar */}
        <div className="search-container">
          <Form
            className="d-flex w-100 w-md-75"
            onSubmit={e => {
              e.preventDefault();
              setSearch(searchInput);
            }}
          >
            <InputGroup style={{ width: '100%' }}>
              <InputGroup.Text style={{ 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                border: '1px solid #dee2e6',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                fontWeight: '600',
                color: '#495057'
              }}>
                <i className="bi bi-search me-2"></i>
                Search
              </InputGroup.Text>
              <FormControl
                placeholder="Search vaccine..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  border: '1px solid #dee2e6',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderRadius: '0',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.9rem',
                  background: 'white',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                  e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#dee2e6';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div className="d-flex flex-column flex-sm-row" style={{ width: 'auto' }}>
                <Button
                  className="btn-search"
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    border: '1px solid #007bff',
                    color: 'white',
                    borderRadius: '0',
                    padding: '0.5rem 0.75rem',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    minWidth: '70px',
                    justifyContent: 'center',
                    marginBottom: '0.25rem'
                  }}
                  onMouseOver={e => {
                    e.target.style.background = 'linear-gradient(135deg, #0056b3 0%, #004085 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
                  }}
                  onMouseOut={e => {
                    e.target.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
                  }}
                >
                  <i className="bi bi-search" style={{ fontSize: '0.9rem' }}></i>
                  <span>Search</span>
                </Button>
                <Button
                  className="btn-reset"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    border: '1px solid #6c757d',
                    color: 'white',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.5rem 0.75rem',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(108, 117, 125, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    minWidth: '70px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={e => {
                    e.target.style.background = 'linear-gradient(135deg, #5a6268 0%, #495057 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(108, 117, 125, 0.3)';
                  }}
                  onMouseOut={e => {
                    e.target.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = '0 2px 4px rgba(108, 117, 125, 0.2)';
                  }}
                >
                  <i className="bi bi-arrow-clockwise" style={{ fontSize: '0.9rem' }}></i>
                  <span>Reset</span>
                </Button>
              </div>
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
          <div className="card-header mb-3" style={{ 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 fw-bold">
                <i className="fas fa-vial me-2 text-primary"></i>
                Vaccine Inventory
              </h5>
              <div className="current-user-indicator">
                <span className="badge bg-success px-3 py-2" style={{ fontSize: '0.85rem' }}>
                  <i className="fas fa-user-check me-1"></i>
                  Managing as: <strong>{user?.name || 'Unknown User'}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="table-responsive">
          <Table bordered hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-header" style={{ backgroundColor: '#007bff', color: 'white' }}>
              <tr>
                  <th className="d-none d-md-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Date Received</th>
                  <th style={{ backgroundColor: '#007bff', color: 'white' }}>Product</th>
                  <th className="text-end d-none d-lg-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Beginning Balance</th>
                  <th className="text-end d-none d-xl-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Delivery Date</th>
                  <th className="text-end d-none d-lg-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Consumption</th>
                  <th className="text-end d-none d-xl-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Stock Transfer In</th>
                  <th className="text-end d-none d-xl-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Stock Transfer Out</th>
                  <th className="text-end d-none d-md-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Expiration Date</th>
                  <th className="text-end" style={{ backgroundColor: '#007bff', color: 'white' }}>Remaining Balance</th>
                  <th className="text-center d-none d-lg-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Modified By</th>
                  <th className="text-center" style={{ backgroundColor: '#007bff', color: 'white' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentVaccines.length > 0 ? (
                currentVaccines.map((vaccine, idx) => (
                  <tr
                    key={vaccine.id}
                    className={vaccine.remaining_balance < 100 ? "table-danger" : vaccine.remaining_balance < 50 ? "table-warning" : ""}
                    style={vaccine.remaining_balance < 100 ? {
                      backgroundColor: '#f8d7da',
                      borderLeft: '4px solid #dc3545',
                      fontWeight: 'bold'
                    } : vaccine.remaining_balance < 50 ? {
                      backgroundColor: '#fff3cd',
                      borderLeft: '4px solid #ffc107'
                    } : {}}
                  >
                    <td className="fw-semibold d-none d-md-table-cell">{vaccine.date_received}</td>
                    <td className="fw-bold">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{vaccine.product}</span>
                        {vaccine.remaining_balance < 100 && (
                          <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '1rem' }} title="Needs Restock"></i>
                        )}
                      </div>
                    </td>
                    <td className="text-end fw-semibold d-none d-lg-table-cell">{vaccine.beginning_balance}</td>
                    <td className="text-end fw-semibold d-none d-xl-table-cell">{vaccine.delivery}</td>
                    <td className="text-end fw-semibold negative d-none d-lg-table-cell">{vaccine.consumption}</td>
                    <td className="text-end fw-semibold positive d-none d-xl-table-cell">{vaccine.stock_trasfer_in}</td>
                    <td className="text-end fw-semibold negative d-none d-xl-table-cell">{vaccine.stock_trasfer_out}</td>
                    <td className="text-end fw-semibold d-none d-md-table-cell">
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
                    <td className="text-end fw-bold primary">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px'
                      }}>
                        <span style={{
                          color: vaccine.remaining_balance < 100 ? '#dc3545' : vaccine.remaining_balance < 50 ? '#ffc107' : '#28a745',
                          fontWeight: 'bold'
                        }}>
                          {vaccine.remaining_balance}
                        </span>
                        {vaccine.remaining_balance < 100 && (
                          <span className="badge bg-danger text-white" style={{ fontSize: '0.7rem' }}>
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            RESTOCK
                          </span>
                        )}
                        {vaccine.remaining_balance >= 100 && vaccine.remaining_balance < 50 && (
                          <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                            <i className="fas fa-exclamation-circle me-1"></i>
                            LOW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center d-none d-lg-table-cell">
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
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="modal-responsive">
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0'
          }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
              <i className="fas fa-plus-circle" style={{ fontSize: '1.2rem' }}></i>
              Add New Vaccine Entry
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '2rem', background: '#f8f9fa' }}>
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
                      min="0"
                      value={newVaccine.beginning_balance}
                      className={beginningBalanceError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setBeginningBalanceError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setBeginningBalanceError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setNewVaccine({ ...newVaccine, beginning_balance: value });
                          }
                        }
                      }}
                    />
                    {beginningBalanceError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
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
                      min="0"
                      value={newVaccine.consumption}
                      className={consumptionError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setConsumptionError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setConsumptionError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setNewVaccine({ ...newVaccine, consumption: value });
                          }
                        }
                      }}
                    />
                    {consumptionError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Transfer In</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      min="0"
                      value={newVaccine.stock_trasfer_in}
                      className={stockInError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setStockInError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setStockInError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setNewVaccine({ ...newVaccine, stock_trasfer_in: value });
                          }
                        }
                      }}
                    />
                    {stockInError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
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
                      min="0"
                      value={newVaccine.stock_trasfer_out}
                      className={stockOutError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setStockOutError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setStockOutError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setNewVaccine({ ...newVaccine, stock_trasfer_out: value });
                          }
                        }
                      }}
                    />
                    {stockOutError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
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
          <Modal.Footer style={{ 
            background: '#fff', 
            borderTop: '1px solid #e9ecef',
            padding: '1.5rem 2rem'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowModal(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newVaccine.date_received || !newVaccine.product}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: (!newVaccine.date_received || !newVaccine.product) ? 0.6 : 1
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Add Entry
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Vaccine Entry Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="modal-responsive">
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0'
          }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
              <i className="fas fa-edit" style={{ fontSize: '1.2rem' }}></i>
              Edit Vaccine Entry
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '2rem', background: '#f8f9fa' }}>
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
                      min="0"
                      value={editVaccine.beginning_balance}
                      className={editBeginningBalanceError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setEditBeginningBalanceError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setEditBeginningBalanceError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setEditVaccine({ ...editVaccine, beginning_balance: value });
                          }
                        }
                      }}
                    />
                    {editBeginningBalanceError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
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
                      min="0"
                      value={editVaccine.consumption}
                      className={editConsumptionError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setEditConsumptionError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setEditConsumptionError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setEditVaccine({ ...editVaccine, consumption: value });
                          }
                        }
                      }}
                    />
                    {editConsumptionError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Stock Transfer In</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      min="0"
                      value={editVaccine.stock_trasfer_in}
                      className={editStockInError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setEditStockInError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setEditStockInError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setEditVaccine({ ...editVaccine, stock_trasfer_in: value });
                          }
                        }
                      }}
                    />
                    {editStockInError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
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
                      min="0"
                      value={editVaccine.stock_trasfer_out}
                      className={editStockOutError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setEditStockOutError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setEditStockOutError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setEditVaccine({ ...editVaccine, stock_trasfer_out: value });
                          }
                        }
                      }}
                    />
                    {editStockOutError && (
                      <div className="invalid-feedback">
                        ❌ Negative numbers are not allowed! Please enter a positive number.
                      </div>
                    )}
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
          <Modal.Footer style={{ 
            background: '#fff', 
            borderTop: '1px solid #e9ecef',
            padding: '1.5rem 2rem'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSave}
              disabled={!editVaccine.date_received || !editVaccine.product}
              style={{
                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: (!editVaccine.date_received || !editVaccine.product) ? 0.6 : 1
              }}
            >
              <i className="bi bi-check-circle"></i>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Use Vaccine Modal */}
        <Modal show={showUseVaccineModal} onHide={() => setShowUseVaccineModal(false)} centered className="modal-responsive">
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            color: 'white',
            border: 'none'
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
                    className={useQuantityError ? 'is-invalid' : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Check for negative numbers
                      if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                        setUseQuantityError(true);
                        setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                        setShowToastNotification(true);
                        setTimeout(() => setShowToastNotification(false), 3000);
                      } else {
                        setUseQuantityError(false);
                        // Prevent negative numbers and ensure it's not greater than available stock
                        if (value === '' || (parseInt(value) >= 0 && value >= 0 && parseInt(value) <= selectedVaccineForUse.remaining_balance)) {
                          setUseQuantity(value);
                        }
                      }
                    }}
                    min="1"
                    max={selectedVaccineForUse.remaining_balance}
                  />
                  {useQuantityError && (
                    <div className="invalid-feedback">
                      ❌ Negative numbers are not allowed! Please enter a positive number.
                    </div>
                  )}
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
          <Modal.Footer style={{ 
            background: '#fff', 
            borderTop: '1px solid #e9ecef',
            padding: '1.5rem 2rem'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowUseVaccineModal(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleUseVaccineSubmit}
              disabled={!useQuantity || parseInt(useQuantity) <= 0 || parseInt(useQuantity) > selectedVaccineForUse?.remaining_balance}
              style={{
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: (!useQuantity || parseInt(useQuantity) <= 0 || parseInt(useQuantity) > selectedVaccineForUse?.remaining_balance) ? 0.6 : 1
              }}
            >
              <i className="fas fa-syringe"></i>
              Use Vaccine
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View All Expiring Vaccines Modal */}
        {showViewAllExpiringModal && (
          <div 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.7)', 
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setShowViewAllExpiringModal(false)}
          >
            <div 
              style={{
                width: '90vw',
                height: '85vh',
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transform: 'scale(1)',
                transition: 'all 0.3s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                style={{
                  background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', margin: 0, fontSize: '1.2rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.2rem' }}></i>
                  All Expiring Vaccines ({expiringVaccines.length})
                </h5>
                <button 
                  type="button" 
                  onClick={() => setShowViewAllExpiringModal(false)}
                  style={{ 
                    fontSize: '1.5rem', 
                    background: 'none', 
                    border: 'none', 
                    color: 'white',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              
              {/* Search Bar */}
              <div style={{ padding: '1rem 1.5rem', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <InputGroup>
                  <InputGroup.Text style={{ 
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid #dee2e6',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    fontWeight: '600',
                    color: '#495057'
                  }}>
                    <i className="bi bi-search me-2"></i>
                    Search
                  </InputGroup.Text>
                  <FormControl
                    placeholder="Search expiring vaccines..."
                    value={expiringSearch}
                    onChange={(e) => setExpiringSearch(e.target.value)}
                    style={{
                      border: '1px solid #dee2e6',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderRadius: '0',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.9rem',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setExpiringSearch("")}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '0 8px 8px 0',
                      padding: '0.5rem 0.75rem',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </Button>
                </InputGroup>
              </div>

              <div 
                style={{ 
                  padding: '1rem', 
                  background: '#f8f9fa', 
                  flex: 1,
                  overflowY: 'auto'
                }}
              >
                {(() => {
                  const filteredExpiring = expiringVaccines.filter(vaccine =>
                    vaccine.product.toLowerCase().includes(expiringSearch.toLowerCase()) ||
                    vaccine.expiration_date.toLowerCase().includes(expiringSearch.toLowerCase())
                  );

                  return filteredExpiring.length > 0 ? (
                    <div className="table-responsive">
                      <Table bordered hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-header" style={{ backgroundColor: '#ffc107', color: 'white' }}>
                          <tr>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Vaccine Product</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Date Received</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Expiration Date</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Current Stock</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Days Until Expiry</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpiring.map((vaccine, idx) => (
                            <tr key={idx} style={{
                              backgroundColor: getDaysUntilExpiration(vaccine.expiration_date) <= 7 ? '#f8d7da' : '#fff3cd',
                              borderLeft: getDaysUntilExpiration(vaccine.expiration_date) <= 7 ? '4px solid #dc3545' : '4px solid #ffc107'
                            }}>
                              <td className="fw-semibold">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="fas fa-vial text-warning"></i>
                                  {vaccine.product}
                                </div>
                              </td>
                              <td className="fw-semibold">{vaccine.date_received}</td>
                              <td className="fw-semibold">{vaccine.expiration_date}</td>
                              <td className="fw-bold text-primary">{vaccine.remaining_balance} units</td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{
                                    backgroundColor: getDaysUntilExpiration(vaccine.expiration_date) <= 7 ? '#dc3545' : '#ffc107',
                                    color: getDaysUntilExpiration(vaccine.expiration_date) <= 7 ? 'white' : 'black',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {getDaysUntilExpiration(vaccine.expiration_date)} days
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '4rem 2rem'
                    }}>
                      <i className="fas fa-search text-muted" style={{ fontSize: '3rem' }}></i>
                      <h4 style={{ marginTop: '1rem', color: '#6c757d' }}>No matching results</h4>
                      <p style={{ color: '#6c757d' }}>Try adjusting your search terms.</p>
                    </div>
                  );
                })()}
              </div>
              
              <div 
                style={{ 
                  background: '#fff', 
                  borderTop: '2px solid #e9ecef',
                  padding: '1rem 1.5rem',
                  position: 'sticky',
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <button 
                  onClick={() => setShowViewAllExpiringModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <i className="fas fa-times"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View All Low Stock Vaccines Modal */}
        {showViewAllLowStockModal && (
          <div 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.7)', 
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setShowViewAllLowStockModal(false)}
          >
            <div 
              style={{
                width: '90vw',
                height: '85vh',
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transform: 'scale(1)',
                transition: 'all 0.3s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                style={{
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', margin: 0, fontSize: '1.2rem' }}>
                  <i className="fas fa-boxes" style={{ fontSize: '1.2rem' }}></i>
                  All Low Stock Vaccines ({lowStockVaccines.length})
                </h5>
                <button 
                  type="button" 
                  onClick={() => setShowViewAllLowStockModal(false)}
                  style={{ 
                    fontSize: '1.5rem', 
                    background: 'none', 
                    border: 'none', 
                    color: 'white',
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
              
              {/* Search Bar */}
              <div style={{ padding: '1rem 1.5rem', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <InputGroup>
                  <InputGroup.Text style={{ 
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid #dee2e6',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    fontWeight: '600',
                    color: '#495057'
                  }}>
                    <i className="bi bi-search me-2"></i>
                    Search
                  </InputGroup.Text>
                  <FormControl
                    placeholder="Search low stock vaccines..."
                    value={lowStockSearch}
                    onChange={(e) => setLowStockSearch(e.target.value)}
                    style={{
                      border: '1px solid #dee2e6',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderRadius: '0',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.9rem',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setLowStockSearch("")}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '0 8px 8px 0',
                      padding: '0.5rem 0.75rem',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </Button>
                </InputGroup>
              </div>

              <div 
                style={{ 
                  padding: '1rem', 
                  background: '#f8f9fa', 
                  flex: 1,
                  overflowY: 'auto'
                }}
              >
                {(() => {
                  const filteredLowStock = lowStockVaccines.filter(vaccine =>
                    vaccine.product.toLowerCase().includes(lowStockSearch.toLowerCase()) ||
                    vaccine.expiration_date.toLowerCase().includes(lowStockSearch.toLowerCase())
                  );

                  return filteredLowStock.length > 0 ? (
                    <div className="table-responsive">
                      <Table bordered hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-header" style={{ backgroundColor: '#dc3545', color: 'white' }}>
                          <tr>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Vaccine Product</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Date Received</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Expiration Date</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Current Stock</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLowStock.map((vaccine, idx) => (
                            <tr key={idx} style={{
                              backgroundColor: '#f8d7da',
                              borderLeft: '4px solid #dc3545'
                            }}>
                              <td className="fw-semibold">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="fas fa-vial text-danger"></i>
                                  {vaccine.product}
                                </div>
                              </td>
                              <td className="fw-semibold">{vaccine.date_received}</td>
                              <td className="fw-semibold">{vaccine.expiration_date}</td>
                              <td className="fw-bold text-danger">{vaccine.remaining_balance} units</td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                  RESTOCK NEEDED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '4rem 2rem'
                    }}>
                      <i className="fas fa-search text-muted" style={{ fontSize: '3rem' }}></i>
                      <h4 style={{ marginTop: '1rem', color: '#6c757d' }}>No matching results</h4>
                      <p style={{ color: '#6c757d' }}>Try adjusting your search terms.</p>
                    </div>
                  );
                })()}
              </div>
              
              <div 
                style={{ 
                  background: '#fff', 
                  borderTop: '2px solid #e9ecef',
                  padding: '1rem 1.5rem',
                  position: 'sticky',
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <button 
                  onClick={() => setShowViewAllLowStockModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <i className="fas fa-times"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccineList;
