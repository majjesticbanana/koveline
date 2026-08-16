import { KoelMark } from "./koel";
import siteCopy from "@/content/site-copy.json";

export function Footer() {
  return (
    <footer className="site-footer">
      {/*
        One line and an address. With no heading, the sentence itself carries
        the band, so it is set larger than body copy — but still well under
        the hero, and with no filled button or accent panel that would pull
        attention away from the questions above it.
      */}
      <section className="footer-contact-band">
        <p className="footer-contact-eyebrow">{siteCopy.contact.eyebrow}</p>
        <p className="footer-contact-body">{siteCopy.contact.body}</p>
        <a className="footer-contact-link" href={`mailto:${siteCopy.brand.contactEmail}`}>
          {siteCopy.brand.contactEmail}
        </a>
      </section>

      <div className="footer-base">
        <KoelMark size={18} className="text-cocoa" />
        <span>
          <b className="font-display text-coffee">{siteCopy.brand.name}</b> · {siteCopy.brand.footerLine}
        </span>
      </div>
    </footer>
  );
}
