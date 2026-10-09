import {CURRENCIES} from './currency.js';
import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const owner = { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true };
const account = new Schema({
  name: { type: String, default: '', maxlength: 60 },
  surname: { type: String, default: '', maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  monthlyBudgetCents: { type: Number, default: null, min: 0, max: 100_000_000, validate: value => value == null || Number.isSafeInteger(value) },
  currency: {type:String,enum:CURRENCIES,default:'EUR'},
  sessionVersion: { type: Number, default: 0 },
}, { timestamps: true });
const category = new Schema({
  user: owner, name: { type: String, required: true, maxlength: 60 },
  color: { type: String, required: true, default: '#32cd32' },
}, { timestamps: true });
category.index({ user: 1, name: 1 }, { unique: true });
const subcategory = new Schema({
  user: owner, name: { type: String, required: true, maxlength: 60 },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
}, { timestamps: true });
subcategory.index({ user: 1, category: 1, name: 1 }, { unique: true });
const entry = new Schema({
  user: owner,
  kind: { type: String, enum: ['expense', 'income'], required: true },
  amountCents: { type: Number, required: true, min: 1, max: 100_000_000, validate: Number.isSafeInteger },
  date: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: Schema.Types.ObjectId, ref: 'Subcategory', required: true },
}, { timestamps: true });
entry.index({ user: 1, date: -1, createdAt: -1 });
export const Account = model('Account', account);
export const Category = model('Category', category);
export const Subcategory = model('Subcategory', subcategory);
export const Entry = model('Entry', entry);
