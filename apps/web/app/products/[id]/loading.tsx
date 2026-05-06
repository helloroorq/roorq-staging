export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#f7f4ee]">
      <section className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="aspect-[4/5] w-full animate-pulse rounded-3xl bg-stone-200" />

          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-stone-200/80" />
            <div className="h-9 w-3/4 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-6 w-28 animate-pulse rounded bg-stone-200" />

            <div className="mt-6 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-stone-200/80" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-stone-200/80" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-stone-200/80" />
            </div>

            <div className="mt-6 flex gap-3">
              <div className="h-12 w-32 animate-pulse rounded-full bg-stone-200" />
              <div className="h-12 w-32 animate-pulse rounded-full bg-stone-200/70" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
