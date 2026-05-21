import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

function loadUser() {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      return { ...JSON.parse(userData), access_token: token };
    }
  } catch (_) {}
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = (data) => {
    const cleanToken = (data.access_token || '').trim().replace(/^["']|["']$/g, '');
    const role = data.user?.role || data.role || 'unknown';
    const userData = { ...data.user, role, access_token: cleanToken };
    setUser(userData);
    localStorage.setItem('token', cleanToken);
    localStorage.setItem('user', JSON.stringify({ ...data.user, role }));
  };

  const loginTeacher = login;
  const loginStudent = login;
  const loginParent = login;
  const loginAdmin = login;

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginTeacher, loginStudent, loginParent, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);