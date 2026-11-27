/* Modul 3 - Penghapusan
   Menu:
     Usulan (#phu)             Pengguna Barang : pilih permohonan, unggah surat permohonan penghapusan, ajukan, pantau status
     Usulan Admin (#phua)      Admin           : periksa usulan -> Sesuai (diteruskan ke Penetapan) / Tidak Sesuai (dikembalikan + catatan)
     Penetapan (#phs)          Admin           : finalisasi. Pemindahtanganan = Dihapus. Izin Bongkar = Dihapus / Tidak Dihapus. SK diinput manual
     Penghapusan Sebab Lain (#phsl) Admin      : input manual (daftar barang/KIB) tanpa permohonan & penjualan; hasilnya menjadi Usulan berjenis
                                                 "Sebab Lain" yang diperiksa di Usulan Admin lalu ditetapkan di Penetapan
   Usulan PB muncul otomatis (baris "Belum Diusulkan") begitu penjualan (lelang/langsung) permohonannya selesai - Izin Bongkar maupun Pemindahtanganan.
   Data disimpan lewat Store (kunci PH): PH_DATA.phu = usulan (termasuk Sebab Lain), PH_DATA.phs = penetapan.
   ID: Usulan UH-001-2026 dan Penetapan PH-001-2026 diturunkan dari No. Permohonan PM-001-2026; Sebab Lain: usulan SL-001-2026, penetapan PH-SL-001-2026. */
const PH_DATA = { phu: [], phs: [] };
const PH_KODE = {};   /* kode SKPD, isi bila sudah ada. Contoh: { 'Dinas Kesehatan': '1.02.0.00.0.00.01.0000' } */
const PH_MAX = 5 * 1024 * 1024;
const PH_JENIS = ['Izin Bongkar', 'Pemindahtanganan', 'Sebab Lain'];
const PH_SEBAB = ['Hibah', 'Tukar Menukar', 'Penyertaan Modal', 'Hilang', 'Kebakaran / Bencana', 'Putusan Pengadilan', 'Lainnya']; /* sementara, ganti dengan data master bila sudah ada */

const PH = { tahun: new Date().getFullYear(), unit: '', jenis: '', v: {} };
['phu', 'phua', 'phs', 'phsl'].forEach(k => PH.v[k] = { q: '', n: 10, p: 1, s: null, d: 1, sel: null });
let phK = 'phu', phTmp = {}, phItems = [];

const PH_CFG = {
  phu: { judul: 'Usulan Penghapusan', src: 'phu', desc: 'Ajukan usulan penghapusan dari permohonan yang sudah disetujui, lalu pantau statusnya di sini.',
    tools: [{ id: 'lihat', tip: 'Lihat', b: 1 }, { id: 'tambah', tip: 'Tambah Usulan', p: 1 }, { id: 'ubah', tip: 'Ubah', b: 1 }, { id: 'hapus', tip: 'Hapus', b: 1 }, { id: 'ajukan', tip: 'Ajukan', b: 1 }],
    cols: [['id', 'No. ID'], ['no', 'No. Permohonan'], ['unit', 'SKPD', 0, 1], ['tgl', 'Tanggal', 'tgl'], ['jenis', 'Jenis Permohonan'], ['qty', 'Qty', 'r'], ['noSk', 'No. SK'], ['tglSk', 'Tgl. SK', 'tgl'], ['status', 'Status', 'st'], ['up', 'File', 'file']] },
  phua: { judul: 'Usulan Admin', src: 'phu', desc: 'Periksa usulan penghapusan dari Pengguna Barang. Sesuai: diteruskan ke Penetapan. Tidak Sesuai: dikembalikan dengan catatan.',
    tools: [{ id: 'lihat', tip: 'Lihat', b: 1 }, { id: 'sesuai', tip: 'Sesuai', b: 1, p: 1 }, { id: 'tidak', tip: 'Tidak Sesuai', b: 1 }],
    cols: [['id', 'No. ID'], ['no', 'No. Permohonan'], ['unit', 'SKPD'], ['tgl', 'Tanggal', 'tgl'], ['jenis', 'Jenis Permohonan'], ['qty', 'Qty', 'r'], ['noSk', 'No. SK'], ['tglSk', 'Tgl. SK', 'tgl'], ['status', 'Status', 'st'], ['up', 'File', 'file']] },
  phs: { judul: 'Penetapan', src: 'phs', desc: 'Tetapkan hasil akhir penghapusan dan catat SK Penghapusan.',
    tools: [{ id: 'lihat', tip: 'Lihat', b: 1 }, { id: 'tetapkan', tip: 'Tetapkan', b: 1, p: 1 }, { id: 'batal', tip: 'Batalkan Penetapan', b: 1 }],
    cols: [['id', 'No. ID'], ['usulanId', 'No. Usulan'], ['unit', 'SKPD'], ['tgl', 'Tanggal', 'tgl'], ['jenis', 'Jenis Permohonan'], ['qty', 'Qty', 'r'], ['noSk', 'No. SK'], ['tglSk', 'Tgl. SK', 'tgl'], ['status', 'Status', 'st'], ['sk', 'File SK', 'file']] },
  phsl: { judul: 'Penghapusan Sebab Lain', src: 'phu', desc: 'Input manual penghapusan karena sebab lain (misalnya hibah), tanpa permohonan. Setelah diajukan, diperiksa di Usulan Admin lalu ditetapkan di Penetapan.',
    tools: [{ id: 'lihat', tip: 'Lihat', b: 1 }, { id: 'tambah', tip: 'Tambah', p: 1 }, { id: 'ubah', tip: 'Ubah', b: 1 }, { id: 'hapus', tip: 'Hapus', b: 1 }, { id: 'ajukan', tip: 'Ajukan', b: 1 }],
    cols: [['id', 'No. ID'], ['unit', 'SKPD'], ['tgl', 'Tanggal', 'tgl'], ['sebab', 'Sebab'], ['qty', 'Qty', 'r'], ['status', 'Status', 'st'], ['up', 'File', 'file']] }
};
const phCols = k => PH_CFG[k].cols.filter(c => !(c[3] && phPer())).map(c => ({ k: c[0], t: c[1], f: c[2] == 'r' ? '' : c[2], a: c[2] == 'r' ? 'r' : '' }));

