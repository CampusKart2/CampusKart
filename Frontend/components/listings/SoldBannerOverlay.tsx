interface SoldBannerOverlayProps {
  className?: string;
}

export default function SoldBannerOverlay({
  className = "",
}: SoldBannerOverlayProps) {
  return (
    <div
      className={[
        "pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-danger px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white shadow-sm",
        className,
      ].join(" ")}
      aria-label="Sold listing"
    >
      SOLD
    </div>
  );
}
