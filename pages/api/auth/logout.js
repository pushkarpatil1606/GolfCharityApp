import { destroySession } from '../../../lib/auth';
import { parse } from 'cookie';

function cookieString() {
  const parts = ['session=', 'Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  if (cookies.session) await destroySession(cookies.session);
  res.setHeader('Set-Cookie', cookieString());
  res.redirect('/login');
}