/* ---------- bantu ---------- */
const phPer = () => !!CUR && CUR.role === 'pengguna_barang';
const phYear = t => +String(t || today()).slice(0, 4);
const phJenis = no => (RX[no] && RX[no].f && RX[no].f.jn) || (R.find(d => d[0] == no) || [])[4] || '';
const phQty = no => permKib(no).reduce((a, k) => a + (+k[5] || 0), 0);
const phPjOk = no => { const ps = OB.filter(p => p.no == no); return ps.length > 0 && ps.every(p => ['lel', 'lgs'].every(k => !pjIdx(p, k).length || !!(PJ[no] && PJ[no][k] && PJ[no][k].fin))); };
const phSk = no => { const f = typeof SKN != 'undefined' && SKN[no] && SKN[no].f; return f && f.nosk ? { noSk: f.nosk, tglSk: f.tglsk || '' } : { noSk: '', tglSk: '' }; };
const phCand = () => R.filter(d => d[1] === CUR.opd && !PH_DATA.phu.some(u => u.no === d[0]) && phPjOk(d[0]));   /* siap diusulkan = penjualan selesai (semua jenis) */
const phVirt = () => phCand().map(d => { const sk = phSk(d[0]); return { id: phNo('UH', d[0]), no: d[0], unit: d[1], tahun: phYear(), jenis: phJenis(d[0]), tgl: '', qty: phQty(d[0]), noSk: sk.noSk, tglSk: sk.tglSk, status: 'Belum Diusulkan', virtual: true, h: [] }; });
const phFind = (k, id) => PH_DATA[PH_CFG[k].src].find(y => String(y.id) === String(id)) || (k == 'phu' && phPer() ? phVirt().find(y => y.id === id) : undefined);
const phNo = (pre, no) => pre + '-' + String(no).replace(/^[A-Za-z]+-/, '');
const phH = (x, a, n) => { (x.h = x.h || []).push({ t: nowStr(), a, n: n || '' }); };
const phHs = (no, a, n) => { if (no) try { hs(no, a, n); } catch (e) { } };
const phMeta = f => ({ n: f.name, ty: f.type, sz: f.size, ts: nowStr(), files: [f] });
const phUs = p => PH_DATA.phu.find(u => u.id === p.usulanId);
function phSt(k, x) {
  if (k == 'phs') return x.status == 'Dihapus' ? ['s-g', 'Dihapus'] : x.status == 'Tidak Dihapus' ? ['s-n', 'Tidak Dihapus'] : ['s-o', 'Proses'];
  if (x.status == 'Sesuai') { const p = PH_DATA.phs.find(y => y.usulanId === x.id); return !p || p.status == 'Proses' ? ['s-b', 'Sesuai - Proses Penetapan'] : phSt('phs', p); }
  return ({ 'Belum Diusulkan': ['s-o', 'Belum Diusulkan'], 'Draft': ['s-n', 'Draft'], 'Diajukan': ['s-o', 'Diajukan'], 'Tidak Sesuai': ['s-r', 'Tidak Sesuai'] })[x.status] || ['s-n', x.status];
}
function phBadge() {
  if (!CUR) return;
  const set = (id, n) => { const e = document.getElementById(id); if (e) { e.textContent = n; e.style.display = n ? '' : 'none'; } };
  if (isAdmin()) { set('phcA', PH_DATA.phu.filter(x => x.status == 'Diajukan').length); set('phcS', PH_DATA.phs.filter(x => x.status == 'Proses').length); }
  else set('phcU', phCand().length + PH_DATA.phu.filter(x => x.unit === CUR.opd && x.jenis != 'Sebab Lain' && x.dilihat === false).length);
}
function phOpenFile(src, id, key) {
  const x = PH_DATA[src].find(y => String(y.id) === String(id)), f = x && x[key], b = f && f.files && f.files[0];
  if (!b) return toast('Berkas tidak tersedia. Silakan unggah ulang.', 'err');
  window.open(URL.createObjectURL(b.type ? b : new Blob([b], { type: f.ty })), '_blank');
}
function phPick(key) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/pdf,image/png,image/jpeg';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    if (!/^(application\/pdf|image\/(png|jpeg))$/.test(f.type)) return toast('Format harus PDF, JPG, atau PNG.', 'err');
    if (f.size > PH_MAX) return toast('Ukuran berkas maksimal 5 MB.', 'err');
    phTmp[key] = f; const e = $('#ph_fn_' + key); if (e) e.textContent = f.name;
  };
  inp.click();
}
const phFileRow = (key, label, cur, req) => `<div class="l2 full">${label}${req ? ' *' : ''}<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn o sm" data-pick="${key}">Pilih Berkas</button><span id="ph_fn_${key}" class="mt">${esc(phTmp[key] ? phTmp[key].name : (cur && cur.n) || 'Belum ada berkas (PDF/JPG/PNG, maks. 5 MB)')}</span></div></div>`;
function phModal(title, body, foot) {
  const m = mdlOpen('phm', `<div class="mbx" role="dialog" aria-modal="true" style="max-width:780px;max-height:90vh;overflow:auto"><h3>${title}</h3>${body}<div class="mft" style="margin-top:16px">${foot}</div></div>`);
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x="close"]')) m.remove(); const p = e.target.closest('[data-pick]'); if (p) phPick(p.dataset.pick); const f = e.target.closest('[data-fo]'); if (f) phOpenFile(f.dataset.src, f.dataset.id, f.dataset.fo); });
  return m;
}
const phClose = () => { const m = $('#phm'); if (m) m.remove(); };
const phRe = () => { phBadge(); phPage(phK); };

