import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, HardDrive, AlertOctagon, CheckCircle2, Clock, Activity, Zap, Target, Server, Network, AlertTriangle } from 'lucide-react';
import { NetworkMap, NodeState } from '../NetworkMap';
import { AIAssistant } from '../AIAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceDot } from 'recharts';

const initialLogs = [
  { time: '12:05', msg: 'AES encryption applied to file-a.pdf', status: 'success' },
  { time: '12:02', msg: 'Sharding completed. 4 fragments created.', status: 'info' },
  { time: '11:45', msg: 'Node 2 latency spike detected (resolved).', status: 'warning' },
  { time: '11:30', msg: 'All remaining nodes synchronized.', status: 'success' },
  { time: '11:15', msg: 'Daily integrity scan completed.', status: 'info' },
  { time: '10:50', msg: 'New user authenticated.', status: 'info' },
];

const initialNodes = [
  { id: '1', label: 'Node 1', state: 'active', health: 100, x: 20, y: 30 },
  { id: '2', label: 'Node 2', state: 'active', health: 98, x: 80, y: 30 },
  { id: '3', label: 'Node 3', state: 'active', health: 100, x: 85, y: 75 },
  { id: '4', label: 'Node 4', state: 'active', health: 95, x: 50, y: 90 },
  { id: '5', label: 'Node 5', state: 'active', health: 99, x: 15, y: 75 },
] as any[];

const baseActivityData = [
  { time: '10:00', events: 12 },
  { time: '10:30', events: 15 },
  { time: '11:00', events: 8 },
  { time: '11:30', events: 22 },
  { time: '12:00', events: 14 },
  { time: '12:30', events: 14 },
];

const streamLogMessages = [
  'Encryption cycle completed',
  'Node synchronization successful',
  'Threat scan running...',
  'Replication checksum validated',
  'Telemetry heartbeat stable',
  'AI signature model refreshed',
];

const allowedNodeStates: NodeState[] = ['active', 'warning', 'critical', 'isolated', 'isolated-danger', 'reconstructing'];
const normalizeNodeState = (state?: string): NodeState =>
  allowedNodeStates.includes(state as NodeState) ? (state as NodeState) : 'active';

