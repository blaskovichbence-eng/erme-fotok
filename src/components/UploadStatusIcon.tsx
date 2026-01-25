import { useState, useEffect } from 'react'
import { Loader, Upload } from 'lucide-react'
import { uploadQueue, UploadTask } from '../services/uploadQueue'

interface UploadStatusIconProps {
  onClick: () => void
}

export default function UploadStatusIcon({ onClick }: UploadStatusIconProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([])

  useEffect(() => {
    const unsubscribe = uploadQueue.subscribe((queue) => {
      setTasks(queue)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const processingTasks = activeTasks.filter(t => t.status === 'processing' || t.status === 'uploading')
  const pendingTasks = activeTasks.filter(t => t.status === 'pending')

  if (activeTasks.length === 0) return null

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 rounded-lg transition-colors touch-manipulation"
      title="Feltöltési állapot"
    >
      {processingTasks.length > 0 ? (
        <Loader size={20} className="animate-spin" />
      ) : (
        <Upload size={20} />
      )}
      
      <span className="text-sm font-semibold">
        {processingTasks.length > 0 ? (
          <>Feltöltés... ({activeTasks.length})</>
        ) : (
          <>Várakozik ({pendingTasks.length})</>
        )}
      </span>

      {activeTasks.length > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
          {activeTasks.length}
        </span>
      )}
    </button>
  )
}
