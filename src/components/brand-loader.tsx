import reslLogo from "@/assets/resl-logo.png.asset.json";

/** Full-screen RESL brand loader: rings draw, then r and e reveal, hold, fade, loop. */
export function BrandLoader({ label = "Loading…", inline = false }: { label?: string; inline?: boolean }) {
  return (
    <div className={inline ? "brand-loader brand-loader--inline" : "brand-loader"} role="status" aria-label={label}>
      <div className="brand-loader__stage">
        <div className="brand-loader__mark">
          <svg viewBox="0 0 1150 624" className="brand-loader__rings" aria-hidden="true">
            <circle className="brand-loader__ring brand-loader__ring--left" cx="312" cy="312" r="263" />
            <circle className="brand-loader__ring brand-loader__ring--right" cx="838" cy="312" r="263" />
          </svg>
          <img src={reslLogo.url} alt="" className="brand-loader__logo brand-loader__logo--r" draggable={false} />
          <img src={reslLogo.url} alt="" className="brand-loader__logo brand-loader__logo--e" draggable={false} />
        </div>
        <p className="brand-loader__title">RESL MIS Portal</p>
        <p className="brand-loader__tag">{label}</p>
      </div>
    </div>
  );
}
