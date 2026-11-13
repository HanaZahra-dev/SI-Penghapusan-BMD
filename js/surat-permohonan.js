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

/* Isi template Word -> Blob .docx.
   tt (opsional) = TTD digital yang sah { img (data URL PNG transparan), w, h, ts, id }.
   Bila ada, gambar TTD disisipkan menggantikan ruang kosong di atas nama kepala, dan keterangan kecil ditambahkan di bawah NIP. */
async function suratPermohonanDocx(f, tt) {
  if (typeof JSZip == 'undefined' || typeof SURAT_TPL_B64 == 'undefined') throw new Error('JSZip / template surat belum termuat');
  const bin = atob(SURAT_TPL_B64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const z = await JSZip.loadAsync(u), m = suratTokens(f);
  let x = (await z.file('word/document.xml').async('string')).replace(/\{\{([A-Z_]+)\}\}/g, (a, k) => k in m ? suratEsc(m[k]).replace(/&quot;/g, '"') : a);
  if (tt && tt.img) {
    const a = x.indexOf('Kepala ' + suratEsc(m.OPD)), b = x.indexOf(suratEsc(m.KEPALA), a);
    const e1 = a < 0 ? -1 : x.indexOf('</w:p>', a) + 6, s2 = b < 0 ? -1 : x.lastIndexOf('<w:p ', b);
    if (e1 > 5 && s2 > e1) {
      /* gambar: tinggi maks 2,0 cm, lebar maks 5,0 cm (1 cm = 360000 EMU), proporsi dijaga */
      const r = Math.min(720000 / tt.h, 1800000 / tt.w), cx = Math.max(1, Math.round(tt.w * r)), cy = Math.max(1, Math.round(tt.h * r));
      const pic = '<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="7034"/></w:tabs><w:ind w:left="6663"/></w:pPr><w:r><w:drawing>' +
        '<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
        '<wp:docPr id="9001" name="TTD Kepala OPD" descr="Tanda tangan digital Kepala OPD"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="9001" name="ttd-kepala.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdTtd1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
      x = x.slice(0, e1) + pic + x.slice(s2);
      /* keterangan kecil di bawah NIP: ganti paragraf kosong terakhir sebelum sectPr */
      const ket = 'Ditandatangani secara digital melalui SI Penghapusan BMD · ' + suratEsc(tt.ts || '') + (tt.id ? ' · ID ' + suratEsc(tt.id) : '');
      const sp = x.lastIndexOf('<w:p ', x.indexOf('<w:sectPr'));
      if (sp > 0 && !/<w:t[ >]/.test(x.slice(sp, x.indexOf('<w:sectPr'))))
        x = x.slice(0, sp) + '<w:p><w:pPr><w:ind w:left="6379"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr><w:t xml:space="preserve">' + ket + '</w:t></w:r></w:p>' + x.slice(x.indexOf('<w:sectPr'));
      const png = atob(tt.img.split(',')[1] || ''), pb = new Uint8Array(png.length);
      for (let i = 0; i < png.length; i++) pb[i] = png.charCodeAt(i);
      z.file('word/media/ttd-kepala.png', pb);
      const rl = await z.file('word/_rels/document.xml.rels').async('string');
      z.file('word/_rels/document.xml.rels', rl.replace('</Relationships>', '<Relationship Id="rIdTtd1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/ttd-kepala.png"/></Relationships>'));
    }
  }
  z.file('word/document.xml', x);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}

/* Pratinjau HTML dengan susunan yang sama dengan template (untuk ditampilkan di aplikasi) */
function suratHtml(f, tt) {
  const t = suratTokens(f), e = suratEsc;
  return `<div class="srt">
<div class="srt-kop"><img src="assets/logo-kota-bogor.png" alt=""><div><b>PEMERINTAH KOTA BOGOR</b><b>BADAN KEUANGAN DAN ASET DAERAH KOTA BOGOR</b><span>Jl. Pemuda No.31 Telp. (0251) 8323099 Fax.8323099</span><span>Email:bkad@kotabogor.go.id, Website : https://bkad.kotabogor.go.id</span></div></div>
<div class="srt-tgl">Bogor, ${e(t.TANGGAL)}</div>
<table class="srt-m"><tr><td>No Surat</td><td>: ${e(t.NOMOR)}</td></tr><tr><td>Sifat</td><td>: Penting</td></tr><tr><td>Lampiran</td><td>: 4</td></tr><tr><td>Hal</td><td>: Permohonan Usulan ${e(t.JENIS_CAP)} dan Penaksiran</td></tr></table>
<p class="srt-j srt-i">Disampaikan dengan hormat, bahwa dalam rangka tertib Pengelolaan Barang Milik Daerah, sesuai Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah dan Peraturan Walikota Bogor Nomor 114 Tahun 2020 Tentang Peraturan Pelaksana Peraturan Daerah Kota Bogor Nomor 2 Tahun 2018 tentang Pengelolaan Barang Milik Daerah, maka dengan ini kami mengajukan permohonan usulan ${e(t.JENIS)} Barang Milik Daerah pada ${e(t.OPD_UPPER)}.</p>
<p class="srt-j srt-i">Bersama ini kami lampirkan dokumen pendukung usulan ${e(t.JENIS)} BMD tersebut sebagai berikut:</p>
<ol class="srt-j"><li>Kartu Inventaris Barang (KIB)</li><li>Surat pernyataan Kepala Badan bahwa BMD terlampir sudah tidak digunakan untuk keperluan Tugas dan Fungsi</li><li>Berita Acara Hasil Penelitian Tim Inventarisasi Dan Kajian ${e(t.JENIS_CAP)} Barang Milik Daerah (BMD)</li><li>Foto/dokumentasi Barang Milik Daerah</li></ol>
<p class="srt-i">Demikian permohonan ini kami sampaikan, atas perkenan dan perhatiannya kami<br><span class="srt-n">ucapkan terima kasih</span></p>
<div class="srt-ttd"><div>Kepala ${e(t.OPD)}</div>${tt && tt.img ? `<div class="srt-sg"><img alt="Tanda tangan digital Kepala OPD" src="${e(tt.img)}"></div>` : '<div class="srt-sp"></div>'}<div>${e(t.KEPALA)}<br>NIP. ${e(t.NIP)}</div>${tt && tt.img ? `<div class="srt-dg">Ditandatangani secara digital melalui SI Penghapusan BMD · ${e(tt.ts || '')}${tt.id ? ' · ID ' + e(tt.id) : ''}</div>` : ''}</div>
</div>`;
}
