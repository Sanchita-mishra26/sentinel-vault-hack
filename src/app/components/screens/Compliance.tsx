import React, { useEffect, useMemo, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFile, ComplianceReport } from '../../context/FileContext';
import { API_BASE, parseJsonResponse } from '../../apiBase';
import { ComplianceCheckSection } from '../compliance/ComplianceCheckSection';

export function Compliance() {
  const { fileData, setFileData } = useFile();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fileId = fileData?.fileId;
  const report = fileData?.complianceReport;

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/compliance/${fileId}`);
        const data = await parseJsonResponse<ComplianceReport>(res);
        if (!cancelled) {
          setFileData((prev) => ({ ...(prev || {}), complianceReport: data }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, setFileData]);

  const findingsText =
    typeof report?.findings === 'string'
      ? report.findings
      : Array.isArray(report?.findings)
        ? report!.findings!.join('\n')
        : '';

  const piiCount = report?.piiCategories ?? 0;
  const entities = (report?.entities ?? []).filter((e) => (e?.count ?? 0) > 0);

  const isScanning = Boolean(loading || report?.status === 'scanning');

  const scanResult = useMemo(() => {
    if (isScanning || !report) return null;
    return piiCount > 0 ? 'sensitive' : 'safe';
  }, [isScanning, report, piiCount]);

  const awaitingFile = !fileId;
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  useEffect(() => {
    setActiveFileId(localStorage.getItem('sentinelActiveFile'));
  }, []);

  return (
    <div className="flex flex-col h-full gap-8 p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <ScanLine className="w-8 h-8 text-brand-accent animate-pulse" />
        <h1 className="text-3xl font-heading font-bold text-white">AI PII Scanning & Compliance</h1>
      </div>

      <ComplianceCheckSection
        isScanning={isScanning}
        scanResult={scanResult}
        piiCategoryCount={piiCount}
        entities={entities}
        findingsPreview={findingsText}
        actionMessage={report?.message}
        onProceedEncryption={() => navigate('/app/encryption')}
        awaitingFile={awaitingFile}
        activeFileId={activeFileId}
      />
    </div>
  );
}
