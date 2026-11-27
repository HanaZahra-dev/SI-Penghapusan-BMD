/* Modul 2 - Laporan Penilaian KPKNL: Daftar Barang / Ringkasan Penilaian (input manual)
   Data: RX[noPermohonan].kpknl.items = [{kib,kode,n,tahun,kondisi,bahan,q,sn,mt,nl}], RX[no].kpknl.jl ('Lelang'|'Langsung')
   - Pratinjau & Unduh PDF ringkasan (No, Objek, Kuantiti, Metode, Nilai, Total) seperti Ringkasan Penaksiran.
   - kpSaved() menyediakan permohonan KPKNL yang sudah disubmit ke daftar SK Nilai Limit (lihat sk.js: skList / skObjs). */
const KP_METODE = 'Penilaian KPKNL';
const kpKg = it => (+it.q || 0) * (it.sn == 'Ton' ? 1000 : 1);
const kpTot = items => (items || []).reduce((a, x) => a + Math.round(+x.nl || 0), 0);
const kpRp = n => 'Rp ' + Math.round(+n || 0).toLocaleString('id-ID');
const kpBahan = v => String(v == null ? '' : v).toLocaleUpperCase('id-ID');
const kpBlank = () => ({ kib: '', kode: '', n: '', tahun: '', kondisi: '', bahan: '', q: '', sn: 'Kg', mt: KP_METODE, nl: '' });

/* barang awal: diambil dari daftar KIB pada permohonan; kuantiti mengikuti input/Excel di Permohonan Penaksiran */
function kpEnsure(no, x) {
  const sourceRows = (typeof tksRows == 'function') ? tksRows(no) : [];
  const fromSource = k => sourceRows.find(r => r && r.kib == k[0]) || null;
  if (!Array.isArray(x.items)) {
    const f = (RX[no] || {}).f || {};
    x.items = (f.kib || []).map(i => K[i]).filter(Boolean).map(k => {
      const r = fromSource(k);
      const qty = r && r.qty != null && r.qty !== '' && r.qty !== '-' ? r.qty : k[5];
      const satuan = r && r.sat && r.sat !== '-' ? r.sat : k[6];
      return Object.assign(kpBlank(), {
        kib: r && r.kib || k[0],
        kode: r && r.kode || k[1],
        n: r && r.nama || k[2],
        tahun: r && r.tahun || k[3],
        kondisi: r && r.kondisi || k[4],
        bahan: kpBahan(r && r.bahan || ''),
        q: qty == null || qty === '' ? '' : qty,
        sn: satuan == null || satuan === '' ? 'Kg' : satuan
      });
    });
  } else {
    const f = (RX[no] || {}).f || {};
    (f.kib || []).map(i => K[i]).filter(Boolean).forEach((k, i) => {
      if (!x.items[i]) return;
      const r = fromSource(k);
      const qty = r && r.qty != null && r.qty !== '' && r.qty !== '-' ? r.qty : k[5];
      x.items[i].kib = r && r.kib || k[0];
      x.items[i].kode = r && r.kode || k[1];
      x.items[i].n = r && r.nama || k[2];
      x.items[i].tahun = r && r.tahun || k[3];
      x.items[i].kondisi = r && r.kondisi || k[4];
      x.items[i].bahan = kpBahan(r && r.bahan || x.items[i].bahan);
      if (x.items[i].q == null || x.items[i].q === '' || x.items[i].q === '-') x.items[i].q = qty;
    });
  }
  return x.items;
}

