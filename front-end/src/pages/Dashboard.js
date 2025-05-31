import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const diseaseData = [
    { name: 'Cough', cases: 90 },
    { name: 'Fever', cases: 80 },
    { name: 'Cold', cases: 70 },
    { name: 'Headache', cases: 60 },
  ];

  return (
    <div className="dashboard-container">
      <h2 className="mb-4 fw-bold">Dashboard</h2>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary shadow">
            <div className="card-body">
              <h5 className="card-title">Total Patients</h5>
              <h3 className="card-text fw-semibold">1,254</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-white bg-success shadow h-100">
            <div className="card-body">
              <h5 className="card-title">Patients Today</h5>
              <h3 className="card-text fw-semibold">32</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-white bg-danger shadow h-100">
            <div className="card-body">
              <h5 className="card-title">Total Cases</h5>
              <h3 className="card-text fw-semibold">2,038</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        {/* Notifications */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-semibold">New Patients</h5>
              <div className="notification-list mt-3">
                <p className="notification-text">• John Doe</p>
                <p className="notification-text">• Blanco Cedric</p>
                <p className="notification-text">• Endozo Neri</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disease Chart */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-semibold">Top Common Diseases</h5>
              <small className="text-muted">Graph View</small>
              <div style={{ width: '100%', height: 250 }} className="mt-3">
                <ResponsiveContainer>
                  <BarChart data={diseaseData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cases" fill="#0d6efd" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
