/* Logic Penyimpanan di dalam Browser untuk bisa membuka dua tab yang berbeda */
const Store = (() => {
  const KEY = 'sipbmd-db-v1', DBN = 'sipbmd', OBJ = 'files';
  let state = null, makeSeed = null, last = null, q = Promise.resolve(), rq = Promise.resolve(), dbp = null;
  const cache = new Map();     // id -> Blob (agar instance Blob sama dipakai ulang)
  const pending = new Map();   // id -> Blob yang belum masuk IndexedDB
  const uid = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* Logic IndexedDB (khusus Dokumen) */
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined' || !indexedDB) return rej(new Error('IndexedDB tidak tersedia'));
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(OBJ);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction(OBJ, mode), r = fn(t.objectStore(OBJ));
    t.oncomplete = () => res(r && r.result);
    t.onerror = t.onabort = () => rej(t.error);
  }));
  const put = (id, b) => tx('readwrite', s => s.put(b, id));
  const get = id => tx('readonly', s => s.get(id));

  const seedKey = sd => 's:' + sd.join('|');
  function meta(b) {
    if (!b) return null;
    if (b._seed) { const k = seedKey(b._seed); if (!cache.has(k)) cache.set(k, b); return { sd: b._seed, sz: b.size }; }
    if (!b._fid) { b._fid = uid(); cache.set(b._fid, b); pending.set(b._fid, b); }
    return { id: b._fid, sz: b.size, ty: b.type };
  }
  const rep = (k, v) => (k === 'files' && Array.isArray(v)) ? v.map(meta) : v;
  /* OB = Daftar Objek Penaksiran, KK = Kertas Kerja, HP = Harga Pembanding (opsional: hanya disimpan bila diberikan ke init) */
  const ser = () => JSON.stringify({ R: state.R, RX: state.RX, SVS: state.SVS, PEN: state.PEN, OB: state.OB, KK: state.KK, HP: state.HP }, rep);
  const same = (a, b) => JSON.stringify(a, rep) === JSON.stringify(b, rep);

  /* Logic Untuk Simpan  */
  function persist() {
    return q = q.then(async () => {
      if (!state) return;
      const s = ser();
      if (s === last) return;       
      if (pending.size) {           // Dokumen dulu, baru JSON (supaya tab lain tidak kehilangan berkas)
        const items = [...pending];
        try { await Promise.all(items.map(([id, b]) => put(id, b))); items.forEach(([id]) => pending.delete(id)); }
        catch (e) { pending.clear(); console.warn('[Store] IndexedDB tidak tersedia: berkas tidak ikut tersinkron antar tab.', e); }
      }
      try { localStorage.setItem(KEY, s); last = s; }
      catch (e) { console.warn('[Store] Gagal menyimpan ke localStorage.', e); }
    }).catch(e => console.error('[Store]', e));
  }

  /* Logic memuat data untuk ambil data/dokumen dari IndexedDB */
  async function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    /* Logic untuk menyesuaikan nama yang tadinya "penghapusan" jadi "Izin Bongkar" */
    (o.R || []).forEach(d => { if (d[4] === 'Penghapusan') d[4] = 'Izin Bongkar'; });
    Object.values(o.RX || {}).forEach(x => { if (x && x.f && x.f.jn === 'Penghapusan') x.f.jn = 'Izin Bongkar'; });
    for (const x of Object.values(o.RX || {})) {
      const f = x && x.f;
      if (!f || !Array.isArray(f.files)) continue;
      f.files = await Promise.all(f.files.map(async m => {
        if (!m) return null;
        if (m.sd) { const k = seedKey(m.sd); if (!cache.has(k)) cache.set(k, makeSeed(m.sd)); return cache.get(k); }
        if (cache.has(m.id)) return cache.get(m.id);
        try { const b = await get(m.id); if (b) { b._fid = m.id; cache.set(m.id, b); } return b || null; }
        catch (e) { return null; }
      }));
    }
    for (const x of Object.values(o.RX || {})) {
      const dd = x && x.tks && x.tks.doc;
      if (!dd || !Array.isArray(dd.files)) continue;
      dd.files = await Promise.all(dd.files.map(async m => {
        if (!m) return null;
        if (cache.has(m.id)) return cache.get(m.id);
        try { const b = await get(m.id); if (b) { b._fid = m.id; cache.set(m.id, b); } return b || null; }
        catch (e) { return null; }
      }));
    }
    return o;
  }

  function apply(o) {
    const { R, RX, SVS, PEN, OB, KK, HP } = state;
    const byNo = new Map(R.map(d => [d[0], d]));
    const rows = (o.R || []).map(d => { const old = byNo.get(d[0]); return old && same(old, d) ? old : d; });
    R.length = 0; R.push(...rows);
    for (const [t, s] of [[RX, o.RX || {}], [SVS, o.SVS || {}], [PEN, o.PEN || {}]]) {
      const old = { ...t };
      Object.keys(t).forEach(k => delete t[k]);
      for (const k of Object.keys(s)) t[k] = (old[k] !== undefined && same(old[k], s[k])) ? old[k] : s[k];
    }
    /* Daftar Objek, Kertas Kerja, Harga Pembanding: hanya ditimpa bila ada di data tersimpan (data lama tanpa ketiganya tetap memakai data awal) */
    if (OB && Array.isArray(o.OB)) { OB.length = 0; OB.push(...o.OB); }
    if (HP && Array.isArray(o.HP)) { HP.length = 0; HP.push(...o.HP); }
    if (KK && o.KK && typeof o.KK == 'object') { Object.keys(KK).forEach(k => delete KK[k]); Object.assign(KK, o.KK); }
    last = ser();    // tidak redudansi data
  }

  return {
 /* Sinkronin data yang sedang ditampilkan */
    async init(st, seedMaker) {
      state = st; makeSeed = seedMaker;
      let o = null;
      try { o = await load(); } catch (e) { console.warn('[Store] Data tersimpan rusak, memakai data awal.', e); }
      if (o) apply(o); else { last = null; await persist(); }
      return !!o;
    },
    persist,
    apply,
    

    watch() {
      let t = null;
      const kick = () => { clearTimeout(t); t = setTimeout(persist, 120); };
      ['click', 'change', 'input', 'keyup'].forEach(ev => document.addEventListener(ev, kick, true));
      setInterval(persist, 1500);
      addEventListener('pagehide', persist);
    },
    /* cb(dataBaru) dipanggil di tab ini saat tab LAIN menyimpan; cbReset() saat data direset. */
    onRemote(cb, cbReset) {
      addEventListener('storage', e => {
        if (e.key === null || (e.key === KEY && e.newValue === null)) { state = null; cbReset && cbReset(); return; }   // matikan simpan otomatis: data sedang direset
        if (e.key !== KEY) return;
        rq = rq.then(async () => { const o = await load(); if (o) cb(o); }).catch(err => console.error('[Store]', err));
      });
    },
    /* Hapus semua data tersimpan (data kembali ke awal saat halaman dimuat ulang). */
    async clear() {
      state = null;                      // matikan simpan otomatis, supaya data lama tidak tertulis lagi sebelum reload
      localStorage.removeItem(KEY); cache.clear(); pending.clear(); last = null;
      try { await tx('readwrite', s => s.clear()); } catch (e) {}
    }
  };
})();
