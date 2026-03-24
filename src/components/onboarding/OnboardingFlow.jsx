import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Users, BookOpen, Upload, Keyboard, Sparkles } from 'lucide-react'
import OnboardingStep from './OnboardingStep'

const STORAGE_KEY = 'sdm_onboarding_complete'

/**
 * OnboardingFlow — Full-screen multi-step welcome for first-time users.
 * Tracks completion in localStorage. Shows once, then never again.
 */
export default function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  })
  const navigate = useNavigate()
  const totalSteps = 5

  const complete = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
    setVisible(false)
  }, [])

  const next = useCallback(() => {
    if (step < totalSteps - 1) setStep(s => s + 1)
    else complete()
  }, [step, complete])

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  const goToScan = useCallback(() => {
    complete()
    navigate('/scan')
  }, [complete, navigate])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cast-iron/60 backdrop-blur-sm">
      <div className="bg-cream rounded-2xl shadow-2xl w-full max-w-[420px] relative overflow-hidden">
        {/* Skip button */}
        <button
          onClick={complete}
          className="absolute top-4 right-4 text-stone text-sm font-body hover:text-sunday-brown transition-colors z-10"
        >
          Skip
        </button>

        {/* Step content */}
        <div className="min-h-[420px] flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {step === 0 && <StepWelcome />}
            {step === 1 && <StepFamilyKitchen />}
            {step === 2 && <StepScanCard onTryNow={goToScan} />}
            {step === 3 && <StepOtherWays />}
            {step === 4 && <StepShareFamily />}
          </div>

          {/* Bottom nav area */}
          <div className="px-6 pb-6">
            {/* Step dots */}
            <div className="flex justify-center gap-2 mb-5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'bg-sienna scale-110'
                      : i < step
                        ? 'bg-sienna/40'
                        : 'bg-stone/30'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex-1 py-3 rounded-xl font-body font-semibold text-sunday-brown bg-linen hover:bg-linen/70 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 py-3 rounded-xl font-body font-semibold text-flour bg-sienna hover:bg-sienna/90 transition-colors shadow-md"
              >
                {step === totalSteps - 1 ? "Done — Let's Cook!" : step === 0 ? "Let's Go" : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Individual Steps                                                    */
/* ------------------------------------------------------------------ */

function StepWelcome() {
  return (
    <OnboardingStep>
      <img src="/logo.png" alt="Sunday Dinner Memories" className="w-20 h-20 rounded-2xl shadow-lg mb-5" />
      <h2 className="text-2xl font-display text-cast-iron mb-2">
        Welcome to<br />Sunday Dinner Memories
      </h2>
      <p className="font-handwritten text-xl text-sienna mb-3">
        Where every recipe tells a family story
      </p>
      <p className="text-sunday-brown font-body text-sm">
        Let's get you started in 60 seconds.
      </p>
    </OnboardingStep>
  )
}

function StepFamilyKitchen() {
  return (
    <OnboardingStep>
      <div className="w-16 h-16 rounded-2xl bg-linen flex items-center justify-center mb-5">
        <BookOpen className="w-8 h-8 text-sienna" />
      </div>
      <h2 className="text-2xl font-display text-cast-iron mb-3">
        Your Family Kitchen
      </h2>
      <p className="text-sunday-brown font-body text-sm mb-4 max-w-xs">
        This is your family's digital recipe box. Everyone in your family can see what's here — like a shared kitchen drawer, but one that never gets lost.
      </p>
      <p className="font-handwritten text-lg text-sienna">
        One kitchen. All your family recipes.
      </p>
    </OnboardingStep>
  )
}

function StepScanCard({ onTryNow }) {
  return (
    <OnboardingStep>
      <div className="relative w-16 h-16 rounded-2xl bg-linen flex items-center justify-center mb-5">
        <Camera className="w-8 h-8 text-sienna" />
        <Sparkles className="w-5 h-5 text-honey absolute -top-1 -right-1" />
      </div>
      <h2 className="text-2xl font-display text-cast-iron mb-3">
        Scan a Recipe Card
      </h2>
      <p className="text-sunday-brown font-body text-sm mb-2 max-w-xs">
        Got a handwritten recipe card? Snap a photo and we'll do the rest.
      </p>
      <p className="text-sunday-brown font-body text-sm mb-5 max-w-xs">
        The AI reads the handwriting and fills in everything — ingredients, instructions, all of it.
      </p>
      <button
        onClick={onTryNow}
        className="px-6 py-2.5 rounded-xl font-body font-semibold text-flour bg-herb hover:bg-herb/90 transition-colors shadow-md text-sm"
      >
        Try It Now
      </button>
      <p className="text-stone text-xs mt-2 font-body">or continue the tour below</p>
    </OnboardingStep>
  )
}

function StepOtherWays() {
  return (
    <OnboardingStep>
      <h2 className="text-2xl font-display text-cast-iron mb-5">
        Other Ways to Add
      </h2>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <div className="flex items-center gap-4 bg-flour rounded-xl p-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-linen flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-sienna" />
          </div>
          <div className="text-left">
            <p className="font-body font-semibold text-cast-iron text-sm">Photo Upload</p>
            <p className="font-body text-stone text-xs">Already have a photo? Upload it.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-flour rounded-xl p-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-linen flex items-center justify-center flex-shrink-0">
            <Keyboard className="w-5 h-5 text-sienna" />
          </div>
          <div className="text-left">
            <p className="font-body font-semibold text-cast-iron text-sm">Type It In</p>
            <p className="font-body text-stone text-xs">Know it by heart? Just type it.</p>
          </div>
        </div>
      </div>
      <p className="font-handwritten text-lg text-sienna mt-5">
        However your recipes exist, we can bring them in.
      </p>
    </OnboardingStep>
  )
}

function StepShareFamily() {
  return (
    <OnboardingStep>
      <div className="w-16 h-16 rounded-2xl bg-linen flex items-center justify-center mb-5">
        <Users className="w-8 h-8 text-sienna" />
      </div>
      <h2 className="text-2xl font-display text-cast-iron mb-3">
        Share With Family
      </h2>
      <p className="text-sunday-brown font-body text-sm mb-2 max-w-xs">
        Invite your family so everyone has access to the recipe box. Share a family code or send a viewer link.
      </p>
      <p className="font-handwritten text-lg text-sienna mt-3">
        Because recipes are better together.
      </p>
    </OnboardingStep>
  )
}
