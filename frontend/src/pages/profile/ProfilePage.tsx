import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usersApi } from '../../api/auth'
import { listingsApi } from '../../api/listings'
import type { User } from '../../types/user'
import type { Listing } from '../../types/listing'
import ListingGrid from '../../components/listings/ListingGrid'
import UserReputation from '../../components/reviews/UserReputation'
import ReviewList from '../../components/reviews/ReviewList'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchUser = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await usersApi.getUser(id)
        setUser(data)
      } catch {
        setError('No se pudo cargar el perfil del usuario.')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()

    setListingsLoading(true)
    listingsApi.getUserListings(id, { per_page: 12 })
      .then(({ data }) => setListings(data.items))
      .catch(() => {})
      .finally(() => setListingsLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-warm-200" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 bg-warm-200 rounded" />
              <div className="h-4 w-32 bg-warm-200 rounded" />
            </div>
          </div>
          <div className="h-20 bg-warm-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-error-500">{error || 'Usuario no encontrado.'}</p>
      </div>
    )
  }

  const initial = user.display_name?.[0] || user.username[0]
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long' })
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-md border border-warm-200 p-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || user.username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-papaya-100 text-papaya-600 flex items-center justify-center text-3xl font-bold uppercase shrink-0">
              {initial}
            </div>
          )}

          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-warm-900">
              {user.display_name || user.username}
            </h1>
            <p className="text-warm-500">@{user.username}</p>
            <div className="mt-1">
              <UserReputation avgRating={user.avg_rating} reviewCount={user.review_count} />
            </div>
            {user.location_name && (
              <p className="text-sm text-warm-500 mt-1">{user.location_name}</p>
            )}
            {memberSince && (
              <p className="text-sm text-warm-400 mt-1">Miembro desde {memberSince}</p>
            )}
            {user.is_verified && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-success-500/10 text-success-500 rounded-full">
                Verificado
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-warm-700 mb-2">Acerca de</h2>
            <p className="text-warm-600 whitespace-pre-line">{user.bio}</p>
          </div>
        )}

        {/* User listings */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-warm-700 mb-3">Publicaciones</h2>
            <ListingGrid
              listings={listings}
              loading={listingsLoading}
              emptyMessage="Este usuario aún no tiene publicaciones."
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-warm-700 mb-3">Reseñas</h2>
            <ReviewList userId={id!} />
          </div>
        </div>
      </div>
    </div>
  )
}
