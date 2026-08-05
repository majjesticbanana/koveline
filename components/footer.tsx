import { KoelMark } from "./koel";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-basalt-line">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 px-[22px] py-10 text-center">
        <KoelMark size={30} className="text-brass/80" />
        <span className="text-[0.86rem] text-on-dark-dim">
          <b className="font-display font-bold text-on-dark">Koveline</b> · made in the Maldives
        </span>
      </div>
    </footer>
  );
}
