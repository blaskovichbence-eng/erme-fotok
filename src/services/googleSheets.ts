import { CoinData } from '../types/coin'

const SHEET_ID = import.meta.env.VITE_SHEET_ID

export const getCoinBySerialNumber = async (serialNumber: number): Promise<CoinData | null> => {
  try {
    console.log('Fetching coin data for serial number:', serialNumber)
    
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'A:Q',
    })

    const rows = response.result.values
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
      tervezoSorszam: parseInt(coinRow[1]) || 0,
      tervezo: coinRow[2] || '',
      leiras: coinRow[3] || '',
      dobozban: coinRow[4] || '',
      csomagolas: coinRow[5] || '',
      ertekesitve: coinRow[6] || '',
      ev: coinRow[7] || '',
      anyag: coinRow[8] || '',
      suly: coinRow[9] || '',
      meret: coinRow[10] || '',
      megjegyzes: coinRow[11] || '',
      kategoria: coinRow[12] || '',
      elolap_link: coinRow[13] || '',
      hatlap_link: coinRow[14] || '',
      elolap_id: coinRow[15] || '',
      hatlap_id: coinRow[16] || '',
    }

    console.log('Parsed coin data:', coinData)
    return coinData
  } catch (error) {
    console.error('Error fetching coin data:', error)
    return null
  }
}

export const updateCoinImages = async (
  serialNumber: number,
  frontLink: string,
  frontId: string,
  backLink: string,
  backId: string
): Promise<boolean> => {
  try {
    console.log('Updating coin images for serial number:', serialNumber)

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'A:A',
    })

    const rows = response.result.values
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

    const updateResponse = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `N${actualRowNumber}:Q${actualRowNumber}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[frontLink, backLink, frontId, backId]]
      }
    })

    console.log('Update response:', updateResponse)
    return true
  } catch (error) {
    console.error('Error updating coin images:', error)
    return false
  }
}
