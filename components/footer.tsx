import { KoelMark } from "./koel";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-cream/60">
      <div className="mx-auto flex max-w-[960px] items-center justify-center gap-2.5 px-5 py-8 text-[0.86rem] text-cocoa">
        <KoelMark size={18} className="text-cocoa" />
        <span>
          <b className="font-display text-coffee">Koveline</b> · made in the Maldives
        </span>
      </div>
    </footer>
  );
}
