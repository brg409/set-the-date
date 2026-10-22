import { Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function FriendsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-8 pt-6 sm:pt-8">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Friends</h1>
      <p className="mt-1 text-sm text-muted">
        See where your friends have been and what they think.
      </p>
      <div className="mt-6">
        <EmptyState
          icon={Users}
          title="Friends is coming soon"
          body="Soon you'll be able to add friends and see the places they've loved. For now, save your own spots in My Places."
        />
      </div>
    </main>
  );
}
