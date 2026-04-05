import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';


export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadTimestamp: string;
  sessionId: string;
}

/** Compliance payload from GET /api/compliance/:fileId (merged into global fileData). */
export interface ComplianceReport {
  status?: string;
  findings?: string | string[];
  piiCategories?: number;
  entities?: Array<{ label: string; count: number }>;
  message?: string;
  /** Legacy UI fields (optional) */
  detectedContent?: string;
}

export interface EncryptionStatus {
  isEncrypted: boolean;
  algorithm?: string;
  timestamp?: string;
}

export interface ShardEntry {
  id: string;
  size: number;
  node: string;
  status: string;
}

export interface ShardData {
  shards: Array<{
    id: string;
    size: number;
    storedOn: number;
    replication: number;
  }>;
  totalShards: number;
  distributionNodes: number;
}

export interface SystemStatus {
  phase?: string;
  message?: string;
}

/** Global file flow state (merged incrementally — never replace wholesale). */
export interface FileData {
  fileId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  uploadStatus?: string | null;
  complianceReport?: ComplianceReport | null;
  shards?: ShardEntry[] | null;
  encryptionStatus?: EncryptionStatus | null;
  systemStatus?: SystemStatus | null;
}

export interface FileState {
  file: File | null;
  fileId: string | null;
  metadata: FileMetadata | null;
  complianceReport: ComplianceReport | null;
  encryptionStatus: EncryptionStatus | null;
  shardData: ShardData | null;
  backendData: any | null;
}

interface FileContextType {
  fileState: FileState;
  fileData: FileData | null;
  setFile: (file: File | null) => void;
  setFileId: (fileId: string | null) => void;
  setMetadata: (metadata: FileMetadata | null) => void;
  setComplianceReport: (report: ComplianceReport | null) => void;
  setEncryptionStatus: (status: EncryptionStatus | null) => void;
  setShardData: (data: ShardData | null) => void;
  setBackendData: (data: any) => void;
  setFileData: (update: Partial<FileData> | ((prev: FileData | null) => Partial<FileData> | null)) => void;
  resetFileState: () => void;
}

const initialFileState: FileState = {
  file: null,
  fileId: null,
  metadata: null,
  complianceReport: null,
  encryptionStatus: null,
  shardData: null,
  backendData: null,
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [fileState, setFileStateInternal] = useState<FileState>(initialFileState);
  const [fileData, setFileDataInternal] = useState<FileData | null>(null);

  const setFile = (file: File | null) => {
    setFileStateInternal((prev) => ({ ...prev, file }));
  };

  const setFileId = (fileId: string | null) => {
    setFileStateInternal((prev) => ({ ...prev, fileId }));
  };

  const setMetadata = (metadata: FileMetadata | null) => {
    setFileStateInternal((prev) => ({ ...prev, metadata }));
  };

  const setComplianceReport = (report: ComplianceReport | null) => {
    setFileStateInternal((prev) => ({ ...prev, complianceReport: report }));
  };

  const setEncryptionStatus = (status: EncryptionStatus | null) => {
    setFileStateInternal((prev) => ({ ...prev, encryptionStatus: status }));
  };

  const setShardData = (data: ShardData | null) => {
    setFileStateInternal((prev) => ({ ...prev, shardData: data }));
  };

  const setBackendData = (data: any) => {
    setFileStateInternal((prev) => ({ ...prev, backendData: data }));
  };

  const setFileData = useCallback(
    (update: Partial<FileData> | ((prev: FileData | null) => Partial<FileData> | null)) => {
      setFileDataInternal((prev) => {
        const patch = typeof update === 'function' ? update(prev) : update;
        if (patch == null) return prev;
        return { ...(prev ?? {}), ...patch };
      });
    },
    []
  );

  const resetFileState = () => {
    setFileStateInternal(initialFileState);
    setFileDataInternal(null);
  };

  return (
    <FileContext.Provider
      value={{
        fileState,
        fileData,
        setFile,
        setFileId,
        setMetadata,
        setComplianceReport,
        setEncryptionStatus,
        setShardData,
        setBackendData,
        setFileData,
        resetFileState,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
}
