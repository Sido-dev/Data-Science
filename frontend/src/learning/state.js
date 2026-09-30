import { useState } from 'react';
import bundled from './curriculum.json';
export const STORAGE_KEY = 'ds-learning-workspace-v2';
export const initialState = () => ({ version: 2, profile: { name: '', track: 'analyst', hours: 5, level: 'beginner', onboarded: false }, completed: {}, notes: {}, answers: {}, milestones: {}, drafts: {}, activity: [] });
const object = value => value && typeof value === 'object' && !Array.isArray(value);
export function validState(s) {
  return object(s) && s.version === 2 && object(s.profile) && typeof s.profile.name === 'string' && s.profile.name.length <= 80 && ['analyst','scientist'].includes(s.profile.track) && [3,5,10].includes(s.profile.hours) && ['beginner','some'].includes(s.profile.level) && typeof s.profile.onboarded === 'boolean' && ['completed','notes','answers','milestones','drafts'].every(k => object(s[k])) && Object.values(s.completed).every(v => typeof v === 'string' && !isNaN(Date.parse(v))) && Object.values(s.notes).every(v => typeof v === 'string' && v.length <= 20000) && Object.values(s.drafts).every(v => typeof v === 'string' && v.length <= 20000) && Object.values(s.answers).every(v => object(v) && Number.isInteger(v.choice) && typeof v.correct === 'boolean') && Object.values(s.milestones).every(v => typeof v === 'boolean') && Array.isArray(s.activity) && s.activity.length <= 500 && s.activity.every(v => object(v) && typeof v.label === 'string' && typeof v.at === 'string' && !isNaN(Date.parse(v.at)));
}
export function validContent(c) {
  const strings = xs => Array.isArray(xs) && xs.length > 0 && xs.every(v => typeof v === 'string' && v.length > 0);
  const unique = xs => new Set(xs.map(x => x.id)).size === xs.length;
  const safeUrl = u => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
  if (!object(c) || !['modules','questions','projects','exercises'].every(k => Array.isArray(c[k]) && c[k].length && c[k].length <= 500 && unique(c[k]) && c[k].every(x => object(x) && typeof x.id === 'string' && /^[a-z0-9-]+$/.test(x.id)))) return false;
  const ids = new Set(c.modules.map(x => x.id));
  return c.modules.every(m => ['title','phase','summary'].every(k => typeof m[k] === 'string' && m[k]) && ['both','analyst','scientist'].includes(m.track) && Number.isFinite(m.hours) && m.hours > 0 && m.hours <= 100 && Array.isArray(m.requires) && m.requires.every(id => ids.has(id) && c.modules.findIndex(x => x.id === id) < c.modules.indexOf(m)) && strings(m.lesson) && strings(m.tasks) && Array.isArray(m.resources) && m.resources.every(r => typeof r.label === 'string' && safeUrl(r.url))) && c.questions.every(q => ids.has(q.module) && typeof q.prompt === 'string' && strings(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && typeof q.explanation === 'string') && c.projects.every(p => ['title','tag','summary','dataset'].every(k => typeof p[k] === 'string') && safeUrl(p.url) && strings(p.milestones) && strings(p.rubric)) && c.exercises.every(e => ['title','prompt','starter','solution','explanation'].every(k => typeof e[k] === 'string') && ['SQL','Python'].includes(e.language));
}
export function useWorkspace() {
  const [storageError, setStorageError] = useState('');
  const [state, setState] = useState(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const parsed = JSON.parse(raw); if (validState(parsed)) return parsed; } } catch {} return initialState(); });
  function update(fn) { setState(old => { const next = typeof fn === 'function' ? fn(old) : fn; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(''); } catch { setStorageError('Your browser could not save this change. Export a backup before closing this page.'); } return next; }); }
  return { state, update, storageError };
}
export function record(s, label) { return [...s.activity, { label, at: new Date().toISOString() }].slice(-500); }
export function trackModules(content, track) { return content.modules.filter(m => m.track === 'both' || m.track === track); }
export function nextModule(modules, completed) { return modules.find(m => !completed[m.id] && m.requires.every(id => completed[id])) || modules.find(m => !completed[m.id]); }
export function download(filename, data) { const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export { bundled };
