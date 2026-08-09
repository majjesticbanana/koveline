import { KoelMark } from "./koel";
import siteCopy from "@/content/site-copy.json";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-deep/30">
      <div className="mx-auto flex max-w-[960px] items-center justify-center gap-2.5 px-5 py-8 text-[0.86rem] text-cocoa">
        <KoelMark size={18} className="text-cocoa" />
        <span>
          <b className="font-display text-coffee">{siteCopy.brand.name}</b> · {siteCopy.brand.footerLine}
        </span>
      </div>
    </footer>
  );
}
