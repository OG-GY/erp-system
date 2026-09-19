export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-accent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
