// API Base URL
const API_BASE = 'http://127.0.0.1:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Clear invalid token and redirect to login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // If we're in a React app, try to redirect to login
    if (window.location && !window.location.pathname.includes('/login')) {
      console.warn('Authentication token expired or invalid. Please log in again.');
      // You might want to show a toast or redirect to login page here
    }
    
    throw new Error('Authentication required. Please log in again.');
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If parsing fails, use the original text or default message
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Direct API functions for common operations
export const api = {
  // Patients
  getPatients: async () => {
    const response = await fetch(`${API_BASE}/patients`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Patient Information
  getPatientInformation: async () => {
    const response = await fetch(`${API_BASE}/patient-information`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getPatientInformationById: async (id) => {
    const response = await fetch(`${API_BASE}/patient-information/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createPatientInformation: async (data) => {
    const response = await fetch(`${API_BASE}/patient-information`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updatePatientInformation: async (id, data) => {
    const response = await fetch(`${API_BASE}/patient-information/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deletePatientInformation: async (id) => {
    const response = await fetch(`${API_BASE}/patient-information/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getPatient: async (id) => {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createPatient: async (data) => {
    const response = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updatePatient: async (id, data) => {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deletePatient: async (id) => {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // Handle 204 No Content response (common for DELETE operations)
    if (response.status === 204) {
      return { success: true, message: 'Patient deleted successfully' };
    }
    // Try to parse JSON, but handle cases where response might be empty
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true, message: 'Patient deleted successfully' };
    } catch (error) {
      // If JSON parsing fails, return success since the delete operation succeeded (status 200-299)
      return { success: true, message: 'Patient deleted successfully' };
    }
  },

  // Tracker Patients
  getTrackerPatients: async () => {
    const response = await fetch(`${API_BASE}/tracker-patients`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getTrackerPatient: async (id) => {
    const response = await fetch(`${API_BASE}/tracker-patients/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createTrackerPatient: async (data) => {
    const response = await fetch(`${API_BASE}/tracker-patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateTrackerPatient: async (id, data) => {
    const response = await fetch(`${API_BASE}/tracker-patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteTrackerPatient: async (id) => {
    const response = await fetch(`${API_BASE}/tracker-patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // DELETE requests return 204 No Content, so no need to parse JSON
    return { success: true };
  },

  // Medical Records
  getMedicalRecords: async () => {
    const response = await fetch(`${API_BASE}/patient-medical-records`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getMedicalRecordsByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE}/patient-medical-records/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getMedicalRecord: async (id) => {
    const response = await fetch(`${API_BASE}/patient-medical-records/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createMedicalRecord: async (data) => {
    const response = await fetch(`${API_BASE}/patient-medical-records`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateMedicalRecord: async (id, data) => {
    const response = await fetch(`${API_BASE}/patient-medical-records/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteMedicalRecord: async (id) => {
    const response = await fetch(`${API_BASE}/patient-medical-records/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // Handle 204 No Content response (common for DELETE operations)
    if (response.status === 204) {
      return { success: true, message: 'Medical record deleted successfully' };
    }
    // Try to parse JSON, but handle cases where response might be empty
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true, message: 'Medical record deleted successfully' };
    } catch (error) {
      // If JSON parsing fails, return success since the delete operation succeeded (status 200-299)
      return { success: true, message: 'Medical record deleted successfully' };
    }
  },

  // Family Planning Clients
  getFamilyPlanningClients: async () => {
    const response = await fetch(`${API_BASE}/family-planning-clients`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getFamilyPlanningClient: async (id) => {
    const response = await fetch(`${API_BASE}/family-planning-clients/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createFamilyPlanningClient: async (data) => {
    const response = await fetch(`${API_BASE}/family-planning-clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateFamilyPlanningClient: async (id, data) => {
    const response = await fetch(`${API_BASE}/family-planning-clients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteFamilyPlanningClient: async (id) => {
    const response = await fetch(`${API_BASE}/family-planning-clients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Newborn Immunizations
  getNewbornImmunizations: async () => {
    const response = await fetch(`${API_BASE}/newborn-immunizations`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getNewbornImmunizationsByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE}/newborn-immunizations/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getNewbornImmunization: async (id) => {
    const response = await fetch(`${API_BASE}/newborn-immunizations/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createNewbornImmunization: async (data) => {
    const response = await fetch(`${API_BASE}/newborn-immunizations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateNewbornImmunization: async (id, data) => {
    const response = await fetch(`${API_BASE}/newborn-immunizations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteNewbornImmunization: async (id) => {
    const response = await fetch(`${API_BASE}/newborn-immunizations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Nutrition 12 Months
  getNutrition12Months: async () => {
    const response = await fetch(`${API_BASE}/nutrition-12months`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getNutrition12MonthsByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE}/nutrition-12months/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getNutrition12MonthsById: async (id) => {
    const response = await fetch(`${API_BASE}/nutrition-12months/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createNutrition12Months: async (data) => {
    const response = await fetch(`${API_BASE}/nutrition-12months`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateNutrition12Months: async (id, data) => {
    const response = await fetch(`${API_BASE}/nutrition-12months/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteNutrition12Months: async (id) => {
    const response = await fetch(`${API_BASE}/nutrition-12months/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Outcomes
  getOutcomes: async () => {
    const response = await fetch(`${API_BASE}/outcomes`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getOutcomesByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE}/outcomes/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getOutcome: async (id) => {
    const response = await fetch(`${API_BASE}/outcomes/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createOutcome: async (data) => {
    const response = await fetch(`${API_BASE}/outcomes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateOutcome: async (id, data) => {
    const response = await fetch(`${API_BASE}/outcomes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteOutcome: async (id) => {
    const response = await fetch(`${API_BASE}/outcomes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Vaccine Lists (requires authentication)
  getVaccineLists: async () => {
    const response = await fetch(`${API_BASE}/vaccine-lists`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getVaccineList: async (id) => {
    const response = await fetch(`${API_BASE}/vaccine-lists/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Contraceptive Inventory
  getContraceptiveInventory: async () => {
    const response = await fetch(`${API_BASE}/contraceptive-inventory`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getContraceptiveInventoryItem: async (id) => {
    const response = await fetch(`${API_BASE}/contraceptive-inventory/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  createContraceptiveInventoryItem: async (data) => {
    const response = await fetch(`${API_BASE}/contraceptive-inventory`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  updateContraceptiveInventoryItem: async (id, data) => {
    const response = await fetch(`${API_BASE}/contraceptive-inventory/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  deleteContraceptiveInventoryItem: async (id) => {
    const response = await fetch(`${API_BASE}/contraceptive-inventory/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Audit Logging
  logAuditActivity: async (data) => {
    const response = await fetch(`${API_BASE}/audit-logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.warn('Failed to log audit activity:', response.status);
      // Don't throw error for audit logging failures
    }
    return response.ok ? response.json() : null;
  },

  getAuditLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/audit-logs?${queryString}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Backup System
  getBackupDashboard: async () => {
    const response = await fetch(`${API_BASE}/backup`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createFullBackup: async () => {
    const response = await fetch(`${API_BASE}/backup/full`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createDatabaseBackup: async () => {
    const response = await fetch(`${API_BASE}/backup/database`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  triggerAutomaticBackup: async () => {
    const response = await fetch(`${API_BASE}/backup/trigger-automatic`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createFilesBackup: async () => {
    const response = await fetch(`${API_BASE}/backup/files`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAvailableBackups: async () => {
    const response = await fetch(`${API_BASE}/backup/list`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  downloadBackup: async (backupName) => {
    const response = await fetch(`${API_BASE}/backup/download/${backupName}`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      // If it's a file download, handle it directly
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true, message: 'Download started' };
    } else {
      // If it's an error response, handle it normally
      return handleResponse(response);
    }
  },

  deleteBackup: async (backupName) => {
    const response = await fetch(`${API_BASE}/backup/delete/${backupName}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  cleanOldBackups: async () => {
    const response = await fetch(`${API_BASE}/backup/clean`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};
