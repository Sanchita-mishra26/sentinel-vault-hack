import React, { useEffect, useState } from 'react';
import { NetworkMap } from '../NetworkMap';
import { ShieldAlert, PowerOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';       
import { useNavigate } from 'react-router';
import { useFile } from '../../context/FileContext';

const isolatedNodes = [
  { id: '1', label: 'Node 1', state: 'active', health: 100, x: 20, y: 30 },
  { id: '2', label: 'Node 2', state: 'active', health: 98, x: 80, y: 30 },
  { id: '3', label: 'Node 3', state: 'isolated', health: 0, x: 85, y: 75 },
  { id: '4', label: 'Node 4', state: 'active', health: 95, x: 50, y: 90 },
  { id: '5', label: 'Node 5', state: 'active', health: 99, x: 15, y: 75 },
] as any;

export function Isolation() {
  const { setFileData } = useFile();
  let navigate;
try {
  navigate = useNavigate();
} catch {
  navigate = () => {};
}
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setFileData((prev) => ({
      ...prev,
      systemStatus: {
        ...prev?.systemStatus,
        phase: 'isolation',
        message: 'Compromised node isolated from mesh',
      },
    }));
  }, [setFileData]);

  useEffect(() => {
    const i = setInterval(() => setPulse(p => !p), 1000);
    const timeout = setTimeout(() => navigate('/app/reconstruction'), 5000);
    return () => { clearInterval(i); clearTimeout(timeout); };
  }, [navigate]);

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      
      <div className="w-full max-w-5xl flex flex-col gap-8">
        
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 rounded-full bg-red-500/10 border border-red-500/50 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
          >
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </motion.div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Isolation Protocol Activated</h1>
          <p className="text-slate-400 font-mono">Compromised node successfully severed from main network.</p>
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card rounded-3xl p-2 border-red-500/30 overflow-hidden relative min-h-[500px]"
        >
           <NetworkMap nodes={isolatedNodes} coreState="active" />
           
           {/* Overlay message on the map */}
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20">
             <div className="px-6 py-3 bg-brand-bg/90 border border-red-500/50 rounded-xl backdrop-blur-md flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
               <PowerOff className="w-5 h-5 text-red-500" />
               <span className="text-sm font-bold text-white tracking-widest uppercase">Node 3 Offline</span>
             </div>
             
             <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={() => navigate('/app/reconstruction')}
                className="px-6 py-2 rounded-lg bg-brand-primary/20 text-brand-primary border border-brand-primary/50 font-bold text-sm hover:bg-brand-primary hover:text-brand-bg transition-colors shadow-[0_0_15px_rgba(62,166,255,0.2)] flex items-center gap-2"
              >
                INITIATE RECONSTRUCTION <ArrowRight className="w-4 h-4" />
             </motion.button>
           </div>
        </motion.div>

      </div>
    </div>
  );
}
