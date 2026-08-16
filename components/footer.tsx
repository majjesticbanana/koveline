import { KoelMark } from "./koel";
import siteCopy from "@/content/site-copy.json";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-deep/30">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-2 px-5 py-8 text-center text-[0.86rem] text-cocoa">
        <div className="flex items-center gap-2.5">
          <KoelMark size={18} className="text-cocoa" />
          <span>
            <b className="font-display text-coffee">{siteCopy.brand.name}</b> · {siteCopy.brand.footerLine}
          </span>
        </div>
        <a
          href={`mailto:${siteCopy.brand.contactEmail}`}
          className="footer-contact text-[0.82rem] transition-colors"
        >
          {siteCopy.brand.contactLabel} — {siteCopy.brand.contactEmail}
        </a>
      </div>
    </footer>
  );
}
