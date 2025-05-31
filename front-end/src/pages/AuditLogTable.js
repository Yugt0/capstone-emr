import React, { useContext, useEffect, useState } from "react";

// Simulated AuthContext
const AuthContext = React.createContext({
  user: {
    name: "Encoder Juan",
    role: "encoder",
  },
});

export default function AuditLogTable() {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");

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

  useEffect(() => {
    const allowedRoles = ["encoder", "doctor", "midwife"];
    if (!allowedRoles.includes(user.role)) return;

    setTimeout(() => {
      setLogs(dummyLogs);
      setFilteredLogs(dummyLogs);
      setLoading(false);
    }, 1000);
  }, [user.role]);

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

  if (!["encoder", "doctor", "midwife"].includes(user.role)) {
    return (
      <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger">Access denied. Unauthorized role.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      {/* Header */}
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div className="bg-primary text-white py-4 px-5 rounded shadow-sm w-100">
          <h1 className="h3 m-0">Electronic Medical Records - Audit Logs</h1>
          <p className="m-0">Welcome, {user.name} ({user.role})</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="row mb-3">
        <div className="col-md-6 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by user, action, model, etc."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <select
            className="form-select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="Updated">Updated</option>
            <option value="Deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-4">Recent Activities</h5>

          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered" style={{ minWidth: "1100px" }}>
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Model</th>
                    <th>Model ID</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>{log.user_name}</td>
                        <td>{log.action}</td>
                        <td>{log.model}</td>
                        <td>{log.model_id}</td>
                        <td>{log.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No matching records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}