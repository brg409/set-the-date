import Image from "next/image";
import Link from "next/link";

/**
 * The approved KnowaPlace wordmark, used as supplied. The only processing
 * is trimming its empty margin and turning the near-white backdrop into real
 * transparency (public/knowaplace-logo.webp); the artwork itself is unchanged.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="KnowaPlace home" className={`inline-flex items-center ${className}`}>
      <Image
        src="/knowaplace-logo.webp"
        alt="KnowaPlace"
        width={1000}
        height={255}
        priority
        unoptimized
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  );
}
