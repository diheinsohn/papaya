import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/layout/Header'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/profile/SettingsPage'
import HomePage from './pages/home/HomePage'
import CreateListingPage from './pages/listings/CreateListingPage'
import ListingDetailPage from './pages/listings/ListingDetailPage'
import EditListingPage from './pages/listings/EditListingPage'
import MyListingsPage from './pages/listings/MyListingsPage'
import SearchResultsPage from './pages/search/SearchResultsPage'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/home" element={<><Header /><HomePage /></>} />
          <Route path="/search" element={<><Header /><SearchResultsPage /></>} />
          <Route path="/listings/:id" element={<><Header /><ListingDetailPage /></>} />
          <Route path="/create-listing" element={<ProtectedRoute><Header /><CreateListingPage /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute><Header /><EditListingPage /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><Header /><MyListingsPage /></ProtectedRoute>} />
          <Route path="/users/:id" element={<><Header /><ProfilePage /></>} />
          <Route path="/settings" element={<ProtectedRoute><Header /><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
