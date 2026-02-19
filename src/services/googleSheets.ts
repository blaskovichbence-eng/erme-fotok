import { CoinData } from '../types/coin'
import { getAccessToken } from './googleAuth'

const SHEET_ID = import.meta.env.VITE_SHEET_ID
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export const getCoinBySerialNumber = async (serialNumber: number): Promise<CoinData | null> => {
  try {
    console.log('Fetching coin data for serial number:', serialNumber)
    
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }
    
    const url = `${SHEETS_API_BASE}/${SHEET_ID}/values/A:Y`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`)
    }

    const data = await response.json()
    const rows = data.values
    if (!rows || rows.length === 0) {
      console.error('No data found in sheet')
      return null
    }

    console.log('Total rows:', rows.length)

    const dataRows = rows.slice(1)

    const coinRow = dataRows.find((row: any) => {
      const sorszam = parseInt(row[0])
      return sorszam === serialNumber
    })

    if (!coinRow) {
      console.error('Coin not found with serial number:', serialNumber)
      return null
    }

    console.log('Found coin row:', coinRow)

    const coinData: CoinData = {
      sorszam: parseInt(coinRow[0]) || 0,
      tervezo: coinRow[1] || '',
      leiras: coinRow[2] || '',
      dobozban: coinRow[3] || '',
      csomagolas: coinRow[4] || '',
      ev: coinRow[5] || '',
      anyag: coinRow[6] || '',
      suly: coinRow[7] || '',
      meret: coinRow[8] || '',
      megjegyzes: coinRow[9] || '',
      ertekesitve: coinRow[14] || '',
      elolap_link: coinRow[17] || '',
      hatlap_link: coinRow[18] || '',
      elolap_id: coinRow[19] || '',
      hatlap_id: coinRow[20] || '',
      doboz_kep_link: coinRow[21] || '',
      doboz_kep_id: coinRow[22] || '',
      egyeb_kep_link: coinRow[23] || '',
      egyeb_kep_id: coinRow[24] || '',
    }

    console.log('Parsed coin data:', coinData)
    return coinData
  } catch (error) {
    console.error('Error fetching coin data:', error)
    return null
  }
}

export const getCoinsWithoutImages = async (limit: number = 10, offset: number = 0): Promise<{ coins: CoinData[], total: number }> => {
  try {
    console.log('Fetching coins without images, limit:', limit, 'offset:', offset)
    
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }
    
    const url = `${SHEETS_API_BASE}/${SHEET_ID}/values/A:Y`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`)
    }

    const data = await response.json()
    const rows = data.values
    if (!rows || rows.length === 0) {
      console.error('No data found in sheet')
      return { coins: [], total: 0 }
    }

    const dataRows = rows.slice(1)

    const allCoins = dataRows
      .map((row: any) => ({
        sorszam: parseInt(row[0]) || 0,
        tervezo: row[1] || '',
        leiras: row[2] || '',
        dobozban: row[3] || '',
        csomagolas: row[4] || '',
        ev: row[5] || '',
        anyag: row[6] || '',
        suly: row[7] || '',
        meret: row[8] || '',
        megjegyzes: row[9] || '',
        ertekesitve: row[14] || '',
        elolap_link: row[17] || '',
        hatlap_link: row[18] || '',
        elolap_id: row[19] || '',
        hatlap_id: row[20] || '',
        doboz_kep_link: row[21] || '',
        doboz_kep_id: row[22] || '',
        egyeb_kep_link: row[23] || '',
        egyeb_kep_id: row[24] || '',
      }))
      .filter((coin: CoinData) => !coin.elolap_link && !coin.hatlap_link)
      .sort((a: CoinData, b: CoinData) => a.sorszam - b.sorszam)

    const coinsWithoutImages = allCoins.slice(offset, offset + limit)

    console.log(`Found ${allCoins.length} total coins without images, returning ${coinsWithoutImages.length} from offset ${offset}`)
    return { coins: coinsWithoutImages, total: allCoins.length }
  } catch (error) {
    console.error('Error fetching coins without images:', error)
    return { coins: [], total: 0 }
  }
}

export const updateCoinImages = async (
  serialNumber: number,
  frontLink: string,
  frontId: string,
  backLink: string,
  backId: string,
  boxLink?: string,
  boxId?: string,
  otherLink?: string,
  otherId?: string
): Promise<boolean> => {
  try {
    console.log('Updating coin images for serial number:', serialNumber)

    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }

    const url = `${SHEETS_API_BASE}/${SHEET_ID}/values/A:A`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`)
    }

    const data = await response.json()
    const rows = data.values
    if (!rows || rows.length === 0) {
      console.error('No data found in sheet')
      return false
    }

    const rowIndex = rows.findIndex((row: any) => parseInt(row[0]) === serialNumber)
    
    if (rowIndex === -1) {
      console.error('Coin not found with serial number:', serialNumber)
      return false
    }

    const actualRowNumber = rowIndex + 1

    const updateUrl = `${SHEETS_API_BASE}/${SHEET_ID}/values/R${actualRowNumber}:Y${actualRowNumber}?valueInputOption=RAW`
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[frontLink, backLink, frontId, backId, boxLink || '', boxId || '', otherLink || '', otherId || '']]
      })
    })

    if (!updateResponse.ok) {
      throw new Error(`Sheets API update error: ${updateResponse.status}`)
    }

    const updateData = await updateResponse.json()
    console.log('Update response:', updateData)
    return true
  } catch (error) {
    console.error('Error updating coin images:', error)
    return false
  }
}
