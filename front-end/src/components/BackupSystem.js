import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../styles/BackupSystem.css';

const BackupSystem = () => {
  const [backupStats, setBackupStats] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [automaticBackupInfo, setAutomaticBackupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setLoading(true);
      const data = await api.getBackupDashboard();
      console.log('Backup data received:', data); // Debug log
      
      setBackupStats(data.data?.backup_stats || null);
      setSystemInfo(data.data?.system_info || null);
      setAutomaticBackupInfo(data.data?.automatic_backup_info || null);
      
      const backups = data.data?.available_backups;
      console.log('Available backups:', backups, 'Type:', typeof backups, 'Is Array:', Array.isArray(backups)); // Debug log
      
      setAvailableBackups(Array.isArray(backups) ? backups : []);
    } catch (error) {
      console.error('Error loading backup data:', error); // Debug log
      showMessage('error', 'Failed to load backup data: ' + error.message);
      // Set default values on error
      setBackupStats(null);
      setSystemInfo(null);
      setAvailableBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      const response = await api.createDatabaseBackup();
      
      showMessage('success', response.message);
      loadBackupData(); // Refresh data
    } catch (error) {
      showMessage('error', 'Backup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (backupName) => {
    try {
      const response = await api.downloadBackup(backupName);
      if (response.success) {
        showMessage('success', response.message);
      } else {
        showMessage('error', 'Download failed: ' + response.message);
      }
    } catch (error) {
      showMessage('error', 'Download failed: ' + error.message);
    }
  };

  const deleteBackup = async (backupName) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    
    try {
      await api.deleteBackup(backupName);
      showMessage('success', 'Backup deleted successfully');
      loadBackupData();
    } catch (error) {
      showMessage('error', 'Delete failed: ' + error.message);
    }
  };

  const cleanOldBackups = async () => {
    if (!window.confirm('Are you sure you want to clean old backups?')) return;
    
    try {
      setLoading(true);
      await api.cleanOldBackups();
      showMessage('success', 'Old backups cleaned successfully');
      loadBackupData();
    } catch (error) {
      showMessage('error', 'Cleanup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'Healthy': return 'text-success';
      case 'Warning': return 'text-warning';
      case 'Critical': return 'text-danger';
      default: return 'text-muted';
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'Healthy': return <i className="bi bi-check-circle text-success fs-4"></i>;
      case 'Warning': return <i className="bi bi-exclamation-triangle text-warning fs-4"></i>;
      case 'Critical': return <i className="bi bi-exclamation-triangle text-danger fs-4"></i>;
      default: return <i className="bi bi-info-circle text-muted fs-4"></i>;
    }
  };

  return (
    <div className="backup-container">
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="backup-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="backup-title">System Backup</h1>
              <p className="backup-subtitle">Manage and monitor your EMR system backups</p>
            </div>
            <div>
              <button
                onClick={() => loadBackupData()}
                disabled={loading}
                className="backup-refresh-btn"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`backup-message ${message.type}`}>
            <i className={`bi ${
              message.type === 'success' ? 'bi-check-circle' : 
              message.type === 'error' ? 'bi-exclamation-triangle' : 
              'bi-info-circle'
            } me-2`}></i>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="backup-tabs">
          <div className="backup-tab-nav">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: 'bi-server' },
              { id: 'backups', name: 'Backups', icon: 'bi-cloud-download' },
              { id: 'create', name: 'Create Backup', icon: 'bi-database' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`backup-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <i className={`${tab.icon} me-2`}></i>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* System Health Cards */}
            <div className="backup-stats-grid">
              <div className="backup-stat-card">
                <div className="backup-stat-content">
                  <div className="backup-stat-header">
                    <div className="backup-stat-icon">
                      <i className="bi bi-database text-primary" style={{fontSize: '2rem'}}></i>
                    </div>
                    <div className="backup-stat-info">
                      <div className="backup-stat-label">Total Backups</div>
                      <div className="backup-stat-value">{backupStats?.total_backups || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="backup-stat-card">
                <div className="backup-stat-content">
                  <div className="backup-stat-header">
                    <div className="backup-stat-icon">
                      <i className="bi bi-server text-success" style={{fontSize: '2rem'}}></i>
                    </div>
                    <div className="backup-stat-info">
                      <div className="backup-stat-label">Total Size</div>
                      <div className="backup-stat-value">{backupStats?.total_size_mb || 0} MB</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="backup-stat-card">
                <div className="backup-stat-content">
                  <div className="backup-stat-header">
                    <div className="backup-stat-icon">
                      {getHealthIcon(systemInfo?.system_health)}
                    </div>
                    <div className="backup-stat-info">
                      <div className="backup-stat-label">System Health</div>
                      <div className={`backup-stat-value ${getHealthColor(systemInfo?.system_health)}`}>
                        {systemInfo?.system_health || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="backup-stat-card">
                <div className="backup-stat-content">
                  <div className="backup-stat-header">
                    <div className="backup-stat-icon">
                      <i className="bi bi-shield-check text-info" style={{fontSize: '2rem'}}></i>
                    </div>
                    <div className="backup-stat-info">
                      <div className="backup-stat-label">Available Storage</div>
                      <div className="backup-stat-value">{systemInfo?.storage_available || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="backup-card">
              <div className="backup-card-content">
                <h5 className="mb-3">System Information</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Database Size:</span>
                      <span className="fw-medium">{systemInfo?.database_size || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Last Backup:</span>
                      <span className="fw-medium">{backupStats?.latest_backup ? formatDate(backupStats.latest_backup) : 'Never'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-top">
                  <div className="alert alert-info mb-3 d-flex align-items-center">
                    <i className="bi bi-clock-history me-2 fs-5"></i>
                    <div>
                      <strong>Automatic Daily Backup:</strong> Database backups are automatically created every day at 7:00 AM Philippine Time.
                      You can also create manual backups at any time using the "Create Backup" tab.
                    </div>
                  </div>
                  
                  {/* Automatic Backup Status */}
                  {automaticBackupInfo && (
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title mb-3 d-flex align-items-center">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Automatic Backup Status
                        </h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Last Automatic Backup:</span>
                              <span className="fw-bold text-success">
                                {automaticBackupInfo.last_automatic_backup 
                                  ? formatDate(automaticBackupInfo.last_automatic_backup.date)
                                  : 'Never'}
                              </span>
                            </div>
                            {automaticBackupInfo.last_automatic_backup?.new_values?.backup_file && (
                              <small className="text-muted d-block mt-1">
                                File: {automaticBackupInfo.last_automatic_backup.new_values.backup_file}
                                {automaticBackupInfo.last_automatic_backup.new_values.backup_size && (
                                  <span className="ms-2">
                                    ({Math.round(automaticBackupInfo.last_automatic_backup.new_values.backup_size / 1024 / 1024 * 100) / 100} MB)
                                  </span>
                                )}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Total Automatic Backups:</span>
                              <span className="fw-bold">{automaticBackupInfo.total_automatic_backups}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <span className="text-muted">Success Rate:</span>
                              <span className={`fw-bold ${automaticBackupInfo.success_rate >= 95 ? 'text-success' : automaticBackupInfo.success_rate >= 80 ? 'text-warning' : 'text-danger'}`}>
                                {automaticBackupInfo.success_rate}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {automaticBackupInfo.last_failed_backup && (
                          <div className="alert alert-warning mt-3 mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Last Failed Backup:</strong> {formatDate(automaticBackupInfo.last_failed_backup.date)}
                            <br />
                            <small>{automaticBackupInfo.last_failed_backup.description}</small>
                          </div>
                        )}
                        {automaticBackupInfo.total_automatic_backups === 0 && (
                          <div className="alert alert-secondary mt-3 mb-0">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>No automatic backups yet.</strong> The first automatic backup will run at 7:00 AM Philippine Time.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div className="backup-card">
            <div className="backup-card-content">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Available Backups</h5>
                <button
                  onClick={cleanOldBackups}
                  disabled={loading}
                  className="backup-clean-btn"
                >
                  <i className="bi bi-trash me-2"></i>
                  Clean Old Backups
                </button>
              </div>
              
              {(!availableBackups || availableBackups.length === 0) ? (
                <div className="backup-empty-state">
                  <i className="bi bi-cloud-download backup-empty-icon"></i>
                  <h5 className="backup-empty-title">No backups</h5>
                  <p className="backup-empty-text">Get started by creating a backup.</p>
                </div>
              ) : (
                <div className="backup-table-container">
                  <table className="backup-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(availableBackups || []).map((backup, index) => (
                        <tr key={index}>
                          <td>{backup.name}</td>
                          <td>{formatFileSize(backup.size)}</td>
                          <td>{formatDate(backup.date)}</td>
                          <td>
                            <div className="backup-actions">
                              <button
                                onClick={() => downloadBackup(backup.name)}
                                className="backup-action-btn download"
                              >
                                <i className="bi bi-download me-1"></i>
                                Download
                              </button>
                              <button
                                onClick={() => deleteBackup(backup.name)}
                                className="backup-action-btn delete"
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Backup Tab */}
        {activeTab === 'create' && (
          <div>
            <div className="backup-card">
              <div className="backup-card-content">
                <h5 className="mb-3">Create Database Backup</h5>
                <p className="text-muted mb-4">
                  Create a backup of your EMR database including all patient records and medical data.
                </p>
                
                <div className="backup-create-single">
                  <div className="backup-create-card green">
                    <div className="backup-create-header">
                      <i className="bi bi-database text-success backup-create-icon"></i>
                      <div>
                        <h6 className="backup-create-title">Database Backup</h6>
                        <small className="backup-create-subtitle">Patient Records & Medical Data</small>
                      </div>
                    </div>
                    <p className="backup-create-description">
                      Backs up the database including patient records, medical records, 
                      vaccine tracker, contraceptive inventory, and audit logs.
                    </p>
                    <button
                      onClick={createBackup}
                      disabled={loading}
                      className="backup-create-btn green"
                    >
                      {loading ? 'Creating...' : 'Create Database Backup'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Information */}
            <div className="backup-info-card">
              <div className="backup-info-header">
                <i className="bi bi-info-circle backup-info-icon"></i>
                <div>
                  <h6 className="backup-info-title">Backup Information</h6>
                  <div className="backup-info-list">
                    <ul>
                      <li><strong>Patient Records:</strong> All patient information and medical records</li>
                      <li><strong>Vaccine Tracker:</strong> Newborn immunization and nutrition data</li>
                      <li><strong>Vaccine Inventory:</strong> Vaccine lists and inventory management</li>
                      <li><strong>Contraceptive Inventory:</strong> Family planning and contraceptive data</li>
                      <li><strong>Audit Logs:</strong> System activity and user action logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupSystem;