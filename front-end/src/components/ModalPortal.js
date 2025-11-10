import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const ModalPortal = ({ children, isOpen }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;
  
  return createPortal(
    children,
    document.body
  );
};

export default ModalPortal;

