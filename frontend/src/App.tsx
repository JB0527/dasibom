import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import { ReportPage } from './pages/Report/ReportPage';
import MissingPersonListPage from './pages/MissingPersonList/MissingPersonListPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/missing-list" element={<MissingPersonListPage />} />
        <Route path="/report/:missingPersonId" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
