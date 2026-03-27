import { useState, useEffect, FormEvent, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi } from '../../api/auth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import type { User } from '../../types/user'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [locationName, setLocationName] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await usersApi.getMe()
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
        setPhone(data.phone || '')
        setLocationName(data.location_name || '')
        setAvatarPreview(data.avatar_url || null)
      } catch {
        setError('No se pudo cargar tu perfil.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setSaving(true)

    try {
      const { data } = await usersApi.updateMe({
        display_name: displayName,
        bio,
        phone,
        location_name: locationName,
      })
      updateUser(data as User)
      setSuccessMsg('Perfil actualizado correctamente.')
    } catch {
      setError('No se pudo guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    setError('')
    setSuccessMsg('')

    try {
      const { data } = await usersApi.uploadAvatar(file)
      updateUser(data as User)
      setAvatarPreview(data.avatar_url)
      setSuccessMsg('Foto de perfil actualizada.')
    } catch {
      setError('No se pudo subir la imagen.')
      setAvatarPreview(user?.avatar_url || null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const userInitial = user?.display_name?.[0] || user?.username?.[0] || '?'

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-warm-200 rounded" />
          <div className="space-y-4">
            <div className="h-10 bg-warm-200 rounded" />
            <div className="h-10 bg-warm-200 rounded" />
            <div className="h-24 bg-warm-200 rounded" />
            <div className="h-10 bg-warm-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-md border border-warm-200 p-8">
        <h1 className="text-2xl font-bold text-warm-900 mb-8">Configuracion</h1>

        {/* Avatar section */}
        <div className="flex items-center gap-6 mb-8">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-papaya-100 text-papaya-600 flex items-center justify-center text-2xl font-bold uppercase shrink-0">
              {userInitial}
            </div>
          )}
          <div>
            <Button
              variant="outline"
              size="sm"
              loading={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              Cambiar foto
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-warm-400 mt-1">JPG, PNG. Maximo 5 MB.</p>
          </div>
        </div>

        {/* Feedback messages */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-success-500/10 text-success-500 text-sm text-center">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-500/10 text-error-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Profile form */}
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre para mostrar"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tu nombre"
          />

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-warm-700 mb-1.5">
              Biografia
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuentanos sobre ti..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-warm-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-papaya-500 focus:ring-papaya-500/30 placeholder:text-warm-400 resize-none"
            />
          </div>

          <Input
            label="Telefono"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56 9 1234 5678"
          />

          <Input
            label="Ubicacion"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Santiago, Chile"
          />

          <div className="pt-4">
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
