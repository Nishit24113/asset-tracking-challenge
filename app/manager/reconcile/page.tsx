"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Discrepancy = {
  asset_tag: string;
  category: string;
  severity: "high" | "medium" | "low";
  summary: string;
  details: Record<string, unknown>;
};

type Report = {
  generated_at: string;
  total_assets: number;
  total_discrepancies: number;
  discrepancies: Discrepancy[];
  summary: Record<string, number>;
};

const categoryLabels: Record<string, string> = {
  location_mismatch: "Location mismatch",
  ghost_in_facilities: "Ghost in facilities",
  missing_from_facilities: "Missing from facilities",
  finance_status_mismatch: "Finance status mismatch",
  ghost_in_finance: "Ghost in finance",
  missing_from_finance: "Missing from finance",
  site_mismatch: "Site disagreement",
};

const categoryExplanations: Record<string, string> = {
  location_mismatch: "Operations and facilities disagree on where this asset is physically racked.",
  ghost_in_facilities: "Facilities thinks this asset is racked, but operations says it's not in service.",
  missing_from_facilities: "Asset is deployed according to operations, but facilities has no record of it.",
  finance_status_mismatch: "The financial status doesn't match the operational state.",
  ghost_in_finance: "Finance has a record for this asset, but operations doesn't know about it.",
  missing_from_finance: "Asset is in service but finance has no corresponding record.",
  site_mismatch: "Minor: the building/site label differs between systems (may be a naming convention issue).",
};

export default function ManagerReconcilePage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");

  useEffect(() => {
    fetch("/api/reconcile")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setReport(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reconciliation report</h1>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reconciliation report</h1>
        <div className="rounded-lg p-4 bg-red-50 border border-red-200">
          <p className="font-semibold text-red-800">Failed to generate report</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const filtered = report.discrepancies.filter((d) => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterSeverity && d.severity !== filterSeverity) return false;
    return true;
  });

  const severityColor = (s: string) => {
    if (s === "high") return "bg-red-100 text-red-800 border-red-200";
    if (s === "medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-50 text-blue-800 border-blue-200";
  };

  const activeCategories = Object.entries(report.summary).filter(([, count]) => count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reconciliation report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated {new Date(report.generated_at).toLocaleString()} · {report.total_assets} assets checked
          </p>
        </div>
        <Link href="/manager" className="text-sm text-blue-700 hover:underline">← Dashboard</Link>
      </div>

      {/* Summary cards */}
      {report.total_discrepancies === 0 ? (
        <div className="rounded-lg p-6 bg-green-50 border border-green-200 text-center">
          <p className="font-semibold text-green-800 text-lg">All clear</p>
          <p className="text-sm text-green-600 mt-1">No discrepancies found across operations, facilities, and finance.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">
                {report.discrepancies.filter(d => d.severity === "high").length}
              </p>
              <p className="text-xs text-gray-500">High priority</p>
            </div>
            <div className="bg-white border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {report.discrepancies.filter(d => d.severity === "medium").length}
              </p>
              <p className="text-xs text-gray-500">Medium</p>
            </div>
            <div className="bg-white border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {report.discrepancies.filter(d => d.severity === "low").length}
              </p>
              <p className="text-xs text-gray-500">Low</p>
            </div>
            <div className="bg-white border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{report.total_discrepancies}</p>
              <p className="text-xs text-gray-500">Total issues</p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">By category</h2>
            <div className="space-y-2">
              {activeCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{categoryLabels[cat] || cat}</span>
                    <p className="text-xs text-gray-400">{categoryExplanations[cat]}</p>
                  </div>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm"
            >
              <option value="">All categories</option>
              {activeCategories.map(([cat]) => (
                <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm"
            >
              <option value="">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span className="text-sm text-gray-500 self-center">{filtered.length} shown</span>
          </div>

          {/* Discrepancy list */}
          <div className="space-y-2">
            {filtered.map((d, i) => (
              <div key={`${d.asset_tag}-${d.category}-${i}`} className={`border rounded-lg p-3 ${severityColor(d.severity)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/manager/assets/${d.asset_tag}`} className="font-mono text-sm font-medium hover:underline">
                      {d.asset_tag}
                    </Link>
                    <span className="ml-2 text-xs opacity-75">{categoryLabels[d.category]}</span>
                  </div>
                  <span className="text-xs font-medium uppercase">{d.severity}</span>
                </div>
                <p className="text-sm mt-1">{d.summary}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
