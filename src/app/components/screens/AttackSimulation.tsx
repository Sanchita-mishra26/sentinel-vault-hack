import React, { useEffect, useMemo, useState } from 'react';
import { NetworkMap } from '../NetworkMap';
import { Gauge } from '../Gauge';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFile } from '../../context/FileContext';

export function AttackSimulation() {
  const [threatScore, setThreatScore] = useState(12);
  const navigate = useNavigate();
  const { fileData } = useFile();

  const attackNodes = useMemo(() => {
    const shards = fileData?.shards ?? [];
    const positions = [
      { x: 20, y: 30 },
      { x: 80, y: 30 },
      { x: 85, y: 75 },
      { x: 50, y: 90 },
      { x: 15, y: 75 },
    ];
    return shards.map((s, i) => ({
      id: s.id,
      label: `Shard ${i + 1}`,
      state: i === 2 ? 'critical' : 'active',
      health: 85 + ((i * 7) % 14),
      ...positions[i % positions.length],
    }));
  }, [fileData?.shards]);

  useEffect(() => {
    let currentScore = 12;
    const interval = setInterval(() => {
      currentScore += 3;
      if (currentScore > 89) {
        clearInterval(interval);
        setTimeout(() => navigate('/app/isolation'), 4000);
      }
      setThreatScore(Math.min(currentScore, 89));
    }, 100);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Alert Banner */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
      >
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-red-500 font-heading font-bold text-lg">AI ALERT: Anomaly detected on Node 3</h2>
          <p className="text-red-300/80 text-sm font-mono">Signature: X-Zero-Day variant. Unauthorized access attempt.</p>
        </div>
        <button onClick={() => navigate('/app/isolation')} className="px-6 py-2 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2">
          ACTIVATE ISOLATION <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      <div className="flex-1 flex gap-6">
        {/* Left Side: Network View */}
        <div className="flex-grow glass-card rounded-2xl p-6 flex flex-col relative border-red-500/30">
          <div className="flex justify-between items-center mb-6 z-10">
             <h2 className="text-xl font-heading font-semibold text-white">Live Threat Topography</h2>
             <span className="text-xs px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full font-semibold flex items-center gap-2 animate-pulse">
               <span className="w-2 h-2 rounded-full bg-red-500" />
               ATTACK IN PROGRESS
             </span>
          </div>
          
          <div className="flex-1 border border-brand-border/40 rounded-xl overflow-hidden bg-brand-bg/50 relative">
             <div className="absolute inset-0 bg-red-500/5 mix-blend-color-burn pointer-events-none z-0" />
             <NetworkMap nodes={attackNodes} coreState="warning" />
          </div>
        </div>

        {/* Right Side: Threat Dashboard */}
        <div className="w-96 flex flex-col gap-6">
          <motion.div 
            className="glass-card rounded-2xl p-8 border border-red-500/30 flex flex-col items-center shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-mamba.png')] opacity-10" />
            <div className="absolute top-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]" />
            
            <h3 className="font-heading font-semibold text-xl text-white mb-2 relative z-10">Dynamic Threat Score</h3>
            <p className="text-sm text-slate-400 mb-8 relative z-10">Real-time risk assessment</p>

            <div className="mb-8 relative z-10">
              <Gauge value={threatScore} color={threatScore > 70 ? '#EF4444' : '#F59E0B'} label={threatScore > 70 ? 'CRITICAL' : 'WARNING'} size={200} />
            </div>

            <div className="w-full relative z-10 space-y-4">
               <div className="bg-brand-bg/80 p-4 rounded-xl border border-red-500/20">
                 <div className="flex justify-between items-center text-sm font-semibold mb-2">
                   <span className="text-slate-300">System Integrity</span>
                   <span className="text-yellow-400 font-mono text-lg">82%</span>
                 </div>
                 <div className="w-full h-1.5 bg-brand-border/30 rounded-full">
                   <div className="h-full bg-yellow-400 w-[82%] rounded-full shadow-[0_0_5px_rgba(250,204,21,0.5)] transition-all duration-1000" />
                 </div>
               </div>

               <div className="bg-brand-bg/80 p-4 rounded-xl border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-red-500 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-red-400 mb-1">Threat Level</h4>
                      <p className="text-xs text-red-300/80 font-mono leading-relaxed">
                        Data exfiltration attempt detected on Node 3. Shard C integrity compromised.
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
