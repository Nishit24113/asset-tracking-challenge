"use client";

import { useState, useCallback } from "react";
import { ScanInput } from "@/components/ScanInput";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Step = "scan_tag" | "scan_location" | "success" | "error";

export default function TechStorePage() {
  const [step, setStep] = useState<Step>("scan_tag");
  const [assetTag, setAssetTag] = useState("");
  const [site, setSite] = useState("");
  const [room, setRoom] = useState("");
  const [result, setResult] = useState<Asset | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTagScan = useCallback((value: string) => {
    setAssetTag(value.trim());
    setStep("scan_location");
    setError(null);
  }, []);

  const handleStore = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check current state so we know whether to de-rack
      let wasInService = false;
      try {
        const checkRes = await fetch(`/api/upstream/assets/${assetTag}`);
        if (checkRes.ok) {
          const current = await checkRes.json();
          wasInService = current.state === "in_service";
        }
      } catch {}

      const res = await fetch("/api/upstream/scans/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: assetTag,
          location: { site, room: room || null, row: null, rack: null, ru: null },
          user_id: getCurrentUserId(),
          scan_payload: assetTag,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ code: data.error?.code ?? "unknown", message: data.error?.message ?? `HTTP ${res.status}` });
        setStep("error");
      } else {
        // If the asset was in_service before (de-racking), remove from facilities
        if (wasInService) {
          await fetch("/api/upstream/mock/facilities/spaces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagged_id: assetTag, rack_location: null }),
          }).catch(() => {});
        }
        setResult(data);
        setStep("success");
      }
    } catch {
      setError({ code: "network_error", message: "Could not reach the server." });
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("scan_tag");
    setAssetTag("");
    setSite("");
    setRoom("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store asset</h1>
        <p className="text-gray-500 text-sm mt-1">Move an asset into storage</p>
      </div>

      {step === "scan_tag" && (
        <ScanInput onScan={handleTagScan} label="Scan asset tag" placeholder="Scan the asset tag" />
      )}

      {step === "scan_location" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm font-medium text-blue-800">Asset: {assetTag}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage site</label>
            <input
              type="text"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none text-lg"
              placeholder="e.g. SV-1"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room (optional)</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
              placeholder="e.g. Storage-B"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]">
              Cancel
            </button>
            <button
              onClick={handleStore}
              disabled={loading || !site}
              className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? "Storing..." : "Confirm store"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && result && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-lg">Stored</p>
                <p className="text-sm text-gray-600">{result.asset_tag} moved to storage at {result.location.site}{result.location.room ? ` / ${result.location.room}` : ""}</p>
              </div>
            </div>
          </div>
          <button onClick={reset} className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 min-h-[44px]">
            Scan next asset
          </button>
        </div>
      )}

      {step === "error" && error && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 bg-red-50 border border-red-200">
            <p className="font-semibold text-red-800">Store failed</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            {error.code === "invalid_transition" && (
              <p className="text-sm text-red-600 mt-2">
                This asset cannot be stored from its current state. Only assets in &quot;received&quot; or &quot;in_service&quot; state can be stored.
              </p>
            )}
            {error.code === "unknown_asset" && (
              <p className="text-sm text-red-600 mt-2">
                No asset found with tag <strong>{assetTag}</strong>. Was it received first?
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
