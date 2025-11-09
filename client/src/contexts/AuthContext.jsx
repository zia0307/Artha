import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(); // Create the AuthContext
// Custom hook to use the AuthContext
// This hook can be used in any component to access auth state and functions
// It ensures that the component is wrapped within AuthProvider before accessing the context values. 

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

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('artha_token');
    const userData = localStorage.getItem('artha_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => { // Login function 
    // Make API call to login endpoint
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    console.log('Login response:', data.user); // Check if role is in response

    // Save token and user data to localStorage
    localStorage.setItem('artha_token', data.token);
    localStorage.setItem('artha_user', JSON.stringify(data.user));
    setUser(data.user);

    return { success: true, user: data.user }; // Return user data on successful login
  } catch (error) {
    return { success: false, error: error.message };
  }
};

  const register = async (name, email, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token and user data
      localStorage.setItem('artha_token', data.token);
      localStorage.setItem('artha_user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => { // Logout function
    localStorage.removeItem('artha_token'); // Remove token and user data from localStorage
    localStorage.removeItem('artha_user'); // Clear user state
    setUser(null);
  };

  const getAuthToken = () => {
    return localStorage.getItem('artha_token');
  };

  const value = { // Values and functions provided by the AuthContext
    user,
    loading,
    login,
    register,
    logout,
    getAuthToken
  };

  return ( // Provide the AuthContext to child components
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};