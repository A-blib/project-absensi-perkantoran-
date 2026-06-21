export function sanitizeText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>'"&]/g, (c) => ({ "<": "", ">": "", "'": "", '"': "", "&": "" }[c]))
    .trim();
}
