import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-papaya-500 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-warm-900 mb-2">Página no encontrada</h2>
        <p className="text-warm-500 mb-8">La página que buscas no existe o fue removida.</p>
        <Link to="/home">
          <Button size="lg">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  )
}
