import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Lock, ArrowRight, Server, Activity, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Gauge } from '../Gauge';
import { useNavigate } from 'react-router-dom';
import { useFile, type ShardEntry, type EncryptionStatus } from '../../context/FileContext';
import { API_BASE, parseJsonResponse } from '../../apiBase';

export function EncryptionFlow() {
  const [step, setStep] = useState(0);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { fileData, setFileData } = useFile();

  useEffect(() => {
    setActiveFileId(localStorage.getItem('sentinelActiveFile'));
  }, []);

  const gridShards = useMemo(() => {
    const s = fileData?.shards ?? [];
    const row = s.slice(0, 4);
    const out = [...row];
    for (let i = out.length; i < 4; i++) {
      out.push({ id: `pending-${i}`, size: 0, node: '', status: 'pending' });
    }
    return out;
  }, [fileData?.shards]);

  const nodeSlots = useMemo(() => {
    const s = fileData?.shards ?? [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const sh of s) {
      if (sh.node && sh.node !== 'unassigned' && !seen.has(sh.node)) {
        seen.add(sh.node);
        ordered.push(sh.node);
      }
    }
    while (ordered.length < 4) ordered.push(`node-${ordered.length + 1}`);
    return ordered.slice(0, 4);
  }, [fileData?.shards]);

  useEffect(() => {
    const fid = fileData?.fileId;
    if (!fid) return;
    fetch(`${API_BASE}/api/shard/${fid}`, { method: 'POST' })
      .then((r) =>
        parseJsonResponse<{ shards?: ShardEntry[] | null; encryptionStatus?: EncryptionStatus | null }>(r)
      )
      .then((data) => {
        setFileData((prev) => ({
          ...prev,
          shards: data.shards ?? prev?.shards,
          encryptionStatus: data.encryptionStatus ?? prev?.encryptionStatus,
        }));
      })
      .catch(console.error);
  }, [fileData?.fileId, setFileData]);

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1000)); setStep(1); // Encrypted
      await new Promise(r => setTimeout(r, 1500)); setStep(2); // Sharded
      await new Promise(r => setTimeout(r, 2000)); setStep(3); // Distributed
    };
    sequence();
  }, []);

  return (
    <div className="flex flex-col h-full gap-8 p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 border-b border-brand-border/40 pb-6">
        <Lock className="w-8 h-8 text-brand-primary" />
        <h1 className="text-3xl font-heading font-bold text-white">Encryption & Distributed Sharding</h1>
      </div>

      <div className="flex-1 flex gap-8">
        
        {/* Main Process Flow */}
        <div className="flex-grow glass-card rounded-3xl p-12 border border-brand-border/40 relative flex items-center justify-between">
          
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-mamba.png')] opacity-10 rounded-3xl" />

          {/* Step 1: File Uploaded & Encrypted */}
          <div className="flex flex-col items-center gap-4 z-10 relative w-48 h-full justify-center">
            <motion.div 
               animate={{ scale: step === 0 ? 1.1 : 1, filter: step === 0 ? 'drop-shadow(0 0 20px rgba(62,166,255,0.5))' : 'none' }}
               className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                 step > 0 ? 'bg-brand-card border-brand-primary' : 'bg-brand-bg border-brand-border'
               }`}
            >
              {step === 0 ? (
                <FileText className="w-12 h-12 text-slate-400" />
              ) : (
                <div className="relative">
                  <FileText className="w-12 h-12 text-brand-primary opacity-20" />
                  <Lock className="w-8 h-8 text-brand-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(62,166,255,0.8)]" />
                </div>
              )}
            </motion.div>
            <div className="text-center h-12">
              <h3 className="font-heading font-semibold text-white">{step > 0 ? (activeFileId ? `Encrypted: ${activeFileId.slice(-8)}` : 'Encrypted File') : 'Raw File'}</h3>
              <p className="text-xs text-slate-400 mt-1">AES-256 Validated</p>
            </div>
            
            {/* Flow Arrow */}
            {step >= 1 && (
              <motion.div 
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="absolute top-1/2 -right-16 -translate-y-1/2 flex items-center text-brand-primary"
              >
                 <ArrowRight className="w-8 h-8 animate-pulse drop-shadow-[0_0_10px_rgba(62,166,255,0.8)]" />
              </motion.div>
            )}
          </div>

          {/* Step 2: Sharding */}
          <div className="flex flex-col items-center gap-6 z-10 relative w-64 h-full justify-center">
            <div className="grid grid-cols-2 gap-4">
              {gridShards.map((shard, shardIndex) => (
                <motion.div 
                   key={shard.id}
                   initial={{ opacity: 0, scale: 0, rotate: -45 }}
                   animate={step >= 2 ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                   transition={{ delay: shardIndex * 0.2, type: 'spring' }}
                   className="w-16 h-20 rounded-xl bg-brand-bg/80 border border-brand-primary/40 flex items-center justify-center flex-col gap-2 relative shadow-[0_0_15px_rgba(62,166,255,0.15)]"
                >
                  <FileText className="w-6 h-6 text-brand-primary opacity-50" />
                  <span className="text-[10px] font-bold text-slate-300">Shard {String.fromCharCode(65 + shardIndex)}</span>
                  {/* Flow to nodes */}
                  {step >= 3 && (
                    <motion.div 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 80 }}
                      transition={{ delay: 0.5 + (shardIndex * 0.1) }}
                      className="absolute top-1/2 -right-[90px] h-[2px] bg-brand-primary/40 origin-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-primary absolute right-0 top-1/2 -translate-y-1/2 shadow-[0_0_5px_rgba(62,166,255,0.8)]" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="text-center h-12">
              <h3 className="font-heading font-semibold text-white">Intelligent Sharding</h3>
              <p className="text-xs text-slate-400 mt-1">Erasure Coding Algorithm</p>
            </div>
          </div>

          {/* Step 3: Distributed Storage */}
          <div className="flex flex-col items-center gap-6 z-10 relative w-64 h-full justify-center">
            <div className="flex flex-col gap-4 w-full pl-16">
              {nodeSlots.map((nodeName, node) => (
                <motion.div 
                   key={nodeName}
                   initial={{ opacity: 0, x: 20 }}
                   animate={step >= 3 ? { opacity: 1, x: 0 } : {}}
                   transition={{ delay: 0.5 + (node * 0.2) }}
                   className="flex items-center gap-4 bg-brand-card/50 border border-brand-border/40 p-3 rounded-xl hover:border-brand-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-[0_0_10px_rgba(62,166,255,0.2)]">
                    <Server className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-bold text-white">{nodeName}</h4>
                      <span className="text-[10px] text-green-400 font-mono">100%</span>
                    </div>
                    <div className="h-1 bg-brand-bg rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary w-full" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center h-12">
              <h3 className="font-heading font-semibold text-white">Distributed Nodes</h3>
              <p className="text-xs text-slate-400 mt-1">Global Replication</p>
            </div>
          </div>
        </div>

        {/* AI Intelligence Engine Card */}
        <div className="w-[350px] flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-8 border border-brand-border/40 flex-1 flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-bg border border-brand-border shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-6">
              <ShieldAlert className="w-8 h-8 text-brand-primary" />
            </div>
            
            <h3 className="font-heading font-semibold text-xl text-white mb-2">AI Intelligence Engine</h3>
            <p className="text-sm text-slate-400 mb-8">Model: Sentinel Forest<br/>Monitoring Mode: Behavior</p>

            <div className="mb-8">
              <Gauge value={12} color="#4ADE80" label="Threat Score" size={160} />
            </div>

            <div className="w-full bg-brand-bg/50 p-4 rounded-xl border border-brand-border/30 mb-8">
               <div className="flex justify-between items-center text-sm font-semibold mb-2">
                 <span className="text-slate-400">Anomalies Detected</span>
                 <span className="text-green-400 font-mono text-lg">0</span>
               </div>
               <div className="w-full h-1 bg-brand-border/30 rounded-full">
                 <div className="h-full bg-green-400 w-[5%] rounded-full shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
               </div>
            </div>

            {step >= 3 && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/app/attack')} 
                className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all flex items-center justify-center gap-2 mt-auto group"
              >
                <Activity className="w-5 h-5 group-hover:animate-spin" />
                SIMULATE CYBER ATTACK
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
