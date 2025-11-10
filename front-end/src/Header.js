import "./styles/Header.css";
import { useAuth } from "./contexts/AuthContext";
import { useState, useEffect } from "react";

function Header() {
  const { user, getRoleDisplayName, isMobile, toggleMobileSidebar } = useAuth();
  const [screenSize, setScreenSize] = useState('desktop');

  // Get user's display name (full_name if available, otherwise name)
  const getUserDisplayName = () => {
    if (!user) return "Guest";
    return user.full_name || user.name || user.username || "User";
  };

  // Get user's role display name
  const getUserRole = () => {
    if (!user) return "Guest";
    return getRoleDisplayName();
  };

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScreenSize('mobile-small');
      } else if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive styles based on screen size
  const getResponsiveStyles = () => {
    const isSmallScreen = screenSize === 'mobile' || screenSize === 'mobile-small';
    const isTablet = screenSize === 'tablet';
    const isDesktop = screenSize === 'desktop';
    
    return {
      header: {
        padding: isSmallScreen ? '0.75rem 1rem' : isTablet ? '0.875rem 1.5rem' : '1.25rem 2rem',
        minHeight: isSmallScreen ? '60px' : isTablet ? '65px' : '70px'
      },
      headerContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        width: '100%',
        position: 'relative'
      },
      mobileMenuButton: {
        position: 'absolute',
        left: isSmallScreen ? '0.75rem' : '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        padding: isSmallScreen ? '0.375rem' : '0.5rem',
        display: isMobile ? 'block' : 'none'
      },
      welcomeMessage: {
        flex: isMobile ? 1 : 'none',
        textAlign: 'center',
        marginLeft: isMobile ? (isSmallScreen ? '2.5rem' : '3rem') : '0',
        marginRight: isMobile ? (isSmallScreen ? '2.5rem' : '3rem') : '0',
        fontSize: isSmallScreen ? '1rem' : isTablet ? '1.125rem' : '1.5rem',
        order: isMobile ? 2 : 1
      },
      accountSettings: {
        position: isMobile ? 'absolute' : 'relative',
        right: isMobile ? (isSmallScreen ? '0.75rem' : '1rem') : 'auto',
        top: isMobile ? '50%' : 'auto',
        transform: isMobile ? 'translateY(-50%)' : 'none',
        zIndex: 10,
        order: isMobile ? 3 : 2
      },
      accountImage: {
        width: isSmallScreen ? '28px' : isTablet ? '32px' : '40px',
        height: isSmallScreen ? '28px' : isTablet ? '32px' : '40px'
      },
      accountName: {
        display: isSmallScreen ? 'none' : 'flex',
        flexDirection: 'column',
        minWidth: isTablet ? '100px' : '120px'
      }
    };
  };


  const styles = getResponsiveStyles();

  return (
    <header className="header" style={styles.header}>
      <div className="header-content" style={styles.headerContent}>
        {/* Mobile Menu Button - Only visible on mobile */}
        {isMobile && (
          <button
            onClick={toggleMobileSidebar}
            className="mobile-menu-button"
            aria-label="Toggle sidebar"
            style={styles.mobileMenuButton}
          >
            <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        {/* Welcome Message - Centered on desktop, adjusted on mobile */}
        <div className="welcome-message" style={styles.welcomeMessage}>
          <h2 style={{ 
            fontSize: styles.welcomeMessage.fontSize,
            margin: 0,
            fontWeight: 600,
            color: '#1f2937',
            letterSpacing: '-0.025em'
          }}>
            Welcome, {getUserDisplayName()}
          </h2>
        </div>
        
        {/* Account Settings - Right aligned on desktop, absolute positioned on mobile */}
        <div className="account-settings" style={styles.accountSettings}>
          <div className="user-profile">
            <img
              src="images/user.png"
              alt="profile icon"
              className="account-image"
              style={styles.accountImage}
            />
            <div className="account-name" style={styles.accountName}>
              <p className="name" style={{ 
                fontSize: screenSize === 'tablet' ? '0.9rem' : '1rem',
                margin: 0,
                fontWeight: 700,
                color: '#1f2937',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                {getUserDisplayName()}
              </p>
              <p className="role" style={{ 
                fontSize: screenSize === 'tablet' ? '0.75rem' : '0.85rem',
                margin: 0,
                color: '#374151',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}>
                {getUserRole()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
