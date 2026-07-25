import PricingHero from './PricingHero'
import StarterCard from './StarterCard'
import ProCard from './ProCard'
import EnterpriseCard from './EnterpriseCard'

export default function PricingSection() {
  return (
    <section className="relative overflow-x-clip bg-[#F8FAFC] pt-[120px] pb-[120px] font-[Sora,ui-sans-serif,system-ui,sans-serif]">
      {/* Soft floor plane — reference lower third */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#E2E8F0]/55 via-[#F1F5F9]/35 to-transparent"
        aria-hidden
      />

      {/* Tropical flare — top right (Enterprise ambience) */}
      <img
        src="/bachy/pricing-palm.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute top-8 right-0 z-0 hidden h-[220px] w-auto opacity-70 select-none lg:block xl:right-6 xl:h-[260px]"
      />
      <div
        className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(255,176,0,0.28),transparent_65%)] blur-2xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <PricingHero />

        <div className="mt-14 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8 xl:gap-8">
          <StarterCard />
          <ProCard />
          <EnterpriseCard />
        </div>
      </div>
    </section>
  )
}
