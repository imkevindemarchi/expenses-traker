import jwt from 'jsonwebtoken';
import { Account } from './models.js';
import { ApiError } from './validation.js';
const COOKIE = 'expenses_session';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
export const publicAccount = user => ({ id: user._id.toString(), name: user.name ?? '', surname: user.surname ?? '', email: user.email, monthlyBudgetCents: user.monthlyBudgetCents ?? null, currency:user.currency ?? 'EUR' });
export const loginCookie = (res, user) => {
  const token = jwt.sign({ version: user.sessionVersion }, process.env.JWT_SECRET, { algorithm: 'HS256', subject: user._id.toString(), expiresIn: '7d' });
  res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
};
export const clearCookie = res => res.clearCookie(COOKIE, cookieOptions());
export const auth = async (req, res, next) => {
  try {
    const raw = req.headers.cookie?.split(';').find(part => part.trim().startsWith(`${COOKIE}=`));
    if (!raw) throw new ApiError(401, 'Accedi per continuare.');
    let payload;
    try { payload = jwt.verify(decodeURIComponent(raw.trim().slice(COOKIE.length + 1)), process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { throw new ApiError(401, 'Sessione scaduta. Accedi di nuovo.'); }
    if (typeof payload !== 'object' || !/^[a-f\d]{24}$/i.test(payload.sub ?? '')) throw new ApiError(401, 'Sessione non valida.');
    const user = await Account.findById(payload.sub);
    if (!user || payload.version !== user.sessionVersion) throw new ApiError(401, 'Sessione non valida.');
    req.account = user;
    next();
  } catch (error) { next(error); }
};
// A bounded, expiring per-IP limiter for this single-process application.
export const authLimiter = () => {
  const attempts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, item] of attempts) if (item.until <= now) attempts.delete(key);
    const key = req.ip;
    let item = attempts.get(key);
    if (!item) {
      if (attempts.size >= 10_000) return next(new ApiError(429, 'Troppi tentativi. Riprova tra poco.'));
      item = { count: 0, until: now + 15 * 60 * 1000 };
      attempts.set(key, item);
    }
    if (++item.count > 30) {
      res.set('Retry-After', String(Math.ceil((item.until - now) / 1000)));
      return next(new ApiError(429, 'Troppi tentativi. Riprova tra 15 minuti.'));
    }
    next();
  };
};
