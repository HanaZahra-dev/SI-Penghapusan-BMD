/* Permohonan Penaksiran (Pengguna Barang)
   Tampilan mengikuti halaman "Verifikasi Permohonan" milik Admin, tetapi untuk pengguna barang:
   - Dokumen: unggah Surat Tanggung Jawab Mutlak (ada pratinjau)
   - Tonase Barang: tabel barang + kolom Tonase dan Satuan (dropdown), bisa diisi dari Excel
   Data: RX[no].tks = { st: 'Draft' | 'Diajukan', ts, src: 'permohonan' | 'excel', srcName, rows: [...], doc: { name, ty, size, files: [Blob] } } */
let tksCur = null, tksMode = 'manual', tksAdminCur = null;
let tksAdminFilter = { kondisi: '' };
const TKS_SAT = ['Kg', 'Ton'];
const TKS_DOC_MAX = 10 * 1024 * 1024, TKS_ROWS_MAX = 500;
const TKS_COLS = ['KIB ID', 'Kode Barang', 'Nama Barang', 'Tahun', 'Kondisi', 'Kuantitas', 'Satuan', 'Tonase', 'Satuan Tonase'];

/* Rujukan ke Persetujuan Kepala Daerah: nomor dan tanggal surat persetujuan */
const psjRef = (no, inline) => { const p = (SVS[no] || {}).psj; if (!p || p.st != 'Tersimpan') return '<span class="mt">-</span>'; const f = p.f || {}, tg = f.tgl ? psjTgl(f.tgl) : ''; return inline ? `<b>${esc(f.nomor || '-')}</b>${tg ? ' · ' + esc(tg) : ''}` : `<b>${esc(f.nomor || '-')}</b>${tg ? `<div class="mt" style="font-size:12px">${esc(tg)}</div>` : ''}`; };
const tksNz = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const tksX = no => (RX[no] || {}).tks || null;
const tksFromKib = no => (((RX[no] || {}).f || {}).kib || []).map(q => { const r = K[q]; return { kib: r[0], kode: r[1], nama: r[2], tahun: r[3], kondisi: r[4], qty: r[5], sat: r[6], tonase: '', satt: 'Kg' }; });
const tksRows = no => { const t = tksX(no); return t && Array.isArray(t.rows) ? t.rows : tksFromKib(no); };
function tksEnsure(no) {
  const x = RX[no] = RX[no] || { h: [] };
  if (!x.tks) x.tks = { st: 'Draft', saved: false, src: 'permohonan', rows: tksFromKib(no), doc: null, verif: { st: 'Belum Diajukan', doc: '', docNote: '', check: [], notes: [] } };
  else {
    if (x.tks.saved == null) x.tks.saved = true;
    if (!x.tks.verif) x.tks.verif = { st: x.tks.st == 'Diajukan' ? 'Menunggu Verifikasi' : 'Belum Diajukan', doc: '', docNote: '', check: [], notes: [] };
  }
  x.tks.verif.check = x.tks.verif.check || [];
  x.tks.verif.notes = x.tks.verif.notes || [];
  return x.tks;
}
const tksStat = no => {
  const t = tksX(no), v = t && t.verif;
  return !t ? ['s-n', 'Belum diisi'] : v && v.st == 'Disetujui' ? ['s-g', 'Disetujui'] : v && v.st == 'Ditolak' ? ['s-r', 'Ditolak Admin'] : t.st == 'Diajukan' ? ['s-b', 'Menunggu Admin'] : ['s-o', 'Draft'];
};
function tksSyncActions(s, no) {
  const b = s.querySelector('[data-a="ajukan"]'), t = tksX(no);
  if (b) { b.disabled = !t || !t.saved; b.title = !t || !t.saved ? 'Simpan draft sebelum mengajukan' : ''; }
}
function tksNum(v) {
  let s = tksNz(v).replace(/\s/g, ''); if (!s) return NaN;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.'); else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s); return isFinite(n) ? n : NaN;
}
const tksFmt = n => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 3 });
const tksKg = r => { const n = tksNum(r.tonase); return isNaN(n) ? 0 : (r.satt == 'Ton' ? n * 1000 : n); };
const tksSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function tksSumHtml(no) {
  const a = tksRows(no), isi = a.filter(r => tksNum(r.tonase) > 0).length, kg = a.reduce((s, r) => s + tksKg(r), 0);
  return `<span><b>${isi}/${a.length}</b>Tonase terisi</span><span><b>${tksFmt(kg)}</b>Total (Kg)</span><span><b>${tksFmt(kg / 1000)}</b>Total (Ton)</span>`;
}

