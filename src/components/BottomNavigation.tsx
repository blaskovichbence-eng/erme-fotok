import { Search, List } from 'lucide-react'

interface BottomNavigationProps {
  activeView: 'search' | 'list'
  onViewChange: (view: 'search' | 'list') => void
}

export default function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-40">
      <div className="max-w-4xl mx-auto flex">
        <button
          onClick={() => onViewChange('list')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeView === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <List size={24} />
          <span className="text-xs font-semibold">Lista</span>
        </button>

        <button
          onClick={() => onViewChange('search')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeView === 'search'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Search size={24} />
          <span className="text-xs font-semibold">Keresés</span>
        </button>
      </div>
    </div>
  )
}
