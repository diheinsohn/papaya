const linkGroups = [
  {
    title: 'Empresa',
    links: ['Acerca de', 'Blog', 'Empleos'],
  },
  {
    title: 'Legal',
    links: ['Términos', 'Privacidad', 'Cookies'],
  },
  {
    title: 'Soporte',
    links: ['Ayuda', 'Contacto', 'FAQ'],
  },
]

function SocialIcon({ d }: { d: string }) {
  return (
    <a
      href="#"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-warm-200 text-warm-600 hover:bg-papaya-100 hover:text-papaya-500 transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d={d} />
      </svg>
    </a>
  )
}

export default function Footer() {
  return (
    <footer className="bg-warm-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <span className="text-2xl font-bold text-papaya-500">Papaya</span>
            <p className="mt-3 text-warm-500 max-w-xs leading-relaxed text-sm">
              El marketplace de segunda mano donde comprar y vender es fácil,
              seguro y sustentable.
            </p>
            <div className="mt-5 flex gap-3">
              {/* X / Twitter */}
              <SocialIcon d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              {/* Instagram */}
              <SocialIcon d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              {/* Facebook */}
              <SocialIcon d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </div>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-warm-900 mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-warm-500 hover:text-papaya-500 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-warm-200 text-center text-sm text-warm-400">
          &copy; 2026 Papaya. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
