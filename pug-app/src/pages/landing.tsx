import { Link } from "wouter";
import { motion } from "framer-motion";
import { Film, Tv, Check, Clock, X, Sparkles, ArrowRight, ChevronRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#0d0d0d] text-white overflow-x-hidden">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-black/70 backdrop-blur-md border-b border-white/8">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-black text-xl tracking-widest text-orange-500 border-2 border-orange-500 rounded-md px-3 py-0.5 leading-none">
            PUG
          </span>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 hover:border-white/25 hover:bg-white/5"
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 text-sm font-bold text-black bg-orange-500 hover:bg-orange-400 transition-colors px-4 py-2 rounded-full"
              >
                Get Started <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex items-center justify-center py-28 px-6 overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[400px] rounded-full bg-orange-500/8 blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 text-orange-400 bg-orange-500/10 border border-orange-500/20 uppercase tracking-widest"
          >
            <Film className="w-3 h-3" /> Personal Viewing Log
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6"
          >
            <span className="text-white">Your taste.</span>
            <br />
            <span className="text-orange-500">Your record.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-lg md:text-xl text-white/45 mb-10 max-w-lg mx-auto leading-relaxed"
          >
            Swipe to log films and TV. Track what you've seen, what's next, and get picks tailored to your taste.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(249,115,22,0.35)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 h-13 px-8 py-3.5 text-base font-bold bg-orange-500 hover:bg-orange-400 text-black rounded-xl shadow-lg shadow-orange-500/20 transition-colors"
                data-testid="btn-start"
              >
                Start Logging <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/sign-in">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 h-13 px-8 py-3.5 text-base font-semibold border border-white/15 text-white/75 hover:bg-white/6 hover:text-white rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4 text-orange-400" /> Sign In
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">One swipe per title</h2>
          </motion.div>

          {/* Swipe directions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                dir: "←", label: "Swipe Left", status: "Skipped", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20",
                desc: "Not feeling it? Swipe left to skip — no judgement.",
              },
              {
                dir: "↑", label: "Swipe Up", status: "Watchlist", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20",
                desc: "Save it for later. Your watchlist with streaming info.",
              },
              {
                dir: "→", label: "Swipe Right", status: "Watched", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
                desc: "Already seen it? Mark it watched and build your history.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1 }}
                className={`rounded-2xl p-6 bg-[#111] border ${item.border} flex flex-col gap-3`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black ${item.bg} ${item.color}`}>
                  {item.dir}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${item.color}`}>{item.label}</p>
                  <p className="font-bold text-white text-lg">{item.status}</p>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Everything you need</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Film className="w-5 h-5 text-orange-400" />, bg: "bg-orange-500/12",
                title: "Movies & TV", body: "Separate lists for movies and TV shows. Watched, watchlist, and skipped — all in one place.",
              },
              {
                icon: <Tv className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/12",
                title: "Streaming Info", body: "Your watchlist tells you which platform each title is on, so you always know where to watch.",
              },
              {
                icon: <Sparkles className="w-5 h-5 text-sky-400" />, bg: "bg-sky-500/12",
                title: "For You", body: "A curated Recommendations page with highly rated movies and popular TV shows to discover.",
              },
              {
                icon: <Check className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/12",
                title: "Poster Art", body: "Every title shows its poster. Your lists look like a real collection, not a plain text file.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-2xl p-6 bg-[#111] border border-white/7 hover:border-white/12 transition-colors flex gap-4"
              >
                <div className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center ${f.bg}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[300px] rounded-full bg-orange-500/6 blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="relative max-w-xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            <span className="text-white">Ready to start</span>
            <br />
            <span className="text-orange-500">your log?</span>
          </h2>
          <p className="text-white/40 mb-8 text-base">Free to join. Your log, your account.</p>
          <Link href="/sign-up">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-10 py-4 text-base font-bold bg-orange-500 hover:bg-orange-400 text-black rounded-xl shadow-lg shadow-orange-500/20 transition-colors"
            >
              Create your account <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="font-black text-sm tracking-widest text-orange-500 border border-orange-500/50 rounded px-2 py-0.5">PUG</span>
        <span className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Personal Viewing Log</span>
        <div className="flex items-center gap-1 text-white/25 text-xs">
          <Film className="w-3 h-3" />
          <span>Film &amp; TV</span>
        </div>
      </footer>

    </div>
  );
}
