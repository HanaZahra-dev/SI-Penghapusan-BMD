/* Modul 3 - Permohonan Penjualan
   Lelang   : Upload Risalah Lelang  +  Input BAST dan Upload BAST
   Langsung : Input BAST dan Upload BAST  +  Input AJB dan Upload AJB
   BAST/AJB diisi dari formulir lalu dibuat otomatis (Word) dari template; hasil yang sudah ditandatangani diunggah kembali.

   Data: PJ[noPermohonan] = { lel|lgs: { rl|bast|ajb: { f:{...isian}, up:{n,ty,sz,ts,files:[Blob]} }, fin:bool, ts } }
   Permohonan muncul di sini setelah SEMUA Kertas Kerja Penaksirannya selesai (kkAllDone), dikelompokkan menurut
   metode penjualan objek (o.jl = Lelang / Langsung). */
const PJ = {};
let pjCur = null;   /* { no, k } */
const PJ_K = { lel: { t: 'Lelang', jl: 'Lelang' }, lgs: { t: 'Langsung', jl: 'Langsung' } };
const PJ_STEPS = {
  lel: [{ id: 'rl', t: 'Risalah Lelang', up: 'Upload Risalah Lelang' }, { id: 'bast', t: 'BAST', form: 1, up: 'Upload BAST' }],
  lgs: [{ id: 'bast', t: 'BAST', form: 1, up: 'Upload BAST' }, { id: 'ajb', t: 'AJB', form: 1, up: 'Upload AJB' }]
};
const PJ_MAX = 5 * 1048576;
const PJ_P1 = { nama: 'Agih Pribadi Kusumah, S.E.,M.Si', ktp: '3271042903850007', ttl: 'Garut, 19-03-1985', alamat: 'Bukit Cimanggu City Cluster Oakwood KC 5 RT/RW 005/015 Kel. Kencana Kec. Tanah Sareal', kerja: 'Pegawai Negeri Sipil', pangkat: 'Pembina - IV/a', nip: '198503292011011001', jabatan: 'Kepala Bidang Pengelolaan Barang Milik Daerah Pada Badan Keuangan dan Aset Daerah Kota Bogor' };

/* ---------- utilitas angka & tanggal ---------- */
function pjTerbilang(n) {
  n = Math.floor(Math.abs(+n || 0)); if (n == 0) return 'nol';
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const t = x => {
    if (x < 12) return s[x];
    if (x < 20) return t(x - 10) + ' belas';
    if (x < 100) return t(Math.floor(x / 10)) + ' puluh' + (x % 10 ? ' ' + t(x % 10) : '');
    if (x < 200) return 'seratus' + (x % 100 ? ' ' + t(x % 100) : '');
    if (x < 1000) return t(Math.floor(x / 100)) + ' ratus' + (x % 100 ? ' ' + t(x % 100) : '');
    if (x < 2000) return 'seribu' + (x % 1000 ? ' ' + t(x % 1000) : '');
    if (x < 1e6) return t(Math.floor(x / 1000)) + ' ribu' + (x % 1000 ? ' ' + t(x % 1000) : '');
    if (x < 1e9) return t(Math.floor(x / 1e6)) + ' juta' + (x % 1e6 ? ' ' + t(x % 1e6) : '');
    if (x < 1e12) return t(Math.floor(x / 1e9)) + ' miliar' + (x % 1e9 ? ' ' + t(x % 1e9) : '');
    return t(Math.floor(x / 1e12)) + ' triliun' + (x % 1e12 ? ' ' + t(x % 1e12) : '');
  };
  return t(n);
}
const pjCap = t => String(t).replace(/(^|\s)(\S)/g, (a, b, c) => b + c.toUpperCase());
const PJ_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const PJ_BLN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
function pjTgl(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], dt = new Date(y, mo - 1, d);
  return { hari: PJ_HARI[dt.getDay()], d, y, bln: PJ_BLN[mo - 1], angka: m[3] + '-' + m[2] + '-' + m[1], panjang: d + ' ' + pjCap(PJ_BLN[mo - 1]) + ' ' + y, kata: pjTerbilang(d), thn: pjTerbilang(y) };
}
const pjXml = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pjUpperNama = t => String(t || '').toUpperCase().replace(/M\.SI/g, 'M.Si').replace(/,(?=\S)/g, ', ');

