import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/AuditLog.css";

export default function AuditLogTable() {
  const { user, getToken, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0
  });

  // API base URL
  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  const fetchAuditLogs = async (page = 1, search = "", action = "All", user = "All") => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isAuthenticated()) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        page: page,
        per_page: pagination.per_page,
        search: search,
        action: action,
        user: user
      });

      const response = await fetch(`${API_BASE_URL}/audit-logs?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (data.data) {
        setLogs(data.data);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          per_page: data.per_page,
          total: data.total
        });
      } else {
        setLogs(data);
      }
      
      setFilteredLogs(data.data || data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
      
      // Fallback to dummy data for demonstration
  const dummyLogs = [
    {
      id: 1,
      user_name: "Encoder Juan",
      action: "Created patient record",
      model: "Patient",
      model_id: "1001",
      description: "Initial patient intake",
      created_at: "2025-05-06T09:15:00Z",
    },
    {
      id: 2,
      user_name: "Encoder Juan",
      action: "Updated appointment",
      model: "Appointment",
      model_id: "203",
      description: "Rescheduled to next week",
      created_at: "2025-05-06T10:00:00Z",
    },
    {
      id: 3,
      user_name: "Encoder Juan",
      action: "Deleted patient record",
      model: "Patient",
      model_id: "1001",
      description: "Duplicate entry removed",
      created_at: "2025-05-06T10:45:00Z",
    },
  ];
      setLogs(dummyLogs);
      setFilteredLogs(dummyLogs);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated()) {
        fetchAuditLogs(pagination.current_page, searchQuery, filterAction, filterUser);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, pagination.current_page, searchQuery, filterAction, filterUser]);

  useEffect(() => {
    const allowedRoles = ["admin"];
    if (!user || !allowedRoles.includes(user.role)) return;

    fetchAuditLogs();
  }, [user]);

  useEffect(() => {
    let filtered = logs;

    if (filterAction !== "All") {
      filtered = filtered.filter((log) => log.action.includes(filterAction));
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((log) =>
        Object.values(log).some((val) =>
          String(val).toLowerCase().includes(lowerQuery)
        )
      );
    }

    setFilteredLogs(filtered);
  }, [searchQuery, filterAction, logs]);

  const handlePageChange = (page) => {
    fetchAuditLogs(page, searchQuery, filterAction, filterUser);
  };

  const handleSearch = () => {
    fetchAuditLogs(1, searchQuery, filterAction, filterUser);
  };

  const handleActionFilter = (action) => {
    setFilterAction(action);
    fetchAuditLogs(1, searchQuery, action, filterUser);
  };

  const handleUserFilter = (user) => {
    setFilterUser(user);
    fetchAuditLogs(1, searchQuery, filterAction, user);
  };

  // Handle view details for audit log entry
  const handleViewDetails = (log) => {
    console.log('View audit log details:', log);
    // You can implement a modal or detailed view here
    alert(`Audit Log Details:\n\nUser: ${log.user_name}\nAction: ${log.action}\nModel: ${log.model}\nDescription: ${log.description}\nTimestamp: ${formatTimestamp(log.created_at)}\nIP Address: ${log.ip_address || 'N/A'}`);
  };

  // Handle export audit log entry
  const handleExportEntry = (log) => {
    console.log('Export audit log entry:', log);
    // You can implement export functionality here
    const exportData = {
      user_name: log.user_name,
      action: log.action,
      model: log.model,
      description: log.description,
      timestamp: log.created_at,
      ip_address: log.ip_address || 'N/A'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${log.id}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'Created': return 'bg-success';
      case 'Updated': return 'bg-warning text-dark';
      case 'Deleted': return 'bg-danger';
      case 'Viewed': return 'bg-info';
      case 'Login': return 'bg-primary';
      case 'Failed Login': return 'bg-danger';
      case 'Logout': return 'bg-secondary';
      case 'Searched': return 'bg-info';
      case 'Exported': return 'bg-success';
      default: return 'bg-dark';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!user || !["admin"].includes(user.role)) {
    return (
      <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger">
          <i className="fas fa-shield-alt me-2"></i>
          Access denied. Only administrators can view audit logs.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100" style={{ marginTop: '0', paddingTop: '0', }}>
      {/* Modern Header */}
      <div className="header-section">
        <div className="header-card">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-2 fw-bold">
                <i className="fas fa-shield-alt me-3 text-warning"></i>
                System Audit Logs
                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.6rem' }}>
                  <i className="fas fa-crown me-1"></i>
                  Admin Only
                </span>
              </h1>
              <p className="mb-0 opacity-75">
                Welcome, <strong>{user.name}</strong> (Administrator) • 
                <span className="ms-2">
                  <i className="fas fa-clock me-1"></i>
                  Real-time activity monitoring
                </span>
                <span className="ms-3">
                  <i className="fas fa-user-shield me-1 text-warning"></i>
                  <span className="text-warning fw-semibold">Admin Access: {user.name}</span>
                </span>
              </p>
            </div>
            <div className="text-end">
              <div className="h4 mb-1">{pagination.total}</div>
              <small className="opacity-75">Total Activities</small>
            </div>
          </div>
          
          {/* Current User Accountability Banner */}
          <div className="current-user-accountability mt-3 mb-4">
            <div className="alert alert-info border-0 shadow-sm" style={{ 
              background: '#ffffff', 
              color: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="fas fa-user-shield fa-2x" style={{ color: '#3b82f6' }}></i>
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ color: '#1e293b' }}>
                      <i className="fas fa-shield-alt me-2" style={{ color: '#f59e0b' }}></i>
                      Administrative Oversight
                    </h6>
                    <p className="mb-0" style={{ color: '#64748b' }}>
                      Full system audit access granted to: <strong style={{ color: '#1e293b' }}>{user.name}</strong> (Administrator)
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <div className="badge px-3 py-2" style={{ 
                    fontSize: '0.9rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #f59e0b'
                  }}>
                    <i className="fas fa-crown me-1"></i>
                    Admin Session Active
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Activity Summary */}
          <div className="user-activity-summary mt-3">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="summary-content">
                    <div className="summary-number">
                      {logs.filter(log => log.user_name && log.user_name !== 'System').length}
                    </div>
                    <div className="summary-label">User Activities</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="summary-content">
                    <div className="summary-number">
                      {logs.filter(log => log.action === 'Failed Login').length}
                    </div>
                    <div className="summary-label">Failed Logins</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div className="summary-content">
                    <div className="summary-number">
                      {new Set(logs.filter(log => log.user_name && log.user_name !== 'System').map(log => log.user_name)).size}
                    </div>
                    <div className="summary-label">Active Users</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card" style={{
                  background: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0'
                }}>
                  <div className="summary-icon" style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white'
                  }}>
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div className="summary-content">
                    <div className="summary-number" style={{ color: '#1e293b' }}>
                      {logs.filter(log => log.user_name === user.name).length}
                    </div>
                    <div className="summary-label" style={{ color: '#64748b' }}>Your Activities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="search-filter-section">
        <div className="search-filter-card">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search text-muted"></i>
                  </span>
          <input
            type="text"
            className="form-control"
                    placeholder="Search activities, users, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    className="btn btn-primary" 
                    type="button"
                    onClick={handleSearch}
                  >
                    <i className="fas fa-search me-1"></i>
                    Search
                  </button>
                </div>
        </div>
              <div className="col-md-3">
          <select
            className="form-select"
            value={filterAction}
                  onChange={(e) => handleActionFilter(e.target.value)}
          >
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="Updated">Updated</option>
            <option value="Deleted">Deleted</option>
                  <option value="Viewed">Viewed</option>
                  <option value="Login">Login</option>
                  <option value="Failed Login">Failed Login</option>
                  <option value="Logout">Logout</option>
                  <option value="Searched">Searched</option>
                  <option value="Exported">Exported</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filterUser}
                  onChange={(e) => handleUserFilter(e.target.value)}
                >
                  <option value="All">All Users</option>
                  {user && (
                    <option value={user.name} style={{ fontWeight: 'bold', color: '#198754' }}>
                      <i className="fas fa-user-check me-1"></i>
                      {user.name} ({user.role}) - Your Activities
                    </option>
                  )}
                  {/* Add unique users from audit logs */}
                  {logs
                    .filter(log => log.user_name && log.user_name !== 'System' && log.user_name !== user.name)
                    .map(log => log.user_name)
                    .filter((name, index, arr) => arr.indexOf(name) === index)
                    .slice(0, 5) // Limit to 5 most recent unique users
                    .map(userName => (
                      <option key={userName} value={userName}>
                        {userName}
                      </option>
                    ))
                  }
          </select>
              </div>
              <div className="col-md-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    <i className="fas fa-sync-alt me-1"></i>
                    Auto-refresh: 30s
                  </div>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => fetchAuditLogs()}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync-alt me-1"></i>
                        Refresh
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-section">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0 fw-bold">
              <i className="fas fa-list me-2 text-primary"></i>
              Recent Activities
            </h5>
            <div className="current-user-indicator">
              <span className="badge bg-warning text-dark px-3 py-2" style={{ fontSize: '0.85rem' }}>
                <i className="fas fa-crown me-1"></i>
                Admin View: <strong>{user.name}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Loading audit logs...</p>
            </div>
          ) : (
            <>
            <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <i className="fas fa-clock me-1 text-muted"></i>
                        Timestamp
                      </th>
                      <th>
                        <i className="fas fa-user me-1 text-muted"></i>
                        User
                      </th>
                      <th>
                        <i className="fas fa-tasks me-1 text-muted"></i>
                        Action
                      </th>
                      <th>
                        <i className="fas fa-database me-1 text-muted"></i>
                        Model
                      </th>
                      <th>
                        <i className="fas fa-hashtag me-1 text-muted"></i>
                        ID
                      </th>
                      <th>
                        <i className="fas fa-info-circle me-1 text-muted"></i>
                        Description
                      </th>
                      <th>
                        <i className="fas fa-network-wired me-1 text-muted"></i>
                        IP Address
                      </th>
                      <th>
                        <i className="fas fa-cogs me-1 text-muted"></i>
                        Actions
                      </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className={log.user_name === user.name ? 'table-success' : ''} style={{
                        backgroundColor: log.user_name === user.name ? 'rgba(25, 135, 84, 0.05)' : 'transparent',
                        borderLeft: log.user_name === user.name ? '4px solid #198754' : 'none'
                      }}>
                          <td>
                            <div className="timestamp-display">
                              {formatTimestamp(log.created_at)}
                            </div>
                          </td>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar-circle" style={{
                                backgroundColor: log.user_name === user.name ? '#198754' : '#6c757d',
                                color: 'white'
                              }}>
                                <i className={`fas ${log.user_name === user.name ? 'fa-user-check' : 'fa-user'}`}></i>
                              </div>
                              <div className="user-details">
                                <div className="user-name fw-bold fs-6" style={{
                                  color: log.user_name === user.name ? '#198754' : '#0d6efd'
                                }}>
                                  {log.user_name || 'Unknown User'}
                                  {log.user_name === user.name && (
                                    <span className="ms-2 badge bg-success" style={{ fontSize: '0.6rem' }}>
                                      <i className="fas fa-check me-1"></i>
                                      You
                                    </span>
                                  )}
                                </div>
                                <small className="text-muted d-flex align-items-center">
                                  <i className={`fas ${log.user_name === user.name ? 'fa-user-check' : 'fa-user-circle'} me-1`}></i>
                                  <span className="user-role-badge">
                                    {log.user_name === user.name ? 'Your Activity' : 
                                     log.user_name && log.user_name !== 'System' ? 'Active User' : 'System Activity'}
                                  </span>
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge action-badge ${getActionBadgeClass(log.action)}`}>
                              <i className={`fas fa-${
                                log.action === 'Created' ? 'plus' :
                                log.action === 'Updated' ? 'edit' :
                                log.action === 'Deleted' ? 'trash' :
                                log.action === 'Viewed' ? 'eye' :
                                log.action === 'Login' ? 'sign-in-alt' :
                                log.action === 'Failed Login' ? 'exclamation-triangle' :
                                log.action === 'Logout' ? 'sign-out-alt' :
                                log.action === 'Searched' ? 'search' :
                                log.action === 'Exported' ? 'download' : 'circle'
                              } me-1`}></i>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="model-badge">
                              {log.model}
                            </span>
                          </td>
                          <td>
                            <code className="text-muted">{log.model_id || '-'}</code>
                          </td>
                          <td>
                            <div className="description-text">
                              <div className="activity-description">
                                <div className="user-highlight">
                                  <strong className="text-primary fs-6">
                                    <i className="fas fa-user me-1"></i>
                                    {log.user_name || 'Unknown User'}
                                  </strong>
                                </div>
                                <div className="activity-details mt-1">
                                  <span className="activity-text">
                                    {log.description}
                                  </span>
                                </div>
                              </div>
                              <small className="text-muted d-block mt-2">
                                <i className="fas fa-clock me-1"></i>
                                Activity performed by <strong>{log.user_name || 'Unknown User'}</strong>
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="ip-address">
                              {log.ip_address || '-'}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-audit">
                              <button
                                className="btn-view-audit"
                                onClick={() => handleViewDetails(log)}
                                title="View Details"
                                aria-label="View audit log details"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <i className="fas fa-eye" style={{ fontSize: '0.875rem', color: 'white' }}></i>
                              </button>
                              <button
                                className="btn-export-audit"
                                onClick={() => handleExportEntry(log)}
                                title="Export Entry"
                                aria-label="Export audit log entry"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <i className="fas fa-download" style={{ fontSize: '0.875rem', color: 'white' }}></i>
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="8" className="text-center text-muted py-5">
                          <i className="fas fa-inbox fa-2x mb-3 opacity-50"></i>
                          <div>No matching records found.</div>
                          <small>Try adjusting your search or filter criteria.</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="card-footer">
                  <nav aria-label="Audit logs pagination">
                    <ul className="pagination justify-content-center mb-0">
                      {/* Previous Button */}
                      <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                          title="Previous page"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                      </li>
                      
                      {/* First Page */}
                      {pagination.current_page > 3 && (
                        <>
                          <li className="page-item">
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(1)}
                            >
                              1
                            </button>
                          </li>
                          {pagination.current_page > 4 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                        </>
                      )}
                      
                      {/* Pages around current page */}
                      {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                        .filter(page => {
                          return page >= Math.max(1, pagination.current_page - 2) && 
                                 page <= Math.min(pagination.last_page, pagination.current_page + 2);
                        })
                        .map(page => (
                          <li key={page} className={`page-item ${page === pagination.current_page ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                      
                      {/* Last Page */}
                      {pagination.current_page < pagination.last_page - 2 && (
                        <>
                          {pagination.current_page < pagination.last_page - 3 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                          <li className="page-item">
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pagination.last_page)}
                            >
                              {pagination.last_page}
                            </button>
                          </li>
                        </>
                      )}
                      
                      {/* Next Button */}
                      <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          disabled={pagination.current_page === pagination.last_page}
                          title="Next page"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                    
                    {/* Page Info */}
                    <div className="d-flex justify-content-center mt-2">
                      <small className="text-muted">
                        Page {pagination.current_page} of {pagination.last_page} 
                        ({pagination.total} total records)
                      </small>
                    </div>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}