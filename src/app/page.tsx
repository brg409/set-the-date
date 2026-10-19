import { HomeHero } from "@/components/home/HomeHero";
import { QuickStart } from "@/components/home/QuickStart";
import { FeaturedPlaces } from "@/components/home/FeaturedPlaces";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FinalCta } from "@/components/home/FinalCta";

// `/` is the homepage: an introduction that leads into Find (`/find`). The
// Find tab always goes straight to the filters; nobody is forced through here.
export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHero />
      <QuickStart />
      <FeaturedPlaces />
      <HowItWorks />
      <FinalCta />
    </main>
  );
}
