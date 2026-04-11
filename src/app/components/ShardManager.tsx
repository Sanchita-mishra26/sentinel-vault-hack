import React, { useEffect, useMemo, useState } from 'react';
import { Database, ShieldCheck, Network, AlertTriangle, Download } from 'lucide-react';

type ShardStatus = 'healthy' | 'compromised';

interface ShardInfo {
  id: string;
  title: string;
  size: string;
  storedOn: number;
  replication: number;
}

const SHARDS: ShardInfo[] = [
  { id: 'A', title: 'Shard A', size: '600 KB', storedOn: 1, replication: 3 },
  { id: 'B', title: 'Shard B', size: '600 KB', storedOn: 2, replication: 4 },
  { id: 'C', title: 'Shard C', size: '600 KB', storedOn: 3, replication: 1 },
  { id: 'D', title: 'Shard D', size: '600 KB', storedOn: 4, replication: 2 },
];

const generateSessionString = (length = 96) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

import { useFile } from '../context/FileContext';
import { deleteFile, downloadFile } from '../../services/api';
import { API_BASE } from '../apiBase';

export default function ShardManager() {
  const { fileData } = useFile();
  const fileId = fileData?.fileId;

  const [hoveredShard, setHoveredShard] = useState<string | null>(null);
  const [compromisedNode, setCompromisedNode] = useState<number | null>(null);
  const [compromisedShard, setCompromisedShard] = useState<string | null>(null);
  const [activityText, setActivityText] = useState<Record<string, string>>({
    A: 'Verifying integrity...',
    B: 'Verifying integrity...',
    C: 'Verifying integrity...',
    D: 'Verifying integrity...',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPurged, setIsPurged] = useState(false);
  
  // NEW STATE FOR TASK 4
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authKeyInput, setAuthKeyInput] = useState('');

  useEffect(() => {
    const timers = SHARDS.map((shard, index) =>
      setTimeout(() => {
        setActivityText((prev) => ({ ...prev, [shard.id]: '✔ Integrity confirmed' }));
      }, 1000 + index * 120),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const hoveredShardMeta = useMemo(() => SHARDS.find((s) => s.id === hoveredShard) ?? null, [hoveredShard]);

  const handleDownloadShard = (shard: ShardInfo, e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileId) {
      setToastMessage('🚨 Error: No active file uploaded!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setAuthModalOpen(true);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctKey = localStorage.getItem('sentinelActiveKey');
    if (authKeyInput === correctKey) {
      setToastMessage('✅ Signature Verified. Decrypting file...');
      setAuthModalOpen(false);
      setAuthKeyInput('');
      setTimeout(() => {
        try {
          downloadFile(fileId!);
        } catch (err) {
          setToastMessage('❌ Download failed.');
          setTimeout(() => setToastMessage(null), 3000);
        }
      }, 1500);
    } else {
      setToastMessage('❌ Decryption Failed: Invalid AES Key. Serving mathematical garbage.');
      setTimeout(() => setToastMessage(null), 3000);
      
      const garbage = new Uint8Array(4096);
      window.crypto.getRandomValues(garbage);
      const blob = new Blob([garbage], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ACCESS_DENIED_GIBBERISH.bin';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteFile = async () => {
    if (!fileId) {
      setToastMessage('🚨 Error: No active file to purge!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setToastMessage(`🗑️ Purging distributed fragments...`);
    try {
      await deleteFile(fileId);
      
      localStorage.removeItem('sentinelActiveFile');
      localStorage.removeItem('sentinelActiveKey');
      
      setIsPurged(true);
      
      setToastMessage('🔥 DATA PURGED: All fragments and keys have been permanently neutralized.');
      setTimeout(() => setToastMessage(null), 6000);
    } catch (e) {
      setToastMessage('❌ Deletion failed.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSimulateFailure = () => {
    const randomNode = Math.floor(Math.random() * 5) + 1;
    const randomShard = SHARDS[Math.floor(Math.random() * SHARDS.length)];

    setCompromisedNode(randomNode);
    setCompromisedShard(randomShard.id);
    setActivityText((prev) => ({ ...prev, [randomShard.id]: 'Reconstructing shard...' }));

    setTimeout(() => {
      setCompromisedNode(null);
      setCompromisedShard(null);
      setActivityText((prev) => ({ ...prev, [randomShard.id]: '✔ Recovered via replication nodes' }));

      setTimeout(() => {
        setActivityText((prev) => ({ ...prev, [randomShard.id]: '✔ Integrity confirmed' }));
      }, 1200);
    }, 1600);
  };

  const handleDownloadFragment = async (nodeChar: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileId) {
      setToastMessage('🚨 Error: No active file uploaded!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/download/shard/${fileId}/${nodeChar}`);
      if (!response.ok) throw new Error('Fragment not found');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shard_${nodeChar}_${fileId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch(err) {
      setToastMessage(`❌ Error downloading Fragment ${nodeChar}.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 border border-brand-border/60 space-y-6 bg-gradient-to-br from-[#0B1220]/95 to-[#111A2F]/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(62,166,255,0.14),transparent_45%)]" />

      {toastMessage && (
        <div className={`absolute top-4 right-4 z-30 rounded-lg border px-3 py-2 text-xs font-semibold backdrop-blur-sm animate-pulse ${
          toastMessage.includes('PURGED') || toastMessage.includes('Error') || toastMessage.includes('❌') 
          ? 'border-red-500/50 bg-red-900/60 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
          : 'border-brand-primary/40 bg-brand-primary/15 text-brand-primary'
        }`}>
          {toastMessage}
        </div>
      )}

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center shadow-[0_0_18px_rgba(62,166,255,0.25)]">
            <Database className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-semibold text-white">Shard Manager</h2>
            <p className="text-sm text-slate-400">Real-time shard simulation with intelligent replication insight.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSimulateFailure}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(239,68,68,0.35)]"
        >
          <AlertTriangle className="w-4 h-4" />
          🚨 Simulate Node Failure
        </button>
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-brand-border/50 bg-brand-bg/60 p-4 shadow-[inset_0_0_20px_rgba(62,166,255,0.04)]">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Shards
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{isPurged ? 0 : 24}</p>
        </div>

        <div className="rounded-xl border border-brand-border/50 bg-brand-bg/60 p-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Network className="w-4 h-4 text-brand-accent" /> Distribution Nodes
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{isPurged ? 0 : 3}</p>
        </div>

        <div className="rounded-xl border border-brand-border/50 bg-brand-bg/60 p-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Database className="w-4 h-4 text-brand-primary" /> Queue Status
          </div>
          <p className="text-2xl font-semibold text-white mt-2">Idle</p>
        </div>
      </div>

      <div className="relative z-10 rounded-2xl border border-brand-border/50 bg-brand-bg/50 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 tracking-wide">Node Storage Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((node) => {
            const isCompromised = compromisedNode === node;
            const isActive = node <= 4 && !isCompromised && !isPurged;
            const isIdle = (node === 5 || isPurged) && !isCompromised;
            const isHighlighted =
              !isCompromised &&
              hoveredShardMeta &&
              (hoveredShardMeta.storedOn === node || hoveredShardMeta.replication === node);

            return (
              <div
                key={node}
                className={`rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 ${
                  isCompromised
                    ? 'border-red-500/60 bg-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                    : isHighlighted
                    ? 'border-brand-primary/60 bg-brand-primary/10 shadow-[0_0_20px_rgba(62,166,255,0.35)]'
                    : 'border-brand-border/50 bg-[#0A1428]/80 hover:border-brand-primary/30 hover:shadow-[0_0_16px_rgba(62,166,255,0.2)]'
                }`}
              >
                <p className="text-sm font-semibold text-white">Node {node}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {isCompromised ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-300">🔴 Compromised</span>
                    </>
                  ) : isActive ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                      <span className="text-emerald-300">🟢 Active</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-slate-300">⚪ Idle</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 tracking-wide">Shard Grid</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {!isPurged && SHARDS.map((shard) => {
            const isCompromised = compromisedShard === shard.id;

            return (
              <div
                key={shard.id}
                onMouseEnter={() => setHoveredShard(shard.id)}
                onMouseLeave={() => setHoveredShard(null)}
                className={`relative rounded-xl border p-4 transition-all duration-300 ${
                  isCompromised
                    ? 'border-red-500/60 bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.22)]'
                    : 'border-brand-border/60 bg-[#0A1428]/90 hover:-translate-y-1 hover:scale-[1.01] hover:border-brand-primary/40 hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{shard.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Size: {shard.size}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                      isCompromised
                        ? 'border-red-500/50 bg-red-500/15 text-red-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    {isCompromised ? '🔴 Compromised' : '🟢 Healthy'}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <p>Stored On: <span className="text-slate-100 font-medium">Node {shard.storedOn}</span></p>
                  <p>Replication: <span className="text-slate-100 font-medium">Node {shard.replication}</span></p>
                  <p className="text-brand-primary">{activityText[shard.id]}</p>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Integrity</span>
                    <span>100%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${isCompromised ? 'bg-red-500 w-2/5' : 'bg-emerald-400 w-full'}`} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadShard(shard, e)}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-brand-primary border border-brand-primary/30 bg-brand-primary/10 rounded-lg px-3 py-1.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_14px_rgba(62,166,255,0.35)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Reconstruct & Download
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-1.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_14px_rgba(239,68,68,0.35)]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Purge All Fragments
                  </button>
                </div>

                {hoveredShard === shard.id && (
                  <div className="absolute right-3 top-3 w-48 rounded-lg border border-brand-primary/30 bg-[#061024]/95 p-3 text-[11px] text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.4)] animate-[fadeIn_.2s_ease-out]">
                    <p>🔐 Encryption: AES-256</p>
                    <p className="mt-1">📊 Entropy: High</p>
                    <p className="mt-1">⏱ Last Verified: Just now</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 rounded-xl border border-brand-border/40 bg-brand-bg/40 px-4 py-3 text-xs text-slate-400 space-y-1">
        <p>[SYSTEM] Monitoring shard health</p>
        <p>[SYSTEM] All nodes synchronized</p>
      </div>

      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061024]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-brand-primary/50 rounded-2xl shadow-[0_0_50px_rgba(62,166,255,0.2)] p-6">
            <h3 className="text-xl font-heading font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-primary" />
              🔒 Authorization Required
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Enter AES-256 Decryption Key to initiate polynomial reconstruction.
            </p>
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                className="w-full bg-slate-950 border border-brand-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/80"
                placeholder="Enter Secret Key..."
                value={authKeyInput}
                onChange={(e) => setAuthKeyInput(e.target.value)}
              />
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-primary text-slate-950 hover:bg-blue-400 transition-colors"
                >
                  Verify Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
