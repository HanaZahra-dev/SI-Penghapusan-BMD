/* Modul 2 - Laporan Penaksiran (setelah Kertas Kerja Penaksiran)
   Menghasilkan dokumen Word "Laporan Penaksiran atas Barang Milik Daerah" dari template resmi
   (Laporan_Penaksiran_Bapperida_Seragam_Lampiran_Baru.docx).
   Isi otomatis dari: data permohonan awal, Permohonan Penaksiran (nomor surat + tanggal), BA Penelitian, Survei Lapangan,
   Persetujuan Kepala Daerah, Daftar Objek Penaksiran, dan hasil Kertas Kerja Penaksiran (harga/kg, pembanding, nilai taksiran).
   Isian yang tidak tersedia diisi "-". Gambar/foto kertas kerja pada Word dikosongkan (belum tersedia).
   Data: LPN[noPermohonan] = { f: {...isian}, ts, dl:boolean } */
const LPN = {};
let lwCur = null;
const LW_STRIP = '-';
const LW_SK_DEF = { nosk: '000.2.3.2/Kep.101-BKAD/2026', tglsk: '2026-03-04', tentangsk: 'Perubahan Surat keputusan Wali Kota Bogor Nomor 000.2.3.2/Kep.113-BKAD/2025 tentang Pembentukan Panitia Penaksir Harga Barang Milik Daerah Pemerintah Kota Bogor' };
const LW_TIM_DEF = [['Mega Citra Arifani, S.IP., M.Tr.I.P.', '199302232015072001'], ['Muhammad Aziz Hafiidhulhaq, A.Md.M.', '200011062023021004'], ['Intan Hidjriyani, A.Md.M.', '200104122023022001']];

/* ---------- utilitas ---------- */
const lwV = x => { const s = String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); return s || LW_STRIP; };
const lwTg = x => { const m = String(x || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? (+m[3]) + ' ' + pjCap(PJ_BLN[+m[2] - 1]) + ' ' + m[1] : LW_STRIP; };
const lwN = (n, d) => (Math.round((+n || 0) * 1000) / 1000).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 2 : d });
const lwRp = n => 'Rp' + Math.round(+n || 0).toLocaleString('id-ID');
const lwTerb = n => pjTerbilang(Math.round(+n || 0)) + ' rupiah';
const lwLc = s => { s = String(s || ''); return /[A-Z]{2}|\b[A-Z]\./.test(s) ? s : s.toLowerCase(); };
const lwLcFirst = s => { s = String(s || ''); return s ? s[0].toLowerCase() + s.slice(1) : s; };
const lwDan = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' dan ' + a[a.length - 1];
const lwList = () => { pjSiap(); return OB.filter(p => p.no && kkAllDone(p)); };
const lwDok = no => LPN[no] || null;

/* ---------- perhitungan dari objek & kertas kerja ---------- */
function lwHitung(p) {
  const no = p.tksNo || p.no, objs = [], g = {}, nm = {};
  p.o.forEach((o, i) => {
    const ki = (typeof K != 'undefined' && o.kib) ? K.find(k => k[0] == o.kib) : null, nl = Math.round(kkNilai(p, i).nl || 0), kg = kkQkg(o) || 0;
    const mp = String(o.mp || 'Lainnya'), nama = o.n || (ki && ki[2]) || '-';
    const jenis = SK_JENIS_BANGUNAN.test(nama) ? 'Material Gedung dan Bangunan' : 'Peralatan dan Mesin';
    const r = { i, kib: o.kib || '-', kode: o.k || (ki && ki[1]) || '-', nama, tahun: o.th || (ki && ki[3]) || '-', kond: skKon(o.kd || (ki && ki[4])), bahan: skCapNama(o.bh || o.mp || '-'), mp, kg, nl, jenis, pasar: isPas(o), jl: o.jl || 'Lelang' };
    objs.push(r);
    const G = g[mp] = g[mp] || { mp, n: 0, kg: 0, nilai: 0, pasar: true, jl: {}, jenis: {} };
    G.n++; G.kg += kg; G.nilai += nl; G.pasar = G.pasar && r.pasar; G.jl[r.jl] = 1; G.jenis[jenis] = 1;
    const N = nm[nama] = nm[nama] || { nama, n: 0 }; N.n++;
  });
  const grup = Object.values(g).map(G => {
    G.label = G.mp == 'Lainnya' ? 'Material lainnya' : skCapNama(G.mp) + ' campuran';
    G.harga = G.kg > 0 ? G.nilai / G.kg : 0;
    return G;
  });
  const total = grup.reduce((a, x) => a + x.nilai, 0), kg = grup.reduce((a, x) => a + x.kg, 0);
  const jenis = [...new Set(objs.map(o => o.jenis))];
  const jl = [...new Set(objs.map(o => o.jl))];
  return { no, objs, grup, nama: Object.values(nm), total, kg, jenis, jenisTxt: jenis.map(lwLc).join(' serta ') || 'peralatan dan mesin', jenisCap: lwDan(jenis), jl, hasPasar: objs.some(o => o.pasar), hasBiaya: objs.some(o => !o.pasar) };
}

