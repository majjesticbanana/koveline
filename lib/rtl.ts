/** RTL-script detection (Thaana + Arabic ranges) for per-string direction. */
const RTL =
  /[\u0600-\u06FF\u0750-\u077F\u0780-\u07BF\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
export const isRtl = (t: string) => RTL.test(t);
