import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ToastPortal = ({ children, show, onClose, duration = 4000 }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!mounted || !show) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 999999,
        maxWidth: '400px',
        minWidth: '350px'
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default ToastPortal;
