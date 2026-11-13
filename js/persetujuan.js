/* Persetujuan Kepala Daerah: mail merge + generate dokumen (Izin Bongkar / Pemindahtanganan)
   Cara kerja sama seperti Penelitian Tim Penghapusan: data acuan dari Excel, form, pratinjau, cetak, dan unduh Word dari template.
   Data: SVS[no].psj = { f: {...kolom}, st: 'Draft' | 'Tersimpan', ts } */
let psjCur = null, psjImp = null;

/*  Data acuan (mail merge) dari file Excel "Persetujuan Ijin Bongkar" dan "Persetujuan Penjualan" ---------- */
const PSJ_MM0 = {
 "yth": [
  [
   "Dinas Pemuda dan Olahraga Kota Bogor",
   "Kepala Dinas Pemuda dan Olahraga Kota Bogor"
  ],
  [
   "Dinas Koperasi, Usaha Kecil, Menengah, Perdagangan dan Perindustrian",
   "Kepala Dinas Koperasi, Usaha Kecil, Menengah, Perdagangan dan Perindustrian"
  ],
  [
   "Dinas Kesehatan Kota Bogor",
   "Kepala Dinas Kesehatan"
  ],
  [
   "Kecamatan Bogor Tengah",
   "Camat Bogor Tengah"
  ],
  [
   "Dinas Pendidikan Kota Bogor",
   "Kepala Dinas Pendidikan"
  ],
  [
   "Dinas Lingkungan Hidup Kota Bogor",
   "Kepala Dinas Lingkungan Hidup"
  ]
 ],
 "tujuan": [
  [
   "Badan Pendapatan Daerah Kota Bogor",
   "Kepala Badan Pendapatan Daerah Kota Bogor"
  ],
  [
   "Rumah Sakit Umum Daerah Kota Bogor",
   "Direktur Rumah Sakit Umum Daerah Kota Bogor"
  ],
  [
   "Dinas Pendidikan Kota Bogor",
   "Kepala Dinas Pendidikan Kota Bogor"
  ],
  [
   "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah Kota Bogor",
   "Kepala Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah"
  ],
  [
   "Dinas Pengendalian Penduduk dan Keluarga Berencana",
   "Kepala Dinas Pengendalian Penduduk dan Keluarga Berencana"
  ],
  [
   "Dinas Pariwisata dan Kebudayaan Kota Bogor",
   "Kepala Dinas Pariwisata dan Kebudayaan Kota Bogor"
  ],
  [
   "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu",
   "Kepala Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu"
  ],
  [
   "Kecamatan Bogor Tengah",
   "Camat Bogor Tengah"
  ]
 ],
 "alasan": [
  [
   "Dinas Pemuda dan Olahraga Kota Bogor",
   "dalam rangka penataan dan pengembangan kawasan Stadion Pajajaran Kota Bogor"
  ],
  [
   "Dinas Koperasi, Usaha Kecil, Menengah, Perdagangan dan Perindustrian",
   "penataan dan pemanfaatan kembali"
  ],
  [
   "Dinas Pemuda dan Olahraga Kota Bogor",
   "gedung bangunan akan digunakan sebagai Gedung kantor Dinas Pemuda dan Olahraga sehingga membutuhkan perbaikan atas gedung yang saat ini dalam kondisi rusak sedang"
  ],
  [
   "Dinas Kesehatan Kota Bogor",
   "bangunan akan dilakukan pengembangan untuk menjadi Puskesmas Pondok Rumput (ex Kelurahan Kebon Pedes)"
  ],
  [
   "Kecamatan Bogor Tengah",
   "perbaikan gedung bangunan yang sudah dalam kondisi rusak berat"
  ],
  [
   "Dinas Pendidikan Kota Bogor",
   "adanya kegiatan Pengelolaan Pendidikan Sekolah Dasar (SD) dan Pengelolaan Pendidikan Menengah Pertama (SMP) pada Bidang Sarana dan Prasarana Dinas Pendidikan Kota Bogor yang bersumber dari APBD Kota Bogor Tahun Anggaran 2026, dimana pada saat pelaksanaan pekerjaan terdapat kebutuhan pembongkaran terhadap sebagian maupun seluruh bangunan sekolah"
  ],
  [
   "Dinas Lingkungan Hidup Kota Bogor",
   "kondisi TPS 3R telah mengalami penurunan fungsi dan kelayakan dan telah disiapkan alternatif sistem pengangkutan langsung"
  ]
 ],
 "bmd": [
  "Peralatan dan mesin dalam bentuk scrap",
  "Peralatan dan mesin berupa buku dalam bentuk scrap",
  "Material bongkaran reklame",
  "Peralatan dan mesin dalam bentuk unit dan scrap"
 ]
};
const PSJ_MMI0 = { src: 'mailmerge_Penjualan_dan_Ijin_Bongkar (yang kedua).xlsx', baris: { bongkar: 7, penjualan: 15 }, bawaan: 1 };
let PSJ_MM = PSJ_MM0, PSJ_MMI = PSJ_MMI0;
const PSJ_MM_KEY = 'si-bmd-mailmerge-psj-v1';
(function () {
  try { const j = JSON.parse(localStorage.getItem(PSJ_MM_KEY) || 'null'); if (j && j.mm && Array.isArray(j.mm.yth) && Array.isArray(j.mm.tujuan)) { PSJ_MM = j.mm; PSJ_MMI = j.info || PSJ_MMI0; } } catch (e) { /* pakai data bawaan */ }
})();
function psjMMSimpan(mm, info) {
  PSJ_MM = mm; PSJ_MMI = info;
  try { localStorage.setItem(PSJ_MM_KEY, JSON.stringify({ mm, info })); } catch (e) { console.warn('Gagal menyimpan data mail merge persetujuan', e); }
}
function psjMMReset() { PSJ_MM = PSJ_MM0; PSJ_MMI = PSJ_MMI0; try { localStorage.removeItem(PSJ_MM_KEY); } catch (e) { /* abaikan */ } }

