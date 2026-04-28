import { Routes, Route } from 'react-router-dom';
import SurveyPage from './pages/SurveyPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SurveyPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
