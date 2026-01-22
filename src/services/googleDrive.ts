import { getAccessToken } from './googleAuth'

const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

interface UploadResult {
  fileId: string
  webViewLink: string
}

const findOrCreateFolder = async (folderName: string, parentId: string): Promise<string> => {
  try {
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }

    const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    if (!response.ok) {
      throw new Error(`Drive API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.files && data.files.length > 0) {
      console.log('Folder found:', folderName, data.files[0].id)
      return data.files[0].id
    }

    console.log('Creating folder:', folderName)
    const createUrl = `${DRIVE_API_BASE}/files?fields=id`
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      })
    })

    if (!createResponse.ok) {
      throw new Error(`Drive API create error: ${createResponse.status}`)
    }

    const createData = await createResponse.json()
    console.log('Folder created:', createData.id)
    return createData.id
  } catch (error) {
    console.error('Error finding/creating folder:', error)
    throw error
  }
}

export const uploadImageToDrive = async (
  imageBlob: Blob,
  fileName: string,
  folderName: string
): Promise<UploadResult> => {
  try {
    console.log('Uploading image:', fileName, 'to folder:', folderName)

    const folderId = await findOrCreateFolder(folderName, DRIVE_FOLDER_ID)

    const metadata = {
      name: fileName,
      mimeType: 'image/jpeg',
      parents: [folderId]
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', imageBlob)

    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      }
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Upload successful:', result)

    const permUrl = `${DRIVE_API_BASE}/files/${result.id}/permissions`
    const permResponse = await fetch(permUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    })

    if (!permResponse.ok) {
      console.warn('Failed to set public permissions:', permResponse.status)
    } else {
      console.log('File shared publicly')
    }

    return {
      fileId: result.id,
      webViewLink: result.webViewLink
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error)
    throw new Error('Drive feltöltési hiba')
  }
}