const psjNz = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
/* Baca lembar Excel menjadi data acuan: Yth / TujuanPersetujuan per OPD, alasan pembongkaran, saran Nama BMD */
function psjMMBuild(sheets) {
  const sb = sheets.find(x => /persetujuan/i.test(x.name) && /bongkar/i.test(x.name)), sp = sheets.find(x => /persetujuan/i.test(x.name) && /penjualan/i.test(x.name));
  if (!sb && !sp) throw new Error('Lembar "Persetujuan Ijin Bongkar" atau "Persetujuan Penjualan" tidak ditemukan.');
  const read = (sh, need) => {
    const hi = sh.rows.findIndex(r => Array.from(r || [], c => psjNz(c)).some(c => /^nomor persetujuan$/i.test(c)));
    if (hi < 0) throw new Error('Lembar "' + sh.name + '": baris judul kolom tidak ditemukan (harus ada kolom "Nomor Persetujuan").');
    const H = Array.from(sh.rows[hi], c => psjNz(c).toLowerCase()), idx = need.map(n => H.findIndex(h => n[0].test(h))), miss = need.filter((n, i) => idx[i] < 0).map(n => n[1]);
    if (miss.length) throw new Error('Lembar "' + sh.name + '": kolom tidak ditemukan: ' + miss.join(', ') + '.');
    return { idx, data: sh.rows.slice(hi + 1).filter(r => r && Array.from(r, c => psjNz(c)).some(Boolean)) };
  };
  const out = { yth: PSJ_MM.yth, tujuan: PSJ_MM.tujuan, alasan: PSJ_MM.alasan, bmd: PSJ_MM.bmd, baris: Object.assign({}, (PSJ_MMI && PSJ_MMI.baris) || {}) };
  const byOpd = (rows, io, iv) => { const m = new Map(); rows.forEach(r => { const o = psjNz(r[io]), v = psjNz(r[iv]); if (o && v) m.set(o, v); }); return [...m.entries()]; };
  if (sb) {
    const { idx, data } = read(sb, [[/^yth$/, 'Yth'], [/^opd\s*per?mohon$/, 'OPD Pemohon'], [/^alasan\s*pembongkaran$/, 'Alasan pembongkaran']]);
    out.yth = byOpd(data, idx[1], idx[0]);
    const seen = new Set(); out.alasan = [];
    data.forEach(r => { const o = psjNz(r[idx[1]]), a = psjNz(r[idx[2]]); if (a && !seen.has(a.toLowerCase())) { seen.add(a.toLowerCase()); out.alasan.push([o, a]); } });
    out.baris.bongkar = data.length;
  }
  if (sp) {
    const { idx, data } = read(sp, [[/^tujuan\s*persetujuan$/, 'Tujuan Persetujuan'], [/^opd\s*per?mohon$/, 'OPD Pemohon'], [/^nama\s*bmd$/, 'Nama BMD']]);
    out.tujuan = byOpd(data, idx[1], idx[0]);
    const seen = new Set(); out.bmd = [];
    data.forEach(r => { const b = psjNz(r[idx[2]]); if (b && !seen.has(b.toLowerCase())) { seen.add(b.toLowerCase()); out.bmd.push(b); } });
    out.baris.penjualan = data.length;
  }
  return out;
}

