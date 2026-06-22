// If VITE_API_BASE is set, we use it. Otherwise we fall back to "" (same-origin).
// Examples:
//   VITE_API_BASE=http://192.168.1.37:5001
//   VITE_API_BASE=https://abcd.ngrok-free.app
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

// nearby 
export async function fetchNearbyAll(lat, lon, radius_km = 10) {
  const res = await fetch(apiUrl(`/api/nearby/all?lat=${lat}&lon=${lon}&radius_km=${radius_km}`));
  if (!res.ok) throw new Error("Failed to fetch nearby facilities");
  return res.json();
}

export async function fetchNearbyByType(lat, lon, type, radius_km = 20) {
  const res = await fetch(apiUrl(`/api/nearby?lat=${lat}&lon=${lon}&type=${type}&radius_km=${radius_km}`));
  if (!res.ok) throw new Error("Failed to fetch facilities");
  return res.json();
}

// contacts 
export async function fetchContacts(deviceId) {
  const res = await fetch(apiUrl(`/api/contacts?device_id=${deviceId}`));
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

export async function addContact(deviceId, name, phone) {
  const res = await fetch(apiUrl(`/api/contacts`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, name, phone })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add contact");
  return data;
}

export async function deleteContact(deviceId, contactId) {
  const res = await fetch(apiUrl(`/api/contacts/${contactId}?device_id=${deviceId}`), {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete contact");
  return res.json();
}

//  sms alert 
export async function sendSosAlert(deviceId, lat, lon, nearestHospital = null) {
  const res = await fetch(apiUrl(`/api/sms/alert`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id: deviceId,
      lat,
      lon,
      nearest_hospital: nearestHospital
    })
  });
  return res.json();
}

// hazards 
export async function fetchNearbyHazards(lat, lon, radius_km = 50) {
  const res = await fetch(apiUrl(`/api/hazards/nearby?lat=${lat}&lon=${lon}&radius_km=${radius_km}`));
  if (!res.ok) throw new Error("Failed to fetch hazards");
  return res.json();
}

export async function reportHazard(deviceId, hazardType, description, lat, lon) {
  const res = await fetch(apiUrl(`/api/hazards`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id: deviceId,
      hazard_type: hazardType,
      description,
      lat,
      lon
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to report hazard");
  return data;
}

export async function upvoteHazard(hazardId) {
  const res = await fetch(apiUrl(`/api/hazards/${hazardId}/upvote`), { method: "POST" });
  if (!res.ok) throw new Error("Failed to upvote");
  return res.json();
}
export async function downvoteHazard(hazardId) {
  const res = await fetch(apiUrl(`/api/hazards/${hazardId}/downvote`), { method: "POST" });
  if (!res.ok) throw new Error("Failed to downvote");
  return res.json();
}

export async function unupvoteHazard(hazardId) {
  const res = await fetch(apiUrl(`/api/hazards/${hazardId}/unupvote`), { method: "POST" });
  if (!res.ok) throw new Error("Failed to unupvote");
  return res.json();
}
export async function undownvoteHazard(hazardId) {
  const res = await fetch(apiUrl(`/api/hazards/${hazardId}/undownvote`), { method: "POST" });
  if (!res.ok) throw new Error("Failed to undownvote");
  return res.json();
}

//  risk zones 
export async function fetchRiskZones(lat, lon, radius_km = 100) {
  const res = await fetch(apiUrl(`/api/risk-zones?lat=${lat}&lon=${lon}&radius_km=${radius_km}`));
  if (!res.ok) throw new Error("Failed to fetch risk zones");
  return res.json();
}
