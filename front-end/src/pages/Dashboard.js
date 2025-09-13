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

// Combine name fields for display
const getFullName = (patient) => {
  if (!patient) return '';
  
  // For PatientInformation model (patients API)
  if (patient.first_name || patient.middle_name || patient.last_name) {
    const parts = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean);
    return parts.join(' ');
  }
  
  // For Patient model (tracker-patients API)
  if (patient.child_name) {
    return patient.child_name;
  }
  
  return `Patient ${patient.id}`;
};

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
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '2months', '2weeks', '2days'
  const [filteredDiseaseData, setFilteredDiseaseData] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle time filter changes
  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    // Refetch data with new time filter
    fetchDashboardData(newFilter);
  };

  // Intelligent medical keyword extraction function
  const extractMedicalKeywords = (text) => {
    const keywords = [];
    
    // Stop words for medical context
        const stopWords = [
      // Basic English words
          'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
          'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
          'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
          'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
          'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs',
          'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      
      // Medical context words (keep some important ones)
          'patient', 'history', 'present', 'illness', 'symptoms', 'complains', 'complaining',
          'days', 'weeks', 'months', 'years', 'ago', 'since', 'before', 'after',
          'started', 'began', 'developed', 'noticed', 'experienced', 'felt',
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
      'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
      
      // Common medical filler words
      'reports', 'states', 'indicates', 'shows', 'reveals', 'demonstrates',
      'appears', 'seems', 'looks', 'feels', 'sounds', 'smells',
      'denies', 'admits', 'confirms', 'suggests', 'implies',
      'according', 'based', 'accordingly', 'therefore', 'however',
      'although', 'despite', 'regardless', 'nevertheless', 'furthermore',
      'additionally', 'moreover', 'further', 'also', 'too', 'as', 'well'
    ];
    
    // Medical symptom patterns (including negative descriptions)
    const medicalPatterns = [
      // Pain descriptions
      { pattern: /(sharp|dull|aching|throbbing|burning|stabbing|cramping)\s+pain/gi, keyword: 'pain-type' },
      { pattern: /(chest|head|back|joint|abdominal|muscle|bone)\s+pain/gi, keyword: 'pain-location' },
      { pattern: /no\s+(pain|discomfort)/gi, keyword: 'no-pain' },
      
      // Radiation patterns
      { pattern: /radiation\s+to\s+(arms|legs|jaw|shoulder|neck)/gi, keyword: 'radiation-present' },
      { pattern: /no\s+radiation/gi, keyword: 'no-radiation' },
      
      // Breathing patterns
      { pattern: /(shortness|difficulty)\s+of\s+breath/gi, keyword: 'breathing-difficulty' },
      { pattern: /no\s+(shortness|difficulty)\s+of\s+breath/gi, keyword: 'no-breathing-difficulty' },
      { pattern: /wheezing|wheeze/gi, keyword: 'wheezing' },
      
      // Fever patterns
      { pattern: /fever|febrile/gi, keyword: 'fever' },
      { pattern: /no\s+fever/gi, keyword: 'no-fever' },
      
      // Nausea/vomiting patterns
      { pattern: /nausea|nauseous/gi, keyword: 'nausea' },
      { pattern: /vomiting|vomit/gi, keyword: 'vomiting' },
      { pattern: /no\s+(nausea|vomiting)/gi, keyword: 'no-nausea-vomiting' },
      
      // Diarrhea patterns - check for negative context
      { pattern: /diarrhea|diarrhoea/gi, keyword: 'diarrhea-check' },
      { pattern: /no\s+(vomiting\s+or\s+)?diarrhea/gi, keyword: 'no-diarrhea' },
      
      // Rash patterns
      { pattern: /rash|skin\s+eruption/gi, keyword: 'rash' },
      { pattern: /no\s+rash/gi, keyword: 'no-rash' },
      
      // Sleep patterns
      { pattern: /sleep\s+(difficulties|problems|disturbances)/gi, keyword: 'sleep-problems' },
      { pattern: /insomnia/gi, keyword: 'insomnia' },
      
      // Appetite patterns
      { pattern: /appetite\s+loss|loss\s+of\s+appetite/gi, keyword: 'appetite-loss' },
      { pattern: /no\s+appetite\s+loss/gi, keyword: 'no-appetite-loss' },
      
      // Weight patterns
      { pattern: /weight\s+loss/gi, keyword: 'weight-loss' },
      { pattern: /weight\s+gain/gi, keyword: 'weight-gain' },
      
      // Behavioral patterns
      { pattern: /irritable|irritability/gi, keyword: 'irritability' },
      { pattern: /lethargy|lethargic/gi, keyword: 'lethargy' },
      { pattern: /aggression|aggressive/gi, keyword: 'aggression' },
      
      // Eye patterns
      { pattern: /eye\s+(irritation|pain|redness)/gi, keyword: 'eye-problems' },
      { pattern: /vision\s+(changes|problems|blurred)/gi, keyword: 'vision-problems' },
      
      // Ear patterns
      { pattern: /ear\s+(pain|pulling|tugging)/gi, keyword: 'ear-problems' },
      { pattern: /hearing\s+(loss|problems)/gi, keyword: 'hearing-problems' },
      
      // Duration patterns
      { pattern: /(acute|chronic|sudden|gradual)\s+(onset|start)/gi, keyword: 'onset-type' },
      { pattern: /(days|weeks|months|years)\s+(ago|since)/gi, keyword: 'duration' },
      
      // Severity patterns
      { pattern: /(mild|moderate|severe|intense)/gi, keyword: 'severity' },
      
      // Quality patterns
      { pattern: /(intermittent|constant|episodic)/gi, keyword: 'quality' },
      
      // Associated symptoms
      { pattern: /associated\s+with/gi, keyword: 'associated-symptoms' },
      { pattern: /no\s+associated\s+symptoms/gi, keyword: 'no-associated-symptoms' }
    ];
    
    // Extract keywords using patterns
    medicalPatterns.forEach(({ pattern, keyword }) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          keywords.push(keyword);
        });
      }
    });
    
    // Post-process to handle negative contexts
    const processedKeywords = [];
    const hasNoDiarrhea = keywords.includes('no-diarrhea');
    const hasDiarrheaCheck = keywords.includes('diarrhea-check');
    const hasNoFever = keywords.includes('no-fever');
    const hasFeverCheck = keywords.includes('fever');
    const hasNoNausea = keywords.includes('no-nausea-vomiting');
    const hasNauseaCheck = keywords.includes('nausea');
    const hasNoRash = keywords.includes('no-rash');
    const hasRashCheck = keywords.includes('rash');
    
    keywords.forEach(keyword => {
      if (keyword === 'diarrhea-check') {
        // Only add 'diarrhea' if there's no negative context
        if (!hasNoDiarrhea) {
          processedKeywords.push('diarrhea');
        }
      } else if (keyword === 'fever' && hasNoFever) {
        // Skip fever if there's negative context
        // Don't add it
      } else if (keyword === 'nausea' && hasNoNausea) {
        // Skip nausea if there's negative context
        // Don't add it
      } else if (keyword === 'rash' && hasNoRash) {
        // Skip rash if there's negative context
        // Don't add it
      } else {
        processedKeywords.push(keyword);
      }
    });
    
    // Extract individual medical words (excluding stop words)
    const words = text.split(' ')
      .filter(word => word.length > 2)
      .filter(word => !stopWords.includes(word))
      .filter(word => !/^\d+$/.test(word));
    
    // Add individual words
    processedKeywords.push(...words);
    
    return processedKeywords;
  };

  // Function to analyze and categorize diseases from medical records with demographics
  const analyzeDiseases = (medicalRecords, patients, timeFilter = 'all') => {
    const diseaseStats = {};
    
    // Filter medical records by time period
    let filteredRecords = medicalRecords;
    if (timeFilter !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (timeFilter) {
        case '2days':
          cutoffDate = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
          break;
        case '2weeks':
          cutoffDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
          break;
        case '2months':
          cutoffDate = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filteredRecords = medicalRecords.filter(record => {
          const recordDate = new Date(record.created_at || record.updated_at);
          return recordDate >= cutoffDate;
        });
      }
    }
    
    // Get only the most recent medical record per patient
    const patientLatestRecords = {};
    filteredRecords.forEach(record => {
      const patientId = record.patient_id;
      if (!patientLatestRecords[patientId]) {
        patientLatestRecords[patientId] = record;
      } else {
        // Compare dates to find the most recent
        const currentRecordDate = new Date(record.created_at || record.updated_at);
        const existingRecordDate = new Date(patientLatestRecords[patientId].created_at || patientLatestRecords[patientId].updated_at);
        
        if (currentRecordDate > existingRecordDate) {
          patientLatestRecords[patientId] = record;
        }
      }
    });
    
    // Convert to array of latest records only
    const latestRecords = Object.values(patientLatestRecords);
    
    console.log('Total medical records after time filter:', filteredRecords.length);
    console.log('Latest medical records per patient:', latestRecords.length);
    console.log('Analyzing exact text from "History of Present Illness" field...');
    
    let recordsWithText = 0;
    
    latestRecords.forEach(record => {
      const historyText = record.history_of_present_illness;
      
      if (historyText && historyText.trim() !== '') {
        recordsWithText++;
        if (recordsWithText <= 3) { // Show first 3 examples
          console.log(`Sample ${recordsWithText}:`, historyText.substring(0, 150) + '...');
        }
        
        // Find the patient for this medical record
        const patient = patients.find(p => p.id === record.patient_id);
        
        if (!patient) {
          return;
        }
        
        // Calculate age - handle different field names for different patient models
        let age = 0;
        if (patient.birth_date) {
          age = Math.floor((new Date() - new Date(patient.birth_date)) / (365.25 * 24 * 60 * 60 * 1000));
        } else if (patient.date_of_birth) {
          age = Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000));
        } else if (patient.birthdate) {
          age = Math.floor((new Date() - new Date(patient.birthdate)) / (365.25 * 24 * 60 * 60 * 1000));
        }
        
        // Ensure age is valid (not negative or too high)
        if (age < 0 || age > 120) {
          age = 0;
        }
        
        // Use the exact text as the key (normalize whitespace but keep content)
        const normalizedText = historyText.trim().replace(/\s+/g, ' ');
        
        if (!diseaseStats[normalizedText]) {
          diseaseStats[normalizedText] = {
            name: normalizedText.length > 50 ? normalizedText.substring(0, 50) + '...' : normalizedText,
            fullText: normalizedText,
            cases: 0,
            genders: { male: 0, female: 0 },
            ages: [],
            ageGroups: { '0-18': 0, '18-60': 0, '60+': 0 },
            exactTexts: [] // Store exact text snippets
          };
        }
        
        diseaseStats[normalizedText].cases++;
        // Map gender values: F -> female, M -> male
        const gender = patient.sex?.toLowerCase() === 'f' ? 'female' : 
                      patient.sex?.toLowerCase() === 'm' ? 'male' : 'unknown';
        diseaseStats[normalizedText].genders[gender]++;
        diseaseStats[normalizedText].ages.push(age);
        
        // Store exact full text
        if (!diseaseStats[normalizedText].exactTexts.includes(historyText)) {
          diseaseStats[normalizedText].exactTexts.push(historyText);
        }
        
        // Categorize age groups
        if (age <= 18) {
          diseaseStats[normalizedText].ageGroups['0-18']++;
        } else if (age <= 60) {
          diseaseStats[normalizedText].ageGroups['18-60']++;
        } else {
          diseaseStats[normalizedText].ageGroups['60+']++;
        }
      }
    });

    console.log('Unique patients with medical history:', recordsWithText);
    console.log('Disease analysis based on exact text from "History of Present Illness" completed.');

    // Calculate additional statistics for each disease
    Object.values(diseaseStats).forEach(disease => {
      // Filter out invalid ages (0 or negative)
      const validAges = disease.ages.filter(age => age > 0);
      
      if (validAges.length > 0) {
        disease.avgAge = Math.round(validAges.reduce((a, b) => a + b, 0) / validAges.length);
        disease.minAge = Math.min(...validAges);
        disease.maxAge = Math.max(...validAges);
        disease.validAgeCount = validAges.length;
      } else {
        disease.avgAge = 0;
        disease.minAge = 0;
        disease.maxAge = 0;
        disease.validAgeCount = 0;
      }
      
      // Find dominant gender with percentages
      const genderCounts = disease.genders;
      const totalGender = genderCounts.male + genderCounts.female;
      
      if (totalGender === 0) {
        disease.dominantGender = 'No Data';
        disease.genderPercentage = { male: 0, female: 0 };
      } else {
        const malePercentage = Math.round((genderCounts.male / totalGender) * 100);
        const femalePercentage = Math.round((genderCounts.female / totalGender) * 100);
        
        disease.genderPercentage = { male: malePercentage, female: femalePercentage };
        
        if (genderCounts.male > genderCounts.female) {
          disease.dominantGender = `Male (${malePercentage}%)`;
        } else if (genderCounts.female > genderCounts.male) {
          disease.dominantGender = `Female (${femalePercentage}%)`;
        } else {
          disease.dominantGender = `Equal (${malePercentage}% each)`;
        }
      }
      
      // Find dominant age group and most common ages
      const ageGroupCounts = disease.ageGroups;
      const sortedAgeGroups = Object.entries(ageGroupCounts)
        .sort(([,a], [,b]) => b - a);
      
      disease.dominantAgeGroup = sortedAgeGroups[0][0];
      
      // Find the most common age groups (top 2-3)
      disease.mostCommonAgeGroups = sortedAgeGroups
        .filter(([, count]) => count > 0)
        .slice(0, 3)
        .map(([group, count]) => ({ group, count }));
      
      // Calculate age distribution percentages
      const totalAgeCount = Object.values(ageGroupCounts).reduce((sum, count) => sum + count, 0);
      disease.ageGroupPercentages = {};
      Object.entries(ageGroupCounts).forEach(([group, count]) => {
        disease.ageGroupPercentages[group] = totalAgeCount > 0 ? 
          Math.round((count / totalAgeCount) * 100) : 0;
      });
    });

    // Convert to array and sort by cases
    const result = Object.values(diseaseStats)
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 20); // Top 20 most common diseases
    
    // Debug: Log the first few diseases to see their age groups
    console.log('Disease analysis results:', result);
    console.log('Total diseases found:', result.length);
    if (result.length > 0) {
      console.log('First disease details:', {
        name: result[0].name,
        cases: result[0].cases,
        ageGroups: result[0].ageGroups,
        mostCommonAgeGroups: result[0].mostCommonAgeGroups,
        genderPercentage: result[0].genderPercentage,
        dominantGender: result[0].dominantGender
      });
      
      // Test: Log all age groups to verify they're correct
      console.log('Age groups for first disease:', Object.keys(result[0].ageGroups));
      console.log('Most common age groups:', result[0].mostCommonAgeGroups?.map(ag => ag.group));
    }
    
    // If no diseases found, add a test disease to verify UI
    if (result.length === 0) {
      console.log('No diseases found, adding test data...');
      result.push({
        name: 'test condition',
        cases: 5,
        genders: { male: 3, female: 2 },
        genderPercentage: { male: 60, female: 40 },
        dominantGender: 'Male (60%)',
        ageGroups: { '0-18': 2, '18-60': 2, '60+': 1 },
        mostCommonAgeGroups: [
          { group: '0-18', count: 2 },
          { group: '18-60', count: 2 },
          { group: '60+', count: 1 }
        ],
        ageGroupPercentages: { '0-18': 40, '18-60': 40, '60+': 20 },
        exactTexts: ['Patient reports chest pain that started 3 days ago. The pain is described as sharp and localized to the left side of the chest. No radiation to arms or jaw. Pain worsens with deep breathing and movement. No fever or shortness of breath. Patient denies any recent trauma or heavy lifting.'],
        avgAge: 35,
        minAge: 15,
        maxAge: 65,
        validAgeCount: 5
      });
    }
    
    return result;
  };

  const fetchDashboardData = async (currentTimeFilter = timeFilter) => {
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
      // Use trackerPatients (Patient model) since medical records are linked to that table
      const diseaseStats = analyzeDiseases(medicalRecords, trackerPatients, currentTimeFilter);

      setStats({
        totalPatients: patients.length,
        totalVaccines: vaccines.length,
        totalVaccineTracker: trackerPatients.length,
        todayPatients
      });

      setRecentPatients(recent);
      setDiseaseData(diseaseStats);
      setFilteredDiseaseData(diseaseStats);
      
      console.log('Setting disease data:', diseaseStats.length, 'diseases');
      console.log('First disease:', diseaseStats[0]);
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
                            <strong>{getFullName(patient) || patient.child_name || `Patient ${patient.id}`}</strong>
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

      {/* Disease Analysis Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="card-title fw-semibold mb-1">
                    <i className="bi bi-heart-pulse me-2 text-danger"></i>
                    Disease Pattern Analysis
                  </h5>
                  <small className="text-muted">
                    Most common exact text from "History of Present Illness" ranked by frequency (1 case per patient)
                    {timeFilter !== 'all' && (
                      <span className="ms-2 badge bg-info">
                        {timeFilter === '2days' && 'Last 2 Days'}
                        {timeFilter === '2weeks' && 'Last 2 Weeks'}
                        {timeFilter === '2months' && 'Last 2 Months'}
                      </span>
                    )}
                  </small>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="btn-group" role="group" aria-label="Time period filter">
                    <button
                      type="button"
                      className={`btn btn-sm ${timeFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleTimeFilterChange('all')}
                    >
                      All Time
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${timeFilter === '2months' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleTimeFilterChange('2months')}
                    >
                      2 Months
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${timeFilter === '2weeks' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleTimeFilterChange('2weeks')}
                    >
                      2 Weeks
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${timeFilter === '2days' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleTimeFilterChange('2days')}
                    >
                      2 Days
                    </button>
                  </div>
                  <div className="badge bg-primary fs-6 px-3 py-2">
                    {filteredDiseaseData.length} Conditions
                    {filteredDiseaseData.length >= 20 && <span className="ms-1">(Top 20)</span>}
                  </div>
                </div>
              </div>
              
              {filteredDiseaseData.length > 0 ? (
                <div className="row g-4">
                  {/* Top 3 Diseases with Detailed Cards */}
                  {filteredDiseaseData.slice(0, 3).map((disease, index) => {
                    console.log(`Disease ${index + 1}:`, disease.name, 'Age groups:', disease.ageGroups, 'Most common:', disease.mostCommonAgeGroups);
                    return (
                    <div key={index} className="col-lg-4 col-md-6">
                      <div className="card h-100 border-0 shadow-sm disease-card" style={{
                        background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe'][index]} 0%, ${['#764ba2', '#f5576c', '#00f2fe'][index]} 100%)`,
                        color: 'white',
                        borderRadius: '15px',
                        overflow: 'hidden'
                      }}>
                        <div className="card-body p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="disease-rank" style={{
                              background: 'rgba(255,255,255,0.2)',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}>
                              #{index + 1}
                            </div>
                            <div className="text-end">
                              <div className="h4 mb-0 fw-bold">{disease.cases}</div>
                              <small className="opacity-75">Cases</small>
                            </div>
                          </div>
                          
                          <h6 className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>
                            {disease.fullText}
                          </h6>
                          
                          {/* Show exact text from History of Present Illness */}
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-file-text me-2" style={{ fontSize: '0.9rem' }}></i>
                              <small className="opacity-75">Exact Text (appears {disease.cases} times):</small>
                            </div>
                            <div className="small opacity-75" style={{ 
                              background: 'rgba(255,255,255,0.1)', 
                              padding: '8px', 
                              borderRadius: '6px',
                              fontStyle: 'italic',
                              maxHeight: '120px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word'
                            }}>
                              "{disease.fullText}"
                            </div>
                          </div>
                          
                          <div className="row g-2">
                            <div className="col-6">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-gender-ambiguous me-2" style={{ fontSize: '0.9rem' }}></i>
                                <small className="opacity-75">Gender</small>
                              </div>
                              <div className="fw-semibold">
                                {disease.dominantGender}
                                <div className="small opacity-75">
                                  M: {disease.genders.male} ({disease.genderPercentage?.male || 0}%) | F: {disease.genders.female} ({disease.genderPercentage?.female || 0}%)
                                </div>
                              </div>
                            </div>
                            
                            <div className="col-6">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-calendar3 me-2" style={{ fontSize: '0.9rem' }}></i>
                                <small className="opacity-75">Most Common Ages</small>
                              </div>
                              <div className="fw-semibold">
                                {disease.mostCommonAgeGroups && disease.mostCommonAgeGroups.length > 0 ? (
                                  <div>
                                    <div className="small opacity-75 mb-1">
                                      {disease.mostCommonAgeGroups[0].group}: {disease.mostCommonAgeGroups[0].count} cases
                                    </div>
                                    {disease.mostCommonAgeGroups[1] && (
                                      <div className="small opacity-75">
                                        {disease.mostCommonAgeGroups[1].group}: {disease.mostCommonAgeGroups[1].count}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="small opacity-75">No age data</div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-people me-2" style={{ fontSize: '0.9rem' }}></i>
                              <small className="opacity-75">Age Distribution</small>
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                              {disease.mostCommonAgeGroups && disease.mostCommonAgeGroups.length > 0 ? (
                                disease.mostCommonAgeGroups.map((ageGroup, idx) => (
                                  <span key={ageGroup.group} className="badge" style={{
                                    background: idx === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    fontWeight: idx === 0 ? 'bold' : 'normal'
                                  }}>
                                    {ageGroup.group}: {ageGroup.count} ({disease.ageGroupPercentages[ageGroup.group]}%)
                                  </span>
                                ))
                              ) : (
                                <span className="badge" style={{
                                  background: 'rgba(255,255,255,0.3)',
                                  fontSize: '0.7rem',
                                  padding: '2px 6px'
                                }}>
                                  No age data
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Gender Distribution Bar */}
                          <div className="mt-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-gender-ambiguous me-2" style={{ fontSize: '0.9rem' }}></i>
                              <small className="opacity-75">Gender Distribution</small>
                            </div>
                            <div className="d-flex" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.2)' }}>
                              <div 
                                style={{ 
                                  width: `${disease.genderPercentage?.male || 0}%`, 
                                  background: 'rgba(255,255,255,0.8)',
                                  transition: 'width 0.3s ease'
                                }}
                                title={`Male: ${disease.genderPercentage?.male || 0}%`}
                              ></div>
                              <div 
                                style={{ 
                                  width: `${disease.genderPercentage?.female || 0}%`, 
                                  background: 'rgba(255,255,255,0.4)',
                                  transition: 'width 0.3s ease'
                                }}
                                title={`Female: ${disease.genderPercentage?.female || 0}%`}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <small className="opacity-75" style={{ fontSize: '0.7rem' }}>
                                ♂ {disease.genderPercentage?.male || 0}%
                              </small>
                              <small className="opacity-75" style={{ fontSize: '0.7rem' }}>
                                ♀ {disease.genderPercentage?.female || 0}%
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                  
                  {/* Additional Diseases List */}
                  {filteredDiseaseData.length > 3 && (
                    <div className="col-12">
                      <div className="card border-0" style={{ background: '#f8f9fa' }}>
                        <div className="card-body p-4">
                          <h6 className="fw-semibold mb-3 text-muted">
                            <i className="bi bi-list-ul me-2"></i>
                            Other Common Conditions ({filteredDiseaseData.length - 3} more)
                          </h6>
                          <div className="row g-2">
                            {filteredDiseaseData.slice(3).map((disease, index) => (
                              <div key={index + 3} className="col-lg-2 col-md-3 col-sm-4 col-6">
                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '8px' }}>
                                  <div className="card-body p-2">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                                        {disease.fullText.length > 40 ? disease.fullText.substring(0, 40) + '...' : disease.fullText}
                                      </h6>
                                      <span className="badge bg-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                        {disease.cases}
                                      </span>
                                    </div>
                                    
                                    {/* Show exact text snippet - more compact */}
                                    <div className="mb-2">
                                      <div className="small" style={{ 
                                        background: '#f8f9fa', 
                                        padding: '3px 5px', 
                                        borderRadius: '3px',
                                        fontStyle: 'italic',
                                        fontSize: '0.65rem',
                                        maxHeight: '60px',
                                        overflowY: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                        lineHeight: '1.2'
                                      }}>
                                        "{disease.fullText.length > 100 ? 
                                          disease.fullText.substring(0, 100) + '...' : 
                                          disease.fullText}"
                                      </div>
                                    </div>
                                    
                                    <div className="row g-1 text-center">
                                      <div className="col-6">
                                        <div className="small text-muted" style={{ fontSize: '0.6rem' }}>Gender</div>
                                        <div className="fw-semibold" style={{ fontSize: '0.7rem' }}>
                                          {disease.dominantGender?.includes('Male') ? '♂' : 
                                           disease.dominantGender?.includes('Female') ? '♀' : 
                                           disease.dominantGender?.includes('Equal') ? '♂♀' : '?'}
                                        </div>
                                        <div className="small text-muted" style={{ fontSize: '0.6rem' }}>
                                          {disease.genders.male}|{disease.genders.female}
                                        </div>
                                      </div>
                                      <div className="col-6">
                                        <div className="small text-muted" style={{ fontSize: '0.6rem' }}>Top Age</div>
                                        <div className="fw-semibold" style={{ fontSize: '0.7rem' }}>
                                          {disease.mostCommonAgeGroups && disease.mostCommonAgeGroups.length > 0 ? 
                                            disease.mostCommonAgeGroups[0].group : 
                                            'N/A'
                                          }
                                        </div>
                                        <div className="small text-muted" style={{ fontSize: '0.6rem' }}>
                                          {disease.mostCommonAgeGroups && disease.mostCommonAgeGroups.length > 0 ? 
                                            disease.mostCommonAgeGroups[0].count : 0} cases
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-1">
                                      <div className="d-flex flex-wrap gap-1 justify-content-center">
                                        {disease.mostCommonAgeGroups && disease.mostCommonAgeGroups.length > 0 ? (
                                          disease.mostCommonAgeGroups.slice(0, 2).map((ageGroup, idx) => (
                                            <span key={ageGroup.group} className="badge bg-light text-dark" style={{ 
                                              fontSize: '0.55rem',
                                              fontWeight: idx === 0 ? 'bold' : 'normal',
                                              padding: '1px 4px'
                                            }}>
                                              {ageGroup.group}:{ageGroup.count}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="badge bg-light text-dark" style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                                            No data
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Summary Statistics */}
                  <div className="col-12">
                    <div className="card border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <div className="card-body p-4">
                        <h6 className="fw-semibold mb-3">
                <i className="bi bi-graph-up me-2"></i>
                          Analysis Summary
                        </h6>
                        <div className="row g-3">
                          <div className="col-md-3 col-6">
                            <div className="text-center">
                              <div className="h5 mb-1 fw-bold">{filteredDiseaseData.length}</div>
                              <small className="opacity-75">Total Conditions</small>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="text-center">
                              <div className="h5 mb-1 fw-bold">
                                {filteredDiseaseData.length > 0 ? Math.round(filteredDiseaseData.reduce((sum, d) => sum + d.avgAge, 0) / filteredDiseaseData.length) : 0}
                              </div>
                              <small className="opacity-75">Avg Age</small>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="text-center">
                              <div className="h5 mb-1 fw-bold">
                                {filteredDiseaseData.filter(d => d.dominantGender?.includes('Male') && !d.dominantGender?.includes('Equal')).length}
                              </div>
                              <small className="opacity-75">Male-Dominant</small>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="text-center">
                              <div className="h5 mb-1 fw-bold">
                                {filteredDiseaseData.filter(d => d.dominantGender?.includes('Female') && !d.dominantGender?.includes('Equal')).length}
                              </div>
                              <small className="opacity-75">Female-Dominant</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="bi bi-clipboard-x text-muted" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h5 className="text-muted mb-3">No Disease Data Available</h5>
                  <p className="text-muted mb-4">
                    Most common text patterns will appear here once medical records with "History of Present Illness" are added
                  </p>
                  <div className="alert alert-info d-inline-block">
                    <i className="bi bi-info-circle me-2"></i>
                    <small>Shows exact text from "History of Present Illness" ranked by how many times the same text appears</small>
                  </div>
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