/* ---------- sumber data ---------- */
function pjSiap() { try { syncTksToObjects(); kkMigrasi(); } catch (e) { } }
const pjIdx = (p, k) => p.o.map((o, i) => i).filter(i => p.o[i].jl == PJ_K[k].jl);
const pjList = k => OB.filter(p => p.no && kkAllDone(p) && pjIdx(p, k).length);
const pjNilai = (p, k) => pjIdx(p, k).reduce((a, i) => a + (kkNilai(p, i).nl || 0), 0);
function pjD(no, k) { const x = PJ[no] = PJ[no] || {}; return x[k] = x[k] || {}; }
const pjStepOk = (d, s) => !!(d[s.id] && d[s.id].up && (!s.form || d[s.id].f));
const pjDone = (no, k) => { const d = pjD(no, k); return PJ_STEPS[k].filter(s => pjStepOk(d, s)).length; };
function pjStat(no, k) {
  const d = pjD(no, k), n = pjDone(no, k), t = PJ_STEPS[k].length;
  if (d.fin) return ['s-g', 'Selesai'];
  if (n == t) return ['s-b', 'Siap Diselesaikan'];
  const any = PJ_STEPS[k].some(s => d[s.id] && (d[s.id].up || d[s.id].f));
  return any ? ['s-o', 'Proses · ' + n + '/' + t] : ['s-n', 'Belum Dimulai'];
}
function pjBadge() {
  [['lel', 'pjcL'], ['lgs', 'pjcG']].forEach(([k, id]) => {
    const e = document.getElementById(id); if (!e) return;
    let n = 0; try { pjSiap(); n = pjList(k).filter(p => !pjD(p.no, k).fin).length; } catch (x) { }
    e.textContent = n; e.style.display = n ? '' : 'none';
  });
}
/* Dropdown menu samping: induk ikut menyala dan terbuka bila salah satu submenu aktif */
function pjSyncMenu() {
  const tg = document.querySelector('[data-menu-toggle="penjualan-submenu"]'); if (!tg) return;
  const on = !!document.querySelector('#penjualan-submenu .nav.on');
  tg.classList.toggle('has-on', on);
  const sub = document.getElementById('penjualan-submenu');
  tg.setAttribute('aria-expanded', String(on));
  if (sub) sub.hidden = !on;
  pjBadge();
}

/* ---------- isian formulir ---------- */
const pjFields = (id, k) => id == 'bast' ? [
  ['nomor', 'Nomor BAST', 'text', 0, 'Contoh: 800.1.11.1/…-BKAD/2026'], ['tgl', 'Tanggal Serah Terima', 'date'],
  ['p1nama', 'Nama Pihak Kesatu (Pejabat Penjual)'], ['p1nip', 'NIP Pihak Kesatu'],
  ['p1jabatan', 'Jabatan Pihak Kesatu', 'text', 1], ['p1pangkat', 'Pangkat / Golongan'], ['nosprint', 'Nomor Surat Perintah', 'text', 0, 'Contoh: 800.1.11.1 /SPRINT.3945-BKAD/2026'],
  ['p2nama', 'Nama Pihak Kedua (' + (k == 'lel' ? 'Pemenang Lelang' : 'Pembeli') + ')'], ['p2alamat', 'Alamat Pihak Kedua', 'text', 1, 'Contoh: Kp. Tangkil Rt. 01 Rw. 05 Kel. Katulampa Kec. Bogor Timur Kota Bogor'],
  ['sts', 'Nomor STS'], ['nobank', 'Nomor Transaksi Bank'],
  ['opd', 'Perangkat Daerah'], ['alamatopd', 'Alamat Perangkat Daerah'],
  ['uraian', 'Uraian Barang', 'area', 1, 'Contoh: 209 (Dua Ratus Sembilan) Unit Peralatan dan Mesin dalam Bentuk Limbah Padat (Scrap)']
] : [
  ['nomor', 'Nomor AJB', 'text', 0, 'Nomor Akta Jual Beli'], ['tgl', 'Tanggal AJB', 'date'],
  ['p1nama', 'Nama Pihak Penjual (Pihak I)'], ['p1ktp', 'No. KTP Penjual'], ['p1ttl', 'Tempat, Tanggal Lahir Penjual'], ['p1kerja', 'Pekerjaan Penjual'],
  ['p1alamat', 'Alamat Penjual', 'text', 1], ['p1pangkat', 'Pangkat / Golongan Penjual'], ['p1nip', 'NIP Penjual'],
  ['p2nama', 'Nama Pihak Pembeli (Pihak II)'], ['p2ktp', 'No. KTP Pembeli'], ['p2ttl', 'Tempat, Tanggal Lahir Pembeli', 'text', 0, 'Contoh: Bogor, 05-09-1978'], ['p2kerja', 'Pekerjaan Pembeli'],
  ['p2alamat', 'Alamat Pembeli', 'text', 1],
  ['opd', 'Perangkat Daerah'], ['alamatopd', 'Alamat Perangkat Daerah'], ['uraian', 'Uraian Barang', 'area', 1],
  ['nilai', 'Nilai Jual (Rp)', 'number'], ['sts', 'Nomor STS'], ['nobank', 'Nomor Transaksi Bank'],
  ['saksi1', 'Saksi 1'], ['saksi2', 'Saksi 2 (boleh dikosongkan)']
];
const pjWajib = id => id == 'bast' ? ['nomor', 'tgl', 'p1nama', 'p1nip', 'p2nama', 'p2alamat', 'sts', 'nobank', 'opd', 'alamatopd', 'uraian', 'nosprint']
  : ['nomor', 'tgl', 'p1nama', 'p2nama', 'p2ktp', 'p2ttl', 'p2kerja', 'p2alamat', 'opd', 'alamatopd', 'uraian', 'nilai', 'sts', 'nobank'];
