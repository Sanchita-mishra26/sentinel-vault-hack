import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";

export function Auth() {
  const location = useLocation();
  const initialMode = location.state?.mode === "signup" ? false : true;

  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMFALocked, setIsMFALocked] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [toastMsg, setToastMsg] = useState<{msg: string; type: 'warning' | 'critical' | 'error' | null}>({msg: '', type: null});
  const navigate = useNavigate();

  const playBeep = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isLogin) {
      navigate("/app/dashboard");
      return;
    }

    if (isMFALocked) {
      if (mfaCode === "123456") {
        navigate("/app/dashboard");
      } else {
        setToastMsg({ msg: '❌ Authentication Failed. IP Logged.', type: 'error' });
      }
      return;
    }

    try {
      const { login } = await import('../../../services/api');
      const res = await login({ email, password });
      
      if (res.data.success && res.data.role) {
        // Successful login
        navigate("/app/dashboard");
        return;
      }
      
      if (res.data.triggerMFA) {
        setIsMFALocked(true);
        playBeep();
        
        // Background AI IP Analysis
        const currentIp = email === 'admin@sentinel.com' ? '103.44.11.2' : '192.168.1.5';
        const lastIp = email === 'admin@sentinel.com' ? '192.168.1.1' : '192.168.1.5';
        
        import('../../../services/api').then(({ analyzeIp }) => {
          analyzeIp({ email, current_ip: currentIp, last_ip: lastIp }).then((aiRes) => {
             if (aiRes.data && aiRes.data.analysis) {
               const { threatLevel, reasoning } = aiRes.data.analysis;
               // Overwrite toast message with intelligent output
               setToastMsg({ msg: `[AI WARNING] Threat Level: ${threatLevel} - ${reasoning}`, type: 'critical' });
             }
          }).catch(console.error);
        });

        if (res.data.alertType === 'dual_alert_triggered' || res.data.alertType === 'admin_notified') {
          setToastMsg({ msg: '⚠️ [SYSTEM] Unauthorized access flagged. Live Admin Dashboard alerted & SMS warning dispatched.', type: 'warning' });
        } else if (res.data.alertType === 'sms_sent') {
          setToastMsg({ msg: '🚨 [CRITICAL] Admin credentials failed. MFA SMS sent to 8377891315.', type: 'critical' });
        } else {
          setToastMsg({ msg: '⚠️ [SYSTEM] Unauthorized access flagged. MFA Required.', type: 'warning' });
        }
      } else {
        setToastMsg({ msg: '❌ Invalid credentials.', type: 'error' });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('DDoS')) {
        setToastMsg({ msg: err.message, type: 'error' });
      } else {
        setToastMsg({ msg: '❌ Authentication server offline or refused connection.', type: 'error' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">

      {/* Top Navigation */}
      <nav className="flex items-center px-6 py-4">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group text-sm"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Home</span>
        </NavLink>
      </nav>

      {/* Main Section */}
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-5xl glass-card rounded-[32px] overflow-hidden flex flex-col lg:flex-row relative">

          {/* Left Illustration */}
          <div className="hidden lg:flex w-full lg:w-1/2 min-h-[420px] relative bg-brand-bg/50 items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-border/30">

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10 w-64 h-64 flex items-center justify-center"
            >
              <div className="absolute w-full h-full rounded-full border border-brand-primary/20 animate-spin" />
              <div className="absolute w-[120%] h-[120%] rounded-full border border-brand-accent/20 animate-spin" />

              <Shield className="w-32 h-32 text-brand-primary drop-shadow-[0_0_30px_rgba(62,166,255,0.8)] z-20" />
              <Lock className="w-12 h-12 text-brand-bg absolute z-30 opacity-80" />
            </motion.div>

          </div>

          {/* Right Form */}
          <div className="w-full lg:w-1/2 bg-brand-card/80 px-6 sm:px-10 py-8 flex flex-col">

            <div className="max-w-md w-full mx-auto space-y-8 max-h-[520px] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              {/* Logo */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/30">
                    <Shield className="text-brand-primary w-6 h-6 absolute" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-2">
                  Welcome to Sentinel
                </h2>

                <p className="text-slate-400 text-sm">
                  Secure access to the distributed data vault.
                </p>
                {toastMsg.msg && (
                  <div className={`mt-4 p-3 rounded-lg text-sm font-semibold border text-left ${
                    toastMsg.type === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                    toastMsg.type === 'warning' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                    'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {toastMsg.msg}
                  </div>
                )}
              </div>

              {/* Toggle Login/Signup */}
              <div className="flex bg-brand-bg/60 p-1 rounded-xl border border-brand-border/40 sticky top-0 z-10">

                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isLogin
                      ? "bg-brand-primary/20 text-brand-primary"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>

                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    !isLogin
                      ? "bg-brand-primary/20 text-brand-primary"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>

              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5 pt-4">

                {!isLogin && (
                  <div>
                    <label className="text-xs text-slate-400">Full Name</label>

                    <div className="relative mt-1">
                      <User className="w-5 h-5 absolute left-3 top-3 text-slate-500" />

                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 pl-10 pr-4 text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400">Email</label>

                  <div className="relative mt-1">
                    <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-500" />

                    <input
                      type="email"
                      placeholder="admin@sentinel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isMFALocked}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 pl-10 pr-4 text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {!isMFALocked ? (
                  <div>
                    <label className="text-xs text-slate-400">Password</label>

                    <div className="relative mt-1">
                      <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-500" />

                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 pl-10 pr-4 text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-red-400 font-bold">MFA Required</label>
                    <div className="relative mt-1">
                      <Shield className="w-5 h-5 absolute left-3 top-3 text-red-500 animate-pulse" />
                      <input
                        type="text"
                        placeholder="Enter 6-Digit MFA Authenticator Code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="w-full bg-red-950/20 border border-red-500/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-red-500/50 focus:border-red-500 focus:outline-none focus:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-shadow"
                      />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="text-xs text-slate-400">
                      Confirm Password
                    </label>

                    <div className="relative mt-1">
                      <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-500" />

                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-3 pl-10 pr-4 text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 mt-4 rounded-xl bg-brand-primary text-brand-bg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  {isLogin ? "Access System" : "Initialize Account"}
                </button>

                {!isLogin && (
                  <div className="pt-4 text-center text-xs text-slate-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-brand-primary hover:underline font-semibold"
                    >
                      Sign In
                    </button>
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}