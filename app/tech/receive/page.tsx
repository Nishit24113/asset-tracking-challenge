"use client";

import { useState, useCallback } from "react";
import { ScanInput } from "@/components/ScanInput";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset, AssetClass } from "@/lib/types";

type Step = "scan_tag" | "fill_details" | "success" | "error";

export default function TechReceivePage() {
  const [step, setStep] = useState<Step>("scan_tag");
  const [assetTag, setAssetTag] = useState("");
  const [serial, setSerial] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass>("instrument");
  const [site, setSite] = useState("");
  const [room, setRoom] = useState("");
  const [result, setResult] = useState<Asset | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const handleTagScan = useCallback((value: string) => {
    setAssetTag(value.trim());
    setStep("fill_details");
    setError(null);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/upstream/scans/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: assetTag,
          serial,
          model,
          manufacturer,
          asset_class: assetClass,
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
        setResult(data);
        setIsDuplicate(res.status === 200);
        setStep("success");
      }
    } catch {
      setError({ code: "network_error", message: "Could not reach the server. Check your connection." });
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("scan_tag");
    setAssetTag("");
    setSerial("");
    setModel("");
    setManufacturer("");
    setSite("");
    setRoom("");
    setResult(null);
    setError(null);
    setIsDuplicate(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receive asset</h1>
        <p className="text-gray-500 text-sm mt-1">Scan incoming equipment at the dock</p>
      </div>

      {step === "scan_tag" && (
        <div className="space-y-4">
          <ScanInput onScan={handleTagScan} label="Scan asset tag" placeholder="Scan or type asset tag (e.g. C0009001)" />
          <p className="text-xs text-gray-400">Tag format: C followed by 7 digits</p>
        </div>
      )}

      {step === "fill_details" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm font-medium text-blue-800">Tag: {assetTag}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial number</label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none text-lg"
              placeholder="SN-..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
              placeholder="Model name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
              placeholder="Manufacturer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset class</label>
            <select
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value as AssetClass)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            >
              <option value="instrument">Instrument</option>
              <option value="compute">Compute</option>
              <option value="network">Network</option>
              <option value="power">Power</option>
              <option value="consumable_durable">Consumable / Durable</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                placeholder="e.g. SV-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room (optional)</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                placeholder="e.g. Dock-A"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={reset}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !serial || !model || !manufacturer || !site}
              className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? "Receiving..." : "Confirm receive"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && result && (
        <div className="space-y-4">
          <div className={`rounded-lg p-4 ${isDuplicate ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{isDuplicate ? "!" : "✓"}</span>
              <div>
                <p className="font-semibold text-lg">
                  {isDuplicate ? "Already received" : "Received successfully"}
                </p>
                <p className="text-sm text-gray-600">
                  {isDuplicate
                    ? "This asset was already in the system with matching serial. Logged as duplicate receive."
                    : `${result.asset_tag} is now in state: ${result.state}`}
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Tag:</strong> {result.asset_tag}</p>
            <p><strong>Serial:</strong> {result.serial}</p>
            <p><strong>Model:</strong> {result.model}</p>
            <p><strong>Location:</strong> {result.location.site}{result.location.room ? ` / ${result.location.room}` : ""}</p>
          </div>
          <button
            onClick={reset}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 min-h-[44px]"
          >
            Scan next asset
          </button>
        </div>
      )}

      {step === "error" && error && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 bg-red-50 border border-red-200">
            <p className="font-semibold text-red-800">Scan failed</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            {error.code === "and_match_failed" && (
              <p className="text-sm text-red-600 mt-2">
                Tag <strong>{assetTag}</strong> already exists with a different serial number.
                Check the label and try again with the correct tag.
              </p>
            )}
            {error.code === "invalid_tag_format" && (
              <p className="text-sm text-red-600 mt-2">
                Tags must be in the format C followed by 7 digits (e.g. C0009001).
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px]"
            >
              Start over
            </button>
            <button
              onClick={() => setStep("fill_details")}
              className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 min-h-[44px]"
            >
              Edit and retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
