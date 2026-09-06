const LoadingFallback = () => {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 select-none">
      <div className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden bg-primary/20">
        <div className="h-full bg-primary animate-pulse w-full" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className="text-xs font-semibold text-base-content/60 tracking-wider uppercase">Loading...</span>
      </div>
    </div>
  );
};
export default LoadingFallback;
