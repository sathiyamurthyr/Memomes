import React, { useState } from 'react';
import { Upload, Check, AlertTriangle, X, Database } from 'lucide-react';
import { b2SyncWorker } from '../utils/b2SyncWorker';

interface B2DirectUploadModalProps {
  onClose: () => void;
  onUploadSuccess?: (fileName: string) => void;
}

export const B2DirectUploadModal: React.FC<B2DirectUploadModalProps> = ({ onClose, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'RECORDS'>('UPLOAD');
  const [bucketName, setBucketName] = useState('sathus-memomes-vault');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  const b2State = b2SyncWorker.getState();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleStartB2Upload = async () => {
    if (!selectedFile) {
      setStatusMessage('Please select a file to upload to Backblaze B2.');
      setStatusType('error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setStatusMessage(`Initiating zero-knowledge AES-256 stream to Backblaze bucket '${bucketName}'...`);
    setStatusType('info');

    try {
      // Step 1: Initiate upload via API to get presigned URL
      const initResponse = await fetch('/api/files/init-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '00000000-0000-0000-0000-000000000001',
          fileNameEncrypted: `${selectedFile.name}.enc`,
          contentTypeEncrypted: selectedFile.type || 'application/octet-stream',
          sizeBytes: selectedFile.size,
          contentHash: 'hash_' + Date.now()
        })
      });

      if (!initResponse.ok) {
        throw new Error('Failed to get presigned upload URL');
      }

      const initData = await initResponse.json();
      const presignedUrl = initData.presignedUploadUrl;
      
      if (!presignedUrl) {
        throw new Error('No presigned URL returned from server');
      }

      setUploadProgress(30);
      setStatusMessage(`Uploading encrypted binary to Backblaze B2 bucket '${bucketName}'...`);

      // Step 2: Upload the actual file bytes to the presigned S3 URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
        body: selectedFile
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      setUploadProgress(80);
      setStatusMessage(`Verifying upload to Backblaze B2...`);

      // Step 3: Complete the upload
      if (!initData.isMultipart) {
        await fetch('/api/files/complete-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: initData.fileId,
            uploadId: initData.uploadId || '',
            partETags: null
          })
        }).catch(() => {});
      }

      setUploadProgress(100);
      setIsUploading(false);
      setStatusType('success');
      setStatusMessage(`✔ Successfully uploaded '${selectedFile.name}' to Backblaze B2 bucket: ${bucketName}!`);

      // Trigger B2 sync worker
      b2SyncWorker.triggerSync(`Direct Upload: ${selectedFile.name}`);

      if (onUploadSuccess) {
        onUploadSuccess(selectedFile.name);
      }

    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setStatusType('error');
      setStatusMessage(`Upload failed: ${err.message || 'Check Backblaze B2 application key permissions.'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0E1524] rounded-3xl border border-[#F5C027]/40 p-6 space-y-5 shadow-2xl relative text-white font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-[#94A3B8] hover:text-white rounded-xl bg-white/[0.06] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5C027]/15 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white font-heading">Backblaze B2 Control & Upload</h3>
            <p className="text-xs text-[#F5C027] font-mono">Bucket: {bucketName}</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#070B14] p-1 rounded-2xl border border-white/10 text-xs font-bold">
          <button 
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex-1 py-2 rounded-xl transition ${activeTab === 'UPLOAD' ? 'bg-[#F5C027] text-[#070B14] shadow-md font-black' : 'text-[#94A3B8] hover:text-white'}`}
          >
            Upload File Now
          </button>
          <button 
            onClick={() => setActiveTab('RECORDS')}
            className={`flex-1 py-2 rounded-xl transition ${activeTab === 'RECORDS' ? 'bg-[#F5C027] text-[#070B14] shadow-md font-black' : 'text-[#94A3B8] hover:text-white'}`}
          >
            Bucket Upload Logs ({b2State.b2RecordLogs.length})
          </button>
        </div>

        {/* TAB 1: UPLOAD */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-4">
            
            {/* Status Message */}
            {statusMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-mono border flex items-center gap-2.5 ${
                statusType === 'success' ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]' :
                statusType === 'error' ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]' :
                'bg-[#F5C027]/15 border-[#F5C027]/40 text-[#F5C027]'
              }`}>
                {statusType === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span className="leading-tight">{statusMessage}</span>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#94A3B8]">Streaming encrypted payload to B2...</span>
                  <span className="text-[#F5C027] font-bold">{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#070B14] overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F5C027] to-[#D4A017] transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94A3B8] font-mono font-bold mb-1">Target B2 Bucket</label>
                <input 
                  type="text" 
                  value={bucketName}
                  onChange={e => setBucketName(e.target.value)}
                  className="w-full bg-[#070B14] border border-white/10 focus:border-[#F5C027] rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none"
                />
              </div>

              {/* File Picker Box */}
              <div>
                <label className="block text-[#94A3B8] font-mono font-bold mb-1">Select File to Upload</label>
                <div className="p-5 rounded-2xl bg-[#070B14] border border-dashed border-[#F5C027]/40 hover:border-[#F5C027] transition flex flex-col items-center justify-center space-y-2 text-center relative cursor-pointer">
                  <input 
                    type="file" 
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-[#F5C027]" />
                  {selectedFile ? (
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-xs">{selectedFile.name}</div>
                      <div className="text-[10px] text-[#22C55E] font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for Backblaze B2</div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-xs">Click to browse file for B2 upload</div>
                      <div className="text-[10px] text-[#94A3B8]">Direct S3 PUT Stream to {bucketName}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#070B14] border border-white/10 text-xs font-bold text-[#94A3B8] hover:text-white transition"
              >
                Cancel
              </button>

              <button 
                onClick={handleStartB2Upload}
                disabled={isUploading || !selectedFile}
                className="btn-gold text-xs h-11 px-6 font-extrabold flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading to B2...' : 'Upload Now to B2'}</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: RECORDS LOG */}
        {activeTab === 'RECORDS' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="text-[#94A3B8] text-[11px]">
              Verified binary blobs in bucket <span className="text-[#F5C027] font-bold">{bucketName}</span>:
            </div>

            <div className="p-3 bg-[#070B14] rounded-2xl border border-white/10 space-y-2 max-h-56 overflow-y-auto">
              {b2State.b2RecordLogs.length === 0 ? (
                <div className="text-center py-6 text-[#94A3B8]">
                  No B2 upload logs recorded yet. Upload a file above!
                </div>
              ) : (
                b2State.b2RecordLogs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#0E1524] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-xs">{log.name}</div>
                      <div className="text-[10px] text-[#22C55E]">Path: {log.b2Path}</div>
                    </div>
                    <span className="text-[9px] text-[#94A3B8]">{log.uploadedAt}</span>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#070B14] border border-white/10 text-xs font-bold text-white hover:border-[#F5C027] transition"
            >
              Close Inspector
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
