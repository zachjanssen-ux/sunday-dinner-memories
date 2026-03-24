/**
 * OnboardingStep — Reusable wrapper for each onboarding step.
 * Provides consistent layout, animation-ready structure, and brand styling.
 */
export default function OnboardingStep({ children, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center text-center px-6 py-8 animate-fade-in ${className}`}
    >
      {children}
    </div>
  )
}
