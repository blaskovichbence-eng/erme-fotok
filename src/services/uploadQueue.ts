import { CoinData } from '../types/coin'
import { processImage } from '../utils/imageProcessor'
import { createFileName, getFolderName } from '../utils/fileNaming'
import { uploadImageToDrive } from './googleDrive'
import { updateCoinImages } from './googleSheets'

export interface UploadTask {
  id: string
  coin: CoinData
  frontImage?: {
    file: File
    blob?: Blob
  }
  backImage?: {
    file: File
    blob?: Blob
  }
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed'
  progress: string
  error?: string
  createdAt: number
  retryCount: number
}

const QUEUE_STORAGE_KEY = 'upload_queue'
const MAX_RETRIES = 3

class UploadQueueManager {
  private queue: UploadTask[] = []
  private isProcessing = false
  private listeners: Set<(queue: UploadTask[]) => void> = new Set()

  constructor() {
    this.loadQueue()
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.queue = parsed.map((task: any) => ({
          ...task,
          status: task.status === 'processing' || task.status === 'uploading' ? 'pending' : task.status
        }))
      }
    } catch (error) {
      console.error('Error loading queue:', error)
      this.queue = []
    }
  }

  private saveQueue() {
    try {
      const toSave = this.queue.map(task => ({
        id: task.id,
        coin: task.coin,
        status: task.status,
        progress: task.progress,
        error: task.error,
        createdAt: task.createdAt,
        retryCount: task.retryCount
      }))
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(toSave))
    } catch (error) {
      console.error('Error saving queue:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.queue]))
  }

  public subscribe(listener: (queue: UploadTask[]) => void) {
    this.listeners.add(listener)
    listener([...this.queue])
    return () => this.listeners.delete(listener)
  }

  public addTask(coin: CoinData, frontImage?: File, backImage?: File): string {
    const taskId = `${coin.sorszam}-${Date.now()}`
    
    const task: UploadTask = {
      id: taskId,
      coin,
      frontImage: frontImage ? { file: frontImage } : undefined,
      backImage: backImage ? { file: backImage } : undefined,
      status: 'pending',
      progress: 'Várakozás...',
      createdAt: Date.now(),
      retryCount: 0
    }

    this.queue.push(task)
    this.saveQueue()
    this.notifyListeners()

    console.log('Task added to queue:', taskId)
    
    if (!this.isProcessing) {
      this.processQueue()
    }

    return taskId
  }

  private async processQueue() {
    if (this.isProcessing) return
    
    this.isProcessing = true

    while (this.queue.length > 0) {
      const task = this.queue.find(t => t.status === 'pending')
      if (!task) break

      try {
        await this.processTask(task)
      } catch (error) {
        console.error('Error processing task:', error)
      }
    }

    this.isProcessing = false
  }

  private async processTask(task: UploadTask) {
    console.log('Processing task:', task.id)

    try {
      task.status = 'processing'
      task.progress = 'Képek feldolgozása...'
      this.notifyListeners()

      const folderName = getFolderName(task.coin.sorszam)
      let frontLink = task.coin.elolap_link
      let frontId = task.coin.elolap_id
      let backLink = task.coin.hatlap_link
      let backId = task.coin.hatlap_id

      if (task.frontImage) {
        task.progress = 'Előlap feldolgozása...'
        this.notifyListeners()

        const processedFront = await processImage(task.frontImage.file)
        task.frontImage.blob = processedFront

        task.status = 'uploading'
        task.progress = 'Előlap feltöltése...'
        this.notifyListeners()

        const frontFileName = createFileName(task.coin.sorszam, task.coin.leiras, 'A')
        const frontResult = await uploadImageToDrive(processedFront, frontFileName, folderName)
        frontLink = frontResult.webViewLink
        frontId = frontResult.fileId
      }

      if (task.backImage) {
        task.progress = 'Hátlap feldolgozása...'
        this.notifyListeners()

        const processedBack = await processImage(task.backImage.file)
        task.backImage.blob = processedBack

        task.status = 'uploading'
        task.progress = 'Hátlap feltöltése...'
        this.notifyListeners()

        const backFileName = createFileName(task.coin.sorszam, task.coin.leiras, 'B')
        const backResult = await uploadImageToDrive(processedBack, backFileName, folderName)
        backLink = backResult.webViewLink
        backId = backResult.fileId
      }

      task.progress = 'Sheet frissítése...'
      this.notifyListeners()

      await updateCoinImages(
        task.coin.sorszam,
        frontLink || '',
        frontId || '',
        backLink || '',
        backId || ''
      )

      task.status = 'completed'
      task.progress = 'Kész ✓'
      this.notifyListeners()

      console.log('Task completed:', task.id)

      setTimeout(() => {
        this.removeTask(task.id)
      }, 3000)

    } catch (error: any) {
      console.error('Task failed:', task.id, error)
      
      task.retryCount++
      
      if (task.retryCount < MAX_RETRIES) {
        task.status = 'pending'
        task.progress = `Újrapróbálkozás (${task.retryCount}/${MAX_RETRIES})...`
        task.error = error.message
        this.notifyListeners()
        this.saveQueue()
        
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        task.status = 'failed'
        task.progress = 'Sikertelen'
        task.error = error.message
        this.notifyListeners()
        this.saveQueue()
      }
    }
  }

  public removeTask(taskId: string) {
    this.queue = this.queue.filter(t => t.id !== taskId)
    this.saveQueue()
    this.notifyListeners()
  }

  public retryTask(taskId: string) {
    const task = this.queue.find(t => t.id === taskId)
    if (task && task.status === 'failed') {
      task.status = 'pending'
      task.retryCount = 0
      task.error = undefined
      this.notifyListeners()
      this.saveQueue()
      
      if (!this.isProcessing) {
        this.processQueue()
      }
    }
  }

  public getQueue(): UploadTask[] {
    return [...this.queue]
  }

  public clearCompleted() {
    this.queue = this.queue.filter(t => t.status !== 'completed')
    this.saveQueue()
    this.notifyListeners()
  }
}

export const uploadQueue = new UploadQueueManager()
