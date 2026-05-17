import Link from "next/link";

const workflows = [
  { href: "/tech/receive", label: "Receive", description: "Scan incoming equipment at the dock", icon: "📦" },
  { href: "/tech/store", label: "Store", description: "Move an asset into storage", icon: "🏬" },
  { href: "/tech/deploy", label: "Deploy", description: "Install asset into a rack", icon: "🔧" },
  { href: "/tech/transfer", label: "Transfer", description: "Hand off custody to another person", icon: "🤝" },
];

export default function TechLandingPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan workflows</h1>
        <p className="text-gray-500 text-sm mt-1">Choose an action to begin scanning</p>
      </div>

      <div className="grid gap-3">
        {workflows.map(w => (
          <Link
            key={w.href}
            href={w.href}
            className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:border-blue-300 hover:shadow-sm transition-all min-h-[64px]"
          >
            <span className="text-2xl">{w.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{w.label}</p>
              <p className="text-sm text-gray-500">{w.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
