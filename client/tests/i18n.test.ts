import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import {createInstance} from 'i18next';
const root=fileURLToPath(new URL('../',import.meta.url));
const load=(name:string)=>JSON.parse(readFileSync(path.join(root,'src/i18n/locales',name+'.json'),'utf8'));
const catalogs={it:{translation:load('it'),messages:load('messages.it')},en:{translation:load('en'),messages:load('messages.en')}};
function leaves(value:Record<string,unknown>,prefix=''):Record<string,string>{return Object.fromEntries(Object.entries(value).flatMap(([key,item])=>typeof item==='string'?[[prefix+key,item]]:Object.entries(leaves(item as Record<string,unknown>,prefix+key+'.'))));}
function files(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):/\.[tj]sx?$/.test(entry.name)?[path.join(dir,entry.name)]:[]);}
function literals(node:ts.Node):string[]{if(ts.isStringLiteralLike(node))return [node.text];if(ts.isConditionalExpression(node))return [...literals(node.whenTrue),...literals(node.whenFalse)];return [];}
test('Italian and English catalogs have matching keys and interpolation variables',()=>{
 for(const ns of ['translation','messages'] as const){const it=leaves(catalogs.it[ns]);const en=leaves(catalogs.en[ns]);assert.deepEqual(Object.keys(it).sort(),Object.keys(en).sort());for(const key of Object.keys(it)){assert.ok(en[key].trim(),key);const variables=(s:string)=>s.match(/{{\s*\w+\s*}}/g)?.sort()??[];assert.deepEqual(variables(it[key]),variables(en[key]),key);}}
});
test('Every literal translation call and server error has a catalog entry',()=>{
 for(const file of [...files(path.join(root,'src')),...files(path.join(root,'../server/src'))]){
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const visit=(node:ts.Node)=>{
 if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['tr','t','fail','setError','setDeleteError'].includes(node.expression.text)&&node.arguments[0]){
 const catalog=node.expression.text==='t'?leaves(catalogs.en.translation):catalogs.en.messages;
 for(const key of literals(node.arguments[0]))if(key)assert.ok(Object.hasOwn(catalog,key),`${file}: missing ${key}`);
 }
 if(ts.isPropertyAssignment(node)&&node.name.getText(source)==='message')for(const key of literals(node.initializer))assert.ok(Object.hasOwn(catalogs.en.messages,key),`${file}: missing server message ${key}`);
 ts.forEachChild(node,visit);
 };visit(source);
 }
});
test('Transaction counts use singular and plural in both languages',async()=>{
 const i18n=createInstance();await i18n.init({resources:catalogs,defaultNS:'messages',keySeparator:false,lng:'en'});
 for(const lang of ['it','en']){await i18n.changeLanguage(lang);assert.equal(i18n.t('{{count}} movimenti registrati',{count:1}),lang==='it'?'1 movimento registrato':'1 recorded transaction');assert.equal(i18n.t('{{count}} movimenti registrati',{count:2}),lang==='it'?'2 movimenti registrati':'2 recorded transactions');assert.equal(i18n.t('{{count}} movimenti · {{month}}',{count:1,month:'October'}),lang==='it'?'1 movimento · October':'1 transaction · October');}
});
