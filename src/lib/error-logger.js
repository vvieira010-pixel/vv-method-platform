import { getSupabaseConfig, readStoredSupabaseSession } from './supabase-storage.js';

const LOG_ENDPOINT_KEY = 'vv:error_log_endpoint';

let _config = null;
let _session = null;

function refreshContext() {
  _config = getSupabaseConfig();
  _session = readStoredSupabaseSession();
}

function buildEntry(error, info = {}) {
  const claims = _session?.access_token
    ? (() => { try { return JSON.parse(atob(_session.access_token.split('.')[1])); } catch { return {}; } })()
    : {};
  return {
    message: error?.message || String(error),
    source: info.source || '',
    stack: error?.stack || '',
    url: window.location.href,
    user_agent: navigator.userAgent,
    auth_uid: _session?.user?.id || claims.sub || '',
    role: (info.role || localStorage.getItem('vv:db_role') || ''),
    metadata: {
      component: info.component || '',
      action: info.action || '',
      view: info.view || '',
      ...info.metadata,
    },
  };
}

async function logToSupabase(entry) {
  try {
    refreshContext();
    if (!_config?.isConfigured) return;
    await fetch(`${_config.url}/rest/v1/error_logs`, {
      method: 'POST',
      headers: {
        apikey: _config.anonKey,
        Authorization: `Bearer ${_session?.access_token || _config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(entry),
    });
  } catch {
  }
}

function logToStorage(entry) {
  try {
    const key = 'vv:error_log';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ ...entry, _ts: Date.now() });
    if (existing.length > 200) existing.splice(0, existing.length - 200);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
  }
}

export function logError(error, info = {}) {
  const entry = buildEntry(error, info);
  console.error('[error-logger]', entry.message, info.component || '');
  logToStorage(entry);
  logToSupabase(entry);
}

export function getLocalErrorLog() {
  try {
    return JSON.parse(localStorage.getItem('vv:error_log') || '[]');
  } catch {
    return [];
  }
}

export function clearLocalErrorLog() {
  try {
    localStorage.removeItem('vv:error_log');
  } catch {
  }
}
