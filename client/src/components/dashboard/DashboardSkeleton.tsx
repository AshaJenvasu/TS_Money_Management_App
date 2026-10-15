export function DashboardSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[480px] animate-pulse rounded-none bg-[#E3D9F6] px-5 py-5 sm:min-h-[800px] sm:rounded-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-white/60" />
          <div className="h-7 w-36 rounded-lg bg-white/70" />
        </div>
        <div className="h-10 w-24 rounded-full bg-white/60" />
      </div>

      {/* Greeting */}
      <section className="mt-8 space-y-3">
        <div className="h-3 w-36 rounded bg-white/60" />
        <div className="h-7 w-48 rounded-lg bg-white/70" />
        <div className="h-4 w-40 rounded bg-white/50" />
      </section>

      {/* Total Balance */}
      <section className="mt-7 rounded-[28px] bg-gradient-to-br from-[#AAA6EE] to-[#F0C5DE] p-6">
        <div className="h-4 w-32 rounded bg-white/50" />
        <div className="mt-5 h-9 w-44 rounded-lg bg-white/70" />
        <div className="mt-3 h-3 w-36 rounded bg-white/50" />
        <div className="mt-7 flex justify-between border-t border-white/30 pt-4">
          <div className="h-4 w-24 rounded bg-white/50" />
          <div className="h-4 w-12 rounded bg-white/60" />
        </div>
      </section>

      {/* Wallet Allocation */}
      <section className="mt-5 rounded-[28px] bg-white/50 p-5">
        <div className="h-5 w-40 rounded bg-[#C9C2E8]" />
        <div className="mt-5 h-4 rounded-full bg-[#D8D2EE]" />
        <div className="mt-5 space-y-3">
          <div className="h-4 w-full rounded bg-[#D8D2EE]" />
          <div className="h-4 w-4/5 rounded bg-[#D8D2EE]" />
          <div className="h-4 w-3/4 rounded bg-[#D8D2EE]" />
        </div>
      </section>

      {/* Wallet Cards */}
      <section className="mt-8">
        <div className="mb-4 h-6 w-40 rounded bg-white/60" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-2xl bg-white/60" />
          <div className="h-28 rounded-2xl bg-white/60" />
        </div>
      </section>

      {/* Portfolio */}
      <section className="mt-5 h-28 rounded-[28px] bg-white/50" />

      {/* Recent Transactions */}
      <section className="mt-6 space-y-3">
        <div className="mb-4 h-6 w-36 rounded bg-white/60" />
        <div className="h-20 rounded-2xl bg-white/60" />
        <div className="h-20 rounded-2xl bg-white/60" />
        <div className="h-20 rounded-2xl bg-white/60" />
      </section>
    </main>
  );
}
