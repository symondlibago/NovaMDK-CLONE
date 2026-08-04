import React from "react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import PageHero from "../components/shop/PageHero";
import Reveal from "../components/ui/Reveal";
import GhlEmbed from "../components/ui/GhlEmbed";

// The entire contact experience — the info panel, the form, the styling — is built
// inside the GHL survey, so this page renders the embed alone. Adding our own panel
// or card around it just duplicates what the survey already draws.
const GHL_SURVEY_ID = "bcbI55IDrwKXviOGwxJa";
const GHL_SURVEY_SRC = `https://api.leadconnectorhq.com/widget/survey/${GHL_SURVEY_ID}`;

export default function ContactPage() {
  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Contact Us"
        description="Get in touch with the NovaMDK care team — questions about treatments, orders, kiosk partnerships or anything else."
        path="/contact"
      />
      <Navbar />

      {/* Kept for the page's own H1 and back button: the survey's headings live inside
          a cross-origin frame, so without this the page has no indexable heading. */}
      <PageHero
        showBack
        eyebrow="Contact"
        title="We're here to help."
        subtitle="Questions about your protocol, an order, or getting started? Message our care team — a real person replies, usually within one business day."
        chips={["Reply within 1 business day", "HIPAA-compliant", "U.S.-licensed providers"]}
      />

      <section className="mx-auto max-w-[1140px] px-5 pb-[clamp(2.8rem,6vw,4.5rem)] pt-[clamp(1rem,2.5vw,2rem)] md:px-10">
        <Reveal>
          <GhlEmbed id={GHL_SURVEY_ID} src={GHL_SURVEY_SRC} title="NovaMDK contact form" minH={900} />
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
