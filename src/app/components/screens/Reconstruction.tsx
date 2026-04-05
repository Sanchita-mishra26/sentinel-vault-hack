import React, { useEffect, useState } from 'react';
import { NetworkMap } from '../NetworkMap';
import { motion } from 'motion/react';
import { Zap, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFile } from '../../context/FileContext';

const reconstructionNodes = [
  { id: '1', label: 'Node 1', state: 'active', health: 100, x: 20, y: 30 },
  { id: '2', label: 'Node 2', state: 'active', health: 98, x: 80, y: 30 },
  { id: '4', label: 'Node 4', state: 'active', health: 95, x: 50, y: 90 },
  { id: '5', label: 'Node 5', state: 'active', health: 99, x: 15, y: 75 },
  { id: '6', label: 'Replacement Node', state: 'reconstructing', health: 45, x: 85, y: 75 }, // New node at same pos
] as any;

export function Reconstruction() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { setFileData } = useFile();

  useEffect(() => {
    setFileData((prev) => ({
      ...prev,
      systemStatus: {
        ...prev?.systemStatus,
        phase: 'reconstruction',
        message: 'Erasure coding reconstruction in progress',
      },
    }));
  }, [setFileData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/app/recovery'), 2000);
          return 100;
        }
        return p + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto p-8">
      
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/30">
             <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white">Erasure Coding Reconstruction</h1>
            <p className="text-slate-400 font-mono text-sm mt-1">Rebuilding Shard C using parity data from Node 1, 2, 4</p>
          </div>
        </div>
        <div className="text-right">
           <span className="text-sm font-semibold text-brand-primary mb-1 block">Reconstruction Progress</span>
           <span className="text-3xl font-heading font-bold text-white">{progress}%</span>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-3xl p-2 border-brand-primary/30 overflow-hidden relative">
         {/* Custom Data flow visualization overlay for reconstruction */}
         <div className="absolute inset-0 pointer-events-none z-10">
            {progress < 100 && [
              { startX: 20, startY: 30, endX: 85, endY: 75, delay: 0 },
              { startX: 80, startY: 30, endX: 85, endY: 75, delay: 0.2 },
              { startX: 50, startY: 90, endX: 85, endY: 75, delay: 0.4 }
            ].map((path, i) => (
              <motion.div
                 key={i}
                 className="absolute w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(62,166,255,1)]"
                 animate={{
                   left: [`${path.startX}%`, '50%', `${path.endX}%`],
                   top: [`${path.startY}%`, '50%', `${path.endY}%`],
                   scale: [1, 1.5, 1],
                 }}
                 transition={{
                   duration: 2,
                   repeat: Infinity,
                   ease: "linear",
                   delay: path.delay
                 }}
              />
            ))}
         </div>

         <NetworkMap nodes={reconstructionNodes} coreState="active" />
         
         {progress === 100 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-green-500/10 border border-green-500/30 rounded-2xl backdrop-blur-md flex items-center gap-4 shadow-[0_0_30px_rgba(74,222,128,0.2)] z-20"
           >
             <ShieldCheck className="w-8 h-8 text-green-400" />
             <div>
               <span className="block text-lg font-bold text-green-400">Shard Reconstruction Completed</span>
               <span className="text-xs text-green-300/80 font-mono">Data integrity verified. System normalizing.</span>
             </div>
           </motion.div>
         )}
      </div>

    </div>
  );
}
