/* Modul 2 - SK Nilai Limit
   Menghasilkan dokumen Word "Keputusan Wali Kota tentang Penetapan Penjualan dan Nilai Limit BMD" dari template resmi.
   Isi otomatis dari data permohonan (nomor, tanggal, perihal), BA Penelitian, Persetujuan Kepala Daerah, dan hasil Kertas Kerja
   Penaksiran (Rekap Tonase + Daftar barang pada lampiran). Semua isian dapat disesuaikan sebelum dokumen diunduh.
   Data: SKN[noPermohonan] = { f: {...isian}, ts, dl:boolean } */
const SKN = {};
let skCur = null;
const SK_TITIK = '...............';
const SK_JENIS_BANGUNAN = /bongkar|gedung|bangunan|material/i;

/* ---------- utilitas ---------- */
const skUp = t => String(t == null ? '' : t).toUpperCase();
const skCapNama = t => { const s = String(t || '').trim().toLowerCase(); return s ? s[0].toUpperCase() + s.slice(1) : '-'; };
const skRp = (n, d) => (+n || 0).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const skKon = k => /rusak\s*berat|^rb$/i.test(k) ? 'RB' : /rusak\s*sedang|^rs$/i.test(k) ? 'RS' : /rusak\s*ringan|^rr$/i.test(k) ? 'RR' : /^(baik|b)$/i.test(String(k).trim()) ? 'B' : String(k || '-');
function skTgl(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3] + ' ' + pjCap(PJ_BLN[+m[2] - 1]) + ' ' + m[1] : String(iso || '');
}
const skList = () => { pjSiap(); return OB.filter(p => p.no && kkAllDone(p)); };
const skDok = no => SKN[no] || null;

/* ---------- perhitungan lampiran dari objek & kertas kerja ---------- */
function skHitung(p) {
  const g = {}, daftar = [];
  p.o.forEach((o, i) => {
    const nl = Math.round(kkNilai(p, i).nl || 0), ton = kkQkg(o) || 0, bahan = o.bh || o.mp || '-';
    const jenis = SK_JENIS_BANGUNAN.test(o.n || '') ? 'Material Gedung dan Bangunan' : 'Peralatan dan Mesin', key = jenis + '|' + skUp(bahan);
    const r = g[key] = g[key] || { jenis, bahan: skCapNama(bahan), jml: 0, ton: 0, nilai: 0 };
    r.jml++; r.ton += ton; r.nilai += nl;
    daftar.push({ kib: o.kib || '-', kode: o.k || '-', uraian: o.n || '-', tahun: o.th || '-', kondisi: skKon(o.kd), bahan: skUp(bahan), ton, nilai: nl });
  });
  const rekap = Object.values(g).sort((a, b) => a.jenis < b.jenis ? 1 : a.jenis > b.jenis ? -1 : a.bahan.localeCompare(b.bahan));
  rekap.forEach(r => { r.harga = r.ton > 0 ? r.nilai / r.ton : 0; });
  const total = rekap.reduce((a, r) => a + r.nilai, 0);
  return { rekap, daftar, total, ton: rekap.reduce((a, r) => a + r.ton, 0), limit: total > 0 ? Math.ceil(total / 1000) * 1000 : 0 };
}

/* ---------- isian bawaan dari modul-modul sebelumnya ---------- */
function skDefault(p) {
  const d = R.find(r => r[0] == p.no) || [], ff = (RX[p.no] || {}).f || {}, pen = (PEN[p.no] && PEN[p.no].f) || {};
  const ps = (SVS[p.no] || {}).psj || {}, pf = ps.st == 'Tersimpan' && ps.f || {}, h = skHitung(p), n = p.o.length;
  const semuaLangsung = p.o.length && p.o.every(o => o.jl == 'Langsung');
  return {
    nopermohonan: p.no, tglpermohonan: ff.tgl || '', perihal: ff.pf || d[10] || p.pf || '',
    nobap: pen.nobap || '', tglbap: pen.tgl || '', nopersetujuan: pf.nomor || '', tglpersetujuan: pf.tgl || '', perihalpersetujuan: pf.perihal || '',
    nolaporan: '', tgllaporan: '',
    opd: p.pd, alamat: alamatPermohonan(p.no) || p.al || '',
    uraian: n + ' (' + pjCap(pjTerbilang(n)) + ') Unit Peralatan dan Mesin Dalam Bentuk Limbah Padat (Scrap)',
    metode: semuaLangsung ? 'Langsung' : 'Lelang', nilailimit: h.limit || '',
    nosk: '', tglsk: today()
  };
}
const skF = p => Object.assign(skDefault(p), (skDok(p.no) || {}).f || {});
const SK_FIELDS = ['nopermohonan', 'tglpermohonan', 'perihal', 'nobap', 'tglbap', 'nopersetujuan', 'tglpersetujuan', 'perihalpersetujuan', 'nolaporan', 'tgllaporan', 'opd', 'alamat', 'uraian', 'metode', 'nilailimit', 'nosk', 'tglsk'];
const SK_LABEL = { nopermohonan: 'Nomor Permohonan', tglpermohonan: 'Tanggal Permohonan', perihal: 'Perihal Permohonan', opd: 'Perangkat Daerah', alamat: 'Alamat Perangkat Daerah', uraian: 'Uraian Barang', nilailimit: 'Nilai Limit' };
const SK_WAJIB = ['nopermohonan', 'tglpermohonan', 'perihal', 'opd', 'alamat', 'uraian', 'nilailimit'];
const skCollect = () => { const f = {}; SK_FIELDS.forEach(q => { const e = document.getElementById('sk_' + q); f[q] = e ? e.value.trim() : ''; }); return f; };
const skMiss = f => SK_WAJIB.filter(q => !String(f[q] == null ? '' : f[q]).trim() || (q == 'nilailimit' && !(+f[q] > 0))).map(q => SK_LABEL[q]);

