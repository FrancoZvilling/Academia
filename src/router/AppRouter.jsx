// src/router/AppRouter.jsx (COMPLETO)
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import SubjectDetailPage from '../pages/SubjectDetailPage';
import CalendarPage from '../pages/CalendarPage';
import ProfilePage from '../pages/ProfilePage'; 
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import GeneralEventsPage from '../pages/GeneralEventsPage';
import NotebookPage from '../pages/NotebookPage';
import ContactPage from '../pages/ContactPage';
import AIPage from '../pages/AIPage';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="materia/:id" element={<SubjectDetailPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="eventos" element={<GeneralEventsPage />} />
        <Route path="libreta" element={<NotebookPage />} />
        <Route path="ia" element={<AIPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
export default AppRouter;