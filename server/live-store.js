// in-memory store for live execution progress
// keeps it out of the filesystem to avoid race conditions w/ nodemon
const _store = new Map();

export function setLive(jobId, data) { _store.set(jobId, data); }
export function getLive(jobId) { return _store.get(jobId) || null; }
export function deleteLive(jobId) { _store.delete(jobId); }
