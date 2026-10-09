import {changePassword} from './password.js';
import {deleteAccount} from './delete-account.js';
import {profileInput} from './profile.js';
import {saveAccountSettings} from './account-settings.js';
import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { Account, Category, Subcategory, Entry } from './models.js';
import { auth, authLimiter, publicAccount, loginCookie, clearCookie } from './auth.js';
import { ApiError, fail, text, objectId, dateKey, amountCents, color, monthRange, owned, credentials, monthlyBudgetCents, transactionPageLimit, yearRange } from './validation.js';

export const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY' });
  if (process.env.NODE_ENV === 'production') res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-store');
  const allowedOrigins = [process.env.APP_ORIGIN, ...(process.env.APP_ORIGINS || '').split(',')].map(origin => origin?.trim()).filter(Boolean);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return next(new ApiError(403, 'Origine della richiesta non autorizzata.'));
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  if (['POST', 'PATCH'].includes(req.method) && req.path.startsWith('/api') && req.path !== '/api/auth/logout' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return next(new ApiError(400, 'Invia un oggetto JSON valido.'));
  next();
});
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const limiter = authLimiter();
app.get('/api/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ ok: mongoose.connection.readyState === 1 }));
app.post('/api/auth/register', limiter, asyncRoute(async (req, res) => {
  const input = credentials(req.body, true);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      [user] = await Account.create([{ name: input.name, email: input.email, passwordHash }], { session });
      const categories = await Category.insertMany([
        { user: user._id, name: 'Lavoro', color: '#32cd32' },
        { user: user._id, name: 'Extra', color: '#8b5cf6' },
        { user: user._id, name: 'Necessità', color: '#38bdf8' },
      ], { session });
      await Subcategory.insertMany([
        { user: user._id, category: categories[0]._id, name: 'Stipendio' },
        { user: user._id, category: categories[1]._id, name: 'Tempo libero' },
        { user: user._id, category: categories[2]._id, name: 'Visite' },
        { user: user._id, category: categories[2]._id, name: 'Cura personale' },
      ], { session });
    });
  } finally { await session.endSession(); }
  loginCookie(res, user);
  res.status(201).json({ user: publicAccount(user) });
}));
app.post('/api/auth/login', limiter, asyncRoute(async (req, res) => {
  const input = credentials(req.body);
  const user = await Account.findOne({ email: input.email }).select('+passwordHash');
  // Use the same expensive hash verification for unknown email addresses.
  const dummyHash = '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? dummyHash);
  if (!user || !valid) fail('Email o password non corretti.', 401);
  loginCookie(res, user);
  res.json({ user: publicAccount(user) });
}));
app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicAccount(req.account) }));
app.post('/api/auth/logout', auth, asyncRoute(async (req, res) => {
  await Account.updateOne({ _id: req.account._id }, { $inc: { sessionVersion: 1 } });
  clearCookie(res);
  res.json({ ok: true });
}));
app.use('/api', auth);
const userId = req => req.account._id;
app.patch('/api/account/profile', asyncRoute(async(req,res)=>{
 const profile=profileInput(req.body);
 const account=await Account.findOneAndUpdate({_id:userId(req)},{$set:profile},{new:true,runValidators:true});
 if(!account)fail('Account non trovato.',404);
 res.json({user:publicAccount(account)});
}));
app.delete('/api/account', asyncRoute(async(req,res)=>{
 await deleteAccount(userId(req),req.body?.confirm);
 clearCookie(res);
 res.json({ok:true});
}));
app.patch('/api/account/password', limiter, asyncRoute(async(req,res)=>{
 const account=await changePassword(userId(req),req.body);
 loginCookie(res,account);
 res.json({ok:true});
}));
app.patch('/api/account/settings', limiter, asyncRoute(async(req,res)=>{
 const {account,passwordChanged}=await saveAccountSettings(userId(req),req.body);
 if(passwordChanged)loginCookie(res,account);
 res.json({user:publicAccount(account)});
}));
app.patch('/api/account/budget', asyncRoute(async (req, res) => {
 const limit = monthlyBudgetCents(req.body.monthlyBudget);
 const account = await Account.findOneAndUpdate({ _id: userId(req) }, { $set: { monthlyBudgetCents: limit } }, { new: true, runValidators: true });
 if (!account) fail('Account non trovato.', 404);
 res.json({ user: publicAccount(account) });
}));
app.get('/api/categories', asyncRoute(async (req, res) => {
  const [categories, subcategories] = await Promise.all([
    Category.find(owned(userId(req))).sort({ name: 1 }).lean(),
    Subcategory.find(owned(userId(req))).sort({ name: 1 }).lean(),
  ]);
  res.json({ categories, subcategories });
}));
app.post('/api/categories', asyncRoute(async (req, res) => {
  const category = await Category.create({ user: userId(req), name: text(req.body.name, 'Nome', 60), color: color(req.body.color) });
  res.status(201).json({ category });
}));
app.patch('/api/categories/:id', asyncRoute(async (req, res) => {
  const category = await Category.findOneAndUpdate(owned(userId(req), req.params.id), { $set: { name: text(req.body.name, 'Nome', 60), color: color(req.body.color) } }, { new: true, runValidators: true });
  if (!category) fail('Categoria non trovata.', 404);
  res.json({ category });
}));
app.post('/api/subcategories', asyncRoute(async (req, res) => {
  const categoryId = objectId(req.body.category);
  const name = text(req.body.name, 'Nome', 60);
  let subcategory;
  await mongoose.connection.transaction(async session => {
    const category = await touchCategory(categoryId, userId(req), session);
    if (!category) fail('Categoria non trovata.', 404);
    [subcategory] = await Subcategory.create([{ user: userId(req), category: category._id, name }], { session });
  });
  res.status(201).json({ subcategory });
}));
app.patch('/api/subcategories/:id', asyncRoute(async (req, res) => {
  const filter = owned(userId(req), req.params.id);
  const categoryId = objectId(req.body.category);
  const name = text(req.body.name, 'Nome', 60);
  let item;
  await mongoose.connection.transaction(async session => {
    item = await Subcategory.findOneAndUpdate(filter, { $set: { updatedAt: new Date() } }, { session, new: true });
    if (!item) fail('Sottocategoria non trovata.', 404);
    const category = await touchCategory(categoryId, userId(req), session);
    if (!category) fail('Categoria non trovata.', 404);
    if (item.category.toString() !== category._id.toString() && await Entry.exists({ ...owned(userId(req)), subcategory: item._id }).session(session)) fail('Questa sottocategoria è utilizzata: mantieni la categoria principale oppure riassegna prima i movimenti.', 409);
    item.name = name; item.category = category._id;
    await item.save({ session });
  });
  res.json({ subcategory: item });
}));
// Touch referenced records in the same transaction as mutations. This serializes
// concurrent deletion/movement operations and prevents dangling references.
const touchCategory = (id, owner, session) => Category.findOneAndUpdate({ _id: id, user: owner }, { $set: { updatedAt: new Date() } }, { session, new: true });
app.delete('/api/categories/:id', asyncRoute(async (req, res) => {
  const filter = owned(userId(req), req.params.id);
  await mongoose.connection.transaction(async session => {
    const category = await touchCategory(filter._id, userId(req), session);
    if (!category) fail('Categoria non trovata.', 404);
    if (await Subcategory.exists({ user: userId(req), category: category._id }).session(session) || await Entry.exists({ user: userId(req), category: category._id }).session(session)) fail('Categoria in uso: elimina o riassegna prima sottocategorie e movimenti.', 409);
    await Category.deleteOne(filter, { session });
  });
  res.json({ ok: true });
}));
app.delete('/api/subcategories/:id', asyncRoute(async (req, res) => {
  const filter = owned(userId(req), req.params.id);
  await mongoose.connection.transaction(async session => {
    const item = await Subcategory.findOneAndUpdate(filter, { $set: { updatedAt: new Date() } }, { new: true, session });
    if (!item) fail('Sottocategoria non trovata.', 404);
    if (await Entry.exists({ user: userId(req), subcategory: item._id }).session(session)) fail('Sottocategoria in uso: riassegna prima i movimenti.', 409);
    await Subcategory.deleteOne(filter, { session });
  });
  res.json({ ok: true });
}));
export const entryInput = body => {
  if (!['expense', 'income'].includes(body.kind)) fail('Tipo di movimento non valido.');
  if(!body.subcategory)fail('Seleziona una sottocategoria.');
  return {kind:body.kind,amountCents:amountCents(body.amount),date:dateKey(body.date),category:objectId(body.category),subcategory:objectId(body.subcategory)};
};
const entryFields = '_id user kind amountCents date category subcategory createdAt updatedAt';
const saveEntry = async (req, id) => {
  const input = entryInput(req.body);
  let result;
  await mongoose.connection.transaction(async session => {
    const category = await touchCategory(input.category, userId(req), session);
    if (!category) fail('Categoria non trovata.', 404);
    if (input.subcategory) {
      const sub = await Subcategory.findOneAndUpdate({ _id: input.subcategory, user: userId(req), category: input.category }, { $set: { updatedAt: new Date() } }, { new: true, session });
      if (!sub) fail('La sottocategoria deve appartenere alla categoria selezionata.');
    }
    if (id) {
      result = await Entry.findOneAndUpdate(owned(userId(req), id), { $set: input }, { new: true, runValidators: true, session }).select(entryFields);
      if (!result) fail('Movimento non trovato.', 404);
    } else [result] = await Entry.create([{ user: userId(req), ...input }], { session });
  });
  return result;
};
app.post('/api/entries', asyncRoute(async (req, res) => res.status(201).json({ entry: await saveEntry(req) })));
app.patch('/api/entries/:id', asyncRoute(async (req, res) => res.json({ entry: await saveEntry(req, req.params.id) })));
app.delete('/api/entries/:id', asyncRoute(async (req, res) => {
  const result = await Entry.deleteOne(owned(userId(req), req.params.id));
  if (!result.deletedCount) fail('Movimento non trovato.', 404);
  res.json({ ok: true });
}));
export const periodFilter = async req => {
  const range = monthRange(req.query.month);
  const filter = { ...owned(userId(req)), date: { $gte: range.from, $lte: range.to } };
  if (req.query.category) filter.category = new mongoose.Types.ObjectId(objectId(req.query.category));
  if (req.query.kind) {
    if (!['income', 'expense'].includes(req.query.kind)) fail('Filtro non valido.');
    filter.kind = req.query.kind;
  }
  if (req.query.q) {
    const query = text(req.query.q, 'Ricerca', 100);
    const pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const name = { $regex: pattern, $options: 'i' };
    const [categories, subcategories] = await Promise.all([Category.find({...owned(userId(req)),name}).select('_id').lean(),Subcategory.find({...owned(userId(req)),name}).select('_id').lean()]);
    filter.$or = [{category:{$in:categories.map(item=>item._id)}},{subcategory:{$in:subcategories.map(item=>item._id)}}];
  }
  return filter;
};
app.get('/api/entries', asyncRoute(async (req, res) => {
  const filter = await periodFilter(req);
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) fail('Pagina non valida.');
  const limit = transactionPageLimit(req.query.limit);
  const [entries, total] = await Promise.all([
    Entry.find(filter).select(entryFields).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Entry.countDocuments(filter),
  ]);
  res.json({ entries, page, limit, total, totalPages: Math.ceil(total / limit) });
}));
app.get('/api/summary', asyncRoute(async (req, res) => {
  const filter = await periodFilter(req);
  const [byKind, byCategory, daily] = await Promise.all([
    Entry.aggregate([{ $match: filter }, { $group: { _id: '$kind', total: { $sum: '$amountCents' }, count: { $sum: 1 } } }]),
    Entry.aggregate([{ $match: { ...filter, kind: filter.kind === 'income' ? '__no_expense__' : 'expense' } }, { $group: { _id: '$category', total: { $sum: '$amountCents' } } }, { $sort: { total: -1 } }]),
    Entry.aggregate([{ $match: filter }, { $group: { _id: { date: '$date', kind: '$kind' }, total: { $sum: '$amountCents' } } }, { $sort: { '_id.date': 1 } }]),
  ]);
  const income = byKind.find(item => item._id === 'income')?.total ?? 0;
  const expense = byKind.find(item => item._id === 'expense')?.total ?? 0;
  res.json({ income, expense, balance: income - expense, count: byKind.reduce((sum, item) => sum + item.count, 0), byCategory, daily });
}));
app.get('/api/annual-summary', asyncRoute(async (req, res) => {
 const range=yearRange(req.query.year);const filter={...owned(userId(req)),date:{$gte:range.from,$lte:range.to}};
 const [byKind,byCategory,monthly,entries]=await Promise.all([
  Entry.aggregate([{$match:filter},{$group:{_id:'$kind',total:{$sum:'$amountCents'},count:{$sum:1}}}]),
  Entry.aggregate([{$match:{...filter,kind:'expense'}},{$group:{_id:'$category',total:{$sum:'$amountCents'}}},{$sort:{total:-1}}]),
  Entry.aggregate([{$match:filter},{$group:{_id:{month:{$substrBytes:['$date',0,7]},kind:'$kind'},total:{$sum:'$amountCents'}}},{$sort:{'_id.month':1}}]),
  Entry.find(filter).select(entryFields).sort({date:-1,createdAt:-1}).limit(5).lean()
 ]);
 const income=byKind.find(item=>item._id==='income')?.total??0;const expense=byKind.find(item=>item._id==='expense')?.total??0;
 res.json({year:req.query.year,income,expense,balance:income-expense,count:byKind.reduce((sum,item)=>sum+item.count,0),byCategory,monthly,daily:[],entries});
}));
app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint non trovato.' }));
const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*path}', (req, res) => res.sendFile(`${clientDist}/index.html`));
}
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ message: 'Email o nome già presente. Scegli un valore diverso.' });
  if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Richiesta non valida.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Richiesta troppo grande.' });
  if (['MongoServerSelectionError','MongooseServerSelectionError','MongoTopologyClosedError','MongoNetworkError'].includes(error.name)) {
    console.error('Database non raggiungibile:', error.name, error.code ?? error.cause?.code ?? 'Verifica rete e accesso MongoDB Atlas.');
    return res.status(503).json({message:'Il database non è raggiungibile. Riprova tra poco.'});
  }
  console.error('API error:', error.name);
  res.status(500).json({ message: 'Si è verificato un errore. Riprova tra poco.' });
});