/* ---------- isian bawaan dari modul-modul sebelumnya ---------- */
function lwDefault(p) {
  const no = p.tksNo || p.no, d = R.find(r => r[0] == no) || R.find(r => r[0] == p.no) || [], ff = (RX[no] || {}).f || {}, tks = (RX[no] || {}).tks || {};
  const pen = (PEN[no] && PEN[no].f) || {}, sv = SVS[no] || {}, ps = sv.psj || {}, pf = ps.f || {}, h = lwHitung(p), n = p.o.length;
  const mek = h.jl.length == 1 ? (h.jl[0] == 'Langsung' ? 'penjualan langsung' : 'penjualan melalui lelang') : 'penjualan langsung dan penjualan melalui lelang';
  const tim = {}; LW_TIM_DEF.forEach((t, i) => { tim['tim' + (i + 1) + 'n'] = t[0]; tim['tim' + (i + 1) + 'p'] = t[1]; });
  return Object.assign({
    nolaporan: '', tgllaporan: today(), tglpenilaian: today(),
    noawal: ff.no || d[0] || no, tglawal: /^\d{4}-\d{2}-\d{2}$/.test(ff.tgl || '') ? ff.tgl : '', perihalawal: ff.pf || d[10] || p.pf || '',
    nopen: tks.nomorSurat || '', tglpen: tks.tglPenaksiran || '', perihalpen: '',
    nopersetujuan: pf.nomor || '', tglpersetujuan: pf.tgl || '', perihalpersetujuan: pf.perihal || '',
    nobap: pen.nobap || '', tglbap: pen.tgl || '', tglsurvei: sv.tgl || '',
    opd: p.pd || d[1] || '', alamat: alamatPermohonan(no) || p.al || '',
    tujuan: 'Menentukan Nilai Taksiran dalam rangka pemindahtanganan melalui mekanisme ' + mek,
  }, LW_SK_DEF, tim);
}
const lwF = p => Object.assign(lwDefault(p), (lwDok(p.no) || {}).f || {});
const LW_FIELDS = ['nolaporan', 'tgllaporan', 'tglpenilaian', 'noawal', 'tglawal', 'perihalawal', 'nopen', 'tglpen', 'perihalpen', 'nopersetujuan', 'tglpersetujuan', 'perihalpersetujuan', 'nobap', 'tglbap', 'tglsurvei', 'nosk', 'tglsk', 'tentangsk', 'opd', 'alamat', 'tujuan', 'tim1n', 'tim1p', 'tim2n', 'tim2p', 'tim3n', 'tim3p'];
const lwCollect = () => { const f = {}; LW_FIELDS.forEach(q => { const e = document.getElementById('lw_' + q); f[q] = e ? e.value.trim() : ''; }); return f; };