const pjLbl = (id, k, key) => (pjFields(id, k).find(f => f[0] == key) || [0, key])[1];
const PJ_SHARE = ['tgl', 'p1nama', 'p1nip', 'p1pangkat', 'p2nama', 'p2alamat', 'sts', 'nobank', 'uraian', 'opd', 'alamatopd'];

function pjDefault(p, k, id) {
  const ix = pjIdx(p, k), n = ix.length, nm = ix.map(i => p.o[i].n);
  const alamat = (typeof alamatPermohonan == 'function' ? alamatPermohonan(p.no) : '') || (typeof alamatOpdTerakhir == 'function' ? alamatOpdTerakhir(p.pd) : '') || p.al || '';
  const f = {
    nomor: '', tgl: today(), p1nama: PJ_P1.nama, p1nip: PJ_P1.nip, p1pangkat: PJ_P1.pangkat, p1jabatan: PJ_P1.jabatan, nosprint: '',
    p1ktp: PJ_P1.ktp, p1ttl: PJ_P1.ttl, p1alamat: PJ_P1.alamat, p1kerja: PJ_P1.kerja,
    p2nama: '', p2alamat: '', p2ktp: '', p2ttl: '', p2kerja: '', sts: '', nobank: '', saksi1: '', saksi2: '',
    opd: p.pd, alamatopd: alamat,
    uraian: n + ' (' + pjCap(pjTerbilang(n)) + ') Objek Barang Milik Daerah berupa ' + nm.slice(0, 3).join(', ') + (nm.length > 3 ? ' dan lainnya' : ''),
    nilai: Math.round(pjNilai(p, k)) || ''
  };
  return f;
}
function pjF(no, k, id) {
  const p = OB.find(x => x.no == no), d = pjD(no, k), f = pjDefault(p, k, id), other = id == 'bast' ? 'ajb' : 'bast';
  if (d[other] && d[other].f) PJ_SHARE.forEach(q => { if (d[other].f[q]) f[q] = d[other].f[q]; });
  return Object.assign(f, d[id] && d[id].f || {});
}
const pjCollect = (id, k) => { const f = {}; pjFields(id, k).forEach(([q]) => { const e = document.getElementById('pj_' + q); f[q] = e ? e.value.trim() : ''; }); return f; };
const pjMiss = (id, k, F) => pjWajib(id).filter(q => !String(F[q] == null ? '' : F[q]).trim()).map(q => pjLbl(id, k, q));

