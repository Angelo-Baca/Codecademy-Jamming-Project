// src/Spotify.js
// Authorization Code with PKCE for browser-only React apps
// - Handles: login (PKCE), token caching+refresh, search, savePlaylist.

const clientId = "bf4fb0235ccc46fc80c7c5ae1dde6afb";
const redirectUri = "http://127.0.0.1:3000/callback";
const scopes = ["playlist-modify-public"];
const DEBUG = true; // turn off after confirming

// ---- Token storage (sessionStorage so a refresh wipes it) ----
const TOK_KEY = "sp_token";
const REFRESH_KEY = "sp_refresh";
const EXP_KEY = "sp_exp";    // epoch ms when token expires
const VERIFIER_KEY = "sp_code_verifier"; // used during the code exchange

const dlog = (...a) => DEBUG && console.log("[Spotify]", ...a);

// ---- PKCE helpers ----
async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}
function base64url(bytes) {
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randomString(len = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

function authUrlWithPKCE(codeChallenge) {
  const authEndpoint = "https://accounts.spotify.com/authorize";
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: scopes.join(" "),
  });
  const url = `${authEndpoint}?${params.toString()}`;
  dlog("Authorize URL:", url);
  return url;
}

// ---- Token helpers ----
function getStoredToken() {
  const token = sessionStorage.getItem(TOK_KEY);
  const exp = Number(sessionStorage.getItem(EXP_KEY) || 0);
  if (token && Date.now() < exp - 5000) return token; // 5s skew
  return null;
}
function storeToken({ access_token, refresh_token, expires_in }) {
  sessionStorage.setItem(TOK_KEY, access_token);
  if (refresh_token) sessionStorage.setItem(REFRESH_KEY, refresh_token);
  const expAt = Date.now() + (Number(expires_in) || 3600) * 1000;
  sessionStorage.setItem(EXP_KEY, String(expAt));
}
function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY) || null;
}

// ---- Exchange code for token ----
async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier in sessionStorage.");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const tokenData = await res.json();
  storeToken(tokenData);
  // one-time use: clear verifier and ?code param
  sessionStorage.removeItem(VERIFIER_KEY);
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, document.title, url.toString());
  dlog("Exchanged code for token.");
}

// ---- Refresh token when expired ----
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    dlog("Refresh failed:", res.status, text);
    // clear everything; user will be asked to re-auth
    sessionStorage.removeItem(TOK_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(EXP_KEY);
    return null;
  }
  const tokenData = await res.json();
  storeToken(tokenData);
  dlog("Token refreshed.");
  return tokenData.access_token;
}

// ---- Ensure we have a valid access token ----
async function ensureToken() {
  // 1) Use cached token if valid
  const cached = getStoredToken();
  if (cached) return cached;

  // 2) If just redirected back with ?code=..., exchange it now
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    await exchangeCodeForToken(code);
    return getStoredToken();
  }

  // 3) Try refresh token if we have one
  const refreshed = await refreshAccessToken();
  if (refreshed) return refreshed;

  // 4) Kick off login: create verifier/challenge, store verifier, redirect
  const verifier = randomString(64);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = base64url(await sha256(verifier));
  window.location.assign(authUrlWithPKCE(challenge));
  return null; // navigation occurs
}

// ---- Authenticated fetch helper ----
async function authedFetch(url, options = {}) {
  const token = await ensureToken();
  if (!token) return null; // redirect happened
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    dlog("HTTP error:", res.status, text);
  }
  return res;
}

const Spotify = {
  async getAccessToken() {
    return ensureToken();
  },

  // Search tracks (returns [{id,name,artist,album,uri}])
  async search(term) {
    if (!term || !term.trim()) return [];
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("type", "track");
    url.searchParams.set("q", term.trim());

    const res = await authedFetch(url.toString());
    if (!res || !res.ok) return [];

    const data = await res.json();
    const items = data?.tracks?.items ?? [];
    return items.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.[0]?.name ?? "Unknown",
      album: t.album?.name ?? "Unknown",
      uri: t.uri,
    }));
  },

  // Save a playlist with the given name and track URIs
  async savePlaylist(name, uris) {
    if (!name || !Array.isArray(uris) || uris.length === 0) return false;

    const meRes = await authedFetch("https://api.spotify.com/v1/me");
    if (!meRes || !meRes.ok) throw new Error("Failed to fetch profile");
    const me = await meRes.json();
    const userId = me.id;

    const createRes = await authedFetch(
      `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: "Created with Jammming",
          public: true,
        }),
      }
    );
    if (!createRes || !createRes.ok) throw new Error("Failed to create playlist");
    const playlist = await createRes.json();

    const addRes = await authedFetch(
      `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlist.id)}/tracks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris }),
      }
    );
    if (!addRes || !addRes.ok) throw new Error("Failed to add tracks");
    return true;
  },

  // Tiny debug helper
  debugToken() {
    const exp = Number(sessionStorage.getItem(EXP_KEY) || 0);
    const msLeft = Math.max(0, exp - Date.now());
    dlog("Token status:", {
      hasAccessToken: !!sessionStorage.getItem(TOK_KEY),
      hasRefreshToken: !!sessionStorage.getItem(REFRESH_KEY),
      expiresInSec: Math.round(msLeft / 1000),
    });
  },
};

export default Spotify;
