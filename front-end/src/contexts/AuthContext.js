import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Role-based permissions configuration
  const rolePermissions = {
    encoder: {
      canAccess: ['dashboard', 'patientlist', 'patient-vaccine-tracker', 'vaccinelist', 'contraceptive-list', 'family-planning-list', 'doctor-patient-list', 'audit-log'],
      displayName: 'Encoder'
    },
    nursing_attendant: {
      canAccess: ['dashboard', 'patientlist', 'audit-log'],
      displayName: 'Nursing Attendant'
    },
    midwife: {
      canAccess: ['dashboard', 'patientlist', 'doctor-patient-list', 'audit-log'],
      displayName: 'Midwife'
    },
    doctor: {
      canAccess: ['dashboard', 'doctor-patient-list', 'audit-log'],
      displayName: 'Doctor'
    },
    // Add common variations that might be returned by backend
    'doctor_user': {
      canAccess: ['dashboard', 'doctor-patient-list', 'audit-log'],
      displayName: 'Doctor'
    },
    'Doctor': {
      canAccess: ['dashboard', 'doctor-patient-list', 'audit-log'],
      displayName: 'Doctor'
    },
    cold_chain_manager: {
      canAccess: ['dashboard', 'vaccinelist', 'contraceptive-list', 'patient-vaccine-tracker', 'audit-log'],
      displayName: 'Cold Chain Manager'
    }
  };

  // Check if user has access to a specific page
  const hasAccess = (page) => {
    if (!user || !user.role) {
      console.log('hasAccess: No user or role found', { user, role: user?.role });
      return false;
    }
    
    // Normalize the role - handle both exact matches and variations
    const userRole = user.role.toLowerCase().replace(/\s+/g, '_');
    let hasPermission = rolePermissions[userRole]?.canAccess.includes(page) || false;
    
    // Fallback: try to find role by partial matching if exact match fails
    if (!hasPermission) {
      const availableRoles = Object.keys(rolePermissions);
      const matchingRole = availableRoles.find(role => {
        const normalizedUserRole = userRole;
        const normalizedAvailableRole = role.toLowerCase();
        
        // Check for exact match, partial match, or common variations
        return normalizedUserRole === normalizedAvailableRole ||
               normalizedUserRole.includes(normalizedAvailableRole) ||
               normalizedAvailableRole.includes(normalizedUserRole) ||
               (normalizedUserRole.includes('doctor') && normalizedAvailableRole.includes('doctor')) ||
               (normalizedUserRole.includes('nursing') && normalizedAvailableRole.includes('nursing')) ||
               (normalizedUserRole.includes('encoder') && normalizedAvailableRole.includes('encoder')) ||
               (normalizedUserRole.includes('midwife') && normalizedAvailableRole.includes('midwife')) ||
               (normalizedUserRole.includes('cold') && normalizedAvailableRole.includes('cold'));
      });
      
      if (matchingRole) {
        hasPermission = rolePermissions[matchingRole]?.canAccess.includes(page) || false;
        console.log('🔄 Fallback role matching found:', { userRole, matchingRole, hasPermission });
      }
    }
    
    console.log('🔍 hasAccess check:', {
      page,
      userRole,
      userRoleOriginal: user.role,
      availableRoles: Object.keys(rolePermissions),
      userPermissions: rolePermissions[userRole]?.canAccess,
      hasPermission,
      fullUser: user,
      rolePermissionsObject: rolePermissions
    });
    
    // Additional debugging for doctor role specifically
    if (user.role.toLowerCase().includes('doctor')) {
      console.log('👨‍⚕️ Doctor role debugging:', {
        originalRole: user.role,
        normalizedRole: userRole,
        exactMatch: rolePermissions[userRole],
        allDoctorVariations: Object.keys(rolePermissions).filter(role => role.includes('doctor'))
      });
    }
    
    return hasPermission;
  };

  // Get user's accessible pages
  const getAccessiblePages = () => {
    if (!user || !user.role) return [];
    const userRole = user.role.toLowerCase().replace(/\s+/g, '_');
    let permissions = rolePermissions[userRole]?.canAccess || [];
    
    // Fallback: try to find role by partial matching if exact match fails
    if (permissions.length === 0) {
      const availableRoles = Object.keys(rolePermissions);
      const matchingRole = availableRoles.find(role => {
        const normalizedUserRole = userRole;
        const normalizedAvailableRole = role.toLowerCase();
        
        return normalizedUserRole === normalizedAvailableRole ||
               normalizedUserRole.includes(normalizedAvailableRole) ||
               normalizedAvailableRole.includes(normalizedUserRole) ||
               (normalizedUserRole.includes('doctor') && normalizedAvailableRole.includes('doctor')) ||
               (normalizedUserRole.includes('nursing') && normalizedAvailableRole.includes('nursing')) ||
               (normalizedUserRole.includes('encoder') && normalizedAvailableRole.includes('encoder')) ||
               (normalizedUserRole.includes('midwife') && normalizedAvailableRole.includes('midwife')) ||
               (normalizedUserRole.includes('cold') && normalizedAvailableRole.includes('cold'));
      });
      
      if (matchingRole) {
        permissions = rolePermissions[matchingRole]?.canAccess || [];
      }
    }
    
    return permissions;
  };

  // Get authentication token
  const getToken = () => {
    return localStorage.getItem('auth_token');
  };

  // Login function
  const login = (userData, token) => {
    console.log('🔐 Login function called with:', { userData, token });
    console.log('🔐 User role from backend:', userData?.role);
    console.log('🔐 Available roles in system:', Object.keys(rolePermissions));
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    // Test access immediately after login
    setTimeout(() => {
      console.log('🧪 Testing access after login:');
      console.log('🧪 Dashboard access:', hasAccess('dashboard'));
      console.log('🧪 Doctor Patient List access:', hasAccess('doctor-patient-list'));
      console.log('🧪 Audit Log access:', hasAccess('audit-log'));
      console.log('🧪 Patient List access:', hasAccess('patientlist'));
    }, 100);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null && getToken() !== null;
  };

  // Get user role display name
  const getRoleDisplayName = () => {
    if (!user || !user.role) return '';
    const userRole = user.role.toLowerCase().replace(/\s+/g, '_');
    let displayName = rolePermissions[userRole]?.displayName || user.role;
    
    // Fallback: try to find role by partial matching if exact match fails
    if (displayName === user.role) {
      const availableRoles = Object.keys(rolePermissions);
      const matchingRole = availableRoles.find(role => {
        const normalizedUserRole = userRole;
        const normalizedAvailableRole = role.toLowerCase();
        
        return normalizedUserRole === normalizedAvailableRole ||
               normalizedUserRole.includes(normalizedAvailableRole) ||
               normalizedAvailableRole.includes(normalizedUserRole) ||
               (normalizedUserRole.includes('doctor') && normalizedAvailableRole.includes('doctor')) ||
               (normalizedUserRole.includes('nursing') && normalizedAvailableRole.includes('nursing')) ||
               (normalizedUserRole.includes('encoder') && normalizedAvailableRole.includes('encoder')) ||
               (normalizedUserRole.includes('midwife') && normalizedAvailableRole.includes('midwife')) ||
               (normalizedUserRole.includes('cold') && normalizedAvailableRole.includes('cold'));
      });
      
      if (matchingRole) {
        displayName = rolePermissions[matchingRole]?.displayName || user.role;
      }
    }
    
    return displayName;
  };

  // Initialize user from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('auth_token');
    
    console.log('AuthContext initialization:', { savedUser, savedToken });
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('Parsed user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    } else if (savedUser && !savedToken) {
      // Clean up if user exists but no token
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    hasAccess,
    getAccessiblePages,
    getRoleDisplayName,
    getToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 