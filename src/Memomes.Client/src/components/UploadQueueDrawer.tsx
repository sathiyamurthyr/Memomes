import React from 'react';
import type { UploadQueueItem } from '../services/uploadPipeline';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface UploadQueueDrawerProps {
  queue: UploadQueueItem[];
  onClose: () => void;
  onClearCompleted: () => void;
}

export const UploadQueueDrawer: React.FC<UploadQueueDrawerProps> = ({
  queue,
  onClose,
  onClearCompleted
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (queue.length === 0) return null;

  const activeCount = queue.filter(q => q.status === 'Encrypting' || q.status === 'Uploading').length;
  const completedCount = queue.filter(q => q.status === 'Complete').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 glass-panel border border-stroke-default rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Drawer Header */}
      <div className="px-4 py-3 bg-surface-container/90 border-b border-stroke-default flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-accent-gold animate-ping" />
          <h4 className="text-xs font-bold text-gray-100">
            Batch Upload Queue ({activeCount} Active / {queue.length} Total)
          </h4>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-white"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 max-h-72 overflow-y-auto space-y-2.5">
          {queue.map((item) => (
            <div key={item.id} className="p-2.5 bg-surface rounded-xl border border-stroke-default text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-gray-200 truncate max-w-[200px]" title={item.name}>
                  {item.name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === 'Complete' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                  item.status === 'Encrypting' ? 'bg-amber-950/60 text-accent-gold border border-amber-500/30' :
                  item.status === 'Uploading' ? 'bg-blue-950/60 text-accent-blue border border-blue-500/30' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-card h-1.5 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.status === 'Complete' ? 'bg-emerald-400' : 'bg-accent-gold'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>{(item.size / 1024 / 1024).toFixed(1)} MB</span>
                <span>{item.progress}%</span>
              </div>
            </div>
          ))}

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="w-full py-1.5 text-[11px] text-accent-gold hover:underline text-center"
            >
              Clear Completed ({completedCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
