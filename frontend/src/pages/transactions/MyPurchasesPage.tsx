import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { transactionsApi, type TransactionItem } from '../../api/transactions'
import PriceDisplay from '../../components/listings/PriceDisplay'
import Button from '../../components/ui/Button'
import { timeAgo } from '../../utils/formatters'

export default function MyPurchasesPage() {
  const [items, setItems] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    transactionsApi.getMyPurchases()
      .then(({ data }) => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleConfirmReceipt = async (listingId: string) => {
    if (!window.confirm('¿Confirmas que recibiste el artículo?')) return
    setConfirmingId(listingId)
    try {
      await transactionsApi.confirmReceipt(listingId)
      setItems((prev) =>
        prev.map((item) =>
          item.listing.id === listingId
            ? { ...item, receipt_confirmed: true, listing: { ...item.listing, status: 'sold' } }
            : item
        )
      )
    } catch {
      // silently fail
    } finally {
      setConfirmingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-warm-900 mb-6">Mis compras</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-warm-200 p-4 flex gap-4">
              <div className="w-20 h-20 bg-warm-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-warm-200 rounded w-3/4" />
                <div className="h-3 bg-warm-200 rounded w-1/2" />
                <div className="h-3 bg-warm-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-warm-900 mb-6">Mis compras</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-warm-500 text-lg">No tienes compras aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.listing.id}
              className="bg-white rounded-xl border border-warm-200 p-4 flex flex-col sm:flex-row gap-4"
            >
              {/* Thumbnail */}
              <Link to={`/listings/${item.listing.id}`} className="shrink-0">
                {item.listing.images.length > 0 ? (
                  <img
                    src={item.listing.images[0].thumbnail_url}
                    alt={item.listing.title}
                    className="w-full sm:w-20 h-40 sm:h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full sm:w-20 h-40 sm:h-20 bg-warm-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <Link
                      to={`/listings/${item.listing.id}`}
                      className="font-semibold text-warm-900 hover:text-papaya-500 transition-colors line-clamp-1"
                    >
                      {item.listing.title}
                    </Link>
                    <p className="text-sm text-warm-500 mt-0.5">
                      Vendedor:{' '}
                      <Link to={`/users/${item.other_user.id}`} className="text-papaya-500 hover:underline">
                        {item.other_user.display_name || item.other_user.username}
                      </Link>
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">{timeAgo(item.accepted_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriceDisplay price={item.offer_amount} currency={item.listing.currency} className="text-base" />
                    {item.receipt_confirmed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">
                        Recibido
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Reservado
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {!item.receipt_confirmed && (
                    <Button
                      size="sm"
                      loading={confirmingId === item.listing.id}
                      onClick={() => handleConfirmReceipt(item.listing.id)}
                    >
                      Confirmar recepción
                    </Button>
                  )}
                  {item.receipt_confirmed && !item.has_reviewed && (
                    <Link to={`/reviews/write/${item.listing.id}`}>
                      <Button variant="outline" size="sm">Dejar reseña</Button>
                    </Link>
                  )}
                  {item.has_reviewed && (
                    <span className="text-sm text-success-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Reseña enviada
                    </span>
                  )}
                  <Link
                    to={`/messages/${item.conversation_id}`}
                    className="text-sm text-papaya-500 hover:underline"
                  >
                    Ver conversación
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
