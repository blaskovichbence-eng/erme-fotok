import imageCompression from 'browser-image-compression'

const MAX_SIZE_MB = 1

export const processImage = async (file: File): Promise<Blob> => {
  try {
    console.log('Processing image:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB')

    const options = {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
    }

    const compressedFile = await imageCompression(file, options)
    console.log('Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')

    return compressedFile
  } catch (error) {
    console.error('Error processing image:', error)
    throw new Error('Képfeldolgozási hiba')
  }
}

export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
