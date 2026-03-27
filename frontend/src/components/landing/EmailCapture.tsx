import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function EmailCapture() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-papaya-500 to-papaya-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Comienza a comprar y vender hoy
          </h2>
          <p className="mt-4 text-lg text-papaya-100">
            Regístrate y sé parte de la comunidad. Publica gratis tus artículos
            y encuentra lo que necesitas cerca de ti.
          </p>

          <div className="mt-8">
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Crea tu cuenta gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
