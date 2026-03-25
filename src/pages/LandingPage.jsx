import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  CheckCircle,
  Users,
  Mic,
  Calendar,
  BookOpen,
  Search,
  Share2,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Heart,
} from 'lucide-react'

/* ───────────────────────────── helpers ───────────────────────────── */

function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('landing-visible')
          obs.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useFadeIn()
  return (
    <div
      ref={ref}
      className={`landing-fade ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ───────────────────────────── nav ───────────────────────────────── */

function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass =
    'text-sunday-brown hover:text-sienna transition-colors font-body text-sm'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="Sunday Dinner Memories"
              className="h-9 sm:h-11 w-auto"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className={linkClass}>
              How It Works
            </a>
            <a href="#features" className={linkClass}>
              Features
            </a>
            <a href="#pricing" className={linkClass}>
              Pricing
            </a>
            <Link to="/login" className={linkClass}>
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 bg-sienna hover:bg-sienna/90 text-flour font-body text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-sunday-brown"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-cream/98 backdrop-blur-md border-t border-linen px-4 pb-6 pt-2 shadow-lg">
          <div className="flex flex-col gap-4">
            <a
              href="#how-it-works"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#features"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              Pricing
            </a>
            <Link
              to="/login"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-1.5 bg-sienna hover:bg-sienna/90 text-flour font-body text-sm font-semibold px-5 py-3 rounded-lg transition-colors"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

/* ───────────────────────────── hero ──────────────────────────────── */

function Hero() {
  return (
    <section className="relative bg-cream overflow-hidden">
      {/* Subtle warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream to-linen/40 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20 sm:pb-28 text-center">
        <FadeIn>
          <img
            src="/icon.png"
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 drop-shadow-sm"
          />
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-cast-iron leading-tight tracking-tight">
            Every Recipe Tells
            <br className="hidden sm:block" /> a Family Story
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-6 text-lg sm:text-xl text-sunday-brown/80 font-body max-w-2xl mx-auto leading-relaxed">
            Scan Grandma's handwritten recipe cards, preserve the stories behind
            the food, and share your family's recipes with everyone you love.
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-sienna hover:bg-sienna/90 text-flour font-body font-semibold text-lg px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Start Preserving Recipes
              <ArrowRight size={20} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border-2 border-sunday-brown/30 hover:border-sunday-brown/50 text-sunday-brown font-body font-semibold text-lg px-8 py-4 rounded-xl transition-all hover:bg-linen/50"
            >
              See How It Works
              <ChevronRight size={20} />
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-flour to-transparent" />
    </section>
  )
}

/* ───────────────────────── problem section ───────────────────────── */

function ProblemSection() {
  const problems = [
    {
      icon: '📝',
      text: 'Handwritten recipe cards are fading, getting lost, or stuck in one person\u2019s kitchen.',
    },
    {
      icon: '🤷',
      text: 'Nobody remembers exactly how Grandma made her famous pie.',
    },
    {
      icon: '📱',
      text: 'Photos of recipes are scattered across phones and group chats.',
    },
  ]

  return (
    <section className="bg-flour py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-display text-3xl sm:text-4xl text-cast-iron text-center leading-snug">
            Your family's recipes are disappearing
          </h2>
        </FadeIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {problems.map((p, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="bg-linen/60 rounded-2xl p-8 text-center">
                <span className="text-4xl block mb-4">{p.icon}</span>
                <p className="font-body text-sunday-brown/90 text-base sm:text-lg leading-relaxed">
                  {p.text}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── how it works ───────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: Camera,
      title: 'Snap a Photo',
      desc: 'Point your phone at any recipe card \u2014 handwritten, printed, or from a magazine. Our AI reads it instantly.',
    },
    {
      icon: CheckCircle,
      title: 'Review & Save',
      desc: 'The AI fills in everything \u2014 ingredients, instructions, all of it. Fix anything, add the story behind it, and save.',
    },
    {
      icon: Users,
      title: 'Share With Family',
      desc: 'Your whole family gets access. Browse recipes, plan meals, and build cookbooks together.',
    },
  ]

  return (
    <section id="how-it-works" className="bg-cream py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-display text-3xl sm:text-4xl text-cast-iron text-center leading-snug">
            From recipe box to family treasure
            <br className="hidden sm:block" />
            <span className="text-sienna"> &mdash; in 60 seconds</span>
          </h2>
        </FadeIn>

        <div className="mt-16 grid gap-10 sm:gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div className="text-center">
                {/* Step number circle */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-sienna/10 mb-6">
                  <s.icon className="w-9 h-9 text-sienna" strokeWidth={1.5} />
                  <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-sienna text-flour text-xs font-body font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl text-cast-iron mb-3">
                  {s.title}
                </h3>
                <p className="font-body text-sunday-brown/80 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── features grid ──────────────────────────── */

function Features() {
  const features = [
    {
      icon: Camera,
      title: 'AI Recipe Scanning',
      desc: 'Snap a photo of any recipe card. Our AI reads handwriting, printed text, even faded cards.',
    },
    {
      icon: Mic,
      title: 'Audio Memories',
      desc: "Record the stories behind the food. Grandma telling you her secret ingredient. Preserved forever.",
    },
    {
      icon: Calendar,
      title: 'Meal Planning',
      desc: "Plan your week, and we'll build a shopping list organized by grocery aisle.",
    },
    {
      icon: BookOpen,
      title: 'Printable Cookbooks',
      desc: "Turn your family's recipes into a beautiful printed cookbook. A gift that lasts generations.",
    },
    {
      icon: Search,
      title: 'Smart Search',
      desc: "Ask 'something with chicken for a cold night' and find the perfect family recipe.",
    },
    {
      icon: Share2,
      title: 'Share Publicly',
      desc: 'Share your best recipes with the world. Or keep them private \u2014 your choice.',
    },
  ]

  return (
    <section id="features" className="bg-flour py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-display text-3xl sm:text-4xl text-cast-iron text-center leading-snug max-w-2xl mx-auto">
            Everything your family's recipe box wishes it could do
          </h2>
        </FadeIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-linen/50 rounded-2xl p-7 sm:p-8 hover:shadow-md transition-shadow border border-linen">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sienna/10 mb-5">
                  <f.icon className="w-6 h-6 text-sienna" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg text-cast-iron mb-2">
                  {f.title}
                </h3>
                <p className="font-body text-sunday-brown/75 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── social proof ───────────────────────────── */

function SocialProof() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="font-handwritten text-3xl sm:text-4xl text-cast-iron mb-4">
            What families are saying
          </h2>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-linen/60 rounded-2xl p-10 sm:p-14 border border-linen">
            <Sparkles className="w-8 h-8 text-honey mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-body text-lg sm:text-xl text-sunday-brown leading-relaxed mb-6">
              We're in beta! Be one of the first families to try Sunday Dinner
              Memories and help us shape the future of recipe preservation.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-sienna hover:bg-sienna/90 text-flour font-body font-semibold px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Join the Beta
              <ArrowRight size={18} />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ──────────────────────── pricing preview ────────────────────────── */

function PricingPreview() {
  const plans = [
    {
      name: 'Starter',
      price: '$7',
      period: '/mo',
      features: '30 AI scans, recipe scaling, PDF export',
      popular: false,
    },
    {
      name: 'Homemade',
      price: '$15',
      period: '/mo',
      features: '100 scans, meal planning, shopping lists',
      popular: true,
    },
    {
      name: 'Heirloom',
      price: '$20',
      period: '/mo',
      features: 'Unlimited scans, printable cookbooks, all features',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="bg-flour py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-display text-3xl sm:text-4xl text-cast-iron text-center leading-snug">
            Plans for every family kitchen
          </h2>
        </FadeIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {plans.map((p, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div
                className={`relative rounded-2xl p-7 sm:p-8 border transition-shadow hover:shadow-md ${
                  p.popular
                    ? 'bg-sienna/5 border-sienna/30 shadow-sm'
                    : 'bg-linen/50 border-linen'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sienna text-flour text-xs font-body font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl text-cast-iron">
                  {p.name}
                </h3>
                <div className="mt-3 mb-4">
                  <span className="font-display text-4xl text-cast-iron">
                    {p.price}
                  </span>
                  <span className="font-body text-stone text-sm">
                    {p.period}
                  </span>
                </div>
                <p className="font-body text-sunday-brown/75 text-sm leading-relaxed">
                  {p.features}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={400}>
          <div className="mt-8 text-center space-y-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 font-body text-sienna hover:text-sienna/80 font-semibold transition-colors"
            >
              View Full Details
              <ChevronRight size={16} />
            </Link>
            <p className="font-body text-stone text-sm">
              All plans include up to 5 active family members + unlimited
              viewers
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ──────────────────────── CTA banner ────────────────────────────── */

function CtaBanner() {
  return (
    <section className="bg-cast-iron py-20 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="font-display text-3xl sm:text-4xl text-flour leading-snug">
            Start preserving your family's recipes today
          </h2>
          <p className="mt-4 font-body text-flour/70 text-lg leading-relaxed">
            It only takes 60 seconds to bring Grandma's recipe box into the
            digital age.
          </p>
          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-sienna hover:bg-sienna/90 text-flour font-body font-semibold text-lg px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          </div>
          <p className="mt-4 font-body text-flour/50 text-sm">
            Have a promo code? You can enter it at checkout.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

/* ──────────────────────── footer ─────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-cream border-t border-linen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/" className="shrink-0">
            <img
              src="/logo.png"
              alt="Sunday Dinner Memories"
              className="h-8 w-auto opacity-80"
            />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="font-body text-sm text-sunday-brown/70 hover:text-sienna transition-colors"
            >
              Home
            </a>
            <Link
              to="/pricing"
              className="font-body text-sm text-sunday-brown/70 hover:text-sienna transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="font-body text-sm text-sunday-brown/70 hover:text-sienna transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="font-body text-sm text-sunday-brown/70 hover:text-sienna transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-linen/80 text-center">
          <p className="font-body text-sm text-stone">
            Made with <Heart size={14} className="inline text-tomato fill-tomato -mt-0.5" /> for
            families who love food
          </p>
          <p className="font-body text-xs text-stone/60 mt-2">
            &copy; 2026 Sunday Dinner Memories
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ──────────────────────── main page ──────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <SocialProof />
      <PricingPreview />
      <CtaBanner />
      <Footer />
    </div>
  )
}
