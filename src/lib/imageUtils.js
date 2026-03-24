import imageCompression from 'browser-image-compression'

/**
 * Compress an image file before uploading.
 * Max width: 1200px, max size: 500KB, quality: 0.8
 * Returns a compressed File object.
 */
export async function compressImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    return file
  }

  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    initialQuality: 0.8,
    useWebWorker: true,
    fileType: file.type,
  }

  try {
    const compressed = await imageCompression(file, options)
    // Preserve original filename
    return new File([compressed], file.name, { type: compressed.type })
  } catch (err) {
    console.error('Image compression failed, using original:', err)
    return file
  }
}
