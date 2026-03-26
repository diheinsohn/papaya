import Button from '../ui/Button'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-papaya-50 via-white to-warm-100">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-papaya-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-papaya-100/40 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-warm-900 leading-tight">
            Compra y vende artículos de{' '}
            <span className="text-papaya-500">segunda mano</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-warm-600 max-w-2xl mx-auto leading-relaxed">
            Dale una segunda vida a lo que ya no usas. Encuentra lo que
            necesitas cerca de ti, con pagos seguros y de forma sustentable.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">
              Explorar artículos
            </Button>
            <Button variant="outline" size="lg">
              Publicar un artículo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
