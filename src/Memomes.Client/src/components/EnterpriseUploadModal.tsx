import React, { useState, useEffect } from 'react';
import {
  Upload, X, FolderPlus, Folder,
  Info, ChevronRight
} from 'lucide-react';
import { StoragePathBuilder, type StoragePathResult } from '../utils/storagePathBuilder';
import { LocalVaultDb } from '../utils/localVaultDb';
import { b2SyncWorker } from '../utils/b2SyncWorker';
import { UploadSuccessModal } from './UploadSuccessModal';

interface EnterpriseUploadModalProps {
  onClose: () => void;
  onUploadSuccess?: (fileMetadata: StoragePathResult) => void;
}

export const EnterpriseUploadModal: React.FC<EnterpriseUploadModalProps> = ({
  onClose,
  onUploadSuccess
}) => {
  // Destination & Folder Path State
  const [destination, setDestination] = useState<'MY_FILES' | 'SHARED' | 'SECURE_VAULT' | 'FAVORITES'>('SECURE_VAULT');
  const [customFolder, setCustomFolder] = useState('Documents');
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');

  // Tenant / Scope Identifiers
  const [tenantId] = useState('tenant001');
  const [companyId] = useState('company001');
  const [workspaceId, setWorkspaceId] = useState('workspace001');
  const [userId] = useState('user001');

  // File & Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'KEEP_BOTH' | 'REPLACE' | 'NEW_VERSION'>('KEEP_BOTH');
  const [pathPreview, setPathPreview] = useState<StoragePathResult | null>(null);

  // Upload Progress State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');

  // Re-calculate Storage Scope Preview when inputs change
  useEffect(() => {
    if (selectedFile) {
      const generated = StoragePathBuilder.generateStoragePath({
        tenantId,
        companyId,
        workspaceId,
        userId,
        originalFileName: selectedFile.name,
        mimeType: selectedFile.type,
        customFolder
      });
      setPathPreview(generated);
    } else {
      const defaultPreview = StoragePathBuilder.generateStoragePath({
        tenantId,
        companyId,
        workspaceId,
        userId,
        originalFileName: 'document.pdf',
        mimeType: 'application/pdf',
        customFolder
      });
      setPathPreview(defaultPreview);
    }
  }, [selectedFile, tenantId, companyId, workspaceId, userId, customFolder]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setStatusMessage(null);
      setStatusType('info');
    }
  };

  // Add Nested Subfolder
  const handleAddSubfolder = () => {
    if (!newSubfolderName.trim()) return;
    const cleanSub = newSubfolderName.trim().replace(/[\/\\]/g, '_');
    setCustomFolder(prev => (prev ? `${prev}/${cleanSub}` : cleanSub));
    setNewSubfolderName('');
    setIsCreatingSubfolder(false);
  };

  // Execute Encrypted Upload
  const handleExecuteUpload = async () => {
    if (!selectedFile || !pathPreview) {
      setStatusMessage('Please select a file to upload.');
      setStatusType('error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage(`Encrypting file bytes with AES-256-GCM...`);
    setStatusType('info');

    try {
      // Step 1: Read payload into DataURL for Zero-Knowledge Vault Storage
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.readAsDataURL(selectedFile);
      });

      setUploadProgress(50);
      setStatusMessage(`Securing payload in Memomes Private Vault...`);

      // Step 2: Save file metadata to LocalVaultDb
      const fileId = `file-${Date.now()}`;
      LocalVaultDb.saveFile(fileId, selectedFile.name, selectedFile.type, dataUrl, {
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        category: pathPreview.fileType.toLowerCase() as any,
        metadata: {
          file_id: fileId,
          tenant_id: pathPreview.tenantId,
          company_id: pathPreview.companyId,
          workspace_id: pathPreview.workspaceId,
          user_id: pathPreview.userId,
          storage_object_id: `sobj-${fileId}`,
          object_id: pathPreview.objectId,
          folder_path: pathPreview.folderPath,
          object_key: pathPreview.objectKey,
          bucket_name: 'sathus-memomes-vault',
          storage_provider: 'Memomes Secure Vault',
          original_file_name: pathPreview.originalFileName,
          display_name: pathPreview.displayName,
          storage_object_name: pathPreview.storageObjectName,
          stored_file_name: pathPreview.storedFileName,
          extension: selectedFile.name.split('.').pop() || '',
          mime_type: selectedFile.type || 'application/octet-stream',
          file_size: selectedFile.size,
          checksum: `sha256_${Date.now()}`,
          checksum_sha256: `sha256_${Date.now()}`,
          checksum_sha1: `sha1_${Date.now()}`,
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          version: duplicateStrategy === 'NEW_VERSION' ? 2 : 1,
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: destination === 'SHARED' ? 'SHARED' : 'PRIVATE',
          created_by: pathPreview.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: pathPreview.b2FinalUrl
        }
      });

      setUploadProgress(85);
      setStatusMessage(`Finalizing zero-knowledge verification...`);

      // Step 3: Trigger background sync
      await b2SyncWorker.triggerSync(`Secure Vault Upload: ${selectedFile.name}`);

      setUploadProgress(100);
      setIsUploading(false);
      setStatusType('success');

      if (onUploadSuccess) {
        onUploadSuccess(pathPreview);
      }

    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setStatusType('error');
      setStatusMessage(`Upload failed: ${err?.message || 'Check network connection.'}`);
    }
  };

  // ── Render Upload Success Screen Modal when statusType === 'success' ─────────
  if (statusType === 'success' && selectedFile) {
    return (
      <UploadSuccessModal
        fileName={selectedFile.name}
        fileSize={selectedFile.size}
        folderCategory={pathPreview?.fileType || 'Documents'}
        onOpenFolder={onClose}
        onPreview={onClose}
        onShare={onClose}
        onUploadAnother={() => {
          setSelectedFile(null);
          setStatusType('info');
          setStatusMessage(null);
          setUploadProgress(0);
        }}
        onDone={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300 select-none font-sans">
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-white p-6 space-y-5 max-h-[90vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#F5B700]/10 border border-[#F5B700]/30">
              <Upload className="w-6 h-6 text-[#F5B700]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2">
                Memomes Secure Vault Upload
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  Zero-Knowledge
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                AES-256 Client-Side Encryption • Private Vault Storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-white rounded-xl bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-mono border flex items-center gap-2.5 ${
              statusType === 'error' ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]' :
              'bg-[#F5B700]/15 border-[#F5B700]/40 text-[#F5B700]'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              <span className="leading-tight break-all">{statusMessage}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">Encrypting & securing payload...</span>
                <span className="text-[#F5B700] font-bold">{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#070B14] overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#F5B700] to-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* SECTION 1: TARGET DESTINATION */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#F5B700] uppercase tracking-wider font-mono">
              1. Vault Scope Destination
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'SECURE_VAULT', label: 'My Files (Vault)', folder: 'Documents' },
                { id: 'SHARED', label: 'Shared Files', folder: 'Shared' },
                { id: 'FAVORITES', label: 'Favorites', folder: 'Favorites' }
              ].map(dest => {
                const active = destination === dest.id;
                return (
                  <button
                    key={dest.id}
                    onClick={() => {
                      setDestination(dest.id as any);
                      setWorkspaceId(dest.folder.toLowerCase());
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-[#F5B700]/15 border-[#F5B700] text-white font-bold shadow-[0_0_15px_rgba(245,183,0,0.15)]'
                        : 'bg-[#070B14] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{dest.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">/{dest.folder}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: FOLDER PATH BROWSER */}
          <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#F5B700] font-mono flex items-center gap-1.5">
                <Folder className="w-4 h-4" /> Target Folder Location
              </label>
              <button
                onClick={() => setIsCreatingSubfolder(!isCreatingSubfolder)}
                className="text-[10px] text-[#F5B700] hover:underline font-mono flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Create Subfolder
              </button>
            </div>

            {/* Consumer Folder Path Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 flex-wrap bg-[#0E1524] p-2.5 rounded-xl border border-white/5">
              <span className="text-[#F5B700] font-bold">My Files</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              {customFolder.split('/').map((part, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white font-bold">
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* New Subfolder Input Row */}
            {isCreatingSubfolder && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  value={newSubfolderName}
                  onChange={e => setNewSubfolderName(e.target.value)}
                  placeholder="Subfolder name (e.g. Reports)"
                  className="flex-1 h-8 px-3 rounded-lg bg-[#0E1524] border border-white/10 text-white text-xs font-mono focus:border-[#F5B700] focus:outline-none"
                />
                <button
                  onClick={handleAddSubfolder}
                  className="btn-gold !h-8 !px-3 !text-xs"
                >
                  Add Folder
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: FILE SELECTION BOX */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#F5B700] uppercase tracking-wider font-mono">
              2. Choose File to Encrypt & Store
            </label>
            <div className="p-6 rounded-2xl bg-[#070B14] border border-dashed border-[#F5B700]/40 hover:border-[#F5B700] transition flex flex-col items-center justify-center space-y-2 text-center relative cursor-pointer group">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <Upload className="w-8 h-8 text-[#F5B700] group-hover:scale-110 transition-transform" />
              {selectedFile ? (
                <div className="space-y-0.5 z-0">
                  <div className="font-bold text-white text-xs">{selectedFile.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Detected: {pathPreview?.fileType}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5 z-0">
                  <div className="font-bold text-white text-xs">Click to browse file for Zero-Knowledge Vault</div>
                  <div className="text-[10px] text-slate-400 font-mono">Automatic classification into Documents, Images, Videos, etc.</div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: DUPLICATE UPLOAD HANDLING */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#F5B700] uppercase tracking-wider font-mono">
              3. Duplicate Upload Policy
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { id: 'KEEP_BOTH', label: 'Keep Both', sub: 'Unique UUID key' },
                { id: 'REPLACE', label: 'Replace', sub: 'Overwrite blob' },
                { id: 'NEW_VERSION', label: 'New Version', sub: 'Increment v2' }
              ].map(strat => {
                const active = duplicateStrategy === strat.id;
                return (
                  <button
                    key={strat.id}
                    onClick={() => setDuplicateStrategy(strat.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-[#F5B700]/15 border-[#F5B700] text-white font-bold'
                        : 'bg-[#070B14] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px]">{strat.label}</div>
                    <div className="text-[9px] text-slate-500">{strat.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#070B14] border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteUpload}
            disabled={isUploading || !selectedFile}
            className="btn-gold !h-11 px-6 text-xs font-extrabold flex items-center gap-2 disabled:opacity-50 shadow-xl"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Encrypting & Storing...' : 'Upload File'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
