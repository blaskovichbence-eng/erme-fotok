import { useState, useEffect } from 'react'
import { Camera, Loader, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { CoinData } from '../types/coin'
import { getCoinsWithoutImages } from '../services/googleSheets'

interface CoinListProps {
  onCoinSelected: (coin: CoinData) => void
  refreshTrigger?: number
  onCoinsLoaded?: (coins: CoinData[]) => void
}

export default function CoinList({ onCoinSelected, refreshTrigger, onCoinsLoaded }: CoinListProps) {
  const [coins, setCoins] = useState<CoinData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const itemsPerPage = 10

  const loadCoins = async (isInitial: boolean = false) => {
    if (isInitial) {
      setInitialLoading(true)
    } else {
      setPageLoading(true)
    }
    setError(null)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const data = await getCoinsWithoutImages(itemsPerPage, offset)
      setCoins(data.coins)
      setTotalCount(data.total)
      if (onCoinsLoaded) {
        onCoinsLoaded(data.coins)
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt az adatok lekérdezése során')
    } finally {
      setInitialLoading(false)
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadCoins(true)
  }, [refreshTrigger])
  
  useEffect(() => {
    if (!initialLoading) {
      loadCoins(false)
    }
  }, [currentPage])

  if (initialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Loader className="animate-spin mx-auto mb-4" size={32} />
        <p className="text-gray-600">Érmék betöltése...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (coins.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-green-600 text-lg font-semibold">
          🎉 Minden érmének van képe!
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  
  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="sticky top-0 z-10 p-4 sm:p-6 border-b border-gray-200 bg-blue-50 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          📸 Befotózandó érmék
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {totalCount} érméhez hiányzik még a fénykép
        </p>
      </div>

      <div className="divide-y divide-gray-200 relative">
        {pageLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <Loader className="animate-spin" size={32} />
          </div>
        )}
        {coins.map((coin) => (
          <button
            key={coin.sorszam}
            onClick={() => onCoinSelected(coin)}
            className="w-full p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">
                  #{coin.sorszam}
                </span>
                <span className="text-sm text-gray-500">
                  {coin.tervezo}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {coin.leiras}
              </p>
            </div>

            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera size={24} className="text-blue-600" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {coins.length > 0 && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">
              {currentPage} / {totalPages} oldal
            </p>
            <p className="text-xs text-gray-500">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount} érme
            </p>
          </div>
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Első oldal"
            >
              <ChevronsLeft size={18} />
            </button>
            
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Előző oldal"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Következő oldal"
            >
              <ChevronRight size={18} />
            </button>
            
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Utolsó oldal"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
