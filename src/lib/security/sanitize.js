import DOMPurify from "isomorphic-dompurify";

export function sanitizeText(value) {
  if (typeof value !== "string") return "";
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
