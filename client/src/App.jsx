import { Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import AppNavbar from './components/layout/AppNavbar.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RoomInspectionPage from './pages/RoomInspectionPage.jsx'
import RoomHistoryPage from './pages/RoomHistoryPage.jsx'
import BulkBackdatePage from './pages/BulkBackdatePage.jsx'
import SettingsRoomsPage from './pages/SettingsRoomsPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'

export default function App() {
  return (
    <>
      <AppNavbar />
      <Container fluid="sm" as="main" className="flex-grow-1 pb-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/rooms/:roomId" element={<RoomInspectionPage />} />
            <Route path="/rooms/:roomId/history" element={<RoomHistoryPage />} />
            <Route path="/bulk-backdate" element={<BulkBackdatePage />} />
            <Route path="/settings/rooms" element={<SettingsRoomsPage />} />
          </Route>
        </Routes>
      </Container>
    </>
  )
}
