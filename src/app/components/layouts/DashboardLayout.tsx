import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  Shield, 
  LayoutDashboard, 
  UploadCloud, 
  Server, 
  Activity, 
  BrainCircuit, 
  Bell, 
  UserCircle,
  AlertTriangle, // <-- Added for the alert toast
  X             // <-- Added for the alert toast
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { io } from "socket.io-client"; // <-- Import Socket.io

// Initialize Socket outside component to prevent multiple connections
const socket = io("http://localhost:5000"); 

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/app", end: true },
  { label: "Upload File", icon: UploadCloud, path: "/app/upload" },
  { label: "AI Intelligence", icon: BrainCircuit, path: "/app/process" },
  { label: "Security Monitor", icon: Activity, path: "/app/attack" },
  { label: "Node Manager", icon: Server, path: "/app/reconstruction" },
];

export default function DashboardLayout() {
  const location = useLocation();
  
  // <-- NEW: State to hold our live alert data
  const [liveAlert, setLiveAlert] = useState<any>(null);

  // <-- NEW: Socket Connection & Audio Trigger
  useEffect(() => {
    // Join the secure room
    socket.emit("join_admin_room");

    // Listen for the specific alert event from the backend
    socket.on("security_alert", (data) => {
      console.log("🚨 ALERT RECEIVED VIA WEBSOCKET:", data);
      
      // 1. Play the Audio Alarm
      const audio = new Audio("/src/assets/mixkit-security-facility-breach-alarm-994.wav");
      audio.volume = 0.8; // Set volume (0.0 to 1.0)
      audio.play().catch(e => console.error("Audio blocked by browser:", e));

      // 2. Trigger the UI Alert
      setLiveAlert(data);

      // Optional: Auto-hide the alert after 8 seconds
      setTimeout(() => {
        setLiveAlert(null);
      }, 8000);
    });

    // Cleanup on unmount
    return () => {
      socket.off("security_alert");
    };
  }, []);

  // Determine system status based on path (or override if live alert happens!)
  let systemStatus = liveAlert ? "COMPROMISED" : "ACTIVE";
  let systemStatusColor = liveAlert ? "text-[#EF4444]" : "text-[#34D399]";
  let threatLevel = liveAlert ? "CRITICAL" : "LOW";
  let threatLevelColor = liveAlert ? "text-[#EF4444]" : "text-[#34D399]";
  let nodesOnline = 5;

  if (!liveAlert && (location.pathname.includes("/attack") || location.pathname.includes("/isolation"))) {
    systemStatus = "COMPROMISED";
    systemStatusColor = "text-[#EF4444]";
    threatLevel = "CRITICAL";
    threatLevelColor = "text-[#EF4444]";
    nodesOnline = 4;
  } else if (!liveAlert && location.pathname.includes("/reconstruction")) {
    systemStatus = "RECOVERING";
    systemStatusColor = "text-[#F59E0B]";
    threatLevel = "ELEVATED";
    threatLevelColor = "text-[#F59E0B]";
    nodesOnline = 5;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-200 font-['Sora',sans-serif] flex flex-col selection:bg-[#3EA6FF]/30 relative overflow-hidden">
      
      {/* --- NEW: LIVE ALERT TOAST NOTIFICATION --- */}
      {liveAlert && (
        <div className="fixed top-20 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-[#450a0a] border border-red-500 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.4)] p-4 w-[400px] flex items-start gap-4 backdrop-blur-md">
            <div className="bg-red-500/20 p-2 rounded-full mt-1 border border-red-500/50">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-500 font-bold text-lg mb-1 tracking-wider">THREAT DETECTED</h3>
              <p className="text-slate-200 text-sm mb-3">
                <span className="font-semibold text-white">{liveAlert.action}</span> attempted by user: 
                <span className="font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 mx-1 rounded border border-red-500/30">
                  {liveAlert.user}
                </span>
              </p>
              <div className="flex justify-between items-center text-xs font-mono bg-[#280505] p-2 rounded border border-red-900/50">
                <span className="text-red-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> DTS: {liveAlert.threatScore}
                </span>
                <span className="text-slate-400">{liveAlert.timestamp}</span>
              </div>
            </div>
            <button onClick={() => setLiveAlert(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* ---------------------------------------- */}

      {/* Top Header */}
      <header className="h-16 border-b border-[#1F3B73]/50 bg-[#0B1220]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg tracking-wide">
            <Shield className="w-6 h-6 text-[#3EA6FF]" fill="#3EA6FF" fillOpacity={0.2} />
            SENTINEL-VAULT
          </div>
          
          <div className="hidden md:flex items-center gap-6 ml-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">System Status:</span>
              <span className={cn("font-semibold font-mono transition-colors duration-300", systemStatusColor)}>{systemStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Threat Level:</span>
              <span className={cn("font-semibold font-mono transition-colors duration-300", threatLevelColor)}>{threatLevel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Nodes Online:</span>
              <span className="font-semibold text-white">{nodesOnline}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
            <Bell className={cn("w-5 h-5 transition-colors duration-300", liveAlert ? "text-red-500" : "")} />
            {/* Make the notification dot pulse red if there is an alert */}
            <span className={cn(
              "absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse",
              liveAlert ? "bg-red-500 shadow-[0_0_8px_#EF4444]" : "bg-[#3EA6FF] shadow-[0_0_8px_#3EA6FF]"
            )} />
          </button>
          <div className="h-8 w-px bg-[#1F3B73]" />
          <button className="flex items-center gap-2 text-sm font-medium hover:text-white transition-colors">
            <UserCircle className="w-8 h-8 text-slate-400" />
            <span className="hidden sm:block">Admin</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#1F3B73]/50 bg-[#0B1220]/50 backdrop-blur-sm flex-shrink-0 hidden lg:block overflow-y-auto">
          <nav className="p-4 space-y-2">
            {SIDEBAR_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-[#1F3B73]/30 text-[#3EA6FF] shadow-[inset_0_0_20px_rgba(62,166,255,0.1)] border border-[#3EA6FF]/20"
                      : "text-slate-400 hover:bg-[#1F3B73]/10 hover:text-white"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative p-4 md:p-6 lg:p-8 bg-gradient-to-br from-[#0B1220] to-[#0F1E3D]">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1F3B73 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
          
          {/* Red Alert Overlay - Pulses slightly when under attack */}
          <div className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            liveAlert ? "opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent animate-pulse" : "opacity-0"
          )} />

          <div className="relative z-10 max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Add a quick style for the slide-in animation directly here for convenience */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
