import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

function loadUser() {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const user = JSON.parse(userData);
      return { ...user, access_token: token };
    }
  } catch (_) {}
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = (data) => {
    const cleanToken = (data.access_token || '').trim().replace(/^["']|["']$/g, '');
    
    // ✅ Make sure we preserve the role from the response
    const userData = {
      id: data.user?.id,
      role: data.user?.role || data.role || 'unknown',
      email: data.user?.email,
      full_name: data.user?.full_name || data.user?.display_name,
      display_name: data.user?.display_name,
      class_id: data.user?.class_id,
      student_ids: data.user?.student_ids,
      class_ids: data.user?.class_ids,
      access_token: cleanToken
    };
    
    setUser(userData);
    localStorage.setItem('token', cleanToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ✅ All login methods use the same function
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
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginTeacher, 
      loginStudent, 
      loginParent, 
      loginAdmin, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);