/* ---------- pembuatan dokumen Word ---------- */
function skTokens(f, p) {
  const v = x => String(x || '').trim() || SK_TITIK, tg = x => f[x] ? skTgl(f[x]) : SK_TITIK;
  const nl = Math.round(+f.nilailimit || 0), uraian = v(f.uraian), opd = v(f.opd), alamat = String(f.alamat || '').replace(/[.\s]+$/, '') || SK_TITIK;
  const barang = uraian + ' pada ' + opd + ' di ' + alamat;
  return {
    NO_SK: v(f.nosk), TGL_SK: tg('tglsk'),
    NO_PERMOHONAN: v(f.nopermohonan), TGL_PERMOHONAN: tg('tglpermohonan'), PERIHAL_PERMOHONAN: v(f.perihal),
    NO_BAP: v(f.nobap), TGL_BAP: tg('tglbap'), NO_PERSETUJUAN: v(f.nopersetujuan), TGL_PERSETUJUAN: tg('tglpersetujuan'), PERIHAL_PERSETUJUAN: v(f.perihalpersetujuan),
    NO_LAPORAN: v(f.nolaporan), TGL_LAPORAN: tg('tgllaporan'),
    OPD: opd, URAIAN_UP: skUp(uraian), BARANG_LENGKAP: barang, JUDUL_UP: skUp(barang),
    TENTANG_UP: 'PENETAPAN PENJUALAN DAN NILAI LIMIT BARANG MILIK DAERAH BERUPA ' + skUp(barang), REKAP_JUDUL_UP: skUp(uraian + ' pada ' + opd),
    NILAI_LIMIT_ANGKA: skRp(nl, 2), NILAI_LIMIT_TERBILANG: pjCap(pjTerbilang(nl)) + ' Rupiah',
    METODE: f.metode == 'Langsung' ? 'penjualan langsung' : 'lelang'
  };
}
async function skDocx(p, f) {
  if (typeof JSZip == 'undefined' || typeof SK_TPL_B64 == 'undefined') throw new Error('JSZip / template belum termuat');
  const bin = atob(SK_TPL_B64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), h = skHitung(p), m = skTokens(f, p);
  const fill = (row, map) => row.replace(/\{\{([A-Z0-9_]+)\}\}/g, (a, q) => q in map ? pjXml(map[q]) : a);
  const rekapTot = { R_TON_TOTAL: skRp(h.ton, 2), R_HARGA_TOTAL: skRp(h.rekap.reduce((a, r) => a + r.harga, 0), 2), R_NILAI_TOTAL: skRp(h.total, 2), R_PEMBULATAN: skRp(+f.nilailimit || 0, 2), D_TON_TOTAL: skRp(h.ton, 2), D_NILAI_TOTAL: skRp(h.total, 2) };
  let x = await z.file('word/document.xml').async('string');
  x = x.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, row => {
    if (row.includes('{{R_NO}}')) return h.rekap.map((r, i) => fill(row, { R_NO: i + 1, R_JENIS: r.jenis, R_JML: r.jml, R_BAHAN: r.bahan, R_TON: skRp(r.ton, 2), R_HARGA: skRp(r.harga, 2), R_NILAI: skRp(r.nilai, 2) })).join('');
    if (row.includes('{{D_NO}}')) return h.daftar.map((r, i) => fill(row, { D_NO: i + 1, D_KIB: r.kib, D_KODE: r.kode, D_REG: '-', D_URAIAN: r.uraian, D_TAHUN: r.tahun, D_MEREK: '-', D_NOPOL: '-', D_PEROLEHAN: '-', D_KONDISI: r.kondisi, D_BAHAN: r.bahan, D_TON: skRp(r.ton, 2), D_NILAI: skRp(r.nilai, 0) })).join('');
    return row;
  });
  x = fill(x, Object.assign({}, m, rekapTot));
  z.file('word/document.xml', x);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}
