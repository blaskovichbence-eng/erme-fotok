import { useState } from 'react'
import { Camera, Upload, CheckCircle, Loader } from 'lucide-react'
import { CoinData } from '../types/coin'
import { processImage, createImagePreview } from '../utils/imageProcessor'
import { createFileName, getFolderName } from '../utils/fileNaming'
import { uploadImageToDrive } from '../services/googleDrive'
import { updateCoinImages } from '../services/googleSheets'

interface PhotoCaptureProps {
  coin: CoinData
  onComplete: () => void
  onBack: () => void
}

interface ImageData {
  file: File
  preview: string
  processed?: Blob
}

export default function PhotoCapture({ coin, onComplete, onBack }: PhotoCaptureProps) {
  const [frontImage, setFrontImage] = useState<ImageData | null>(null)
  const [backImage, setBackImage] = useState<ImageData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const hasExistingFront = !!coin.elolap_link
  const hasExistingBack = !!coin.hatlap_link

  const handleFileSelect = async (file: File, side: 'front' | 'back') => {
    try {
      const preview = await createImagePreview(file)
      const imageData: ImageData = { file, preview }

      if (side === 'front') {
        setFrontImage(imageData)
      } else {
        setBackImage(imageData)
      }
    } catch (err) {
      setError('Kép betöltési hiba')
    }
  }

  const handleUpload = async () => {
    if (!frontImage && !backImage) {
      setError('Válassz ki legalább egy képet a feltöltéshez')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress('Képek feldolgozása...')

    try {
      const folderName = getFolderName(coin.sorszam)
      let frontLink = coin.elolap_link
      let frontId = coin.elolap_id
      let backLink = coin.hatlap_link
      let backId = coin.hatlap_id

      if (frontImage) {
        setUploadProgress('Előlap feldolgozása...')
        const processedFront = await processImage(frontImage.file)
        const frontFileName = createFileName(coin.sorszam, coin.leiras, 'A')

        setUploadProgress('Előlap feltöltése Drive-ba...')
        const frontResult = await uploadImageToDrive(processedFront, frontFileName, folderName)
        frontLink = frontResult.webViewLink
        frontId = frontResult.fileId
      }

      if (backImage) {
        setUploadProgress('Hátlap feldolgozása...')
        const processedBack = await processImage(backImage.file)
        const backFileName = createFileName(coin.sorszam, coin.leiras, 'B')

        setUploadProgress('Hátlap feltöltése Drive-ba...')
        const backResult = await uploadImageToDrive(processedBack, backFileName, folderName)
        backLink = backResult.webViewLink
        backId = backResult.fileId
      }

      setUploadProgress('Sheet frissítése...')
      const success = await updateCoinImages(
        coin.sorszam,
        frontLink,
        frontId,
        backLink,
        backId
      )

      if (!success) {
        throw new Error('Sheet frissítési hiba')
      }

      setUploadProgress('Sikeres feltöltés! ✓')
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Feltöltési hiba történt')
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          Fotózás - {coin.sorszam}
        </h2>
        <p className="text-base sm:text-base text-gray-700 font-medium">{coin.leiras}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6">
        {
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center mb-4">
              <Camera size={56} className="mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Előlap (A) {hasExistingFront && '(Frissítés)'}</h3>
              <p className="text-sm text-gray-600">{hasExistingFront ? 'Új kép feltöltése' : 'Kattints a képfeltöltéshez'}</p>
            </div>

            {frontImage ? (
              <div>
                <img
                  src={frontImage.preview}
                  alt="Előlap előnézet"
                  className="w-full h-64 sm:h-48 object-contain mb-3 rounded bg-gray-50"
                />
                <button
                  onClick={() => setFrontImage(null)}
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 text-base touch-manipulation"
                >
                  Másik kép
                </button>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file, 'front')
                  }}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="cursor-pointer px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-center transition-colors touch-manipulation">
                  <Upload size={24} className="inline mr-2" />
                  <span className="text-lg">Kép kiválasztása</span>
                </div>
              </label>
            )}
          </div>
        }

        {
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center mb-4">
              <Camera size={56} className="mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">Hátlap (B) {hasExistingBack && '(Frissítés)'}</h3>
              <p className="text-sm text-gray-600">{hasExistingBack ? 'Új kép feltöltése' : 'Kattints a képfeltöltéshez'}</p>
            </div>

            {backImage ? (
              <div>
                <img
                  src={backImage.preview}
                  alt="Hátlap előnézet"
                  className="w-full h-64 sm:h-48 object-contain mb-3 rounded bg-gray-50"
                />
                <button
                  onClick={() => setBackImage(null)}
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 text-base touch-manipulation"
                >
                  Másik kép
                </button>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file, 'back')
                  }}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="cursor-pointer px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-center transition-colors touch-manipulation">
                  <Upload size={24} className="inline mr-2" />
                  <span className="text-lg">Kép kiválasztása</span>
                </div>
              </label>
            )}
          </div>
        }
      </div>

      {uploading && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader size={24} className="animate-spin text-blue-600 flex-shrink-0" />
            <p className="text-blue-800 font-semibold text-base">{uploadProgress}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBack}
          disabled={uploading}
          className="w-full sm:flex-1 px-6 py-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg touch-manipulation"
        >
          ← Vissza
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || (!frontImage && !backImage)}
          className="w-full sm:flex-1 px-6 py-4 sm:py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg touch-manipulation"
        >
          {uploading ? (
            <>
              <Loader size={24} className="animate-spin" />
              Feltöltés...
            </>
          ) : (
            <>
              <CheckCircle size={24} />
              Feltöltés és mentés
            </>
          )}
        </button>
      </div>
    </div>
  )
}
