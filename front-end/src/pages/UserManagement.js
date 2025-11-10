import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, InputGroup, FormControl, Spinner, Pagination, Alert, Card, Row, Col, Badge } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Toast from "../components/Toast";
import "../styles/UserManagement.css";

const API_URL = "http://127.0.0.1:8000/api";

const UserManagement = () => {
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

  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [passwordIndex, setPasswordIndex] = useState(null);
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [statistics, setStatistics] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'encoder',
    status: 'active',
    notes: ''
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'encoder', label: 'Data Encoder' },
    { value: 'nursing_attendant', label: 'Nursing Attendant' },
    { value: 'midwife', label: 'Midwife' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'cold_chain_manager', label: 'Cold Chain Manager' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', variant: 'success' },
    { value: 'inactive', label: 'Inactive', variant: 'secondary' },
    { value: 'suspended', label: 'Suspended', variant: 'danger' }
  ];

  // Fetch users
  const fetchUsers = async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        per_page: perPage
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await authenticatedFetch(`${API_URL}/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users.data);
        setTotalPages(data.users.last_page);
        setCurrentPage(data.users.current_page);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/users-statistics`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUsers();
      fetchStatistics();
    }
  }, [isAuthenticated]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
    fetchUsers(1, searchInput);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
    fetchUsers(1, '');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'encoder',
      status: 'active',
      notes: ''
    });
    setFormErrors({});
  };

  // Reset password form
  const resetPasswordForm = () => {
    setPasswordData({
      password: '',
      password_confirmation: ''
    });
    setPasswordErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle password form input changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToastNotification(true);
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await authenticatedFetch(`${API_URL}/users`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('User created successfully!', 'success');
        setShowModal(false);
        resetForm();
        fetchUsers(currentPage, search);
        fetchStatistics();
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          showToast(data.message || 'Failed to create user', 'error');
        }
      }
    } catch (err) {
      showToast('Failed to create user: ' + err.message, 'error');
    }
  };

  // Edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      const userToEdit = users[editIndex];
      const response = await authenticatedFetch(`${API_URL}/users/${userToEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('User updated successfully!', 'success');
        setShowEditModal(false);
        resetForm();
        fetchUsers(currentPage, search);
        fetchStatistics();
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          showToast(data.message || 'Failed to update user', 'error');
        }
      }
    } catch (err) {
      showToast('Failed to update user: ' + err.message, 'error');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      const userToDelete = users[deleteIndex];
      const response = await authenticatedFetch(`${API_URL}/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showToast('User deleted successfully!', 'success');
        setShowDeleteModal(false);
        fetchUsers(currentPage, search);
        fetchStatistics();
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast('Failed to delete user: ' + err.message, 'error');
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    try {
      const userToReset = users[passwordIndex];
      const response = await authenticatedFetch(`${API_URL}/users/${userToReset.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Password reset successfully!', 'success');
        setShowPasswordModal(false);
        resetPasswordForm();
      } else {
        if (data.errors) {
          setPasswordErrors(data.errors);
        } else {
          showToast(data.message || 'Failed to reset password', 'error');
        }
      }
    } catch (err) {
      showToast('Failed to reset password: ' + err.message, 'error');
    }
  };

  // Update user status
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        showToast(`User status updated to ${newStatus}!`, 'success');
        fetchUsers(currentPage, search);
        fetchStatistics();
      } else {
        showToast(data.message || 'Failed to update user status', 'error');
      }
    } catch (err) {
      showToast('Failed to update user status: ' + err.message, 'error');
    }
  };

  // Open edit modal
  const openEditModal = (index) => {
    const userToEdit = users[index];
    setFormData({
      fullName: userToEdit.full_name || userToEdit.name,
      username: userToEdit.username,
      email: userToEdit.email,
      password: '',
      password_confirmation: '',
      role: userToEdit.role,
      status: userToEdit.status,
      notes: userToEdit.notes || ''
    });
    setEditIndex(index);
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open password reset modal
  const openPasswordModal = (index) => {
    setPasswordIndex(index);
    resetPasswordForm();
    setShowPasswordModal(true);
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.label : role;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge bg={statusOption?.variant || 'secondary'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <i className="fas fa-users me-2"></i>
              User Management
            </h1>
            <p className="page-subtitle">Manage system users and permissions</p>
          </div>
          <div className="header-actions">
            <Button 
              variant="primary" 
              className="btn-add-user"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <i className="fas fa-plus me-2"></i>
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon stat-icon-primary">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-success">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.active_users}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-warning">
              <i className="fas fa-user-clock"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.inactive_users}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-danger">
              <i className="fas fa-user-slash"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.suspended_users}</div>
              <div className="stat-label">Suspended</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="main-content-card">
        {/* Search and Filters */}
        <div className="content-header">
          <div className="search-section">
            <Form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
                <i className="fas fa-search search-icon"></i>
                <FormControl
                  className="search-input"
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {search && (
                  <Button 
                    variant="link" 
                    className="clear-search-btn"
                    onClick={clearSearch}
                    title="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="error-alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Users Table */}
        <div className="table-container">
          <Table className="users-table">
            <thead>
              <tr>
                <th className="col-user">User</th>
                <th className="col-role">Role</th>
                <th className="col-status">Status</th>
                <th className="col-activity">Last Activity</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="user-row">
                  <td className="user-info">
                    <div className="user-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.full_name || user.name}</div>
                      <div className="user-meta">
                        <span className="username">@{user.username}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="role-cell">
                    <span className={`role-badge role-badge-${user.role}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="status-cell">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="activity-cell">
                    <div className="activity-info">
                      <div className="last-login">{formatDate(user.last_login_at)}</div>
                      <div className="created-date">Created {formatDate(user.created_at)}</div>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="action-btn action-btn-edit"
                        onClick={() => openEditModal(index)}
                        title="Edit User Information"
                      >
                        <i className="fas fa-edit me-1"></i>
                        <span>Edit</span>
                      </Button>
                      
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="action-btn action-btn-password"
                        onClick={() => openPasswordModal(index)}
                        title="Reset User Password"
                      >
                        <i className="fas fa-key me-1"></i>
                        <span>Password</span>
                      </Button>
                      
                      {user.status === 'active' ? (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="action-btn action-btn-deactivate"
                          onClick={() => handleStatusChange(user.id, 'inactive')}
                          title="Deactivate User Account"
                        >
                          <i className="fas fa-pause me-1"></i>
                          <span>Deactivate</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="action-btn action-btn-activate"
                          onClick={() => handleStatusChange(user.id, 'active')}
                          title="Activate User Account"
                        >
                          <i className="fas fa-play me-1"></i>
                          <span>Activate</span>
                        </Button>
                      )}
                      
                      {user.status !== 'suspended' ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="action-btn action-btn-suspend"
                          onClick={() => handleStatusChange(user.id, 'suspended')}
                          title="Suspend User Account"
                        >
                          <i className="fas fa-ban me-1"></i>
                          <span>Suspend</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="action-btn action-btn-unsuspend"
                          onClick={() => handleStatusChange(user.id, 'active')}
                          title="Unsuspend User Account"
                        >
                          <i className="fas fa-check me-1"></i>
                          <span>Unsuspend</span>
                        </Button>
                      )}
                      
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="action-btn action-btn-delete"
                        onClick={() => {
                          setDeleteIndex(index);
                          setShowDeleteModal(true);
                        }}
                        title="Delete User Account Permanently"
                      >
                        <i className="fas fa-trash me-1"></i>
                        <span>Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination>
            <Pagination.First 
              onClick={() => fetchUsers(1, search)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => fetchUsers(currentPage - 1, search)}
              disabled={currentPage === 1}
            />
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => fetchUsers(page, search)}
              >
                {page}
              </Pagination.Item>
            ))}
            
            <Pagination.Next 
              onClick={() => fetchUsers(currentPage + 1, search)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last 
              onClick={() => fetchUsers(totalPages, search)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {/* Create User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.fullName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.fullName?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.username}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.username?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.role}
                    required
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.role?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.password}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.password_confirmation}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password_confirmation?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional notes about this user..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.fullName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.fullName?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.username}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.username?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.role}
                    required
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.role?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional notes about this user..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Update User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user "{users[deleteIndex]?.full_name || users[deleteIndex]?.name}"? 
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResetPassword}>
          <Modal.Body>
            <p>Reset password for user: <strong>{users[passwordIndex]?.full_name || users[passwordIndex]?.name}</strong></p>
            
            <Form.Group className="mb-3">
              <Form.Label>New Password *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordInputChange}
                isInvalid={!!passwordErrors.password}
                required
              />
              <Form.Control.Feedback type="invalid">
                {passwordErrors.password?.[0]}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password *</Form.Label>
              <Form.Control
                type="password"
                name="password_confirmation"
                value={passwordData.password_confirmation}
                onChange={handlePasswordInputChange}
                isInvalid={!!passwordErrors.password_confirmation}
                required
              />
              <Form.Control.Feedback type="invalid">
                {passwordErrors.password_confirmation?.[0]}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Reset Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Toast Notification */}
      <Toast
        show={showToastNotification}
        onClose={() => setShowToastNotification(false)}
        message={toastMessage}
        type={toastType}
      />
    </div>
  );
};

export default UserManagement;
