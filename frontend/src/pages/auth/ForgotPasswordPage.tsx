import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/auth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSubmitted(true)
    } catch {
      setError('Ocurrio un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-md border border-warm-200 p-8">
          <h1 className="text-2xl font-bold text-warm-900 text-center mb-2">Recuperar contrasena</h1>
          <p className="text-sm text-warm-500 text-center mb-6">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.
          </p>

          {submitted ? (
            <div className="text-center">
              <div className="mb-4 p-4 rounded-lg bg-success-500/10 text-success-500 text-sm">
                Si el correo existe en nuestro sistema, recibiras un enlace para restablecer tu contrasena.
              </div>
              <Link to="/login" className="text-papaya-500 hover:text-papaya-600 font-medium text-sm">
                Volver a iniciar sesion
              </Link>
            </div>
          ) : (
            <>
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

                <Button type="submit" loading={loading} className="w-full">
                  Enviar enlace
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-warm-600">
                <Link to="/login" className="text-papaya-500 hover:text-papaya-600 font-medium">
                  Volver a iniciar sesion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
