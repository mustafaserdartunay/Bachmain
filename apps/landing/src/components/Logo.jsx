import { Link } from "react-router-dom";

/** BACHMAIN resmi logo — 5173 referansıyla aynı boyut (1.65rem yükseklik, oran korunur) */
const LOGO_SRC = "/assets/bachmain-logo.png";

export default function Logo({ className = "", collapsed = false }) {
  return (
    <Link to="/" className={`brand-logo ${className}`} aria-label="BACHMAIN ana sayfa">
      <img
        src={LOGO_SRC}
        alt="BACHMAIN"
        className={collapsed ? "brand-logo-img brand-logo-img-collapsed" : "brand-logo-img"}
        decoding="async"
        draggable={false}
      />
    </Link>
  );
}
