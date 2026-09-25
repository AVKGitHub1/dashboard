import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './routes/DashboardPage';
import LoginPage from './routes/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';
import SettingsPage from './routes/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