export function Dashboard() {
  const [attackState, setAttackState] = useState<'idle' | 'attacked' | 'isolated' | 'recovering' | 'recovered'>('idle');
  const [logs, setLogs] = useState(initialLogs);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [attackTargetNodeId, setAttackTargetNodeId] = useState<string>('3');
  const [lineFlicker, setLineFlicker] = useState(false);
  const [typingCursorVisible, setTypingCursorVisible] = useState(true);
  const [aiStatusMessage, setAiStatusMessage] = useState('🤖 AI Monitoring: All systems secure');
  const [nodeHealth, setNodeHealth] = useState<Record<string, number>>(() =>
    initialNodes.reduce((acc, node) => {
      acc[node.id] = node.health;
      return acc;
    }, {} as Record<string, number>),
  );
  const [countedStats, setCountedStats] = useState({ filesSecured: 0, activeNodes: 0, integrity: 0 });
  const [activityData, setActivityData] = useState(baseActivityData);
  const [activeThreatIndex, setActiveThreatIndex] = useState<number>(-1);
  const [activityTrackerIndex, setActivityTrackerIndex] = useState(0);
  const countedStatsRef = useRef(countedStats);

  // NEW: Real data from backend
  const [realStats, setRealStats] = useState<{ filesSecured: number; totalShards: number; activeNodes: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const attackTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const baseNodes = Array.isArray(initialNodes) ? initialNodes : [];

  useEffect(() => {
    countedStatsRef.current = countedStats;
  }, [countedStats]);

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats');
        if (!res.ok) {
          throw new Error(`Stats request failed with status ${res.status}`);
        }
        const data = await res.json();
        console.log('Dashboard stats:', data);
        setRealStats(prev => {
          const fallback = prev ?? { filesSecured: 0, totalShards: 0, activeNodes: baseNodes.length || 0 };
          return {
            filesSecured: typeof data?.filesSecured === 'number' ? data.filesSecured : fallback.filesSecured,
            totalShards: typeof data?.totalShards === 'number' ? data.totalShards : fallback.totalShards,
            activeNodes: typeof data?.activeNodes === 'number' ? data.activeNodes : fallback.activeNodes,
          };
        });
        setIsLoadingStats(false);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setIsLoadingStats(false);
      }
    };

    fetchStats();
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const playBeep = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  };

  useEffect(() => {
    if (attackState === 'attacked') {
      let count = 0;
      playBeep();
      count++;
      beepIntervalRef.current = setInterval(() => {
        if (count < 3) {
          playBeep();
          count++;
        } else {
          if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
        }
      }, 1000);
    } else {
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    }
    return () => {
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    };
  }, [attackState]);

  useEffect(() => {
    if (attackState === 'isolated') {
      const t = setTimeout(() => {
        setAttackState('recovering');
        addLog('Initiating self-healing distributed recovery...', 'info');
      }, 900);
      return () => clearTimeout(t);
    } else if (attackState === 'recovering') {
      const t = setTimeout(() => {
        setAttackState('recovered');
        addLog('Self-Healing Recovery Successful. System Integrity Restored.', 'success');
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [attackState]);

  useEffect(() => {
    if (attackState === 'attacked' || attackState === 'isolated' || attackState === 'recovering') {
      setAiStatusMessage('🤖 AI Decision: Node isolated to prevent breach');
      return;
    }
    if (attackState === 'recovered') {
      setAiStatusMessage('🤖 AI Status: System stabilized');
      const t = setTimeout(() => {
        setAiStatusMessage('🤖 AI Monitoring: All systems secure');
      }, 2600);
      return () => clearTimeout(t);
    }
    setAiStatusMessage('🤖 AI Monitoring: All systems secure');
  }, [attackState]);

  useEffect(() => {
    const t = setInterval(() => {
      setNodeHealth(prev => {
        const next: Record<string, number> = { ...prev };
        for (const node of baseNodes) {
          const delta = Math.random() > 0.5 ? 1 : -1;
          const baseline = prev[node.id] ?? node.health;
          next[node.id] = Math.max(92, Math.min(100, baseline + delta));
        }
        return next;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const msg = streamLogMessages[Math.floor(Math.random() * streamLogMessages.length)];
      addLog(msg, msg.includes('Threat') ? 'warning' : 'info');
    }, 4600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!logsContainerRef.current) return;
    logsContainerRef.current.scrollTop = 0;
  }, [logs]);

  useEffect(() => {
    const t = setInterval(() => {
      setTypingCursorVisible(v => !v);
    }, 550);
    return () => clearInterval(t);
  }, []);

  const activityLength = Array.isArray(activityData) && activityData.length ? activityData.length : baseActivityData.length || 1;

  useEffect(() => {
    const t = setInterval(() => {
      setActivityData(prev => {
        const safePrev = Array.isArray(prev) && prev.length ? prev : baseActivityData;
        return safePrev.map((point, idx) => {
          const spike = attackState === 'attacked' && idx >= safePrev.length - 2 ? 20 : 0;
          const delta = Math.floor(Math.random() * 5) - 2;
          return {
            ...point,
            events: Math.max(6, Math.min(95, point.events + delta + spike)),
          };
        });
      });
    }, 3200);
    return () => clearInterval(t);
  }, [attackState]);

  useEffect(() => {
    const t = setInterval(() => {
      setActivityTrackerIndex(prev => (activityLength ? (prev + 1) % activityLength : 0));
    }, 1800);
    return () => clearInterval(t);
  }, [activityLength]);

  useEffect(() => {
    attackTimersRef.current.forEach(clearTimeout);
    attackTimersRef.current = [];
    return () => {
      attackTimersRef.current.forEach(clearTimeout);
      attackTimersRef.current = [];
    };
  }, []);

  const addLog = (msg: string, status: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setLogs(prev => {
      const safePrev = Array.isArray(prev) ? prev : initialLogs;
      return [{ time, msg, status }, ...safePrev.slice(0, 9)];
    });
  };

  const handleSimulate = () => {
    if (!baseNodes.length) {
      addLog('No nodes available for simulation.', 'warning');
      return;
    }
    const target = baseNodes[Math.floor(Math.random() * baseNodes.length)];
    if (!target) {
      addLog('Unable to select target node.', 'warning');
      return;
    }
    setAttackTargetNodeId(target.id);
    setLineFlicker(true);
    setSelectedNodeId(target.id);
    setAttackState('attacked');
    addLog(`🚨 Threat detected on ${target.label}`, 'error');
    addLog('🤖 AI isolating node...', 'warning');

    const isolateTimer = setTimeout(() => {
      setAttackState('isolated');
      setLineFlicker(false);
      addLog('🔁 Redistributing shards...', 'info');
    }, 800);

    attackTimersRef.current.push(isolateTimer);
  };

  const handleIsolate = () => {
    setAttackState('isolated');
    addLog('Node 3 isolated. Protocol activated.', 'info');
  };

  const getLogColor = (status: string) => {
    if (status === 'success') return 'bg-green-500/10 text-green-400 border border-green-500/20';
    if (status === 'warning') return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    if (status === 'error') return 'bg-red-500/10 text-red-400 border border-red-500/20';
    return 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20';
  };

  const normalizedNodes = baseNodes.map((n, idx) => ({
    ...n,
    id: n.id ?? String(idx + 1),
    label: n.label ?? `Node ${idx + 1}`,
    state: normalizeNodeState((n as any).state),
    health: typeof n.health === 'number' ? n.health : 100,
    x: typeof n.x === 'number' ? n.x : 50,
    y: typeof n.y === 'number' ? n.y : 50,
  }));

  const currentNodes = normalizedNodes.map(n => {
    let node = { ...n, health: nodeHealth[n.id] ?? n.health };

    // Attack simulation effects on a targeted node
    if (node.id === attackTargetNodeId) {
      if (attackState === 'attacked') node = { ...node, state: 'critical', health: 45 };
      else if (attackState === 'isolated') node = { ...node, state: 'isolated-danger', health: 0 };
      else if (attackState === 'recovering') node = { ...node, state: 'reconstructing', health: 60 };
      else if (attackState === 'recovered') node = { ...node, state: 'active', health: 100 };
    }

    return node;
  });

  const totalNodeCount = normalizedNodes.length || 0;
  const activeNodesCount = attackState === 'isolated' || attackState === 'recovering' ? Math.max(totalNodeCount - 1, 0) : totalNodeCount;
  const activeNodes = activeNodesCount.toString();
  const alertsColor = attackState === 'attacked' ? 'text-red-500' : 'text-yellow-400';
  const integrity = attackState === 'attacked' ? '65%' : (attackState === 'recovering' ? '85%' : '100%');
  const integrityColor = attackState === 'attacked' ? 'text-red-500' : (attackState === 'recovering' ? 'text-yellow-400' : 'text-green-400');

  useEffect(() => {
    const start = countedStatsRef.current;
    const target = {
      filesSecured: realStats?.filesSecured ?? start.filesSecured,
      activeNodes: Number(activeNodes) || start.activeNodes,
      integrity: Number(integrity.replace('%', '')) || start.integrity,
    };
    let step = 0;
    const steps = 20;

    const t = setInterval(() => {
      step += 1;
      const p = step / steps;
      setCountedStats({
        filesSecured: Math.round(start.filesSecured + (target.filesSecured - start.filesSecured) * p),
        activeNodes: Math.round(start.activeNodes + (target.activeNodes - start.activeNodes) * p),
        integrity: Math.round(start.integrity + (target.integrity - start.integrity) * p),
      });
      if (step >= steps) clearInterval(t);
    }, 28);

    return () => clearInterval(t);
  }, [activeNodes, integrity, realStats]);

  const stats = [
    { label: 'Files Secured', value: isLoadingStats ? '...' : countedStats.filesSecured.toString(), icon: ShieldCheck, color: 'text-brand-primary' },
    { label: 'Total Shards', value: isLoadingStats ? '...' : (realStats?.totalShards ?? 0).toString(), icon: Server, color: 'text-emerald-400' },
    { label: 'Active Nodes', value: countedStats.activeNodes.toString(), icon: HardDrive, color: 'text-brand-accent' },
    { label: 'Threat Level', value: attackState === 'attacked' ? 'CRITICAL' : (attackState === 'isolated' || attackState === 'recovering' ? 'ELEVATED' : 'LOW'), icon: AlertOctagon, color: alertsColor },
  ];

  const pieData = [
    { name: 'Safe', value: attackState === 'attacked' ? 4 : (attackState === 'isolated' || attackState === 'recovering' ? 4 : 5), color: '#4ADE80' },
    { name: 'Suspicious', value: attackState === 'recovering' ? 1 : 0, color: '#FACC15' },
    { name: 'Compromised', value: attackState === 'attacked' || attackState === 'isolated' ? 1 : 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const totalThreatNodes = pieData.reduce((acc, item) => acc + item.value, 0) || 1;
  const safePercent = Math.round(((pieData.find(item => item.name === 'Safe')?.value ?? 0) / totalThreatNodes) * 100);
  const atRiskPercent = 100 - safePercent;
  const safeActivityData = Array.isArray(activityData) && activityData.length ? activityData : baseActivityData;
  const trackerPoint = safeActivityData[Math.min(activityTrackerIndex, Math.max(safeActivityData.length - 1, 0))];
  const safeLogs = Array.isArray(logs) ? logs : initialLogs;

  return (
    <div className="flex flex-col gap-6 relative min-h-full pb-6">
      {/* ENHANCED: System Status Bar at Top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 bg-gradient-to-r from-slate-950/90 via-brand-bg/80 to-slate-900/90 border border-brand-border/60"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/15 border border-brand-primary/40 flex items-center justify-center">
              <Network className="w-5 h-5 text-brand-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-heading font-bold text-white">Sentinel Vault Control Panel</h2>
              <p className="text-[10px] text-slate-400">Real-time system monitoring active</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-2 bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:scale-105 transition-transform cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              System Active
            </motion.span>
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              className="text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-2 bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:scale-105 transition-transform cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              Nodes Online
            </motion.span>
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              className={`text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer ${
                attackState === 'attacked'
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${attackState === 'attacked' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]'}`} />
              {attackState === 'attacked' ? 'Threat Critical' : 'Threat Low'}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* ALERTS SYSTEM OVERLAY */}
      <AnimatePresence>
        {attackState === 'attacked' && (
          <motion.div
            key="attacked-alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.5)] flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertOctagon className="w-8 h-8 text-red-500 animate-bounce" />
              </div>
              <span className="font-heading font-bold text-red-500 text-xl tracking-wide uppercase">AI ALERT: Anomaly detected in Node 3</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleIsolate}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-red-500/50"
            >
              Activate Isolation Protocol
            </motion.button>
          </motion.div>
        )}

        {attackState === 'isolated' && (
          <motion.div
            key="isolated-alert"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 border border-slate-600 rounded-2xl p-6 shadow-xl flex items-center gap-4 backdrop-blur-xl"
          >
            <Activity className="w-8 h-8 text-slate-400 animate-pulse" />
            <span className="font-heading font-bold text-slate-300 text-lg">Initiating self-healing distributed recovery...</span>
          </motion.div>
        )}

        {attackState === 'recovering' && (
          <motion.div
            key="recovering-alert"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-brand-primary/20 border border-brand-primary rounded-2xl p-6 shadow-[0_0_30px_rgba(62,166,255,0.4)] flex items-center gap-4 backdrop-blur-xl"
          >
            <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
            <span className="font-heading font-bold text-brand-primary text-lg">Shard Reconstruction in Progress</span>
          </motion.div>
        )}

        {attackState === 'recovered' && (
          <motion.div
            key="recovered-alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/20 border border-green-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(74,222,128,0.3)] flex items-center gap-4 backdrop-blur-xl"
          >
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <span className="font-heading font-bold text-green-400 text-lg">Self-Healing Recovery Successful. System Integrity Restored.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: Distributed Network Topology */}
      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="glass-card rounded-2xl p-6 xl:col-span-3 bg-gradient-to-br from-slate-950/80 via-brand-bg/70 to-slate-900/80 border border-brand-border/60 relative overflow-hidden hover:shadow-[0_0_30px_rgba(62,166,255,0.15)] transition-shadow duration-300"
        >
          {attackState === 'attacked' && (
            <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
          )}

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-primary/15 border border-brand-primary/40 flex items-center justify-center">
                <Activity className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-white">
                  Distributed Network Topology
                </h2>
                <p className="text-[11px] text-slate-400">
                  Real-time view of the Sentinel vault mesh and node health.
                </p>
                <p className="text-[11px] text-brand-primary mt-1">{aiStatusMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(attackState === 'idle' || attackState === 'recovered') && (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSimulate}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 border border-red-500/40 text-red-300 flex items-center gap-1.5 hover:bg-red-500/20 transition-colors"
                >
                  <Target className="w-3 h-3" />
                  Simulate Attack
                </motion.button>
              )}
              <span
                className={`text-[11px] px-3 py-1 rounded-full border flex items-center gap-2 ${
                  attackState === 'attacked'
                    ? 'bg-red-500/10 border-red-500/40 text-red-300'
                    : attackState === 'recovering' || attackState === 'isolated'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    attackState === 'attacked'
                      ? 'bg-red-500'
                      : attackState === 'recovering' || attackState === 'isolated'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                {attackState === 'attacked'
                  ? 'Threat Level: DETECTED'
                  : attackState === 'recovering' || attackState === 'isolated'
                  ? 'Threat Level: ELEVATED'
                  : 'Threat Level: LOW'}
              </span>
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-brand-border/50 bg-gradient-to-b from-slate-950/70 via-brand-bg/60 to-slate-900/80 overflow-hidden relative">
            {/* Sentinel core overlays */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="w-28 h-28 rounded-full border border-brand-primary/25 animate-[spin_9s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-brand-accent/30 animate-[spin_6s_linear_infinite_reverse]" />
              <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-xl animate-pulse" />
            </div>

            {/* Line flicker during attacks */}
            {lineFlicker && (
              <div className="absolute inset-0 z-10 pointer-events-none opacity-25 animate-pulse bg-[repeating-linear-gradient(115deg,rgba(239,68,68,0.45)_0px,rgba(239,68,68,0.45)_2px,transparent_2px,transparent_8px)]" />
            )}

            {/* Extra data-flow particles */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {currentNodes.map((node, idx) => (
                <motion.div
                  key={`flow-${node.id}`}
                  className="absolute w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(62,166,255,0.95)]"
                  initial={{ left: '50%', top: '50%', opacity: 0 }}
                  animate={{
                    left: ['50%', `${node.x}%`],
                    top: ['50%', `${node.y}%`],
                    opacity: [0, 1, 0.2],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: idx * 0.12,
                  }}
                />
              ))}
            </div>

            <NetworkMap
              nodes={currentNodes}
              coreState={attackState === 'attacked' ? 'critical' : 'active'}
              message={
                <span className="text-xs px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary">
                  Live Mesh Telemetry Enabled
                </span>
              }
            />

            {/* Interactive node telemetry hotspots */}
            <div className="absolute inset-0 z-20">
              {currentNodes.map((node) => {
                const isHighlighted = hoveredNodeId === node.id || selectedNodeId === node.id;
                const latency = 16 + Number(node.id) * 5 + (100 - node.health);
                const load = Math.min(96, 32 + Number(node.id) * 9 + (100 - node.health));
                const status = node.health > 96 ? 'Active' : 'Idle';

                return (
                  <React.Fragment key={`hotspot-${node.id}`}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 1.1 }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId((prev) => (prev === node.id ? null : prev))}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-brand-primary/40 border border-brand-primary shadow-[0_0_20px_rgba(62,166,255,0.8)]'
                          : node.state === 'critical'
                          ? 'bg-red-500/40 border border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.65)]'
                          : 'bg-emerald-400/40 border border-emerald-300/70 shadow-[0_0_12px_rgba(74,222,128,0.65)]'
                      }`}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      aria-label={`Inspect ${node.label}`}
                    >
                      <span className={`absolute inset-0 rounded-full ${node.state === 'critical' ? 'bg-red-500/40' : 'bg-emerald-300/30'} animate-ping`} />
                    </motion.button>

                    {(hoveredNodeId === node.id || selectedNodeId === node.id) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute rounded-lg border border-brand-primary/40 bg-slate-950/90 backdrop-blur px-3 py-2 text-[10px] text-slate-200 shadow-[0_10px_35px_rgba(2,6,23,0.8)]"
                        style={{ left: `${Math.min(node.x + 3, 86)}%`, top: `${Math.max(node.y - 12, 10)}%` }}
                      >
                        <p className="font-semibold text-white mb-1">{node.label}</p>
                        <p>Latency: {latency}ms</p>
                        <p>Load: {load}%</p>
                        <p>Status: {status}</p>
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 3: AI Security Monitoring Panel */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="glass-card rounded-2xl p-6 bg-gradient-to-br from-slate-950/85 via-brand-bg/80 to-slate-900/85 border border-brand-border/60 space-y-5 hover:shadow-[0_0_30px_rgba(62,166,255,0.1)] transition-shadow duration-300"
      >
        {/* High-level stats with loading skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingStats ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, idx) => (
              <motion.div
                key={`skeleton-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative rounded-2xl bg-white/5 border border-white/10 px-4 py-3 h-20"
              >
                <div className="h-3 bg-slate-700/50 rounded w-20 mb-2" />
                <div className="h-6 bg-slate-700/50 rounded w-12" />
              </motion.div>
            ))
          ) : (
            stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02, boxShadow: '0 14px 26px rgba(15,23,42,0.45)' }}
                transition={{ delay: idx * 0.05 }}
                className="relative rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between overflow-hidden transition-all duration-300 cursor-pointer"
              >
                {attackState === 'attacked' && stat.label === 'Threat Level' && (
                  <div className="absolute inset-0 bg-red-500/10 pointer-events-none" />
                )}
                <div className="relative z-10">
                  <p className="text-[11px] font-semibold text-slate-400 mb-0.5">
                    {stat.label}
                  </p>
                  <motion.p
                    animate={stat.label !== 'Threat Level' ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`text-lg font-heading font-bold ${
                      stat.label === 'Threat Level' ? stat.color : 'text-white'
                    }`}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="relative z-10 p-2 rounded-xl bg-slate-900/70 border border-slate-700/80"
                >
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </motion.div>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Security Event Log */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-slate-950/60 border border-brand-border/70 p-4 flex flex-col hover:shadow-[0_0_20px_rgba(62,166,255,0.1)] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-accent" />
                <h3 className="text-sm font-heading font-semibold text-white">
                  Security Event Log
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Last 10 events {typingCursorVisible ? '|' : ' '}</span>
            </div>
            <div ref={logsContainerRef} className="flex-1 max-h-64 overflow-y-auto space-y-3 pr-1 scroll-smooth">
              {safeLogs.length === 0 && (
                <div className="text-xs text-slate-500 px-3 py-2 border border-dashed border-brand-border/50 rounded-xl bg-brand-bg/60">
                  No log entries available.
                </div>
              )}
              {safeLogs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex gap-3 rounded-xl px-3 py-2.5 text-xs bg-brand-bg/70 border transition-all hover:scale-[1.02] cursor-pointer ${
                    log.status === 'error'
                      ? 'border-red-500/40 bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : log.status === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/5 hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                      : 'border-brand-border/40 hover:bg-brand-primary/5 hover:shadow-[0_0_15px_rgba(62,166,255,0.1)]'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {log.time}
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    <p
                      className={`leading-snug ${
                        log.status === 'error'
                          ? 'text-red-200'
                          : log.status === 'warning'
                          ? 'text-amber-100'
                          : 'text-slate-100'
                      }`}
                    >
                      {log.msg}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${getLogColor(
                        log.status,
                      )}`}
                    >
                      {log.status === 'error' ? 'critical' : log.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Threat distribution */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-slate-950/60 border border-brand-border/70 p-4 flex flex-col hover:shadow-[0_0_20px_rgba(62,166,255,0.1)] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-heading font-semibold text-white">
                Threat Distribution
              </h3>
              <span className="text-[10px] text-slate-400">
                Node classification
              </span>
            </div>
            <div className="flex-1 min-h-[200px]">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="safeGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#4ADE80" />
                          <stop offset="100%" stopColor="#3EA6FF" />
                        </linearGradient>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FACC15" />
                          <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        activeIndex={activeThreatIndex}
                        activeOuterRadius={86}
                        stroke="none"
                        paddingAngle={5}
                        onMouseEnter={(_, index) => setActiveThreatIndex(index)}
                        onMouseLeave={() => setActiveThreatIndex(-1)}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.name === 'Safe' ? 'url(#safeGradient)' : 'url(#riskGradient)'}
                          />
                        ))}
                      </Pie>
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#93C5FD"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          filter: 'drop-shadow(0 0 8px rgba(62,166,255,0.65))',
                        }}
                      >
                        System Secure
                      </text>
                      <RechartsTooltip
                        formatter={() => null}
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#1E293B',
                          color: '#fff',
                          borderRadius: 12,
                        }}
                        content={({ active }) =>
                          active ? (
                            <div className="px-3 py-2 text-xs text-slate-100">
                              <p className="font-semibold">Safe: {safePercent}%</p>
                              <p>At Risk: {atRiskPercent}%</p>
                            </div>
                          ) : null
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            </div>
            <div className="flex justify-center gap-4 mt-3">
              {pieData.map((entry, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer"
                >
                  <span
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: entry.color,
                      boxShadow: `0 0 8px ${entry.color}`,
                    }}
                  />
                  {entry.name}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Activity chart */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-slate-950/60 border border-brand-border/70 p-4 flex flex-col hover:shadow-[0_0_20px_rgba(62,166,255,0.1)] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-heading font-semibold text-white">
                AI Security Activity
              </h3>
              <span className="text-[10px] text-slate-400">
                Events (last 2 hours)
              </span>
            </div>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={safeActivityData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          attackState === 'attacked' ? '#EF4444' : '#3EA6FF'
                        }
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          attackState === 'attacked' ? '#EF4444' : '#3EA6FF'
                        }
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1F2937"
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value) => [`${value} events`, 'Activity']}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1E293B',
                      color: '#fff',
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke={attackState === 'attacked' ? '#EF4444' : '#3EA6FF'}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-in-out"
                  />
                  {trackerPoint && (
                    <ReferenceDot
                      x={trackerPoint.time}
                      y={trackerPoint.events}
                      r={6}
                      fill="#3EA6FF"
                      stroke="#93C5FD"
                      strokeWidth={2}
                      ifOverflow="visible"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-brand-primary">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_10px_rgba(62,166,255,0.9)]" />
              <span>
                Live tracker: {trackerPoint?.time ?? '--:--'} • {trackerPoint?.events ?? '--'} events
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AIAssistant />
    </div>
  );
}
