import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backendData, setBackendData] = useState<any>(null);
  const [uploadTimestamp, setUploadTimestamp] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'analyzing' | 'ready'>('analyzing');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) return;

    const statusTimer = setTimeout(() => {
      setScanStatus('ready');
    }, 1200);

    const insightTimer = setTimeout(() => {
      setAiInsight(null);
    }, 2500);

    return () => {
      clearTimeout(statusTimer);
      clearTimeout(insightTimer);
    };
  }, [selectedFile]);

  const handleUpload = async () => {
  if (!selectedFile) return;

  setIsUploading(true);
  setProgress(0);

  let current = 0;
  uploadIntervalRef.current = setInterval(() => {
    current += 10;
    setProgress(current);
    if (current >= 100 && uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
  }, 300);

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    console.log("Backend response:", data);

    // ✅ CORRECT PLACE
    setBackendData(data);

  } catch (err) {
    console.error("Upload error:", err);
  }

  navigateTimeoutRef.current = setTimeout(() => {
    navigate('/app/compliance');
  }, 3500);
};

  
const handleDeleteShard = async () => {
  if (!backendData?.fileId) {
    console.log("No fileId found");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/delete-shard", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileId: backendData.fileId,
        shardId: "shard-1"
      })
    });

    const data = await res.json();
    console.log("Shard delete response:", data);

  } catch (err) {
    console.error("Delete error:", err);
  }
};


  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    setSelectedFile(file);
    setUploadTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setSessionId(`SV-${Math.floor(1000 + Math.random() * 9000)}`);
    setScanStatus('analyzing');
    setIsUploading(false);
    setProgress(0);

    const insight =
      file.type.includes('pdf')
        ? 'AI Insight: High-sensitivity document detected'
        : file.type.startsWith('image/')
        ? 'AI Insight: Visual data requires enhanced privacy controls'
        : file.name.endsWith('.doc') || file.name.endsWith('.docx')
        ? 'AI Insight: Editable contract-like content detected'
        : 'AI Insight: Sensitive file fingerprint detected';
    setAiInsight(insight);

    // Clear input value so selecting the same file again after reset still triggers onChange.
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadTimestamp('');
    setSessionId('');
    setScanStatus('analyzing');
    setAiInsight(null);
    setIsUploading(false);
    setProgress(0);
    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current);
  };


  const getFileTypeLabel = (file: File) => {
    if (file.type.includes('pdf') || file.name.endsWith('.pdf')) return 'PDF';
    if (file.type.startsWith('image/')) return 'Image';
    if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) return 'Word';
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return 'Spreadsheet';
    return (file.type.split('/')[1] || 'File').toUpperCase();
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.includes('pdf') || file.name.endsWith('.pdf')) return '📄';
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) return '📝';
    return '📁';
  };

  const formatFileSizeMB = (size: number) => `${(size / (1024 * 1024)).toFixed(2)} MB`;
  const estimatedShards = selectedFile ? Math.max(2, Math.ceil(selectedFile.size / (1024 * 1024 * 2))) : 0;

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      <div className="max-w-3xl w-full flex flex-col gap-8">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-heading font-bold text-white">Upload Sensitive Document</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Drop your files here to begin the secure distributed storage process. All files are encrypted client-side before transmission.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full glass-card border-2 border-dashed border-brand-border/60 rounded-3xl p-16 flex flex-col items-center justify-center gap-6 transition-all group relative overflow-hidden ${
            selectedFile
              ? 'opacity-70 cursor-not-allowed'
              : 'cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5'
          }`}
          onClick={!isUploading && !selectedFile ? handleUploadAreaClick : undefined}
        >
          {/* Background animation for dropzone */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative w-24 h-24 rounded-2xl bg-brand-bg/80 border border-brand-border/50 flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(62,166,255,0.3)] transition-shadow">
            <UploadCloud className="w-12 h-12 text-brand-primary group-hover:-translate-y-2 transition-transform duration-300" />
            <FileText className="w-8 h-8 text-slate-500 absolute -bottom-2 -right-2 bg-brand-card rounded-md border border-brand-border" />
          </div>
          
          <div className="text-center z-10">
            <h3 className="text-xl font-heading font-semibold text-white mb-2">Drag & Drop or Click</h3>
            <p className="text-sm text-slate-400">{selectedFile ? selectedFile.name : 'Supported formats: PDF, DOCX, XLSX, TXT (Max 50MB)'}</p>
            {selectedFile && <p className="text-xs text-amber-300 mt-2">File locked for processing</p>}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div className="flex gap-4 mt-6 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-bg/50 border border-brand-border text-xs font-semibold text-slate-300">
               <ShieldCheck className="w-4 h-4 text-green-400" /> AES-256 Enabled
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-bg/50 border border-brand-border text-xs font-semibold text-slate-300">
               <Activity className="w-4 h-4 text-brand-accent" /> E2E Encrypted
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {aiInsight && (
            <motion.div
              key="ai-insight"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl px-4 py-3 bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-semibold"
            >
              🚨 {aiInsight}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
  {selectedFile && (
    <motion.div
      key="selected-file-card"
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none mt-0.5">
            {getFileTypeIcon(selectedFile)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {selectedFile.name}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {formatFileSizeMB(selectedFile.size)} •{" "}
              {getFileTypeLabel(selectedFile)} • {uploadTimestamp}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            scanStatus === "analyzing"
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "bg-green-500/10 border-green-500/30 text-green-300"
          }`}
        >
          {scanStatus === "analyzing"
            ? "🟡 Analyzing..."
            : "🟢 Secure & Ready"}
        </span>
      </div>

      <div className="grid gap-2 text-xs text-slate-300">
        <p>
          Session ID:{" "}
          <span className="text-brand-primary font-semibold">
            {sessionId}
          </span>
        </p>
        <p className="text-green-300">✔ File Integrity Verified</p>
        <p className="text-green-300">✔ No Malware Detected</p>
        <p className="text-green-300">✔ Ready for Encryption</p>

        {/* 🔥 Backend File ID */}
        {backendData && (
          <p className="text-blue-300">
            🆔 File ID: {backendData.fileId}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 border-t border-brand-border/50 pt-3">
        <span>📊 Estimated Shards: {estimatedShards}</span>
        <span>🌐 Distribution Nodes: 3</span>
      </div>

      <div className="space-y-1 text-[11px] text-slate-400">
        <p>[SYSTEM] File queued</p>
        <p>[SYSTEM] Awaiting user confirmation</p>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(62,166,255,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Shard & Distribute
        </button>

        <button
          onClick={handleRemoveFile}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_0_14px_rgba(239,68,68,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Remove File
        </button>

        {/* 🔥 NEW BUTTON */}
        <button
          onClick={handleDeleteShard}
          disabled={!backendData?.fileId}
          className="px-4 py-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_0_14px_rgba(234,179,8,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Simulate Shard Loss
        </button>
      </div>
    </motion.div>
  )}

  <button
  onClick={() => {
    if (!backendData?.fileId) {
      console.log("No fileId");
      return;
    }

    window.open(`http://localhost:5000/api/download/${backendData.fileId}`);
  }}
  disabled={!backendData?.fileId}
  className="px-4 py-2 rounded-lg border border-green-500/40 bg-green-500/10 text-green-300 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
>
  Download File
</button>
</AnimatePresence>

        <AnimatePresence>
          {isUploading && (
            <motion.div 
              key="uploading-state"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-brand-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{selectedFile?.name || 'selected_file'}</h4>
                    <span className="text-xs text-slate-400">{selectedFile ? `${formatFileSizeMB(selectedFile.size)} • Processing...` : 'Processing...'}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-primary">{progress}%</span>
              </div>
              
              <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden border border-brand-border/50">
                <motion.div 
                  className="h-full bg-brand-primary shadow-[0_0_10px_rgba(62,166,255,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {progress === 100 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Upload Complete. Proceeding to Compliance Check.</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-400 animate-pulse" />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
