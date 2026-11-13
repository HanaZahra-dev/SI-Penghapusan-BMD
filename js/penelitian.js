/* Modul 1 · Penelitian Tim Penghapusan
   1) Daftar Hasil Survei  2) Form Susun Berita Acara (6 bagian)
   3) Pratinjau BA         4) Unduh Word (.docx) dari template BA
   Dimuat SEBELUM script.js (helper esc, HD, PL, svRows, SVS, PEN, K, RX, R,
   penCur, toast, today, Store dipakai saat dijalankan, bukan saat dimuat). */
const PT_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const PT_BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/* Tim Penghapusan tetap (Anggota Tetap) */
const PT_TETAP = [
  ['Lia Kania Dewi, S.Si.,M.M.', 'NIP. 197001231999022001', 'Ketua'],
  ['Irfan Zacky Faizal, St. Mm', 'NIP. 197706252008011003', 'Sekretaris'],
  ['Agih Pribadi K., S.E., M.Si.', 'NIP.198503292011011001', 'Anggota Tetap'],
  ['Achmad Suwandi, S.E', 'NIP. 198109052006041019', 'Anggota Tetap'],
  ['Mega Citra Arifani, S.IP..M.tr.I.P', 'NIP. 199302232015072001', 'Anggota Tetap'],
  ['Ali Alfaraesy, S.STP.,M.Tr.I.P', 'NIP. 199606242018081004', 'Anggota Tetap'],
  ['Dini Andriani, S.I.P', 'NIP. 197410252006042014', 'Anggota Tetap']
];
const PT_JUDUL_KEP = 'Perubahan Atas Keputusan Wali Kota Bogor Nomor 000.2.3.2/Kep.10-BKAD/2025 Tahun 2025 tentang Pembentukan Tim Penelitian Dalam Rangka Penjualan, Pemusnahan, dan Penghapusan Barang Milik Daerah Pemerintah Daerah Kota Bogor';
const PT_REQ = [['nobap', 'Nomor BAP'], ['tgl', 'Tanggal BAP'], ['bmd', 'Nama BMD'], ['nosurat', 'Nomor surat permohonan'], ['tglsurat', 'Tanggal surat permohonan'], ['perihal', 'Perihal surat'], ['opd', 'OPD pemohon'], ['alamat', 'Alamat objek']];
const PT_LAMP_H = ['No', 'KIB ID', 'Kode Barang', 'Jumlah', 'Uraian', 'Tgl. Perolehan', 'Tahun Beli', 'Merk/Type', 'KIB', 'Harga', 'Keterangan'];
const ptLampRow = (x, i) => [i + 1, x.id, x.kode, x.qty + ' ' + x.sat, x.nama, '-', x.thn, '-', '-', '-', x.ket || '-'];
/* Data Acuan (mail merge) yang ada di Penelitian Tim Penghapusan
   Anggota tidak tetap berbeda per OPD. Format: [nama1, NIP1, nama2, NIP2, [OPD yang pernah memakai]] */
