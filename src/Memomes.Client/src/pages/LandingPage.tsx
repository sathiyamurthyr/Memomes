import React from 'react';
import { EnterpriseHeader } from '../components/EnterpriseHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustBarSection } from '../components/landing/TrustBarSection';
import { InteractiveDemoSection } from '../components/landing/InteractiveDemoSection';
import { FeaturesBentoSection } from '../components/landing/FeaturesBentoSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { InteractiveScreenshotsSection } from '../components/landing/InteractiveScreenshotsSection';
import { AiSearchSectionDemo } from '../components/landing/AiSearchSectionDemo';
import { SecurityArchitectureSection } from '../components/landing/SecurityArchitectureSection';
import { ComparisonTableSection } from '../components/landing/ComparisonTableSection';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { EnterpriseCapabilitiesSection } from '../components/landing/EnterpriseCapabilitiesSection';
import { PricingSection } from '../components/landing/PricingSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FaqSection } from '../components/landing/FaqSection';
import { CtaFooterSection } from '../components/landing/CtaFooterSection';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#F5B700] selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Dynamic Background Mesh Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div style={{
          position: 'absolute', top: '-25%', left: '-15%',
          width: '70vw', height: '70vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,183,0,0.08) 0%, transparent 65%)',
          filter: 'blur(100px)'
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '-15%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
          filter: 'blur(100px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '20%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)',
          filter: 'blur(100px)'
        }} />
      </div>

      {/* 80px Sticky Enterprise Header */}
      <EnterpriseHeader onOpenAuth={onOpenAuth} />

      {/* Hero Section */}
      <HeroSection
        onOpenAuth={onOpenAuth}
        onOpenDemoModal={() => {
          const el = document.getElementById('demo');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Trust & Metrics Proof Banner */}
      <TrustBarSection />

      {/* Interactive Product Simulator */}
      <InteractiveDemoSection onOpenAuth={onOpenAuth} />

      {/* Bento Grid Feature Suite */}
      <FeaturesBentoSection onOpenAuth={onOpenAuth} />

      {/* How It Works 5-Step Timeline */}
      <HowItWorksSection onOpenAuth={onOpenAuth} />

      {/* Responsive Screenshots Showcase */}
      <InteractiveScreenshotsSection />

      {/* AI Semantic Search Demo Engine */}
      <AiSearchSectionDemo />

      {/* Security Architecture Flowchart */}
      <SecurityArchitectureSection />

      {/* Modern Competitor Matrix */}
      <ComparisonTableSection />

      {/* Industry Use Cases */}
      <UseCasesSection onOpenAuth={onOpenAuth} />

      {/* Enterprise Capabilities */}
      <EnterpriseCapabilitiesSection onOpenAuth={onOpenAuth} />

      {/* Pricing Calculator & Tiers */}
      <PricingSection onOpenAuth={onOpenAuth} />

      {/* Customer Testimonials */}
      <TestimonialsSection />

      {/* Expandable FAQ Accordion */}
      <FaqSection />

      {/* Conversion Banner & Footer */}
      <CtaFooterSection onOpenAuth={onOpenAuth} />

    </div>
  );
};
