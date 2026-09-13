import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { authAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Camera, X, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

// ── Crop pixel helper ─────────────────────────────────────────────────────────
async function getCroppedBlob(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0,
    croppedAreaPixels.width, croppedAreaPixels.height,
  )
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfilePicUpload({ accentColor = 'emerald' }) {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageSrc(reader.result)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCropDialogOpen(true)
    })
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setUploading(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const fd = new FormData()
      fd.append('profilePic', blob, 'profile.jpg')
      const res = await authAPI.uploadProfilePic(fd)
      updateUser({ profilePicUrl: res.data.user.profilePicUrl, profilePicPublicId: res.data.user.profilePicPublicId })
      toast({ title: 'Profile picture updated' })
      setCropDialogOpen(false)
      setImageSrc(null)
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.response?.data?.message || 'Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (e) => {
    e.stopPropagation()
    setRemoving(true)
    try {
      await authAPI.deleteProfilePic()
      updateUser({ profilePicUrl: null, profilePicPublicId: null })
      toast({ title: 'Profile picture removed' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to remove', description: err.response?.data?.message || 'Please try again.' })
    } finally {
      setRemoving(false)
    }
  }

  const initial = (user?.teacher?.name || user?.student?.name || user?.admin?.name || user?.email || 'U')
    .charAt(0).toUpperCase()

  return (
    <>
      {/* Clickable avatar — the only control needed */}
      <div className="relative flex-shrink-0 group w-fit">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          title="Change profile photo"
        >
          {user?.profilePicUrl ? (
            <img
              src={user.profilePicUrl}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br from-${accentColor}-400 to-${accentColor}-500 flex items-center justify-center text-3xl font-bold text-white`}>
              {initial}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {uploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5 text-white" />
                <span className="text-[10px] font-semibold text-white/90 leading-none">
                  {user?.profilePicUrl ? 'Change' : 'Upload'}
                </span>
              </>
            )}
          </div>
        </button>

        {/* Remove button — top-right corner, only when pic exists */}
        {user?.profilePicUrl && !removing && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white flex items-center justify-center shadow transition-colors"
            title="Remove photo"
          >
            <X className="h-2.5 w-2.5 text-white" />
          </button>
        )}
        {removing && (
          <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-100 border-2 border-white flex items-center justify-center shadow">
            <Loader2 className="h-2.5 w-2.5 text-red-500 animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Crop dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(o) => { if (!uploading) { setCropDialogOpen(o); if (!o) setImageSrc(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
          </DialogHeader>

          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ height: 280 }}>
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="flex items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 accent-emerald-500 cursor-pointer"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setCropDialogOpen(false); setImageSrc(null) }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? 'Uploading…' : 'Save photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
