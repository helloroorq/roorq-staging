/**
 * Global skeleton — shown while the App Router streams in the requested page.
 * Kept intentionally quiet so it never feels like a flash for fast routes.
 */
export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#f7f4ee]">
      <div className="mx-auto w-full max-w-[1820px] px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
        <div className="animate-pulse rounded-[24px] border border-black/5 bg-[#f3e7d8] md:rounded-[32px]">
          <div className="aspect-[16/9] w-full" />
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[64px] animate-pulse rounded-xl border border-stone-200/80 bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
