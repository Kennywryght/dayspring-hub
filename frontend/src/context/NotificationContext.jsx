import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
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

  return (
    <NotificationContext.Provider value={{ counts, updateNotifications, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);