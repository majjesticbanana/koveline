import type { RichBodyT } from "@/lib/content/schema";
import { isRtl } from "@/lib/rtl";

/**
 * Total renderer for the RichBody union — no JSON.stringify fallback, no
 * runtime shape-guessing. Direction and lang are set per node so screen
 * readers voice Thaana as Dhivehi.
 */
export function RichBody({ body, size = "base" }: { body: RichBodyT; size?: "base" | "sm" }) {
  const text = size === "sm" ? "text-[1.02rem]" : "text-[1.1rem]";
  const bullet =
    "relative pe-0 ps-6 leading-relaxed before:absolute before:top-[0.7em] before:h-2 before:w-2 before:rounded-full before:bg-brass-deep before:[inset-inline-start:4px]";

  if (body.kind === "text") {
    const rtl = body.lang ? body.lang !== "en" : isRtl(body.value);
    return (
      <p
        dir={rtl ? "rtl" : "ltr"}
        lang={rtl ? (body.lang ?? "dv") : body.lang}
        className={`${rtl ? "thaana" : ""} ${text} leading-relaxed`}
      >
        {body.value}
      </p>
    );
  }

  if (body.kind === "list") {
    const rtl = body.lang ? body.lang !== "en" : body.items.some(isRtl);
    const Tag = body.ordered ? "ol" : "ul";
    return (
      <Tag
        dir={rtl ? "rtl" : "ltr"}
        lang={rtl ? (body.lang ?? "dv") : body.lang}
        className={`${rtl ? "thaana" : ""} flex flex-col gap-2.5`}
      >
        {body.items.map((item, i) => (
          <li key={i} className={`${bullet} ${text}`}>
            {item}
          </li>
        ))}
      </Tag>
    );
  }

  return (
    <div className="space-y-4">
      {body.sections.map((s, i) => {
        const rtl = isRtl(s.heading);
        return (
          <div key={i}>
            <div
              dir={rtl ? "rtl" : "ltr"}
              lang={rtl ? "dv" : undefined}
              className={`${rtl ? "thaana" : ""} mb-1.5 font-bold text-sage-deep`}
            >
              {s.heading}
            </div>
            <RichBody body={s.body} size="sm" />
          </div>
        );
      })}
    </div>
  );
}
