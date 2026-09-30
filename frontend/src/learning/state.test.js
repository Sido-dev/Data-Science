import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// state.js imports JSON through Vite. Load its pure functions without React/JSON imports.
const source=readFileSync(new URL('./state.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export { bundled };','');
const {validState,validContent,initialState,trackModules,nextModule}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const content=JSON.parse(readFileSync(new URL('./curriculum.json',import.meta.url)));
test('bundled curriculum is valid and tracks respect prerequisites',()=>{assert.ok(validContent(content));for(const track of ['analyst','scientist']){const modules=trackModules(content,track),ids=new Set(modules.map(m=>m.id));for(const m of modules)for(const dependency of m.requires)assert.ok(ids.has(dependency));}});
test('next topic respects completion and prerequisites',()=>{const modules=trackModules(content,'scientist');assert.equal(nextModule(modules,{}).id,'python');assert.equal(nextModule(modules,{python:'2026-09-30'}).id,'pandas');assert.equal(nextModule(modules,Object.fromEntries(modules.map(m=>[m.id,'2026-09-30']))),undefined);});
test('invalid backup and unsafe content rejected',()=>{assert.ok(validState(initialState()));const s=initialState();s.profile.hours=0;assert.equal(validState(s),false);const bad=structuredClone(content);bad.modules[0].resources[0].url='javascript:alert(1)';assert.equal(validContent(bad),false);const cycle=structuredClone(content);cycle.modules[0].requires=[cycle.modules.at(-1).id];assert.equal(validContent(cycle),false);});
