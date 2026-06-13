import { NextResponse } from "next/server";
import { parseGoogleMapsLink } from "@/lib/maps/google-maps";
import { requireAdminSession } from "@/server/auth/guards";

const MAX_REDIRECTS = 6;
const REQUEST_TIMEOUT_MS = 4500;
const ALLOWED_HOSTS = [
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
];

function isAllowedMapsUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      ALLOWED_HOSTS.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

function toAbsoluteUrl(location, baseUrl) {
  try {
    return new URL(location, baseUrl).toString();
  } catch {
    return "";
  }
}

async function fetchRedirectLocation(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; AbsensiPerkantoran/1.0; +https://localhost)",
      },
    });

    return response.headers.get("location");
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveRedirectUrl(initialUrl) {
  let currentUrl = initialUrl;

  for (let index = 0; index < MAX_REDIRECTS; index += 1) {
    const parsed = parseGoogleMapsLink(currentUrl);
    if (parsed) return { url: currentUrl, location: parsed };

    let location = await fetchRedirectLocation(currentUrl, "HEAD");

    if (!location) {
      location = await fetchRedirectLocation(currentUrl, "GET");
    }

    if (!location) return { url: currentUrl, location: null };

    const nextUrl = toAbsoluteUrl(location, currentUrl);
    if (!nextUrl || !isAllowedMapsUrl(nextUrl) || nextUrl === currentUrl) {
      return { url: currentUrl, location: null };
    }

    currentUrl = nextUrl;
  }

  return { url: currentUrl, location: parseGoogleMapsLink(currentUrl) };
}

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const url = String(body.url || "").trim();

  if (!url || url.length > 2000 || !isAllowedMapsUrl(url)) {
    return NextResponse.json(
      { message: "Link Google Maps tidak valid." },
      { status: 422 },
    );
  }

  const directResult = parseGoogleMapsLink(url);
  if (directResult) {
    return NextResponse.json({ location: directResult });
  }

  try {
    const result = await resolveRedirectUrl(url);

    if (result.location) {
      return NextResponse.json({ location: result.location });
    }
  } catch {
    return NextResponse.json(
      {
        message:
          "Link pendek Google Maps belum bisa dibaca. Coba buka link tersebut, lalu salin URL panjang dari address bar.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json(
    {
      message:
        "Koordinat tidak ditemukan di link. Pastikan link berasal dari titik lokasi Google Maps, bukan hanya halaman pencarian.",
    },
    { status: 422 },
  );
}
