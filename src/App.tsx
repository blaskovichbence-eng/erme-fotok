import { useState, useEffect } from 'react'
import { Coins, LogIn, LogOut, User } from 'lucide-react'
import { initGoogleAuth, signIn, signOut, getUserInfo, restoreSession, getUserFromStorage, saveUserToStorage } from './services/googleAuth'
import { GoogleUser } from './types/google'
import { CoinData } from './types/coin'
import CoinEntry from './components/CoinEntry'
import PhotoCapture from './components/PhotoCapture'

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initGoogleAuth()
        
        const storedUser = getUserFromStorage()
        if (storedUser) {
          console.log('Found stored user, attempting to restore session...')
          const sessionRestored = await restoreSession()
          
          if (sessionRestored) {
            setUser(storedUser)
            console.log('Session restored successfully')
          } else {
            console.log('Session restore failed, user needs to sign in again')
          }
        }
        
        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }
    
    initializeApp()
  }, [])

  const handleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signIn()
      const userInfo = await getUserInfo()
      if (userInfo) {
        setUser(userInfo)
        saveUserToStorage(userInfo)
        console.log('User signed in and saved to storage')
      }
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Bejelentkezési hiba')
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4 sm:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Coins size={28} className="sm:w-8 sm:h-8 flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold leading-tight">Érmegyűjtemény<br className="sm:hidden" /> Fotózó</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2">
                {user.picture && (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm">{user.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors touch-manipulation"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Kijelentkezés</span>
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Betöltés...</p>
          </div>
        ) : !user ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
            <User size={72} className="mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl sm:text-xl font-bold text-gray-800 mb-4">
              Bejelentkezés szükséges
            </h2>
            <p className="text-base sm:text-base text-gray-600 mb-6">
              A folytatáshoz jelentkezz be Google fiókkal
            </p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-800 text-base font-medium">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 sm:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg touch-manipulation"
            >
              <LogIn size={24} />
              Bejelentkezés Google-lal
            </button>
            
            <div className="mt-8 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold text-base">
                ✅ React projekt működik
              </p>
              <p className="text-green-600 text-sm mt-1">
                Google OAuth2 betöltve
              </p>
            </div>
          </div>
        ) : selectedCoin ? (
          <PhotoCapture
            coin={selectedCoin}
            onComplete={() => {
              const nextSerial = selectedCoin.sorszam + 1
              setSelectedCoin(null)
              setTimeout(() => {
                const input = document.querySelector('input[type="number"]') as HTMLInputElement
                if (input) {
                  input.value = String(nextSerial)
                  input.focus()
                }
              }, 100)
            }}
            onBack={() => setSelectedCoin(null)}
          />
        ) : (
          <CoinEntry onCoinSelected={(coin) => setSelectedCoin(coin)} />
        )}
      </main>
    </div>
  )
}

export default App
