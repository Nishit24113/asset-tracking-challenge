import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api-client";
import type { Asset, FacilitiesRecord, FinanceRecord } from "@/lib/types";

export type DiscrepancyCategory =
  | "location_mismatch"
  | "ghost_in_facilities"
  | "missing_from_facilities"
  | "finance_status_mismatch"
  | "ghost_in_finance"
  | "missing_from_finance"
  | "site_mismatch";

export type Discrepancy = {
  asset_tag: string;
  category: DiscrepancyCategory;
  severity: "high" | "medium" | "low";
  summary: string;
  details: {
    operations?: Partial<Asset>;
    facilities?: Partial<FacilitiesRecord>;
    finance?: Partial<FinanceRecord>;
  };
};

export type ReconcileReport = {
  generated_at: string;
  total_assets: number;
  total_discrepancies: number;
  discrepancies: Discrepancy[];
  summary: Record<DiscrepancyCategory, number>;
};

export async function GET(): Promise<NextResponse> {
  try {
    const api = createApiClient();
    const [assets, facilities, finance] = await Promise.all([
      api.assets.list(),
      api.mock.facilities(),
      api.mock.finance(),
    ]);

    const assetMap = new Map<string, Asset>();
    for (const a of assets) assetMap.set(a.asset_tag, a);

    const facilityMap = new Map<string, FacilitiesRecord>();
    for (const f of facilities) facilityMap.set(f.tagged_id, f);

    const financeMap = new Map<string, FinanceRecord>();
    for (const f of finance) financeMap.set(f.tag, f);

    const discrepancies: Discrepancy[] = [];

    // Check each asset against facilities and finance
    for (const asset of assets) {
      const fac = facilityMap.get(asset.asset_tag);
      const fin = financeMap.get(asset.asset_tag);

      // Facilities checks
      if (asset.state === "in_service") {
        if (!fac) {
          discrepancies.push({
            asset_tag: asset.asset_tag,
            category: "missing_from_facilities",
            severity: "high",
            summary: `Asset is in service but not tracked in facilities`,
            details: { operations: { state: asset.state, location: asset.location } },
          });
        } else {
          // Check location consistency
          const opsLoc = [asset.location.site, asset.location.room, asset.location.rack, asset.location.ru]
            .filter(Boolean).join("/");
          const facLoc = fac.rack_location;
          if (facLoc && !facLoc.includes(asset.location.site)) {
            discrepancies.push({
              asset_tag: asset.asset_tag,
              category: "location_mismatch",
              severity: "high",
              summary: `Operations says "${opsLoc}" but facilities says "${facLoc}"`,
              details: { operations: { location: asset.location }, facilities: { rack_location: fac.rack_location } },
            });
          }
        }
      } else if (asset.state === "stored" || asset.state === "received") {
        if (fac) {
          discrepancies.push({
            asset_tag: asset.asset_tag,
            category: "ghost_in_facilities",
            severity: "medium",
            summary: `Asset is ${asset.state} but facilities still shows it racked at "${fac.rack_location}"`,
            details: { operations: { state: asset.state }, facilities: { rack_location: fac.rack_location } },
          });
        }
      }

      // Finance checks
      if (asset.state === "in_service") {
        if (!fin) {
          discrepancies.push({
            asset_tag: asset.asset_tag,
            category: "missing_from_finance",
            severity: "medium",
            summary: `Asset is in service but has no finance record`,
            details: { operations: { state: asset.state } },
          });
        } else if (fin.status !== "capitalized") {
          discrepancies.push({
            asset_tag: asset.asset_tag,
            category: "finance_status_mismatch",
            severity: "medium",
            summary: `Asset is in service but finance shows status "${fin.status}" (expected "capitalized")`,
            details: { operations: { state: asset.state }, finance: { status: fin.status } },
          });
        } else if (fin.site && asset.location.site && fin.site !== asset.location.site) {
          discrepancies.push({
            asset_tag: asset.asset_tag,
            category: "site_mismatch",
            severity: "low",
            summary: `Operations site "${asset.location.site}" differs from finance site "${fin.site}"`,
            details: { operations: { location: asset.location }, finance: { site: fin.site } },
          });
        }
      } else if (asset.state === "disposed") {
        if (fin && fin.status !== "retired" && fin.status !== "impaired") {
          discrepancies.push({
            asset_tag: asset.asset_tag,
            category: "finance_status_mismatch",
            severity: "high",
            summary: `Asset is disposed but finance still shows status "${fin.status}"`,
            details: { operations: { state: asset.state }, finance: { status: fin.status } },
          });
        }
      }
    }

    // Ghost records: in facilities but not in operations (or not in_service)
    for (const [tagId, fac] of facilityMap) {
      if (!assetMap.has(tagId)) {
        discrepancies.push({
          asset_tag: tagId,
          category: "ghost_in_facilities",
          severity: "high",
          summary: `Facilities tracks "${tagId}" at "${fac.rack_location}" but no such asset exists in operations`,
          details: { facilities: fac },
        });
      }
    }

    // Ghost records: in finance but not in operations
    for (const [tag, fin] of financeMap) {
      if (!assetMap.has(tag)) {
        discrepancies.push({
          asset_tag: tag,
          category: "ghost_in_finance",
          severity: "medium",
          summary: `Finance has record for "${tag}" but no such asset exists in operations`,
          details: { finance: fin },
        });
      }
    }

    // Sort: high severity first, then medium, then low
    const severityOrder = { high: 0, medium: 1, low: 2 };
    discrepancies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const summary: Record<DiscrepancyCategory, number> = {
      location_mismatch: 0,
      ghost_in_facilities: 0,
      missing_from_facilities: 0,
      finance_status_mismatch: 0,
      ghost_in_finance: 0,
      missing_from_finance: 0,
      site_mismatch: 0,
    };
    for (const d of discrepancies) {
      summary[d.category]++;
    }

    const report: ReconcileReport = {
      generated_at: new Date().toISOString(),
      total_assets: assets.length,
      total_discrepancies: discrepancies.length,
      discrepancies,
      summary,
    };

    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json(
      { error: { code: "reconcile_failed", message: e instanceof Error ? e.message : "Unknown error" } },
      { status: 500 },
    );
  }
}
