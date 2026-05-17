"use client";

import { useState, useCallback } from "react";
import { ScanInput } from "@/components/ScanInput";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Step = "scan_tag" | "scan_badge" | "success" | "error";

export default function TechTransferPage() {
  const [step, setStep] = useState<Step>("scan_tag");
  const [assetTag, setAssetTag] = useState("");
  const [result, setResult] = useState<Asset | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [toCustodian, setToCustodian] = useState("");

  const handleTagScan = useCallback((value: string) => {
    setAssetTag(value.trim());
    setStep("scan_badge");
    setError(null);
  }, []);

  const handleBadgeScan = useCallback(async (badge: string) => {
    setToCustodian(badge.trim());
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/upstream/scans/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: assetTag,
          to_custodian: badge.trim(),
          user_id: getCurrentUserId(),
          scan_payload: `${assetTag}:${badge.trim()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ code: data.error?.code ?? "unknown", message: data.error?.message ?? `HTTP ${res.status}` });
        setStep("error");
      } else {
        setResult(data);
        setStep("success");
      }
    } catch {
      setError({ code: "network_error", message: "Could not reach the server." });
      setStep("error");
    } finally {
      setLoading(false);
    }
  }, [assetTag]);

  const reset = () => {
    setStep("scan_tag");
    setAssetTag("");
    setToCustodian("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transfer custody</h1>
        <p className="text-gray-500 text-sm mt-1">Hand off an asset to another person</p>
      </div>

      {step === "scan_tag" && (
        <div className="space-y-4">
          <ScanInput onScan={handleTagScan} label="Step 1: Scan asset tag" placeholder="Scan the asset tag" />
          <p className="text-xs text-gray-400">You ({getCurrentUserId()}) are the current custodian.</p>
        </div>
      )}

      {step === "scan_badge" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm font-medium text-blue-800">Asset: {assetTag}</span>
          </div>
          <ScanInput
            onScan={handleBadgeScan}
            label="Step 2: Scan recipient's badge"
            placeholder="Scan badge (e.g. tech-mike)"
            disabled={loading}
          />
          <p className="text-xs text-gray-400">
            From: {getCurrentUserId()} → To: (scan badge above)
          </p>
          <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Cancel
          </button>
        </div>
      )}

      {step === "success" && result && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-lg">Custody transferred</p>
                <p className="text-sm text-gray-600">
                  {result.asset_tag} is now with <strong>{result.custodian}</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>State unchanged: {result.state}</p>
          </div>
          <button onClick={reset} className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 min-h-[44px]">
            Scan next transfer
          </button>
        </div>
      )}

      {step === "error" && error && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 bg-red-50 border border-red-200">
            <p className="font-semibold text-red-800">Transfer failed</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            {error.code === "same_custodian" && (
              <p className="text-sm text-red-600 mt-2">
                {toCustodian} is already the custodian of this asset. Scan a different badge.
              </p>
            )}
            {error.code === "unknown_asset" && (
              <p className="text-sm text-red-600 mt-2">
                No asset found with tag <strong>{assetTag}</strong>.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]">
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