/* ---------- bagian formulir pada halaman detail KPKNL ---------- */
function kpSec(no, x) {
  const it = kpEnsure(no, x), c = 'border:1px solid var(--ln);border-radius:6px;padding:6px;width:100%;min-width:';
  const inp = (i, k, v, w, t) => `<input class="kpi" data-i="${i}" data-k="${k}" type="${t || 'text'}" value="${esc(v)}" style="${c}${w}px">`;
  const inpBahan = (i, v) => `<input class="kpi" data-i="${i}" data-k="bahan" type="text" maxlength="80" autocapitalize="characters" value="${esc(kpBahan(v))}" style="${c}90px;text-transform:uppercase">`;
  const locked = v => `<span class="kplocked">${esc(v == null || v === '' ? '-' : v)}</span>`;
  const satuanOptions = sn => [...new Set(['Kg', 'Ton', 'Unit', 'Batang', 'Meter', 'Liter', 'Satuan', String(sn || '').trim()].filter(Boolean))]
    .map(v => `<option${v == sn ? ' selected' : ''}>${esc(v)}</option>`).join('');
  const rows = it.map((r, i) => `<tr data-i="${i}"><td>${i + 1}</td><td>${locked(r.n)}</td><td>${locked(r.kode)}</td><td>${locked(r.kib)}</td><td>${locked(r.tahun)}</td><td>${locked(r.kondisi)}</td><td>${inpBahan(i, r.bahan)}</td>` +
    `<td>${locked(r.q)}</td><td><select class="kpi" data-i="${i}" data-k="sn" style="${c}70px">${satuanOptions(r.sn)}</select></td><td>${locked(r.mt)}</td><td>${inp(i, 'nl', r.nl, 110, 'number')}</td><td><button type="button" class="db" data-kp="del" data-i="${i}">Hapus</button></td></tr>`).join('');
  return `<div class="cd pt-sec" style="margin-top:14px"><div class="ch"><div><h2>Daftar Barang / Ringkasan Penilaian</h2><small class="mt">Isi manual sesuai hasil penilaian KPKNL. Barang awal diambil dari KIB pada permohonan. Data ini menjadi lampiran SK Nilai Limit.</small></div></div>` +
    `<div class="ff"><label class="l2">Permohonan Penjualan<select id="kp_jl"><option${x.jl != 'Langsung' ? ' selected' : ''}>Lelang</option><option${x.jl == 'Langsung' ? ' selected' : ''}>Langsung</option></select></label></div>` +
    `<div class="tw"><table><thead><tr><th>No</th><th>Objek (Nama Barang)</th><th>Kode Barang</th><th>KIB ID</th><th>Tahun</th><th>Kondisi</th><th>Bahan</th><th>Kuantiti</th><th>Satuan</th><th>Metode</th><th>Nilai (Rp)</th><th></th></tr></thead><tbody id="kp_tb">${rows || '<tr><td colspan="12" class="mt" style="text-align:center;padding:20px">Belum ada barang. Klik "Tambah Barang".</td></tr>'}</tbody>` +
    `<tfoot><tr><td colspan="10" style="text-align:right"><b>Total</b></td><td colspan="2"><b id="kp_tot">${kpRp(kpTot(it))}</b></td></tr></tfoot></table></div>` +
    `<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn o" data-kp="add">＋ Tambah Barang</button><button type="button" class="btn o" data-kp="prev">Pratinjau / Unduh PDF</button></div></div>`;
}
/* baca isian tabel ke x.items */
function kpCollect(x) {
  const rows = Array.from(document.querySelectorAll('#kp_tb tr[data-i]'));
  if (rows.length || document.getElementById('kp_tb')) {
    x.items = rows.map(tr => {
      const i = +tr.dataset.i;
      const o = Object.assign(kpBlank(), x.items[i] || {});
      tr.querySelectorAll('.kpi').forEach(e => { o[e.dataset.k] = e.value.trim(); });
      o.bahan = kpBahan(o.bahan);
      return o;
    })
      .filter(o => o.n || o.q || o.nl);   /* baris yang sama sekali kosong dibuang */
  }
  const j = document.getElementById('kp_jl'); if (j) x.jl = j.value;
  /* simpan sementara isian surat agar tidak hilang saat tabel digambar ulang */
  const sn = document.getElementById('kpknl_no'), st = document.getElementById('kpknl_tgl');
  if (sn) x.nomor = sn.value.trim(); if (st) x.tgl = st.value;
}
function kpInput(e) {
  if (e.target.classList && e.target.classList.contains('kpi') && e.target.dataset.k == 'bahan') {
    e.target.value = kpBahan(e.target.value);
  }
  if (!e.target.classList.contains('kpi') || e.target.dataset.k != 'nl') return;
  const t = document.getElementById('kp_tot'); if (!t) return;
  t.textContent = kpRp(Array.from(document.querySelectorAll('#kp_tb input[data-k="nl"]')).reduce((a, i) => a + Math.round(+i.value || 0), 0));
}
/* klik tombol pada bagian ini; true bila ditangani */
function kpClick(e, no, x) {
  const b = e.target.closest('[data-kp]'); if (!b) return false;
  kpCollect(x);
  const a = b.dataset.kp;
  if (a == 'add') { x.items.push(kpBlank()); Store.persist(); pgKpknl(); }
  else if (a == 'del') { x.items.splice(+b.dataset.i, 1); Store.persist(); pgKpknl(); }
  else if (a == 'prev') { if (!x.items.length) toast('Tambahkan minimal satu barang terlebih dahulu.'); else { Store.persist(); kpPreview(no); } }
  return true;
}

