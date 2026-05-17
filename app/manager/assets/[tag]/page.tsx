import Link from "next/link";
import { createApiClient } from "@/lib/api-client";
import type { Asset, Event } from "@/lib/types";

export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<React.ReactElement> {
  const { tag } = await params;
  const api = createApiClient();

  let asset: Asset | null = null;
  let events: Event[] = [];
  let error: string | null = null;

  try {
    asset = await api.assets.get(tag);
    events = await api.assets.history(tag);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : "Failed to load asset";
  }

  if (error || !asset) {
    return (
      <div className="space-y-4">
        <Link href="/manager" className="text-sm text-blue-700 hover:underline">← Back to assets</Link>
        <div className="rounded-lg p-6 bg-red-50 border border-red-200 text-center">
          <p className="font-semibold text-red-800">Asset not found</p>
          <p className="text-sm text-red-600 mt-1">{error || `No asset with tag ${tag}`}</p>
        </div>
      </div>
    );
  }

  const stateBadge = (state: string) => {
    const colors: Record<string, string> = {
      received: "bg-blue-100 text-blue-800",
      stored: "bg-gray-100 text-gray-800",
      in_service: "bg-green-100 text-green-800",
      rma_pending: "bg-yellow-100 text-yellow-800",
      disposed: "bg-red-100 text-red-800",
    };
    return colors[state] || "bg-gray-100 text-gray-700";
  };

  const formatLocation = (loc: { site: string; room: string | null; rack: string | null; ru: string | null }) => {
    const parts = [loc.site, loc.room, loc.rack, loc.ru].filter(Boolean);
    return parts.join(" / ") || "—";
  };

  return (
    <div className="space-y-6">
      <Link href="/manager" className="text-sm text-blue-700 hover:underline">← Back to assets</Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{asset.asset_tag}</h1>
          <p className="text-gray-600 mt-1">{asset.manufacturer} {asset.model}</p>
        </div>
        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${stateBadge(asset.state)}`}>
          {asset.state.replace("_", " ")}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded-lg p-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Serial</p>
          <p className="font-mono text-sm">{asset.serial}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Class</p>
          <p className="text-sm">{asset.asset_class.replace("_", " ")}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Location</p>
          <p className="text-sm">{formatLocation(asset.location)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Custodian</p>
          <p className="text-sm">{asset.custodian}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Created</p>
          <p className="text-sm">{new Date(asset.created_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Last updated</p>
          <p className="text-sm">{new Date(asset.updated_at).toLocaleString()}</p>
        </div>
        {asset.procurement_note && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Procurement note</p>
            <p className="text-sm text-gray-700">{asset.procurement_note}</p>
          </div>
        )}
      </div>

      {/* Event log */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Event history</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">No events recorded yet.</p>
        ) : (
          <div className="border rounded-lg divide-y">
            {events.map(ev => (
              <div key={ev.id} className="px-4 py-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {ev.event_type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ev.from_state && <span>{ev.from_state} → </span>}
                    {ev.to_state}
                    {ev.user_id && <span> · by {ev.user_id}</span>}
                  </p>
                  {ev.to_location?.site && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      → {formatLocation(ev.to_location)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(ev.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
