import React from 'react';
import ToastPortal from './ToastPortal';

const Toast = ({ 
  show, 
  onClose, 
  message, 
  type = 'warning', 
  duration = 4000,
  title = 'Notification'
}) => {
  const getToastStyles = () => {
    const baseStyles = {
      background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
      border: '2px solid #ffc107',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(255, 193, 7, 0.3)',
      animation: 'slideInRight 0.5s ease-out',
      zIndex: 999999,
      position: 'relative'
    };

    if (type === 'success') {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
        border: '2px solid #28a745',
        boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)'
      };
    }

    if (type === 'error') {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
        border: '2px solid #dc3545',
        boxShadow: '0 8px 25px rgba(220, 53, 69, 0.3)'
      };
    }

    return baseStyles;
  };

  const getHeaderStyles = () => {
    const baseStyles = {
      background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
      color: 'white',
      borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
      borderRadius: '12px 12px 0 0'
    };

    if (type === 'success') {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        borderBottom: '1px solid rgba(40, 167, 69, 0.3)'
      };
    }

    if (type === 'error') {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        borderBottom: '1px solid rgba(220, 53, 69, 0.3)'
      };
    }

    return baseStyles;
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-exclamation-triangle';
    }
  };

  return (
    <ToastPortal show={show} onClose={onClose} duration={duration}>
      <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true" style={getToastStyles()}>
        <div className="toast-header" style={getHeaderStyles()}>
          <div className="d-flex align-items-center">
            <i className={`${getIcon()} me-2`} style={{ color: 'white' }}></i>
            <strong className="me-auto">{title}</strong>
            <small>Just now</small>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '1rem'
            }}
          >
            ×
          </button>
        </div>
        <div className="toast-body" style={{ color: '#856404', padding: '1rem' }}>
          <div className="d-flex align-items-center">
            <i className="fas fa-bell me-3" style={{ fontSize: '1.5rem', color: '#ffc107' }}></i>
            <div>
              <p className="mb-1 fw-semibold">{message}</p>
              <small className="text-muted">
                Click the notification bell in the header for more details
              </small>
            </div>
          </div>
        </div>
      </div>
    </ToastPortal>
  );
};

export default Toast;
