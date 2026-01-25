import { useState } from 'react'
import { Camera, Upload, CheckCircle } from 'lucide-react'
import { CoinData } from '../types/coin'
import { createImagePreview } from '../utils/imageProcessor'
import { uploadQueue } from '../services/uploadQueue'

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

  const handleUpload = () => {
    if (!frontImage && !backImage) {
      setError('Válassz ki legalább egy képet a feltöltéshez')
      return
    }

    uploadQueue.addTask(
      coin,
      frontImage?.file,
      backImage?.file
    )

    onComplete()
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200">
      <div className="sticky top-0 z-10 bg-blue-600 text-white p-3 rounded-t-lg shadow-md">
        <p className="text-lg font-bold">Érme #{coin.sorszam}</p>
        <p className="text-xs mt-1 opacity-90">{coin.leiras}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">Előlap (A) {hasExistingFront && '(Frissítés)'}</h3>
            <Camera size={20} className="text-gray-400" />
          </div>

          {frontImage ? (
            <div>
              <img
                src={frontImage.preview}
                alt="Előlap előnézet"
                className="w-full h-32 object-contain mb-2 rounded bg-white"
              />
              <button
                onClick={() => setFrontImage(null)}
                className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-sm"
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
                className="hidden"
              />
              <div className="cursor-pointer px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-center text-sm">
                <Upload size={18} className="inline mr-2" />
                Kép kiválasztása
              </div>
            </label>
          )}
        </div>

        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">Hátlap (B) {hasExistingBack && '(Frissítés)'}</h3>
            <Camera size={20} className="text-gray-400" />
          </div>

          {backImage ? (
            <div>
              <img
                src={backImage.preview}
                alt="Hátlap előnézet"
                className="w-full h-32 object-contain mb-2 rounded bg-white"
              />
              <button
                onClick={() => setBackImage(null)}
                className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded text-sm"
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
                className="hidden"
              />
              <div className="cursor-pointer px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-center text-sm">
                <Upload size={18} className="inline mr-2" />
                Kép kiválasztása
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-sm"
        >
          ← Vissza
        </button>
        <button
          onClick={handleUpload}
          disabled={!frontImage && !backImage}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          <CheckCircle size={18} />
          Hozzáadás
        </button>
      </div>
    </div>
  )
}
