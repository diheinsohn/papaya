import { useRef, useState } from 'react'

export interface ImageItem {
  type: 'file'
  file: File
  preview: string
}

export interface ExistingImageItem {
  type: 'existing'
  id: string
  url: string
  thumbnail_url: string
}

export type UploadImage = ImageItem | ExistingImageItem

interface ImageUploaderProps {
  images: UploadImage[]
  onChange: (images: UploadImage[]) => void
  maxImages?: number
  maxSizeMB?: number
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const validateFiles = (files: File[]): File[] => {
    setError('')
    const remaining = maxImages - images.length
    if (remaining <= 0) {
      setError(`Máximo ${maxImages} imágenes permitidas.`)
      return []
    }

    const valid: File[] = []
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Solo se permiten imágenes JPG, PNG o WebP.')
        continue
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Cada imagen debe pesar menos de ${maxSizeMB}MB.`)
        continue
      }
      if (valid.length < remaining) {
        valid.push(file)
      }
    }
    return valid
  }

  const addFiles = (files: File[]) => {
    const valid = validateFiles(files)
    if (valid.length === 0) return

    const newImages: ImageItem[] = valid.map((file) => ({
      type: 'file',
      file,
      preview: URL.createObjectURL(file),
    }))
    onChange([...images, ...newImages])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleRemove = (index: number) => {
    const img = images[index]
    if (img.type === 'file') {
      URL.revokeObjectURL(img.preview)
    }
    onChange(images.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const next = [...images]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return
    const next = [...images]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  const getPreviewUrl = (img: UploadImage) =>
    img.type === 'file' ? img.preview : img.thumbnail_url || img.url

  return (
    <div>
      <p className="text-sm text-warm-600 mb-2">
        {images.length}/{maxImages} imágenes
      </p>

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-papaya-500 bg-papaya-50'
              : 'border-warm-300 hover:border-papaya-400 hover:bg-warm-50'
          }`}
        >
          <svg className="w-8 h-8 mx-auto text-warm-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-warm-600">Arrastra imágenes o haz clic para seleccionar</p>
          <p className="text-xs text-warm-400 mt-1">JPG, PNG o WebP. Max {maxSizeMB}MB cada una.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-error-500">{error}</p>}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-warm-200">
              <img
                src={getPreviewUrl(img)}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-papaya-500 text-white rounded">
                  Principal
                </span>
              )}
              {/* Controls overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-warm-700 hover:bg-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-warm-700 hover:bg-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="w-7 h-7 rounded-full bg-error-500/90 flex items-center justify-center text-white hover:bg-error-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
