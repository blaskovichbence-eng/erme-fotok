import { useState, useEffect } from 'react'
import { Loader, CheckCircle, XCircle, X } from 'lucide-react'
import { uploadQueue, UploadTask } from '../services/uploadQueue'

interface UploadProgressProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function UploadProgress({ isOpen = false, onClose }: UploadProgressProps) {
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

  if (!isOpen || activeTasks.length === 0) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md bg-white rounded-lg shadow-2xl border-2 border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Feltöltési állapot</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {activeTasks.map((task) => (
            <div 
              key={task.id} 
              className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-2">
                {task.status === 'processing' || task.status === 'uploading' ? (
                  <Loader size={16} className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" />
                ) : task.status === 'failed' ? (
                  <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                ) : task.status === 'completed' ? (
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    Érme #{task.coin.sorszam}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {task.coin.leiras}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {task.progress}
                  </p>
                  
                  {task.error && (
                    <div className="mt-2 flex gap-2">
                      <p className="text-xs text-red-600 flex-1">{task.error}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          uploadQueue.retryTask(task.id)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Újra
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeTasks.some(t => t.status === 'failed') && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                activeTasks
                  .filter(t => t.status === 'failed')
                  .forEach(t => uploadQueue.retryTask(t.id))
              }}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Összes újrapróbálása
            </button>
          </div>
        )}
      </div>
    </>
  )
}