/* ---------- pembuatan dokumen Word dari template ---------- */
function pjTokens(id, k, F) {
  const t = pjTgl(F.tgl) || { hari: '', kata: '', bln: '', thn: '', angka: '', panjang: '' }, T = '...........................................';
  const alamat = String(F.alamatopd || '').replace(/\.\s*$/, '');
  const nil = Math.round(+F.nilai || 0);
  const v = x => String(x || '').trim() || T;
  return {
    NOMOR: v(F.nomor), HARI: t.hari, TGL_ANGKA: t.angka, TGL_PANJANG: t.panjang,
    TGL_TERBILANG: t.kata + ' ' + t.bln + ' tahun ' + t.thn, TGL_TERBILANG_B: t.kata + ' bulan ' + t.bln + ' tahun ' + t.thn,
    P1_NAMA: v(F.p1nama), P1_NAMA_UPPER: pjUpperNama(v(F.p1nama)), P1_NIP: v(F.p1nip), P1_PANGKAT: v(F.p1pangkat), P1_JABATAN: v(F.p1jabatan),
    P1_KTP: v(F.p1ktp), P1_TTL: v(F.p1ttl), P1_ALAMAT: v(F.p1alamat), P1_KERJA: v(F.p1kerja),
    P2_NAMA: v(F.p2nama), P2_NAMA_UPPER: pjUpperNama(v(F.p2nama)), P2_ALAMAT: v(F.p2alamat), P2_KTP: v(F.p2ktp), P2_TTL: v(F.p2ttl), P2_KERJA: v(F.p2kerja),
    NO_SPRINT: v(F.nosprint), STS: v(F.sts), NO_BANK: v(F.nobank),
    PERAN: k == 'lel' ? 'pemenang lelang' : 'pembeli', JENIS_JUAL: k == 'lel' ? 'penjualan secara lelang' : 'penjualan langsung',
    BARANG_LENGKAP: v(F.uraian) + ' pada ' + v(F.opd) + ' di ' + (alamat || T),
    NILAI_LENGKAP: 'Rp. ' + nil.toLocaleString('id-ID') + '- (' + pjCap(pjTerbilang(nil)) + ' Rupiah)',
    SAKSI1: String(F.saksi1 || '').trim() || '          ', SAKSI2: String(F.saksi2 || '').trim() || '          '
  };
}
async function pjDocx(id, k, F) {
  const b64 = id == 'bast' ? (typeof BAST_TPL_B64 != 'undefined' ? BAST_TPL_B64 : null) : (typeof AJB_TPL_B64 != 'undefined' ? AJB_TPL_B64 : null);
  if (typeof JSZip == 'undefined' || !b64) throw new Error('JSZip / template belum termuat');
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), m = pjTokens(id, k, F);
  const x = (await z.file('word/document.xml').async('string')).replace(/\{\{([A-Z0-9_]+)\}\}/g, (a, q) => q in m ? pjXml(m[q]) : a);
  z.file('word/document.xml', x);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}
/* Pratinjau teks: paragraf dibaca dari dokumen Word yang sudah terisi (selalu sama dengan hasil unduhan) */
async function pjPreviewHtml(blob) {
  const z = await JSZip.loadAsync(blob), x = await z.file('word/document.xml').async('string');
  const un = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const out = [];
  (x.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).forEach((p, i) => {
    const t = un(p.replace(/<w:tab\/>/g, '<w:t>    </w:t>').match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)?.map(a => a.replace(/<[^>]+>/g, '')).join('') || '');
    if (!t.trim()) { out.push('<div class="pj-sp"></div>'); return; }
    const c = /<w:jc w:val="(center|both|right)"/.exec(p), al = c ? (c[1] == 'both' ? 'justify' : c[1]) : '', hd = i < 2 && t.length < 60;
    out.push(`<p style="${al ? 'text-align:' + al + ';' : ''}${hd ? 'font-weight:700;' : ''}white-space:pre-wrap">${esc(t)}</p>`);
  });
  return out.join('').replace(/(<div class="pj-sp"><\/div>){2,}/g, '<div class="pj-sp"></div>');
}

