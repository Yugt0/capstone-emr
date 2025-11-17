import React, { useState, useEffect } from 'react';
import "../styles/ContraceptiveList.css";
import { Modal, Button, Form, Table, InputGroup, FormControl, Spinner, Pagination, Dropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Toast from "../components/Toast";

const API_URL = "http://127.0.0.1:8000/api/contraceptive-inventory";

const ContraceptiveList = () => {
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
  const [showExpirationAlert, setShowExpirationAlert] = useState(true);
  const [expiringContraceptives, setExpiringContraceptives] = useState([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  const [lowStockContraceptives, setLowStockContraceptives] = useState([]);
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
  
  const [newContraceptive, setNewContraceptive] = useState({
    contraceptive_name: "",
    contraceptive_type: "",
    batch_number: "",
    quantity: "",
    expiration_date: ""
  });
  const [quantityError, setQuantityError] = useState(false);
  const [editQuantityError, setEditQuantityError] = useState(false);
  const [useQuantityError, setUseQuantityError] = useState(false);
  const [editContraceptive, setEditContraceptive] = useState({
    contraceptive_name: "",
    contraceptive_type: "",
    batch_number: "",
    quantity: "",
    expiration_date: ""
  });

  // Check for contraceptives with low stock (less than 100)
  const checkLowStockContraceptives = (contraceptiveList) => {
    if (!contraceptiveList || contraceptiveList.length === 0) {
      console.log('No contraceptive list provided or empty list');
      return [];
    }
    
    console.log('=== CHECKING LOW STOCK CONTRACEPTIVES ===');
    console.log('Total contraceptives to check:', contraceptiveList.length);
    
    const lowStock = contraceptiveList.filter(contraceptive => {
      console.log('--- Checking contraceptive stock:', contraceptive.contraceptive_name || 'Unknown');
      console.log('Contraceptive data:', contraceptive);
      
      if (!contraceptive.quantity && contraceptive.quantity !== 0) {
        console.log('❌ No quantity for:', contraceptive.contraceptive_name);
        return false;
      }
      
      const stock = parseInt(contraceptive.quantity) || 0;
      console.log('📦 Current stock:', stock);
      
      const isLowStock = stock > 0 && stock < 100;
      console.log('⚠️ Is low stock (< 100):', isLowStock);
      
      return isLowStock;
    });
    
    console.log('🎯 Found low stock contraceptives:', lowStock.length);
    console.log('Low stock contraceptives:', lowStock);
    return lowStock;
  };

  // Check for contraceptives nearing expiration (30 days prior)
  const checkExpiringContraceptives = (contraceptiveList) => {
    if (!contraceptiveList || contraceptiveList.length === 0) {
      console.log('No contraceptive list provided or empty list');
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999); // Set to end of day
    
    console.log('=== CHECKING EXPIRING CONTRACEPTIVES ===');
    console.log('Today:', today.toISOString());
    console.log('Thirty days from now:', thirtyDaysFromNow.toISOString());
    console.log('Total contraceptives to check:', contraceptiveList.length);
    
    const expiring = contraceptiveList.filter(contraceptive => {
      console.log('--- Checking contraceptive:', contraceptive.contraceptive_name || 'Unknown');
      console.log('Contraceptive data:', contraceptive);
      
      if (!contraceptive.expiration_date) {
        console.log('❌ No expiration date for:', contraceptive.contraceptive_name);
        return false;
      }
      
      const expirationDate = new Date(contraceptive.expiration_date);
      
      // Check if the date is valid
      if (isNaN(expirationDate.getTime())) {
        console.log('❌ Invalid expiration date for:', contraceptive.contraceptive_name, 'date:', contraceptive.expiration_date);
        return false;
      }
      
      expirationDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      console.log('📅 Expiration date:', expirationDate.toISOString());
      
      // Calculate days until expiration
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log('📊 Days until expiry:', daysUntilExpiry);
      
      // More robust expiration checking
      const isExpiring = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      const hasStock = contraceptive.quantity > 0;
      
      // Additional debugging for edge cases
      if (daysUntilExpiry < 0) {
        console.log('⚠️ Product already expired:', contraceptive.contraceptive_name, 'expired', Math.abs(daysUntilExpiry), 'days ago');
      } else if (daysUntilExpiry === 0) {
        console.log('🚨 Product expires today:', contraceptive.contraceptive_name);
      } else if (daysUntilExpiry <= 7) {
        console.log('🔥 Product expires within a week:', contraceptive.contraceptive_name, 'in', daysUntilExpiry, 'days');
      }
      
      console.log('⏰ Is expiring (within 30 days):', isExpiring);
      console.log('📦 Has stock:', hasStock, '(quantity:', contraceptive.quantity, ')');
      
      const shouldInclude = isExpiring && hasStock;
      console.log('✅ Should include in expiring list:', shouldInclude);
      
      return shouldInclude;
    });
    
    console.log('🎯 Found expiring contraceptives:', expiring.length);
    console.log('Expiring contraceptives:', expiring);
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

  // Show automatic notification for low stock contraceptives
  const showLowStockNotification = (lowStockList) => {
    console.log('Showing low stock notification for:', lowStockList.length, 'items');
    if (lowStockList.length > 0) {
      const message = lowStockList.length === 1 
        ? `📦 ${lowStockList[0].contraceptive_name} has low stock (${lowStockList[0].quantity} units)! Restock needed.`
        : `📦 ${lowStockList.length} contraceptives have low stock! Check notification bell for details.`;
      
      console.log('Low stock notification message:', message);
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
    console.log('🔄 Fetching contraceptives from:', API_URL);
    authenticatedFetch(API_URL)
      .then(res => {
        console.log('📡 API Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📊 Received contraceptive data:', data);
        console.log('📊 Number of contraceptives:', data.length);
        
        setContraceptives(data);
        
        // Check for expiring contraceptives
        console.log('🔍 Checking for expiring contraceptives...');
        const expiring = checkExpiringContraceptives(data);
        
        if (expiring.length > 0) {
          console.log('⚠️ Found expiring contraceptives, setting alert');
          setExpiringContraceptives(expiring);
          setShowExpirationAlert(true); // Always show when items exist
          
          // Show automatic notification
          setTimeout(() => {
            showExpirationNotification(expiring);
          }, 1000); // Delay by 1 second after page loads
        } else {
          console.log('✅ No expiring contraceptives found');
          setExpiringContraceptives([]);
          setShowExpirationAlert(false);
        }

        // Check for low stock contraceptives
        console.log('🔍 Checking for low stock contraceptives...');
        const lowStock = checkLowStockContraceptives(data);
        
        if (lowStock.length > 0) {
          console.log('📦 Found low stock contraceptives, setting alert');
          setLowStockContraceptives(lowStock);
          setShowLowStockAlert(true); // Always show when items exist
          
          // Show automatic notification
          setTimeout(() => {
            showLowStockNotification(lowStock);
          }, 2000); // Delay by 2 seconds after page loads
        } else {
          console.log('✅ No low stock contraceptives found');
          setLowStockContraceptives([]);
          setShowLowStockAlert(false);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching contraceptives:', err);
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  // Check for expiring contraceptives and low stock every 5 minutes and also on page focus
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Periodic check for expiring contraceptives and low stock...');
      
      // Check expiring contraceptives
      const expiring = checkExpiringContraceptives(contraceptives);
      console.log('📊 Current expiring contraceptives count:', expiring.length);
      console.log('📊 Previous expiring contraceptives count:', expiringContraceptives.length);
      
      if (expiring.length > 0) {
        setExpiringContraceptives(expiring);
        setShowExpirationAlert(true); // Always show when items exist
        
        // Only show notification if count changed
        if (expiring.length !== expiringContraceptives.length) {
          showExpirationNotification(expiring);
        }
      } else {
        setExpiringContraceptives([]);
        setShowExpirationAlert(false);
      }

      // Check low stock contraceptives
      const lowStock = checkLowStockContraceptives(contraceptives);
      console.log('📊 Current low stock contraceptives count:', lowStock.length);
      console.log('📊 Previous low stock contraceptives count:', lowStockContraceptives.length);
      
      if (lowStock.length > 0) {
        setLowStockContraceptives(lowStock);
        setShowLowStockAlert(true); // Always show when items exist
        
        // Only show notification if count changed
        if (lowStock.length !== lowStockContraceptives.length) {
          showLowStockNotification(lowStock);
        }
      } else {
        setLowStockContraceptives([]);
        setShowLowStockAlert(false);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Also check when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, checking expiring contraceptives and low stock...');
        
        const expiring = checkExpiringContraceptives(contraceptives);
        if (expiring.length > 0) {
          setExpiringContraceptives(expiring);
          setShowExpirationAlert(true); // Always show when items exist
        } else {
          setExpiringContraceptives([]);
          setShowExpirationAlert(false);
        }

        const lowStock = checkLowStockContraceptives(contraceptives);
        if (lowStock.length > 0) {
          setLowStockContraceptives(lowStock);
          setShowLowStockAlert(true); // Always show when items exist
        } else {
          setLowStockContraceptives([]);
          setShowLowStockAlert(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [contraceptives, expiringContraceptives.length, lowStockContraceptives.length]);

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
      const res = await authenticatedFetch(API_URL, {
        method: "POST",
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

      // Check for low stock contraceptives after adding new contraceptive
      const lowStock = checkLowStockContraceptives(updatedContraceptives);
      setLowStockContraceptives(lowStock);
      if (lowStock.length > 0) {
        setShowLowStockAlert(true);
        showLowStockNotification(lowStock);
      }
      
      setShowModal(false);
      setNewContraceptive({ contraceptive_name: "", contraceptive_type: "", batch_number: "", quantity: "", expiration_date: "" });
      
      // Show success notification
      setToastMessage("Contraceptive added successfully!");
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    } catch (err) {
      console.error('Error adding contraceptive:', err);
      setError("Failed to add entry");
      setToastMessage(`Failed to add contraceptive: ${err.message || 'Unknown error'}`);
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
    const contraceptive = contraceptives[index];
    setEditContraceptive({ 
      ...contraceptive,
      expiration_date: formatDateForInput(contraceptive.expiration_date)
    });
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
      const res = await authenticatedFetch(`${API_URL}/${updated.id}`, {
        method: "PUT",
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

      // Check for low stock contraceptives after editing
      const lowStock = checkLowStockContraceptives(newList);
      setLowStockContraceptives(lowStock);
      if (lowStock.length > 0) {
        setShowLowStockAlert(true);
        showLowStockNotification(lowStock);
      } else {
        setShowLowStockAlert(false);
      }
      
      setShowEditModal(false);
      
      // Show success notification
      setToastMessage("Contraceptive updated successfully!");
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    } catch (err) {
      console.error('Error updating contraceptive:', err);
      setError("Failed to update entry");
      setToastMessage(`Failed to update contraceptive: ${err.message || 'Unknown error'}`);
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this contraceptive entry?");
    if (!confirmed) return;
    try {
      const res = await authenticatedFetch(`${API_URL}/${id}`, { method: "DELETE" });
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

      // Check for low stock contraceptives after deletion
      const lowStock = checkLowStockContraceptives(updatedContraceptives);
      setLowStockContraceptives(lowStock);
      if (lowStock.length > 0) {
        setShowLowStockAlert(true);
        showLowStockNotification(lowStock);
      } else {
        setShowLowStockAlert(false);
      }
      
      // Show success notification
      setToastMessage("Contraceptive deleted successfully!");
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
    } catch (err) {
      console.error('Error deleting contraceptive:', err);
      setError("Failed to delete entry");
      setToastMessage(`Failed to delete contraceptive: ${err.message || 'Unknown error'}`);
      setShowToastNotification(true);
      setTimeout(() => setShowToastNotification(false), 4000);
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

      const res = await authenticatedFetch(`${API_URL}/${selectedContraceptiveForUse.id}/use`, {
        method: "POST",
        body: JSON.stringify({ 
          ...updatedContraceptive,
          quantity: quantity 
        })
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

        // Check for low stock contraceptives after using contraceptive
        const lowStock = checkLowStockContraceptives(newList);
        setLowStockContraceptives(lowStock);
        if (lowStock.length > 0) {
          setShowLowStockAlert(true);
          showLowStockNotification(lowStock);
        } else {
          setShowLowStockAlert(false);
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
        `}
      </style>
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
              {(expiringContraceptives.length > 0 || lowStockContraceptives.length > 0) && (
                <div className="position-absolute top-0 start-0 translate-middle notification-indicator"></div>
              )}
              <button
                className={`btn btn-outline-warning position-relative notification-bell ${(expiringContraceptives.length > 0 || lowStockContraceptives.length > 0) ? 'notification-bell-pulse' : ''}`}
                onClick={() => {
                  // Scroll to alerts instead of toggling
                  const expirationAlert = document.querySelector('.expiration-alert');
                  const lowStockAlert = document.querySelector('.alert-danger');
                  if (expirationAlert) {
                    expirationAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else if (lowStockAlert) {
                    lowStockAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
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
                <i className="fas fa-bell notification-icon"></i>
                {/* Notification Badge */}
                {(expiringContraceptives.length > 0 || lowStockContraceptives.length > 0) && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
                    {(expiringContraceptives.length + lowStockContraceptives.length) > 9 ? '9+' : (expiringContraceptives.length + lowStockContraceptives.length)}
                  </span>
                )}
              </button>
              {/* Tooltip */}
              <div className="position-absolute top-100 start-50 translate-middle-x mt-2">
                <div className="bg-dark text-white p-2 rounded notification-tooltip" id="notification-tooltip">
                  {expiringContraceptives.length > 0 && lowStockContraceptives.length > 0
                    ? `${expiringContraceptives.length} expiring, ${lowStockContraceptives.length} low stock`
                    : expiringContraceptives.length > 0 
                      ? `${expiringContraceptives.length} contraceptive(s) expiring soon`
                      : lowStockContraceptives.length > 0
                        ? `${lowStockContraceptives.length} contraceptive(s) low stock`
                        : 'No alerts'
                  }
                </div>
              </div>
            </div>
            
            <button 
              className="btn-refresh-contraceptives" 
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                const expiring = checkExpiringContraceptives(contraceptives);
                if (expiring.length > 0) {
                  setExpiringContraceptives(expiring);
                  setShowExpirationAlert(true);
                  showExpirationNotification(expiring);
                } else {
                  setExpiringContraceptives([]);
                  setShowExpirationAlert(false);
                }

                const lowStock = checkLowStockContraceptives(contraceptives);
                if (lowStock.length > 0) {
                  setLowStockContraceptives(lowStock);
                  setShowLowStockAlert(true);
                  showLowStockNotification(lowStock);
                } else {
                  setLowStockContraceptives([]);
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
              className="btn-add-contraceptive" 
              onClick={() => setShowModal(true)}
            >
              <span className="icon">➕</span>
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
                    All contraceptive activities are tracked and attributed to: <strong>{user.name}</strong> ({user.role})
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
          title="Contraceptive Expiration Alert"
          duration={8000}
        />

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
                  The following contraceptives are nearing their expiration date (within 30 days):
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
                    View All ({expiringContraceptives.length})
                  </button>
                </div>
              </div>
            </div>
            {/* Remove close button - alerts should always be visible when items exist */}
          </div>
        )}

        {/* Low Stock Alert Notification */}
        {showLowStockAlert && lowStockContraceptives.length > 0 && (
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
                  The following contraceptives have low stock (less than 100 units) and need restocking:
                </p>
                <div className="row">
                  {lowStockContraceptives.slice(0, 3).map((contraceptive, idx) => (
                    <div key={idx} className="col-md-4 mb-2">
                      <div style={{
                        background: 'rgba(220, 53, 69, 0.1)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220, 53, 69, 0.3)'
                      }}>
                        <strong style={{ color: '#721c24' }}>{contraceptive.contraceptive_name}</strong><br/>
                        <small style={{ color: '#721c24' }}>
                          Current Stock: 
                          <span className="badge bg-danger text-white ms-2">
                            {contraceptive.quantity} units
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
                {lowStockContraceptives.length > 3 && (
                  <p className="mb-0 mt-2" style={{ color: '#721c24', fontSize: '0.9rem' }}>
                    <i className="fas fa-info-circle me-1"></i>
                    And {lowStockContraceptives.length - 3} more contraceptives need restocking...
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
                    View All ({lowStockContraceptives.length})
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
                placeholder="Search contraceptive..."
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
        <div className="inventory-table">
          <div className="table-responsive">
          <Table bordered hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-header" style={{ backgroundColor: '#007bff', color: 'white' }}>
              <tr>
                  <th className="d-none d-md-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Contraceptive Name</th>
                  <th className="d-none d-lg-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Type</th>
                  <th className="text-center d-none d-sm-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Batch Number</th>
                  <th className="text-end" style={{ backgroundColor: '#007bff', color: 'white' }}>Quantity</th>
                  <th className="text-end d-none d-md-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Expiration Date</th>
                  <th className="text-center d-none d-lg-table-cell" style={{ backgroundColor: '#007bff', color: 'white' }}>Modified By</th>
                  <th className="text-center" style={{ backgroundColor: '#007bff', color: 'white' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentContraceptives.length > 0 ? (
                currentContraceptives.map((contraceptive, idx) => (
                  <tr
                    key={contraceptive.id}
                    className={contraceptive.quantity < 100 ? "table-danger" : contraceptive.quantity < 10 ? "table-warning" : ""}
                    style={contraceptive.quantity < 100 ? {
                      backgroundColor: '#f8d7da',
                      borderLeft: '4px solid #dc3545',
                      fontWeight: 'bold'
                    } : contraceptive.quantity < 10 ? {
                      backgroundColor: '#fff3cd',
                      borderLeft: '4px solid #ffc107'
                    } : {}}
                  >
                    <td className="fw-semibold d-none d-md-table-cell">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{contraceptive.contraceptive_name}</span>
                        {contraceptive.quantity < 100 && (
                          <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '1rem' }} title="Needs Restock"></i>
                        )}
                      </div>
                    </td>
                    <td className="fw-bold d-none d-lg-table-cell">{contraceptive.contraceptive_type}</td>
                    <td className="text-center fw-semibold d-none d-sm-table-cell">{contraceptive.batch_number}</td>
                    <td className="text-end fw-bold primary" style={{ verticalAlign: 'middle', padding: '8px 12px' }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '2px',
                        width: '100%'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          <span style={{
                            color: contraceptive.quantity < 100 ? '#dc3545' : contraceptive.quantity < 10 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            lineHeight: '1.2'
                          }}>
                            {contraceptive.quantity}
                          </span>
                          <span style={{
                            color: contraceptive.quantity < 100 ? '#dc3545' : contraceptive.quantity < 10 ? '#ffc107' : '#28a745',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            lineHeight: '1.2'
                          }}>
                            units
                          </span>
                        </div>
                        {contraceptive.quantity < 100 && (
                          <span className="badge bg-danger text-white" style={{ 
                            fontSize: '0.55rem',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap',
                            lineHeight: '1',
                            marginTop: '1px'
                          }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '0.45rem', marginRight: '1px' }}></i>
                            RESTOCK
                          </span>
                        )}
                        {contraceptive.quantity >= 100 && contraceptive.quantity < 10 && (
                          <span className="badge bg-warning text-dark" style={{ 
                            fontSize: '0.55rem',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap',
                            lineHeight: '1',
                            marginTop: '1px'
                          }}>
                            <i className="fas fa-exclamation-circle" style={{ fontSize: '0.45rem', marginRight: '1px' }}></i>
                            LOW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-end fw-semibold d-none d-md-table-cell">
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
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="modal-responsive">
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0'
          }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
              <i className="fas fa-plus-circle" style={{ fontSize: '1.2rem' }}></i>
              Add New Contraceptive Entry
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '2rem', background: '#f8f9fa' }}>
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
                      min="0"
                      value={newContraceptive.quantity}
                      className={quantityError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setQuantityError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setQuantityError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setNewContraceptive({ ...newContraceptive, quantity: value });
                          }
                        }
                      }}
                    />
                    {quantityError && (
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
              disabled={!newContraceptive.contraceptive_name || !newContraceptive.contraceptive_type || !newContraceptive.batch_number}
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
                opacity: (!newContraceptive.contraceptive_name || !newContraceptive.contraceptive_type || !newContraceptive.batch_number) ? 0.6 : 1
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Add Entry
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Contraceptive Entry Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="modal-responsive">
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0'
          }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
              <i className="fas fa-edit" style={{ fontSize: '1.2rem' }}></i>
              Edit Contraceptive Entry
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '2rem', background: '#f8f9fa' }}>
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
                      min="0"
                      value={editContraceptive.quantity}
                      className={editQuantityError ? 'is-invalid' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check for negative numbers
                        if (value !== '' && (parseInt(value) < 0 || value < 0)) {
                          setEditQuantityError(true);
                          setToastMessage("❌ Negative numbers are not allowed! Please enter a positive number.");
                          setShowToastNotification(true);
                          setTimeout(() => setShowToastNotification(false), 3000);
                        } else {
                          setEditQuantityError(false);
                          // Prevent negative numbers
                          if (value === '' || (parseInt(value) >= 0 && value >= 0)) {
                            setEditContraceptive({ ...editContraceptive, quantity: value });
                          }
                        }
                      }}
                    />
                    {editQuantityError && (
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
              disabled={!editContraceptive.contraceptive_name || !editContraceptive.contraceptive_type || !editContraceptive.batch_number}
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
                opacity: (!editContraceptive.contraceptive_name || !editContraceptive.contraceptive_type || !editContraceptive.batch_number) ? 0.6 : 1
              }}
            >
              <i className="bi bi-check-circle"></i>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Use Contraceptive Modal */}
        <Modal show={showUseContraceptiveModal} onHide={() => setShowContraceptiveModal(false)} centered className="modal-responsive">
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            color: 'white',
            border: 'none'
          }}>
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
                        if (value === '' || (parseInt(value) >= 0 && value >= 0 && parseInt(value) <= selectedContraceptiveForUse.quantity)) {
                          setUseQuantity(value);
                        }
                      }
                    }}
                    min="1"
                    max={selectedContraceptiveForUse.quantity}
                  />
                  {useQuantityError && (
                    <div className="invalid-feedback">
                      ❌ Negative numbers are not allowed! Please enter a positive number.
                    </div>
                  )}
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
          <Modal.Footer style={{ 
            background: '#fff', 
            borderTop: '1px solid #e9ecef',
            padding: '1.5rem 2rem'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowContraceptiveModal(false)}
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
              onClick={handleUseContraceptiveSubmit}
              disabled={!useQuantity || parseInt(useQuantity) <= 0 || parseInt(useQuantity) > selectedContraceptiveForUse?.quantity}
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
                opacity: (!useQuantity || parseInt(useQuantity) <= 0 || parseInt(useQuantity) > selectedContraceptiveForUse?.quantity) ? 0.6 : 1
              }}
            >
              <i className="fas fa-pills"></i>
              Use Contraceptive
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View All Expiring Contraceptives Modal */}
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
                  All Expiring Contraceptives ({expiringContraceptives.length})
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
                    placeholder="Search expiring contraceptives..."
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
                  const filteredExpiring = expiringContraceptives.filter(contraceptive =>
                    contraceptive.contraceptive_name.toLowerCase().includes(expiringSearch.toLowerCase()) ||
                    contraceptive.contraceptive_type.toLowerCase().includes(expiringSearch.toLowerCase()) ||
                    contraceptive.batch_number.toLowerCase().includes(expiringSearch.toLowerCase())
                  );

                  return filteredExpiring.length > 0 ? (
                    <div className="table-responsive">
                      <Table bordered hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-header" style={{ backgroundColor: '#ffc107', color: 'white' }}>
                          <tr>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Contraceptive Name</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Type</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Batch Number</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Quantity</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Expiration Date</th>
                            <th style={{ backgroundColor: '#ffc107', color: 'white' }}>Days Until Expiry</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpiring.map((contraceptive, idx) => (
                            <tr key={idx} style={{
                              backgroundColor: getDaysUntilExpiration(contraceptive.expiration_date) <= 7 ? '#f8d7da' : '#fff3cd',
                              borderLeft: getDaysUntilExpiration(contraceptive.expiration_date) <= 7 ? '4px solid #dc3545' : '4px solid #ffc107'
                            }}>
                              <td className="fw-semibold">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="fas fa-pills text-warning"></i>
                                  {contraceptive.contraceptive_name}
                                </div>
                              </td>
                              <td className="fw-bold">{contraceptive.contraceptive_type}</td>
                              <td className="fw-semibold">{contraceptive.batch_number}</td>
                              <td className="fw-bold text-primary">{contraceptive.quantity} units</td>
                              <td className="fw-semibold">{formatDate(contraceptive.expiration_date)}</td>
                              <td>
                                <span 
                                  className="badge"
                                  style={{
                                    backgroundColor: getDaysUntilExpiration(contraceptive.expiration_date) <= 7 ? '#dc3545' : '#ffc107',
                                    color: getDaysUntilExpiration(contraceptive.expiration_date) <= 7 ? 'white' : 'black',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {getDaysUntilExpiration(contraceptive.expiration_date)} days
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
                    borderRadius: '10px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
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

        {/* View All Low Stock Contraceptives Modal */}
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
                  All Low Stock Contraceptives ({lowStockContraceptives.length})
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
                    placeholder="Search low stock contraceptives..."
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
                  const filteredLowStock = lowStockContraceptives.filter(contraceptive =>
                    contraceptive.contraceptive_name.toLowerCase().includes(lowStockSearch.toLowerCase()) ||
                    contraceptive.contraceptive_type.toLowerCase().includes(lowStockSearch.toLowerCase()) ||
                    contraceptive.batch_number.toLowerCase().includes(lowStockSearch.toLowerCase())
                  );

                  return filteredLowStock.length > 0 ? (
                    <div className="table-responsive">
                      <Table bordered hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-header" style={{ backgroundColor: '#dc3545', color: 'white' }}>
                          <tr>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Contraceptive Name</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Type</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Batch Number</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Current Stock</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Expiration Date</th>
                            <th style={{ backgroundColor: '#dc3545', color: 'white' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLowStock.map((contraceptive, idx) => (
                            <tr key={idx} style={{
                              backgroundColor: '#f8d7da',
                              borderLeft: '4px solid #dc3545'
                            }}>
                              <td className="fw-semibold">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="fas fa-pills text-danger"></i>
                                  {contraceptive.contraceptive_name}
                                </div>
                              </td>
                              <td className="fw-bold">{contraceptive.contraceptive_type}</td>
                              <td className="fw-semibold">{contraceptive.batch_number}</td>
                              <td className="fw-bold text-danger">{contraceptive.quantity} units</td>
                              <td className="fw-semibold">{formatDate(contraceptive.expiration_date)}</td>
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

export default ContraceptiveList;
