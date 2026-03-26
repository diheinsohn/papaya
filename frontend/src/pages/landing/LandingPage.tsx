import HeroSection from '../../components/landing/HeroSection'
import FeaturesGrid from '../../components/landing/FeaturesGrid'
import HowItWorks from '../../components/landing/HowItWorks'
import EmailCapture from '../../components/landing/EmailCapture'
import Footer from '../../components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <EmailCapture />
      <Footer />
    </div>
  )
}
