import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { listingsApi, categoriesApi } from '../../api/listings'
import type { Category } from '../../types/listing'
import { CONDITION_LABELS } from '../../types/listing'
import ImageUploader, { type UploadImage, type ImageItem } from '../../components/listings/ImageUploader'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function CreateListingPage() {
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
  const [error, setError] = useState('')

  useEffect(() => {
    categoriesApi.getAll()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (images.length === 0) {
      setError('Agrega al menos una imagen.')
      return
    }
    if (!title.trim()) { setError('Ingresa un titulo.'); return }
    if (!categoryId) { setError('Selecciona una categoria.'); return }
    if (!condition) { setError('Selecciona la condicion.'); return }
    if (!price || Number(price) <= 0) { setError('Ingresa un precio valido.'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('category_id', String(categoryId))
      formData.append('condition', condition)
      formData.append('price', price)
      formData.append('currency', currency)
      if (locationName.trim()) formData.append('location_name', locationName.trim())

      images.forEach((img) => {
        if (img.type === 'file') {
          formData.append('images[]', (img as ImageItem).file)
        }
      })

      const { data } = await listingsApi.create(formData)
      navigate(`/listings/${data.id}`, { replace: true })
    } catch {
      setError('Ocurrio un error al crear la publicacion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-warm-900 mb-6">Crear publicacion</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error-500/10 text-error-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <section>
          <h2 className="text-sm font-semibold text-warm-700 mb-2">Imagenes</h2>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        {/* Title & Description */}
        <Input
          label="Titulo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: iPhone 14 Pro Max 256GB"
          required
          maxLength={120}
        />

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1.5">
            Descripcion
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu producto: estado, tiempo de uso, accesorios incluidos..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-warm-300 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none placeholder:text-warm-400 transition-colors resize-none"
          />
        </div>

        {/* Category */}
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

        {/* Condition */}
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

        {/* Price & Currency */}
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

        {/* Location */}
        <Input
          label="Ubicacion"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Ej: Santiago, RM"
        />

        <Button type="submit" loading={loading} className="w-full">
          Publicar
        </Button>
      </form>
    </div>
  )
}
