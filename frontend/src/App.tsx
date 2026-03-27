import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
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
import InboxPage from './pages/chat/InboxPage'
import ConversationPage from './pages/chat/ConversationPage'
import WriteReviewPage from './pages/reviews/WriteReviewPage'
import MyPurchasesPage from './pages/transactions/MyPurchasesPage'
import MySalesPage from './pages/transactions/MySalesPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<><Header /><LandingPage /></>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/home" element={<><Header /><HomePage /></>} />
            <Route path="/search" element={<><Header /><SearchResultsPage /></>} />
            <Route path="/listings/:id" element={<><Header /><ListingDetailPage /></>} />
            <Route path="/create-listing" element={<ProtectedRoute><Header /><CreateListingPage /></ProtectedRoute>} />
            <Route path="/listings/:id/edit" element={<ProtectedRoute><Header /><EditListingPage /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><Header /><MyListingsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Header /><InboxPage /></ProtectedRoute>} />
            <Route path="/messages/:conversationId" element={<ProtectedRoute><Header /><ConversationPage /></ProtectedRoute>} />
            <Route path="/my-purchases" element={<ProtectedRoute><Header /><MyPurchasesPage /></ProtectedRoute>} />
            <Route path="/my-sales" element={<ProtectedRoute><Header /><MySalesPage /></ProtectedRoute>} />
            <Route path="/reviews/write/:listingId" element={<ProtectedRoute><Header /><WriteReviewPage /></ProtectedRoute>} />
            <Route path="/users/:id" element={<><Header /><ProfilePage /></>} />
            <Route path="/settings" element={<ProtectedRoute><Header /><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<><Header /><NotFoundPage /></>} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App
