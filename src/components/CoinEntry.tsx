import { useState } from 'react'
import { Search, CheckCircle, XCircle } from 'lucide-react'
import { CoinData } from '../types/coin'
import { getCoinBySerialNumber } from '../services/googleSheets'

interface CoinEntryProps {
  onCoinSelected: (coin: CoinData) => void
  initialSerialNumber?: number
  coin?: CoinData
  autoConfirm?: boolean
  onBack?: () => void
}

export default function CoinEntry({ onCoinSelected, initialSerialNumber, coin, autoConfirm = false, onBack }: CoinEntryProps) {
  const [serialNumber, setSerialNumber] = useState(initialSerialNumber ? String(initialSerialNumber) : (coin ? String(coin.sorszam) : ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coinData, setCoinData] = useState<CoinData | null>(coin || null)
  const [confirmed, setConfirmed] = useState(autoConfirm)

  const handleSearch = async () => {
    const num = parseInt(serialNumber)
    if (isNaN(num) || num <= 0) {
      setError('Érvénytelen sorszám')
      return
    }

    setLoading(true)
    setError(null)
    setCoinData(null)
    setConfirmed(false)

    try {
      const data = await getCoinBySerialNumber(num)
      if (data) {
        setCoinData(data)
      } else {
        setError('Nincs ilyen sorszámú érme a rendszerben')
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt az adatok lekérdezése során')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (coinData && confirmed) {
      onCoinSelected(coinData)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {!coin && (
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Érme keresése sorszám alapján
        </h2>
      )}

      {!coin && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Sorszám (pl. 4086)"
          className="flex-1 px-4 py-4 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl sm:text-lg font-medium"
          disabled={loading}
          autoFocus
        />
        <button
          onClick={handleSearch}
          disabled={loading || !serialNumber}
          className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg touch-manipulation"
        >
          <Search size={24} />
          Keresés
        </button>
      </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Betöltés...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {coinData && !loading && (
        <div className="border-2 border-gray-200 rounded-lg">
          <div className="sticky top-0 z-10 bg-blue-600 text-white p-3 rounded-t-lg shadow-md">
            <p className="text-lg font-bold">Érme #{coinData.sorszam}</p>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex items-baseline gap-2 border-b border-gray-200 pb-2">
              <span className="text-xs text-gray-500 w-20">Tervező:</span>
              <span className="text-sm font-semibold text-gray-800">{coinData.tervezo}</span>
            </div>
            
            <div className="flex items-baseline gap-2 border-b border-gray-200 pb-2">
              <span className="text-xs text-gray-500 w-20">Leírás:</span>
              <span className="text-sm font-semibold text-gray-800">{coinData.leiras}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-500">Méret (mm):</span>
                <span className="text-sm font-semibold text-gray-800">{coinData.meret || '-'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-500">Anyag:</span>
                <span className="text-sm font-semibold text-gray-800">{coinData.anyag || '-'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Képek állapota</p>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                {coinData.elolap_link ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <XCircle size={16} className="text-red-600" />
                )}
                <span className="text-sm font-medium">Előlap</span>
              </div>
              <div className="flex items-center gap-1">
                {coinData.hatlap_link ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <XCircle size={16} className="text-red-600" />
                )}
                <span className="text-sm font-medium">Hátlap</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-800 font-medium">
                Megerősítem, hogy ez a megfelelő érme
              </span>
            </label>
          </div>

          <div className="flex gap-2 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              onClick={() => {
                if (onBack) {
                  onBack()
                } else {
                  setCoinData(null)
                  setSerialNumber('')
                  setConfirmed(false)
                }              }}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors text-sm"
            >
              ← {onBack ? 'Vissza' : 'Másik'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!confirmed}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Fotózás →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
