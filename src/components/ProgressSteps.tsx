export function ProgressSteps({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
            i <= current ? "bg-coral" : "bg-sand-dark"
          }`}
        />
      ))}
    </div>
  );
}