/* Pembaca file Excel mail merge (.xlsx) di browser, memakai JSZip  */
const ptDec = t => String(t).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (a, n) => String.fromCharCode(n)).replace(/&#x([0-9a-f]+);/gi, (a, n) => String.fromCharCode(parseInt(n, 16))).replace(/_x000D_/g, '').replace(/&amp;/g, '&');
const ptTxt = x => { let o = ''; String(x).replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, (a, t) => { o += t; }); return ptDec(o); };
const ptColN = ref => ref.replace(/\d+/g, '').split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
async function ptXlsxAll(buf) {
  const z = await JSZip.loadAsync(buf);
  const wbF = z.file('xl/workbook.xml'), relF = z.file('xl/_rels/workbook.xml.rels');
  if (!wbF || !relF) throw new Error('Berkas bukan file Excel (.xlsx) yang valid.');
  const wb = await wbF.async('string'), rels = await relF.async('string');
  const sheets = [...wb.matchAll(/<sheet\b[^>]*>/g)].map(m => ({ name: ptDec((m[0].match(/name="([^"]*)"/) || [])[1] || ''), rid: (m[0].match(/r:id="([^"]*)"/) || [])[1] }));
  const ssF = z.file('xl/sharedStrings.xml'), ss = ssF ? [...(await ssF.async('string')).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m => ptTxt(m[1])) : [];
  const out = [];
  for (const sh of sheets) {
    const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map(m => m[0]).find(t => t.includes('Id="' + sh.rid + '"'));
    const target = ((rel || '').match(/Target="([^"]*)"/) || [])[1];
    const sf = target && z.file(target.replace(/^\//, '').replace(/^(?!xl\/)/, 'xl/'));
    if (!sf) continue;
    const xml = await sf.async('string'), rows = [];
    for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row = [];
      for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const at = cm[1], ref = (at.match(/\br="([A-Z]+\d+)"/) || [])[1], t = (at.match(/\bt="([^"]*)"/) || [])[1], body = cm[2] || '';
        if (!ref) continue;
        let v = '';
        if (t == 's') v = ss[+((body.match(/<v>([\s\S]*?)<\/v>/) || [])[1])] || '';
        else if (t == 'inlineStr') v = ptTxt(body);
        else { const m = body.match(/<v>([\s\S]*?)<\/v>/); v = m ? ptDec(m[1]) : ''; }
        row[ptColN(ref)] = v;
      }
      rows.push(row);
    }
    out.push({ name: sh.name, rows });
  }
  return out;
}
async function ptXlsxRows(buf) {
  const all = await ptXlsxAll(buf);
  const sh = all.find(x => /penjualan/i.test(x.name) && /bongkar/i.test(x.name)) || all[0];
  if (!sh) throw new Error('Tidak ada lembar kerja pada file.');
  return { sheet: sh.name, rows: sh.rows };
}
function ptLev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 3;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
/* Ubah baris Excel menjadi data acuan: pasangan anggota tidak tetap per OPD + saran Nama BMD */
function ptMMBuild(aoa) {
  const nz = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim(), nipN = s => String(s == null ? '' : s).replace(/\D/g, '');
  const hi = aoa.findIndex(r => (r || []).some(c => /^nama bmd$/i.test(nz(c))));
  if (hi < 0) throw new Error('Baris judul kolom tidak ditemukan (harus ada kolom "Nama BMD").');
  const H = aoa[hi].map(c => nz(c).toLowerCase()), col = n => H.indexOf(n);
  const need = ['nama bmd', 'anggota tidak tetap 1', 'nip 1', 'anggota tidak tetap 2', 'nip 2', 'opd pemohon'], miss = need.filter(n => col(n) < 0);
  if (miss.length) throw new Error('Kolom tidak ditemukan: ' + miss.join(', ') + '.');
  const data = aoa.slice(hi + 1).filter(r => r && r.some(c => nz(c)));
  const cnt = {}, ord = [];
  const seen = (nip, name) => { if (!nip || !name) return; const c = cnt[nip] || (cnt[nip] = new Map()); c.set(name, (c.get(name) || 0) + 1); };
  data.forEach(r => { seen(nipN(r[col('nip 1')]), nz(r[col('anggota tidak tetap 1')])); seen(nipN(r[col('nip 2')]), nz(r[col('anggota tidak tetap 2')])); });
  const canon = {}, variants = [];
  Object.keys(cnt).forEach(nip => {
    const m = new Map(cnt[nip]), names = [...m.keys()];
    names.forEach(a => names.forEach(b => { if (a != b && m.has(a) && m.has(b) && b.length > a.length && b.toLowerCase().startsWith(a.toLowerCase())) { m.set(b, m.get(b) + m.get(a)); m.delete(a); } }));
    const best = [...m.entries()].sort((x, y) => y[1] - x[1])[0][0]; canon[nip] = best;
    if (cnt[nip].size > 1) variants.push({ nip, dipakai: best, lain: [...cnt[nip].keys()].filter(x => x != best) });
  });
  const pairs = new Map();
  data.forEach(r => {
    const a1 = nz(r[col('anggota tidak tetap 1')]), a2 = nz(r[col('anggota tidak tetap 2')]), n1 = nipN(r[col('nip 1')]), n2 = nipN(r[col('nip 2')]);
    if (!(a1 || a2)) return;
    const k = n1 + '|' + n2, e = pairs.get(k) || [canon[n1] || a1, n1, canon[n2] || a2, n2, []];
    const o = nz(r[col('opd pemohon')]); if (o && !e[4].includes(o)) e[4].push(o);
    pairs.set(k, e);
  });
  const bm = new Map();
  data.forEach(r => { const v = nz(r[col('nama bmd')]).replace(/penyebrangan/gi, 'penyeberangan'); if (!v) return; const k = v.toLowerCase(), e = bm.get(k) || { v, n: 0, o: bm.size }; e.n++; bm.set(k, e); });
  let L = [...bm.values()].sort((a, b) => b.n - a.n || a.o - b.o);
  const out = []; L.forEach(e => { const near = out.find(x => ptLev(x.v.toLowerCase(), e.v.toLowerCase()) <= 2); if (near) near.n += e.n; else out.push({ ...e }); });
  return { mm: [...pairs.values()], bmd: out.map(x => x.v), variants, baris: data.length };
}

/* Data bawaan: contoh dari file mail_merge yang udah diunggah
   Dapat diganti kapan saja lewat tombol "Impor Excel" di halaman Penelitian Tim Penghapusan. */
const PT_MM0 = [
  ["Abdul Wahid, S.Ag.,M.Si", "197609072009011006", "Abyan Ikbar Rafif A.Md.M", "200108122023021001", ["Badan Pendapatan Daerah Kota Bogor"]],
  ["dr. Erna Nuraena", "197311112002122002", "Indah Rahmawati Puspanegara, A.Md.Pk", "198606082011012001", ["Rumah Sakit Umum Daerah Kota Bogor - Dinas Kesehatan", "Dinas Kesehatan Kota Bogor"]],
  ["Drs. Herry Karnadi, M.Si.", "197103141990031001", "Arief Maulana Firmansyah", "197404192014071001", ["Dinas Pendidikan"]],
  ["Drs. Anas S. Rasmana., M.M.", "196701311993031000", "Mochammad Firman Firdaus", "197108042010011001", ["Dinas Pemuda dan Olahraga Kota Bogor"]],
  ["Rahmat Hidayat, S.Sos, MM", "197408181993031001", "Ade Achmad Fauzi", "197005242007011009", ["Dinas Koperasi, Usaha Kecil dan Menengah Perdagangan dan Perindustrian Kota Bogor"]],
  ["Rudy Mashudi, ST.,MP.", "197707062006041018", "Yessi Kalair, ST, MM", "197209091999012001", ["Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah Kota Bogor"]],
  ["Marse Hendra Saputra, S.STP.", "198103101999121001", "Elizafitri Fatimah, A.Md.Kom", "199804282025062009", ["Dinas Pengendalian Penduduk dan Keluarga Berencana"]],
  ["Drs. Firdaus, M.Si", "196712261986031002", "Meity Herliani, A.Md.Kom", "198205052006042022", ["Dinas Pariwisata dan Kebudayaan Kota Bogor"]],
  ["Ir. H. Chusnul Rozaqi, M.M.", "196711041994031010", "Munawar", "197804232009011002", ["Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu"]],
  ["Drs. Herry Karnadi, M.Si.", "197103141990031001", "Erny Yuniarti S.KM., M.K.M.", "197906192010012006", ["Dinas Pendidikan Kota Bogor"]],
  ["Dheri Wiriadirama, S.STP.", "198601242004121002", "Arif Kurniawan", "197512162009011002", ["Kecamatan Bogor Tengah Kota Bogor"]],
  ["Rudy Mashudi, ST.,MP.", "197707062006041018", "Odih Ending", "197510252008011005", ["Dinas Lingkungan Hidup Kota Bogor"]],
  ["Ir. H. Chusnul Rozaqi, M.M.", "196711041994031010", "Asep Nurjaman", "198510102014091001", ["Dinas Perumahan dan Permukiman Kota Bogor"]]
];
const PT_BMD0 = [
  "Peralatan dan Mesin dalam bentuk scrap",
  "Material bongkaran bangunan",
  "Peralatan dan Mesin berupa buku sekolah dalam bentuk scrap",
  "Material bongkaran bangunan reklame",
  "Peralatan dan Mesin berupa buku sekolah yang tercatat pada SIMASDA",
  "Peralatan dan Mesin berupa buku sekolah yang tidak tercatat pada SIMASDA",
  "Peralatan dan Mesin berupa Buku Sekolah yang tidak tercatat pada SIMASDA dalam bentuk scrap",
  "Peralatan dan Mesin dalam bentuk unit dan scrap",
  "Material bongkaran bangunan jembatan penyeberangan orang"
];
const PT_MMI0 = { src: 'mailmerge_Penjualan_dan_Ijin_Bongkar.xlsx', baris: 22, variants: [{"nip": "198606082011012001", "dipakai": "Indah Rahmawati Puspanegara, A.Md.Pk", "lain": ["Indah Rahmawati P"]}, {"nip": "197103141990031001", "dipakai": "Drs. Herry Karnadi, M.Si.", "lain": ["Drs. Herry Karnadi", "Drs. Herry Larnadi"]}, {"nip": "197707062006041018", "dipakai": "Rudy Mashudi, ST.,MP.", "lain": ["Rudy Mashudi, St., Mp."]}], bawaan: true };
let PT_MM = PT_MM0, PT_BMD = PT_BMD0, PT_MMI = PT_MMI0, ptImp = null;
const PT_MM_KEY = 'si-bmd-mailmerge-v1';
(function () {
  try { const j = JSON.parse(localStorage.getItem(PT_MM_KEY) || 'null'); if (j && Array.isArray(j.mm) && j.mm.length) { PT_MM = j.mm; PT_BMD = j.bmd || PT_BMD0; PT_MMI = j.info || PT_MMI0; } } catch (e) { /* pakai data bawaan */ }
})();
function ptMMSimpan(d, info) {
  PT_MM = d.mm; PT_BMD = d.bmd; PT_MMI = info;
  try { localStorage.setItem(PT_MM_KEY, JSON.stringify({ mm: d.mm, bmd: d.bmd, info })); } catch (e) { console.warn('Gagal menyimpan data mail merge', e); }
}
function ptMMReset() { PT_MM = PT_MM0; PT_BMD = PT_BMD0; PT_MMI = PT_MMI0; try { localStorage.removeItem(PT_MM_KEY); } catch (e) { /* abaikan */ } }
const ptOpdKey = x => String(x || '').toLowerCase().replace(/kota bogor/g, '').replace(/\s+/g, ' ').trim();
const ptMMFor = opd => { const k = ptOpdKey(opd); for (let i = PT_MM.length - 1; i >= 0; i--) if (PT_MM[i][4].some(o => ptOpdKey(o) == k)) return PT_MM[i]; return null; };
/* NIP ditulis tanpa awalan "NIP." */
const ptNip = x => String(x == null ? '' : x).replace(/^\s*NIP\.?\s*/i, '').replace(/\s+/g, '');
const ptMem = {};   // Isian Form tetap (walaupun pindah menu, tapi tetap tetap))

/* tangga  */
const ptSat = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function ptSebut(n) {
  if (n < 12) return ptSat[n];
  if (n < 20) return ptSebut(n - 10) + ' belas';
  if (n < 100) return ptSebut(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + ptSebut(n % 10) : '');
  if (n < 200) return 'seratus' + (n > 100 ? ' ' + ptSebut(n - 100) : '');
  if (n < 1000) return ptSebut(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + ptSebut(n % 100) : '');
  if (n < 2000) return 'seribu' + (n > 1000 ? ' ' + ptSebut(n - 1000) : '');
  return ptSebut(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + ptSebut(n % 1000) : '');
}
const ptD = iso => { if (!iso) return null; const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? null : d; };
const ptTerbaca = iso => { const d = ptD(iso); return d ? `${PT_HARI[d.getDay()]} tanggal ${ptSebut(d.getDate())} ${PT_BLN[d.getMonth()].toLowerCase()} ${ptSebut(d.getFullYear())}` : ''; };
const ptKal = iso => { const d = ptD(iso); return d ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` : ''; };
const ptLong = iso => { const d = ptD(iso); return d ? `${String(d.getDate()).padStart(2, '0')} ${PT_BLN[d.getMonth()]} ${d.getFullYear()}` : ''; };
/* "22 Sep 2026" -> "22 September 2026" (format Excel: hari 2 digit, bulan lengkap) */
const ptTglTeks = t => { const m = String(t || '').trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/); if (!m) return String(t || ''); const b = PT_BLN.find(x => x.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3))); return b ? `${m[1].padStart(2, '0')} ${b} ${m[3]}` : String(t); };
const ptSlash = iso => { const d = ptD(iso); return d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'; };

/* Data  */
function ptItems(no) {
  const S = SVS[no] || {};
  return K.slice(0, 3).map((x, i) => {
    const t = (S.d && S.d.it && S.d.it[i]) || {};
    return { id: x[0], kode: x[1], nama: x[2], thn: x[3], kond: x[4], qty: x[5], sat: x[6], rb: t.c || '', ms: t.m || '', ket: t.k || '' };
  });
}
/* Jenis permohonan hanya 2: Pemindahtanganan / Izin Bongkar*/
const ptJenis = d => (!d[4] || d[4] === 'Penghapusan') ? 'Izin Bongkar' : d[4];
/* Nama BMD terkunci mengikuti jenis permohonan (tidak bisa diubah; ganti jenis = ajukan ulang). Jenis Proses boleh memilih salah satu atau keduanya */
const PT_OPT_PROSES = ['Pemindahtanganan', 'Izin Bongkar', 'Izin Bongkar dan Pemindahtanganan'];
const PT_PROSES_LAMA = { 'Penjualan': 'Pemindahtanganan', 'Izin Bongkar dan Penjualan': 'Izin Bongkar dan Pemindahtanganan' };
/* Perihal surat permohonan mengikuti jenis permohonan yang diajukan (Izin Bongkar / Pemindahtanganan) */
const ptPerihalDef = d => ptJenis(d);
/* Gabungkan default dengan data tersimpan: isian kosong tidak menimpa data dari permohonan/survei */
function ptMerge(def, d, ...src) {
  const ff = (RX[d[0]] || {}).f || {}, legacy = [ff.pf, d[10], 'Izin Bongkar', 'Pemindahtanganan', 'Penghapusan', 'Permohonan Usulan Izin Bongkar dan Penaksiran', 'Permohonan Usulan Pemindahtanganan dan Penaksiran'];
  const o = Object.assign({}, def);
  src.forEach(x => Object.keys(x || {}).forEach(k => {
    let v = x[k];
    if (k == 'proses' && PT_PROSES_LAMA[v]) v = PT_PROSES_LAMA[v];
    if (v == null || String(v).trim() === '') return;
    if (k == 'perihal' && legacy.includes(v) && v !== def.perihal) return;   // perihal lama (teks bebas) diganti mengikuti jenis
    if (k == 'bmd' && ['Izin Bongkar', 'Pemindahtanganan', 'Penghapusan'].includes(v)) return;   // nilai otomatis lama
    o[k] = v;
  }));
  return o;
}
function ptDefault(d, S) {
  const x = RX[d[0]] || {}, ff = x.f || {}, sd = S.d || {}, mm = ptMMFor(d[1]) || ['', '', '', ''];
  return {
    nobap: '', tgl: today(), terbaca: ptTerbaca(today()), bmd: '',
    nosurat: d[0], tglsurat: ptLong(ff.tgl) || ptTglTeks(d[5]), perihal: ptPerihalDef(d), opd: d[1], sub: d[1],
    alamat: sd.lk || '', proses: ptJenis(d),
    nokep: '000.2.3.2/Kep.31-BKAD/2026', tglkep: '2026-01-22', judulkep: PT_JUDUL_KEP,
    at1: mm[0], nip1: mm[1], at2: mm[2], nip2: mm[3],
    rek: 'Layak dihapus', tglpen: today(), cat: ''
  };
}
const ptFields = ['nobap', 'tgl', 'terbaca', 'bmd', 'nosurat', 'tglsurat', 'perihal', 'opd', 'sub', 'alamat', 'proses', 'nokep', 'tglkep', 'judulkep', 'at1', 'nip1', 'at2', 'nip2', 'rek', 'tglpen', 'cat'];
const ptCollect = () => { const o = {}; ptFields.forEach(k => { const e = $('#b_' + k); o[k] = e ? e.value : ''; }); return o; };
const ptMissing = f => PT_REQ.filter(([k]) => !String(f[k] || '').trim()).map(x => x[1]);
const ptStat = no => { const p = PEN[no]; return !p || !p.f ? ['s-n', 'Belum disusun'] : p.st == 'Final' ? ['s-g', 'Tersusun'] : ['s-o', 'Draft']; };

/*  Halaman 1: Daftar Hasil Survei */
function ptMMCard() {
  const i = PT_MMI, v = i.variants || [];
  const imp = ptImp ? `<div class="pt-imp"><b>Hasil pembacaan: ${esc(ptImp.info.src)}</b><p class="mt">Lembar “${esc(ptImp.sheet)}”: ${ptImp.d.baris} baris data, <b>${ptImp.d.mm.length}</b> pasangan anggota tidak tetap, <b>${ptImp.d.bmd.length}</b> saran Nama BMD.</p>${ptImp.d.variants.length ? `<p class="mt">Penulisan nama berbeda untuk NIP yang sama (yang dipakai ditandai):</p><ul>${ptImp.d.variants.map(x => `<li><b>${esc(x.dipakai)}</b> (NIP ${esc(x.nip)}) variasi lain: ${x.lain.map(esc).join('; ')}</li>`).join('')}</ul>` : ''}<div class="pt-bar"><button class="btn sm" data-mm="apply">Terapkan data ini</button><button class="btn o sm" data-mm="cancel">Batal</button></div></div>` : '';
  return `<div class="cd pt-mm"><div class="ch"><div><h2 style="font-size:16px">Data Mail Merge</h2><small class="mt">Data dapat diinput otomatis (anggota tidak tetap per OPD) pada form BA.</small></div><div class="pt-bar" style="margin:0"><button class="btn sm" data-mm="pick">Import Excel</button>${i.bawaan ? '' : '<button class="btn o sm" data-mm="reset">Kembalikan data bawaan</button>'}<input type="file" id="pt_file" accept=".xlsx" hidden></div></div>` +
    `<p class="mt" style="margin:0 0 6px">Sumber saat ini: <b>${esc(i.src)}</b>${i.tgl ? ' · diimpor ' + esc(i.tgl) : ''} · ${PT_MM.length} pasangan anggota · ${PT_BMD.length} saran Nama BMD</p>${imp}` +
    `<details class="pt-det"><summary>Lihat data acuan</summary><div class="tw"><table class="pt-t"><thead><tr><th>OPD pernah memakai</th><th>Anggota tidak tetap 1</th><th>NIP 1</th><th>Anggota tidak tetap 2</th><th>NIP 2</th></tr></thead><tbody>${PT_MM.map(m => `<tr><td>${m[4].map(esc).join('<br>')}</td><td>${esc(m[0])}</td><td>${esc(m[1])}</td><td>${esc(m[2])}</td><td>${esc(m[3])}</td></tr>`).join('')}</tbody></table></div></details>` +
    `<p class="mt" style="margin:8px 0 0;font-size:12px">Format Excel: baris judul harus memuat kolom Nama BMD, Anggota Tidak Tetap 1, NIP 1, Anggota Tidak tetap 2, NIP 2, dan OPD Pemohon.</p></div>`;
}

/* Aksi BA TTD setelah berkas diunggah: lihat, edit (nonaktif bila selesai), menu lainnya */
const PT_IC = {
  eye: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  pen: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  dots: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>'
};
PT_IC.trash = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
const ptBaIcons = (no, done) => `<div class="ic-g"><button type="button" class="ic-b" data-bv="${esc(no)}" title="Lihat / preview BA TTD" aria-label="Lihat BA TTD">${PT_IC.eye}</button>` +
  `<button type="button" class="ic-b" data-be="${esc(no)}" title="${done ? 'Sudah selesai, tidak dapat diedit' : 'Edit (ganti berkas)'}" aria-label="Edit BA TTD"${done ? ' disabled' : ''}>${PT_IC.pen}</button>` +
  `<button type="button" class="ic-b dg" data-bd="${esc(no)}" title="${done ? 'Sudah selesai, tidak dapat dihapus' : 'Hapus BA TTD'}" aria-label="Hapus BA TTD"${done ? ' disabled' : ''}>${PT_IC.trash}</button></div>`;

function ptRows(r, q) {
  q = (q || '').toLowerCase().trim();
  const f = r.filter(d => !q || (d[0] + ' ' + d[1]).toLowerCase().includes(q));
  if (!f.length) return `<tr><td colspan="8" class="mt" style="text-align:center;padding:26px">${q ? 'Tidak ada hasil untuk pencarian tersebut.' : 'Belum ada survei yang selesai.'}</td></tr>`;
  return f.map((d, i) => {
    const S = SVS[d[0]], st = ptStat(d[0]), n = +(S.d && S.d.jm) || (S.d && S.d.it && S.d.it.length) || 1;
    return `<tr><td>${i + 1}</td><td><b>${esc(d[0])}</b><div class="mt" style="font-size:12px">${esc(d[1])}</div></td><td>${esc(d[4])}</td><td><b>${n}</b> objek</td><td>${ptSlash(S.tgl)}</td><td>${PL(st[0], st[1])}</td><td>${S.ba ? PL(S.ba.st == 'Selesai' ? 's-g' : 's-o', S.ba.st == 'Selesai' ? 'Selesai' : 'Draft') : '<span class="mt">Belum upload</span>'}</td><td><div class="pt-ac"><button class="btn sm" data-pn="${esc(d[0])}">${st[1] == 'Belum disusun' ? 'Susun penelitian' : 'Lanjutkan penelitian'}</button>${S.ba ? ptBaIcons(d[0], S.ba.st == 'Selesai') : `<button class="btn o sm" data-ba="${esc(d[0])}">Upload BA TTD</button>`}</div></td></tr>`;
  }).join('');
}
function ptList(s) {
  const r = svRows().filter(d => SVS[d[0]].st == 'Selesai');
  s.innerHTML = HD('Penelitian Tim Penghapusan', '') +
    `<div class="cs pt-sum"><div class="c3"><u><svg class="i"><use href="#c"></use></svg></u><div><small>Survei selesai</small><b>${r.length}</b><em class="tr up"><span>Menunggu penelitian</span></em></div></div><div class="c1"><u><svg class="i"><use href="#b"></use></svg></u><div><small>Tujuan penelitian</small><b class="tx">Administratif</b><em class="tr up"><span></span></em></div></div><div class="c2"><u><svg class="i"><use href="#f"></use></svg></u><div><small>Output</small><b class="tx">Berita Acara</b><em class="tr up"><span>Hasil dan rekomendasi tim</span></em></div></div></div>` +
    ptMMCard() +
    `<div class="cd"><div class="ch"><div><h2 style="font-size:20px">Daftar Hasil Survei</h2><small class="mt"></small></div><label class="sr2 pt-q"><svg class="i"><use href="#sq"></use></svg><input id="pt_q" placeholder="Cari nomor surat atau perangkat daerah…"></label></div>` +
    `<div class="tw"><table class="pt-t"><thead><tr><th>No</th><th>Nomor Surat / Pemohon</th><th>Jenis Usulan</th><th>Jumlah Objek</th><th>Tanggal Selesai</th><th>Status Penelitian</th><th>Status BA TTD</th><th>Aksi</th></tr></thead><tbody id="pt_tb">${ptRows(r, '')}</tbody></table></div></div>`;
  s.oninput = e => { if (e.target.id == 'pt_q') $('#pt_tb').innerHTML = ptRows(r, e.target.value); };
  s.onchange = e => {
    if (e.target.id != 'pt_file' || !e.target.files[0]) return;
    const f = e.target.files[0];
    f.arrayBuffer().then(ptXlsxRows).then(x => { const d = ptMMBuild(x.rows); ptImp = { d, sheet: x.sheet, info: { src: f.name, tgl: today(), baris: d.baris, variants: d.variants } }; ptList(s); toast('File dibaca. Periksa hasilnya lalu klik “Terapkan data ini”.'); })
      .catch(err => { console.error(err); toast(err && err.message ? err.message : 'File Excel tidak dapat dibaca.'); e.target.value = ''; });
  };
  s.onclick = e => {
    const m = e.target.closest('[data-mm]');
    if (m) {
      const a = m.dataset.mm;
      if (a == 'pick') return $('#pt_file').click();
      if (a == 'cancel') { ptImp = null; return ptList(s); }
      if (a == 'apply' && ptImp) { ptMMSimpan(ptImp.d, ptImp.info); ptImp = null; toast('Data mail merge diperbarui.'); return ptList(s); }
      if (a == 'reset') { ptMMReset(); toast('Data bawaan dikembalikan.'); return ptList(s); }
    }
    const b = e.target.closest('[data-pn]'); if (b) { penCur = b.dataset.pn; pgPt(); window.scrollTo(0, 0); }
    const u = e.target.closest('[data-ba]'); if (u) return ptBaPick(u.dataset.ba);
    const v = e.target.closest('[data-bv]'); if (v) return ptBaPreview(v.dataset.bv);
    const ed = e.target.closest('[data-be]'); if (ed && !ed.disabled) return ptBaPick(ed.dataset.be);
    const dl = e.target.closest('[data-bd]'); if (dl && !dl.disabled) return ptBaDel(dl.dataset.bd);
  };
}

/* Halaman 2: Form Susun Berita Acara */
const ptIn = (k, l, v, ph, o = {}) => `<label class="l2${o.full ? ' full' : ''}">${l}` +
  (o.opt ? `<select id="b_${k}">${o.opt.map(x => `<option${x == v ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>`
    : o.area ? `<textarea id="b_${k}" rows="${o.rows || 3}" placeholder="${esc(ph || '')}">${esc(v)}</textarea>`
      : `<input id="b_${k}" type="${o.t || 'text'}" value="${esc(v)}" placeholder="${esc(ph || '')}"${o.ro ? ' readonly tabindex="-1" class="ro"' : ''}${o.list ? ' list="' + o.list + '" autocomplete="off"' : ''}>`) + `</label>`;
const ptSec = (t, s, b) => `<div class="cd pt-sec"><div class="ch"><div><h2>${t}</h2><small class="mt">${s || ''}</small></div></div>${b}</div>`;

function ptForm(s) {
  const no = penCur, d = R.find(x => x[0] == no), S = SVS[no];
  if (!d || !S) { penCur = null; return ptList(s); }
  const f = ptMerge(ptDefault(d, S), d, (PEN[no] && PEN[no].f) || {}, ptMem[no] || {});
  const manual = f.terbaca && f.terbaca != ptTerbaca(f.tgl), st = ptStat(no), it = ptItems(no);
  s.innerHTML =
    `<div class="pt-hd"><button class="btn o sm" data-a="bk">← Kembali ke daftar</button><div><h1>Susun Berita Acara Penelitian</h1><p>${esc(no)} · ${esc(d[1])} · ${esc(f.proses)}</p></div><span style="margin-left:auto">${PL(st[0], st[1])}</span></div>` +
    ptSec('1. Identitas Berita Acara dan Surat Permohonan', '',
      `<div class="ff">${ptIn('nobap', 'Nomor BAP', f.nobap, 'Contoh: 000.2.3.2/BA.205-BKAD/2026')}${ptIn('terbaca', 'Tanggal BAP (terbaca)', f.terbaca, 'Contoh: Kamis tanggal dua puluh dua oktober dua ribu dua puluh enam')}` +
      `${ptIn('tgl', 'Tanggal BAP (tanggal kalender)', f.tgl, '', { t: 'date' })}${ptIn('bmd', 'Nama BMD', f.bmd, 'Ketik nama BMD, contoh: Besi scrap rangka jembatan')}` +
      `${ptIn('nosurat', 'Nomor Surat Permohonan', f.nosurat, 'Nomor surat permohonan')}${ptIn('tglsurat', 'Tanggal Surat Permohonan', f.tglsurat, 'Contoh: 08 September 2025')}` +
      `${ptIn('perihal', 'Perihal Surat Permohonan', f.perihal, 'Otomatis sesuai jenis permohonan', { area: 1, full: 1 })}` +
      `${ptIn('opd', 'OPD Pemohon', f.opd, 'Nama OPD pemohon')}${ptIn('sub', 'Sub SKPD Pemohon', f.sub, 'Nama sub SKPD')}` +
      `${ptIn('alamat', 'Alamat Objek Pemohon', f.alamat, 'Alamat lengkap lokasi objek', { area: 1, full: 1 })}` +
      `${ptIn('proses', 'Jenis Proses', f.proses, '', { opt: PT_OPT_PROSES })}</div>`) +
    ptSec('2. Keputusan Tim dan Anggota Tidak Tetap', '',
      `<div class="ff">${ptIn('nokep', 'Nomor Keputusan Wali Kota', f.nokep, '')}${ptIn('tglkep', 'Tanggal Keputusan Wali Kota', f.tglkep, '', { t: 'date' })}` +
      `${ptIn('judulkep', 'Judul Keputusan Wali Kota', f.judulkep, '', { area: 1, full: 1 })}` +
      `<label class="l2 full">Isi anggota tidak tetap dari data BA sebelumnya<select id="b_mm"><option value=""> Pilih OPD</option>${PT_MM.map((m, i) => `<option value="${i}">${esc(m[4].join(' / '))} - ${esc(m[0])} &amp; ${esc(m[2])}</option>`).join('')}</select></label>` +
      `${ptIn('at1', 'Anggota Tidak Tetap 1', f.at1, 'Nama anggota tidak tetap 1')}${ptIn('nip1', 'NIP Anggota Tidak Tetap 1', f.nip1, 'NIP anggota tidak tetap 1')}` +
      `${ptIn('at2', 'Anggota Tidak Tetap 2', f.at2, 'Nama anggota tidak tetap 2')}${ptIn('nip2', 'NIP Anggota Tidak Tetap 2', f.nip2, 'NIP anggota tidak tetap 2')}</div>`) +
    ptSec('3. Anggota Tim Tetap', 'Anggota tetap berdasarkan BA',
      `<div class="tw"><table class="pt-t"><thead><tr><th>No</th><th>Nama / NIP</th><th>Jabatan</th></tr></thead><tbody>${PT_TETAP.map((m, i) => `<tr><td>${i + 1}</td><td><b>${esc(m[0])}</b><div class="mt" style="font-size:12px">${esc(m[1])}</div></td><td>${esc(m[2])}</td></tr>`).join('')}</tbody></table></div>`) +
    ptSec('4. Barang yang Diteliti', '.',
      `<div class="tw"><table class="pt-t"><thead><tr>${PT_LAMP_H.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${it.map((x, i) => `<tr>${ptLampRow(x, i).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`) +
    ptSec('5. Rekomendasi dan Catatan Tim', '',
      `<div class="ff">${ptIn('rek', 'Rekomendasi Tim', f.rek, '', { opt: ['Layak dihapus', 'Perlu tindak lanjut', 'Tidak layak dihapus'] })}${ptIn('tglpen', 'Tanggal Penelitian', f.tglpen, '', { t: 'date' })}${ptIn('cat', 'Catatan Tim Penghapusan', f.cat, 'Catatan tambahan tim', { area: 1, full: 1 })}</div>`) +
    ptSec('6. Pratinjau Berita Acara', '',
      `<div class="pt-bar"><button class="btn o sm" data-a="prev">Perbarui Pratinjau BA</button><button class="btn o sm" data-a="print">Cetak / Simpan PDF</button><button class="btn sm" data-a="docx">Unduh Word (.docx)</button></div><div class="pt-prev"><div class="bap" id="b_prev"></div></div>`) +
    `<div class="pt-act"><button class="btn o" data-a="draft">Simpan Draft</button><button class="btn" data-a="save">Simpan Penelitian</button></div>`;
  const t = $('#b_terbaca'); if (manual) t.dataset.man = 1;
  ptRender();
  s.oninput = s.onchange = e => {
    const id = e.target.id || '';
    if (id == 'b_mm') { const m = PT_MM[e.target.value]; if (m) { $('#b_at1').value = m[0]; $('#b_nip1').value = m[1]; $('#b_at2').value = m[2]; $('#b_nip2').value = m[3]; } }
    if (id == 'b_tgl') { const t = $('#b_terbaca'); if (!t.dataset.man) t.value = ptTerbaca(e.target.value); }
    else if (id == 'b_terbaca') e.target.dataset.man = e.target.value && e.target.value != ptTerbaca($('#b_tgl').value) ? 1 : '';
    if (id.startsWith('b_')) ptMem[penCur] = ptCollect();
  };
  s.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, f = ptCollect();
    if (a == 'bk') { penCur = null; return pgPt(); }
    if (a == 'prev') { ptRender(); return toast('Pratinjau diperbarui.'); }
    if (a == 'draft') { PEN[penCur] = { st: 'Draft', f, tgl: today() }; delete ptMem[penCur]; Store.persist(); toast('Draft penelitian disimpan.'); penCur = null; return pgPt(); }
    const m = ptMissing(f);
    if (a == 'save') {
      if (m.length) return toast('Lengkapi dulu: ' + m.join(', ') + '.');
      PEN[penCur] = { st: 'Final', f, h: f.rek, t: f.tglpen, c: f.cat, tgl: today() }; delete ptMem[penCur]; Store.persist(); toast('Penelitian tersimpan.'); penCur = null; return pgPt();
    }
    if (a == 'print') return ptPrint(f, penCur);
    if (a == 'docx') {
      if (m.length) return toast('Lengkapi dulu: ' + m.join(', ') + '.');
      b.disabled = true;
      ptDocx(penCur, f).then(blob => {
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob);
        l.download = 'Berita Acara Penelitian - ' + penCur.replace(/[\\/:*?"<>|]/g, '-') + '.docx';
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
        toast('Dokumen Word berhasil dibuat.');
      }).catch(err => { console.error(err); toast('Gagal membuat dokumen Word.'); }).finally(() => { b.disabled = false; });
    }
  };
}
function pgPt() { const s = $('#pt'); return penCur ? ptForm(s) : ptList(s); }

/* Upload BA yang sudah ditandatangani (TTD) langsung di daftar 
   Klik "Upload BA TTD" -> pilih berkas -> otomatis tersimpan (Draft). Lalu: lihat (preview), edit (ganti), hapus.
   "Selesaikan BA TTD" ada di jendela preview; setelah Selesai semua tombol edit/hapus dikunci.
   Data: SVS[no].ba = { n, ty, sz, img (data URL), ts, st: 'Draft' | 'Selesai' } */
const PT_BA_MAX = 2 * 1024 * 1024;
const ptSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function ptBaBlobUrl(b) {
  try {
    const m = String(b.img).match(/^data:([^;]+);base64,(.*)$/); if (!m) return b.img;
    const bin = atob(m[2]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u], { type: m[1] }));
  } catch (e) { return b.img; }
}
const ptBaRe = () => ptList($('#pt'));
function ptBaPick(no, re) {
  const S = SVS[no]; if (!S) return;
  if (S.ba && S.ba.st == 'Selesai') return toast('BA TTD sudah selesai dan tidak dapat diedit.');
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/pdf,image/png,image/jpeg';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    if (!/^(application\/pdf|image\/(png|jpeg))$/.test(f.type)) return toast('Format harus PDF, JPG, atau PNG.');
    if (f.size > PT_BA_MAX) return toast('Ukuran berkas maksimal 2 MB.');
    const r = new FileReader(); r.onerror = () => toast('Berkas gagal dibaca.');
    r.onload = () => {
      const T = SVS[no]; if (!T || (T.ba && T.ba.st == 'Selesai')) return;
      const baru = !T.ba;
      T.ba = { n: f.name, ty: f.type, sz: f.size, img: r.result, ts: nowStr(), st: 'Draft' };
      Store.persist(); toast(baru ? 'BA TTD berhasil diunggah (Draft).' : 'Berkas BA TTD diganti.'); (re || ptBaRe)();
    };
    r.readAsDataURL(f);
  };
  inp.click();
}
function ptBaDel(no, re) {
  const S = SVS[no]; if (!S || !S.ba) return;
  if (S.ba.st == 'Selesai') return toast('BA TTD sudah selesai dan tidak dapat dihapus.');
  cfm('Hapus BA TTD?', 'Berkas yang sudah diunggah akan dihapus.', () => { const U = SVS[no]; if (!U || (U.ba && U.ba.st == 'Selesai')) return; delete U.ba; Store.persist(); toast('BA TTD dihapus.'); (re || ptBaRe)(); }, 'Hapus');
}
function ptBaPreview(no, re) {
  const S = SVS[no]; if (!S || !S.ba) return;
  const b = S.ba, done = b.st == 'Selesai', url = ptBaBlobUrl(b), isImg = /^image\//.test(b.ty);
  const old = $('#ba_md'); if (old) old.remove();
  const m = document.createElement('div'); m.id = 'ba_md'; m.className = 'bamd';
  m.innerHTML = `<div class="bamd-c" role="dialog" aria-modal="true"><div class="bamd-h"><div><b>${esc(b.n)}</b><small class="mt">${esc(ptSize(b.sz))} · ${esc(b.ts || '')} · ${done ? 'Selesai' : 'Draft'}</small></div><button type="button" class="ic-b" data-x="1" aria-label="Tutup">&times;</button></div>` +
    `<div class="bamd-b">${isImg ? `<img src="${esc(url)}" alt="${esc(b.n)}">` : `<iframe src="${esc(url)}" title="${esc(b.n)}"></iframe>`}</div>` +
    `<div class="bamd-f"><a class="btn o" href="${esc(url)}" target="_blank" rel="noopener">Buka di tab baru</a>${done ? '<span class="mt">BA TTD sudah selesai dan dikunci.</span>' : '<button type="button" class="btn" data-fin="1">Selesaikan BA TTD</button>'}</div></div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); document.removeEventListener('keydown', esc_); if (url.startsWith('blob:')) URL.revokeObjectURL(url); };
  const esc_ = e => { if (e.key == 'Escape') close(); };
  document.addEventListener('keydown', esc_);
  m.onclick = e => {
    if (e.target === m || e.target.closest('[data-x]')) return close();
    if (e.target.closest('[data-fin]')) cfm('Selesaikan BA TTD?', 'Berkas akan dikunci dan tidak dapat diedit atau dihapus lagi.', () => {
      const U = SVS[no]; if (!U || !U.ba) return; U.ba.st = 'Selesai'; U.ba.ts = nowStr(); Store.persist(); close(); toast('BA TTD selesai dan dikunci.'); (re || ptBaRe)();
    }, 'Selesai');
  };
}

/* Pratinjau (mengikuti teks template) */
function ptPrevHtml(f, no) {
  const V = (k, l) => f[k] && String(f[k]).trim() ? esc(f[k]) : `<mark class="ph">[${l}]</mark>`,
    bmd = V('bmd', 'Nama BMD'), opd = V('opd', 'OPD Pemohon'),
    kal = ptKal(f.tgl), tb = f.terbaca && f.terbaca.trim() ? esc(f.terbaca) : '<mark class="ph">[Tanggal BAP]</mark>',
    kep = `Keputusan Wali Kota Bogor Nomor ${V('nokep', 'Nomor Keputusan')}, Tanggal ${f.tglkep ? esc(ptLong(f.tglkep)) : '<mark class="ph">[Tanggal Keputusan]</mark>'} tentang ${V('judulkep', 'Judul Keputusan')}`,
    ttd = [...PT_TETAP.map(m => [m[0] + '<br>' + m[2 - 1], m[2]]), [(f.at1 ? esc(f.at1) : '<mark class="ph">[Anggota tidak tetap 1]</mark>') + '<br>NIP. ' + esc(ptNip(f.nip1)), 'Anggota Tidak Tetap'], [(f.at2 ? esc(f.at2) : '<mark class="ph">[Anggota tidak tetap 2]</mark>') + '<br>NIP. ' + esc(ptNip(f.nip2)), 'Anggota Tidak Tetap']],
    it = ptItems(no);
  return `<h3>BERITA ACARA PENELITIAN</h3><p class="c">Nomor : ${V('nobap', 'Nomor BAP')}</p>` +
    `<p>Pada hari ini ${tb} (${kal ? esc(kal) : '<mark class="ph">[tanggal]</mark>'}), kami yang bertanda tangan dibawah ini sebagai Tim Penghapusan Barang Milik Daerah Pemerintah Daerah Kota Bogor yang dibentuk berdasarkan ${kep}, yaitu sesuai Surat Nomor ${V('nosurat', 'Nomor Surat')} tanggal ${V('tglsurat', 'Tanggal Surat')}, Perihal. ${V('perihal', 'Perihal Surat').replace(/\n/g, '<br>')}</p>` +
    `<p>Guna tertib administrasi pengelolaan barang milik daerah, dalam pelaksanaannya penelitian ini berpedoman pada Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 Tentang Pengelolaan Barang Milik Daerah serta Peraturan Wali Kota Bogor Nomor 114 Tahun 2020 Tentang Peraturan Pelaksana Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 Tentang Pengelolaan Barang Milik Daerah. Adapun hasil penelitian adalah sebagai berikut:</p>` +
    `<ol><li>${bmd} adalah milik Pemerintah Kota Bogor yang sudah tidak digunakan untuk kepentingan penyelenggaraan tugas dan fungsi ${opd}.</li>` +
    `<li>Secara administrasi aset ${bmd} tersebut tercatat pada ${opd}.</li>` +
    `<li>Secara fisik, aset tersebut sesuai dengan data administrasi dan berada di ${opd}, yaitu ${V('alamat', 'Alamat Objek').replace(/\n/g, '<br>')}.</li>` +
    `<li>Secara ekonomis, barang milik daerah berupa aset tersebut lebih menguntungkan bagi pemerintah daerah apabila dilakukan proses pemindahtanganan dalam bentuk penjualan, karena:<ol type="a"><li>Tidak digunakan dalam rangka menunjang pelaksanaan tugas dan fungsi ${opd}.</li><li>Tempat penampungan aset akan digunakan untuk kepentingan kebutuhan fasilitas pendukung kantor.</li><li>${bmd} dalam bentuk scrap tersebut sudah tidak layak digunakan untuk menunjang pelaksanaan tugas dan fungsi.</li></ol></li>` +
    `<li>Proses pemindahtanganan dalam bentuk penjualan terhadap aset dalam bentuk scrap tersebut, berdasarkan Pasal 223 Peraturan Daerah Kota Bogor ayat (1) Tahun 2018 Tentang Pengelolaan Barang Milik Daerah adalah penjualan barang milik daerah dilakukan secara lelang, kecuali dalam hal tertentu sebagaimana dijelaskan pada pasal 223 ayat (4).</li>` +
    `<li>${bmd} yang sudah tidak digunakan tersebut, berdasarkan Pasal 224 Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah harus dinilai terlebih dahulu untuk mendapatkan nilai wajar yang dilakukan oleh Penilai Pemerintah atau Penilai Publik atau Panitia Penaksir Harga Barang Milik Daerah Pemerintah Daerah Kota Bogor yang ditetapkan oleh Wali Kota atau Penilai BMD. Hasil Penilaian dilaporkan kepada Wali Kota untuk mendapatkan Persetujuan Nilai Limit Penjualan dan Persetujuan Pemindahtanganan dalam bentuk penjualan yang ditetapkan melalui Keputusan Wali Kota.</li>` +
    `<li>Berdasarkan Berita Acara Serah Terima, Kepala ${opd} mengajukan usulan penghapusan barang milik daerah kepada Pengelola Barang.</li></ol>` +
    `<p>Demikian berita acara ini dibuat rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.</p>` +
    `<table class="bt tt"><thead><tr><th colspan="4">TIM PENGHAPUSAN BARANG MILIK DAERAH<br>PEMERINTAH DAERAH KOTA BOGOR</th></tr><tr><th style="width:5%">No.</th><th>Nama/NIP</th><th style="width:19%">Jabatan</th><th style="width:19%">Tanda Tangan</th></tr></thead><tbody>${ttd.map((r, i) => `<tr><td>${i + 1}.</td><td>${i < PT_TETAP.length ? `${esc(PT_TETAP[i][0])}<br>${esc(PT_TETAP[i][1])}` : r[0]}</td><td>${esc(r[1])}</td><td></td></tr>`).join('')}</tbody></table>` +
    `<div class="lmp"><p class="lh">Lampiran Berita Acara Penelitian</p><p class="ls">Nomor : ${V('nobap', 'Nomor BAP')}<br>Tanggal : ${kal ? esc(kal) : '<mark class="ph">[Tanggal BAP]</mark>'}<br>Perihal : Berita Acara Penjualan berupa ${bmd} pada ${opd}</p></div>` +
    `<table class="bt sm"><thead><tr>${PT_LAMP_H.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${it.map((x, i) => `<tr>${ptLampRow(x, i).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function ptRender() { const e = $('#b_prev'); if (e) e.innerHTML = ptPrevHtml(ptCollect(), penCur); }
const PT_PAPER_CSS = `.bap{background:#fff;color:#000;font:13px/1.55 "Times New Roman",Times,serif;padding:34px 44px;text-align:justify}.bap h3{text-align:center;text-decoration:underline;font:700 16px "Times New Roman",Times,serif;margin:0 0 4px;color:#000}.bap p{margin:0 0 10px}.bap .c{text-align:center}.bap ol{margin:0 0 10px;padding-left:24px}.bap li{margin-bottom:6px}.bap .ph{background:none;color:inherit}.bap table.bt,#app .bap table.bt{width:100%;border-collapse:collapse;margin:16px 0;min-width:0;font:12px/1.4 "Times New Roman",Times,serif}.bap table.bt th,.bap table.bt td,#app .bap table.bt th,#app .bap table.bt td{border:1px solid #000;padding:6px 8px;text-align:left;vertical-align:top;background:#fff;color:#000;font:inherit;text-transform:none;letter-spacing:0}.bap table.bt th,#app .bap table.bt th{text-align:center;font-weight:700;vertical-align:middle}.bap table.tt td{height:46px}.bap .lmp{margin-top:26px}.bap .lh{text-align:right;font-weight:700;font-size:11px;margin:0 0 6px}.bap .ls{text-align:left;font-size:10.5px;margin:0 0 6px;line-height:1.5}.bap table.sm,#app .bap table.sm{font-size:11px;margin-top:6px}.bap table.sm td{height:auto}`;(function () { const s = document.createElement('style'); s.textContent = PT_PAPER_CSS; document.head.appendChild(s); })();
function ptPrint(f, no) {
  const w = window.open('', '_blank'); if (!w) return toast('Pop-up diblokir browser.');
  w.document.write(`<title>Berita Acara Penelitian - ${esc(no)}</title><style>@page{size:A4 landscape;margin:14mm}body{margin:0}${PT_PAPER_CSS}.bap{padding:0}</style><body><div class="bap">${ptPrevHtml(f, no)}</div>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
}

/* Generate .docx dari template Word */
function ptTokens(f) {
  return {
    Nomor_BAP: f.nobap, Tanggal_BAP_Terbaca: f.terbaca || ptTerbaca(f.tgl), Tanggal_BAP_Terbilang: ptKal(f.tgl),
    Nomor_Surat_Permohonan: f.nosurat, Tanggal_Surat_Permohonan: f.tglsurat, Perihal_Surat_Permohoanan: f.perihal,
    Nama_BMD: f.bmd, OPD_Pemohon: f.opd, Alamat_Objek_Pemohon: f.alamat,
    Nomor_Keputusan: f.nokep, Tanggal_Keputusan: ptLong(f.tglkep), Judul_Keputusan: f.judulkep,
    Anggota_Tidak_Tetap_1_: f.at1, NIP_1: ptNip(f.nip1), Anggota_Tidak_tetap_2: f.at2, NIP_2: ptNip(f.nip2)
  };
}
const ptX = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').split(/\r?\n/).join('</w:t><w:br/><w:t xml:space="preserve">');
function ptLampXml(items) {
  const F = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>';
  const P = (t, o = {}) => `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>${o.c ? '<w:jc w:val="center"/>' : ''}</w:pPr><w:r><w:rPr>${F}${o.b ? '<w:b/>' : ''}<w:sz w:val="${o.sz || 20}"/><w:szCs w:val="${o.sz || 20}"/></w:rPr><w:t xml:space="preserve">${ptX(t)}</w:t></w:r></w:p>`;
  const W = [600, 1400, 1400, 1200, 3000, 1700, 1300, 1500, 800, 1500, 1794];
  const C = (i, t, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${W[i]}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${P(t, o)}</w:tc>`;
  const bd = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(x => `<w:${x} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('');
  const rows = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${PT_LAMP_H.map((h, i) => C(i, h, { b: 1, c: 1 })).join('')}</w:tr>` +
    items.map((x, n) => `<w:tr><w:trPr><w:trHeight w:val="420"/></w:trPr>${ptLampRow(x, n).map((v, i) => C(i, String(v), { c: [0, 6].includes(i) })).join('')}</w:tr>`).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${W.reduce((a, b) => a + b)}" w:type="dxa"/><w:tblBorders>${bd}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${W.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows}</w:tbl><w:p/>`;
}
async function ptDocx(no, f) {
  if (typeof JSZip == 'undefined' || typeof BA_TPL_B64 == 'undefined') throw new Error('JSZip / template belum termuat');
  const bin = atob(BA_TPL_B64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), m = ptTokens(f);
  const fill = t => t.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (a, k) => k == 'LAMPIRAN' ? a : ptX(m[k]));
  z.file('word/header1.xml', (await z.file('word/header1.xml').async('string')).replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (a, k) => ptX(m[k])));
  let x = fill(await z.file('word/document.xml').async('string'));
  const i = x.indexOf('{{LAMPIRAN}}'), a = x.lastIndexOf('<w:p>', i), b = x.indexOf('</w:p>', i) + 6;
  if (i < 0 || a < 0) throw new Error('Penanda lampiran tidak ditemukan di template');
  x = x.slice(0, a) + ptLampXml(ptItems(no)) + x.slice(b);
  z.file('word/document.xml', x);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}