/*  Kolom per jenis permohonan (mengikuti kolom mail merge pada Excel dan Word)  */
const PSJ_ORD = {
  'Izin Bongkar': ['nomor', 'tgl', 'perihal', 'tujuan', 'nopermohonan', 'tglpermohonan', 'perihalpermohonan', 'opd', 'alasan'],
  'Pemindahtanganan': ['nomor', 'tgl', 'perihal', 'tujuan', 'nopermohonan', 'tglpermohonan', 'bmd', 'opd', 'perihalpermohonan']
};
const psjJenis = d => ptJenis(d) == 'Izin Bongkar' ? 'Izin Bongkar' : 'Pemindahtanganan';
const psjKeys = j => PSJ_ORD[j];
const psjLabel = (k, j) => ({
  nomor: 'Nomor Persetujuan', tgl: 'Tanggal Persetujuan', perihal: 'Perihal',
  tujuan: j == 'Izin Bongkar' ? 'Tujuan Persetujuan (Yth)' : 'Tujuan Persetujuan', alasan: 'Alasan Pembongkaran', opd: 'OPD Pemohon',
  nopermohonan: 'Nomor Permohonan ' + j, tglpermohonan: 'Tanggal Permohonan',
  perihalpermohonan: 'Perihal Permohonan', bmd: 'Nama BMD'
}[k]);
const psjFor = (list, opd) => { const k = ptOpdKey(opd); for (let i = list.length - 1; i >= 0; i--) if (ptOpdKey(list[i][0]) == k) return list[i][1]; return ''; };
const psjTujuanDef = (opd, j) => psjFor(j == 'Izin Bongkar' ? PSJ_MM.yth : PSJ_MM.tujuan, opd) || psjFor(j == 'Izin Bongkar' ? PSJ_MM.tujuan : PSJ_MM.yth, opd) || (opd ? 'Kepala ' + opd : '');
const psjTgl = iso => { const d = ptD(iso); return d ? `${d.getDate()} ${PT_BLN[d.getMonth()]} ${d.getFullYear()}` : String(iso || ''); };

/* Nilai awal diambil dari input sebelumnya permohonan (nomor, tanggal, OPD) dan penelitian (Nama BMD, perihal) */
function psjDefault(d) {
  const ff = (RX[d[0]] || {}).f || {}, pen = (PEN[d[0]] && PEN[d[0]].f) || {}, j = psjJenis(d), pp = pen.perihal || ptPerihalDef(d);
  return {
    nomor: '', tgl: today(), perihal: 'Persetujuan ' + pp, tujuan: psjTujuanDef(d[1], j), alasan: '',
    opd: d[1], nopermohonan: d[0], tglpermohonan: /^\d{4}-\d{2}-\d{2}$/.test(ff.tgl || '') ? ff.tgl : '', perihalpermohonan: pp, bmd: pen.bmd || ''
  };
}
function psjMerge(def, saved) {
  const o = Object.assign({}, def);
  Object.keys(saved || {}).forEach(k => { const v = saved[k]; if (v != null && String(v).trim() !== '') o[k] = v; });
  return o;
}
/* Persetujuan sudah terbit = disimpan (Tersimpan). Dipakai untuk membuka Permohonan Penaksiran milik Pengguna Barang. */
const psjOk = no => { const p = (SVS[no] || {}).psj; return !!p && p.st == 'Tersimpan'; };
const psjStat = no => { const p = (SVS[no] || {}).psj; return !p ? ['s-n', 'Belum diinput'] : p.st == 'Tersimpan' ? ['s-g', 'Tersimpan'] : ['s-o', 'Draft']; };
const psjMissing = (f, j) => psjKeys(j).filter(k => !String(f[k] || '').trim()).map(k => psjLabel(k, j));

