"use client";

import { useEffect, useRef } from "react";

const SAMPLE_ASSETS = [
  { tag: "C0000001", note: "Seeded asset (likely in_service)" },
  { tag: "C0000010", note: "Seeded asset (check for drift)" },
  { tag: "C0000050", note: "Seeded asset (may have discrepancies)" },
  { tag: "C0000100", note: "Seeded asset" },
  { tag: "C0009001", note: "Fresh tag for testing receive" },
  { tag: "C0009002", note: "Fresh tag for testing receive" },
];

const SAMPLE_LOCATIONS = [
  { code: "SV-1", note: "Site: Sunnyvale building 1" },
  { code: "SV-1/Lab-3/R-04/U12", note: "Full deploy location" },
  { code: "SV-1/Storage-B", note: "Storage location" },
  { code: "TO-2", note: "Site: Toronto building 2" },
];

const SAMPLE_BADGES = [
  { code: "tech-jane", note: "Technician (default)" },
  { code: "tech-mike", note: "Another technician" },
  { code: "manager-paul", note: "Manager" },
];

function BarcodeCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple Code 128-like visual (not standards-compliant, but scannable-looking for demo)
    // For a real scanner we'd use a library, but this gives a printable visual
    const width = 200;
    const height = 60;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Generate pseudo-barcode bars based on character codes
    ctx.fillStyle = "black";
    let x = 10;
    const barWidth = 1.5;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      // Generate a pattern of bars from the character
      for (let bit = 0; bit < 7; bit++) {
        if ((code >> bit) & 1) {
          ctx.fillRect(x, 5, barWidth, 40);
        }
        x += barWidth + 0.5;
      }
      x += 1;
    }
    // Quiet zone end bars
    ctx.fillRect(x, 5, 2, 40);
    ctx.fillRect(x + 4, 5, 2, 40);

    // Label below
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(value, width / 2, 55);
  }, [value]);

  return <canvas ref={canvasRef} className="border rounded" />;
}

export default function BarcodesPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto print:max-w-full">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">Test barcodes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Print this page or scan these values manually. For a USB/Bluetooth scanner,
          type the value and press Enter. For camera scanning, point at the barcode.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Print this page
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Asset tags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_ASSETS.map(a => (
            <div key={a.tag} className="bg-white border rounded-lg p-3 flex items-center gap-3">
              <BarcodeCanvas value={a.tag} />
              <div>
                <p className="font-mono text-sm font-medium">{a.tag}</p>
                <p className="text-xs text-gray-400">{a.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_LOCATIONS.map(l => (
            <div key={l.code} className="bg-white border rounded-lg p-3 flex items-center gap-3">
              <BarcodeCanvas value={l.code} />
              <div>
                <p className="font-mono text-sm font-medium">{l.code}</p>
                <p className="text-xs text-gray-400">{l.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Badges (for transfer)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_BADGES.map(b => (
            <div key={b.code} className="bg-white border rounded-lg p-3 flex items-center gap-3">
              <BarcodeCanvas value={b.code} />
              <div>
                <p className="font-mono text-sm font-medium">{b.code}</p>
                <p className="text-xs text-gray-400">{b.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
