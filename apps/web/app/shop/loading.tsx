export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-rq-bg">
      <section className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="h-7 w-72 animate-pulse rounded-lg bg-rq-line" />
        <div className="mt-2 h-3 w-44 animate-pulse rounded bg-rq-line/70" />

        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 w-24 animate-pulse rounded-full bg-rq-line" />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="aspect-square animate-pulse rounded-xl bg-rq-line" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-rq-line/70" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-rq-line/70" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