/* ---------- teks dokumen ---------- */
function lwTokens(f, p, h) {
  const opd = lwV(f.opd), alamat = String(f.alamat || '').replace(/[.\s]+$/, ''), lokasi = alamat ? ' yang berlokasi di ' + alamat : '', n = h.objs.length;
  const uraianCap = n + ' (' + pjCap(pjTerbilang(n)) + ') Unit ' + pjCap(h.jenisTxt).replace(/ Dan /g, ' dan ').replace(/ Serta /g, ' serta ') + ' dalam Bentuk Limbah Padat (Scrap)';
  const uraian = n + ' (' + pjTerbilang(n) + ') unit ' + h.jenisTxt + ' dalam bentuk limbah padat (scrap)';
  const matTxt = lwDan(h.grup.map(x => x.label.toLowerCase())) || '-';
  const kg = lwN(h.kg), nilai = Math.round(h.total), tujuan = lwV(f.tujuan);
  const pend = h.hasPasar && h.hasBiaya ? 'Pendekatan Pasar dengan Metode Perbandingan Data Pasar dan Pendekatan Biaya' : h.hasBiaya ? 'Pendekatan Biaya' : 'Pendekatan Pasar dengan Metode Perbandingan Data Pasar';
  const tglNil = lwTg(f.tglpenilaian), hal = f.perihalpen ? ' Hal ' + f.perihalpen : '';
  const suratPen = 'Nomor ' + lwV(f.nopen) + ' tanggal ' + lwTg(f.tglpen);

  /* Deskripsi objek: n unit per nama barang */
  const multi = h.nama.filter(x => x.n > 1).sort((a, b) => b.n - a.n), single = h.nama.filter(x => x.n == 1);
  let desk = multi.map(x => x.n + ' unit ' + lwLc(x.nama));
  if (desk.length > 14) desk = desk.slice(0, 14).concat(['barang lainnya']);
  let deskTxt = lwDan(desk);
  if (single.length) deskTxt += (deskTxt ? ', serta masing-masing 1 unit ' : '1 unit ') + lwDan(single.slice(0, 14).map(x => lwLc(x.nama))) + (single.length > 14 ? ' dan lainnya' : '');
  const timbang = h.grup.map(x => 'limbah ' + x.label.toLowerCase() + ' seberat ' + lwN(x.kg) + ' kg');
  const L_E = 'Objek penaksiran berupa ' + n + ' (' + pjTerbilang(n) + ') unit BMD ' + h.jenisCap + ' pada ' + opd + (deskTxt ? ', terdiri atas ' + deskTxt : '') + '. Objek sudah tidak dapat dimanfaatkan sesuai fungsinya sehingga dinilai dalam bentuk limbah padat (scrap). Berdasarkan hasil penimbangan, objek terdiri atas ' + (lwDan(timbang) || '-') + ' (total ' + kg + ' kg). Rincian barang tercantum dalam Lampiran 1.';

  /* Paragraf pembanding per material */
  const para = h.grup.map(G => {
    const d = G.pasar ? kkMatData(p, G.mp, false) : null, jl = G.pasar ? kkJl(p, G.mp, d) : (G.jl.Langsung && !G.jl.Lelang ? 'Langsung' : 'Lelang'), hz = d ? kkHitung(d, jl) : null;
    if (!G.pasar) return 'Limbah ' + G.label.toLowerCase() + '. Nilai taksiran ditentukan dengan Pendekatan Biaya berdasarkan kertas kerja penaksiran, dengan nilai taksiran sebesar ' + lwRp(G.nilai) + (G.kg > 0 ? ' untuk berat ' + lwN(G.kg) + ' kg' : '') + '.';
    if (!hz || !hz.ok) return 'Limbah ' + G.label.toLowerCase() + '. Nilai per kilogram ditetapkan berdasarkan kertas kerja penaksiran sebesar ' + lwRp(G.harga) + '.';
    const pb = d.pb.slice(0, 3), nama = lwDan(pb.map(x => x.l + (x.a ? ' (' + x.a + ')' : ''))), hs = pb.map(x => +x.h), sama = hs.every(x => x == hs[0]);
    const adj0 = (d.adj || []).every(r => (r || []).every(v => !(+v)));
    let t = 'Limbah ' + G.label.toLowerCase() + '. Tiga data pembanding, yaitu ' + nama + ', memberikan harga beli ' + (sama ? 'yang sama sebesar ' + lwRp(hs[0]) + '/kg' : 'masing-masing sebesar ' + lwDan(hs.map(x => lwRp(x) + '/kg'))) + '. ';
    t += adj0 ? 'Seluruh faktor perbandingan dinilai setara dengan objek sehingga tidak diperlukan penyesuaian (0%). ' : 'Setelah dilakukan penyesuaian transaksional dan nontransaksional atas masing-masing pembanding, diperoleh indikasi nilai sebesar ' + lwDan(hz.pb.map(x => lwRp(x.i2) + '/kg')) + '. ';
    t += 'Dengan pembobotan ' + hz.wp.map(x => lwN(x, 4) + '%').join(' : ') + ', ' + (hz.br ? 'diperoleh nilai ' + lwRp(hz.perkg) + '/kg yang dikurangi bea lelang ' + lwN(hz.br * 100) + '% (' + lwRp(hz.bea) + ') dan dibulatkan sehingga ' : '') + 'nilai per kilogram limbah ' + G.label.toLowerCase() + ' ditetapkan sebesar ' + lwRp(hz.bulat) + '.';
    return t;
  });

  /* Analisis pasar */
  const hargaTxt = lwDan(h.grup.map(x => lwRp(x.harga) + '/kg untuk ' + x.label.toLowerCase()));
  const semuaSama = h.grup.every(G => { const d = G.pasar ? kkMatData(p, G.mp, false) : null; return !d || d.pb.slice(0, 3).every(x => x && +x.h == +d.pb[0].h); });
  const topNama = h.nama.slice().sort((a, b) => b.n - a.n).slice(0, 6).map(x => lwLc(x.nama));
  const AP = {
    AP_1: 'Objek berupa ' + n + ' unit ' + h.jenisTxt + (topNama.length ? ' (' + topNama.join(', ') + ', dan lainnya)' : '') + ' yang sudah tidak dapat digunakan untuk menunjang pelaksanaan tugas dan fungsi ' + opd + ', sehingga tidak lagi memiliki produktivitas sesuai fungsi asalnya. Nilai ekonomis yang tersisa terletak pada material penyusunnya yang dapat didaur ulang' + (h.grup.length ? ', terutama ' + lwDan(h.grup.map(x => x.mp.toLowerCase())) : '') + '.',
    AP_2: 'Pasar objek adalah pasar limbah padat (scrap) yang terdiri atas pengepul, lapak barang bekas, dan penampung logam di wilayah Kota Bogor dan Kabupaten Bogor. Transaksi pada pasar ini menggunakan harga timbang (kiloan) secara tunai, dan biaya angkut dari lokasi pada umumnya ditanggung oleh pembeli.',
    AP_3: 'Permintaan terhadap limbah ' + lwDan(h.grup.map(x => x.mp.toLowerCase())) + ' relatif stabil karena didorong kebutuhan bahan baku industri peleburan dan daur ulang. Banyaknya pelaku usaha penampung di sekitar Bogor menunjukkan bahwa permintaan atas limbah padat sejenis tersedia secara berkelanjutan.',
    AP_4: 'Pasokan limbah padat berasal dari rumah tangga, perkantoran, dan kegiatan usaha dalam jumlah yang cukup besar. ' + (semuaSama ? 'Harga beli antarpenampung cenderung seragam, sebagaimana ditunjukkan oleh ketiga data pembanding untuk masing-masing jenis material yang memberikan harga yang sama.' : 'Harga beli antarpenampung relatif berdekatan, sebagaimana ditunjukkan oleh ketiga data pembanding untuk masing-masing jenis material, dan selisihnya diperhitungkan melalui penyesuaian serta pembobotan.'),
    AP_5: (semuaSama ? 'Keseragaman harga pada data pembanding' : 'Kedekatan harga pada data pembanding') + ' (' + hargaTxt + ') mengindikasikan bahwa pasar berada dalam kondisi seimbang dan harga yang terbentuk mencerminkan harga pasar wajar pada waktu penaksiran.',
    AP_6: 'Objek memiliki marketabilitas yang baik karena volumenya relatif kecil (' + kg + ' kg), mudah diangkut, telah dipilah berdasarkan jenis material, dan dapat diserap oleh pasar penampung dalam waktu singkat.',
    AP_HBU: 'Analisis Penggunaan Tertinggi dan Terbaik (Highest and Best Use Analysis) tidak dilakukan karena objek penaksiran merupakan Barang Milik Daerah selain tanah dan/atau bangunan, yaitu ' + h.jenisTxt + ' dalam bentuk limbah padat (scrap). Hal ini mengacu pada Lampiran I Bab II huruf C angka 5 huruf a Keputusan Direktur Jenderal Kekayaan Negara Nomor KEP-29/KN/2025 tentang Standar Laporan Penilaian oleh Penilai Pemerintah, yang mengatur bahwa analisis penggunaan tertinggi dan terbaik hanya dilakukan untuk objek penilaian properti berupa tanah atau tanah dan bangunan.'
  };

  const tim = [1, 2, 3].map(i => ({ n: String(f['tim' + i + 'n'] || '').trim(), p: String(f['tim' + i + 'p'] || '').trim() })).filter(x => x.n);
  const ketua = tim[0] || { n: '', p: '' };

  return Object.assign({
    NO_LAPORAN: lwV(f.nolaporan), TGL_LAPORAN: lwTg(f.tgllaporan),
    JUDUL_UP: skUp('Laporan Penaksiran atas Barang Milik Daerah Berupa ' + uraianCap + ' pada ' + opd + lokasi),
    ATAS_PERMOHONAN_UP: skUp('Atas Permohonan Kepala ' + opd), TUJUAN_UP: skUp('Dengan Tujuan ' + tujuan), TGL_PENILAIAN: tglNil,
    YTH: 'Yth. Kepala ' + opd,
    HAL: 'Hal : Laporan Penaksiran atas Barang Milik Daerah Berupa ' + uraianCap + ' pada ' + opd + lokasi.replace(/ yang berlokasi di /, ' yang Berlokasi di '),
    P_SEHUBUNGAN: 'Sehubungan dengan Surat Kepala ' + opd + ' Nomor ' + lwV(f.noawal) + ' tanggal ' + lwTg(f.tglawal) + (f.perihalawal ? ' Hal ' + f.perihalawal : '') + ' dan surat permohonan penaksiran ' + suratPen + hal + ', serta Surat Wali Kota Bogor Nomor ' + lwV(f.nopersetujuan) + ' tanggal ' + lwTg(f.tglpersetujuan) + (f.perihalpersetujuan ? ' Hal ' + f.perihalpersetujuan : '') + ', dan sesuai dengan Surat Keputusan Wali Kota Bogor Nomor ' + lwV(f.nosk) + ' tanggal ' + lwTg(f.tglsk) + (f.tentangsk ? ' tentang ' + f.tentangsk : '') + ', dengan ini kami sampaikan laporan Penaksiran ringkas atas objek Penaksiran dimaksud dengan tujuan ' + lwLcFirst(tujuan) + '. Laporan Penaksiran dengan keseluruhan isi beserta lampirannya menjelaskan rincian pendekatan dan metode Penaksiran serta data pendukung yang digunakan dalam analisis Penaksiran dimaksud sesuai dengan penelitian lapangan yang telah kami lakukan.',
    P_SETELAH: 'Setelah melakukan survei lapangan ke lokasi objek Penaksiran, melakukan penimbangan, mengumpulkan data yang berkaitan dengan objek Penaksiran, menganalisis, membandingkan dan melakukan penyesuaian atas semua faktor yang relevan yang turut memengaruhi nilai, kami mengambil simpulan bahwa Nilai Taksiran atas Barang Milik Daerah (BMD) berupa ' + uraian + ' dengan total berat ' + kg + ' kg pada ' + opd + lokasi + ', pada tanggal ' + tglNil + ' adalah sebagai berikut:',
    TERBILANG: lwTerb(nilai), S_TOT_KG: lwN(h.kg), S_TOT_NILAI: lwRp(nilai),
    KETUA_NAMA: lwV(ketua.n), KETUA_NIP: lwV(ketua.p),
    RK_OBJEK: uraian + (matTxt != '-' ? ' berupa ' + matTxt : ''), RK_ALAMAT: lwV(alamat), RK_PEMILIK: opd,
    RK_JUMLAH: n + ' (' + pjTerbilang(n) + ') unit dengan total berat ' + kg + ' kg' + (h.grup.length ? ' (' + h.grup.map(x => x.mp.toLowerCase() + ' ' + lwN(x.kg) + ' kg').join(', ').replace(/, ([^,]*)$/, ' dan $1') + ')' : ''),
    RK_PENDEKATAN: pend, RK_NILAI: lwRp(nilai) + ' (' + lwTerb(nilai) + ')',
    L_A: 'Surat Kepala ' + opd + ' ' + suratPen + hal,
    L_B1: '1. SK Wali Kota Bogor Nomor ' + lwV(f.nosk) + ' tanggal ' + lwTg(f.tglsk) + (f.tentangsk ? ' tentang ' + f.tentangsk : '') + ' ;',
    L_B2: '2. Surat Permohonan Penaksiran dari Kepala ' + opd + ' ' + suratPen + (f.perihalpen ? ' perihal ' + f.perihalpen : ''),
    L_C: tujuan, L_E, L_F: lwV(alamat),
    L_H1: '1. Berita Acara Penelitian Nomor ' + lwV(f.nobap) + ' tanggal ' + lwTg(f.tglbap) + ';', L_H2: '2. Survei lapangan dan penimbangan objek tanggal ' + lwTg(f.tglsurvei) + '.',
    L_I: tglNil, L_J: pend,
    A_INTRO: 'Tim Penaksir menggunakan ' + pend + ' dalam menentukan nilai taksiran objek penaksiran. ' + (h.hasPasar ? 'Pendekatan Pasar merupakan pendekatan penilaian yang menghasilkan indikasi nilai dengan cara membandingkan objek penaksiran dengan objek sejenis yang informasi harganya tersedia di pasar. Mengingat objek penaksiran berupa limbah padat (scrap) yang diperjualbelikan berdasarkan berat (harga timbang), satuan pembanding yang digunakan adalah harga per kilogram untuk setiap jenis material. ' : '') + (h.hasBiaya ? 'Pendekatan Biaya digunakan untuk objek yang nilainya tidak dibandingkan langsung dengan data pasar, dengan nilai taksiran ditetapkan berdasarkan kertas kerja penaksiran. ' : '') + 'Penaksiran dilakukan dengan cara:',
    A_LANGKAH1: 'Memilah objek berdasarkan jenis material dominan (' + matTxt + '), kemudian menimbang masing-masing jenis untuk memperoleh berat objek;',
    M_TOT_KG: lwN(h.kg), M_TOT_NILAI: lwN(nilai, 0),
    SIMPULAN: 'Berdasarkan data dan informasi, analisis data, asumsi, dan kondisi pembatas, menurut kami opini Nilai Taksiran atas Barang Milik Daerah (BMD) berupa ' + uraian + ' dengan total berat ' + kg + ' kg pada ' + opd + lokasi + ', pada tanggal ' + tglNil + ' adalah sebesar:',
    J_TOT_KG: lwN(h.kg), J_TOT_NILAI: lwN(nilai, 0),
    D_TOT_LABEL: 'Jumlah (' + n + ' unit)', D_TOT_KG: lwN(h.kg), D_TOT_NILAI: LW_STRIP, N_TOT: String(n)
  }, AP, { _para: para, _tim: tim });
}