/* ---------- PDF ringkasan (dipakai juga oleh Laporan Penaksiran di Kertas Kerja) ----------
   rows: [{n: objek, q: 'kuantiti satuan', mt: metode, nl: nilai}] ; lines: [[teks, tebal?]] di bawah judul */
function ringkasPdf(title, lines, rows) {
  const clean = v => String(v == null || v === '' ? '-' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E\u00B7]/g, ' ').replace(/\s+/g, ' ').trim();
  const PW = 595, PH = 842, M = 50, TOP = 56, BOT = PH - 56, CW = PW - 2 * M;
  const cols = [28, 200, 72, 102]; cols.push(CW - cols.reduce((a, b) => a + b, 0));
  const cx = [M]; cols.forEach(w => cx.push(cx[cx.length - 1] + w));
  
  const cv = document.createElement('canvas').getContext('2d');
  const wd = (s, sz, b) => { cv.font = (b ? 'bold ' : '') + '100px "Times New Roman","Liberation Serif",Times,serif'; return cv.measureText(clean(s)).width * sz / 100; };
  const f2 = n => (Math.round(n * 100) / 100).toString();
  const pe = s => '(' + clean(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
  const pages = []; let ops = [], y = TOP;
  const txt = (xx, top, s, sz, b) => ops.push(`BT 0 g /F${b ? 2 : 1} ${sz} Tf ${f2(xx)} ${f2(PH - top - sz * .8)} Td ${pe(s)} Tj ET`);
  const rect = (xx, top, w, h, fill) => ops.push(`${fill != null ? fill + ' g ' : ''}0 G .5 w ${f2(xx)} ${f2(PH - top - h)} ${f2(w)} ${f2(h)} re ${fill != null ? 'B' : 'S'} 0 g`);
  const wrap = (s, w, sz, b) => {
    const out = []; let cur = '';
    for (let word of clean(s).split(' ')) {
      while (wd(word, sz, b) > w) { let k = word.length; while (k > 1 && wd(word.slice(0, k), sz, b) > w) k--; if (cur) { out.push(cur); cur = ''; } out.push(word.slice(0, k)); word = word.slice(k); }
      const t = cur ? cur + ' ' + word : word;
      if (wd(t, sz, b) > w && cur) { out.push(cur); cur = word; } else cur = t;
    }
    if (cur) out.push(cur); return out;
  };
  const newPage = () => { if (ops.length) pages.push(ops); ops = []; y = TOP; };
  const SZ = 10.5, LH = 13;
  const head = () => {
    rect(M, y, CW, 20, .9);
    ['No', 'Objek', 'Kuantitas', 'Metode', 'Nilai'].forEach((h, i) => { rect(cx[i], y, cols[i], 20); txt(cx[i] + (cols[i] - wd(h, SZ, 1)) / 2, y + 5, h, SZ, 1); });
    y += 20;
  };
  txt(M, y, title, 15, 1); y += 24;
  lines.forEach(l => { txt(M, y, l[0], 11, l[1]); y += 17; });
  y += 6; head();
  let tot = 0;
  rows.forEach((r, i) => {
    const nl = Math.round(+r.nl || 0); tot += nl;
    const L = [wrap(r.n || '-', cols[1] - 10, SZ), wrap(r.q || '-', cols[2] - 10, SZ), wrap(r.mt || '-', cols[3] - 10, SZ)];
    const h = Math.max(...L.map(l => l.length)) * LH + 8;
    if (y + h > BOT) { newPage(); head(); }
    for (let c = 0; c < 5; c++) rect(cx[c], y, cols[c], h);
    txt(cx[0] + (cols[0] - wd(String(i + 1), SZ)) / 2, y + 4, String(i + 1), SZ);
    L[0].forEach((s, k) => txt(cx[1] + 5, y + 4 + k * LH, s, SZ));
    L[1].forEach((s, k) => txt(cx[2] + 5, y + 4 + k * LH, s, SZ));
    L[2].forEach((s, k) => txt(cx[3] + 5, y + 4 + k * LH, s, SZ));
    const sn = kpRp(nl); txt(cx[4] + cols[4] - 5 - wd(sn, SZ), y + 4, sn, SZ);
    y += h;
  });
  if (y + 22 > BOT) { newPage(); head(); }
  rect(M, y, CW - cols[4], 22); rect(cx[4], y, cols[4], 22);
  txt(cx[4] - 8 - wd('Total', SZ, 1), y + 5, 'Total', SZ, 1);
  const st = kpRp(tot); txt(cx[4] + cols[4] - 5 - wd(st, SZ, 1), y + 5, st, SZ, 1);
  newPage();
  let out = '%PDF-1.4\n'; const offs = [];
  const add = s => { offs.push(out.length); out += `${offs.length} 0 obj\n${s}\nendobj\n`; };
  const nP = pages.length;
  add('<</Type/Catalog/Pages 2 0 R>>');
  add(`<</Type/Pages/Kids[${pages.map((_, i) => (5 + i * 2) + ' 0 R').join(' ')}]/Count ${nP}>>`);
  add('<</Type/Font/Subtype/Type1/BaseFont/Times-Roman/Encoding/WinAnsiEncoding>>');
  add('<</Type/Font/Subtype/Type1/BaseFont/Times-Bold/Encoding/WinAnsiEncoding>>');
  pages.forEach((o, i) => {
    const s = o.join('\n') + '\n';
    add(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ${6 + i * 2} 0 R>>`);
    add(`<</Length ${s.length}>>\nstream\n${s}endstream`);
  });
  const xr = out.length, N = offs.length + 1;
  out += `xref\n0 ${N}\n0000000000 65535 f \n` + offs.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<</Size ${N}/Root 1 0 R>>\nstartxref\n${xr}\n%%EOF`;
  /* semua karakter <= 0xFF (Latin-1) -> tulis sebagai byte agar titik tengah tidak menjadi dua byte */
  const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
  return new Blob([bytes], { type: 'application/pdf' });
}
function kpPdf(no) {
  const d = R.find(r => r[0] == no) || [], x = (RX[no] || {}).kpknl || {}, tg = x.tgl ? fd(x.tgl) : fd(today());
  const lines = [[no + ' \u00B7 ' + (d[1] || '-') + ' \u00B7 ' + tg, 0], [d[4] || '-', 1]];
  if (x.nomor) lines.push(['Surat Penilaian KPKNL Nomor ' + x.nomor + ' tanggal ' + tg, 0]);
  return ringkasPdf('LAPORAN PENILAIAN KPKNL', lines, (x.items || []).map(r => ({ n: r.n, q: (+r.q ? (+r.q).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-') + ' ' + (r.sn || 'Kg'), mt: r.mt || KP_METODE, nl: r.nl })));
}
function kpPreview(no) {
  const d = R.find(r => r[0] == no) || [];
  pvClose();
  pvUrl = URL.createObjectURL(kpPdf(no));
  const nm = 'Ringkasan Penilaian KPKNL - ' + String(no).replace(/[\\/:*?"<>|]+/g, '-') + '.pdf';
  const m = document.createElement('div'); m.id = 'pvm'; m.className = 'pvm';
  m.innerHTML = `<div class="pvb" role="dialog" aria-modal="true" aria-label="Pratinjau Ringkasan Penilaian KPKNL"><div class="pvh"><div><b>Ringkasan Penilaian KPKNL</b><small class="mt">${esc(no)} · ${esc(d[1] || '')}</small></div><div class="pva"><a class="btn o sm" href="${pvUrl}" download="${esc(nm)}">Unduh</a><a class="btn o sm" href="${pvUrl}" target="_blank" rel="noopener">Tab baru</a><button type="button" class="btn sm" data-pv="x">Tutup</button></div></div><iframe class="pvf" src="${pvUrl}" title="Pratinjau Ringkasan Penilaian KPKNL"></iframe></div>`;
  m.onclick = e => { if (e.target === m || e.target.closest('[data-pv=x]')) pvClose(); };
  document.body.appendChild(m);
}

/* ---------- penyambung ke SK Nilai Limit ---------- */
function kpPseudo(d) {
  const no = d[0], x = RX[no].kpknl, ff = (RX[no] || {}).f || {};
  return { kpknl: true, kp: x, no, tksNo: no, pd: d[1], al: ff.alamat || '', pf: d[10] || '', items: x.items, o: x.items.map(() => ({ jl: x.jl || 'Lelang' })) };
}
const kpSaved = () => R.filter(d => kpknlRoute(d[0]) && RX[d[0]].kpknl.status == 'Tersimpan' && Array.isArray(RX[d[0]].kpknl.items) && kpTot(RX[d[0]].kpknl.items) > 0).map(kpPseudo);
