import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { AxiosError } from 'axios'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const returnTo = (location.state as { from?: string })?.from || '/home'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(returnTo, { replace: true })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError('Correo o contrasena incorrectos.')
      } else {
        setError('Ocurrio un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-warm-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-papaya-500">Papaya</Link>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-warm-200 p-8">
          <h1 className="text-2xl font-bold text-warm-900 text-center mb-6">Iniciar sesión</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-500/10 text-error-500 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electronico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />

            <Input
              label="Contrasena"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contrasena"
              required
              autoComplete="current-password"
            />

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-papaya-500 hover:text-papaya-600">
                ¿Olvidaste tu contrasena?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Iniciar sesion
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-warm-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-papaya-500 hover:text-papaya-600 font-medium">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
