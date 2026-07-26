'use client'

import PricingSection from '../components/pricing/PricingSection'

/**
 * Pricing page — pixel implementation of reference mockup.
 * Header/Footer come from App shell.
 * FAQ lives on homepage + /sss (and /faq) only.
 */
export default function PricingPage() {
  return (
    <div className="pricing-ds bg-[#F8FAFC]">
      <PricingSection />
    </div>
  )
}
