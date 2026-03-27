import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { AxiosError } from 'axios'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('El nombre de usuario solo puede contener letras, números y guiones bajos.')
      return
    }

    setLoading(true)

    try {
      await register(email, password, username)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err instanceof AxiosError && err.response?.status === 409) {
        setError('El correo o nombre de usuario ya está en uso.')
      } else {
        setError('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-warm-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.svg" alt="Papaya" className="h-10 mx-auto" />
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-warm-200 p-8">
          <h1 className="text-2xl font-bold text-warm-900 text-center mb-6">Crear cuenta</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-500/10 text-error-500 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />

            <Input
              label="Nombre de usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mi_usuario"
              required
              autoComplete="username"
              helperText="Letras, números y guiones bajos"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              helperText="Mínimo 8 caracteres"
            />

            <Button type="submit" loading={loading} className="w-full">
              Registrarse
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-warm-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-papaya-500 hover:text-papaya-600 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
