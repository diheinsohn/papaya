import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const userInitial = user?.display_name?.[0] || user?.username?.[0] || '?'

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-bold text-papaya-500">Papaya</span>
          </Link>

          {/* Search placeholder - desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="w-full h-10 rounded-lg bg-warm-100 border border-warm-200 flex items-center px-4 text-warm-400 text-sm">
              Buscar productos...
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <Link to="/create-listing">
                <Button size="sm">Publicar</Button>
              </Link>
            )}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-papaya-100 text-papaya-600 flex items-center justify-center font-semibold text-sm uppercase">
                      {userInitial}
                    </div>
                  )}
                  <svg className="w-4 h-4 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-warm-200 py-1">
                    <Link
                      to={`/users/${user?.id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      to="/my-listings"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                    >
                      Mis articulos
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50"
                    >
                      Configuracion
                    </Link>
                    <hr className="my-1 border-warm-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-error-500 hover:bg-warm-50"
                    >
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Iniciar sesion</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-warm-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 text-warm-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-warm-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile search */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-2">
            <div className="w-full h-10 rounded-lg bg-warm-100 border border-warm-200 flex items-center px-4 text-warm-400 text-sm">
              Buscar productos...
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-warm-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-warm-200">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-papaya-100 text-papaya-600 flex items-center justify-center font-semibold uppercase">
                      {userInitial}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-warm-800">{user?.display_name || user?.username}</p>
                    <p className="text-sm text-warm-500">@{user?.username}</p>
                  </div>
                </div>
                <Link
                  to={`/users/${user?.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-warm-700"
                >
                  Mi perfil
                </Link>
                <Link
                  to="/create-listing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-papaya-500 font-medium"
                >
                  Publicar
                </Link>
                <Link
                  to="/my-listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-warm-700"
                >
                  Mis articulos
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-warm-700"
                >
                  Configuracion
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-error-500"
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Iniciar sesion</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
