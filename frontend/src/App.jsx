import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UnifiedLogin from './pages/UnifiedLogin';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <Routes>
      {/* Root path - redirect based on auth status */}
      <Route 
        path="/" 
        element={
          user ? (
            // Redirect based on role
            user.role === 'super_admin' ? <Navigate to="/admin" /> :
            user.role === 'teacher' ? <Navigate to="/teacher" /> :
            user.role === 'student' ? <Navigate to="/student" /> :
            user.role === 'parent' ? <Navigate to="/parent" /> :
            <Navigate to="/login" />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      
      {/* Auth routes */}
      <Route path="/login" element={<UnifiedLogin />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ParentDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;