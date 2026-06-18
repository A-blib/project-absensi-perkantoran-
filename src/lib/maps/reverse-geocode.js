function pickAddressPart(address = {}) {
  return [
    address.road,
    address.neighbourhood || address.suburb || address.village,
    address.city || address.town || address.county,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function reverseGeocodeLocation(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: "18",
    addressdetails: "1",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        signal: controller.signal,
        headers: {
          "user-agent": "AbsensiPerkantoran/1.0 reverse-geocode",
          accept: "application/json",
        },
      },
    );

    if (!response.ok) return "";

    const data = await response.json();
    return pickAddressPart(data.address) || data.display_name || "";
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}
