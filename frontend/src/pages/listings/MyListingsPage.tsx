import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Listing } from '../../types/listing'
import { listingsApi } from '../../api/listings'
import ListingGrid from '../../components/listings/ListingGrid'
import Button from '../../components/ui/Button'

export default function MyListingsPage() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchListings = (p: number) => {
    setLoading(true)
    listingsApi.getMyListings({ page: p, per_page: 24 })
      .then(({ data }) => {
        setListings(data.items)
        setTotalPages(data.pages)
        setPage(data.page)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchListings(1)
  }, [])

  const handleEdit = (id: string) => {
    navigate(`/listings/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta publicacion?')) return
    try {
      await listingsApi.delete(id)
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch {
      // silently fail
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-warm-900">Mis publicaciones</h1>
        <Link to="/create-listing">
          <Button size="sm">Crear publicacion</Button>
        </Link>
      </div>

      <ListingGrid
        listings={listings}
        loading={loading}
        showActions
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aun no tienes publicaciones. ¡Crea tu primera!"
      />

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => fetchListings(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-warm-300 text-sm text-warm-600 hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-warm-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => fetchListings(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-warm-300 text-sm text-warm-600 hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
