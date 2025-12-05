const API_BASE = '/api';

function getToken(){ return localStorage.getItem('token'); }
function setToken(t){ localStorage.setItem('token', t); }

async function request(path, opts = {}){
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();
  let body = null;
  try{ body = text ? JSON.parse(text) : null } catch(e){ body = text }
  if (!res.ok) throw { status: res.status, body };
  return body;
}

function isAuthError(err){
  return err && (err.status === 401 || err.status === 403);
}

export default { getToken, setToken, request, isAuthError };