/* ---------- modal & unggah berkas ---------- */
function pjModal(html, onClose) {
  const old = $('#pj_md'); if (old) old.remove();
  const m = document.createElement('div'); m.id = 'pj_md'; m.className = 'bamd'; m.innerHTML = html; document.body.appendChild(m);
  const close = () => { m.remove(); document.removeEventListener('keydown', kd); onClose && onClose(); };
  const kd = e => { if (e.key == 'Escape') close(); };
  document.addEventListener('keydown', kd);
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x]')) close(); });
  return m;
}
function pjView(no, k, id) {
  const u = (pjD(no, k)[id] || {}).up, b = u && u.files && u.files[0];
  if (!b) return toast('Berkas tidak tersedia untuk dipratinjau. Silakan unggah ulang.');
  const url = URL.createObjectURL(b.type ? b : new Blob([b], { type: u.ty })), img = /^image\//.test(u.ty);
  pjModal(`<div class="bamd-c" role="dialog" aria-modal="true"><div class="bamd-h"><div><b>${esc(u.n)}</b><small class="mt">${esc(ptSize(u.sz))} · ${esc(u.ts || '')}</small></div><button type="button" class="ic-b" data-x="1" aria-label="Tutup">&times;</button></div><div class="bamd-b">${img ? `<img src="${url}" alt="${esc(u.n)}">` : `<iframe src="${url}" title="${esc(u.n)}"></iframe>`}</div><div class="bamd-f"><a class="btn o" href="${url}" target="_blank" rel="noopener">Buka di tab baru</a><a class="btn o" href="${url}" download="${esc(u.n)}">Unduh</a></div></div>`, () => URL.revokeObjectURL(url));
}
function pjPick(no, k, id, re) {
  const d = pjD(no, k), s = PJ_STEPS[k].find(x => x.id == id);
  if (d.fin) return toast('Penjualan sudah diselesaikan dan dikunci.');
  if (s.form && !(d[id] && d[id].f)) return toast('Simpan data ' + s.t + ' terlebih dahulu, lalu unggah hasil yang sudah ditandatangani.');
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/pdf,image/png,image/jpeg';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    if (!/^(application\/pdf|image\/(png|jpeg))$/.test(f.type)) return toast('Format harus PDF, JPG, atau PNG.');
    if (f.size > PJ_MAX) return toast('Ukuran berkas maksimal 5 MB.');
    const T = pjD(no, k), baru = !(T[id] && T[id].up);
    T[id] = T[id] || {}; T[id].up = { n: f.name, ty: f.type, sz: f.size, ts: nowStr(), files: [f] };
    Store.persist(); toast(s.t + (baru ? ' berhasil diunggah.' : ' diganti.'), 'ok'); re();
  };
  inp.click();
}
function pjRm(no, k, id, re) {
  const d = pjD(no, k), s = PJ_STEPS[k].find(x => x.id == id);
  if (d.fin) return toast('Penjualan sudah diselesaikan dan dikunci.');
  cfm('Hapus berkas ' + s.t + '?', 'Berkas yang sudah diunggah akan dihapus.', () => { if (d[id]) { delete d[id].up; if (!d[id].f) delete d[id]; } Store.persist(); toast('Berkas ' + s.t + ' dihapus.'); re(); }, 'Hapus');
}

