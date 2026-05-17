"use client";

import { useState, useCallback } from "react";
import { ScanInput } from "@/components/ScanInput";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Step = "scan_tag" | "scan_location" | "success" | "error";

export default function TechDeployPage() {
  const [step, setStep] = useState<Step>("scan_tag");
  const [assetTag, setAssetTag] = useState("");
  const [site, setSite] = useState("");
  const [room, setRoom] = useState("");
  const [rack, setRack] = useState("");
  const [ru, setRu] = useState("");
  const [result, setResult] = useState<Asset | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTagScan = useCallback((value: string) => {
    setAssetTag(value.trim());
    setStep("scan_location");
    setError(null);
  }, []);

  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = { site, room: room || null, row: null, rack: rack || null, ru: ru || null };

      const res = await fetch("/api/upstream/scans/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: assetTag,
          location,
          user_id: getCurrentUserId(),
          scan_payload: assetTag,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ code: data.error?.code ?? "unknown", message: data.error?.message ?? `HTTP ${res.status}` });
        setStep("error");
        return;
      }

      // Write back to facilities: asset now at this rack
      const rackLocation = `${site}/${room || "-"}/-/${rack}/${ru}`;
      await fetch("/api/upstream/mock/facilities/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagged_id: assetTag, rack_location: rackLocation }),
      });

      // Write back to finance: capitalize it
      await fetch("/api/upstream/mock/finance/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: assetTag,
          site,
          status: "capitalized",
          capitalized_on: new Date().toISOString(),
        }),
      });

      setResult(data);
      setStep("success");
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
    setRack("");
    setRu("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deploy to rack</h1>
        <p className="text-gray-500 text-sm mt-1">Install asset into a rack position</p>
      </div>

      {step === "scan_tag" && (
        <ScanInput onScan={handleTagScan} label="Scan asset tag" placeholder="Scan the asset tag" />
      )}

      {step === "scan_location" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm font-medium text-blue-800">Asset: {assetTag}</span>
          </div>

          <p className="text-sm text-gray-600">Enter the full rack location. All fields are required for deploy.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site *</label>
              <input type="text" value={site} onChange={(e) => setSite(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none" placeholder="SV-1" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none" placeholder="Lab-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rack *</label>
              <input type="text" value={rack} onChange={(e) => setRack(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none" placeholder="R-04" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RU (position) *</label>
              <input type="text" value={ru} onChange={(e) => setRu(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none" placeholder="U12" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]">
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={loading || !site || !room || !rack || !ru}
              className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? "Deploying..." : "Confirm deploy"}
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
                <p className="font-semibold text-lg">Deployed</p>
                <p className="text-sm text-gray-600">{result.asset_tag} is now in service at {site} / {room} / {rack} / {ru}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">Facilities and finance records updated.</p>
          <button onClick={reset} className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 min-h-[44px]">
            Scan next asset
          </button>
        </div>
      )}

      {step === "error" && error && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 bg-red-50 border border-red-200">
            <p className="font-semibold text-red-800">Deploy failed</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            {error.code === "incomplete_deploy_location" && (
              <p className="text-sm text-red-600 mt-2">
                Deploy requires site, room, rack, and RU. Fill in all fields.
              </p>
            )}
            {error.code === "invalid_transition" && (
              <p className="text-sm text-red-600 mt-2">
                This asset cannot be deployed from its current state. Only &quot;received&quot; or &quot;stored&quot; assets can be deployed.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]">
              Start over
            </button>
            <button onClick={() => setStep("scan_location")} className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 min-h-[44px]">
              Fix location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
