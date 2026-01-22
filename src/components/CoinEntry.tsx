import { useState } from 'react'
import { Search, CheckCircle, XCircle } from 'lucide-react'
import { CoinData } from '../types/coin'
import { getCoinBySerialNumber } from '../services/googleSheets'

interface CoinEntryProps {
  onCoinSelected: (coin: CoinData) => void
}

export default function CoinEntry({ onCoinSelected }: CoinEntryProps) {
  const [serialNumber, setSerialNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const [confirmed, setConfirmed] = useState(false)

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
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Érme keresése sorszám alapján
      </h2>

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
        <div className="border-2 border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Sorszám</p>
              <p className="text-xl sm:text-lg font-bold text-gray-800">{coinData.sorszam}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Tervező</p>
              <p className="text-xl sm:text-lg font-bold text-gray-800">{coinData.tervezo}</p>
            </div>
            <div className="col-span-1 sm:col-span-2 bg-blue-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Leírás</p>
              <p className="text-lg sm:text-lg font-bold text-gray-800">{coinData.leiras}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Méret</p>
              <p className="text-xl sm:text-lg font-bold text-gray-800">{coinData.meret || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Anyag</p>
              <p className="text-xl sm:text-lg font-bold text-gray-800">{coinData.anyag || '-'}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Képek állapota</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 p-2 bg-white rounded">
                {coinData.elolap_link ? (
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle size={24} className="text-red-600 flex-shrink-0" />
                )}
                <span className="text-base font-medium">
                  Előlap (A) {coinData.elolap_link ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded">
                {coinData.hatlap_link ? (
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle size={24} className="text-red-600 flex-shrink-0" />
                )}
                <span className="text-base font-medium">
                  Hátlap (B) {coinData.hatlap_link ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-6 h-6 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              />
              <span className="text-base sm:text-base text-gray-800 font-semibold leading-relaxed">
                Megerősítem, hogy ez a megfelelő érme
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setCoinData(null)
                setSerialNumber('')
                setConfirmed(false)
              }}
              className="w-full sm:flex-1 px-6 py-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors text-lg touch-manipulation"
            >
              ← Másik érem
            </button>
            <button
              onClick={handleConfirm}
              disabled={!confirmed}
              className="w-full sm:flex-1 px-6 py-4 sm:py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg touch-manipulation"
            >
              Fotózás →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