/* Mail Merge: token Word dan pratinjau  */
function psjTokens(f, j) {
  const base = { Tanggal_Persetujuan: psjTgl(f.tgl), Nomor_Persetujuan: f.nomor, Tanggal_Permohonan: psjTgl(f.tglpermohonan), Perihal_Permohonan: f.perihalpermohonan };
  return j == 'Izin Bongkar'
    ? Object.assign(base, { Perihal_Persetujuan: f.perihal, Yth: f.tujuan, Nomor_Permohonan: f.nopermohonan, Alasan_pembongkaran: f.alasan })
    : Object.assign(base, { Perihal: f.perihal, Tujuan_Persetujuan: f.tujuan, Nomor_Permohonan_Penjualan: f.nopermohonan, Nama_BMD: f.bmd, OPD_Pemohon: f.opd });
}
const PSJ_TEMBUSAN = '<p class="tb">Tembusan :</p><ol class="tbl"><li>Sekretaris Daerah Kota Bogor</li><li>Kepala Badan Keuangan dan Aset Daerah Kota Bogor</li></ol>';
function psjPrevHtml(f, j, no) {
  const V = (k, l) => String(f[k] || '').trim() ? esc(f[k]).replace(/\n/g, '<br>') : `<mark class="ph">[${l}]</mark>`;
  const T = (k, l) => String(f[k] || '').trim() ? esc(psjTgl(f[k])) : `<mark class="ph">[${l}]</mark>`;
  const L = k => psjLabel(k, j), IB = j == 'Izin Bongkar', bmd = V('bmd', 'Nama BMD'), opd = V('opd', 'OPD Pemohon');
  const kop = `<p class="c"><b>WALI KOTA BOGOR</b></p><p style="text-align:right">Bogor, ${T('tgl', L('tgl'))}</p>` +
    `<table class="hd"><tr><td>Nomor</td><td>: ${V('nomor', L('nomor'))}</td></tr><tr><td>Sifat</td><td>: Penting</td></tr><tr><td>Lampiran</td><td>: 1 (Satu) Berkas</td></tr><tr><td>Hal</td><td>: ${V('perihal', L('perihal'))}</td></tr></table>` +
    `<p>Yth. ${V('tujuan', L('tujuan'))}<br>di Bogor</p>`;
  const rujuk = `Sehubungan dengan Surat Saudara Nomor ${V('nopermohonan', L('nopermohonan'))}, Tanggal ${T('tglpermohonan', L('tglpermohonan'))}, Perihal ${V('perihalpermohonan', L('perihalpermohonan'))}`;
  const isi = IB
    ? `<p>${rujuk}, dengan ini kami sampaikan bahwa pada prinsipnya pembongkaran bangunan sebab ${V('alasan', L('alasan'))} tersebut dengan rincian data bangunan yang akan dibongkar sebagaimana terlampir dapat disetujui.</p>` +
    `<p>Guna tertib administrasi pengelolaan Barang Milik Daerah, terhadap material bongkaran bangunan yang bernilai ekonomis untuk dilakukan proses pemindahtanganan melalui penjualan agar dilaksanakan sesuai ketentuan Pasal 129 sampai dengan Pasal 134, Pasal 136, dan Pasal 137 Peraturan Walikota Bogor Nomor 114 Tahun 2020 Tentang Peraturan Pelaksanaan Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah.</p><p>Demikian disampaikan untuk menjadi perhatian dan terima kasih</p>`
    : `<p>${rujuk}, dengan ini diberitahukan bahwa permohonan Penjualan Barang Milik Daerah berupa ${bmd} pada ${opd} sebagaimana tercantum dalam lampiran surat ini, pada prinsipnya dapat disetujui.</p>` +
    `<p>Guna tertib administrasi pengelolaan barang milik daerah, untuk berpedoman pada Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah dan Peraturan Walikota Bogor Nomor 114 Tahun 2020 Tentang Peraturan Pelaksanaan Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah, dengan ketentuan sebagai berikut:</p>` +
    `<ol><li>${bmd} sebagaimana tercantum dalam lampiran surat ini adalah milik Pemerintah Daerah Kota Bogor yang sudah tidak digunakan untuk kepentingan penyelenggaraan tugas dan fungsi ${opd} serta tidak dimanfaatkan oleh pihak lain, maka untuk selanjutnya perlu dilakukan proses pemindahtanganan dalam bentuk penjualan.</li>` +
    `<li>Untuk proses pemindahtanganan dalam bentuk penjualan dan proses penghapusan barang milik daerah, maka agar melaksanakan tahapan sebagai berikut:<ol type="a"><li>Dilakukan penelitian data administratif dan fisik terhadap persediaan tersebut oleh Tim Penghapusan Barang Milik Daerah Pemerintah Daerah Kota Bogor yang hasilnya dituangkan dalam Berita Acara Penelitian yang disampaikan kepada Wali Kota melalui Sekretaris Daerah.</li>` +
    `<li>${bmd} tersebut harus dinilai terlebih dahulu untuk mendapatkan nilai wajar yang dilakukan oleh Tim Penilai dari Kantor Pelayanan Kekayaan Negara dan Lelang Bogor, Panitia Penaksir Harga BMD yang ditetapkan oleh Wali Kota Bogor atau Penilai Barang Milik Daerah.</li>` +
    `<li>Hasil Penilaian atau penaksiran dilaporkan kepada Wali Kota untuk mendapatkan Persetujuan Nilai Limit Penjualan dan Persetujuan Pemindahtanganan dalam bentuk penjualan yang ditetapkan melalui Keputusan Wali Kota.</li>` +
    `<li>Berdasarkan persetujuan pada huruf c, dilakukan penjualan yang hasilnya disetorkan ke Rekening Kas Umum Daerah.</li>` +
    `<li>Berdasarkan Berita Acara Serah Terima (BAST) yang didasarkan Risalah lelang / Akte Jual Beli agar mengajukan usulan penghapusan barang milik daerah sebagai dasar ditetapkannya Keputusan Sekretaris Daerah selaku Pengelola Barang Milik Daerah tentang Penghapusan Barang Milik Daerah.</li></ol></li></ol><p>Demikian untuk menjadi perhatian dan terima kasih.</p>`;
  const lamp = `<div class="lmp"><p class="lh">Lampiran Surat</p><p class="ls">Nomor : ${V('nomor', L('nomor'))}<br>Tanggal : ${T('tgl', L('tgl'))}<br>Hal : ${V('perihal', L('perihal'))}</p></div>` +
    `<table class="bt sm"><thead><tr>${PT_LAMP_H.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${ptItems(no).map((x, i) => `<tr>${ptLampRow(x, i).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return kop + isi + PSJ_TEMBUSAN + lamp;
}
const PSJ_CSS = '.bap table.hd{border-collapse:collapse;margin:0 0 10px}.bap table.hd td{border:0;padding:1px 10px 1px 0;vertical-align:top;background:none;color:#000;font:inherit}.bap .tb{margin:12px 0 2px;font-size:11px}.bap ol.tbl{font-size:11px;margin:0 0 6px}.bap ol ol{margin:6px 0}';
const psjCollect = j => { const o = {}; psjKeys(j).forEach(k => { const e = $('#p_' + k); o[k] = e ? e.value.trim() : ''; }); return o; };
function psjRender(j) { const e = $('#p_prev'); if (e) e.innerHTML = psjPrevHtml(psjCollect(j), j, psjCur); }
function psjPrint(f, j, no) {
  const w = window.open('', '_blank'); if (!w) return toast('Pop-up diblokir browser.');
  w.document.write(`<title>Persetujuan ${esc(j)} - ${esc(no)}</title><style>@page{size:A4;margin:16mm}body{margin:0}${PT_PAPER_CSS}${PSJ_CSS}.bap{padding:0}.bap .lmp{page-break-before:always}</style><body><div class="bap">${psjPrevHtml(f, j, no)}</div>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
}
/* Generate .docx dari template word (Izin Bongkar / Pemindahtanganan) */
async function psjDocx(no, f, j) {
  const b64 = j == 'Izin Bongkar' ? (typeof PSJ_TPL_IB_B64 != 'undefined' && PSJ_TPL_IB_B64) : (typeof PSJ_TPL_PM_B64 != 'undefined' && PSJ_TPL_PM_B64);
  if (typeof JSZip == 'undefined' || !b64) throw new Error('JSZip / template belum termuat');
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), m = psjTokens(f, j);
  let x = (await z.file('word/document.xml').async('string')).replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (a, k) => k == 'LAMPIRAN' ? a : ptX(m[k]));
  const i = x.indexOf('{{LAMPIRAN}}'), a = x.lastIndexOf('<w:p>', i), b = x.indexOf('</w:p>', i) + 6;
  if (i < 0 || a < 0) throw new Error('Penanda lampiran tidak ditemukan di template');
  x = x.slice(0, a) + ptLampXml(ptItems(no)) + x.slice(b);
  z.file('word/document.xml', x);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}

/*  Halaman 1 : Daftar Permohonan dan Data Mail Merge  */
function psjMMCard() {
  const i = PSJ_MMI, b = i.baris || {}, imp = psjImp;
  const impHtml = imp ? `<div class="pt-imp"><b>Hasil pembacaan: ${esc(imp.info.src)}</b><p class="mt">Persetujuan Izin Bongkar: ${imp.d.baris.bongkar || 0} baris, ${imp.d.yth.length} Yth per OPD, ${imp.d.alasan.length} alasan pembongkaran. Persetujuan Penjualan: ${imp.d.baris.penjualan || 0} baris, ${imp.d.tujuan.length} Tujuan Persetujuan per OPD, ${imp.d.bmd.length} saran Nama BMD.</p><div class="pt-bar" style="margin:8px 0 0"><button class="btn sm" data-mm="apply">Terapkan data ini</button><button class="btn o sm" data-mm="cancel">Batal</button></div></div>` : '';
  const tb = (rows) => rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
  return `<div class="cd pt-mm"><div class="ch"><div><h2 style="font-size:16px">Data Mail Merge</h2><small class="mt"></small></div><div class="pt-bar" style="margin:0"><button class="btn sm" data-mm="pick">Import Excel</button>${i.bawaan ? '' : '<button class="btn o sm" data-mm="reset">Kembalikan data bawaan</button>'}<input type="file" id="psj_file" accept=".xlsx" hidden></div></div>` +
    `<p class="mt" style="margin:0 0 6px">Sumber saat ini: <b>${esc(i.src)}</b>${i.tgl ? ' · diimpor ' + esc(i.tgl) : ''} · ${PSJ_MM.yth.length} Yth (Izin Bongkar) · ${PSJ_MM.tujuan.length} Tujuan Persetujuan (Pemindahtanganan) · ${PSJ_MM.alasan.length} alasan pembongkaran · ${PSJ_MM.bmd.length} saran Nama BMD</p>${impHtml}` +
    `<details class="pt-det"><summary>Lihat data acuan</summary><div class="tw"><table class="pt-t"><thead><tr><th>OPD (Izin Bongkar)</th><th>Yth</th></tr></thead><tbody>${tb(PSJ_MM.yth)}</tbody></table></div><div class="tw"><table class="pt-t"><thead><tr><th>OPD (Pemindahtanganan)</th><th>Tujuan Persetujuan</th></tr></thead><tbody>${tb(PSJ_MM.tujuan)}</tbody></table></div><div class="tw"><table class="pt-t"><thead><tr><th>OPD</th><th>Alasan Pembongkaran</th></tr></thead><tbody>${tb(PSJ_MM.alasan)}</tbody></table></div></details>` +
    `<p class="mt" style="margin:8px 0 0;font-size:12px"></p></div>`;
}
function psjRows(r, q) {
  q = (q || '').toLowerCase().trim();
  const f = r.filter(d => !q || (d[0] + ' ' + d[1]).toLowerCase().includes(q));
  if (!f.length) return `<tr><td colspan="8" class="mt" style="text-align:center;padding:26px">${q ? 'Tidak ada hasil untuk pencarian tersebut.' : 'Belum ada survei yang selesai.'}</td></tr>`;
  return f.map((d, i) => {
    const S = SVS[d[0]], st = psjStat(d[0]), p = S.psj, pen = ptStat(d[0]);
    return `<tr><td>${i + 1}</td><td><b>${esc(d[0])}</b><div class="mt" style="font-size:12px">${esc(d[1])}</div></td><td>${esc(psjJenis(d))}</td>` +
      `<td>${PL(pen[0], pen[1])}</td><td>${S.ba ? PL(S.ba.st == 'Selesai' ? 's-g' : 's-o', S.ba.st == 'Selesai' ? 'Selesai' : 'Draft') : '<span class="mt">Belum upload</span>'}</td>` +
      `<td>${PL(st[0], st[1])}</td><td>${psjOk(d[0]) ? (a => PL(a[0], a[1]))(tksStat(d[0])) : '<span class="mt">Menunggu persetujuan</span>'}</td><td><div class="pt-ac"><button class="btn sm" data-psj="${esc(d[0])}">${p ? (p.st == 'Tersimpan' ? 'Lihat / Ubah' : 'Lanjutkan') : 'Input Persetujuan'}</button>${S.ba ? ptBaIcons(d[0], S.ba.st == 'Selesai') : `<button class="btn o sm" data-ba="${esc(d[0])}">Upload BA TTD</button>`}</div></td></tr>`;
  }).join('');
}
function psjList(s) {
  const r = svRows().filter(d => SVS[d[0]].st == 'Selesai');
  s.innerHTML = HD('Persetujuan Kepala Daerah', '') + psjMMCard() +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar Permohonan</h2><small class="mt"></small></div><label class="sr2 pt-q"><svg class="i"><use href="#sq"></use></svg><input id="psj_q" placeholder="Cari nomor surat atau perangkat daerah…"></label></div>` +
    `<div class="tw"><table class="pt-t"><thead><tr><th>No</th><th>Nomor Surat / Pemohon</th><th>Jenis Permohonan</th><th>Status Penelitian</th><th>Status BA TTD</th><th>Status Persetujuan</th><th>Penaksiran</th><th>Aksi</th></tr></thead><tbody id="psj_tb">${psjRows(r, '')}</tbody></table></div></div>`;
  s.oninput = e => { if (e.target.id == 'psj_q') $('#psj_tb').innerHTML = psjRows(r, e.target.value); };
  s.onchange = e => {
    if (e.target.id != 'psj_file' || !e.target.files[0]) return;
    const f = e.target.files[0];
    f.arrayBuffer().then(ptXlsxAll).then(sh => { const d = psjMMBuild(sh); psjImp = { d, info: { src: f.name, tgl: today(), baris: d.baris } }; psjList(s); toast('File dibaca. Periksa hasilnya lalu klik “Terapkan data ini”.'); })
      .catch(err => { console.error(err); toast(err && err.message ? err.message : 'File Excel tidak dapat dibaca.'); e.target.value = ''; });
  };
  s.onclick = e => {
    const m = e.target.closest('[data-mm]');
    if (m) {
      const a = m.dataset.mm;
      if (a == 'pick') return $('#psj_file').click();
      if (a == 'cancel') { psjImp = null; return psjList(s); }
      if (a == 'apply' && psjImp) { const d = psjImp.d; psjMMSimpan({ yth: d.yth, tujuan: d.tujuan, alasan: d.alasan, bmd: d.bmd }, Object.assign({}, psjImp.info, { baris: d.baris })); psjImp = null; toast('Data mail merge persetujuan diperbarui.'); return psjList(s); }
      if (a == 'reset') { psjMMReset(); toast('Data bawaan dikembalikan.'); return psjList(s); }
    }
    const re = () => psjList(s);
    const u = e.target.closest('[data-ba]'); if (u) return ptBaPick(u.dataset.ba, re);
    const v = e.target.closest('[data-bv]'); if (v) return ptBaPreview(v.dataset.bv, re);
    const ed = e.target.closest('[data-be]'); if (ed && !ed.disabled) return ptBaPick(ed.dataset.be, re);
    const dl = e.target.closest('[data-bd]'); if (dl && !dl.disabled) return ptBaDel(dl.dataset.bd, re);
    const b = e.target.closest('[data-psj]'); if (b) { psjCur = b.dataset.psj; pgPsj(); window.scrollTo(0, 0); }
  };
}

/* Halaman 2: Form Persetujuan */
const psjIn = (k, j, v, o = {}) => `<label class="l2${o.full ? ' full' : ''}">${psjLabel(k, j)}` +
  (o.area ? `<textarea id="p_${k}" rows="${o.rows || 3}" placeholder="${esc(o.ph || '')}">${esc(v)}</textarea>`
    : `<input id="p_${k}" type="${o.t || 'text'}" value="${esc(v)}" placeholder="${esc(o.ph || '')}"${o.list ? ' list="' + o.list + '" autocomplete="off"' : ''}>`) + `</label>`;
function psjForm(s) {
  const no = psjCur, d = R.find(x => x[0] == no), S = SVS[no];
  if (!d || !S) { psjCur = null; return psjList(s); }
  const j = psjJenis(d), IB = j == 'Izin Bongkar', def = psjDefault(d), f = psjMerge(def, S.psj && S.psj.f), st = psjStat(no);
  const bmdSaran = [...new Set([...(typeof PT_BMD != 'undefined' ? PT_BMD : []), ...PSJ_MM.bmd])];
  const tujSaran = [...new Set((IB ? PSJ_MM.yth : PSJ_MM.tujuan).map(x => x[1]))];
  const fld = k => ({
    nomor: () => psjIn(k, j, f[k], { ph: 'Contoh: 000.2.3.2/1002-BKAD' }),
    tgl: () => psjIn(k, j, f[k], { t: 'date' }),
    perihal: () => psjIn(k, j, f[k], { ph: 'Perihal persetujuan' }),
    tujuan: () => psjIn(k, j, f[k], { ph: IB ? 'Contoh: Kepala Dinas Pemuda dan Olahraga Kota Bogor' : 'Contoh: Kepala Badan Pendapatan Daerah Kota Bogor', list: 'psj_dl_t' }),
    alasan: () => `<label class="l2 full">Isi alasan dari data persetujuan sebelumnya<select id="p_alasan_pick"><option value="">Pilih alasan…</option>${PSJ_MM.alasan.map((a, i) => `<option value="${i}">${esc(a[0])} - ${esc(a[1].length > 100 ? a[1].slice(0, 100) + '…' : a[1])}</option>`).join('')}</select></label>` + psjIn(k, j, f[k], { area: 1, full: 1, rows: 3, ph: 'Contoh: dalam rangka penataan dan pengembangan kawasan' }),
    opd: () => psjIn(k, j, f[k], { ph: 'Nama OPD pemohon' }),
    nopermohonan: () => psjIn(k, j, f[k], { ph: 'Nomor Surat Permohonan' }),
    tglpermohonan: () => psjIn(k, j, f[k], { t: 'date' }),
    perihalpermohonan: () => psjIn(k, j, f[k], { area: 1, full: 1, rows: 2, ph: 'Perihal surat permohonan' }),
    bmd: () => psjIn(k, j, f[k], { ph: 'Ketik nama BMD, contoh: Peralatan dan mesin dalam bentuk scrap', list: 'psj_dl_b' })
  }[k]());
  s.innerHTML =
    `<div class="pt-hd"><button class="btn o sm" data-a="bk">← Kembali ke daftar</button><div><h1>Dokumen Persetujuan ${esc(no)}</h1><p>${esc(d[1])} · ${esc(j)}</p></div><span style="margin-left:auto">${PL(st[0], st[1])}</span></div>` +
    ptSec('Input Dokumen Persetujuan', 'Persetujuan Kepala Daerah mengikuti jenis permohonan yang diajukan.',
      `<div class="ff">${PSJ_ORD[j].map(fld).join('')}</div><div class="psj-act"><button type="button" class="btn o" data-a="draft">Simpan Draft</button><button type="button" class="btn" data-a="simpan">Simpan Data ${esc(j)}</button></div>`) +
    `<datalist id="psj_dl_t">${tujSaran.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="psj_dl_b">${bmdSaran.map(x => `<option value="${esc(x)}">`).join('')}</datalist>` +
    ptSec('Pratinjau Surat Persetujuan', 'Isi pratinjau mengikuti isian di atas dan template surat Word.', `<div class="pt-bar"><button class="btn o sm" data-a="prev">Perbarui Pratinjau</button><button class="btn o sm" data-a="print">Cetak / Simpan PDF</button><button class="btn sm" data-a="docx">Unduh Word (.docx)</button></div><div class="pt-prev"><div class="bap" id="p_prev"></div></div>`);
  if (!$('#psj_css')) { const c = document.createElement('style'); c.id = 'psj_css'; c.textContent = PSJ_CSS; document.head.appendChild(c); }
  let autoT = def.tujuan;
  psjRender(j);
  s.oninput = s.onchange = e => {
    const id = e.target.id || '';
    if (id == 'p_alasan_pick') { const a = PSJ_MM.alasan[e.target.value]; if (a) $('#p_alasan').value = a[1]; }
    if (id == 'p_opd' && e.type == 'change') {
      const t = $('#p_tujuan'), nt = psjTujuanDef(e.target.value.trim(), j);
      if (t && (!t.value.trim() || t.value == autoT)) { t.value = nt; autoT = nt; }
    }
    if (id.startsWith('p_')) psjRender(j);
  };
  s.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, F = psjCollect(j);
    if (a == 'bk') { psjCur = null; return pgPsj(); }
    if (a == 'prev') { psjRender(j); return toast('Pratinjau diperbarui.'); }
    if (a == 'print') return psjPrint(F, j, psjCur);
    const miss = psjMissing(F, j);
    if (a == 'docx') {
      if (miss.length) return toast('Lengkapi dulu: ' + miss.join(', ') + '.');
      b.disabled = true;
      psjDocx(psjCur, F, j).then(blob => {
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob);
        l.download = 'Persetujuan ' + j + ' - ' + psjCur.replace(/[\\/:*?"<>|]/g, '-') + '.docx';
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
        toast('Dokumen Word berhasil dibuat.');
      }).catch(err => { console.error(err); toast('Gagal membuat dokumen Word.'); }).finally(() => { b.disabled = false; });
      return;
    }
    const sudah = psjOk(psjCur);            // persetujuan yang sudah terbit tidak diturunkan lagi menjadi Draft
    if ((a == 'simpan' || sudah) && miss.length) return toast('Lengkapi dulu: ' + miss.join(', ') + '.', 'err');
    const T = SVS[psjCur]; if (!T) return;
    T.psj = { f: F, st: (a == 'simpan' || sudah) ? 'Tersimpan' : 'Draft', ts: nowStr() };
    /* Pemicu otomatis: persetujuan terbit -> status permohonan menjadi Disetujui -> terbuka di Permohonan Penaksiran (Pengguna Barang) */
    let lanjut = false;
    const dd = R.find(r => r[0] == psjCur);
    if (T.psj.st == 'Tersimpan' && dd && dd[6] == 'Dalam Proses') { dd[6] = 'Disetujui'; hs(psjCur, 'Persetujuan Kepala Daerah terbit', 'Nomor ' + (F.nomor || '-') + ' · lanjut ke Permohonan Penaksiran'); lanjut = true; }
    Store.persist();
    toast(lanjut ? 'Persetujuan tersimpan. Permohonan kini lanjut ke Permohonan Penaksiran (Pengguna Barang).' : a == 'simpan' || sudah ? 'Data persetujuan tersimpan.' : 'Draft persetujuan disimpan.', 'ok');
    psjCur = null; pgPsj();
  };
}
function pgPsj() { const s = $('#psj'); return psjCur ? psjForm(s) : psjList(s); }