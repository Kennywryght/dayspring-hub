// frontend/src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});

  const getLastVisit = () => {
    try {
      return localStorage.getItem('lastVisit') || new Date(0).toISOString();
    } catch {
      return new Date(0).toISOString();
    }
  };

  const updateLastVisit = () => {
    localStorage.setItem('lastVisit', new Date().toISOString());
  };

  const updateNotifications = (role, items, type) => {
    if (!items || items.length === 0) return;
    
    const lastVisit = getLastVisit();
    const newItems = items.filter(item => {
      const timestamp = item.created_at || item.submitted_at;
      return timestamp && timestamp > lastVisit;
    }).length;
    
    setCounts(prev => ({ ...prev, [role + '_' + type]: newItems }));
  };

  const clearNotifications = () => {
    updateLastVisit();
    setCounts({});
  };

  const value = {
    counts,
    updateNotifications,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotifications must be used within a NotificationProvider');
    // Return a dummy object with no-op functions to prevent crashes
    return {
      counts: {},
      updateNotifications: () => {},
      clearNotifications: () => {},
    };
  }
  return context;
};