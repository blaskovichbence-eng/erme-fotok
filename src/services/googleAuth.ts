import { GoogleUser, GoogleAuthResponse } from '../types/google'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'

let gapiInited = false
let gisInited = false
let tokenClient: any = null
let accessToken: string | null = null

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

    const gapiScript = document.createElement('script')
    gapiScript.src = 'https://apis.google.com/js/api.js'
    gapiScript.onload = () => {
      console.log('gapi script loaded')
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [
              'https://sheets.googleapis.com/$discovery/rest?version=v4',
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
            ],
          })
          console.log('gapi client initialized')
          gapiInited = true
          maybeResolve()
        } catch (error) {
          console.error('Error initializing gapi client:', error)
          reject(error)
        }
      })
    }
    gapiScript.onerror = () => reject(new Error('Failed to load gapi'))
    document.head.appendChild(gapiScript)

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
        window.gapi.client.setToken({ access_token: response.access_token })
        console.log('Access token received and set')
        resolve(response.access_token)
      } else {
        reject(new Error('No access token received'))
      }
    }

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      tokenClient.requestAccessToken({ prompt: '' })
    }
  })
}

export const getAccessToken = (): string | null => {
  return accessToken
}

export const getUserInfo = async (): Promise<GoogleUser | null> => {
  try {
    const token = window.gapi.client.getToken()
    if (!token || !token.access_token) {
      console.error('No access token available')
      return null
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token.access_token}`
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
  const token = window.gapi.client.getToken()
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Token revoked')
    })
    window.gapi.client.setToken(null)
  }
  accessToken = null
}

declare global {
  interface Window {
    google: any
    gapi: any
  }
}
