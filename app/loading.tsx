export default function Loading() { return <main className="mx-auto max-w-6xl animate-pulse px-5 py-16 sm:px-8"><div className="h-5 w-24 rounded bg-[#e8e6e3]" /><div className="mt-5 h-12 max-w-xl rounded bg-[#e8e6e3]" /><div className="mt-10 grid gap-4 md:grid-cols-2">{[1,2,3,4].map((i) => <div key={i} className="h-52 rounded-[22px] bg-white" />)}</div></main>; }