/* ---------- pembuatan dokumen Word ---------- */
const lwParaBounds = (x, tok) => { const i = x.indexOf(tok); if (i < 0) return null; const a = Math.max(x.lastIndexOf('<w:p ', i), x.lastIndexOf('<w:p>', i)); return [a, x.indexOf('</w:p>', i) + 6]; };
async function lwDocx(p, f) {
  if (typeof JSZip == 'undefined' || typeof LP_TPL_B64 == 'undefined') throw new Error('JSZip / template belum termuat');
  const bin = atob(LP_TPL_B64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), h = lwHitung(p), m = lwTokens(f, p, h), nilai = Math.round(h.total);
  const fill = (s, map) => s.replace(/\{\{([A-Z0-9_]+)\}\}/g, (a, q) => q in map ? pjXml(map[q]) : a);
  let x = await z.file('word/document.xml').async('string');

  /* 1. paragraf per material (pembanding) */
  const pb = lwParaBounds(x, '{{M_PARA}}');
  if (pb) { const par = x.slice(pb[0], pb[1]), items = m._para.length ? m._para : [LW_STRIP]; x = x.slice(0, pb[0]) + items.map(t => fill(par, { M_PARA: t })).join('') + x.slice(pb[1]); }
  /* 2. blok kertas kerja per material (gambar dikosongkan) */
  const ks = lwParaBounds(x, '[[K_START]]'), ke = lwParaBounds(x, '[[K_END]]');
  if (ks && ke) { const inner = x.slice(ks[1], ke[0]); x = x.slice(0, ks[0]) + (h.grup.length ? h.grup.map(G => fill(inner, { K_LABEL: G.label })).join('') : fill(inner, { K_LABEL: LW_STRIP })) + x.slice(ke[1]); }

  /* 3. baris tabel berulang */
  const sRows = h.grup.map((G, i) => ({ S_NO: i + 1, S_OBJ: 'Limbah padat (scrap) jenis ' + G.label.toLowerCase() + ' dari BMD berupa ' + lwDan(Object.keys(G.jenis)) + (G.harga > 0 ? ' (harga satuan ' + lwRp(G.harga) + '/kg)' : ''), S_KG: lwN(G.kg), S_NILAI: lwRp(G.nilai) }));
  const mRows = h.grup.map((G, i) => ({ M_NO: i + 1, M_JENIS: skCapNama(G.label), M_KG: lwN(G.kg), M_HARGA: lwN(G.harga, 0), M_NILAI: lwN(G.nilai, 0) }));
  const jRows = h.grup.map(G => ({ J_NAMA: skCapNama(G.label), J_KG: lwN(G.kg), J_HARGA: lwN(G.harga, 0), J_NILAI: lwN(G.nilai, 0) }));
  const dRows = h.objs.map((o, i) => ({ D_NO: i + 1, D_NAMA: o.nama, D_KODE: o.kode, D_KIB: o.kib, D_MERK: LW_STRIP, D_TAHUN: o.tahun, D_KOND: o.kond, D_BAHAN: o.bahan, D_KG: lwN(o.kg), D_NILAI: LW_STRIP }));
  const nGrp = {}; h.objs.forEach(o => { nGrp[o.nama] = (nGrp[o.nama] || 0) + 1; });
  const nRows = Object.keys(nGrp).map((k, i) => ({ N_NO: i + 1, N_NAMA: k, N_JML: nGrp[k] }));
  const pRows = []; h.grup.filter(G => G.pasar).forEach(G => { const d = kkMatData(p, G.mp, false); ((d && d.pb) || []).slice(0, 3).forEach(q => { if (q) pRows.push({ P_NO: pRows.length + 1, P_JENIS: skCapNama(G.mp), P_NAMA: lwV(q.l) + (q.kt ? ' / ' + q.kt : ''), P_ALAMAT: lwV(String(q.al || '').replace(/\s*\(\s*-?\d+[.,]\d+\s*,\s*-?\d+[.,]\d+\s*\)/g, '') || q.a), P_HARGA: lwN(q.h, 0) }); }); });
  const tRows = m._tim.map((t, i) => ({ T_NO: i + 1, T_NAMA: t.n + (t.p ? ' / ' + t.p : '') + (i == 0 ? ' (Ketua)' : '') }));
  const kosong = { S_NO: '', S_OBJ: LW_STRIP, S_KG: LW_STRIP, S_NILAI: LW_STRIP, M_NO: '', M_JENIS: LW_STRIP, M_KG: LW_STRIP, M_HARGA: LW_STRIP, M_NILAI: LW_STRIP, J_NAMA: LW_STRIP, J_KG: LW_STRIP, J_HARGA: LW_STRIP, J_NILAI: LW_STRIP, D_NO: '', D_NAMA: LW_STRIP, D_KODE: LW_STRIP, D_KIB: LW_STRIP, D_MERK: LW_STRIP, D_TAHUN: LW_STRIP, D_KOND: LW_STRIP, D_BAHAN: LW_STRIP, D_KG: LW_STRIP, D_NILAI: LW_STRIP, N_NO: '', N_NAMA: LW_STRIP, N_JML: LW_STRIP, P_NO: '', P_JENIS: LW_STRIP, P_NAMA: LW_STRIP, P_ALAMAT: LW_STRIP, P_HARGA: LW_STRIP, T_NO: '', T_NAMA: LW_STRIP };
  const rep = (row, tok, data) => (data.length ? data : [kosong]).map(r => fill(row, Object.assign({}, kosong, r))).join('');
  x = x.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, row => {
    if (row.includes('{{S_NO}}')) return rep(row, 'S', sRows);
    if (row.includes('{{M_NO}}')) return rep(row, 'M', mRows);
    if (row.includes('{{J_NAMA}}')) return rep(row, 'J', jRows);
    if (row.includes('{{D_NO}}')) return rep(row, 'D', dRows);
    if (row.includes('{{N_NO}}')) return rep(row, 'N', nRows);
    if (row.includes('{{P_NO}}')) return rep(row, 'P', pRows);
    if (row.includes('{{T_NO}}')) return rep(row, 'T', tRows);
    return row;
  });

  /* 4. token lainnya; sisa token tak dikenal diisi "-" */
  x = fill(x, m).replace(/\{\{[A-Z0-9_]+\}\}/g, LW_STRIP);
  /* susun ulang ZIP tanpa entri folder (agar aman dibuka/diedit lewat layanan cloud) */
  const z2 = new JSZip();
  for (const n of Object.keys(z.files)) { if (z.files[n].dir) continue; z2.file(n, n == 'word/document.xml' ? x : await z.files[n].async('uint8array'), { createFolders: false }); }
  return z2.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}

