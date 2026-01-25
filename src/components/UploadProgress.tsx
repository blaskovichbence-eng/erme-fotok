import { useState, useEffect } from 'react'
import { Loader, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { uploadQueue, UploadTask } from '../services/uploadQueue'

export default function UploadProgress() {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const unsubscribe = uploadQueue.subscribe((queue) => {
      setTasks(queue)
      if (queue.length > 0 && queue.some(t => t.status === 'processing' || t.status === 'uploading')) {
        setIsExpanded(true)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const currentTask = tasks.find(t => t.status === 'processing' || t.status === 'uploading')

  if (activeTasks.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-200">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {currentTask ? (
            <>
              <Loader size={20} className="animate-spin text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  Érme #{currentTask.coin.sorszam}
                </p>
                <p className="text-xs text-gray-600 truncate">{currentTask.progress}</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-800">
                {activeTasks.filter(t => t.status === 'pending').length} várakozik
              </p>
            </>
          )}
        </div>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </div>

      {isExpanded && activeTasks.length > 0 && (
        <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
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
      )}

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
  )
}