/* Pratinjau: paragraf dan tabel dibaca dari dokumen Word yang sudah terisi (selalu sama dengan hasil unduhan) */
async function skPreviewHtml(blob) {
  const z = await JSZip.loadAsync(blob), xml = await z.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml'), body = doc.getElementsByTagName('w:body')[0];
  const T = n => Array.from(n.getElementsByTagName('w:t')).map(t => t.textContent).join('');
  const out = [];
  Array.from(body.children).forEach(n => {
    if (n.nodeName == 'w:p') {
      const t = T(n).replace(/\s+/g, ' ').trim(); if (!t) { out.push('<div class="pj-sp"></div>'); return; }
      const j = n.getElementsByTagName('w:jc')[0], a = j ? j.getAttribute('w:val') : '', al = a == 'center' ? 'center' : a == 'both' ? 'justify' : a == 'right' ? 'right' : '';
      out.push(`<p${al ? ` style="text-align:${al}"` : ''}>${esc(t)}</p>`);
    } else if (n.nodeName == 'w:tbl') {
      out.push('<div class="sk-tw"><table>' + Array.from(n.getElementsByTagName('w:tr')).map(r => '<tr>' + Array.from(r.getElementsByTagName('w:tc')).map(c => `<td>${esc(Array.from(c.getElementsByTagName('w:p')).map(T).join(' ').replace(/\s+/g, ' ').trim())}</td>`).join('') + '</tr>').join('') + '</table></div>');
    }
  });
  return out.join('').replace(/(<div class="pj-sp"><\/div>){2,}/g, '<div class="pj-sp"></div>');
}