/* ---------- halaman daftar ---------- */
function pjRows(k, q) {
  q = (q || '').toLowerCase().trim();
  const r = pjList(k).filter(p => !q || (p.no + ' ' + p.pd).toLowerCase().includes(q));
  if (!r.length) return `<tr><td colspan="7" class="mt" style="text-align:center;padding:30px">${q ? 'Tidak ada hasil untuk pencarian tersebut.' : 'Belum ada permohonan dengan metode penjualan ' + PJ_K[k].t.toLowerCase() + '. Permohonan muncul setelah semua Kertas Kerja Penaksirannya selesai.'}</td></tr>`;
  return r.map((p, i) => {
    const d = pjD(p.no, k), st = pjStat(p.no, k);
    return `<tr><td>${i + 1}</td><td><b>${esc(p.no)}</b><div class="mt" style="font-size:12px">${esc(p.pd)}</div></td><td>${pjIdx(p, k).length} objek</td><td><b>${RP(pjNilai(p, k))}</b></td>` +
      `<td><div class="pj-ch">${PJ_STEPS[k].map(s => `<span class="pj-c${pjStepOk(d, s) ? ' y' : ''}">${pjStepOk(d, s) ? '✓' : '○'} ${s.t}</span>`).join('')}</div></td><td>${PL(st[0], st[1])}</td>` +
      `<td><button class="btn sm" data-pj="${esc(p.no)}">${d.fin ? 'Lihat' : pjDone(p.no, k) || d.bast || d.rl || d.ajb ? 'Lanjutkan' : 'Proses'}</button></td></tr>`;
  }).join('');
}
function pjPage(k) {
  pjSiap();
  const s = $('#' + k);
  if (pjCur && pjCur.k == k && OB.find(p => p.no == pjCur.no)) return pjDetail(s, k);
  pjCur = null;
  const L = PJ_K[k], al = k == 'lel' ? 'Upload Risalah Lelang &rarr; Input BAST &rarr; Upload BAST &rarr; Selesaikan.' : 'Input BAST &rarr; Upload BAST &rarr; Input AJB &rarr; Upload AJB &rarr; Selesaikan.';
  s.innerHTML = HD('Penjualan ' + L.t, 'Permohonan penjualan dengan metode ' + L.t.toLowerCase() + ' yang taksirannya sudah selesai.') + ALR('Alur:', al) +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar Permohonan ${L.t}</h2><small class="mt">Permohonan muncul setelah semua Kertas Kerja Penaksiran selesai.</small></div><label class="sr2 pt-q"><svg class="i"><use href="#sq"></use></svg><input id="pj_q" placeholder="Cari nomor permohonan atau perangkat daerah…"></label></div>` +
    `<div class="tw"><table class="pt-t"><thead><tr><th>No</th><th>Permohonan</th><th>Objek</th><th>Nilai Taksiran</th><th>Kelengkapan</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="pj_tb">${pjRows(k, '')}</tbody></table></div></div>`;
  s.oninput = e => { if (e.target.id == 'pj_q') $('#pj_tb').innerHTML = pjRows(k, e.target.value); };
  s.onchange = null;
  s.onclick = e => { const b = e.target.closest('[data-pj]'); if (b) { pjCur = { no: b.dataset.pj, k }; pjPage(k); scrollTo(0, 0); } };
  pjBadge();
}

/* ---------- halaman detail ---------- */
function pjUpRow(no, k, s, ro) {
  const d = pjD(no, k), u = d[s.id] && d[s.id].up;
  return `<div class="dr${u ? ' y' : ''}"><span class="dn">${u ? '✓' : '•'}</span><div class="dm"><b>${s.up}</b><small class="mt">${u ? esc(u.n) + ' · ' + esc(ptSize(u.sz)) + ' · ' + esc(u.ts) : (s.form ? 'Cetak dokumen di atas, tanda tangani, lalu unggah hasilnya (PDF / JPG / PNG, maks. 5 MB).' : 'PDF / JPG / PNG, maksimal 5 MB')}</small></div>` +
    `<div class="da">${u ? `<button type="button" class="btn o sm" data-a="view" data-id="${s.id}">Lihat</button>` : ''}${ro ? '' : `<button type="button" class="btn${u ? ' o' : ''} sm" data-a="up" data-id="${s.id}">${u ? 'Ganti' : 'Pilih File'}</button>${u ? `<button type="button" class="btn o sm" data-a="rm" data-id="${s.id}">Hapus</button>` : ''}`}</div></div>`;
}
function pjInput(id, k, f, F, ro) {
  const [q, l, t, full, ph] = f, val = F[q] == null ? '' : F[q], dis = ro ? ' disabled' : '';
  return `<label class="l2${full ? ' full' : ''}">${l}` + (t == 'area' ? `<textarea id="pj_${q}" rows="2" placeholder="${esc(ph || '')}"${dis}>${esc(val)}</textarea>` : `<input id="pj_${q}" type="${t || 'text'}" value="${esc(val)}" placeholder="${esc(ph || '')}"${dis}>`) + `</label>`;
}
function pjDetail(s, k) {
  const no = pjCur.no, p = OB.find(x => x.no == no), d = pjD(no, k), L = PJ_K[k], st = pjStat(no, k), ro = !!d.fin, n = pjDone(no, k), tot = PJ_STEPS[k].length;
  let body = '';
  PJ_STEPS[k].forEach((sp, i) => {
    const ok = pjStepOk(d, sp);
    if (!sp.form) { body += ptSec((i + 1) + '. ' + sp.up, 'Unggah risalah lelang resmi.', pjUpRow(no, k, sp, ro)); return; }
    const F = pjF(no, k, sp.id), saved = !!(d[sp.id] && d[sp.id].f);
    body += `<div class="cd pt-sec"><div class="ch"><div><h2>${i + 1}. Input ${sp.t} dan ${sp.up}</h2><small class="mt">${sp.id == 'bast' ? 'Berita Acara Serah Terima' : 'Akta Jual Beli'}.</small></div>${PL(ok ? 's-g' : saved ? 's-b' : 's-n', ok ? 'Lengkap' : saved ? 'Data tersimpan' : 'Belum diisi')}</div>` +
      `<div class="ff">${pjFields(sp.id, k).map(f => pjInput(sp.id, k, f, F, ro)).join('')}</div>` +
      (ro ? '' : `<div class="pt-bar" style="margin:14px 0 8px"><button type="button" class="btn" data-a="save" data-id="${sp.id}">Simpan Data ${sp.t}</button><button type="button" class="btn o" data-a="prev" data-id="${sp.id}">Pratinjau</button><button type="button" class="btn o" data-a="docx" data-id="${sp.id}">Unduh Word (.docx)</button><a class="btn o" href="assets/template/Template_${sp.t}.docx" download="Template ${sp.t}.docx">Unduh Template Kosong</a></div>`) +
      `<div class="drs" style="margin-top:6px">${pjUpRow(no, k, sp, ro)}</div></div>`;
  });
  s.innerHTML = `<div class="pt-hd"><button class="btn o sm" data-a="bk">← Kembali ke daftar</button><div><h1>Penjualan ${L.t} · ${esc(no)}</h1><p>${esc(p.pd)} · ${pjIdx(p, k).length} objek · Nilai taksiran ${RP(pjNilai(p, k))}</p></div><span style="margin-left:auto">${PL(st[0], st[1])}</span></div>` +
    (ro ? ALR('Selesai.', 'Penjualan ini sudah diselesaikan dan datanya dikunci.') : '') + body +
    `<div class="sg-bar"><span><b>${n}/${tot}</b> tahapan lengkap${n == tot && !ro ? ' · siap diselesaikan' : ''}</span><div>${ro ? '' : `<button type="button" class="btn" data-a="fin"${n == tot ? '' : ' disabled'}>Selesaikan Penjualan ${L.t}</button>`}</div></div>`;
  const re = () => pjPage(k);
  s.oninput = s.onchange = null;
  s.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, id = b.dataset.id;
    if (a == 'bk') { pjCur = null; return pjPage(k); }
    if (a == 'view') return pjView(no, k, id);
    if (a == 'up') return pjPick(no, k, id, re);
    if (a == 'rm') return pjRm(no, k, id, re);
    if (a == 'fin') return cfm('Selesaikan penjualan ' + L.t.toLowerCase() + '?', 'Dokumen dikunci dan tidak dapat diubah lagi.', () => {
      const T = pjD(no, k); if (pjDone(no, k) < tot) return; T.fin = true; T.ts = nowStr(); hs(no, 'Penjualan ' + L.t + ' selesai', 'Dokumen ' + PJ_STEPS[k].map(x => x.t).join(', ') + ' lengkap'); Store.persist(); toast('Penjualan ' + L.t.toLowerCase() + ' selesai.', 'ok'); pjBadge(); re();
    }, 'Selesai');
    const F = pjCollect(id, k), miss = pjMiss(id, k, F);
    if (a == 'save') {
      if (miss.length) return toast('Lengkapi dulu: ' + miss.join(', ') + '.', 'err');
      const T = pjD(no, k); T[id] = T[id] || {}; T[id].f = F; T[id].ts = nowStr(); Store.persist(); toast('Data ' + id.toUpperCase() + ' tersimpan. Silakan unduh, tanda tangani, lalu unggah.', 'ok'); return re();
    }
    if (miss.length) return toast('Lengkapi dulu: ' + miss.join(', ') + '.', 'err');
    b.disabled = true;
    pjDocx(id, k, F).then(async blob => {
      if (a == 'docx') {
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = id.toUpperCase() + ' ' + L.t + ' - ' + no.replace(/[\\/:*?"<>|]/g, '-') + '.docx';
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000); toast('Dokumen Word berhasil dibuat.', 'ok');
      } else {
        const h = await pjPreviewHtml(blob);
        pjModal(`<div class="bamd-c" role="dialog" aria-modal="true"><div class="bamd-h"><div><b>Pratinjau ${id.toUpperCase()}</b><small class="mt">Isi mengikuti formulir; tata letak final ada pada file Word.</small></div><button type="button" class="ic-b" data-x="1" aria-label="Tutup">&times;</button></div><div class="bamd-b"><div class="pj-paper">${h}</div></div></div>`);
      }
    }).catch(er => { console.error(er); toast('Gagal membuat dokumen: ' + er.message); }).finally(() => { b.disabled = false; });
  };
  pjBadge();
}
const pgLel = () => pjPage('lel'), pgLgs = () => pjPage('lgs');