/* ---------- Excel: baca dan buat template ---------- */
function tksParse(sheets) {
  const sh = sheets.find(x => /tonase|barang/i.test(x.name)) || sheets[0];
  if (!sh) throw new Error('Tidak ada lembar kerja pada file.');
  const hi = sh.rows.findIndex(r => Array.from(r || [], c => tksNz(c).toLowerCase()).some(c => /^nama(\s*barang)?$/.test(c)));
  if (hi < 0) throw new Error('Baris judul kolom tidak ditemukan. Pastikan ada kolom "Nama Barang" dan "Tonase" (unduh template untuk contoh).');
  const H = Array.from(sh.rows[hi], c => tksNz(c).toLowerCase()), col = {};
  H.forEach((h, i) => {
    const k = /^satuan\s*(tonase|berat)$/.test(h) ? 'satt' : /^(kib(\s*id)?|id\s*kib)$/.test(h) ? 'kib' : /^kode(\s*barang)?$/.test(h) ? 'kode' : /^nama(\s*barang)?$/.test(h) ? 'nama'
      : /^tahun/.test(h) ? 'tahun' : /^kondisi/.test(h) ? 'kondisi' : /^(kuantitas|qty|jumlah)$/.test(h) ? 'qty' : /^satuan$/.test(h) ? 'sat' : /^(tonase|berat)/.test(h) ? 'tonase' : '';
    if (k && col[k] == null) col[k] = i;
  });
  const miss = [col.nama == null && 'Nama Barang', col.tonase == null && 'Tonase'].filter(Boolean);
  if (miss.length) throw new Error('Kolom wajib tidak ditemukan: ' + miss.join(', ') + '.');
  const g = (r, k) => col[k] == null ? '' : tksNz(r[col[k]]);
  let warn = 0; const rows = [];
  sh.rows.slice(hi + 1).forEach(r => {
    if (!r || !g(r, 'nama')) return;
    const raw = g(r, 'tonase'), n = tksNum(raw), sv = g(r, 'satt').toLowerCase();
    if (raw && isNaN(n)) warn++;
    let satt = 'Kg'; if (/^ton$/.test(sv)) satt = 'Ton'; else if (sv && !/^(kg|kilogram|kilo)$/.test(sv)) warn++;
    rows.push({ kib: g(r, 'kib') || '-', kode: g(r, 'kode') || '-', nama: g(r, 'nama'), tahun: g(r, 'tahun') || '-', kondisi: g(r, 'kondisi') || '-', qty: g(r, 'qty') || '-', sat: g(r, 'sat') || '-', tonase: isNaN(n) ? '' : n, satt });
  });
  if (!rows.length) throw new Error('Tidak ada baris barang yang dapat dibaca (kolom Nama Barang kosong).');
  const cut = rows.length > TKS_ROWS_MAX; if (cut) rows.length = TKS_ROWS_MAX;
  return { rows, warn, cut };
}
const tksXml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function tksTemplate(no, type) {
  const L = i => String.fromCharCode(65 + i);
  const cell = (i, r, v) => (typeof v == 'number' && isFinite(v)) ? `<c r="${L(i)}${r}"><v>${v}</v></c>` : (v === '' || v == null) ? '' : `<c r="${L(i)}${r}" t="inlineStr"><is><t xml:space="preserve">${tksXml(v)}</t></is></c>`;
  const num = v => /^\d+(\.\d+)?$/.test(String(v)) ? Number(v) : v;
  let rows = tksRows(no).map(r => [r.kib, r.kode, r.nama, num(r.tahun), r.kondisi, num(r.qty), r.sat, r.tonase === '' ? '' : Number(r.tonase), r.satt]);
  if (!rows.length) rows = [['KIB-B-025', '1.3.02', 'Mesin / Peralatan', 2019, 'Rusak Berat', 2, 'Unit', 1.5, 'Ton']];
  const sheetRows = [TKS_COLS, ...rows].map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => cell(ci, ri + 1, v)).join('')}</row>`).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="2" width="14" customWidth="1"/><col min="3" max="3" width="30" customWidth="1"/><col min="4" max="9" width="14" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Satuan Tonase" error="Pilih Kg atau Ton." sqref="I2:I${TKS_ROWS_MAX + 1}"><formula1>"${TKS_SAT.join(',')}"</formula1></dataValidation></dataValidations></worksheet>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  z.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tonase Barang" sheetId="1" r:id="rId1"/></sheets></workbook>');
  z.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  z.file('xl/worksheets/sheet1.xml', sheet);
  return z.generateAsync({ type: type || 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression: 'DEFLATE' });
}

/* ---------- Pratinjau Surat Tanggung Jawab Mutlak ---------- */
function tksPreview(no) {
  const T = tksX(no), doc = T && T.doc, b = doc && doc.files && doc.files[0];
  if (!b) return toast('Berkas belum tersedia untuk dipratinjau.');
  pvClose(); pvUrl = URL.createObjectURL(b);
  const isImg = /^image\//.test(b.type || doc.ty || ''), nm = esc(doc.name);
  const m = document.createElement('div'); m.id = 'pvm'; m.className = 'pvm';
  m.innerHTML = `<div class="pvb" role="dialog" aria-modal="true" aria-label="Pratinjau dokumen"><div class="pvh"><div><b>Surat Tanggung Jawab Mutlak</b><small class="mt">${esc(no)} · ${nm}</small></div><div class="pva"><a class="btn o sm" href="${pvUrl}" download="${nm}">Unduh</a><a class="btn o sm" href="${pvUrl}" target="_blank" rel="noopener">Tab baru</a><button type="button" class="btn sm" data-pv="x">Tutup</button></div></div>` +
    (isImg ? `<div class="pvf" style="overflow:auto;text-align:center;background:#f1f4fa"><img src="${pvUrl}" alt="${nm}" style="max-width:100%"></div>` : `<iframe class="pvf" src="${pvUrl}" title="Pratinjau ${nm}"></iframe>`) + `</div>`;
  m.onclick = e => { if (e.target === m || e.target.closest('[data-pv=x]')) pvClose(); };
  document.body.appendChild(m);
}

/* ---------- Halaman 1: daftar permohonan ---------- */
function tksList(s) {
  /* Hanya permohonan yang Persetujuan Kepala Daerah-nya sudah terbit (atau yang sudah telanjur diisi) */
  const r = [...new Map(vis().filter(d => d[6] != 'Draft' && (psjOk(d[0]) || tksX(d[0]))).map(d => [d[0], d])).values()];
  s.innerHTML = HD('Permohonan Penaksiran', 'Lengkapi Surat Tanggung Jawab Mutlak dan tonase barang untuk setiap permohonan.') +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar Permohonan</h2><small class="mt"></small></div></div>` +
    (r.length ? `<div class="tw"><table><thead><tr><th>No</th><th>Nomor Surat</th><th>Jenis</th><th>Persetujuan Kepala Daerah</th><th>Status Permohonan</th><th>Status Penaksiran</th><th>Aksi</th></tr></thead><tbody>${r.map((d, i) => {
      const t = tksX(d[0]), p = tksStat(d[0]);
      const aksi = t && t.verif && t.verif.st == 'Ditolak' ? 'Perbaiki & Ajukan Ulang' : !t ? 'Isi Permohonan' : t.st == 'Diajukan' ? 'Lihat' : t.st == 'Draft' ? 'Edit' : 'Lanjutkan';
      return `<tr><td>${i + 1}</td><td><b>${esc(d[0])}</b><div class="mt" style="font-size:12px">${esc(d[1])}</div></td><td>${esc(d[4])}</td><td>${psjRef(d[0])}</td><td>${st(d[6])}</td><td>${PL(p[0], p[1])}</td><td><button class="btn sm" data-tkn="${esc(d[0])}">${aksi}</button></td></tr>`;
    }).join('')}</tbody></table></div>` : EM('Belum ada permohonan', 'Permohonan muncul di sini setelah Persetujuan Kepala Daerah terbit.')) + '</div>';
  s.onclick = e => { const b = e.target.closest('[data-tkn]'); if (b) { const t = tksX(b.dataset.tkn); tksCur = b.dataset.tkn; tksMode = t && t.src == 'excel' ? 'excel' : 'manual'; pgPerpen(); window.scrollTo(0, 0); } };
}

