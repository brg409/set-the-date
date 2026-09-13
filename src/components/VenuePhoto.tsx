import {
  Martini,
  Wine,
  UtensilsCrossed,
  Building2,
  Coffee,
  Beer,
  IceCreamCone,
  Gamepad2,
  Flag,
  Sailboat,
  CircleDot,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Venue, VenueCategory } from "@/lib/types";

/**
 * Renders a real photo when `venue.imageUrl` is present, otherwise falls
 * back to a designed gradient + icon placeholder keyed on category. This
 * keeps the layout identical once a real photo pipeline is wired up.
 */

const CATEGORY_GRADIENT: Record<VenueCategory, string> = {
  cocktail_bar: "from-[#241835] via-[#3a2148] to-[#1f2a44]",
  wine_bar: "from-[#4a1f2b] via-[#5c2836] to-[#2a1620]",
  restaurant: "from-[#5c3b23] via-[#7a4a2a] to-[#3d2817]",
  rooftop_bar: "from-[#1f2a44] via-[#33436a] to-[#e2683f]/60",
  cafe: "from-[#4b3826] via-[#6b5238] to-[#3a2c1c]",
  activity: "from-[#1d4a4a] via-[#2c6363] to-[#c99a3c]/70",
  brewery: "from-[#3b2a17] via-[#5c4020] to-[#2a1d10]",
  dessert: "from-[#5c2b3f] via-[#7a3a52] to-[#3d1c2a]",
};

const CATEGORY_ICON: Record<VenueCategory, LucideIcon> = {
  cocktail_bar: Martini,
  wine_bar: Wine,
  restaurant: UtensilsCrossed,
  rooftop_bar: Building2,
  cafe: Coffee,
  activity: Sparkles,
  brewery: Beer,
  dessert: IceCreamCone,
};

// A few activity venues get a more specific icon than the category default.
const VENUE_ICON_OVERRIDE: Record<string, LucideIcon> = {
  "arch-street-arcade-bar": Gamepad2,
  "fishtown-fairways": Flag,
  "schuylkill-banks-picnic-co": Sailboat,
  "mural-alley-bocce": CircleDot,
};

export function VenuePhoto({
  venue,
  className = "",
  iconSize = 40,
}: {
  venue: Venue;
  className?: string;
  iconSize?: number;
}) {
  if (venue.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={venue.imageUrl}
        alt={venue.name}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const Icon = VENUE_ICON_OVERRIDE[venue.id] ?? CATEGORY_ICON[venue.category];
  const gradient = CATEGORY_GRADIENT[venue.category];

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      <Icon size={iconSize} strokeWidth={1.5} className="relative text-white/90" />
    </div>
  );
}
