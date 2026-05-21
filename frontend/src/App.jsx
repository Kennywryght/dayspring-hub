import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import UnifiedLogin from './pages/UnifiedLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Legacy redirects */}
          <Route path="/login/teacher" element={<Navigate to="/login" />} />
          <Route path="/login/student" element={<Navigate to="/login" />} />
          <Route path="/login/parent" element={<Navigate to="/login" />} />
          <Route path="/teacher/login" element={<Navigate to="/login" />} />
          <Route path="/student/login" element={<Navigate to="/login" />} />
          <Route path="/parent/login" element={<Navigate to="/login" />} />

          {/* Current routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;