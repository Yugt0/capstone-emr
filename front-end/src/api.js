const API_BASE = 'http://127.0.0.1:8000/api'; // Change if your backend runs elsewhere

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Patients (tracker-patients)
export const getPatients = async () => {
  const response = await fetch(`${API_BASE}/tracker-patients`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const createPatient = async (data) => {
  const response = await fetch(`${API_BASE}/tracker-patients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const updatePatient = async (id, data) => {
  const response = await fetch(`${API_BASE}/tracker-patients/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const deletePatient = async (id) => {
  const response = await fetch(`${API_BASE}/tracker-patients/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // DELETE requests return 204 No Content, so no need to parse JSON
  return { success: true };
};

// Newborn Immunizations
export const getNewbornImmunizations = async () => {
  const response = await fetch(`${API_BASE}/newborn-immunizations`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const getNewbornImmunizationByPatient = async (patientId) => {
  const response = await fetch(`${API_BASE}/newborn-immunizations/patient/${patientId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const createNewbornImmunization = async (data) => {
  const response = await fetch(`${API_BASE}/newborn-immunizations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const updateNewbornImmunization = async (id, data) => {
  const response = await fetch(`${API_BASE}/newborn-immunizations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const deleteNewbornImmunization = async (id) => {
  const response = await fetch(`${API_BASE}/newborn-immunizations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: null };
};

// Nutrition 12 Months
export const getNutrition12Months = async () => {
  const response = await fetch(`${API_BASE}/nutrition-12months`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const getNutrition12MonthsByPatient = async (patientId) => {
  const response = await fetch(`${API_BASE}/nutrition-12months/patient/${patientId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const createNutrition12Months = async (data) => {
  const response = await fetch(`${API_BASE}/nutrition-12months`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const updateNutrition12Months = async (id, data) => {
  const response = await fetch(`${API_BASE}/nutrition-12months/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const deleteNutrition12Months = async (id) => {
  const response = await fetch(`${API_BASE}/nutrition-12months/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: null };
};

// Outcomes
export const getOutcomes = async () => {
  const response = await fetch(`${API_BASE}/outcomes`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const getOutcomeByPatient = async (patientId) => {
  const response = await fetch(`${API_BASE}/outcomes/patient/${patientId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const createOutcome = async (data) => {
  const response = await fetch(`${API_BASE}/outcomes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};
    
export const updateOutcome = async (id, data) => {
  const response = await fetch(`${API_BASE}/outcomes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: await response.json() };
};

export const deleteOutcome = async (id) => {
  const response = await fetch(`${API_BASE}/outcomes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return { data: null };
}; 