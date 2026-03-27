import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listingsApi, categoriesApi } from '../../api/listings'
import type { Category } from '../../types/listing'
import { CONDITION_LABELS } from '../../types/listing'
import ImageUploader, { type UploadImage, type ExistingImageItem, type ImageItem } from '../../components/listings/ImageUploader'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [images, setImages] = useState<UploadImage[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [condition, setCondition] = useState('')
  const [price, setPrice] = useState('')
  const currency = 'CLP'
  const [locationName, setLocationName] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      listingsApi.get(id),
      categoriesApi.getAll(),
    ])
      .then(([listingRes, catRes]) => {
        const l = listingRes.data
        setTitle(l.title)
        setDescription(l.description)
        setCategoryId(l.category_id)
        setCondition(l.condition)
        setPrice(l.price)
        setLocationName(l.location_name || '')
        setCategories(catRes.data.categories)

        const existingImages: ExistingImageItem[] = l.images
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({
            type: 'existing',
            id: img.id,
            url: img.url,
            thumbnail_url: img.thumbnail_url,
          }))
        setImages(existingImages)
      })
      .catch(() => setError('No se pudo cargar la publicacion.'))
      .finally(() => setPageLoading(false))
  }, [id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError('')

    if (!title.trim()) { setError('Ingresa un titulo.'); return }
    if (!categoryId) { setError('Selecciona una categoria.'); return }
    if (!condition) { setError('Selecciona la condicion.'); return }
    if (!price || Number(price) <= 0) { setError('Ingresa un precio valido.'); return }

    setLoading(true)
    try {
      // Update listing fields
      await listingsApi.update(id, {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        condition,
        price,
        currency,
        location_name: locationName.trim() || undefined,
      })

      // Reorder existing images
      const existingIds = images
        .filter((img): img is ExistingImageItem => img.type === 'existing')
        .map((img) => img.id)

      if (existingIds.length > 0) {
        await listingsApi.reorderImages(id, existingIds)
      }

      // Upload new images
      const newFiles = images
        .filter((img): img is ImageItem => img.type === 'file')

      if (newFiles.length > 0) {
        const formData = new FormData()
        newFiles.forEach((img) => formData.append('images[]', img.file))
        await listingsApi.addImages(id, formData)
      }

      navigate(`/listings/${id}`, { replace: true })
    } catch {
      setError('Ocurrio un error al actualizar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-warm-200 rounded w-1/3" />
        <div className="h-40 bg-warm-200 rounded-lg" />
        <div className="h-10 bg-warm-200 rounded" />
        <div className="h-24 bg-warm-200 rounded" />
        <div className="h-10 bg-warm-200 rounded" />
      </div>
    )
  }

  if (error && !title) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-warm-500 text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-warm-900 mb-6">Editar publicacion</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error-500/10 text-error-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-warm-700 mb-2">Imagenes</h2>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        <Input
          label="Titulo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: iPhone 14 Pro Max 256GB"
          required
          maxLength={120}
        />

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1.5">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu producto..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-warm-300 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none placeholder:text-warm-400 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1.5">
            Categoria <span className="text-error-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2.5 rounded-lg border border-warm-300 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none transition-colors bg-white"
          >
            <option value="">Selecciona una categoria</option>
            {categories.map((cat) =>
              cat.children && cat.children.length > 0 ? (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </optgroup>
              ) : (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-2">
            Condicion <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(CONDITION_LABELS).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-center justify-center px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-colors text-sm font-medium ${
                  condition === key
                    ? 'border-papaya-500 bg-papaya-50 text-papaya-700'
                    : 'border-warm-200 hover:border-warm-300 text-warm-600'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={key}
                  checked={condition === key}
                  onChange={(e) => setCondition(e.target.value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            label="Precio"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            required
            min="1"
            step="1"
            className="flex-1"
          />
          <div className="w-20 flex items-end">
            <span className="px-4 py-2.5 rounded-lg border border-warm-200 bg-warm-50 text-warm-600 font-medium">CLP</span>
          </div>
        </div>

        <Input
          label="Ubicacion"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Ej: Santiago, RM"
        />

        <Button type="submit" loading={loading} className="w-full">
          Guardar cambios
        </Button>
      </form>
    </div>
  )
}
