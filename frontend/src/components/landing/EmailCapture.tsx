import { useState, type FormEvent } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import apiClient from '../../api/client'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('El correo es obligatorio')
      return
    }
    if (!validateEmail(email)) {
      setError('Ingresa un correo válido')
      return
    }

    setStatus('loading')
    try {
      await apiClient.post('/leads', { email })
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Hubo un problema. Intenta de nuevo.')
    }
  }

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-papaya-500 to-papaya-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Sé el primero en enterarte
          </h2>
          <p className="mt-4 text-lg text-papaya-100">
            Déjanos tu correo y te avisaremos cuando lancemos. Sin spam,
            lo prometemos.
          </p>

          {status === 'success' ? (
            <div className="mt-8 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              ¡Listo! Te avisaremos cuando estemos en línea.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row items-start gap-3 max-w-md mx-auto"
            >
              <div className="w-full">
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  error={error}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                loading={status === 'loading'}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto shrink-0"
              >
                Suscribirse
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
