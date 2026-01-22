const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID

interface UploadResult {
  fileId: string
  webViewLink: string
}

const findOrCreateFolder = async (folderName: string, parentId: string): Promise<string> => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    })

    if (response.result.files && response.result.files.length > 0) {
      console.log('Folder found:', folderName, response.result.files[0].id)
      return response.result.files[0].id!
    }

    console.log('Creating folder:', folderName)
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id'
    })

    console.log('Folder created:', createResponse.result.id)
    return createResponse.result.id!
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

    const token = window.gapi.client.getToken()
    if (!token) {
      throw new Error('No access token available')
    }

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`
        },
        body: form
      }
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Upload successful:', result)

    await window.gapi.client.drive.permissions.create({
      fileId: result.id,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    })

    console.log('File shared publicly')

    return {
      fileId: result.id,
      webViewLink: result.webViewLink
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error)
    throw new Error('Drive feltöltési hiba')
  }
}
