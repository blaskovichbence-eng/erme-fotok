import { GoogleUser, GoogleAuthResponse } from '../types/google'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'

let gapiInited = false
let gisInited = false
let tokenClient: any = null
let accessToken: string | null = null

const TOKEN_STORAGE_KEY = 'google_access_token'
const TOKEN_EXPIRY_KEY = 'google_token_expiry'
const USER_STORAGE_KEY = 'google_user_info'

export const initGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'))
      return
    }

    console.log('Initializing Google Auth...')
    console.log('Client ID:', CLIENT_ID)
    console.log('API Key:', API_KEY ? 'Set' : 'Not set')

    if (!CLIENT_ID || CLIENT_ID === 'undefined') {
      reject(new Error('Google Client ID not configured'))
      return
    }

    if (!API_KEY || API_KEY === 'undefined') {
      reject(new Error('Google API Key not configured'))
      return
    }

    gapiInited = true
    console.log('Skipping gapi client - using direct REST API calls')

    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.onload = () => {
      console.log('gis script loaded')
      
      const waitForGoogle = () => {
        if (window.google?.accounts?.oauth2) {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', 
          })
          console.log('Token client initialized')
          gisInited = true
          maybeResolve()
        } else {
          setTimeout(waitForGoogle, 50)
        }
      }
      
      waitForGoogle()
    }
    gisScript.onerror = () => reject(new Error('Failed to load gis'))
    document.head.appendChild(gisScript)

    function maybeResolve() {
      if (gapiInited && gisInited) {
        console.log('Google Auth fully initialized')
        resolve()
      }
    }
  })
}

const saveTokenToStorage = (token: string, expiresIn: number = 3600) => {
  try {
    const expiryTime = Date.now() + (expiresIn * 1000)
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
    console.log('Token saved to localStorage, expires in', expiresIn, 'seconds')
  } catch (error) {
    console.error('Error saving token to localStorage:', error)
  }
}

const getTokenFromStorage = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    
    if (!token || !expiry) {
      return null
    }
    
    if (Date.now() > parseInt(expiry)) {
      console.log('Token expired, clearing storage')
      clearTokenFromStorage()
      return null
    }
    
    return token
  } catch (error) {
    console.error('Error reading token from localStorage:', error)
    return null
  }
}

const clearTokenFromStorage = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}

export const saveUserToStorage = (user: GoogleUser) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    console.error('Error saving user to localStorage:', error)
  }
}

export const getUserFromStorage = (): GoogleUser | null => {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY)
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error reading user from localStorage:', error)
    return null
  }
}

export const restoreSession = async (): Promise<boolean> => {
  try {
    const token = getTokenFromStorage()
    if (!token) {
      console.log('No stored token found')
      return false
    }
    
    accessToken = token
    console.log('Session restored from localStorage')
    return true
  } catch (error) {
    console.error('Error restoring session:', error)
    return false
  }
}

export const signIn = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth not initialized'))
      return
    }

    tokenClient.callback = async (response: GoogleAuthResponse) => {
      if (response.error) {
        console.error('Auth error:', response.error)
        reject(new Error(response.error))
        return
      }
      if (response.access_token) {
        accessToken = response.access_token
        
        const expiresIn = response.expires_in || 3600
        saveTokenToStorage(response.access_token, expiresIn)
        
        console.log('Access token received and set')
        resolve(response.access_token)
      } else {
        reject(new Error('No access token received'))
      }
    }

    tokenClient.requestAccessToken({ prompt: '' })
  })
}

export const getAccessToken = (): string | null => {
  if (!accessToken) {
    accessToken = getTokenFromStorage()
  }
  return accessToken
}

export const getUserInfo = async (): Promise<GoogleUser | null> => {
  try {
    const token = getAccessToken()
    if (!token) {
      console.error('No access token available')
      return null
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user info:', error)
    return null
  }
}

export const signOut = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Token revoked')
    })
  }
  accessToken = null
  clearTokenFromStorage()
  console.log('Signed out and cleared storage')
}

declare global {
  interface Window {
    google: any
    gapi: any
  }
}