/* ---------- Halaman 2: detail (mengikuti Verifikasi Permohonan Admin) ---------- */
function tksDetail(s) {
  const no = tksCur, d = R.find(r => r[0] == no);
  if (!d || !own(d) || !(psjOk(no) || tksX(no))) { tksCur = null; return tksList(s); }
  const t = tksEnsure(no), ro = t.st == 'Diajukan', doc = t.doc, rows = tksRows(no), dis = ro ? ' disabled' : '', p = tksStat(no);
  const docRow = `<div class="dr${doc ? ' y' : ''}"><span class="dn">1</span><div class="dm"><b>Surat Tanggung Jawab Mutlak</b><small class="mt">${doc ? esc(doc.name) + ' · ' + tksSize(doc.size || 0) : 'Belum diunggah (PDF, JPG, atau PNG, maksimal 10 MB)'}</small></div><div class="da">` +
    (doc && doc.files && doc.files[0] ? '<button type="button" class="btn o sm" data-tk="pv">Lihat</button>' : '') +
    (ro ? '' : `<label class="btn o sm" style="cursor:pointer">${doc ? 'Ganti' : 'Upload'}<input type="file" id="tk_doc" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg" hidden></label>${doc ? '<button type="button" class="btn o sm" data-tk="deldoc">Hapus</button>' : ''}`) + `</div></div>`;
  const imp = ro ? '' : `<div class="tks-seg" role="group" aria-label="Cara pengisian"><button type="button" data-tm="manual" class="${tksMode == 'manual' ? 'on' : ''}">Isi Manual</button><button type="button" data-tm="excel" class="${tksMode == 'excel' ? 'on' : ''}">Import Excel</button></div>` +
    (tksMode == 'excel' ? `<div class="tks-imp"><div class="pt-bar" style="margin:0"><label class="btn sm" style="cursor:pointer">Pilih File Excel<input type="file" id="tk_xl" accept=".xlsx" hidden></label><button type="button" class="btn o sm" data-tk="tpl">Unduh Template Excel</button>${t && t.src == 'excel' ? '<button type="button" class="btn o sm" data-tk="reset">Kembalikan data permohonan</button>' : ''}</div><p class="mt" style="font-size:12px;margin:8px 0 0">Kolom: ${TKS_COLS.join(', ')} (Satuan Tonase: Kg atau Ton). Tabel di bawah akan diisi otomatis dari file${t && t.src == 'excel' && t.srcName ? '. Terakhir diimpor: <b>' + esc(t.srcName) + '</b>' : ''}.</p></div>` : '');
  const tbl = rows.length ? `<div class="tw"><table class="kvt"><thead><tr><th>KIB ID</th><th>Kode Barang</th><th>Nama Barang</th><th>Tahun</th><th>Kondisi</th><th>Kuantitas</th><th>Satuan</th><th>Tonase</th><th>Satuan Tonase</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td class="mono"><b>${esc(r.kib)}</b></td><td class="mono">${esc(r.kode)}</td><td><b>${esc(r.nama)}</b></td><td>${esc(r.tahun)}</td><td>${esc(r.kondisi)}</td><td>${esc(r.qty)}</td><td>${esc(r.sat)}</td>` +
    `<td><input class="tkn" type="number" min="0" step="any" inputmode="decimal" data-ti="${i}" value="${esc(r.tonase)}" placeholder="0" aria-label="Tonase ${esc(r.nama)}"${dis}></td>` +
    `<td><select class="dsel" data-ts="${i}" aria-label="Satuan tonase ${esc(r.nama)}"${dis}>${TKS_SAT.map(o => `<option${o == r.satt ? ' selected' : ''}>${o}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div><div class="kvs" id="tk_sum">${tksSumHtml(no)}</div>`
    : EM('Belum ada barang', ro ? 'Tidak ada data barang.' : 'Pilih "Import Excel" lalu unggah file untuk mengisi daftar barang.');
  s.innerHTML = HD('Permohonan Penaksiran', no + ' · ' + d[1], '<button class="btn o" data-a="bk">← Kembali</button>') +
    sec('Ringkasan Permohonan', ro ? 'Permohonan penaksiran sudah diajukan. Tampilan hanya untuk dilihat.' : '', st(d[6])) + `<dl><dt>Jenis</dt><dd>${esc(d[4])}</dd><dt>Tanggal Surat</dt><dd>${esc(d[5])}</dd><dt>Perangkat Daerah</dt><dd>${esc(d[1])}</dd><dt>Perihal</dt><dd>${esc(d[10])}</dd><dt>Persetujuan Kepala Daerah</dt><dd>${psjRef(no, true)}</dd><dt>Status Penaksiran</dt><dd>${PL(p[0], p[1])}</dd></dl>${t.verif.st == 'Ditolak' ? `<div class="al2 rjb" style="margin-top:14px"><b>Permohonan penaksiran ditolak Admin.</b> ${esc(t.verif.cat || 'Perbaiki dokumen atau data barang, lalu ajukan ulang.')}</div>` : ''}</div>` +
    sec('Dokumen', ro ? '' : 'Unggah Surat Tanggung Jawab Mutlak.', `<span class="stt ${doc ? 's-g' : 's-n'}">${doc ? '1/1 diunggah' : '0/1 diunggah'}</span>`) + `<div class="drs">${docRow}</div></div>` +
    sec('Tonase Barang', ro ? '' : 'Isi tonase dan satuan tiap barang, atau import dari Excel.', rows.length ? `<span class="stt s-b">${rows.length} Barang</span>` : '') + imp + tbl + '</div>' +
    (ro ? '' : `<div style="text-align:right;margin-bottom:20px;display:flex;gap:10px;justify-content:flex-end"><button class="btn o" data-a="draft">Simpan Draft</button><button class="btn" data-a="ajukan">${t.verif.st == 'Ditolak' ? 'Ajukan Ulang' : 'Ajukan Permohonan Penaksiran'}</button></div>`);

  s.onchange = e => {
    const el = e.target;
    if (ro) return;
    if (el.id == 'tk_doc') {
      const f = el.files[0]; el.value = ''; if (!f) return;
      if (!/^(application\/pdf|image\/(png|jpeg))$/.test(f.type)) return toast('Format harus PDF, JPG, atau PNG.');
      if (f.size > TKS_DOC_MAX) return toast('Ukuran berkas maksimal 10 MB.');
      const T = tksEnsure(no); T.doc = { name: f.name, ty: f.type, size: f.size, files: [f] }; T.saved = false;
      tksSyncActions(s, no);
      Store.persist(); toast('Surat Tanggung Jawab Mutlak diunggah.'); return tksDetail(s);
    }
    if (el.id == 'tk_xl') {
      const f = el.files[0]; el.value = ''; if (!f) return;
      return f.arrayBuffer().then(ptXlsxAll).then(tksParse).then(res => {
        const T = tksEnsure(no); T.rows = res.rows; T.src = 'excel'; T.srcName = f.name; T.saved = false; Store.persist();
        toast(res.rows.length + ' barang diimpor dari Excel.' + (res.warn ? ' ' + res.warn + ' isian tidak dikenali dan dikosongkan/diganti Kg.' : '') + (res.cut ? ' Dibatasi ' + TKS_ROWS_MAX + ' baris.' : '')); tksDetail(s);
      }).catch(err => { console.error(err); toast(err && err.message ? err.message : 'File Excel tidak dapat dibaca.'); });
    }
    const si = el.dataset && el.dataset.ts; if (si != null) { const T = tksEnsure(no); T.rows[+si].satt = el.value; T.saved = false; const sm = $('#tk_sum'); if (sm) sm.innerHTML = tksSumHtml(no); tksSyncActions(s, no); }
  };
  s.oninput = e => {
    const el = e.target, i = el.dataset && el.dataset.ti; if (ro || i == null) return;
    const T = tksEnsure(no); T.rows[+i].tonase = el.value; T.saved = false;
    const sm = $('#tk_sum'); if (sm) sm.innerHTML = tksSumHtml(no);
    tksSyncActions(s, no);
  };
  s.onclick = e => {
    const tm = e.target.closest('[data-tm]'); if (tm && !ro) { tksMode = tm.dataset.tm; return tksDetail(s); }
    const tk = e.target.closest('[data-tk]');
    if (tk) {
      const a = tk.dataset.tk;
      if (a == 'pv') return tksPreview(no);
      if (ro) return;
      if (a == 'deldoc') return cfm('Hapus dokumen?', 'Surat Tanggung Jawab Mutlak yang sudah diunggah akan dihapus.', () => { const T = tksX(no); if (T && T.st != 'Diajukan') { T.doc = null; T.saved = false; Store.persist(); toast('Dokumen dihapus.'); tksDetail(s); } }, 'Hapus');
      if (a == 'tpl') return tksTemplate(no).then(b => { const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'Template Tonase Barang - ' + no.replace(/[\\/:*?"<>|]/g, '-') + '.xlsx'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000); }).catch(err => { console.error(err); toast('Gagal membuat template Excel.'); });
      if (a == 'reset') return cfm('Kembalikan data permohonan?', 'Isi tabel dari Excel akan diganti dengan barang pada permohonan, dan tonase yang sudah diisi dikosongkan.', () => { const T = tksX(no); if (T && T.st != 'Diajukan') { T.rows = tksFromKib(no); T.src = 'permohonan'; T.srcName = ''; T.saved = false; Store.persist(); toast('Data permohonan dikembalikan.'); tksDetail(s); } }, 'Kembalikan');
    }
    const a = (e.target.closest('[data-a]') || { dataset: {} }).dataset.a;
    if (a == 'bk') { tksCur = null; return pgPerpen(); }
    if (ro || (a != 'draft' && a != 'ajukan')) return;
    const T = tksEnsure(no);
    if (a == 'draft') { T.st = 'Draft'; T.saved = true; T.ts = nowStr(); Store.persist(); toast('Draft permohonan penaksiran disimpan.'); tksCur = null; return pgPerpen(); }
    if (!T.saved) return toast('Simpan draft terlebih dahulu sebelum mengajukan permohonan penaksiran.');
    const rr = T.rows, kosong = rr.filter(r => !(tksNum(r.tonase) > 0));
    if (!T.doc) return toast('Unggah Surat Tanggung Jawab Mutlak terlebih dahulu.');
    if (!rr.length) return toast('Belum ada barang. Import Excel untuk mengisi daftar barang.');
    if (kosong.length) return toast('Isi tonase (lebih dari 0) untuk: ' + kosong.slice(0, 3).map(r => r.nama).join(', ') + (kosong.length > 3 ? ' dan ' + (kosong.length - 3) + ' barang lain' : '') + '.');
    cfm('Ajukan permohonan penaksiran?', 'Data akan dikunci dan tidak dapat diubah lagi.', () => {
      const U = tksX(no); if (!U || U.st == 'Diajukan' || !U.saved) return; U.st = 'Diajukan'; U.ts = nowStr();
      U.verif = { st: 'Menunggu Verifikasi', doc: '', docNote: '', check: [], notes: [], cat: '', ts: nowStr() };
      if (typeof hs == 'function') hs(no, 'Permohonan Penaksiran diajukan pengguna barang', '');
      Store.persist(); toast('Permohonan penaksiran diajukan.'); tksCur = null; pgPerpen();
    }, 'Ajukan');
  };
  tksSyncActions(s, no);
}
function pgPerpen() { const s = $('#pmp'); return tksCur ? tksDetail(s) : tksList(s); }

/* ---------- Halaman Admin: verifikasi penaksiran ---------- */
const tksAdminVerif = no => {
  const T = tksX(no);
  if (!T) return null;
  if (!T.verif) T.verif = { st: T.st == 'Diajukan' ? 'Menunggu Verifikasi' : 'Belum Diajukan', doc: '', docNote: '', check: [], notes: [] };
  T.verif.check = T.verif.check || [];
  T.verif.notes = T.verif.notes || [];
  return T.verif;
};
function tksAdminList(s) {
  const all = [...new Map(R.map((d, i) => ({ d, i, T: tksX(d[0]), V: tksAdminVerif(d[0]) })).map(x => [x.d[0], x])).values()];
  const rows = all.filter(x => x.T && (x.T.st == 'Diajukan' || x.V && x.V.st == 'Ditolak'));
  const pending = rows.filter(x => x.T.st == 'Diajukan' && (!x.V || x.V.st == 'Menunggu Verifikasi' || x.V.st == 'Belum Diajukan'));
  const done = rows.filter(x => x.V && ['Disetujui', 'Ditolak'].includes(x.V.st));
  const table = (list, processed) => list.length ? `<div class="tw"><table><thead><tr><th>No</th><th>Nomor Surat</th><th>Tanggal</th><th>Perangkat Daerah</th><th>Barang</th><th>Status Verifikasi</th><th>Aksi</th></tr></thead><tbody>${list.map((x, i) => `<tr><td>${i + 1}</td><td><b>${esc(x.d[0])}</b></td><td>${esc(x.d[5])}</td><td>${esc(x.d[1])}</td><td>${Array.isArray(x.T.rows) ? x.T.rows.length : 0}</td><td>${processed ? PL(x.V.st == 'Disetujui' ? 's-g' : 's-r', x.V.st) : PL('s-o', 'Menunggu Verifikasi')}</td><td><button class="btn ${processed ? 'o ' : ''}sm" data-tkad="${esc(x.d[0])}">${processed ? 'Lihat' : 'Periksa'}</button></td></tr>`).join('')}</tbody></table></div>` : EM(processed ? 'Belum ada hasil verifikasi' : 'Tidak ada permohonan menunggu', processed ? 'Hasil verifikasi penaksiran akan muncul di sini.' : 'Permohonan penaksiran yang sudah diajukan pengguna barang akan muncul di sini.');
  s.innerHTML = HD('Verifikasi Permohonan Penaksiran', '') +
    sec('Menunggu Verifikasi', `${pending.length} permohonan`) + table(pending, false) + '</div>' +
    sec('Riwayat Verifikasi', `${done.length} permohonan`) + table(done, true) + '</div>';
  s.onclick = e => {
    const b = e.target.closest('[data-tkad]');
    if (b) { tksAdminCur = b.dataset.tkad; tksAdminFilter = { kondisi: '' }; return pgTksAdmin(); }
  };
}
function tksAdminDetail(s) {
  const no = tksAdminCur, d = R.find(x => x[0] == no), T = tksX(no), V = tksAdminVerif(no);
  if (!d || !T || !isAdmin()) { tksAdminCur = null; return tksAdminList(s); }
  const ro = V.st != 'Menunggu Verifikasi' && V.st != 'Belum Diajukan', doc = T.doc, blob = doc && doc.files && doc.files[0];
  const rows = Array.isArray(T.rows) ? T.rows : [], reason = String(V.cat || ''), select = (value, label, idx, disabled) =>
    `<select class="dsel ${value}" data-tka="${label}"${idx === '' ? '' : ` data-ti="${idx}"`}${disabled ? ' disabled' : ''}><option value="">Pilih</option><option value="ok"${value == 'ok' ? ' selected' : ''}>Sesuai</option><option value="no"${value == 'no' ? ' selected' : ''}>Tidak Sesuai</option></select>`;
  const docHtml = `<div class="dr${doc ? ' y' : ''}"><span class="dn">1</span><div class="dm"><b>Surat Tanggung Jawab Mutlak</b><small class="mt">${doc ? `${esc(doc.name)} · ${tksSize(doc.size || 0)}` : 'Belum diunggah'}</small></div><div class="da">${blob ? '<button type="button" class="btn o sm" data-tka-pv>Lihat</button>' : ''}${doc ? select(V.doc, 'doc', '', ro) : PL('s-r', 'Belum diunggah')}</div>${V.doc == 'no' && !ro ? `<div class="dnote"><label>Keterangan penolakan <em>(wajib diisi)</em><textarea data-tka-note="doc" rows="2" placeholder="Jelaskan perbaikan dokumen yang diperlukan...">${esc(V.docNote || '')}</textarea></label></div>` : V.doc == 'no' && V.docNote ? `<div class="dnote ro"><b>Keterangan:</b> ${esc(V.docNote)}</div>` : ''}</div>`;
  /* Kondisi = FILTER tampilan (data kondisi dari Pengguna Barang tidak diubah). Kesesuaian = ISI CEPAT (menandai semua baris yang tampil). */
  const kn = v => { const t = String(v == null ? '' : v).trim(); return /rusak\s*berat|^rb$/i.test(t) ? 'Rusak Berat' : /rusak\s*sedang|^rs$/i.test(t) ? 'Rusak Sedang' : /rusak\s*ringan|^rr$/i.test(t) ? 'Rusak Ringan' : /^(baik|b)$/i.test(t) ? 'Baik' : (t || 'Tidak diketahui'); };
  const kinds = [...new Set(['Rusak Berat', 'Rusak Sedang', 'Baik', ...rows.map(r => kn(r.kondisi))])];
  const cnt = k => rows.filter(r => kn(r.kondisi) == k).length;
  const fk = kinds.includes(tksAdminFilter.kondisi) ? tksAdminFilter.kondisi : '';
  const filtered = rows.map((r, i) => ({ r, i })).filter(({ r }) => !fk || kn(r.kondisi) == fk);
  const allV = v => !!filtered.length && filtered.every(({ i }) => V.check[i] == v);
  const qf = (k, title, sub) => `<button type="button" class="qc${fk == k ? ' on' : ''}" data-tkaf="${esc(k)}" aria-pressed="${fk == k}"><b>${esc(title)}</b><small>${sub}</small></button>`;
  const qb = (v, title, sub) => `<button type="button" class="qc${allV(v) ? ' on' : ''}" data-tkab="${v}" aria-pressed="${allV(v)}"${filtered.length ? '' : ' disabled'}><b>${title}</b><small>${sub}</small></button>`;
  const diperiksa = rows.filter((r, i) => V.check[i]).length;
  const table = rows.length ? `<div class="qk"><div class="qg"><span>Filter kondisi barang</span><div>${qf('', 'Semua', rows.length + ' barang')}${kinds.map(k => qf(k, k, cnt(k) + ' barang')).join('')}</div></div>${ro ? '' : `<div class="qg"><span>Isi cepat kesesuaian${fk ? ' (barang yang tampil)' : ''}</span><div>${qb('ok', 'Semua Sesuai', 'Sesuai data KIB')}${qb('no', 'Semua Tidak Sesuai', 'Tidak sesuai data KIB')}</div></div>`}${fk ? '<button type="button" class="btn o sm" data-tkaf-reset>Hapus Filter</button>' : ''}</div><div class="tw"><table class="kvt"><thead><tr><th>No</th><th>KIB ID</th><th>Kode</th><th>Nama Barang</th><th>Tahun</th><th>Qty</th><th>Tonase</th><th>RB / B</th><th>Kesesuaian</th><th>Keterangan</th></tr></thead><tbody>${filtered.length ? '' : '<tr><td colspan="10" class="mt" style="text-align:center;padding:26px">Tidak ada barang dengan kondisi ini. Klik “Semua” untuk menampilkan seluruh barang.</td></tr>'}${filtered.map(({ r, i }, k) => `<tr><td>${k + 1}</td><td class="mono">${esc(r.kib)}</td><td class="mono">${esc(r.kode)}</td><td><b>${esc(r.nama)}</b></td><td>${esc(r.tahun)}</td><td>${esc(r.qty)} ${esc(r.sat)}</td><td>${esc(r.tonase)} ${esc(r.satt)}</td><td>${esc(r.kondisi)}</td><td>${select(V.check[i], 'row', i, ro)}</td><td>${V.check[i] == 'no' && !ro ? `<textarea data-tka-note="row" data-ti="${i}" rows="2" placeholder="Keterangan (wajib)">${esc(V.notes[i] || '')}</textarea>` : V.check[i] == 'no' ? esc(V.notes[i] || '-') : '-'}</td></tr>`).join('')}</tbody></table></div>` : EM('Belum ada barang', 'Permohonan tidak memiliki rincian barang tonase.');
  s.innerHTML = HD('Verifikasi Permohonan Penaksiran', `${esc(no)} · ${esc(d[1])}`, '<button class="btn o" data-tka-back>← Kembali</button>') +
    sec('Ringkasan Permohonan', ro ? 'Hasil verifikasi hanya dapat dilihat.' : 'Periksa dokumen dan kesesuaian data tonase.', PL(ro ? V.st == 'Disetujui' ? 's-g' : 's-r' : 's-o', ro ? V.st : 'Menunggu Verifikasi')) +
    `<dl><dt>Jenis</dt><dd>${esc(d[4])}</dd><dt>Tanggal Surat</dt><dd>${esc(d[5])}</dd><dt>Perangkat Daerah</dt><dd>${esc(d[1])}</dd><dt>Perihal</dt><dd>${esc(d[10])}</dd><dt>Status Permohonan Penaksiran</dt><dd>${PL(tksStat(no)[0], tksStat(no)[1])}</dd></dl>${ro && reason ? `<div class="al2 rjb" style="margin-top:14px"><b>Catatan Admin:</b> ${esc(reason)}</div>` : ''}</div>` +
    sec('Verifikasi Dokumen', 'Surat Tanggung Jawab Mutlak', PL(V.doc == 'ok' ? 's-g' : V.doc == 'no' ? 's-r' : 's-n', V.doc == 'ok' ? 'Sesuai' : V.doc == 'no' ? 'Tidak Sesuai' : 'Belum diperiksa')) + `<div class="drs">${docHtml}</div></div>` +
    sec('Daftar Barang / KIB yang Disurvei', 'Filter kondisi hanya mengatur tampilan. Gunakan Isi cepat untuk menandai banyak barang sekaligus, atau pilih per barang.', `<span class="stt ${rows.length && diperiksa == rows.length ? 's-g' : 's-b'}">Diperiksa ${diperiksa}/${rows.length}</span> <span class="stt s-b">${filtered.length}/${rows.length} ditampilkan</span>`) + table + '</div>' +
    (ro ? '' : `<div class="ff"><label class="l2 full">Catatan keputusan Admin<textarea id="tka_cat" rows="3" placeholder="Alasan penolakan atau catatan untuk pemohon...">${esc(V.cat || '')}</textarea></label></div><div style="text-align:right;margin-bottom:20px;display:flex;gap:10px;justify-content:flex-end"><button class="btn dng" data-tka-act="reject">Tolak</button><button class="btn" data-tka-act="approve">Setujui &amp; Lanjut ke Daftar Objek</button></div>`);
  s.onchange = e => {
    const el = e.target.closest('[data-tka]');
    if (!el || ro) return;
    if (el.dataset.tka == 'doc') V.doc = el.value;
    else if (el.dataset.tka == 'row') V.check[+el.dataset.ti] = el.value;
    Store.persist(); pgTksAdmin();
  };
  s.oninput = e => {
    const el = e.target.closest('[data-tka-note]');
    if (!el || ro) return;
    if (el.dataset.tkaNote == 'doc') V.docNote = el.value;
    else V.notes[+el.dataset.ti] = el.value;
    V.cat = ($('#tka_cat') || {}).value || V.cat || '';
  };
  s.onclick = e => {
    const b = e.target.closest('[data-tka-pv]');
    if (b) return tksPreview(no);
    if (e.target.closest('[data-tka-back]')) { tksAdminCur = null; return pgTksAdmin(); }
    const filter = e.target.closest('[data-tkaf]');
    if (filter && !filter.disabled) {
      const value = filter.dataset.tkaf;
      tksAdminFilter.kondisi = value === '' || tksAdminFilter.kondisi == value ? '' : value;
      return pgTksAdmin();
    }
    if (e.target.closest('[data-tkaf-reset]')) { tksAdminFilter = { kondisi: '' }; return pgTksAdmin(); }
    const bulk = e.target.closest('[data-tkab]');
    if (bulk && !bulk.disabled && !ro) {
      if (!can('verifikasi')) return deny();
      const v = bulk.dataset.tkab, idx = filtered.map(x => x.i), same = idx.every(i => V.check[i] == v);
      idx.forEach(i => { V.check[i] = same ? '' : v; if (v == 'ok' || same) V.notes[i] = ''; });
      Store.persist(); return pgTksAdmin();
    }
    const action = e.target.closest('[data-tka-act]');
    if (!action || ro) return;
    if (!can('verifikasi')) return deny();
    V.cat = ($('#tka_cat') || {}).value.trim();
    const missingRows = rows.map((r, i) => i).filter(i => !V.check[i]);
    const rejectedRows = rows.map((r, i) => i).filter(i => V.check[i] == 'no');
    const noRowNote = rejectedRows.find(i => !String(V.notes[i] || '').trim());
    if (action.dataset.tkaAct == 'approve') {
      if (!doc) return toast('Surat Tanggung Jawab Mutlak belum diunggah.');
      if (V.doc != 'ok') return toast('Pilih Sesuai untuk dokumen Surat Tanggung Jawab Mutlak sebelum menyetujui.');
      if (!rows.length) return toast('Tidak ada data barang tonase untuk diverifikasi.');
      if (missingRows.length) return toast('Periksa kesesuaian semua barang terlebih dahulu: ' + missingRows.length + ' dari ' + rows.length + ' barang belum diperiksa.' + (tksAdminFilter.kondisi ? ' Hapus filter untuk melihat semua barang.' : ' Gunakan Isi cepat "Semua Sesuai" bila semuanya sesuai.'));
      if (rejectedRows.length) return toast('Ada barang yang Tidak Sesuai. Perbaiki hasil pemeriksaan atau tolak permohonan.');
      return cfm('Setujui permohonan penaksiran?', 'Data yang disetujui akan diteruskan ke Daftar Objek Penaksiran.', () => {
        const U = tksX(no), X = tksAdminVerif(no);
        if (!U || U.st != 'Diajukan' || X.st == 'Disetujui') return;
        X.st = 'Disetujui'; X.ts = nowStr(); X.cat = V.cat; X.obId = X.obId || Date.now();
        hs(no, 'Permohonan penaksiran disetujui Admin, lanjut ke Daftar Objek Penaksiran', CUR.name);
        Store.persist(); toast('Permohonan disetujui dan diteruskan ke Daftar Objek Penaksiran.');
        tksAdminCur = null; show('ob');
      }, 'Setujui');
    }
    if (noRowNote != null) return toast('Isi keterangan untuk barang yang Tidak Sesuai.');
    if (V.doc == 'no' && !String(V.docNote || '').trim()) return toast('Isi keterangan penolakan Surat Tanggung Jawab Mutlak.');
    if (!String(V.cat || '').trim() && V.doc != 'no' && !rejectedRows.length) return toast('Isi catatan penolakan permohonan.');
    return cfm('Tolak permohonan penaksiran?', 'Permohonan dikembalikan kepada Pengguna Barang untuk diperbaiki dan diajukan ulang.', () => {
      const U = tksX(no), X = tksAdminVerif(no);
      if (!U || U.st != 'Diajukan') return;
      X.st = 'Ditolak'; X.ts = nowStr(); U.st = 'Draft'; U.saved = true;
      hs(no, 'Permohonan penaksiran ditolak Admin', (CUR.name || '') + (X.cat ? ' · ' + X.cat : ''));
      Store.persist(); toast('Permohonan ditolak dan dikembalikan untuk diperbaiki.');
      tksAdminCur = null; pgTksAdmin();
    }, 'Tolak');
  };
}
function pgTksAdmin() {
  if (!can('verifikasi')) return deny();
  const s = $('#tksadm');
  return tksAdminCur ? tksAdminDetail(s) : tksAdminList(s);
}

/* Aksi "Lanjut ke Penaksiran" di daftar Permohonan milik Pengguna Barang */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pnk]'); if (!b) return;
  const d = R[+b.dataset.pnk]; if (!d || !own(d) || !psjOk(d[0])) return deny();
  show('pmp'); tksCur = d[0]; const t = tksX(d[0]); tksMode = t && t.src == 'excel' ? 'excel' : 'manual'; pgPerpen(); window.scrollTo(0, 0);
});


/* ---------- Tahap yang sedang dijalani (ditampilkan ke Pengguna Barang) ----------
   Dihitung otomatis dari data yang sudah ada: tidak mengubah status utama maupun alur Admin. */
function tahapNow(d) {
  if (!d) return '';
  const no = d[0], st = d[6], S = SVS[no] || {}, P = PEN[no];
  if (st == 'Menunggu Verifikasi') return 'Verifikasi dokumen oleh Admin';
  if (st == 'Dalam Proses') {
    if (S.st != 'Selesai') return S.st == 'Draft' ? 'Survei Lapangan · sedang berjalan' : 'Menunggu Survei Lapangan';
    if (S.psj) return 'Persetujuan Kepala Daerah · sedang disusun';
    if (!P || P.st != 'Final') return P ? 'Penelitian Tim Penghapusan · berita acara sedang disusun' : 'Penelitian Tim Penghapusan';
    if (!S.ba || S.ba.st != 'Selesai') return 'Penelitian Tim Penghapusan · menunggu BA bertanda tangan';
    return 'Menunggu Persetujuan Kepala Daerah';
  }
  if (st == 'Disetujui') {
    const T = tksX(no), V = T && T.verif;
    if (T) {
      if (V && V.st == 'Disetujui') {
        const o = OB.find(x => x.tksNo == no);
        if (o && KK[o.id] && KK[o.id].done) return 'Penaksiran · laporan penaksiran tersedia';
        if (o && o.st == 'Posted') return 'Penaksiran · Kertas Kerja Penaksiran';
        return 'Penaksiran · diproses Admin (Daftar Objek)';
      }
      if (V && V.st == 'Ditolak' && T.st != 'Diajukan') return 'Penaksiran ditolak Admin · perlu diperbaiki';
      if (T.st == 'Diajukan') return 'Penaksiran · menunggu verifikasi Admin';
      return 'Penaksiran · data sedang diisi (Draft)';
    }
    return psjOk(no) ? 'Persetujuan Kepala Daerah terbit · lanjut ke Permohonan Penaksiran' : '';
  }
  return '';
}
/* Tahap singkat untuk ditulis DI DALAM badge status, misalnya "Dalam Proses · Survei Lapangan". */
function tahapShort(d) {
  if (!d) return '';
  const no = d[0], st = d[6], S = SVS[no] || {}, P = PEN[no];
  if (st == 'Dalam Proses') {
    if (S.st != 'Selesai') return S.st == 'Draft' ? 'Survei Lapangan' : 'Menunggu Survei';
    if (S.psj) return 'Persetujuan Kepala Daerah';
    if (!P || P.st != 'Final') return 'Penelitian Tim';
    if (!S.ba || S.ba.st != 'Selesai') return 'Menunggu BA TTD';
    return 'Persetujuan Kepala Daerah';
  }
  if (st == 'Disetujui') {
    const T = tksX(no), V = T && T.verif;
    if (T) {
      if (V && V.st == 'Disetujui') {
        const o = OB.find(x => x.tksNo == no);
        if (o && KK[o.id] && KK[o.id].done) return 'Laporan Penaksiran';
        if (o && o.st == 'Posted') return 'Kertas Kerja';
        return 'Daftar Objek';
      }
      if (V && V.st == 'Ditolak' && T.st != 'Diajukan') return 'Penaksiran Ditolak';
      if (T.st == 'Diajukan') return 'Verifikasi Penaksiran';
      return 'Isi Penaksiran';
    }
    return psjOk(no) ? 'Persetujuan Terbit' : '';
  }
  return '';
}
/* Badge status; bila ada tahap, ditulis di dalam badge yang sama. */
const stp = d => { const t = tahapShort(d); return `<span class="stt ${d[6]}">${d[6]}${t ? ' · ' + esc(t) : ''}</span>`; };
