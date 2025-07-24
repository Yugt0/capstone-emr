import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../styles/Dashboard.css';

const API_BASE = 'http://127.0.0.1:8000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalVaccines: 0,
    totalVaccineTracker: 0,
    todayPatients: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [diseaseData, setDiseaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Function to analyze and categorize diseases from medical records
  const analyzeDiseases = (medicalRecords) => {
    const phraseCounts = {};
    
    medicalRecords.forEach(record => {
      // Only analyze history of present illness
      const historyText = record.history_of_present_illness;
      
      if (historyText) {
        // Convert to lowercase and clean the text
        const cleanText = historyText.toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Remove punctuation
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
        
        // Split into words and filter out common stop words
        const stopWords = [
          'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
          'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
          'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
          'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
          'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs',
          'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
          'patient', 'history', 'present', 'illness', 'symptoms', 'complains', 'complaining',
          'days', 'weeks', 'months', 'years', 'ago', 'since', 'before', 'after',
          'started', 'began', 'developed', 'noticed', 'experienced', 'felt',
          'pain', 'discomfort', 'problem', 'issue', 'condition', 'situation',
          'right', 'left', 'side', 'area', 'region', 'part', 'body',
          'mild', 'moderate', 'severe', 'intense', 'sharp', 'dull', 'aching',
          'better', 'worse', 'improved', 'worsened', 'increased', 'decreased',
          'no', 'not', 'none', 'without', 'absence', 'negative',
          'positive', 'present', 'found', 'noted', 'observed', 'seen',
          'treatment', 'medication', 'medicine', 'drug', 'therapy', 'care',
          'doctor', 'physician', 'nurse', 'hospital', 'clinic', 'medical',
          'test', 'examination', 'diagnosis', 'assessment', 'evaluation',
          'family', 'personal', 'medical', 'history', 'background',
          'current', 'previous', 'past', 'recent', 'old', 'new',
          'first', 'second', 'third', 'last', 'initial', 'final',
          'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
          'first', 'second', 'third', 'fourth', 'fifth',
          'time', 'times', 'once', 'twice', 'several', 'many', 'few',
          'some', 'any', 'all', 'every', 'each', 'both', 'either', 'neither',
          'very', 'really', 'quite', 'rather', 'somewhat', 'slightly',
          'more', 'less', 'most', 'least', 'much', 'many', 'few', 'little',
          'good', 'bad', 'well', 'poor', 'excellent', 'terrible',
          'big', 'small', 'large', 'tiny', 'huge', 'enormous',
          'high', 'low', 'normal', 'abnormal', 'elevated', 'reduced',
          'fast', 'slow', 'quick', 'gradual', 'sudden', 'gradually',
          'always', 'never', 'sometimes', 'often', 'rarely', 'usually',
          'today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night',
          'week', 'month', 'year', 'day', 'hour', 'minute',
          'now', 'then', 'here', 'there', 'where', 'when', 'why', 'how',
          'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'
        ];
        
        const words = cleanText.split(' ')
          .filter(word => word.length > 2) // Only words with 3+ characters
          .filter(word => !stopWords.includes(word)) // Remove stop words
          .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
        
        // Count individual words
        words.forEach(word => {
          phraseCounts[word] = (phraseCounts[word] || 0) + 1;
        });
        
        // Also look for common 2-word phrases
        for (let i = 0; i < words.length - 1; i++) {
          const phrase = `${words[i]} ${words[i + 1]}`;
          if (phrase.length > 5) { // Only phrases with 6+ characters
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
          }
        }
      }
    });

    // Convert to chart format and sort by count
    return Object.entries(phraseCounts)
      .map(([phrase, count]) => ({ name: phrase, cases: count }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10); // Top 10 most common phrases
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [patientsRes, vaccinesRes, trackerRes, medicalRecordsRes] = await Promise.all([
        fetch(`${API_BASE}/patients`),
        fetch(`${API_BASE}/vaccine-lists`),
        fetch(`${API_BASE}/tracker-patients`),
        fetch(`${API_BASE}/patient-medical-records`)
      ]);

      const patients = await patientsRes.json();
      const vaccines = await vaccinesRes.json();
      const trackerPatients = await trackerRes.json();
      const medicalRecords = await medicalRecordsRes.json();

      // Calculate today's patients (registered today)
      const today = new Date().toISOString().split('T')[0];
      const todayPatients = patients.filter(patient => 
        patient.created_at && patient.created_at.startsWith(today)
      ).length;

      // Get recent patients (last 5)
      const recent = patients
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Analyze diseases from medical records
      const diseaseStats = analyzeDiseases(medicalRecords);

      setStats({
        totalPatients: patients.length,
        totalVaccines: vaccines.length,
        totalVaccineTracker: trackerPatients.length,
        todayPatients
      });

      setRecentPatients(recent);
      setDiseaseData(diseaseStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Chart data for patient distribution
  const patientDistributionData = [
    { name: 'Patients', value: stats.totalPatients, color: '#667eea' },
    { name: 'Vaccine Records', value: stats.totalVaccines, color: '#22c55e' },
    { name: 'Tracker Records', value: stats.totalVaccineTracker, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3 text-muted">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button 
            className="btn btn-outline-danger btn-sm ms-3" 
            onClick={fetchDashboardData}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2 className="mb-4 fw-bold">
        <i className="bi bi-speedometer2 me-3"></i>
        Dashboard Overview
      </h2>

      {/* Statistics Cards */}
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary shadow">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-people-fill me-3" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h5 className="card-title">Total Patients</h5>
                  <h3 className="card-text fw-semibold">{stats.totalPatients.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-success shadow">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar-check me-3" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h5 className="card-title">Today's Patients</h5>
                  <h3 className="card-text fw-semibold">{stats.todayPatients}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-warning shadow">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-vaccine me-3" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h5 className="card-title">Vaccine Records</h5>
                  <h3 className="card-text fw-semibold">{stats.totalVaccines.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-info shadow">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-clipboard-data me-3" style={{ fontSize: '2rem' }}></i>
                <div>
                  <h5 className="card-title">Tracker Records</h5>
                  <h3 className="card-text fw-semibold">{stats.totalVaccineTracker.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        {/* Recent Patients */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-semibold">
                <i className="bi bi-person-plus me-2"></i>
                Recent Patients
              </h5>
              <small className="text-muted">Latest registrations</small>
              <div className="notification-list mt-3">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient, index) => (
                    <div key={patient.id} className="notification-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="notification-text mb-1">
                            <strong>{patient.full_name || patient.child_name || `Patient ${patient.id}`}</strong>
                          </p>
                          <small className="text-muted">
                            {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                          </small>
                        </div>
                        <span className="badge bg-primary">
                          #{patient.id}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No recent patients found</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Distribution Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-semibold">
                <i className="bi bi-pie-chart me-2"></i>
                Data Distribution
              </h5>
              <small className="text-muted">Overview of records</small>
              <div style={{ width: '100%', height: 250 }} className="mt-3">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={patientDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {patientDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disease Chart */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-semibold">
                <i className="bi bi-graph-up me-2"></i>
                Most Common Phrases in Patient History
              </h5>
              <small className="text-muted">Based on analysis of "History of Present Illness" field</small>
              {diseaseData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }} className="mt-3">
                  <ResponsiveContainer>
                    <BarChart data={diseaseData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cases" fill="#667eea" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-clipboard-x text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">No patient history data available</p>
                  <small className="text-muted">Common phrases will appear here once medical records with "History of Present Illness" are added</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
