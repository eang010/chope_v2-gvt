/** Normalize photos for Supabase upload (iOS HEIC, empty types, stale File handles). */

const MAX_EDGE_PX = 2048
const JPEG_QUALITY = 0.88

function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isHeicLike(file: File, type: string): boolean {
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name)
  )
}

function needsJpegConversion(file: File, type: string): boolean {
  if (isAppleMobile()) return true
  if (!type || type === 'application/octet-stream') return true
  if (isHeicLike(file, type)) return true
  return !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('JPEG export failed'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

async function rasterizeToJpeg(
  buffer: ArrayBuffer,
  mimeType: string,
  originalName: string
): Promise<File> {
  const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight, 1))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not available')
    ctx.drawImage(img, 0, 0, width, height)

    const jpegBlob = await canvasToJpegBlob(canvas)
    const base = originalName.replace(/\.[^.]+$/, '') || 'photo'
    return new File([jpegBlob], `${base}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Read and normalize a gallery/camera file for storage upload.
 * On iOS, always re-encode to JPEG so HEIC and short-lived File handles work reliably.
 */
export async function prepareListingImageFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  if (!buffer.byteLength) {
    throw new Error('Image file is empty')
  }

  const type = file.type || 'application/octet-stream'

  if (!needsJpegConversion(file, type)) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : 'jpg'
    return new File([buffer], `${base}.${ext}`, { type })
  }

  try {
    return await rasterizeToJpeg(buffer, type, file.name)
  } catch (error) {
    console.warn('Image rasterize failed, retrying as JPEG bytes:', error)
    return new File([buffer], 'photo.jpg', { type: 'image/jpeg' })
  }
}
