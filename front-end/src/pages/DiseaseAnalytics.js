import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spinner, Alert, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import '../styles/DiseaseAnalytics.css';

const DiseaseAnalytics = () => {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [showDemographics, setShowDemographics] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

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

  // Extract diagnosis from medical record fields - prioritize History of Present Illness
  const extractDiagnosis = (record) => {
    const history = record.history_of_present_illness?.trim();
    const chiefComplaint = record.chief_complaint?.trim();
    const assessment = record.assessment?.trim();
    
    // Helper function to clean prefixes but keep full text
    const cleanPrefixes = (text) => {
      if (!text || text.length < 3) return null;
      
      // Remove common prefixes but keep the full content
      let cleaned = text
        .replace(/^(Chief Complaint|CC|History|Hx|Assessment|Dx):\s*/i, '')
        .replace(/^(Plan|Treatment|Rx):\s*/i, '')
        .trim();
      
      return cleaned;
    };
    
    // Priority: History of Present Illness (most detailed) > Chief Complaint > Assessment
    // Show full text without truncation
    
    // Try history of present illness first (most detailed and current)
    if (history && history.length > 3) {
      const cleaned = cleanPrefixes(history);
      if (cleaned) return cleaned;
    }
    
    // Fallback to chief complaint
    if (chiefComplaint && chiefComplaint.length > 3) {
      const cleaned = cleanPrefixes(chiefComplaint);
      if (cleaned) return cleaned;
    }
    
    // Fallback to assessment if available
    if (assessment && assessment.length > 3) {
      const cleaned = cleanPrefixes(assessment);
      if (cleaned) return cleaned;
    }
    
    // If nothing meaningful found, show full history or chief complaint
    if (history && history.length > 10) {
      return history;
    }
    
    if (chiefComplaint && chiefComplaint.length > 10) {
      return chiefComplaint;
    }
    
    return 'General Medical Assessment';
  };

  // Extract medications from medical record
  const extractMedications = (record) => {
    const medications = [];
    const text = `${record.assessment || ''} ${record.plan || ''} ${record.treatment || ''}`.toLowerCase();
    
    // Common medication patterns
    const medPatterns = [
      { name: 'Paracetamol', patterns: ['paracetamol', 'acetaminophen', 'tylenol'] },
      { name: 'Amoxicillin', patterns: ['amoxicillin', 'amoxil', 'augmentin'] },
      { name: 'Ibuprofen', patterns: ['ibuprofen', 'advil', 'motrin'] },
      { name: 'Omeprazole', patterns: ['omeprazole', 'prilosec'] },
      { name: 'Lisinopril', patterns: ['lisinopril', 'zestril', 'prinivil'] },
      { name: 'Metformin', patterns: ['metformin', 'glucophage'] },
      { name: 'Aspirin', patterns: ['aspirin', 'asa'] },
      { name: 'Atorvastatin', patterns: ['atorvastatin', 'lipitor'] }
    ];
    
    medPatterns.forEach(med => {
      if (med.patterns.some(pattern => text.includes(pattern))) {
        medications.push(med.name);
      }
    });
    
    return medications;
  };

  // Extract symptoms from HPI
  const extractSymptoms = (record) => {
    const symptoms = [];
    const hpi = record.history_of_present_illness?.toLowerCase() || '';
    const cc = record.chief_complaint?.toLowerCase() || '';
    const text = `${hpi} ${cc}`;
    
    const symptomPatterns = [
      'fever', 'headache', 'nausea', 'vomiting', 'diarrhea', 'constipation',
      'chest pain', 'abdominal pain', 'back pain', 'joint pain', 'muscle pain',
      'cough', 'shortness of breath', 'fatigue', 'weakness', 'dizziness',
      'rash', 'swelling', 'bleeding', 'infection', 'inflammation'
    ];
    
    symptomPatterns.forEach(symptom => {
      if (text.includes(symptom)) {
        symptoms.push(symptom);
      }
    });
    
    return symptoms;
  };

  // Get latest record per patient
  const getLatestRecordsPerPatient = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Group by patient ID and get latest record
    const patientRecords = {};
    
    data.forEach(record => {
      const patientId = record.patient_id;
      if (!patientId) return;
      
      if (!patientRecords[patientId] || 
          record.visitDate > patientRecords[patientId].visitDate) {
        patientRecords[patientId] = record;
      }
    });
    
    return Object.values(patientRecords);
  };

  // Data preparation and cleaning
  const prepareData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return null;

    // Clean and standardize medical records with HPI and medication data
    const cleanedData = rawData.map(record => {
      // Try multiple date fields to find the visit date
      const visitDate = record.created_at || record.date_recorded || record.visit_date || record.date_created;
      const parsedDate = new Date(visitDate);
      
      return {
      ...record,
      diagnosis: extractDiagnosis(record),
        visitDate: parsedDate,
      age: record.age || calculateAge(record.patient?.birth_date),
      gender: record.patient?.gender || 'Unknown',
      patientId: record.patient_id,
      assessment: record.assessment,
      chiefComplaint: record.chief_complaint,
      history: record.history_of_present_illness,
      medications: extractMedications(record),
      symptoms: extractSymptoms(record),
      latestRecord: record // Keep full record for latest data analysis
      };
    }).filter(record => 
      record.diagnosis && 
      record.diagnosis !== 'General Medical Assessment' &&
      record.diagnosis.length > 3 &&
      record.visitDate && 
      !isNaN(record.visitDate.getTime()) &&
      // Ensure we have meaningful chief complaint or history data
      (record.chiefComplaint || record.history)
    );

    return cleanedData;
  };

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Get top diseases with comprehensive statistics
  const getTopDiseases = (data) => {
    const diseaseCounts = {};
    const diseaseDetails = {};

    data.forEach(record => {
      const diagnosis = record.diagnosis;
      if (!diseaseCounts[diagnosis]) {
        diseaseCounts[diagnosis] = 0;
        diseaseDetails[diagnosis] = {
          totalCases: 0,
          uniquePatients: new Set(),
          ageGroups: { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 },
          genders: { 'Male': 0, 'Female': 0, 'Other': 0 },
          monthlyTrend: {},
          comorbidities: new Set()
        };
      }
      
      diseaseCounts[diagnosis]++;
      diseaseDetails[diagnosis].totalCases++;
      diseaseDetails[diagnosis].uniquePatients.add(record.patientId);
      
      // Age group analysis
      if (record.age !== null && record.age !== undefined) {
        const age = parseInt(record.age);
        if (age <= 18) diseaseDetails[diagnosis].ageGroups['0-18']++;
        else if (age <= 35) diseaseDetails[diagnosis].ageGroups['19-35']++;
        else if (age <= 50) diseaseDetails[diagnosis].ageGroups['36-50']++;
        else if (age <= 65) diseaseDetails[diagnosis].ageGroups['51-65']++;
        else diseaseDetails[diagnosis].ageGroups['65+']++;
      }
      
      // Gender analysis
      if (record.gender) {
        diseaseDetails[diagnosis].genders[record.gender] = 
          (diseaseDetails[diagnosis].genders[record.gender] || 0) + 1;
      }
      
      // Monthly trend
      const monthKey = record.visitDate.toISOString().substring(0, 7);
      diseaseDetails[diagnosis].monthlyTrend[monthKey] = 
        (diseaseDetails[diagnosis].monthlyTrend[monthKey] || 0) + 1;
    });

    // Convert to array and calculate percentages
    const totalVisits = data.length;
    const topDiseases = Object.entries(diseaseCounts)
      .map(([disease, count]) => ({
        disease,
        totalCases: count,
        percentage: ((count / totalVisits) * 100).toFixed(2),
        uniquePatients: diseaseDetails[disease].uniquePatients.size,
        avgVisitsPerPatient: (count / diseaseDetails[disease].uniquePatients.size).toFixed(2),
        ageGroups: diseaseDetails[disease].ageGroups,
        genders: diseaseDetails[disease].genders,
        monthlyTrend: diseaseDetails[disease].monthlyTrend
      }))
      .sort((a, b) => b.totalCases - a.totalCases)
      .slice(0, 10);

    return { topDiseases, totalVisits };
  };

  // Get trend analysis for top diseases
  const getTrendAnalysis = (data, topDiseases) => {
    const trends = {};
    
    topDiseases.slice(0, 3).forEach(disease => {
      const diseaseData = data.filter(record => record.diagnosis === disease.disease);
      const monthlyData = {};
      
      diseaseData.forEach(record => {
        const monthKey = record.visitDate.toISOString().substring(0, 7);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });
      
      trends[disease.disease] = Object.entries(monthlyData)
        .map(([month, count]) => ({
          month,
          cases: count,
          date: new Date(month + '-01')
        }))
        .sort((a, b) => a.date - b.date);
    });
    
    return trends;
  };

  // Get demographic analysis with detailed breakdowns
  const getDemographicAnalysis = (data, topDiseases) => {
    const demographics = {};
    
    topDiseases.slice(0, 5).forEach(disease => {
      const diseaseData = data.filter(record => record.diagnosis === disease.disease);
      
      // Calculate average age
      const validAges = diseaseData.filter(record => record.age && !isNaN(parseInt(record.age)));
      const averageAge = validAges.length > 0 
        ? validAges.reduce((sum, record) => sum + parseInt(record.age), 0) / validAges.length 
        : 0;
      
      // Age group distribution
      const ageDistribution = {
        '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0
      };
      
      validAges.forEach(record => {
        const age = parseInt(record.age);
        if (age <= 18) ageDistribution['0-18']++;
        else if (age <= 35) ageDistribution['19-35']++;
        else if (age <= 50) ageDistribution['36-50']++;
        else if (age <= 65) ageDistribution['51-65']++;
        else ageDistribution['65+']++;
      });
      
      // Gender distribution
      const genderDistribution = { 'Male': 0, 'Female': 0, 'Other': 0 };
      diseaseData.forEach(record => {
        if (record.gender && genderDistribution.hasOwnProperty(record.gender)) {
          genderDistribution[record.gender]++;
        }
      });
      
      demographics[disease.disease] = {
        ageDistribution,
        genderDistribution,
        averageAge: Math.round(averageAge),
        peakAgeGroup: Object.entries(ageDistribution).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        totalCases: diseaseData.length,
        malePercentage: ((genderDistribution.Male / diseaseData.length) * 100).toFixed(1),
        femalePercentage: ((genderDistribution.Female / diseaseData.length) * 100).toFixed(1)
      };
    });
    
    return demographics;
  };

  // Apply demographic filters
  const applyDemographicFilters = (data) => {
    let filteredData = data;
    
    // Age group filter
    if (selectedAgeGroup !== 'all') {
      filteredData = filteredData.filter(record => {
        if (!record.age || isNaN(parseInt(record.age))) return false;
        const age = parseInt(record.age);
        switch (selectedAgeGroup) {
          case '0-18': return age <= 18;
          case '19-35': return age >= 19 && age <= 35;
          case '36-50': return age >= 36 && age <= 50;
          case '51-65': return age >= 51 && age <= 65;
          case '65+': return age > 65;
          default: return true;
        }
      });
    }
    
    // Gender filter
    if (selectedGender !== 'all') {
      filteredData = filteredData.filter(record => 
        record.gender && record.gender.toLowerCase() === selectedGender.toLowerCase()
      );
    }
    
    return filteredData;
  };

  // Get resource utilization analysis
  const getResourceUtilization = (data, topDiseases) => {
    const totalResources = data.length;
    const resourceUsage = topDiseases.slice(0, 5).map(disease => ({
      disease: disease.disease,
      resourcePercentage: ((disease.totalCases / totalResources) * 100).toFixed(2),
      estimatedConsultations: disease.totalCases,
      estimatedMedications: Math.ceil(disease.totalCases * 0.8), // Assuming 80% need medications
      severity: disease.totalCases > 50 ? 'High' : disease.totalCases > 20 ? 'Medium' : 'Low'
    }));
    
    return resourceUsage;
  };

  // Fetch and analyze data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch medical records data
      const response = await authenticatedFetch('http://127.0.0.1:8000/api/patient-medical-records');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error (${response.status}): ${response.statusText}`);
      }

      const rawData = await response.json();

      // Prepare and clean data
      const cleanedData = prepareData(rawData);
      if (!cleanedData || cleanedData.length === 0) {
        throw new Error('No valid medical records found for analysis');
      }

      // Filter by date range with proper date handling
      let filteredData = cleanedData.filter(record => {
        if (!record.visitDate) return false;
        
        try {
        const recordDate = new Date(record.visitDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
          
          // Check if dates are valid
          if (isNaN(recordDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return false;
          }
          
          // Set time to start of day for start date and end of day for end date
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
        return recordDate >= startDate && recordDate <= endDate;
        } catch (error) {
          console.error('Date filtering error:', error, record.visitDate);
          return false;
        }
      });

      if (filteredData.length === 0) {
        console.log('Date filtering debug:', {
          dateRange: dateRange,
          totalRecords: cleanedData.length,
          sampleDates: cleanedData.slice(0, 3).map(r => ({
            original: r.visitDate,
            formatted: r.visitDate ? r.visitDate.toISOString().split('T')[0] : 'Invalid'
          })),
          startDate: new Date(dateRange.start),
          endDate: new Date(dateRange.end)
        });
        throw new Error('No medical records found for the selected date range');
      }

      // Apply demographic filters
      filteredData = applyDemographicFilters(filteredData);

      // Get latest records per patient for disease analysis
      const latestPatientRecords = getLatestRecordsPerPatient(filteredData);
      const { topDiseases: latestDiseases, totalVisits: totalPatients } = getTopDiseases(latestPatientRecords);
      const latestDemographics = getDemographicAnalysis(latestPatientRecords, latestDiseases);

      // Perform comprehensive analysis (all records)
      const { topDiseases, totalVisits } = getTopDiseases(filteredData);
      const trends = getTrendAnalysis(filteredData, topDiseases);
      const demographics = getDemographicAnalysis(filteredData, topDiseases);
      const resourceUtilization = getResourceUtilization(filteredData, topDiseases);

      setAnalyticsData({
        topDiseases,
        totalVisits,
        trends,
        demographics,
        resourceUtilization,
        rawData: filteredData,
        // Latest patient records analysis
        latestDiseases,
        totalPatients,
        latestDemographics
      });

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export report functionality
  const exportReport = () => {
    if (!analyticsData) {
      alert('No data available to export');
      return;
    }

    try {
      // Prepare CSV data
      const csvData = [
        ['Disease Analytics Report'],
        ['Generated on:', new Date().toLocaleString()],
        ['Generated by:', user?.name || 'Unknown'],
        ['Date Range:', `${dateRange.start} to ${dateRange.end}`],
        ['Age Group Filter:', selectedAgeGroup],
        ['Gender Filter:', selectedGender],
        [''],
        ['Top Diseases Analysis'],
        ['Rank', 'Disease', 'Total Cases', 'Percentage', 'Unique Patients', 'Peak Age Group', 'Risk Level']
      ];

      // Add disease data
      analyticsData.topDiseases.forEach((disease, index) => {
        const peakAgeGroup = Object.entries(disease.ageGroups).reduce((a, b) => a[1] > b[1] ? a : b);
        const riskLevel = disease.percentage > 15 ? 'High' : disease.percentage > 8 ? 'Medium' : 'Low';
        
        csvData.push([
          index + 1,
          disease.disease,
          disease.totalCases,
          `${disease.percentage}%`,
          disease.uniquePatients,
          peakAgeGroup[0],
          riskLevel
        ]);
      });

      // Add summary statistics
      csvData.push(['']);
      csvData.push(['Summary Statistics']);
      csvData.push(['Total EMR Records', analyticsData.totalVisits]);
      csvData.push(['Unique Diagnoses', analyticsData.topDiseases.length]);
      csvData.push(['Top Condition Prevalence', `${analyticsData.topDiseases[0]?.percentage || 0}%`]);

      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `disease_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  // Load data on component mount only
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Handle filter changes with lazy loading
  const handleFilterChange = async () => {
    setFilterLoading(true);
    try {
      await fetchAnalyticsData();
    } finally {
      setFilterLoading(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          fontSize: '13px',
          maxWidth: '250px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} style={{ 
              margin: '4px 0', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                backgroundColor: entry.color, 
                borderRadius: '50%',
                marginRight: '8px'
              }}></span>
              <span style={{ fontWeight: '600', color: '#333' }}>
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading overlay component for filter changes
  const FilterLoadingOverlay = () => (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
         style={{ 
           backgroundColor: 'rgba(0, 0, 0, 0.5)', 
           zIndex: 9999,
           backdropFilter: 'blur(2px)'
         }}>
      <Card className="border-0 shadow-lg">
        <Card.Body className="text-center p-4">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5 className="mb-2">Updating Analytics</h5>
          <p className="text-muted mb-0">Applying filters and refreshing data...</p>
        </Card.Body>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading disease analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Analytics</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchAnalyticsData}>
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container-fluid py-4">
        <Alert variant="info">
          <Alert.Heading>No Data Available</Alert.Heading>
          <p>No medical records found for the selected period.</p>
        </Alert>
      </div>
    );
  }


  return (
    <div className="container-fluid py-3" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Filter Loading Overlay */}
      {filterLoading && <FilterLoadingOverlay />}
      
      {/* Professional Header Section */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h3 className="fw-bold text-primary mb-1" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-graph-up me-2"></i>
              Disease Pattern Analytics
            </h3>
            <p className="text-muted mb-0 small">Comprehensive EMR analysis with NLP-driven insights</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={fetchAnalyticsData}
              size="sm"
              className="px-3"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Compact Analytics Filters */}
        <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Card.Body className="p-3">
            <Row className="g-1 align-items-end flex-nowrap">
              {/* Date Range Presets - Enhanced Design - Single Row */}
              <Col xs="auto" style={{ paddingRight: '0.25rem', paddingLeft: '0.25rem', flexShrink: 0 }}>
                <Form.Label className="small text-muted mb-1 fw-semibold" style={{ fontSize: '0.7rem' }}>
                  <i className="bi bi-calendar-range text-primary me-1"></i>
                  Presets
                </Form.Label>
                <div className="d-flex gap-1">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="position-relative"
                    style={{ 
                      fontSize: '0.7rem', 
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontWeight: '600',
                      border: '1.5px solid #3b82f6',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 6px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%)';
                      e.currentTarget.style.color = '';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 7);
                      setDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                    }}
                    disabled={filterLoading}
                  >
                    <i className="bi bi-calendar-week" style={{ fontSize: '0.7rem' }}></i>
                    <span className="ms-1 fw-bold">7D</span>
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="position-relative"
                    style={{ 
                      fontSize: '0.7rem', 
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontWeight: '600',
                      border: '1.5px solid #10b981',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 6px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%)';
                      e.currentTarget.style.color = '';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 30);
                      setDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                    }}
                    disabled={filterLoading}
                  >
                    <i className="bi bi-calendar-month" style={{ fontSize: '0.7rem' }}></i>
                    <span className="ms-1 fw-bold">30D</span>
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="position-relative"
                    style={{ 
                      fontSize: '0.7rem', 
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontWeight: '600',
                      border: '1.5px solid #f59e0b',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.1) 100%)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(245, 158, 11, 0.1)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 6px rgba(245, 158, 11, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.1) 100%)';
                      e.currentTarget.style.color = '';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.1)';
                    }}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(start.getMonth() - 3);
                      setDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                    }}
                    disabled={filterLoading}
                  >
                    <i className="bi bi-calendar3" style={{ fontSize: '0.7rem' }}></i>
                    <span className="ms-1 fw-bold">3M</span>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="position-relative"
                    style={{ 
                      fontSize: '0.7rem', 
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontWeight: '600',
                      border: '1.5px solid #ef4444',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.1) 100%)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(239, 68, 68, 0.1)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 6px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.1) 100%)';
                      e.currentTarget.style.color = '';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(239, 68, 68, 0.1)';
                    }}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setFullYear(start.getFullYear() - 1);
                      setDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                    }}
                    disabled={filterLoading}
                  >
                    <i className="bi bi-calendar4-range" style={{ fontSize: '0.7rem' }}></i>
                    <span className="ms-1 fw-bold">1Y</span>
                  </Button>
                </div>
              </Col>

              {/* Custom Date Range - Compact */}
              <Col xs="auto" style={{ paddingRight: '0.25rem', paddingLeft: '0.25rem', flexShrink: 0 }}>
                <Form.Label className="small text-muted mb-1 fw-semibold" style={{ fontSize: '0.7rem' }}>
                  <i className="bi bi-calendar3 text-primary me-1"></i>
                  Date Range
                </Form.Label>
                <div className="d-flex gap-1 align-items-end">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Form.Label className="small text-muted mb-0 d-block" style={{ fontSize: '0.65rem' }}>Start</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => {
                        setDateRange({...dateRange, start: e.target.value});
                      }}
                      disabled={filterLoading}
                      className="border-0 shadow-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem', borderRadius: '6px', width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Form.Label className="small text-muted mb-0 d-block" style={{ fontSize: '0.65rem' }}>End</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => {
                        setDateRange({...dateRange, end: e.target.value});
                      }}
                      disabled={filterLoading}
                      className="border-0 shadow-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem', borderRadius: '6px', width: '100%' }}
                    />
                  </div>
                </div>
              </Col>

              {/* Age Group Filter - Compact */}
              <Col xs="auto" style={{ paddingRight: '0.25rem', paddingLeft: '0.25rem', flexShrink: 0 }}>
                <Form.Label className="small text-muted mb-1 fw-semibold" style={{ fontSize: '0.7rem' }}>
                  <i className="bi bi-people text-success me-1"></i>
                  Age Group
                </Form.Label>
                <Form.Select 
                  value={selectedAgeGroup}
                  onChange={(e) => {
                    setSelectedAgeGroup(e.target.value);
                  }}
                  disabled={filterLoading}
                  className="border-0 shadow-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem', borderRadius: '6px', width: '100%' }}
                >
                  <option value="all">All Ages</option>
                  <option value="0-18">0-18 years</option>
                  <option value="19-35">19-35 years</option>
                  <option value="36-50">36-50 years</option>
                  <option value="51-65">51-65 years</option>
                  <option value="65+">65+ years</option>
                </Form.Select>
              </Col>

              {/* Gender Filter and Apply Button - Compact */}
              <Col xs="auto" style={{ paddingRight: '0.25rem', paddingLeft: '0.25rem', flexShrink: 0 }}>
                <Form.Label className="small text-muted mb-1 fw-semibold" style={{ fontSize: '0.7rem' }}>
                  <i className="bi bi-gender-ambiguous text-warning me-1"></i>
                  Gender
                </Form.Label>
                <div className="d-flex gap-1 align-items-end">
                  <Form.Select 
                    value={selectedGender}
                    onChange={(e) => {
                      setSelectedGender(e.target.value);
                    }}
                    disabled={filterLoading}
                    className="border-0 shadow-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem', borderRadius: '6px', minWidth: '100px' }}
                  >
                    <option value="all">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Form.Select>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleFilterChange}
                    disabled={filterLoading}
                    style={{ 
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {filterLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" style={{ width: '0.6rem', height: '0.6rem' }} />
                        <span>Updating...</span>
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
            
            {/* Active Filters Summary */}
            <div className="mt-2 pt-2 border-top">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <small className="text-muted fw-semibold">
                  <i className="bi bi-info-circle me-1"></i>
                  Active Filters:
                </small>
                {dateRange.start && dateRange.end && (
                  <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-calendar3 me-1"></i>
                    {new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {selectedAgeGroup !== 'all' && (
                  <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-people me-1"></i>
                    Age: {selectedAgeGroup}
                  </span>
                )}
                {selectedGender !== 'all' && (
                  <span className="badge bg-warning bg-opacity-10 text-warning" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-gender-ambiguous me-1"></i>
                    {selectedGender}
                  </span>
                )}
                {(selectedAgeGroup === 'all' && selectedGender === 'all' && dateRange.start && dateRange.end) && (
                  <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: '0.7rem' }}>
                    No filters applied
                  </span>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Comprehensive Analytics Overview */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-gradient bg-primary text-white py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="bi bi-graph-up me-3 fs-4"></i>
                  <div>
                    <h5 className="mb-1 fw-bold">Analytics Overview</h5>
                    <small className="opacity-90">Comprehensive EMR data analysis</small>
                </div>
              </div>
                <div className="d-flex gap-4">
                  <div className="text-center">
                    <h4 className="mb-0 fw-bold">
                {filterLoading ? (
                        <Spinner animation="border" size="sm" variant="light" />
                ) : (
                  analyticsData.totalVisits
                )}
              </h4>
                    <small className="opacity-75">Total Records</small>
                </div>
                  <div className="text-center">
                    <h4 className="mb-0 fw-bold">
                {filterLoading ? (
                        <Spinner animation="border" size="sm" variant="light" />
                ) : (
                  analyticsData.topDiseases.length
                )}
              </h4>
                    <small className="opacity-75">Conditions</small>
                </div>
                  <div className="text-center">
                    <h4 className="mb-0 fw-bold">
                {filterLoading ? (
                        <Spinner animation="border" size="sm" variant="light" />
                ) : (
                  `${analyticsData.topDiseases[0]?.percentage || 0}%`
                )}
              </h4>
                    <small className="opacity-75">Top Rate</small>
                </div>
              </div>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {/* Comprehensive Analytics Dashboard - Text-Based Ranking */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="bi bi-list-ol text-primary me-2"></i>
                  <h6 className="mb-0 fw-bold">Chief Complaint Analysis</h6>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <small className="text-muted">Top 10 Conditions with Demographics</small>
                  <div className="d-flex gap-2">
                    <span className="badge bg-primary small">Ranking</span>
                    <span className="badge bg-success small">Demographics</span>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {filterLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <h6 className="text-muted">Processing Analytics Data...</h6>
                    <small className="text-muted">Analyzing filtered records</small>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table responsive hover className="mb-0 align-middle" style={{ fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <tr>
                        <th style={{ width: '60px', fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>Rank</th>
                        <th style={{ fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>Chief Complaint</th>
                        <th style={{ width: '100px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>Cases</th>
                        <th style={{ width: '80px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>%</th>
                        <th style={{ width: '100px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>Patients</th>
                        <th style={{ width: '110px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>
                          <i className="bi bi-calendar-range text-primary me-1"></i>
                          Peak Age
                        </th>
                        <th style={{ width: '100px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>
                          <i className="bi bi-graph-up text-info me-1"></i>
                          Avg Age
                        </th>
                        <th style={{ width: '130px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>
                          <i className="bi bi-gender-ambiguous text-success me-1"></i>
                          Gender
                        </th>
                        <th style={{ fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>
                          <i className="bi bi-bar-chart text-warning me-1"></i>
                          Age Distribution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topDiseases.slice(0, 10).map((disease, index) => {
                        const demographic = analyticsData.demographics[disease.disease] || {};
                        const peakAgeGroup = Object.entries(disease.ageGroups).reduce((a, b) => a[1] > b[1] ? a : b);
                        
                        // Calculate demographics if not available
                        const finalDemographic = demographic.peakAgeGroup ? demographic : {
                          peakAgeGroup: peakAgeGroup[0],
                          averageAge: disease.ageGroups ? Math.round(
                            Object.entries(disease.ageGroups)
                              .map(([age, count]) => {
                                const midAge = age === '0-18' ? 9 : age === '19-35' ? 27 : age === '36-50' ? 43 : age === '51-65' ? 58 : 70;
                                return midAge * count;
                              })
                              .reduce((a, b) => a + b, 0) / 
                            Object.values(disease.ageGroups).reduce((a, b) => a + b, 0)
                          ) : null,
                          genderDistribution: disease.genders || { Male: 0, Female: 0 },
                          ageDistribution: disease.ageGroups || {},
                          malePercentage: disease.genders && disease.totalCases 
                            ? ((disease.genders.Male / disease.totalCases) * 100).toFixed(1)
                            : '0',
                          femalePercentage: disease.genders && disease.totalCases 
                            ? ((disease.genders.Female / disease.totalCases) * 100).toFixed(1)
                            : '0'
                        };
                        
                        return (
                          <tr key={disease.disease} style={{
                            borderLeft: `4px solid ${
                              index === 0 ? '#dc2626' : 
                              index === 1 ? '#ea580c' : 
                              index === 2 ? '#f59e0b' : 
                              '#e5e7eb'
                            }`,
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                          }}>
                            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge rounded-pill text-white fw-bold d-inline-flex align-items-center justify-content-center" style={{
                                backgroundColor: index === 0 ? '#dc2626' : 
                                               index === 1 ? '#ea580c' : 
                                               index === 2 ? '#f59e0b' : 
                                               '#6b7280',
                                fontSize: '0.85rem',
                                width: '36px',
                                height: '36px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {index + 1}
                              </span>
                            </td>
                            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {disease.disease}
                              </div>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge bg-primary text-white fw-semibold" style={{ fontSize: '0.85rem', padding: '6px 10px' }}>
                                {disease.totalCases}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge bg-success text-white fw-semibold" style={{ fontSize: '0.85rem', padding: '6px 10px' }}>
                                {disease.percentage}%
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                                {disease.uniquePatients}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge bg-info text-white fw-semibold" style={{ fontSize: '0.8rem', padding: '5px 8px' }}>
                                {finalDemographic.peakAgeGroup || '-'}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                                {finalDemographic.averageAge ? `${finalDemographic.averageAge} yrs` : '-'}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <div className="d-flex gap-2 justify-content-center align-items-center">
                                <div className="text-center">
                                  <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                    ♂ {finalDemographic.genderDistribution?.Male || 0}
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {finalDemographic.malePercentage || '0'}%
                                  </small>
                                </div>
                                <span className="text-muted">/</span>
                                <div className="text-center">
                                  <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>
                                    ♀ {finalDemographic.genderDistribution?.Female || 0}
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {finalDemographic.femalePercentage || '0'}%
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <div className="d-flex gap-1 flex-wrap">
                                {Object.entries(finalDemographic.ageDistribution || {})
                                  .filter(([_, count]) => count > 0)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([ageGroup, count]) => (
                                    <span 
                                      key={ageGroup}
                                      className="badge bg-warning text-dark fw-semibold" 
                                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                    >
                                      {ageGroup}: {count}
                                    </span>
                                  ))}
                                {(!finalDemographic.ageDistribution || Object.keys(finalDemographic.ageDistribution).length === 0) && (
                                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Distribution Overview */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="bi bi-pie-chart text-success me-2"></i>
                  <h6 className="mb-0 fw-bold">Distribution Overview</h6>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <small className="text-muted">Top 5 Conditions Distribution</small>
                  <div className="d-flex gap-2">
                    <span className="badge bg-success small">Pie Chart</span>
                    <span className="badge bg-info small">Percentages</span>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {filterLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                  <div className="text-center">
                    <Spinner animation="border" variant="success" className="mb-3" />
                    <h6 className="text-muted">Processing Distribution Data...</h6>
                    <small className="text-muted">Analyzing condition percentages</small>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analyticsData.topDiseases.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({disease, percentage}) => `${disease}: ${percentage}%`}
                      outerRadius={120}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="totalCases"
                      stroke="#fff"
                      strokeWidth={2}
                      fontSize={12}
                    >
                      {analyticsData.topDiseases.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip />}
                      formatter={(value, name) => [value, 'Cases']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={50}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '14px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Most Common Diseases from Latest Patient History */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="bi bi-hospital text-danger me-2"></i>
                  <h6 className="mb-0 fw-bold">Most Common Diseases (Latest Patient History)</h6>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <small className="text-muted">Based on patients' most recent history of present illness</small>
                  <div className="d-flex gap-2">
                    <span className="badge bg-danger small">Line Graph</span>
                    <span className="badge bg-info small">Per Patient</span>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {filterLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                  <div className="text-center">
                    <Spinner animation="border" variant="danger" className="mb-3" />
                    <h6 className="text-muted">Analyzing Latest Patient Records...</h6>
                    <small className="text-muted">Processing history of present illness data</small>
                  </div>
                </div>
              ) : analyticsData.latestDiseases ? (
                <>
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart 
                      data={analyticsData.latestDiseases.slice(0, 10).map((disease, index) => ({
                        ...disease,
                        rank: index + 1,
                        // Truncate long disease names for display
                        diseaseShort: disease.disease.length > 30 
                          ? disease.disease.substring(0, 27) + '...' 
                          : disease.disease
                      }))} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="diseaseShort" 
                        angle={-60}
                        textAnchor="end"
                        height={140}
                        interval={0}
                        stroke="#666"
                        fontSize={11}
                        tick={{ fill: '#333', fontSize: 11 }}
                        width={300}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={12}
                        label={{ value: 'Patients Affected', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fontWeight: '600' } }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="custom-tooltip" style={{
                                backgroundColor: 'white',
                                border: '1px solid #dc2626',
                                borderRadius: '8px',
                                padding: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                fontSize: '13px',
                                maxWidth: '300px'
                              }}>
                                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px', color: '#dc2626', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                                  {data.disease}
                                </p>
                                <div style={{ margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600', color: '#333' }}>Patients:</span>
                                  <span style={{ fontWeight: '700', color: '#dc2626', fontSize: '16px' }}>{data.uniquePatients}</span>
                                </div>
                                <div style={{ margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600', color: '#333' }}>Total Cases:</span>
                                  <span style={{ fontWeight: '600', color: '#666' }}>{data.totalCases}</span>
                                </div>
                                <div style={{ margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600', color: '#333' }}>Prevalence:</span>
                                  <span style={{ fontWeight: '600', color: '#666' }}>{data.percentage}%</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ stroke: 'rgba(220, 38, 38, 0.3)', strokeWidth: 2 }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconType="line"
                        wrapperStyle={{ fontSize: '14px', paddingBottom: '10px' }}
                      />
                      <Line 
                        type="monotone"
                        dataKey="uniquePatients" 
                        stroke="#dc2626" 
                        strokeWidth={3}
                        name="Patients Affected"
                        dot={{ fill: '#dc2626', r: 6, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 10, fill: '#b91c1c', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={800}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Disease Names Reference Table */}
                  <div className="mt-3 p-3 bg-light rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <h6 className="text-dark fw-bold mb-2 small d-flex align-items-center">
                      <i className="bi bi-list-ul text-primary me-2"></i>
                      Full Disease Names Reference
                    </h6>
                    <div className="row g-2">
                      {analyticsData.latestDiseases.slice(0, 10).map((disease, index) => (
                        <div key={index} className="col-md-6 col-lg-4">
                          <div className="d-flex align-items-center small">
                            <span className="badge bg-danger me-2" style={{ minWidth: '30px', fontSize: '0.7rem' }}>
                              #{index + 1}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                              {disease.disease}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demographics Cards for Top 3 Diseases */}
                  <Row className="mt-4">
                    <Col lg={12}>
                      <h6 className="text-dark fw-bold mb-3 d-flex align-items-center">
                        <i className="bi bi-graph-up-arrow text-danger me-2"></i>
                        Top 3 Diseases - Demographic Breakdown
                      </h6>
                    </Col>
                    {analyticsData.latestDiseases.slice(0, 3).map((disease, index) => {
                      const demographic = analyticsData.latestDemographics[disease.disease];
                      if (!demographic) return null;
                      
                      return (
                        <Col lg={4} className="mb-3" key={disease.disease}>
                          <Card className="h-100 border-0 shadow-sm">
                            <Card.Header style={{
                              background: index === 0 ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 
                                         index === 1 ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' :
                                         'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              padding: '1rem'
                            }}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="d-flex align-items-center mb-1">
                                    <span className="badge bg-white text-dark me-2">#{index + 1}</span>
                                    <h6 className="mb-0 fw-bold small">{disease.disease}</h6>
                                  </div>
                                  <small className="opacity-90">{disease.uniquePatients} patients</small>
                                </div>
                                <div className="text-end">
                                  <h4 className="mb-0 fw-bold">{disease.percentage}%</h4>
                                  <small className="opacity-75">prevalence</small>
                                </div>
                              </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                              <div className="mb-3">
                                <h6 className="text-primary fw-bold d-flex align-items-center mb-2 small">
                                  <i className="bi bi-calendar-range me-2"></i>
                                  Age Distribution
                                </h6>
                                {Object.entries(demographic.ageDistribution)
                                  .filter(([_, count]) => count > 0)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 3)
                                  .map(([ageGroup, count]) => (
                                    <div key={ageGroup} className="d-flex justify-content-between mb-1 small">
                                      <span className="text-muted">{ageGroup}:</span>
                                      <span className="fw-bold text-dark">{count} ({((count / disease.uniquePatients) * 100).toFixed(1)}%)</span>
                                    </div>
                                  ))}
                              </div>
                              <div className="mb-3">
                                <h6 className="text-success fw-bold d-flex align-items-center mb-2 small">
                                  <i className="bi bi-gender-ambiguous me-2"></i>
                                  Gender Distribution
                                </h6>
                                <div className="d-flex justify-content-between mb-1 small">
                                  <span className="text-muted">Male:</span>
                                  <span className="fw-bold text-dark">{demographic.genderDistribution.Male} ({demographic.malePercentage}%)</span>
                                </div>
                                <div className="d-flex justify-content-between small">
                                  <span className="text-muted">Female:</span>
                                  <span className="fw-bold text-dark">{demographic.genderDistribution.Female} ({demographic.femalePercentage}%)</span>
                                </div>
                              </div>
                              <div className="text-center bg-light p-2 rounded">
                                <small className="text-muted fw-semibold">
                                  <i className="bi bi-graph-up me-1"></i>
                                  Avg. Age: {demographic.averageAge} years | Peak: {demographic.peakAgeGroup}
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>

                  {/* Summary Info */}
                  <div className="alert alert-info mt-3 mb-0" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-info-circle me-3 fs-5"></i>
                      <div>
                        <strong>Analysis Note:</strong> This chart shows diseases based on each patient's most recent history of present illness. 
                        Total unique patients analyzed: <strong>{analyticsData.totalPatients}</strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning">No latest patient data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Comprehensive Demographic Analysis */}
      <Row className="mb-4">
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-people-fill text-warning me-2"></i>
                  <h6 className="mb-0 fw-bold">Demographic Pattern Analysis</h6>
                  </div>
                <div className="d-flex align-items-center gap-3">
                  <small className="text-muted">Age, gender & risk factor distribution</small>
                  <div className="d-flex gap-2">
                    <span className="badge bg-warning small">Age Groups</span>
                    <span className="badge bg-info small">Gender Split</span>
                  </div>
                </div>
                </div>
              </Card.Header>
            <Card.Body className="p-4">
                <Row>
                  {analyticsData.topDiseases.slice(0, 3).map((disease, index) => {
                    const demographic = analyticsData.demographics[disease.disease];
                    if (!demographic) return null;
                    
                    return (
                    <Col lg={4} className="mb-3" key={disease.disease}>
                        <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-primary text-white py-3">
                            <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">{disease.disease}</h6>
                            <span className="badge bg-light text-dark">{disease.totalCases} cases</span>
                            </div>
                          </Card.Header>
                        <Card.Body className="p-4">
                          <div className="mb-3">
                            <h6 className="text-primary fw-bold d-flex align-items-center mb-3">
                              <i className="bi bi-calendar-range me-2"></i>
                                Age Distribution
                              </h6>
                              {Object.entries(demographic.ageDistribution)
                                .filter(([_, count]) => count > 0)
                                .slice(0, 3)
                                .map(([ageGroup, count]) => (
                              <div key={ageGroup} className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">{ageGroup}:</span>
                                <span className="fw-bold text-primary">{count}</span>
                                </div>
                              ))}
                            </div>
                          <div className="mb-3">
                            <h6 className="text-success fw-bold d-flex align-items-center mb-3">
                              <i className="bi bi-gender-ambiguous me-2"></i>
                                Gender Split
                              </h6>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="fw-semibold">Male:</span>
                              <span className="fw-bold text-success">{demographic.genderDistribution.Male}</span>
                              </div>
                              <div className="d-flex justify-content-between">
                              <span className="fw-semibold">Female:</span>
                              <span className="fw-bold text-success">{demographic.genderDistribution.Female}</span>
                              </div>
                            </div>
                          <div className="text-center bg-light p-3 rounded">
                            <small className="text-muted fw-semibold">
                                <i className="bi bi-graph-up me-1"></i>
                              Average Age: {demographic.averageAge} years
                              </small>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      {/* Latest Medical Records Analysis - Based on History of Present Illness */}
      <Row className="mb-3">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light py-2">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock-history text-info me-2"></i>
                  <h6 className="mb-0">Most Common Diseases (Latest Patient History)</h6>
                </div>
                <small className="text-muted">Based on patients' most recent history of present illness</small>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {analyticsData.latestDiseases && analyticsData.latestDiseases.length > 0 ? (
                <div className="table-responsive">
                  <Table responsive hover className="mb-0 align-middle" style={{ fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <tr>
                        <th style={{ width: '60px', fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>Rank</th>
                        <th style={{ fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>Disease (History of Present Illness)</th>
                        <th style={{ width: '100px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>Patients</th>
                        <th style={{ width: '80px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>%</th>
                        <th style={{ width: '110px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>
                          <i className="bi bi-calendar-range text-primary me-1"></i>
                          Peak Age
                        </th>
                        <th style={{ width: '100px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>
                          <i className="bi bi-graph-up text-info me-1"></i>
                          Avg Age
                        </th>
                        <th style={{ width: '130px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', padding: '12px 8px' }}>
                          <i className="bi bi-gender-ambiguous text-success me-1"></i>
                          Gender
                        </th>
                        <th style={{ fontSize: '0.9rem', fontWeight: '600', padding: '12px 8px' }}>
                          <i className="bi bi-bar-chart text-warning me-1"></i>
                          Age Distribution
                        </th>
                  </tr>
                </thead>
                <tbody>
                      {analyticsData.latestDiseases.slice(0, 10).map((disease, index) => {
                        const demographic = analyticsData.latestDemographics[disease.disease] || {};
                    const peakAgeGroup = Object.entries(disease.ageGroups).reduce((a, b) => a[1] > b[1] ? a : b);
                        
                        // Calculate demographics if not available
                        const finalDemographic = demographic.peakAgeGroup ? demographic : {
                          peakAgeGroup: peakAgeGroup[0],
                          averageAge: disease.ageGroups ? Math.round(
                            Object.entries(disease.ageGroups)
                              .map(([age, count]) => {
                                const midAge = age === '0-18' ? 9 : age === '19-35' ? 27 : age === '36-50' ? 43 : age === '51-65' ? 58 : 70;
                                return midAge * count;
                              })
                              .reduce((a, b) => a + b, 0) / 
                            Object.values(disease.ageGroups).reduce((a, b) => a + b, 0)
                          ) : null,
                          genderDistribution: disease.genders || { Male: 0, Female: 0 },
                          ageDistribution: disease.ageGroups || {},
                          malePercentage: disease.genders && disease.uniquePatients 
                            ? ((disease.genders.Male / disease.uniquePatients) * 100).toFixed(1)
                            : '0',
                          femalePercentage: disease.genders && disease.uniquePatients 
                            ? ((disease.genders.Female / disease.uniquePatients) * 100).toFixed(1)
                            : '0'
                        };
                    
                    return (
                          <tr key={disease.disease} style={{
                            borderLeft: `4px solid ${
                              index === 0 ? '#dc2626' : 
                              index === 1 ? '#ea580c' : 
                              index === 2 ? '#f59e0b' : 
                              '#e5e7eb'
                            }`,
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                          }}>
                            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge rounded-pill text-white fw-bold d-inline-flex align-items-center justify-content-center" style={{
                                backgroundColor: index === 0 ? '#dc2626' : 
                                               index === 1 ? '#ea580c' : 
                                               index === 2 ? '#f59e0b' : 
                                               '#6b7280',
                                fontSize: '0.85rem',
                                width: '36px',
                                height: '36px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {index + 1}
                          </span>
                        </td>
                            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {disease.disease}
                              </div>
                        </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge bg-primary text-white fw-semibold" style={{ fontSize: '0.85rem', padding: '6px 10px' }}>
                                {disease.uniquePatients}
                              </span>
                        </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge bg-success text-white fw-semibold" style={{ fontSize: '0.85rem', padding: '6px 10px' }}>
                                {disease.percentage}%
                          </span>
                        </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="badge bg-info text-white fw-semibold" style={{ fontSize: '0.8rem', padding: '5px 8px' }}>
                                {finalDemographic.peakAgeGroup || '-'}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                                {finalDemographic.averageAge ? `${finalDemographic.averageAge} yrs` : '-'}
                              </span>
                            </td>
                            <td className="text-center" style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <div className="d-flex gap-2 justify-content-center align-items-center">
                                <div className="text-center">
                                  <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                    ♂ {finalDemographic.genderDistribution?.Male || 0}
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {finalDemographic.malePercentage || '0'}%
                                  </small>
                                </div>
                                <span className="text-muted">/</span>
                                <div className="text-center">
                                  <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>
                                    ♀ {finalDemographic.genderDistribution?.Female || 0}
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {finalDemographic.femalePercentage || '0'}%
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                              <div className="d-flex gap-1 flex-wrap">
                                {Object.entries(finalDemographic.ageDistribution || {})
                                  .filter(([_, count]) => count > 0)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([ageGroup, count]) => (
                                    <span 
                                      key={ageGroup}
                                      className="badge bg-warning text-dark fw-semibold" 
                                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                    >
                                      {ageGroup}: {count}
                                    </span>
                                  ))}
                                {(!finalDemographic.ageDistribution || Object.keys(finalDemographic.ageDistribution).length === 0) && (
                                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>-</span>
                                )}
                              </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No latest patient history data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>



      {/* Professional User Accountability */}
      {user && (
        <Card className="mt-3 border-0 shadow-sm">
          <Card.Body className="bg-light py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-circle text-primary me-3 fs-5"></i>
                <div>
                  <h6 className="mb-1 text-primary small">Analytics Generated By</h6>
                  <p className="mb-0 text-muted small">
                    <strong>{user.name}</strong> - {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-end">
                <span className="badge bg-primary small">
                  <i className="bi bi-shield-check me-1"></i>
                  {user.role}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default DiseaseAnalytics;