/* ---------- halaman daftar ---------- */
function skRows(q) {
  q = (q || '').toLowerCase().trim();
  const r = skList().filter(p => !q || (p.no + ' ' + p.pd + ' ' + (p.pf || '')).toLowerCase().includes(q));
  if (!r.length) return `<tr><td colspan="7" class="mt" style="text-align:center;padding:30px">${q ? 'Tidak ada hasil untuk pencarian tersebut.' : 'Belum ada permohonan yang siap. Permohonan muncul setelah semua Kertas Kerja Penaksirannya selesai.'}</td></tr>`;
  return r.map((p, i) => {
    const s = skDok(p.no), f = skF(p), st = s && s.dl ? ['s-g', 'SK Dibuat'] : s ? ['s-b', 'Draft Tersimpan'] : ['s-n', 'Belum Dibuat'];
    return `<tr><td>${i + 1}</td><td><b>${esc(p.no)}</b><div class="mt" style="font-size:12px">${esc(p.pd)}</div></td><td>${f.tglpermohonan ? esc(skTgl(f.tglpermohonan)) : '-'}<div class="mt" style="font-size:12px;max-width:340px">${esc(f.perihal || '-')}</div></td>` +
      `<td>${p.o.length} objek</td><td><b>${RP(+f.nilailimit || 0)}</b></td><td>${PL(st[0], st[1])}</td><td><button class="btn sm" data-sk="${esc(p.no)}">${s ? 'Lanjutkan' : 'Buat SK'}</button></td></tr>`;
  }).join('');
}
function pgSk() {
  const s = $('#sk');
  if (skCur && skList().find(p => p.no == skCur)) return skDetail(s);
  skCur = null;
  s.innerHTML = HD('SK Nilai Limit') +
    ALR('Alur:', 'Pilih permohonan &rarr; periksa nomor, tanggal, perihal &rarr; Pratinjau &rarr; Unduh Word (.docx).') +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar Permohonan</h2><small class="mt">Muncul setelah semua Kertas Kerja Penaksiran selesai.</small></div><label class="sr2 pt-q"><svg class="i"><use href="#sq"></use></svg><input id="sk_q" placeholder="Cari nomor permohonan atau perangkat daerah…"></label></div>` +
    `<div class="tw"><table class="pt-t"><thead><tr><th>No</th><th>Permohonan</th><th>Tanggal &amp; Perihal</th><th>Objek</th><th>Nilai Limit</th><th>Status SK</th><th>Aksi</th></tr></thead><tbody id="sk_tb">${skRows('')}</tbody></table></div></div>`;
  s.oninput = e => { if (e.target.id == 'sk_q') $('#sk_tb').innerHTML = skRows(e.target.value); };
  s.onchange = null;
  s.onclick = e => { const b = e.target.closest('[data-sk]'); if (b) { skCur = b.dataset.sk; pgSk(); scrollTo(0, 0); } };
}

/* ---------- halaman detail ---------- */
function skIn(q, label, val, o) {
  o = o || {};
  return `<label class="l2${o.full ? ' full' : ''}">${label}` + (o.t == 'area' ? `<textarea id="sk_${q}" rows="${o.rows || 2}" placeholder="${esc(o.ph || '')}">${esc(val)}</textarea>`
    : o.opt ? `<select id="sk_${q}">${o.opt.map(x => `<option${x == val ? ' selected' : ''}>${x}</option>`).join('')}</select>`
    : `<input id="sk_${q}" type="${o.t || 'text'}" value="${esc(val)}" placeholder="${esc(o.ph || '')}">`) + (o.note ? `<small class="mt">${o.note}</small>` : '') + `</label>`;
}
function skDetail(s) {
  const no = skCur, p = OB.find(x => x.no == no), f = skF(p), h = skHitung(p), dok = skDok(no);
  const sec2 = (t, sub, body) => `<div class="cd pt-sec"><div class="ch"><div><h2>${t}</h2>${sub ? `<small class="mt">${sub}</small>` : ''}</div></div>${body}</div>`;
  const rekapHtml = `<div class="tw"><table><thead><tr><th>No</th><th>Jenis Barang</th><th>Jumlah</th><th>Bahan</th><th>Tonase (Kg)</th><th>Harga Taksiran/Kg</th><th>Nilai Taksiran</th></tr></thead><tbody>${h.rekap.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.jenis)}</td><td>${r.jml}</td><td>${esc(r.bahan)}</td><td>${skRp(r.ton, 2)}</td><td>${skRp(r.harga, 2)}</td><td>${skRp(r.nilai, 2)}</td></tr>`).join('')}<tr><td colspan="4"><b>TOTAL</b></td><td><b>${skRp(h.ton, 2)}</b></td><td></td><td><b>${skRp(h.total, 2)}</b></td></tr></tbody></table></div>`;
  s.innerHTML = `<div class="pt-hd"><button class="btn o sm" data-a="bk">← Kembali ke daftar</button><div><h1>SK Nilai Limit · ${esc(no)}</h1><p>${esc(p.pd)} · ${p.o.length} objek · ${dok ? 'Draft tersimpan ' + esc(dok.ts || '') : 'Belum disimpan'}</p></div></div>` +
    ALR('Terisi otomatis.', 'Nomor, tanggal, dan perihal permohonan diambil dari data permohonan; dasar pertimbangan dari BA Penelitian dan Persetujuan Kepala Daerah. Semua isian bisa disesuaikan.') +
    sec2('1. Surat Permohonan (Menimbang huruf a)', 'Mengikuti data permohonan pengguna barang.', `<div class="ff">${skIn('nopermohonan', 'Nomor Permohonan', f.nopermohonan)}${skIn('tglpermohonan', 'Tanggal Permohonan', f.tglpermohonan, { t: 'date' })}${skIn('perihal', 'Perihal Permohonan', f.perihal, { t: 'area', full: 1 })}</div>`) +
    sec2('2. Dasar Pertimbangan Lainnya', 'Diambil dari BA Penelitian dan Persetujuan Kepala Daerah bila sudah ada. Laporan Penilaian diisi manual.', `<div class="ff">${skIn('nobap', 'Nomor BA Penelitian', f.nobap)}${skIn('tglbap', 'Tanggal BA Penelitian', f.tglbap, { t: 'date' })}${skIn('nopersetujuan', 'Nomor Persetujuan Wali Kota', f.nopersetujuan)}${skIn('tglpersetujuan', 'Tanggal Persetujuan Wali Kota', f.tglpersetujuan, { t: 'date' })}${skIn('perihalpersetujuan', 'Perihal Persetujuan', f.perihalpersetujuan, { t: 'area', full: 1 })}${skIn('nolaporan', 'Nomor Laporan Penilaian', f.nolaporan, { ph: 'Contoh: 000.2.3.2/7481-Bid.BMD' })}${skIn('tgllaporan', 'Tanggal Laporan Penilaian', f.tgllaporan, { t: 'date' })}</div>`) +
    sec2('3. Barang yang Ditetapkan', '', `<div class="ff">${skIn('opd', 'Perangkat Daerah', f.opd)}${skIn('metode', 'Permohonan Penjualan', f.metode, { opt: ['Lelang', 'Langsung'] })}${skIn('alamat', 'Alamat Perangkat Daerah', f.alamat, { full: 1, ph: 'Contoh: Jalan Pemuda Nomor 31, RT.01/RW.06, Tanah Sareal, Kota Bogor, Jawa Barat 16162' })}${skIn('uraian', 'Uraian Barang', f.uraian, { t: 'area', full: 1 })}</div>`) +
    sec2('4. Nilai Limit', 'Total nilai taksiran dari Kertas Kerja: <b>' + RP(h.total) + '</b>. Nilai limit bawaan dibulatkan ke atas ribuan terdekat, sesuai contoh template.', `<div class="ff">${skIn('nilailimit', 'Nilai Limit (Rp)', f.nilailimit, { t: 'number', note: '<span id="sk_nlt">' + (+f.nilailimit > 0 ? esc(pjCap(pjTerbilang(+f.nilailimit)) + ' Rupiah') : '') + '</span>' })}</div>`) +
    sec2('5. Penetapan', '', `<div class="ff">${skIn('nosk', 'Nomor Keputusan Wali Kota', f.nosk, { ph: 'Boleh dikosongkan, dapat diisi pada file Word' })}${skIn('tglsk', 'Tanggal Ditetapkan', f.tglsk, { t: 'date' })}</div>`) +
    sec2('Lampiran (otomatis dari Kertas Kerja)', 'Rekap Tonase dan Daftar ' + h.daftar.length + ' barang dibuat otomatis pada lampiran dokumen. Kolom Register, Merek/Type/Lokasi, Nomor Polisi, dan Nilai Perolehan diisi "-" karena belum ada di data aplikasi.', rekapHtml) +
    `<div class="sg-bar"><span>${dok ? 'Draft tersimpan' : 'Belum disimpan'}</span><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn o" data-a="reset">Muat Ulang dari Data Permohonan</button><button type="button" class="btn o" data-a="save">Simpan Draft</button><button type="button" class="btn o" data-a="prev">Pratinjau</button><button type="button" class="btn" data-a="docx">Unduh Word (.docx)</button></div></div>`;
  s.oninput = e => { if (e.target.id == 'sk_nilailimit') { const n = +e.target.value, t = $('#sk_nlt'); if (t) t.textContent = n > 0 ? pjCap(pjTerbilang(n)) + ' Rupiah' : ''; } };
  s.onchange = null;
  s.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a == 'bk') { skCur = null; return pgSk(); }
    if (a == 'reset') return cfm('Muat ulang dari data permohonan?', 'Isian yang sudah diubah akan diganti dengan data terbaru dari permohonan dan modul sebelumnya.', () => { delete SKN[no]; Store.persist(); toast('Isian dimuat ulang dari data permohonan.'); pgSk(); }, 'Muat Ulang');
    const F = skCollect();
    if (a == 'save') { SKN[no] = Object.assign(SKN[no] || {}, { f: F, ts: nowStr() }); Store.persist(); toast('Draft SK Nilai Limit tersimpan.', 'ok'); return pgSk(); }
    const miss = skMiss(F); if (miss.length) return toast('Lengkapi dulu: ' + miss.join(', ') + '.', 'err');
    b.disabled = true;
    skDocx(p, F).then(async blob => {
      if (a == 'docx') {
        SKN[no] = Object.assign(SKN[no] || {}, { f: F, ts: nowStr(), dl: true }); Store.persist();
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'SK Nilai Limit - ' + no.replace(/[\\/:*?"<>|]/g, '-') + '.docx';
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000); toast('Dokumen SK Nilai Limit berhasil dibuat.', 'ok');
      } else {
        const html = await skPreviewHtml(blob);
        pjModal(`<div class="bamd-c" role="dialog" aria-modal="true"><div class="bamd-h"><div><b>Pratinjau SK Nilai Limit</b><small class="mt">Isi mengikuti formulir; tata letak final ada pada file Word.</small></div><button type="button" class="ic-b" data-x="1" aria-label="Tutup">&times;</button></div><div class="bamd-b"><div class="pj-paper sk-prev">${html}</div></div></div>`);
      }
    }).catch(er => { console.error(er); toast('Gagal membuat dokumen: ' + er.message); }).finally(() => { b.disabled = false; });
  };
}
