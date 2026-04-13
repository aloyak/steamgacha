export default function Market() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Market</h1>
        <p className="text-slate-400">Buy and sell trading cards</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-800/50 rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-slate-400">Market features will be added here</p>
        </div>
      </div>
    </div>
  );
}