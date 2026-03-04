export function UserDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
