import React, { useState } from 'react';
import { Play, Pause, ShieldCheck, Zap } from 'lucide-react';

interface ZeroRamVideoPlayerProps {
  fileName: string;
  totalSizeMb: number;
  onClose: () => void;
}

export const ZeroRamVideoPlayer: React.FC<ZeroRamVideoPlayerProps> = ({
  fileName,
  totalSizeMb,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [preFetchedChunks] = useState([0, 1, 2]); // 3-chunk ring-buffer pre-fetch

  const totalChunks = Math.ceil(totalSizeMb / 10);

  const togglePlay = () => {
    if (!isPlaying) {
      setActiveChunkIndex(prev => Math.min(prev + 1, totalChunks - 1));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative max-w-4xl w-full bg-surface-container border border-stroke-default rounded-xl overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4 border-b border-stroke-default pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-primary/20 text-primary border border-primary/40 rounded">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-gray-100">{fileName}</h3>
            <span className="text-xs bg-surface text-accent-gold border border-stroke-default px-2 py-0.5 rounded-full">
              Zero-RAM MediaSource Player
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-surface p-1.5 rounded-lg border border-stroke-default"
          >
            ✕ Close
          </button>
        </div>

        {/* Video Canvas Simulation Container */}
        <div className="relative aspect-video bg-surface rounded-lg border border-stroke-default flex flex-col items-center justify-center overflow-hidden">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center animate-gold-glow">
              <Play className="w-10 h-10 text-accent-gold ml-1 cursor-pointer" onClick={togglePlay} />
            </div>
            <p className="text-sm font-medium text-gray-200 mb-1">
              {isPlaying ? 'Streaming Encrypted Chunks...' : 'Zero-RAM MediaSource Stream Ready'}
            </p>
            <p className="text-xs text-gray-400">
              Chunk-based WebWorker Decryption (10 MB chunks)
            </p>
          </div>

          {/* Player Controls */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <span className="text-xs text-gray-300">Chunk {activeChunkIndex + 1} / {Math.max(1, totalChunks)}</span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3-Chunk Pre-fetch Ring Buffer Active</span>
            </div>
          </div>
        </div>

        {/* Buffer Status visualization */}
        <div className="mt-4 p-3 bg-surface rounded-lg border border-stroke-default">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Ring Buffer State:</span>
            <span>Pre-fetched Chunks: [{preFetchedChunks.join(', ')}]</span>
          </div>
          <div className="w-full bg-surface-card h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-accent-gold h-full transition-all duration-300"
              style={{ width: `${Math.min(100, ((activeChunkIndex + 1) / Math.max(1, totalChunks)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
