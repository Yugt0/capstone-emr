# Audit Log System Documentation

## Overview

The Electronic Medical Records (EMR) system now includes a comprehensive audit logging system that tracks all user activities and system changes. This ensures accountability, security, and compliance with healthcare data regulations.

## Features

### 🔍 **Comprehensive Activity Tracking**
- **User Actions**: Login, logout, create, update, delete, view, search, export
- **System Models**: Patient, User, PatientInformation, PatientMedicalRecords, and more
- **Detailed Information**: IP address, user agent, timestamps, old/new values
- **Real-time Logging**: All activities are logged immediately

### 🎯 **Advanced Filtering & Search**
- Filter by action type (Created, Updated, Deleted, Viewed, etc.)
- Search across all fields (user, action, model, description)
- Filter by date range
- Filter by specific user or model
- Pagination support for large datasets

### 📊 **Statistics & Reporting**
- Total activity counts
- Daily, weekly, monthly statistics
- Most active users
- Most common actions
- Model activity breakdown

## Database Schema

### Audit Logs Table Structure

```sql
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) NULL,
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_model (model),
    INDEX idx_created_at (created_at),
    INDEX idx_user_created (user_id, created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## Implementation Details

### 1. AuditLog Model (`app/Models/AuditLog.php`)

The main model for audit log entries with:
- Fillable fields for mass assignment
- JSON casting for old/new values
- Relationship to User model
- Query scopes for filtering

### 2. AuditLogService (`app/Services/AuditLogService.php`)

Service class providing static methods for logging:
- `log()` - General logging method
- `logCreated()` - Log creation activities
- `logUpdated()` - Log update activities with old/new values
- `logDeleted()` - Log deletion activities
- `logViewed()` - Log view activities
- `logLogin()` - Log user login
- `logLogout()` - Log user logout
- `logSearch()` - Log search activities
- `logExport()` - Log export activities
- `getLogs()` - Retrieve logs with filtering

### 3. Auditable Trait (`app/Models/Traits/Auditable.php`)

Trait that can be added to any model for automatic logging:
- Automatically logs create, update, delete events
- Provides methods for custom action logging
- Easy to implement across all models

### 4. AuditLogController (`app/Http/Controllers/AuditLogController.php`)

API controller providing endpoints:
- `GET /api/audit-logs` - List all logs with pagination and filtering
- `GET /api/audit-logs/recent` - Get recent logs (last 100)
- `GET /api/audit-logs/user/{userId}` - Get logs for specific user
- `GET /api/audit-logs/model/{model}` - Get logs for specific model
- `GET /api/audit-logs/statistics` - Get audit statistics

## Usage Examples

### Adding Audit Logging to Models

```php
use App\Models\Traits\Auditable;

class Patient extends Model
{
    use HasFactory, Auditable;
    // ... rest of model
}
```

### Manual Logging

```php
use App\Services\AuditLogService;

// Log a custom action
AuditLogService::log(
    'Custom Action',
    'Patient',
    $patient->id,
    'Custom description',
    $oldValues,
    $newValues
);

// Log specific actions
AuditLogService::logCreated('Patient', $patient->id, 'New patient registered');
AuditLogService::logUpdated('Patient', $patient->id, 'Patient information updated', $oldData, $newData);
AuditLogService::logViewed('Patient', $patient->id, 'Patient record viewed');
```

### Logging from Models

```php
// Log a custom action from within a model
$patient->logAction('Discharged', 'Patient discharged from care');

// Log a view action
$patient->logViewed('Patient record accessed');
```

## Frontend Integration

### React Component (`front-end/src/pages/AuditLogTable.js`)

The frontend component provides:
- Real-time data fetching from API
- Advanced search and filtering
- Pagination support
- Error handling with fallback to dummy data
- Responsive design with Bootstrap
- Color-coded action badges
- IP address display for security

### API Integration

```javascript
// Fetch audit logs with filtering
const fetchAuditLogs = async (page = 1, search = "", action = "All") => {
  const params = new URLSearchParams({
    page: page,
    per_page: 50,
    search: search,
    action: action
  });

  const response = await fetch(`${API_BASE_URL}/audit-logs?${params}`);
  const data = await response.json();
  // Handle response...
};
```

## Security Features

### 🔒 **Data Protection**
- IP address tracking for security monitoring
- User agent logging for device identification
- Old/new value tracking for change verification
- User authentication required for access

### 🛡️ **Access Control**
- Role-based access (encoder, doctor, midwife, nursing_attendant, cold_chain_manager)
- Authentication required for all audit log endpoints
- CORS headers properly configured

### 📋 **Compliance**
- Comprehensive audit trail for healthcare compliance
- Detailed change tracking for data integrity
- User accountability for all actions

## API Endpoints

### Authentication Required
All audit log endpoints require authentication via Laravel Sanctum.

```http
GET /api/audit-logs
GET /api/audit-logs?search=patient&action=Created&page=1
GET /api/audit-logs/recent
GET /api/audit-logs/user/123
GET /api/audit-logs/model/Patient
GET /api/audit-logs/statistics
```

### Response Format

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "user_name": "Dr. Smith",
      "action": "Created",
      "model": "Patient",
      "model_id": "456",
      "description": "New patient registered",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "old_values": null,
      "new_values": {"name": "John Doe", "age": 30},
      "created_at": "2025-08-02T15:30:00.000000Z"
    }
  ],
  "last_page": 5,
  "per_page": 50,
  "total": 250
}
```

## Monitoring & Maintenance

### Performance Considerations
- Indexed database columns for fast queries
- Pagination to handle large datasets
- Efficient filtering with database indexes
- JSON storage for flexible data structure

### Data Retention
- Consider implementing data retention policies
- Archive old logs for compliance
- Regular cleanup of very old entries

### Monitoring
- Monitor log volume and performance
- Set up alerts for unusual activity patterns
- Regular backup of audit log data

## Troubleshooting

### Common Issues

1. **Migration Errors**: If table already exists, manually mark migration as run
2. **Permission Issues**: Ensure proper user authentication and role permissions
3. **API Connection**: Verify API base URL in frontend configuration
4. **CORS Issues**: Check CORS headers in API responses

### Debug Commands

```bash
# Check migration status
php artisan migrate:status

# Test audit log functionality
php artisan tinker
>>> \App\Services\AuditLogService::log('Test', 'TestModel', '123', 'Test entry');

# Check table structure
php artisan tinker
>>> \Schema::getColumnListing('audit_logs');
```

## Future Enhancements

### Planned Features
- Export audit logs to PDF/Excel
- Real-time notifications for critical actions
- Advanced analytics dashboard
- Integration with external logging systems
- Automated anomaly detection

### Scalability
- Database partitioning for large datasets
- Caching for frequently accessed data
- Asynchronous logging for high-volume systems
- Distributed logging for multi-server setups

## Support

For technical support or questions about the audit log system:
1. Check this documentation
2. Review the code comments
3. Test with the provided examples
4. Contact the development team

---

**Last Updated**: August 2, 2025  
**Version**: 1.0.0  
**Compatibility**: Laravel 10+, React 18+ 