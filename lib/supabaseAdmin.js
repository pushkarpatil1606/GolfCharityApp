export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceKey,
  };
}

export function isSupabaseReady() {
  return Boolean(getSupabaseConfig());
}

export async function supabaseRequest(path, { method = 'GET', body, query = '', headers = {} } = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  const url = `${config.url}/rest/v1/${path}${query}`;
  const requestHeaders = {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    'Content-Type': 'application/json',
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = data?.message || data?.error || data?.hint || text || `Supabase request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
