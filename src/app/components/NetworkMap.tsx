import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Server, Activity, PowerOff, Zap } from 'lucide-react';

export type NodeState = 'active' | 'warning' | 'critical' | 'isolated' | 'isolated-danger' | 'reconstructing';

export interface Node {
  id: string;
  label: string;
  state: NodeState;
  health: number;
  x: number; // Percentage
  y: number; // Percentage
}

interface NetworkMapProps {
  nodes?: Node[] | null;
  coreState?: 'active' | 'warning' | 'critical';
  title?: string;
  message?: React.ReactNode;
}

const stateColors = {
  active: 'text-green-400 border-green-400/50 bg-green-500/10 shadow-[0_0_15px_rgba(74,222,128,0.2)]',
  warning: 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]',
  critical: 'text-red-500 border-red-500/80 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.5)]',
  isolated: 'text-slate-500 border-slate-700/50 bg-slate-800/50',
  'isolated-danger': 'text-red-500 border-red-500/80 bg-red-950/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  reconstructing: 'text-brand-primary border-brand-primary/80 bg-brand-primary/20 shadow-[0_0_20px_rgba(62,166,255,0.4)] animate-pulse',
};

const lineColors = {
  active: 'stroke-brand-primary/30',
  warning: 'stroke-yellow-400/50',
  critical: 'stroke-red-500/80 stroke-[3px]',
  isolated: 'stroke-slate-700/30 stroke-dashed',
  'isolated-danger': 'stroke-red-500/20 stroke-dashed opacity-50',
  reconstructing: 'stroke-brand-primary/80 stroke-dashed stroke-[3px]',
};

export function NetworkMap({ nodes, coreState = 'active', title, message }: NetworkMapProps) {
  const safeNodes = useMemo(() => {
    if (!Array.isArray(nodes)) return [];
    const allowedStates: NodeState[] = ['active', 'warning', 'critical', 'isolated', 'isolated-danger', 'reconstructing'];

    return nodes
      .filter(Boolean)
      .map((node, index) => {
        const normalizedState = allowedStates.includes((node as Node).state) ? (node as Node).state : 'active';
        const safeX = typeof node?.x === 'number' ? node.x : 50;
        const safeY = typeof node?.y === 'number' ? node.y : 50;
        return {
          id: node?.id ?? `node-${index + 1}`,
          label: node?.label ?? `Node ${index + 1}`,
          state: normalizedState,
          health: typeof node?.health === 'number' ? node.health : 100,
          x: safeX,
          y: safeY,
        };
      });
  }, [nodes]);

  const getLineColor = (state: NodeState) => lineColors[state] ?? lineColors.active;
  const getNodeColor = (state: NodeState) => stateColors[state] ?? stateColors.active;

  const getNodePosition = (node: Node, index: number, total: number) => {
    const angle = (index * (Math.PI * 2)) / total - Math.PI / 2;
    const fallbackRadius = 40;
    const fallbackX = 50 + fallbackRadius * Math.cos(angle);
    const fallbackY = 50 + fallbackRadius * Math.sin(angle);

    return {
      x: typeof node.x === 'number' ? node.x : fallbackX,
      y: typeof node.y === 'number' ? node.y : fallbackY,
    };
  };
  
  const renderIcon = (state: NodeState) => {
    switch(state) {
      case 'critical': return <Activity className="w-5 h-5 animate-bounce" />;
      case 'isolated': 
      case 'isolated-danger': return <PowerOff className="w-5 h-5" />;
      case 'reconstructing': return <Zap className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-brand-bg/50 rounded-2xl border border-brand-border/40 overflow-hidden glass-card p-20">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      {!safeNodes.length && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="px-4 py-2 rounded-xl bg-slate-900/85 border border-brand-border/60 text-slate-300 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            Topology data unavailable
          </div>
        </div>
      )}
      
      {title && (
         <div className="absolute top-6 left-8 z-20">
           <h3 className="font-heading font-semibold text-white/80">{title}</h3>
         </div>
      )}

      {/* Circular Layout Wrapper */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-20">
        <div className="relative w-full h-full max-h-[500px] max-w-[500px] aspect-square pointer-events-none">
          {/* Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {safeNodes.map((node, i) => {
              const { x, y } = getNodePosition(node, i, safeNodes.length || 1);
              const dx = x - 50;
              const dy = y - 50;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              // Match the visual core radius (w-24 => 96px) inside a 500px SVG box (~9.6%).
              // Slightly inside ensures the line appears to emerge exactly at the edge.
              const innerRadius = 9.5;
              const startX = 50 + (dx / distance) * innerRadius;
              const startY = 50 + (dy / distance) * innerRadius;

              return (
                <line 
                  key={`line-${node.id}`}
                  x1={`${startX}%`} 
                  y1={`${startY}%`} 
                  x2={`${x}%`} 
                  y2={`${y}%`} 
                  className={`${getLineColor(node.state)} transition-all duration-1000`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              );
            })}
            {/* Data flow animations */}
            {safeNodes.map((node, i) => {
              if (node.state === 'isolated' || node.state === 'isolated-danger' || node.state === 'critical') return null;
              const { x, y } = getNodePosition(node, i, safeNodes.length || 1);
              return (
                <motion.circle
                  key={`particle-${node.id}`}
                  r="3"
                  fill={node.state === 'reconstructing' ? '#3EA6FF' : '#6BD3FF'}
                  className="drop-shadow-[0_0_5px_rgba(107,211,255,0.8)]"
                  animate={{
                    cx: ["50%", `${x}%`],
                    cy: ["50%", `${y}%`],
                  }}
                  transition={{
                    duration: node.state === 'reconstructing' ? 1.5 : 2.5 + Math.random(),
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              );
            })}
          </svg>

          {/* Nodes Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            
            {/* Central Core */}
            <div 
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-24 rounded-full border-2 flex items-center justify-center shadow-[0_0_30px_rgba(62,166,255,0.2)] bg-brand-card ${
                coreState === 'critical' ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse' : 'border-brand-primary'
              }`}
            >
               <ShieldAlert className={`w-10 h-10 ${coreState === 'critical' ? 'text-red-500' : 'text-brand-primary'}`} />
               <span className="absolute -bottom-8 font-heading text-xs font-semibold whitespace-nowrap text-slate-300">
                 Sentinel Core
               </span>
            </div>

            {/* Distributed Nodes */}
            {safeNodes.map((node, i) => {
              const { x, y } = getNodePosition(node, i, safeNodes.length || 1);
              return (
                <div 
                  key={node.id}
                  className="absolute flex flex-col items-center justify-center gap-2 pointer-events-auto transition-all duration-500 hover:scale-110 cursor-pointer"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${getNodeColor(node.state)} transition-colors duration-500`}>
                    {renderIcon(node.state)}
                  </div>
                  
                  <div className={`px-2 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap bg-brand-card/80 backdrop-blur-sm ${
                    (node.state === 'critical' || node.state === 'isolated-danger') ? 'border-red-500 text-red-400' : 'border-brand-border/50 text-slate-400'
                  }`}>
                    <div className="font-bold text-white mb-0.5">{node.label}</div>
                    <div>Health: {node.health}%</div>
                    {node.state === 'reconstructing' && <div className="text-brand-primary animate-pulse mt-0.5">Rebuilding...</div>}
                    {(node.state === 'isolated' || node.state === 'isolated-danger') && <div className="text-red-400 mt-0.5 font-bold">OFFLINE</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {message && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
           {message}
        </div>
      )}
    </div>
  );
}
