export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-[#f7f4ee]">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-stone-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-stone-200/80" />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-stone-200/80" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200/80" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