/* ---------- halaman daftar ---------- */
function lwRows(q) {
  q = (q || '').toLowerCase().trim();
  const r = lwList().filter(p => !q || (p.no + ' ' + p.pd + ' ' + (p.pf || '')).toLowerCase().includes(q));
  if (!r.length) return `<tr><td colspan="7" class="mt" style="text-align:center;padding:30px">${q ? 'Tidak ada hasil untuk pencarian tersebut.' : 'Belum ada permohonan yang siap. Permohonan muncul setelah semua Kertas Kerja Penaksirannya selesai.'}</td></tr>`;
  return r.map((p, i) => {
    const s = lwDok(p.no), f = lwF(p), h = lwHitung(p), st = s && s.dl ? ['s-g', 'Laporan Dibuat'] : s ? ['s-b', 'Draft Tersimpan'] : ['s-n', 'Belum Dibuat'];
    return `<tr><td>${i + 1}</td><td><b>${esc(p.no)}</b><div class="mt" style="font-size:12px">${esc(p.pd)}</div></td><td>${f.tglpen ? esc(skTgl(f.tglpen)) : '-'}<div class="mt" style="font-size:12px;max-width:340px">${esc(f.nopen || '-')}</div></td>` +
      `<td>${p.o.length} objek<div class="mt" style="font-size:12px">${lwN(h.kg)} Kg</div></td><td><b>${RP(h.total)}</b></td><td>${PL(st[0], st[1])}</td><td><button class="btn sm" data-lw="${esc(p.no)}">${s ? 'Lanjutkan' : 'Buat Laporan'}</button></td></tr>`;
  }).join('');
}
function pgLp() {
  const s = $('#lpr');
  if (lwCur && lwList().find(p => p.no == lwCur)) return lwDetail(s);
  lwCur = null;
  s.innerHTML = HD('Laporan Penaksiran') +
    ALR('Alur:', 'Kertas Kerja Penaksiran selesai &rarr; pilih permohonan &rarr; periksa nomor &amp; tanggal surat &rarr; Pratinjau &rarr; Unduh Word (.docx).') +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar Permohonan</h2><small class="mt">Muncul setelah semua Kertas Kerja Penaksiran selesai.</small></div><label class="sr2 pt-q"><svg class="i"><use href="#sq"></use></svg><input id="lw_q" placeholder="Cari nomor permohonan atau perangkat daerah…"></label></div>` +
    `<div class="tw"><table class="pt-t"><thead><tr><th>No</th><th>Permohonan</th><th>Surat Permohonan Penaksiran</th><th>Objek</th><th>Total Nilai Taksiran</th><th>Status Laporan</th><th>Aksi</th></tr></thead><tbody id="lw_tb">${lwRows('')}</tbody></table></div></div>`;
  s.oninput = e => { if (e.target.id == 'lw_q') $('#lw_tb').innerHTML = lwRows(e.target.value); };
  s.onchange = null;
  s.onclick = e => { const b = e.target.closest('[data-lw]'); if (b) { lwCur = b.dataset.lw; pgLp(); scrollTo(0, 0); } };
}
/* Dipanggil dari Kertas Kerja Penaksiran: buka langsung laporan permohonan tertentu */
function lwBuka(no) { show('lpr'); lwCur = no; pgLp(); scrollTo(0, 0); }

/* ---------- halaman detail ---------- */
function lwIn(q, label, val, o) {
  o = o || {};
  return `<label class="l2${o.full ? ' full' : ''}">${label}` + (o.t == 'area' ? `<textarea id="lw_${q}" rows="${o.rows || 2}" placeholder="${esc(o.ph || '')}">${esc(val)}</textarea>` : `<input id="lw_${q}" type="${o.t || 'text'}" value="${esc(val)}" placeholder="${esc(o.ph || '')}">`) + (o.note ? `<small class="mt">${o.note}</small>` : '') + `</label>`;
}
function lwDetail(s) {
  const no = lwCur, p = OB.find(x => x.no == no), f = lwF(p), h = lwHitung(p), dok = lwDok(no);
  const sec2 = (t, sub, body) => `<div class="cd pt-sec"><div class="ch"><div><h2>${t}</h2>${sub ? `<small class="mt">${sub}</small>` : ''}</div></div>${body}</div>`;
  const rekap = `<div class="tw"><table><thead><tr><th>No</th><th>Jenis Limbah Padat</th><th>Jumlah Objek</th><th>Pendekatan</th><th>Berat (Kg)</th><th>Nilai per Kg (Rp)</th><th>Nilai Taksiran (Rp)</th></tr></thead><tbody>${h.grup.map((G, i) => `<tr><td>${i + 1}</td><td>${esc(G.label)}</td><td>${G.n}</td><td>${G.pasar ? 'Pasar' : 'Biaya / campuran'}</td><td>${lwN(G.kg)}</td><td>${lwN(G.harga, 0)}</td><td>${lwN(G.nilai, 0)}</td></tr>`).join('')}<tr><td colspan="4"><b>TOTAL</b></td><td><b>${lwN(h.kg)}</b></td><td></td><td><b>${lwN(h.total, 0)}</b></td></tr></tbody></table></div>`;
  const tim = [1, 2, 3].map(i => `<div class="ff">${lwIn('tim' + i + 'n', i == 1 ? 'Nama Ketua Tim Penaksir (penandatangan)' : 'Nama Anggota ' + (i - 1), f['tim' + i + 'n'])}${lwIn('tim' + i + 'p', 'NIP', f['tim' + i + 'p'])}</div>`).join('');
  s.innerHTML = `<div class="pt-hd"><button class="btn o sm" data-a="bk">← Kembali ke daftar</button><div><h1>Laporan Penaksiran · ${esc(no)}</h1><p>${esc(p.pd)} · ${p.o.length} objek · ${dok ? 'Draft tersimpan ' + esc(dok.ts || '') : 'Belum disimpan'}</p></div></div>` +
    ALR('Terisi otomatis.', 'Nomor &amp; tanggal surat diambil dari Permohonan, Permohonan Penaksiran, BA Penelitian, Survei Lapangan, dan Persetujuan Kepala Daerah; tabel dari Daftar Objek &amp; Kertas Kerja. Kolom yang kosong akan tertulis "-" pada dokumen. Gambar kertas kerja pada Word dikosongkan.') +
    sec2('1. Nomor &amp; Tanggal Laporan', 'Dasar nomor surat laporan dari Bidang BMD.', `<div class="ff">${lwIn('nolaporan', 'Nomor Laporan Penaksiran', f.nolaporan, { ph: 'Contoh: 000.2.3.2/6382-Bid.BMD' })}${lwIn('tgllaporan', 'Tanggal Laporan', f.tgllaporan, { t: 'date' })}${lwIn('tglpenilaian', 'Tanggal Penilaian / Penaksiran', f.tglpenilaian, { t: 'date' })}</div>`) +
    sec2('2. Surat Permohonan Awal', 'Mengikuti data permohonan pengguna barang.', `<div class="ff">${lwIn('noawal', 'Nomor Permohonan (Awal)', f.noawal)}${lwIn('tglawal', 'Tanggal Permohonan (Awal)', f.tglawal, { t: 'date' })}${lwIn('perihalawal', 'Perihal Permohonan (Awal)', f.perihalawal, { t: 'area', full: 1 })}</div>`) +
    sec2('3. Surat Permohonan Penaksiran', 'Diambil dari menu Permohonan Penaksiran (nomor surat &amp; tanggal).', `<div class="ff">${lwIn('nopen', 'Nomor Permohonan Penaksiran', f.nopen)}${lwIn('tglpen', 'Tanggal Permohonan Penaksiran', f.tglpen, { t: 'date' })}${lwIn('perihalpen', 'Perihal Permohonan Penaksiran', f.perihalpen, { t: 'area', full: 1, ph: 'Boleh dikosongkan' })}</div>`) +
    sec2('4. Persetujuan Kepala Daerah, BA Penelitian &amp; Survei', '', `<div class="ff">${lwIn('nopersetujuan', 'Nomor Persetujuan Kepala Daerah', f.nopersetujuan)}${lwIn('tglpersetujuan', 'Tanggal Persetujuan', f.tglpersetujuan, { t: 'date' })}${lwIn('perihalpersetujuan', 'Perihal Persetujuan', f.perihalpersetujuan, { t: 'area', full: 1 })}${lwIn('nobap', 'Nomor BA Penelitian', f.nobap)}${lwIn('tglbap', 'Tanggal BA Penelitian', f.tglbap, { t: 'date' })}${lwIn('tglsurvei', 'Tanggal Survei Lapangan &amp; Penimbangan', f.tglsurvei, { t: 'date' })}</div>`) +
    sec2('5. Dasar Penugasan (SK Panitia Penaksir)', 'Terisi dari template; sesuaikan bila SK berubah.', `<div class="ff">${lwIn('nosk', 'Nomor SK Wali Kota', f.nosk)}${lwIn('tglsk', 'Tanggal SK', f.tglsk, { t: 'date' })}${lwIn('tentangsk', 'Tentang', f.tentangsk, { t: 'area', full: 1 })}</div>`) +
    sec2('6. Objek Penaksiran', '', `<div class="ff">${lwIn('opd', 'Perangkat Daerah / Pemilik Barang', f.opd)}${lwIn('alamat', 'Alamat Objek Penaksiran', f.alamat, { full: 1, note: 'Diambil dari alamat pada permohonan/survei.' })}${lwIn('tujuan', 'Tujuan Penaksiran', f.tujuan, { t: 'area', full: 1 })}</div>`) +
    sec2('7. Tim Penaksir', 'Terisi dari template; sesuaikan bila susunan tim berubah. Baris kosong tidak ditampilkan.', tim) +
    sec2('Lampiran (otomatis)', 'Daftar ' + h.objs.length + ' barang, rekap tonase, kertas kerja per material, dan data pembanding dibuat otomatis. Kolom Merk/Tipe dan Nilai Perolehan diisi "-" karena belum ada datanya.', rekap) +
    `<div class="sg-bar"><span>${dok ? 'Draft tersimpan' : 'Belum disimpan'}</span><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn o" data-a="reset">Muat Ulang dari Data Permohonan</button><button type="button" class="btn o" data-a="save">Simpan Draft</button><button type="button" class="btn o" data-a="prev">Pratinjau</button><button type="button" class="btn" data-a="docx">Unduh Word (.docx)</button></div></div>`;
  s.oninput = null; s.onchange = null;
  s.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a == 'bk') { lwCur = null; return pgLp(); }
    if (a == 'reset') return cfm('Muat ulang dari data permohonan?', 'Isian yang sudah diubah akan diganti dengan data terbaru dari permohonan dan modul sebelumnya.', () => { delete LPN[no]; Store.persist(); toast('Isian dimuat ulang dari data permohonan.'); pgLp(); }, 'Muat Ulang');
    const F = lwCollect();
    if (a == 'save') { LPN[no] = Object.assign(LPN[no] || {}, { f: F, ts: nowStr() }); Store.persist(); toast('Draft Laporan Penaksiran tersimpan.', 'ok'); return pgLp(); }
    b.disabled = true;
    lwDocx(p, F).then(async blob => {
      if (a == 'docx') {
        LPN[no] = Object.assign(LPN[no] || {}, { f: F, ts: nowStr(), dl: true }); Store.persist();
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'Laporan Penaksiran - ' + no.replace(/[\\/:*?"<>|]/g, '-') + '.docx';
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000); toast('Dokumen Laporan Penaksiran berhasil dibuat.', 'ok');
      } else {
        const html = await skPreviewHtml(blob);
        pjModal(`<div class="bamd-c" role="dialog" aria-modal="true"><div class="bamd-h"><div><b>Pratinjau Laporan Penaksiran</b><small class="mt">Isi mengikuti formulir; tata letak final ada pada file Word.</small></div><button type="button" class="ic-b" data-x="1" aria-label="Tutup">&times;</button></div><div class="bamd-b"><div class="pj-paper sk-prev">${html}</div></div></div>`);
      }
    }).catch(er => { console.error(er); toast('Gagal membuat dokumen: ' + er.message); }).finally(() => { b.disabled = false; });
  };
}
