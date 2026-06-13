function decodeMapsValue(value) {
  let result = String(value || "").trim();

  for (let index = 0; index < 3; index += 1) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch {
      break;
    }
  }

  return result;
}

function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toCoordinateResult(value, match, latitudeIndex, longitudeIndex) {
  const latitude = match[latitudeIndex];
  const longitude = match[longitudeIndex];

  if (!isValidCoordinate(latitude, longitude)) return null;

  return {
    name: extractGoogleMapsPlaceName(value),
    latitude,
    longitude,
  };
}

export function parseGoogleMapsLink(value) {
  if (!value || typeof value !== "string") return null;

  const normalizedValue = decodeMapsValue(value).replaceAll("\\u0026", "&");
  const coordinatePattern = "(-?\\d+(?:\\.\\d+)?),\\s*(-?\\d+(?:\\.\\d+)?)";
  const priorityPatterns = [
    { pattern: new RegExp(`!3d(-?\\d+(?:\\.\\d+)?)!4d(-?\\d+(?:\\.\\d+)?)`), lat: 1, lng: 2 },
    { pattern: new RegExp(`@${coordinatePattern}`), lat: 1, lng: 2 },
    { pattern: new RegExp(`[?&](?:q|query|ll|center)=${coordinatePattern}`, "i"), lat: 1, lng: 2 },
    { pattern: new RegExp(`/search/${coordinatePattern}`, "i"), lat: 1, lng: 2 },
    { pattern: new RegExp(`/dir/(?:[^/?@]+/)?${coordinatePattern}`, "i"), lat: 1, lng: 2 },
  ];

  for (const item of priorityPatterns) {
    const match = normalizedValue.match(item.pattern);
    const result = match
      ? toCoordinateResult(normalizedValue, match, item.lat, item.lng)
      : null;

    if (result) return result;
  }

  const genericCoordinatePattern = /(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/g;
  const matches = Array.from(normalizedValue.matchAll(genericCoordinatePattern));

  for (const match of matches) {
    const result = toCoordinateResult(normalizedValue, match, 1, 2);
    if (result) return result;
  }

  return null;
}

export function extractGoogleMapsPlaceName(value) {
  const normalizedValue = decodeMapsValue(value);
  const placeMatch = normalizedValue.match(/\/place\/([^/?@]+)/);

  if (!placeMatch) return "";

  return decodeMapsValue(placeMatch[1]).replaceAll("+", " ");
}
