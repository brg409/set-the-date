import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceDetail } from "@/components/PlaceDetail";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getVenueById, VENUES } from "@/data/venues";

// One page per venue in the curated database, built ahead of time. Anything
// not in the database is a 404.
export function generateStaticParams() {
  return VENUES.map((venue) => ({ id: venue.id }));
}

export async function generateMetadata({ params }: PageProps<"/place/[id]">): Promise<Metadata> {
  const { id } = await params;
  const venue = getVenueById(id);
  if (!venue) return {};
  return {
    title: `${venue.name} — KnowaPlace`,
    description: venue.description,
  };
}

export default async function PlacePage({ params }: PageProps<"/place/[id]">) {
  const { id } = await params;
  const venue = getVenueById(id);
  if (!venue) notFound();

  // The page reads the search it came from out of the URL on the client, so
  // it sits inside a Suspense boundary.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PlaceDetail venue={venue} />
    </Suspense>
  );
}
