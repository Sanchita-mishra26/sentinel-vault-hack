import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ScanLine,
  User,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';

function iconForEntityLabel(label: string) {
  const l = label.toLowerCase();
  if (l.includes('name')) return User;
  if (l.includes('date') || l.includes('birth')) return Calendar;
  if (l.includes('identification') || l.includes('credit') || l.includes('num')) return CreditCard;
  return Building;
}

export type ComplianceScanResult = 'sensitive' | 'safe' | null;

/**
 * Optional mock for isolated previews: scanning → then `after` result after `durationMs`.
 * Replace with real `isScanning` / `scanResult` from your API when wiring.
 */
export function useComplianceScanMock(
  durationMs = 2800,
  after: ComplianceScanResult = 'sensitive'
) {
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<ComplianceScanResult>(null);

  useEffect(() => {
    setIsScanning(true);
    setScanResult(null);
    const t = window.setTimeout(() => {
      setIsScanning(false);
      setScanResult(after);
    }, durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, after]);

  return { isScanning, scanResult };
}

export interface ComplianceCheckSectionProps {
  /** True while waiting on the API or explicit scanning phase */
  isScanning: boolean;
  /** null = pending / no scan yet; otherwise outcome for neon status boxes */
  scanResult: ComplianceScanResult;
  piiCategoryCount: number;
  entities: Array<{ label: string; count: number }>;
  findingsPreview: string;
  actionMessage?: string;
  onProceedEncryption: () => void;
  /** When no file is in context — optional idle copy */
  awaitingFile?: boolean;
}

/**
 * Compliance Check UI for the upload flow. Presentation only — wire via isScanning + scanResult.
 */
export function ComplianceCheckSection({
  isScanning,
  scanResult,
  piiCategoryCount,
  entities,
  findingsPreview,
  actionMessage,
  onProceedEncryption,
  awaitingFile = false,
}: ComplianceCheckSectionProps) {
  const showEntities = scanResult === 'sensitive' && entities.length > 0;

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-10 min-h-[min(560px,70vh)]">
      {/* Document + scanning animation */}
      <div className="flex-1 relative rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/95 p-8 md:p-10 overflow-hidden shadow-[inset_0_1px_0_rgba(62,166,255,0.12)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(62,166,255,0.15),transparent_55%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[280px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70 mb-6">
            Document surface
          </p>

          <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-[3/4] rounded-2xl border border-cyan-500/25 bg-slate-950/70 backdrop-blur-sm shadow-[0_0_40px_rgba(62,166,255,0.08),inset_0_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Document body */}
            <div className="absolute inset-4 rounded-xl border border-slate-700/50 bg-slate-900/40" />
            <div className="absolute top-10 left-8 right-8 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full bg-slate-600/30"
                  style={{ width: `${68 - i * 8}%` }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <FileText
                className="w-20 h-20 text-cyan-500/25 md:w-24 md:h-24"
                strokeWidth={1}
              />
            </div>

            {/* Neon scan line — sweeps vertically */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  className="absolute left-0 right-0 h-[3px] rounded-full z-20"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(56,189,248,0.95), rgba(62,166,255,1), rgba(56,189,248,0.95), transparent)',
                    boxShadow:
                      '0 0 20px rgba(56,189,248,0.9), 0 0 40px rgba(62,166,255,0.5), 0 0 60px rgba(62,166,255,0.25)',
                  }}
                  initial={{ top: '8%' }}
                  animate={{ top: ['8%', '88%', '8%'] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Subtle horizontal sweep (secondary) */}
            {isScanning && (
              <motion.div
                className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent"
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>

          {awaitingFile && !isScanning && (
            <p className="mt-8 text-sm text-slate-500 text-center max-w-xs font-mono">
              Upload a file to initiate the compliance scan pipeline.
            </p>
          )}

          {!isScanning && scanResult && findingsPreview && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-xs text-slate-500 font-mono text-center max-w-md line-clamp-4 px-2"
            >
              {findingsPreview}
            </motion.p>
          )}
        </div>
      </div>

      {/* Status + detail column */}
      <div className="w-full lg:w-[400px] flex flex-col gap-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400/80" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Live analysis</span>
        </div>

        <AnimatePresence mode="wait">
          {isScanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-2xl border border-cyan-500/35 bg-slate-950/80 p-5 shadow-[0_0_24px_rgba(62,166,255,0.2)]"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-xl border border-cyan-400/40 flex items-center justify-center bg-cyan-500/10"
                  animate={{ boxShadow: ['0 0 0 0 rgba(62,166,255,0.4)', '0 0 20px 2px rgba(62,166,255,0.25)', '0 0 0 0 rgba(62,166,255,0.4)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ScanLine className="w-5 h-5 text-cyan-300" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-cyan-100">Scanning document…</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">Neural PII classifier active</p>
                </div>
              </div>
            </motion.div>
          )}

          {!isScanning && scanResult === 'sensitive' && (
            <motion.div
              key="warn"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-red-500/60 bg-red-950/40 p-5 backdrop-blur-md"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(239,68,68,0.5)',
                    '0 0 28px rgba(239,68,68,0.85)',
                    '0 0 15px rgba(239,68,68,0.5)',
                  ],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-xl border border-red-500/50 bg-red-950/60 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                  <div>
                    <h3 className="text-lg font-heading font-bold text-red-100 tracking-tight">
                      Sensitive Data Found
                    </h3>
                    <p className="text-xs text-red-200/80 mt-1 font-mono leading-relaxed">
                      {piiCategoryCount > 0
                        ? `${piiCategoryCount} PII categor${piiCategoryCount === 1 ? 'y' : 'ies'} flagged. Review entities before encryption.`
                        : 'Policy violations detected. Review before proceeding.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {!isScanning && scanResult === 'safe' && (
            <motion.div
              key="safe"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-emerald-500/45 bg-emerald-950/30 p-5 backdrop-blur-md"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 16px rgba(34,197,94,0.45)',
                    '0 0 32px rgba(34,197,94,0.75)',
                    '0 0 16px rgba(34,197,94,0.45)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-xl border border-emerald-400/50 bg-emerald-950/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 drop-shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
                  <div>
                    <h3 className="text-lg font-heading font-bold text-emerald-100 tracking-tight">
                      No Sensitive Data Found
                    </h3>
                    <p className="text-xs text-emerald-200/80 mt-1 font-mono leading-relaxed">
                      No high-risk PII patterns matched current thresholds. You may still proceed with
                      zero-knowledge encryption as a precaution.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {!isScanning && scanResult === null && !awaitingFile && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 text-slate-500 text-sm"
            >
              Waiting for scan results…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary glowing boxes — entity breakdown */}
        <AnimatePresence>
          {showEntities && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3 overflow-hidden"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Identified entities
              </span>
              {entities.map((entity, i) => {
                const Icon = iconForEntityLabel(entity.label);
                return (
                  <motion.div
                    key={`${entity.label}-${i}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3 shadow-[0_0_18px_rgba(245,158,11,0.12)]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-amber-400/90" />
                      <span className="text-sm font-semibold text-amber-100/90">{entity.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                      {entity.count}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proceed — same behavior, premium styling */}
        <AnimatePresence>
          {!isScanning && scanResult !== null && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto rounded-2xl border border-cyan-500/25 bg-slate-950/60 p-5 shadow-[0_0_20px_rgba(62,166,255,0.08)]"
            >
              <p className="text-sm text-cyan-100/90 font-medium leading-relaxed mb-4">
                {actionMessage ||
                  'Flagging file for strict zero-knowledge encryption and distributed sharding before storage.'}
              </p>
              <motion.button
                type="button"
                onClick={onProceedEncryption}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm shadow-[0_0_24px_rgba(62,166,255,0.35)] border border-cyan-400/30 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                Proceed to Encryption
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compliance tags */}
        <div className="flex justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-950/40 p-4">
          {[
            { label: 'GDPR Ready', active: scanResult === 'sensitive' },
            { label: 'HIPAA Aligned', active: scanResult === 'sensitive' },
            { label: 'Zero-Knowledge', active: scanResult !== null },
          ].map((tag, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 flex-1 transition-opacity duration-500 ${
                tag.active ? 'opacity-100' : 'opacity-35'
              }`}
            >
              <CheckCircle2
                className={`w-5 h-5 ${tag.active ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-slate-600'}`}
              />
              <span
                className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${
                  tag.active ? 'text-emerald-400/90' : 'text-slate-600'
                }`}
              >
                {tag.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
