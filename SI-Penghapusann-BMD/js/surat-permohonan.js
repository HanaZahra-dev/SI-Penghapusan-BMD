/* Surat Permohonan otomatis.
   Dokumen 1 (Surat Permohonan) tidak lagi diunggah Pengguna Barang, tetapi dibuat sistem dalam format
   Word (.docx) dari template "Permohonan Penjualan" (js/surat-template.js), diisi dari isian formulir:
   jenis, nomor surat, tanggal, perangkat daerah, nama kepala, dan NIP kepala.

   f : { jn, no, tgl (yyyy-mm-dd), pd, kepala, nip }  */

const SURAT_DOCX_NAME = 'surat-permohonan.docx';

/* Tanda isi surat: dipakai untuk mendeteksi perubahan data (bukan membandingkan berkas). */
function suratSig(f) { return JSON.stringify([f.jn, f.no, f.tgl, f.pd, f.kepala || '', f.nip || '']); }

/* Surat bisa dibuat bila nomor, tanggal, dan perangkat daerah sudah ada. */
function suratSiap(f) { return !!(f && f.no && f.tgl && f.pd); }

function suratEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function suratTokens(f) {
  const bongkar = f.jn == 'Izin Bongkar', titik = '...........................................';
  const tgl = f.tgl ? new Date(f.tgl + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return {
    TANGGAL: tgl, NOMOR: f.no || '',
    JENIS: bongkar ? 'izin bongkar' : 'penjualan', JENIS_CAP: bongkar ? 'Izin Bongkar' : 'Penjualan',
    OPD: f.pd || '', OPD_UPPER: String(f.pd || '').toUpperCase(),
    KEPALA: (f.kepala || '').trim() || titik, NIP: (f.nip || '').trim() || titik
  };
}

/* Isi template Word -> Blob .docx. Surat tidak menyisipkan TTD Kepala OPD. */
async function suratPermohonanDocx(f) {
  if (typeof JSZip == 'undefined' || typeof SURAT_TPL_B64 == 'undefined') throw new Error('JSZip / template surat belum termuat');
  const bin = atob(SURAT_TPL_B64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), m = suratTokens(f);
  let x = (await z.file('word/document.xml').async('string')).replace(/\{\{([A-Z_]+)\}\}/g, (a, k) => k in m ? suratEsc(m[k]).replace(/&quot;/g, '"') : a);
  z.file('word/document.xml', x);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}

/* Pratinjau HTML dengan susunan yang sama dengan template (untuk ditampilkan di aplikasi) */
function suratHtml(f) {
  const t = suratTokens(f), e = suratEsc;
  return `<div class="srt">
<div class="srt-kop"><img src="assets/logo-kota-bogor.png" alt=""><div><b>PEMERINTAH KOTA BOGOR</b><b>BADAN KEUANGAN DAN ASET DAERAH KOTA BOGOR</b><span>Jl. Pemuda No.31 Telp. (0251) 8323099 Fax.8323099</span><span>Email:bkad@kotabogor.go.id, Website : https://bkad.kotabogor.go.id</span></div></div>
<div class="srt-tgl">Bogor, ${e(t.TANGGAL)}</div>
<table class="srt-m"><tr><td>No Surat</td><td>: ${e(t.NOMOR)}</td></tr><tr><td>Sifat</td><td>: Penting</td></tr><tr><td>Lampiran</td><td>: 4</td></tr><tr><td>Hal</td><td>: Permohonan Usulan ${e(t.JENIS_CAP)} dan Penaksiran</td></tr></table>
<p class="srt-j srt-i">Disampaikan dengan hormat, bahwa dalam rangka tertib Pengelolaan Barang Milik Daerah, sesuai Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah dan Peraturan Walikota Bogor Nomor 114 Tahun 2020 Tentang Peraturan Pelaksana Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah, maka dengan ini kami mengajukan permohonan usulan ${e(t.JENIS)} Barang Milik Daerah pada ${e(t.OPD_UPPER)}.</p>
<p class="srt-j srt-i">Bersama ini kami lampirkan dokumen pendukung usulan ${e(t.JENIS)} BMD tersebut sebagai berikut:</p>
<ol class="srt-j"><li>Kartu Inventaris Barang (KIB)</li><li>Surat pernyataan Kepala Badan bahwa BMD terlampir sudah tidak digunakan untuk keperluan Tugas dan Fungsi</li><li>Berita Acara Hasil Penelitian Tim Inventarisasi Dan Kajian ${e(t.JENIS_CAP)} Barang Milik Daerah (BMD)</li><li>Foto/dokumentasi Barang Milik Daerah</li></ol>
<p class="srt-i">Demikian permohonan ini kami sampaikan, atas perkenan dan perhatiannya kami<br><span class="srt-n">ucapkan terima kasih</span></p>
<div class="srt-ttd"><div>Kepala ${e(t.OPD)}</div><div class="srt-sp"></div><div>${e(t.KEPALA)}<br>NIP. ${e(t.NIP)}</div></div>
</div>`;
}