/* ---------- data tampil ---------- */
function phRows(k) {
  const v = PH.v[k], C = PH_CFG[k], unit = phPer() ? CUR.opd : PH.unit;
  let r = PH_DATA[C.src].filter(x => (!unit || x.unit === unit) && String(x.tahun) === String(PH.tahun));
  if (k == 'phua') r = r.filter(x => x.status != 'Draft');
  if (k == 'phu' && phPer()) r = r.filter(x => x.jenis != 'Sebab Lain');
  if (k == 'phsl') r = r.filter(x => x.jenis == 'Sebab Lain');
  if ((k == 'phu' || k == 'phua') && PH.jenis) r = r.filter(x => x.jenis === PH.jenis);
  if (k == 'phu' && phPer()) r = phVirt().filter(x => !PH.jenis || x.jenis === PH.jenis).concat(r);   /* tugas PB: selalu tampil, tidak tersaring tahun */
  const q = v.q.toLowerCase().trim(), cols = phCols(k);
  if (q) r = r.filter(x => cols.some(c => String(c.f == 'file' ? (x[c.k] && x[c.k].n) || '' : x[c.k] == null ? '' : x[c.k]).toLowerCase().includes(q)));
  if (v.s) {
    const key = v.s, num = key == 'qty';
    r = r.slice().sort((a, b) => { const A = a[key] == null ? '' : a[key], B = b[key] == null ? '' : b[key]; return (num ? (+A || 0) - (+B || 0) : String(A).localeCompare(String(B), 'id', { numeric: true })) * v.d; });
  }
  return r;
}
function phCell(k, c, x) {
  if (c.f == 'st') { const s = phSt(k, x); return PL(s[0], esc(s[1])); }
  const val = x[c.k];
  if (c.f == 'tgl') return val ? esc(fd(val)) : '-';
  if (c.f == 'file') return val && val.n ? `<button type="button" class="lk" data-fo="${c.k}" data-src="${PH_CFG[k].src}" data-id="${esc(x.id)}">${esc(val.n)}</button>` : '-';
  return val == null || val === '' ? '-' : esc(val);
}
function phBody(k) {
  const v = PH.v[k], cols = phCols(k), all = phRows(k), tot = all.length, pages = Math.max(1, Math.ceil(tot / v.n));
  v.p = Math.min(Math.max(1, v.p), pages);
  if (v.sel != null && !all.some(x => String(x.id) === v.sel)) v.sel = null;
  const from = (v.p - 1) * v.n, rows = all.slice(from, from + v.n);
  const th = cols.map(c => { const on = v.s === c.k; return `<th data-sort="${c.k}" tabindex="0" aria-sort="${on ? (v.d == 1 ? 'ascending' : 'descending') : 'none'}"${c.a ? ' style="text-align:right"' : ''}>${c.t}${on ? (v.d == 1 ? ' &uarr;' : ' &darr;') : ''}</th>`; }).join('');
  const tb = rows.length ? rows.map(x => `<tr class="ph-r${v.sel === String(x.id) ? ' sel' : ''}" data-id="${esc(x.id)}">${cols.map(c => `<td${c.a ? ' class="r"' : ''}>${phCell(k, c, x)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" class="ph-empty">${v.q.trim() ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data untuk ditampilkan.'}</td></tr>`;
  const btn = (a, t, dis) => `<button type="button" class="btn o sm" data-pg="${a}"${dis ? ' disabled' : ''}>${t}</button>`;
  return `<div class="tw"><table class="pt-t"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div><div class="pgn"><span>${tot ? `Menampilkan ${from + 1} sampai ${from + rows.length} dari ${tot} data` : `Halaman ${v.p} dari ${pages}`}</span><div>${btn('prev', 'Sebelumnya', v.p <= 1)}${btn('next', 'Berikutnya', v.p >= pages)}</div></div>`;
}
function phFrame(k) {
  const v = PH.v[k], C = PH_CFG[k], pb = phPer(), unit = pb ? CUR.opd : PH.unit;
  const selU = pb ? `<input value="${esc(CUR.opd)}" readonly aria-label="SKPD">` : `<select id="ph_unit" aria-label="Pilih SKPD"><option value="">Semua SKPD</option>${NM.map(n => `<option${n === PH.unit ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  const selJ = (k == 'phu' || k == 'phua') ? `<label class="l2">Jenis Permohonan<select id="ph_jn" aria-label="Jenis Permohonan"><option value="">Semua Jenis</option>${PH_JENIS.filter(j => !pb || j != 'Sebab Lain').map(j => `<option${j === PH.jenis ? ' selected' : ''}>${j}</option>`).join('')}</select></label>` : '';
  const tools = C.tools.map(t => `<button type="button" class="btn${t.p ? '' : ' o'} sm" data-tb="${t.id}">${t.tip}</button>`).join('');
  return `<div class="cd ph-filter"><div class="ch"><div><h2>Filter Data</h2><small class="mt">Kode SKPD: ${esc(unit ? (PH_KODE[unit] || '-') : 'Semua SKPD')}</small></div></div><div class="ff"><label class="l2">SKPD${selU}</label><label class="l2">Tahun<input id="ph_th" type="number" inputmode="numeric" min="2000" max="2100" value="${esc(PH.tahun)}" aria-label="Tahun"></label>${selJ}</div></div>` +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar ${C.judul}</h2><small class="mt">Pilih satu baris untuk menjalankan aksi.</small></div><div class="ph-list-tools"><label class="sr2 ph-search"><svg class="i"><use href="#sq"></use></svg><input id="ph_q" type="search" placeholder="Cari data…" value="${esc(v.q)}" autocomplete="off"></label><select id="ph_n" class="ph-size" aria-label="Jumlah baris">${[10, 25, 50, 100].map(n => `<option${n == v.n ? ' selected' : ''}>${n} baris</option>`).join('')}</select></div></div><div class="pt-bar">${tools}</div><div id="ph_body">${phBody(k)}</div></div>`;
}

/* ---------- halaman ---------- */
function phPage(k) {
  phK = k; phBadge();
  const s = $('#' + k), v = PH.v[k], C = PH_CFG[k], body = () => { const b = $('#ph_body'); if (b) b.innerHTML = phBody(k); };
  s.innerHTML = HD(C.judul, C.desc) + phFrame(k);
  s.oninput = e => { if (e.target.id == 'ph_q') { v.q = e.target.value; v.p = 1; body(); } };
  s.onchange = e => {
    const id = e.target.id;
    if (id == 'ph_n') { v.n = +e.target.value || 10; v.p = 1; body(); }
    else if (id == 'ph_unit') { PH.unit = e.target.value; Object.values(PH.v).forEach(o => { o.p = 1; o.sel = null; }); phPage(k); }
    else if (id == 'ph_jn') { PH.jenis = e.target.value; Object.values(PH.v).forEach(o => { o.p = 1; o.sel = null; }); phPage(k); }
    else if (id == 'ph_th') phTahun(k);
  };
  s.onkeydown = e => {
    if (e.key == 'Enter' && e.target.id == 'ph_th') { e.preventDefault(); return phTahun(k); }
    const th = e.target.closest && e.target.closest('th[data-sort]'); if (th && (e.key == 'Enter' || e.key == ' ')) { e.preventDefault(); th.click(); }
  };
  s.onclick = e => {
    const tb = e.target.closest('[data-tb]'), pg = e.target.closest('[data-pg]'), th = e.target.closest('th[data-sort]'), tr = e.target.closest('tr.ph-r'), fo = e.target.closest('[data-fo]');
    if (fo) return phOpenFile(fo.dataset.src, fo.dataset.id, fo.dataset.fo);
    if (tb) {
      const t = C.tools.find(x => x.id == tb.dataset.tb), x = phFind(k, v.sel);
      if (t.b && !x) return toast('Pilih satu baris data terlebih dahulu.', 'err');
      return phAct(k, t.id, x);
    }
    if (pg) { if (pg.disabled) return; const pages = Math.max(1, Math.ceil(phRows(k).length / v.n)), m = pg.dataset.pg; v.p = m == 'prev' ? v.p - 1 : v.p + 1; v.p = Math.min(Math.max(1, v.p), pages); return body(); }
    if (th) { const key = th.dataset.sort; if (v.s === key) v.d = -v.d; else { v.s = key; v.d = 1; } return body(); }
    if (tr) { v.sel = v.sel === tr.dataset.id ? null : tr.dataset.id; body(); }
  };
}
function phTahun(k) {
  const y = String(($('#ph_th') || {}).value || '').trim();
  if (!/^\d{4}$/.test(y)) return toast('Tahun harus 4 digit, contoh: ' + new Date().getFullYear() + '.', 'err');
  PH.tahun = +y; Object.values(PH.v).forEach(o => { o.p = 1; o.sel = null; }); phPage(k); toast('Tahun diubah ke ' + y + '.', 'ok');
}
function phRefresh(v) { if ($('#phm')) return; phPage(v); }
const pgPhu = () => phPage('phu'), pgPhua = () => phPage('phua'), pgPhs = () => phPage('phs'), pgPhsl = () => phPage('phsl');

/* ---------- aksi ---------- */
function phAct(k, id, x) {
  if (id == 'lihat') return phLihat(k, x);
  if (k == 'phu' || k == 'phsl') {
    const form = k == 'phsl' ? phFormSl : phFormU;
    if (id == 'tambah') return form(null);
    if (x.virtual) return id == 'hapus' ? toast('Usulan ini belum dibuat.', 'err') : phFormU(null, x.no);
    const buka = x.status == 'Draft' || x.status == 'Tidak Sesuai';
    if (id == 'ubah') return buka ? form(x) : toast('Usulan yang sudah diajukan tidak dapat diubah.', 'err');
    if (id == 'hapus') return x.status != 'Draft' ? toast('Hanya usulan berstatus Draft yang dapat dihapus.', 'err') : cfm('Hapus usulan?', 'Usulan ' + x.id + ' akan dihapus.', () => { PH_DATA.phu.splice(PH_DATA.phu.indexOf(x), 1); PH.v[k].sel = null; Store.persist(); toast('Usulan dihapus.', 'ok'); phRe(); }, 'Hapus');
    if (id == 'ajukan') {
      if (!buka) return toast('Usulan ini sudah diajukan.', 'err');
      if (k == 'phu' && !x.up) return toast('Unggah surat permohonan penghapusan terlebih dahulu (menu Ubah).', 'err');
      return cfm('Ajukan usulan?', 'Usulan ' + x.id + ' dikirim ke ' + (k == 'phsl' ? 'Usulan Admin untuk diperiksa' : 'Admin') + ' dan tidak dapat diubah selama diperiksa.', () => phAjukan(x), 'Ajukan');
    }
  }
  if (k == 'phua') {
    if (x.status != 'Diajukan') return toast('Usulan ini tidak sedang menunggu pemeriksaan.', 'err');
    if (id == 'tidak') return phTidakSesuai(x);
    if (id == 'sesuai') return cfm('Usulan sesuai?', 'Usulan ' + x.id + ' dinyatakan sesuai dan diteruskan ke Penetapan.', () => {
      x.status = 'Sesuai'; x.cat = ''; phH(x, 'Usulan sesuai, diteruskan ke Penetapan', 'Admin');
      if (!PH_DATA.phs.some(p => p.usulanId === x.id)) {
        const p = { id: x.jenis == 'Sebab Lain' ? 'PH-' + x.id : phNo('PH', x.no), usulanId: x.id, no: x.no, unit: x.unit, tahun: x.tahun, jenis: x.jenis, tgl: today(), qty: x.qty, noSk: '', tglSk: '', status: 'Proses', h: [] };
        if (x.jenis == 'Sebab Lain') Object.assign(p, { sebab: x.sebab, tglKejadian: x.tglKejadian, ket: x.ket, items: x.items.map(i => ({ ...i })) });
        phH(p, 'Diterima dari Usulan ' + x.id, 'Admin'); PH_DATA.phs.unshift(p);
      }
      phHs(x.no, 'Usulan penghapusan sesuai, masuk Penetapan', 'Admin'); Store.persist(); toast('Usulan diteruskan ke Penetapan.', 'ok'); phRe();
    }, 'Sesuai');
  }
  if (k == 'phs') {
    if (id == 'tetapkan') return x.status == 'Proses' ? phTetap(x) : toast('Penetapan ini sudah final. Batalkan penetapan bila perlu mengubah.', 'err');
    if (id == 'batal') return x.status == 'Proses' ? toast('Penetapan ini belum ditetapkan.', 'err') : cfm('Batalkan penetapan?', 'Hasil dan data SK ' + x.id + ' dikosongkan, status kembali ke Proses.', () => {
      phH(x, 'Penetapan dibatalkan (sebelumnya: ' + x.status + ')', 'Admin'); Object.assign(x, { status: 'Proses', noSk: '', tglSk: '', cat: '' }); delete x.sk;
      phHs(x.no, 'Penetapan penghapusan dibatalkan', 'Admin'); Store.persist(); toast('Penetapan dibatalkan.', 'ok'); phRe();
    }, 'Batalkan');
  }
}
function phAjukan(x) {
  x.status = 'Diajukan'; x.cat = ''; x.dilihat = true; const sk = phSk(x.no); x.noSk = sk.noSk; x.tglSk = sk.tglSk;
  phH(x, 'Usulan diajukan ke Admin', CUR.name); phHs(x.no, 'Usulan penghapusan diajukan', 'Pengguna Barang'); Store.persist(); toast('Usulan diajukan ke Admin.', 'ok'); phRe();
}
function phTidakSesuai(x) {
  const m = phModal('Usulan Tidak Sesuai', `<div class="ff">${FL('pc_c', 'Catatan untuk Pengguna Barang (wajib)', '', 'area', 1)}</div>`, `<button class="btn o" data-x="close">Batal</button><button class="btn dng" data-ok="1">Kembalikan</button>`);
  m.addEventListener('click', e => {
    if (!e.target.closest('[data-ok]')) return;
    const c = (val('pc_c') || '').trim(); if (!c) return toast('Catatan wajib diisi.', 'err');
    x.status = 'Tidak Sesuai'; x.cat = c; x.dilihat = false; phH(x, 'Usulan tidak sesuai, dikembalikan', c); phHs(x.no, 'Usulan penghapusan dikembalikan', c);
    Store.persist(); phClose(); toast('Usulan dikembalikan ke Pengguna Barang.', 'ok'); phRe();
  });
}

/* ---------- form Usulan (Pengguna Barang) ---------- */
function phFormU(x, no0) {
  phTmp = {}; const ed = !!x, cand = ed ? [] : phCand();
  if (!ed && !cand.length) return toast('Belum ada permohonan yang dapat diusulkan. Permohonan harus berstatus Disetujui (Pemindahtanganan: penjualan sudah selesai).', 'err');
  const info = no => { const sk = phSk(no); return `<b>Jenis:</b> ${esc(phJenis(no))} &middot; <b>Qty barang:</b> ${phQty(no)} &middot; <b>SK rujukan:</b> ${esc(sk.noSk || '-')}`; };
  const pick = ed ? `<label class="l2 full">Permohonan<input value="${esc(x.no)}" readonly></label>` : FL('pu_no', 'Permohonan', no0 || cand[0][0], 'text', 1, cand.map(d => d[0]));
  const m = phModal(ed ? 'Ubah Usulan ' + x.id : 'Tambah Usulan', `<div class="ff">${pick}<div class="full mt" id="pu_info">${info(ed ? x.no : no0 || cand[0][0])}</div>${FL('pu_tgl', 'Tanggal Usulan', ed ? x.tgl : today(), 'date')}${ed && x.cat ? `<div class="al2 full"><b>Catatan Admin:</b> ${esc(x.cat)}</div>` : ''}${phFileRow('up', 'Surat Permohonan Penghapusan', x && x.up, 1)}<div class="full"><button type="button" class="btn o sm" data-tpl="1">Unduh Template Surat</button> <small class="mt">Template mengikuti surat permohonan awal.</small></div></div>`,
    `<button class="btn o" data-x="close">Batal</button><button class="btn o" data-sv="d">Simpan Draft</button><button class="btn" data-sv="a">Simpan &amp; Ajukan</button>`);
  m.addEventListener('change', e => { if (e.target.id == 'pu_no') $('#pu_info').innerHTML = info(e.target.value); });
  m.addEventListener('click', e => {
    if (e.target.closest('[data-tpl]')) return phTemplate(ed ? x.no : val('pu_no'));
    const b = e.target.closest('[data-sv]'); if (b) phSaveU(x, b.dataset.sv == 'a');
  });
}
async function phTemplate(no) {
  const f = RX[no] && RX[no].f; if (!f || typeof suratPermohonanDocx != 'function') return toast('Template surat tidak tersedia.', 'err');
  try { const b = await suratPermohonanDocx(f), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'Template Surat Permohonan - ' + no + '.docx'; a.click(); }
  catch (er) { toast('Gagal membuat template: ' + er.message, 'err'); }
}
function phSaveU(x, ajukan) {
  const no = x ? x.no : val('pu_no'), d = R.find(r => r[0] == no), tgl = val('pu_tgl'), up = phTmp.up ? phMeta(phTmp.up) : x && x.up;
  if (!d) return toast('Pilih permohonan.', 'err');
  if (!tgl) return toast('Isi tanggal usulan.', 'err');
  if (ajukan && !up) return toast('Unggah surat permohonan penghapusan terlebih dahulu.', 'err');
  if (!x) {
    if (PH_DATA.phu.some(u => u.no === no)) return toast('Permohonan ini sudah memiliki usulan.', 'err');
    x = { id: phNo('UH', no), no, unit: d[1], jenis: phJenis(no), status: 'Draft', h: [] }; PH_DATA.phu.unshift(x); phH(x, 'Usulan dibuat', CUR.name);
  }
  const sk = phSk(no); Object.assign(x, { tgl, tahun: phYear(tgl), qty: phQty(no), noSk: sk.noSk, tglSk: sk.tglSk }); if (up) x.up = up;
  PH.tahun = x.tahun; PH.v.phu.sel = x.id; phClose();
  if (ajukan) return phAjukan(x);
  Store.persist(); toast('Draft usulan tersimpan.', 'ok'); phRe();
}

/* ---------- Penetapan (Admin) ---------- */
function phTetap(p) {
  phTmp = {}; const ib = p.jenis == 'Izin Bongkar';
  const m = phModal('Tetapkan ' + p.id, `<div class="ff">${ib ? FL('pt_h', 'Hasil Penetapan', p.status == 'Proses' ? 'Dihapus' : p.status, 'text', 1, ['Dihapus', 'Tidak Dihapus']) : `<div class="full mt"><b>Hasil Penetapan:</b> Dihapus (jenis ini selalu dihapus)</div>`}</div>` +
    `<div class="ff" id="pt_sk">${FL('pt_no', 'No. SK Penghapusan', p.noSk)}${FL('pt_tg', 'Tgl. SK', p.tglSk || today(), 'date')}${phFileRow('sk', 'File SK Penghapusan', p.sk, 1)}</div>` +
    `<div class="ff" id="pt_cat" style="display:none">${FL('pt_c', 'Catatan Admin (wajib untuk Tidak Dihapus)', p.cat || '', 'area', 1)}</div>`,
    `<button class="btn o" data-x="close">Batal</button><button class="btn" data-ok="1">Simpan Penetapan</button>`);
  const tog = () => { const h = ib ? val('pt_h') : 'Dihapus'; $('#pt_sk').style.display = h == 'Dihapus' ? '' : 'none'; $('#pt_cat').style.display = h == 'Dihapus' ? 'none' : ''; };
  m.addEventListener('change', e => { if (e.target.id == 'pt_h') tog(); }); tog();
  m.addEventListener('click', e => {
    if (!e.target.closest('[data-ok]')) return;
    const h = ib ? val('pt_h') : 'Dihapus', u = phUs(p);
    if (h == 'Dihapus') {
      const no = (val('pt_no') || '').trim(), tg = val('pt_tg'), f = phTmp.sk ? phMeta(phTmp.sk) : p.sk;
      if (!no || !tg) return toast('No. SK dan Tgl. SK wajib diisi.', 'err');
      if (!f) return toast('Unggah file SK Penghapusan.', 'err');
      Object.assign(p, { noSk: no, tglSk: tg, sk: f, cat: '' });
    } else {
      const c = (val('pt_c') || '').trim(); if (!c) return toast('Catatan wajib diisi untuk Tidak Dihapus.', 'err');
      Object.assign(p, { noSk: '', tglSk: '', cat: c }); delete p.sk;
    }
    p.status = h; p.tgl = today(); phH(p, 'Ditetapkan: ' + h, h == 'Dihapus' ? 'SK ' + p.noSk : p.cat);
    if (u) { u.dilihat = false; phH(u, 'Penetapan: ' + h, h == 'Dihapus' ? 'SK ' + p.noSk : p.cat); }
    phHs(p.no, 'Penghapusan ditetapkan: ' + h, h == 'Dihapus' ? 'SK ' + p.noSk : p.cat);
    Store.persist(); phClose(); toast('Penetapan disimpan: ' + h + '.', 'ok'); phRe();
  });
}

/* ---------- Penghapusan Sebab Lain (Admin, input manual -> Usulan berjenis "Sebab Lain") ---------- */
const phBlank = () => ({ kibId: '', kode: '', nama: '', tahun: '', kondisi: 'Rusak Berat', qty: 1, satuan: 'Unit' });
const phItemsHtml = () => `<div class="tw"><table><thead><tr><th>KIB ID</th><th>Kode Barang</th><th>Nama Barang</th><th>Tahun</th><th>Kondisi</th><th>Kuantitas</th><th>Satuan</th><th></th></tr></thead><tbody>${phItems.map((it, i) => `<tr>${['kibId', 'kode', 'nama', 'tahun', 'kondisi', 'qty', 'satuan'].map(f => `<td><input data-it="${i}" data-f="${f}" value="${esc(it[f])}"${f == 'qty' || f == 'tahun' ? ' type="number" style="width:80px"' : ' style="min-width:90px"'}></td>`).join('')}<td><button type="button" class="db" data-rm="${i}">Hapus</button></td></tr>`).join('') || '<tr><td colspan="8" class="ph-empty">Belum ada barang.</td></tr>'}</tbody></table></div>`;
function phFormSl(x) {
  phTmp = {}; const ed = !!x; phItems = ed ? x.items.map(i => ({ ...i })) : [];
  const m = phModal(ed ? 'Ubah ' + x.id : 'Tambah Penghapusan Sebab Lain',
    `<div class="ff">${FL('sl_unit', 'SKPD', ed ? x.unit : NM[0], 'text', 0, NM)}${FL('sl_tgl', 'Tanggal', ed ? x.tgl : today(), 'date')}${FL('sl_sebab', 'Jenis / Sebab Penghapusan', ed ? x.sebab : PH_SEBAB[0], 'text', 0, PH_SEBAB)}${FL('sl_tk', 'Tanggal Kejadian / Dasar', ed ? x.tglKejadian : '', 'date')}${FL('sl_ket', 'Keterangan', ed ? x.ket : '', 'area', 1)}${ed && x.cat ? `<div class="al2 full"><b>Catatan Admin:</b> ${esc(x.cat)}</div>` : ''}</div>` +
    `<h3 style="font-size:15px;margin:14px 0 8px">Daftar Barang</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="sl_kib" aria-label="Pilih dari daftar KIB">${K.map((k, i) => `<option value="${i}">${esc(k[0])} - ${esc(k[2])} (${k[3]})</option>`).join('')}</select><button type="button" class="btn o sm" data-addk="1">Tambah dari Daftar KIB</button><button type="button" class="btn o sm" data-addm="1">Tambah Barang Manual</button></div><div id="sl_items">${phItemsHtml()}</div>` +
    `<div class="ff" style="margin-top:12px">${phFileRow('up', 'Dokumen Dasar / Lampiran (opsional)', x && x.up, 0)}</div>`,
    `<button class="btn o" data-x="close">Batal</button><button class="btn o" data-sv="d">Simpan Draft</button><button class="btn" data-sv="a">Simpan &amp; Ajukan</button>`);
  const draw = () => { $('#sl_items').innerHTML = phItemsHtml(); };
  m.addEventListener('input', e => { const t = e.target; if (t.dataset.it != null) phItems[+t.dataset.it][t.dataset.f] = t.value; });
  m.addEventListener('click', e => {
    if (e.target.closest('[data-addk]')) { const k = K[+val('sl_kib')]; phItems.push({ kibId: k[0], kode: k[1], nama: k[2], tahun: k[3], kondisi: k[4], qty: k[5], satuan: k[6] }); return draw(); }
    if (e.target.closest('[data-addm]')) { phItems.push(phBlank()); return draw(); }
    const rm = e.target.closest('[data-rm]'); if (rm) { phItems.splice(+rm.dataset.rm, 1); return draw(); }
    const b = e.target.closest('[data-sv]'); if (b) phSaveSl(x, b.dataset.sv == 'a');
  });
}
function phSaveSl(x, ajukan) {
  const unit = val('sl_unit'), tgl = val('sl_tgl'), sebab = val('sl_sebab'), items = phItems.filter(i => String(i.nama).trim()), up = phTmp.up ? phMeta(phTmp.up) : x && x.up;
  if (!unit || !tgl || !sebab) return toast('SKPD, tanggal, dan sebab wajib diisi.', 'err');
  if (!items.length) return toast('Tambahkan minimal satu barang (nama barang wajib diisi).', 'err');
  if (items.some(i => !(+i.qty > 0))) return toast('Kuantitas setiap barang harus lebih dari 0.', 'err');
  const tahun = phYear(tgl);
  if (!x) { x = { id: 'SL-' + String(PH_DATA.phu.filter(s => s.jenis == 'Sebab Lain' && s.tahun == tahun).length + 1).padStart(3, '0') + '-' + tahun, no: '', jenis: 'Sebab Lain', status: 'Draft', h: [] }; PH_DATA.phu.unshift(x); phH(x, 'Usulan dibuat', CUR.name); } else phH(x, 'Usulan diubah', CUR.name);
  Object.assign(x, { unit, tgl, tahun, sebab, tglKejadian: val('sl_tk'), ket: val('sl_ket'), items: items.map(i => ({ ...i, qty: +i.qty })), qty: items.reduce((a, i) => a + (+i.qty), 0) });
  if (up) x.up = up;
  PH.tahun = tahun; PH.v.phsl.sel = x.id; phClose();
  if (ajukan) return phAjukan(x);
  Store.persist(); toast('Draft tersimpan.', 'ok'); phRe();
}

/* ---------- Lihat (detail + riwayat) ---------- */
function phLihat(k, x) {
  const lk = (key, src) => x[key] && x[key].n ? `<button type="button" class="lk" data-fo="${key}" data-src="${src}" data-id="${esc(x.id)}">${esc(x[key].n)}</button>` : '-';
  const st = phSt(k, x), row = [['No. ID', x.id]];
  if (k == 'phu' || k == 'phua' || k == 'phsl') row.push(['No. Permohonan', x.no || '-'], ['SKPD', x.unit], ['Jenis', x.jenis], ['Tanggal Usulan', x.tgl ? fd(x.tgl) : '-'], ['Qty', x.qty]); if (k == 'phu' || k == 'phua') row.push(['No. SK (rujukan)', x.noSk || '-']); if (k == 'phu' || k == 'phua' || k == 'phsl') row.push([x.jenis == 'Sebab Lain' ? 'Dokumen Dasar' : 'Surat Permohonan', lk('up', 'phu')]);
  else if (k == 'phs') row.push(['No. Usulan', x.usulanId], ['No. Permohonan', x.no || '-'], ['SKPD', x.unit], ['Jenis Permohonan', x.jenis], ['Tanggal', fd(x.tgl)], ['Qty', x.qty], ['No. SK', x.noSk || '-'], ['Tgl. SK', x.tglSk ? fd(x.tglSk) : '-'], ['File SK', lk('sk', 'phs')]);
  if (x.jenis == 'Sebab Lain') row.push(['Sebab', x.sebab], ['Tgl. Kejadian / Dasar', x.tglKejadian ? fd(x.tglKejadian) : '-'], ['Keterangan', x.ket || '-']);
  row.push(['Status', PL(st[0], esc(st[1]))]); if (x.cat) row.push(['Catatan Admin', esc(x.cat)]);
  const val2 = (l, v) => `<div style="color:var(--mt)">${l}</div><div>${typeof v == 'string' && /^<|&/.test(v) ? v : esc(v)}</div>`;
  const items = x.items ? `<h3 style="font-size:15px;margin:14px 0 6px">Daftar Barang</h3><div class="tw"><table><thead><tr><th>KIB ID</th><th>Kode</th><th>Nama Barang</th><th>Tahun</th><th>Kondisi</th><th>Kuantitas</th><th>Satuan</th></tr></thead><tbody>${x.items.map(i => `<tr><td>${esc(i.kibId || '-')}</td><td>${esc(i.kode || '-')}</td><td>${esc(i.nama)}</td><td>${esc(i.tahun || '-')}</td><td>${esc(i.kondisi || '-')}</td><td>${esc(i.qty)}</td><td>${esc(i.satuan || '-')}</td></tr>`).join('')}</tbody></table></div>` : '';
  const hist = (x.h || []).slice().reverse().map(h => `<li><b>${esc(h.a)}</b><small>${esc(h.t)}${h.n ? ' &middot; ' + esc(h.n) : ''}</small></li>`).join('');
  phModal('Detail ' + x.id, `<div style="display:grid;grid-template-columns:170px 1fr;gap:8px 14px;font-size:13.5px">${row.map(r => val2(r[0], r[1])).join('')}</div>${items}<h3 style="font-size:15px;margin:16px 0 8px">Riwayat</h3><ul class="tl">${hist || '<li><b>Belum ada riwayat</b></li>'}</ul>`, `<button class="btn" data-x="close">Tutup</button>`);
  if (phPer() && k == 'phu' && x.dilihat === false) { x.dilihat = true; Store.persist(); phBadge(); }
}
