export const RouteLoader = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 text-center">
      <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Loading experience…</p>
    </div>
  );
};
