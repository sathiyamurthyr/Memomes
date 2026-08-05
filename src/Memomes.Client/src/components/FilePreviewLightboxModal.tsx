import React from 'react';
import type { FileItem } from './DashboardV2';
import { UniversalFilePreviewEngine } from './UniversalFilePreviewEngine';

interface FilePreviewLightboxModalProps {
  file: FileItem;
  userEmail?: string;
  onClose: () => void;
  onOpenShare?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
  onDelete?: (fileId: string) => void;
}

export const FilePreviewLightboxModal: React.FC<FilePreviewLightboxModalProps> = ({
  file,
  userEmail,
  onClose,
  onOpenShare,
  onRename,
  onMove,
  onDelete
}) => {
  return (
    <UniversalFilePreviewEngine
      file={file as any}
      userEmail={userEmail}
      onClose={onClose}
      onOpenShare={onOpenShare as any}
      onRename={onRename as any}
      onMove={onMove as any}
      onDelete={onDelete}
    />
  );
};
