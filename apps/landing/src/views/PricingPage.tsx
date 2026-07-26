'use client'

import PricingSection from '../components/pricing/PricingSection'
import { FaqSection } from './SupportPages'

/**
 * Pricing page — pixel implementation of reference mockup.
 * Header/Footer come from App shell.
 */
export default function PricingPage() {
  return (
    <div className="pricing-ds bg-[#F8FAFC]">
      <PricingSection />
      <FaqSection />
    </div>
  )
}
