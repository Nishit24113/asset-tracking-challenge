"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Asset, AssetState } from "@/lib/types";

const STATES: AssetState[] = ["received", "stored", "in_service", "rma_pending", "disposed"];
const PAGE_SIZE = 25;

export default function ManagerDashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [siteFilter, setSiteFilter] = useState("");
  const [custodianFilter, setCustodianFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.set("state", stateFilter);
      if (siteFilter) params.set("site", siteFilter);
      if (custodianFilter) params.set("custodian", custodianFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/upstream/assets${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Asset[] = await res.json();
      setAssets(data);
      setPage(0);
    } catch (e) {
      setError("Failed to load assets. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [stateFilter, siteFilter, custodianFilter]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const filtered = search
    ? assets.filter(a =>
        a.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
        a.model.toLowerCase().includes(search.toLowerCase()) ||
        a.serial.toLowerCase().includes(search.toLowerCase()) ||
        a.manufacturer.toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageAssets = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const sites = [...new Set(assets.map(a => a.location.site))].sort();

  const stateBadge = (state: AssetState) => {
    const colors: Record<string, string> = {
      received: "bg-blue-100 text-blue-800",
      stored: "bg-gray-100 text-gray-800",
      in_service: "bg-green-100 text-green-800",
      rma_pending: "bg-yellow-100 text-yellow-800",
      disposed: "bg-red-100 text-red-800",
    };
    return colors[state] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Link href="/manager/reconcile" className="text-sm text-blue-700 hover:underline">
          Reconciliation report →
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search tag, model, serial..."
          className="px-3 py-2 rounded-md border border-gray-300 text-sm w-56"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm"
        >
          <option value="">All states</option>
          {STATES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm"
        >
          <option value="">All sites</option>
          {sites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          value={custodianFilter}
          onChange={(e) => setCustodianFilter(e.target.value)}
          placeholder="Custodian..."
          className="px-3 py-2 rounded-md border border-gray-300 text-sm w-40"
        />
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        {loading ? "Loading..." : `${filtered.length} asset${filtered.length !== 1 ? "s" : ""}`}
        {filtered.length !== assets.length && ` (of ${assets.length} total)`}
      </div>

      {error && (
        <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg p-6 bg-gray-50 border border-gray-200 text-center text-gray-500">
          No assets match your filters. Try broadening your search.
        </div>
      )}

      {/* Table */}
      {pageAssets.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Tag</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Model</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">State</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Site</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Custodian</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageAssets.map(a => (
                <tr key={a.asset_tag} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/manager/assets/${a.asset_tag}`} className="text-blue-700 hover:underline font-mono text-xs">
                      {a.asset_tag}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{a.model}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${stateBadge(a.state)}`}>
                      {a.state.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{a.location.site}</td>
                  <td className="px-3 py-2 text-gray-600">{a.custodian}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{new Date(a.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
