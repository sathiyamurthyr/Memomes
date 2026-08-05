import React, { useEffect, useRef } from 'react';

interface WatermarkedViewerProps {
  srcUrl: string;
  recipientEmail: string;
  userIp: string;
  mediaType: 'image' | 'text';
  textValue?: string;
  showWatermark?: boolean;
  onClose: () => void;
}

export const WatermarkedViewer: React.FC<WatermarkedViewerProps> = ({
  srcUrl,
  recipientEmail,
  userIp,
  mediaType,
  textValue,
  showWatermark = true,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mediaType === 'image' && srcUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw raw decrypted image onto canvas
        ctx.drawImage(img, 0, 0);

        if (showWatermark) {
          // Apply diagonal anti-leak watermark overlay: Recipient Email | Resolved IP | Timestamp
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
          const watermarkText = `${recipientEmail} | IP: ${userIp} | ${timestamp}`;

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((-30 * Math.PI) / 180);
          ctx.font = `bold ${Math.max(16, Math.floor(canvas.width / 25))}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 201, 40, 0.45)'; // Accent Gold translucent
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';

          // Repeated diagonal watermark grid
          const stepY = canvas.height / 5;
          for (let y = -canvas.height; y < canvas.height; y += stepY) {
            ctx.fillText(watermarkText, 0, y);
          }
          ctx.restore();
        }
      };
      img.src = srcUrl;
    }
  }, [srcUrl, recipientEmail, userIp, mediaType, showWatermark]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative max-w-4xl w-full bg-surface-container border border-stroke-default rounded-xl overflow-hidden p-6 text-center">
        <div className="flex justify-between items-center mb-4 border-b border-stroke-default pb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              showWatermark 
                ? 'bg-amber-500/20 text-accent-gold border-amber-500/40' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {showWatermark ? 'VIEW ONLY - WATERMARKED STREAM' : 'ORIGINAL QUALITY OWNER VIEW'}
            </span>
            <span className="text-xs text-gray-400">
              {showWatermark ? 'Downloads & Reshare Blocked' : 'Full File Access Mode'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-surface p-1.5 rounded-lg border border-stroke-default"
          >
            ✕ Close
          </button>
        </div>

        {mediaType === 'image' ? (
          <div className="flex justify-center items-center overflow-auto max-h-[70vh]">
            <canvas ref={canvasRef} className="max-w-full max-h-[65vh] rounded-lg shadow-2xl" />
          </div>
        ) : (
          <div className="relative p-6 bg-surface rounded-lg text-left font-mono text-sm text-gray-200 overflow-auto max-h-[60vh] select-none">
            {showWatermark && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-25deg] text-amber-400/30 text-xl font-bold text-center p-4">
                {recipientEmail} | IP: {userIp} | {new Date().toLocaleDateString()}
              </div>
            )}
            <pre className="whitespace-pre-wrap">{textValue || 'Encrypted document contents...'}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
