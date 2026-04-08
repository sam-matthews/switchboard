import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => process.env.REACT_APP_DEV_TOKEN || null);

  const login = () => {
    // Lightweight local auth for development until external auth is wired in.
    setIsAuthenticated(true);
    setUser({ name: 'Developer', preferred_username: 'developer' });
    if (!token) {
      setToken(process.env.REACT_APP_DEV_TOKEN || null);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const getToken = () => token;

  const value = {
    isAuthenticated,
    user,
    isLoading: false,
    login,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useAuthContext;
