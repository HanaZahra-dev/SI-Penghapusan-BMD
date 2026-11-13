const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const st=x=>`<span class="stt ${x}">${x}</span>`;
const NM=['Dinas Pendidikan','Dinas Kesehatan','Dinas PUPR','Dinas Perhubungan','Dinas Lingkungan Hidup','Bapenda','Dinas Sosial','Satpol PP'];
const AS=[['Laptop Acer 14','3.01.02.01.004'],['Kendaraan Dinas (Roda 4)','3.02.01.01.002'],['Mesin Generator','3.03.01.01.005'],['Komputer PC','3.04.01.01.003'],['Meja Kantor','3.05.01.01.007'],['Printer HP LaserJet','3.01.02.01.009']];
const R=Array.from({length:24},(_,i)=>{const m=i%6,a=AS[i%6],t=new Date(2026,8,22-i*2);return ['PM-'+ String(i+1).padStart(3,'0')+'-2026',NM[i%8],a[0],a[1],i%3?'Izin Bongkar':'Pemindahtanganan',t.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}),m<2?'Dalam Proses':m<5?'Disetujui':'Ditolak',2012+i%9,'Rp '+((i%7+2)*4.5).toFixed(1).replace('.',',')+'00.000',i%2?'Rusak Berat':'Rusak Ringan','Permohonan penghapusan karena kerusakan dan tidak layak pakai.',[3,5,2,4][i%4]+' file','ABCDEF'[i%6]]});
const EY='<svg class="i" style="width:16px;height:16px"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',ED='<svg class="i" style="width:16px;height:16px"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
let pg=1,fs='',editNo=null,detCur=null;
const vis=()=>R.filter(own),deny=()=>toast('Anda tidak memiliki hak untuk tindakan ini.');
/* RX buat aksi */
var RX={};
const hs=(no,a,n)=>{const x=RX[no]=RX[no]||{h:[]};x.h=x.h||[];x.h.push({t:new Date().toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),a:a,n:n||''})};

const EDIT_OK={'Draft':1,'Ditolak':1};
function acts(d,i){const s=d[6],ed=EDIT_OK[s],w=bolehTulis(d);
 return `<button class="ib" data-r="${i}" aria-label="Lihat detail" title="Lihat">${EY}</button>${w?`<button class="ib" aria-label="Ubah" ${ed?`data-ed="${i}" title="${s=='Ditolak'?'Perbaiki':'Edit'}"`:'disabled title="Tidak dapat diedit: permohonan sudah diajukan" style="opacity:.35;cursor:not-allowed"'}>${ED}</button>${ed?(s=='Ditolak'?`<button class="btn sm vf" data-ed="${i}">Perbaiki &amp; Ajukan Ulang</button>`:`<button class="btn sm vf" data-vf="${i}">Ajukan Verifikasi</button>`):s=='Menunggu Verifikasi'?`<button class="btn o sm vf" data-wd="${i}">Tarik Kembali</button>`:s=='Disetujui'&&psjOk(d[0])?`<button class="btn sm vf" data-pnk="${i}">Lanjut ke Penaksiran</button>`:''}`:''}<button class="ib" data-mn="${i}" aria-label="Lainnya" title="Lainnya">&#8942;</button>`}
const DOCN=['Permohonan Pemindahtanganan / Izin Bongkar','Surat Kajian / BA Penelitian','Surat Perintah','Surat Pernyataan'];
/* Preview Dokumen/Berks(PDF) */
function samplePdf(judul,sub){const e=t=>String(t).replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&'),
 tx=`BT /F1 20 Tf 60 760 Td (${e(judul)}) Tj 0 -28 Td /F1 12 Tf (${e(sub)})  Tj 0 -22 Td (Dokumen contoh untuk demo - bukan berkas asli.) Tj ET`,
 o=['<</Type/Catalog/Pages 2 0 R>>','<</Type/Pages/Kids[3 0 R]/Count 1>>','<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',`<</Length ${tx.length}>>\nstream\n${tx}\nendstream`,'<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'];
 let p='%PDF-1.4\n';const off=[];o.forEach((b,i)=>{off.push(p.length);p+=`${i+1} 0 obj\n${b}\nendobj\n`});
 const x=p.length;p+=`xref\n0 ${o.length+1}\n0000000000 65535 f \n`+off.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${o.length+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`;
 const b=new Blob([p],{type:'application/pdf'});b._seed=[judul,sub];return b}
(function(){const D4=['surat-permohonan.pdf','surat-kajian.pdf','surat-perintah.pdf','surat-pernyataan.pdf'],fmt=s=>new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
 const mk=(no,pd,stt,iso,pf,docs,kib,cat,hist)=>{const kk=[['02.06.01.01.01','Toyota Kijang Innova',2012,'Rusak Berat'],['02.06.01.04.02','Honda Supra X 125',2014,'Rusak Berat'],['02.05.01.04.08','AC Split 1 PK',2016,'Rusak Ringan']],a=kk[kib[0]];
  R.unshift([no,pd,a[1]+(kib.length>1?' +'+(kib.length-1)+' lainnya':''),a[0],'Izin Bongkar',fmt(iso),stt,a[2],'-',a[3],pf,docs.filter(Boolean).length+' file','B']);
  RX[no]={h:[],cat:cat||'',chk:[],f:{jn:'Izin Bongkar',no:no,tgl:iso,pd:pd,pf:pf,docs:docs,files:docs.map((n,i)=>n?samplePdf(DOCN[i],no+' - '+pd):null),kib:kib}};hist.forEach(x=>hs(no,x[0],x[1]))};
 mk('PM-025-2026','Dinas PUPR','Draft','2026-10-14','Penghapusan kendaraan dinas rusak berat',D4,[0,1],'',[['Draft dibuat']]);
 mk('PM-026-2026','Dinas Kesehatan','Menunggu Verifikasi','2026-10-13','Penghapusan AC rusak berat gedung puskesmas',D4,[2],'',[['Draft dibuat'],['Diajukan untuk verifikasi Admin']]);
 mk('PM-027-2026','Dinas Sosial','Draft','2026-10-12','Penghapusan kendaraan roda dua operasional',[D4[0],D4[1],D4[2],''],[1],'',[['Draft dibuat','Pengguna Barang Dinsos'],['Draft diedit','Pengguna Barang Dinsos · Perihal, Surat Kajian diganti']])})();
function tlHtml(d){const x=RX[d[0]];if(!x||!x.h||!x.h.length)return `<ul class="tl"><li><b>Pengajuan dibuat</b><small>${d[5]} · ${d[1]}</small></li><li><b>Verifikasi dokumen</b><small>Admin</small></li><li><b>Status saat ini: ${d[6]}</b><small>Menunggu tindak lanjut</small></li></ul>`;
 return (x.cat&&d[6]=='Ditolak'?`<div class="al2" style="margin-bottom:14px"><b>Catatan Admin:</b> ${x.cat}${cnHtml(d[0])}</div>`:'')+`<ul class="tl">${x.h.map(h=>`<li><b>${h.a}</b><small>${h.t}${h.n?' · '+h.n:''}</small></li>`).join('')}<li><b>Status saat ini: ${d[6]}</b><small>${d[6]=='Menunggu Verifikasi'?'Menunggu pemeriksaan Admin':d[6]=='Draft'?'Belum diajukan, masih dapat diedit':tahapNow(d)||(d[6]=='Dalam Proses'?'Sedang dalam survei / Penelitian Tim Penghapusan':'Selesai')}</small></li></ul>`}
function fl(){cc();const q=$('#q2').value.toLowerCase(),r=R.map((d,i)=>[d,i]).filter(([d])=>own(d)&&(!fs||d[6]==fs)&&d.join(' ').toLowerCase().includes(q)),n=Math.max(1,Math.ceil(r.length/4));pg=Math.min(pg,n);
 $('#t2').innerHTML=r.slice((pg-1)*4,pg*4).map(([d,i],k)=>`<tr><td>${(pg-1)*4+k+1}</td><td class="mono">${d[0]}</td><td>${d[5]}</td><td>${d[1]}</td><td>${d[11]}</td><td>${d[12]}</td><td>${stp(d)}</td><td class="ac">${acts(d,i)}</td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--mt);padding:34px">Tidak ada permohonan yang cocok.</td></tr>';
 $('#cnt').textContent=`Menampilkan ${r.length?(pg-1)*4+1:0}-${Math.min(pg*4,r.length)} dari ${r.length} data`;
 $('#pgn').innerHTML=`<button data-g="${Math.max(1,pg-1)}">&lsaquo;</button>`+Array.from({length:n},(_,k)=>`<button data-g="${k+1}" class="${k+1==pg?'on':''}">${k+1}</button>`).join('')+`<button data-g="${Math.min(n,pg+1)}">&rsaquo;</button>`}
$('#q2').addEventListener('input',()=>{pg=1;fl()});
$$('.cs>div').forEach(c=>c.onclick=()=>{fs=c.dataset.f;pg=1;$$('.cs>div').forEach(x=>x.classList.toggle('on',x==c));fl()});
$('#fb').onclick=()=>{const c=$$('.cs>div'),k=(c.findIndex(x=>x.classList.contains('on'))+1)%c.length;c[k].click()};
document.addEventListener('click',e=>{const r=e.target.closest('[data-r]'),g=e.target.closest('[data-g]');if(r)detail(+r.dataset.r,R);if(g&&g.closest('#pgn')){pg=+g.dataset.g;fl()}});
fl();
const isMob=()=>matchMedia('(max-width:860px)').matches,closeNav=()=>{document.body.classList.remove('mo');$('#mn').setAttribute('aria-expanded','false')};
$('#mn').onclick=()=>{if(isMob()){const o=document.body.classList.toggle('mo');$('#mn').setAttribute('aria-expanded',o)}else document.body.classList.toggle('sbc')};
$('#sov').onclick=closeNav;$('#sbx').onclick=closeNav;$$('#side nav .nav').forEach(b=>b.addEventListener('click',closeNav));
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeNav()});matchMedia('(max-width:860px)').addEventListener('change',closeNav);
const K=[['KIB-A-001','1.3.01','Kendaraan Dinas',2018,'Rusak Berat',1,'Unit'],['KIB-B-025','1.3.02','Mesin / Peralatan',2019,'Rusak Berat',2,'Unit'],['KIB-C-117','1.3.03','Peralatan Kantor',2017,'Rusak Sedang',5,'Satuan'],['KIB-C-204','1.3.04','Material Bongkaran',2016,'Rusak Berat',10,'Batang'],['KIB-C-009','1.3.05','Gedung Gudang Peralatan',1998,'Rusak Berat',1,'Unit']];
$('#fpd').innerHTML=NM.map(x=>`<option>${x}</option>`).join('');
$('#kt').innerHTML=K.map((k,i)=>`<tr><td><input type="checkbox" class="kb" data-k="${i}" aria-label="Pilih ${k[2]}"></td><td class="mono">${k[0]}</td><td class="mono">${k[1]}</td><td>${k[2]}</td><td>${k[3]}</td><td>${k[4]}</td><td class="mono">${k[5]}</td><td>${k[6]}</td></tr>`).join('');
function cc(){$$('.cs>div').forEach(c=>{const g=c.dataset.f;c.querySelector('b').textContent=g?vis().filter(d=>d[6]==g).length:vis().length});$$('.tot').forEach(x=>x.textContent=vis().length)}
let tt;function toast(m,jenis){const t=$('#tst');if(t.parentNode!==document.body)document.body.appendChild(t);t.textContent=m;t.className='toast on'+(jenis?' '+jenis:'');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),Math.max(3000,m.length*60))}
function sum(){const idn=!!($('#fn').value.trim()&&$('#fp2').value.trim()&&$('#fd').value),kc=$$('.kb:checked').length;genRow(!!($('#fn').value.trim()&&$('#fd').value&&$('#fpd').value));const dc=$$('.upl.y').length;
 $('#dct').textContent=dc+'/4 Lengkap';$('#kct').textContent=kc+' barang dipilih';$('#sdt').textContent=`Dokumen persyaratan (${dc}/4)`;$('#skt').textContent=`Barang KIB (${kc} dipilih)`;
 [['#si',idn],['#sd',dc==4],['#sk2',kc>0]].forEach(([e,v])=>$(e).classList.toggle('y',v));
 const n=(idn?1:0)+(dc==4?1:0)+(kc?1:0);$('#pbf').style.width=(n/3*100)+'%';
 /* Logic untuk harus menyimpan permohonan terlebih dahulu, baru boleh ajukan */
 $('#sx').textContent=n<3?'Dokumen, dan barang KIB harus sudah lengkap.':editNo&&ttdFormState().k!='signed'?'Draft lengkap. Surat permohonan perlu ditandatangani digital oleh Kepala OPD sebelum diajukan.':editNo?'Draft tersimpan dan lengkap. Siap diajukan.':'Data lengkap. Simpan sebagai draft terlebih dahulu, setelah itu baru dapat diajukan.';const tOk=ttdFormState().k=='signed';$('#aj').disabled=n<3||!editNo||!tOk;$('#aj').title=!editNo?'Simpan sebagai draft terlebih dahulu':!tOk?'Surat belum ditandatangani digital oleh Kepala OPD':'';try{ttdRender()}catch(er){}
 /* Stepper/Alur (kyk Flowchart gitu) isinya 5 langkah */
 const stp=$$('#fsw .s'),ds=[idn,dc==4,kc>0,!!editNo,false];
 ds.forEach((v,i)=>{stp[i].classList.toggle('done',v);stp[i].querySelector('i').innerHTML=v?'&#10003;':i+1});
 const f=ds.indexOf(false);stp.forEach((x,i)=>x.classList.toggle('on',i==f))
}
$$('.upl input[type=file]').forEach(inp=>inp.onchange=()=>{const f=inp.files[0],u=inp.closest('.upl'),sm=u.querySelector('small'),bt=u.querySelector('.bt');
 if(!f){u._file=null;u.classList.remove('y');sm.textContent='PDF, maksimal 5 MB';bt.firstChild.textContent='Pilih File';sum();return}
 if(f.size>5*1048576){inp.value='';u._file=null;u.classList.remove('y');sm.textContent='Ukuran file melebihi 5 MB.';sm.style.color='#c23a32';bt.firstChild.textContent='Pilih File';sum();return}
 u._file=f;sm.style.color='';sm.textContent=f.name+' · '+Math.max(1,Math.round(f.size/1024))+' KB';u.classList.add('y');bt.firstChild.textContent='Ganti';sum()});
$('#ka').onchange=e=>{$$('.kb').forEach(x=>x.checked=e.target.checked);sum()};
$$('.kb').forEach(x=>x.onchange=()=>{$('#ka').checked=$$('.kb').every(y=>y.checked);sum()});
['#fn','#fp2','#fd'].forEach(x=>$(x).addEventListener('input',sum));sum();

function show(v,btn){$$('.vw').forEach(e=>e.classList.toggle('on',e.id==v));const b=btn||$$('.nav').find(n=>n.dataset.v==(v=='det'||v=='form'?(canView('list')?'list':'dash'):v));$$('.nav').forEach(n=>n.classList.toggle('on',n==b));
 const t=b?b.textContent.replace(/\d+$/,'').trim():'';$('#bc').textContent=v=='dash'?'Dashboard':v=='det'?(canView('list')?'Modul 1 › Permohonan › Detail':'Dashboard › Detail Permohonan'):v=='form'?(canView('list')?'Modul 1 › Permohonan › Buat Permohonan':'Dashboard › Buat Permohonan'):(b.dataset.g||'Modul 1')+' › '+t;if(v=='soon')$('#sn').textContent=t;scrollTo({top:0})}
$$('.nav').forEach(n=>n.onclick=()=>show(n.dataset.v,n));
const bell=$('#bellBtn');
bell.onclick=()=>{if(canView('adm'))show('adm')};
bell.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();bell.onclick()}};
$$('[data-v2]').forEach(b=>b.onclick=()=>show(b.dataset.v2));
function detail(i,src,tab){tab=tab||0;const d=(src||R)[i];if(!own(d))return deny();detCur={no:d[0],tab};const T=['Informasi Barang','Dokumen','Riwayat Proses','Hasil Persetujuan'];
 const P=[`<div class="inf"><div class="img"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg></div><dl><dt>Nama Barang</dt><dd>${d[2]}</dd><dt>Kode Barang</dt><dd>${d[3]}</dd><dt>Tahun Perolehan</dt><dd>${d[7]}</dd><dt>Nilai Perolehan</dt><dd>${d[8]}</dd><dt>Kondisi</dt><dd>${d[9]}</dd></dl></div>`,
 (RX[d[0]]||{}).f?`<div class="drs">${docRows(d[0],false)}</div>`:`<dl><dt>Surat Permohonan</dt><dd>${d[0]}-surat.pdf</dd><dt>Surat Kajian</dt><dd>${d[0]}-kajian.pdf</dd><dt>Surat Perintah</dt><dd>${d[0]}-perintah.pdf</dd><dt>Surat Pernyataan</dt><dd>${d[0]}-pernyataan.pdf</dd></dl>`,
 `${tlHtml(d)}`,
 `<p style="color:var(--mt);margin:0">Belum ada hasil persetujuan untuk permohonan ini.</p>`];
 $('#det').innerHTML=`<button class="bk" data-v2="list">&larr; Kembali</button><div class="cd"><div class="ch"><h1 style="font-size:22px;margin:0">Detail Permohonan</h1>${stp(d)}</div><div style="font:800 20px var(--dp)">${d[0]}</div><div style="color:var(--mt)">${d[1]} · ${d[5]}</div>${d[6]=='Ditolak'?`<div class="al2 rjb" style="margin-top:14px"><b>Permohonan ditolak oleh Admin.</b> ${esc((RX[d[0]]||{}).cat||'')}${cnHtml(d[0])}<div style="margin-top:8px">Perbaiki sesuai keterangan di atas, lalu ajukan ulang.</div></div>`:''}
 <div class="tb" style="margin-top:18px">${T.map((t,k)=>`<button class="${k==tab?'on':''}" data-t="${k}">${t}</button>`).join('')}</div><div id="tp">${P[tab]}</div></div>
 <div class="cd"><h2 style="margin-bottom:12px">Data Permohonan</h2><dl><dt>Jenis Permohonan</dt><dd>${d[4]}</dd><dt>Tanggal Pengajuan</dt><dd>${d[5]}</dd><dt>Perangkat Daerah</dt><dd>${d[1]}</dd><dt>Keterangan</dt><dd>${d[10]}</dd></dl></div>
 ${bolehTulis(d)?(d[6]=='Draft'||d[6]=='Ditolak'?`<button class="btn" id="dEd" style="width:100%;justify-content:center;padding:14px">${d[6]=='Ditolak'?'Perbaiki &amp; Ajukan Ulang':'Edit'} &rarr;</button>`:`<button class="btn" disabled style="width:100%;justify-content:center;padding:14px">Edit &rarr;</button><p class="mt" style="text-align:center;margin:8px 0 0;font-size:12.5px">Permohonan sudah diajukan sehingga tidak dapat diedit.</p>`):''}`;
 if($('#dEd'))$('#dEd').onclick=()=>editRow(R.indexOf(d));
 $$('#det [data-v2]').forEach(b=>b.onclick=()=>show('list'));
 $$('#det [data-t]').forEach(b=>b.onclick=()=>{detCur.tab=+b.dataset.t;$$('#det [data-t]').forEach(x=>x.classList.toggle('on',x==b));$('#tp').innerHTML=P[+b.dataset.t]});show('det')}
$('#lv').onclick=()=>{const p=$('#lp'),h=p.type=='password';p.type=h?'text':'password';$('#lv').classList.toggle('on',h)};
$('#sso').onclick=()=>{$('#le').textContent='Login SSO belum diaktifkan pada versi demo.'};
/*  Login, peran, dan sesi  */
$('#lf').addEventListener('submit',e=>{e.preventDefault();const u=$('#lu').value.trim(),w=$('#lp').value;
 if(!u||!w){$('#le').textContent=!u?'Isi email.':'Isi kata sandi.';return}
 const r=authenticate(u,w);
 if(r.error){$('#le').textContent=r.error;$('#lp').value='';$('#lp').focus();return}
 $('#le').textContent='';const bt=$('#lbtn');bt.disabled=true;bt.textContent='Memproses…';
 setTimeout(()=>{bt.disabled=false;bt.textContent='Masuk';$('#lp').value='';$('#lu').value='';masuk(r.account,$('#lrem').checked)},700)});
$('#lu').addEventListener('input',()=>$('#le').textContent='');
if(TAMPIL_AKUN_DEMO){$('#demo div').innerHTML=ACCOUNTS.map(a=>`<button data-demo="${a.email}" type="button">${a.tag}</button>`).join('');$('#demo').hidden=false;$('#demo').addEventListener('click',e=>{const b=e.target.closest('[data-demo]');if(b){$('#lu').value=b.dataset.demo;$('#le').textContent='';$('#lp').focus()}})}
/* Sidebar mengikuti Roles (admin, pengguna barang) */
function terapkanMenu(){let g=null,n=0;
 [...$('#side nav').children].forEach(el=>{
  if(el.classList.contains('grp')){if(g)g.hidden=!n;g=el;n=0}
  else if(el.classList.contains('nav')){const ok=canView(el.dataset.v);el.hidden=!ok;if(ok&&g)n++}});
 if(g)g.hidden=!n}
/* Logic untuk menggabungkan laman permohonan ke dashboard (jadi gaada laman permohonan di admin) */
function tataDaftar(){const pb=!canView('list'),kartu=$('#q2').closest('.cd'),kosong=$('#em'),tujuan=pb?$('#dashList'):$('#list');
 if(kartu.parentNode!==tujuan){tujuan.appendChild(kartu);tujuan.appendChild(kosong)}
 $('#dRecent').style.display=pb?'none':'';$('#dash .s4').style.display=pb?'none':''}
function terapkanPeran(){const r=ROLES[CUR.role];tataDaftar();$('#alur').style.display=canView('list')?'':'none';
 document.body.dataset.role=CUR.role;
 $$('.nm').forEach(x=>x.textContent=CUR.name);$$('.ro').forEach(x=>x.textContent=r.label);
 $$('.ini').forEach(x=>x.textContent=CUR.ini);$$('.un').forEach(x=>x.textContent=CUR.opd||CUR.unit);
 $('#dsub').textContent=CUR.opd?'Permohonan penghapusan Barang Milik Daerah milik '+CUR.opd+'.':'';
 $('#fpd').innerHTML=(CUR.opd?[CUR.opd]:NM).map(x=>`<option>${x}</option>`).join('');$('#fpd').disabled=!!CUR.opd;
 $('#list .bn p').textContent=r.listDesc;$('#lsub').textContent=r.listSub;$('#em p').textContent=r.listEmpty;
 terapkanMenu()}
function masuk(a,remember){CUR=a;if(remember!==undefined)saveSession(a,remember);
 terapkanPeran();document.body.classList.remove('lg');document.body.classList.add('in');fl();show('dash')}
function keluar(){clearSession();CUR=null;delete document.body.dataset.role;
 const m=$('#mdl');if(m)m.classList.remove('on');rmClose();
 document.body.classList.remove('in','sbc','mo');detCur=null;$('#lu').value=lastEmail();scrollTo({top:0})}
/* Ilustrasi Isometrik */
(function(){const s=21,cx=240,cy=100,P=(x,y,z)=>((cx+(x-y)*.866*s).toFixed(1)+','+(cy+(x+y)*.5*s-z*s).toFixed(1));
 const bx=(x,y,w,d,h,c)=>`<polygon points="${P(x,y,h)} ${P(x+w,y,h)} ${P(x+w,y+d,h)} ${P(x,y+d,h)}" fill="${c[0]}"/><polygon points="${P(x,y+d,0)} ${P(x+w,y+d,0)} ${P(x+w,y+d,h)} ${P(x,y+d,h)}" fill="${c[1]}"/><polygon points="${P(x+w,y,0)} ${P(x+w,y+d,0)} ${P(x+w,y+d,h)} ${P(x+w,y,h)}" fill="${c[2]}"/>`;
 const win=(x,y,w,h,n)=>{let o='';for(let i=0;i<n;i++)o+=`<polygon points="${P(x+w,y+.5,h+i*.9)} ${P(x+w,y+1.2,h+i*.9)} ${P(x+w,y+1.2,h+i*.9+.45)} ${P(x+w,y+.5,h+i*.9+.45)}" fill="#fff" opacity=".7"/>`;return o};
 const B=[[0,0,10,10,.6,['#e4eeff','#bcd3fa','#9fc0f6']],[1,1,4,4,6,['#7ab0ff','#3d82f5','#2563eb']],[6,1.2,2.4,2.8,3.8,['#9cc4ff','#5b9bf8','#3a7cf0']],[1.2,6.2,3.2,2.4,2.2,['#b6d4ff','#74a9fa','#4f8df4']],[6.2,6,2.6,2.6,1.4,['#d6e6ff','#9ec1f8','#7aa9f3']]];
 let g=B.map(b=>bx(...b)).join('')+win(1,1,4,0,6)+win(5,1,0,0,0);
 const sh=(x,y,c)=>`<g class="fl${c}" transform="translate(${x} ${y})"><rect width="64" height="64" rx="16" fill="#fff" stroke="#bcd3fa"/><path d="M32 14l15 6v12c0 9-6 15-15 18-9-3-15-9-15-18V20z" fill="#e1ecff" stroke="#2563eb" stroke-width="3" stroke-linejoin="round"/><path d="M25 32l5 5 9-10" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
 $$('#iso,#iso2').forEach(el=>el.innerHTML=`<svg viewBox="0 0 480 360" aria-hidden="true">${g}${sh(40,70,'')}${sh(380,30,' f2')}${sh(396,200,'')}</svg>`)})();
const _fl=fl;fl=function(){_fl();$('#em').style.display=$('#t2 .ib')?'none':'block'};fl();
$('#tgl').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
$('#dl').onclick=()=>toast('Unduh data belum tersedia');
const um=$('#um'),ub=$('#ub');
function menu(o){um.classList.toggle('open',o);ub.setAttribute('aria-expanded',o)}
ub.onclick=()=>menu(!um.classList.contains('open'));
ub.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();ub.click()}};
document.addEventListener('click',e=>{if(!e.target.closest('#um'))menu(false)});
document.addEventListener('keydown',e=>{if(e.key=='Escape')menu(false)});
$('#mp').onclick=()=>{menu(false);toast('Halaman profil belum tersedia.')};
$('#mk').onclick=()=>{menu(false);toast('Ganti kata sandi belum tersedia.')};
$('#lo').onclick=()=>{menu(false);keluar()};
if(TAMPIL_AKUN_DEMO)$('#mrs').hidden=false;
$('#mrs').onclick=()=>{menu(false);cfm('Reset data?','Semua permohonan, riwayat, dan berkas kembali ke data awal di semua tab yang terbuka. Anda tetap login.',()=>Store.clear().then(()=>location.reload()),'Reset')};
/* Modul 1 (Permohonan, Survei lapangan, Penelitian tim penghapusan, persetujuan kepala daerah, permohonan penaksiran )*/
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),RP=n=>'Rp '+Math.round(n).toLocaleString('id-ID'),fd=s=>s?new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'-',today=()=>new Date().toISOString().slice(0,10);
const HD=(t,s,b)=>`<div class="bn"><div class="bi"><svg class="i"><use href="#f"/></svg></div><div><h1>${t}</h1><p>${s}</p></div>${b?`<div style="margin-left:auto;display:flex;gap:8px">${b}</div>`:''}</div>`;
const ALR=(h,t)=>`<div class="al2"><b>${h}</b> ${t}</div>`;
const AL_SV=ALR('Alur:','Permohonan diterima Admin &rarr; Survei Lapangan &rarr; lengkapi BASL &amp; hasil survei &rarr; simpan hasil survei.'),AL_PT=ALR('Alur:','Survei Lapangan selesai &rarr; masuk Penelitian Tim Penghapusan &rarr; hasil survei dapat dilihat sebagai arsip tindak lanjut.'),AL_OB=ALR('Alur Modul 2:','Tambah Permohonan &rarr; Input Objek &rarr; Simpan &rarr; Posting &rarr; Kertas Kerja Penaksiran &rarr; Unposting bila perlu koreksi. <span class="mt">&nbsp; Permohonan Penaksiran berasal dari Modul 1.</span>');
const PL=(c,t)=>`<span class="stt ${c}">${t}</span>`,EM=(t,s)=>`<div class="em"><b>${t}</b><p class="mt" style="margin:2px 0 0;font-size:12.5px">${s}</p></div>`;
const FL=(id,l,v='',t='text',full,opt)=>`<label class="l2${full?' full':''}">${l}${opt?`<select id="${id}">${opt.map(o=>`<option${o==v?' selected':''}>${o}</option>`).join('')}</select>`:t=='area'?`<textarea id="${id}" rows="3">${esc(v)}</textarea>`:`<input id="${id}" type="${t}" value="${esc(v)}">`}</label>`;
const val=id=>($('#'+id)||{}).value,sec=(t,s,b)=>`<div class="cd"><div class="ch"><div><h2>${t}</h2><small class="mt">${s||''}</small></div>${b||''}</div>`;
const SVS={},PEN={};let svCur=null,penCur=null;
R.filter(d=>d[6]=='Dalam Proses').forEach((d,i)=>SVS[d[0]]={st:['Selesai','Selesai','Draft'][i]||'Belum Survei',d:null,tgl:i<2?'2026-09-2'+(4+i):''});
const stSv={'Belum Survei':'s-n',Draft:'s-o',Selesai:'s-g'};
function svRows(){return R.filter(d=>d[6]=='Dalam Proses'||(d[6]=='Disetujui'&&SVS[d[0]]&&SVS[d[0]].psj)).map(d=>(SVS[d[0]]=SVS[d[0]]||{st:'Belum Survei',d:null,tgl:''},d))}
function pgSv(){const s=$('#sv');if(svCur)return svForm(s);const r=svRows();
 s.innerHTML=HD('Survei Lapangan','')+AL_SV
 +sec('Permohonan Siap Survei','Permohonan dalam status berproses',`<span class="stt s-b">${r.length} Permohonan</span>`)+(r.length?`<div class="tw"><table><thead><tr><th>No</th><th>Nomor Surat</th><th>Tanggal</th><th>Jenis</th><th>Jenis Permohonan</th><th>KIB</th><th>Status Survei</th><th>Aksi</th></tr></thead><tbody>${r.map((d,i)=>`<tr><td>${i+1}</td><td>${d[0]}</td><td>${d[5]}</td><td>${d[4]}</td><td>${d[1]}</td><td>${d[12]}</td><td>${PL(stSv[SVS[d[0]].st],SVS[d[0]].st)}</td><td><button class="btn sm" data-sv="${d[0]}">${SVS[d[0]].st=='Selesai'?'Lihat':SVS[d[0]].st=='Draft'?'Lanjutkan':'Survei'}</button></td></tr>`).join('')}</tbody></table></div>`:EM('Belum ada permohonan siap survei','Permohonan muncul setelah berstatus Dalam Proses.'))+'</div>';
 s.onclick=e=>{const b=e.target.closest('[data-sv]');if(b){svCur=b.dataset.sv;pgSv()}}}
/* Kartu Isi Cepat */
const QC=(k,v,t,sub)=>`<button type="button" class="qc" data-q="${k}:${v}" aria-pressed="false"><b>${t}</b><small>${sub}</small></button>`,
 QK=`<div class="qk"><div class="qg"><span>Kondisi barang</span><div>${QC('c','RB','Semua RB','Rusak Berat')}${QC('c','B','Semua B','Baik')}</div></div><div class="qg"><span>Kesesuaian</span><div>${QC('m','Sesuai','Semua Sesuai','Sesuai data KIB')}${QC('m','Tidak Sesuai','Semua Tidak Sesuai','Tidak sesuai data KIB')}</div></div></div>`;
function syncQ(){$$('#sv .qc').forEach(c=>{const [f,v]=c.dataset.q.split(':'),sel=$$(`#sv .sit[data-f=${f}]`),on=sel.length>0&&sel.every(x=>x.value==v);c.classList.toggle('on',on);c.setAttribute('aria-pressed',on)})}
/* TTD buat nama pendamping (di tim penelitian penghapusan) */
const SGN=[['tim','Tim Penilai'],['p1','Pemohon / Pendamping 1'],['p2','Pemohon / Pendamping 2'],['p3','Pemohon / Pendamping 3']],NMF=['tim','p1','p2','p3','jb'];
let svN=-1;
const nowStr=()=>new Date().toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
 tokGen=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36),
 baseUrl=()=>location.href.split(/[?#]/)[0],
 sgDone=S=>SGN.filter(([k])=>S.ttd&&S.ttd[k]).length,
 sgDiff=(S,get)=>!!S.tm&&NMF.some(f=>String(get(f)||'').trim()!==(S.tm[f]||''));
function sigPad(cv){const c=cv.getContext('2d');let dr=false,has=false,lx=0,ly=0;
 const fit=()=>{const r=cv.getBoundingClientRect(),dp=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(r.width*dp);cv.height=Math.round(r.height*dp);c.setTransform(dp,0,0,dp,0,0);c.fillStyle='#fff';c.fillRect(0,0,r.width,r.height);c.lineWidth=2.4;c.lineCap='round';c.lineJoin='round';c.strokeStyle='#0b1b3a';has=false},
  pt=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
 cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}dr=true;[lx,ly]=pt(e);c.beginPath();c.arc(lx,ly,1.2,0,7);c.fillStyle='#0b1b3a';c.fill();has=true});
 cv.addEventListener('pointermove',e=>{if(!dr)return;const[x,y]=pt(e);c.beginPath();c.moveTo(lx,ly);c.lineTo(x,y);c.stroke();lx=x;ly=y});
 ['pointerup','pointercancel','pointerleave'].forEach(t=>cv.addEventListener(t,()=>{dr=false}));
 fit();return{clear:fit,empty:()=>!has,data:()=>cv.toDataURL('image/png'),
  crop:()=>{const w=cv.width,h=cv.height,d=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i]<235||d[i+1]<235||d[i+2]<235){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
   if(x1<0)return null;const pd=6;x0=Math.max(0,x0-pd);y0=Math.max(0,y0-pd);x1=Math.min(w-1,x1+pd);y1=Math.min(h-1,y1+pd);
   const cw=x1-x0+1,ch=y1-y0+1,o=document.createElement('canvas');o.width=cw;o.height=ch;const oc=o.getContext('2d'),oi=oc.createImageData(cw,ch);
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const sI=((y+y0)*w+(x+x0))*4,t=(y*cw+x)*4,a=255-Math.round((d[sI]+d[sI+1]+d[sI+2])/3);oi.data[t]=11;oi.data[t+1]=27;oi.data[t+2]=58;oi.data[t+3]=a<12?0:Math.min(255,Math.round(a*1.15))}
   oc.putImageData(oi,0,0);if(cw<=520)return{img:o.toDataURL('image/png'),w:cw,h:ch};
   const k=520/cw,o2=document.createElement('canvas');o2.width=520;o2.height=Math.max(1,Math.round(ch*k));o2.getContext('2d').drawImage(o,0,0,o2.width,o2.height);return{img:o2.toDataURL('image/png'),w:o2.width,h:o2.height}}}}
function sgBox(S,dirty,ro){const tm=S.tm,ok=!!tm&&!dirty&&!ro,n=sgDone(S),off=ok?'':' disabled';
 const info=ro&&!tm?'Survei ini diselesaikan sebelum fitur TTD digital tersedia.':ro?'Survei sudah selesai. Tanda tangan dikunci.':!tm?'<b>TTD belum bisa dilakukan.</b> Isi terlebih dahulu keempat nama di atas, lalu klik <b>Simpan Nama &amp; Lanjut TTD</b> terlebih dahulu.':dirty?'<b>Ada perubahan nama yang belum disimpan.</b> Klik <b>Simpan Nama &amp; Lanjut TTD</b> agar TTD dapat dilanjutkan.':'Nama sudah tersimpan. Isi TTD langsung di layar, atau generate link agar penanda tangan mengisi sendiri.';
 return `<div class="cd" id="ttd_box"><div class="ch"><div><h2>Tanda Tangan Digital</h2><small class="mt">TTD Digital/Generate Link</small></div>${PL(n==4?'s-g':'s-n',n==4?'Lengkap 4/4':'Belum Selesai · '+n+'/4')}</div><div class="al2 sgi">${info}</div>`+
 SGN.map(([k,r])=>{const t=S.ttd&&S.ttd[k],nm=tm?tm[k]:'';return `<div class="sgr${t?' ok':''}"><div class="sgn"><b>${esc(nm||'-')}</b><small>${r}</small><em>${t?'Sudah ditandatangani · '+esc(t.ts)+(t.via=='link'?' · via link':''):'Belum ada tanda tangan'}</em></div>${t?`<img class="sgp" alt="Tanda tangan ${esc(nm)}" src="${esc(t.img)}">`:''}<div class="sga"><button type="button" class="btn o sm" data-a="ttd" data-k="${k}"${off}>${t?'Ulangi TTD':'Isi TTD'}</button><button type="button" class="btn o sm" data-a="lnk" data-k="${k}"${off}>Generate Link TTD</button></div></div>`}).join('')+'</div>'}
function svMiss(S){const m=[],it=$$('#sv .sit'),tot=$$('#sv .sit[data-f=c]').length,cnt=f=>it.filter(x=>x.dataset.f==f&&x.value).length;
 if(!val('s_basl'))m.push('Nomor BASL');if(!val('s_tim'))m.push('Tim Penilai');
 if(cnt('c')<tot)m.push('RB/B '+cnt('c')+'/'+tot+' barang');if(cnt('m')<tot)m.push('Kesesuaian '+cnt('m')+'/'+tot+' barang');
 if(!S.tm||sgDiff(S,f=>val('s_'+f)))m.push('Nama pendamping belum disimpan');
 const n=sgDone(S);if(n<4)m.push('TTD '+n+'/4 penanda tangan');return m}
function svBox(){const S=SVS[svCur];if(!S||!$('#ttd_box'))return;$('#ttd_box').outerHTML=sgBox(S,sgDiff(S,f=>val('s_'+f)),S.st=='Selesai');svN=sgDone(S)}
function svFoot(){const S=SVS[svCur];if(!S||!$('#sv_ft'))return;const ro=S.st=='Selesai',m=svMiss(S),d=sgDiff(S,f=>val('s_'+f)),ft=$('#sv_ft');
 ft.innerHTML=ro?'<b>Survei sudah selesai</b> &middot; data dikunci':m.length?'<b>Belum lengkap:</b> '+m.length+' hal':'<b>Semua lengkap</b> &middot; siap diselesaikan';
 ft.title=ro?'':m.length?m.join(', '):'';
 const fin=$('#sv_fin');if(fin)fin.disabled=ro||m.length>0;const gn=$('#sv_gen');if(gn)gn.disabled=!S.tm&&!ro;
 const n=$('#nm_note');if(n)n.textContent=!S.tm?'Nama belum disimpan. TTD baru bisa dilanjutkan setelah nama disimpan.':d?'Ada perubahan nama yang belum disimpan.':'Nama sudah disimpan.'}
const svSync=()=>{svBox();svFoot()},svBadge=S=>{const b=$('#sv .ch .stt');if(b){b.className='stt '+stSv[S.st];b.textContent=S.st}};
function svRefresh(){const S=SVS[svCur];if(!S||!$('#ttd_box'))return;const was=svN;svBadge(S);svSync();if(was>=0&&svN>was)toast('Tanda tangan baru masuk.')}
function svSaveNames(S){if(S.st=='Selesai')return;const nm={};NMF.forEach(f=>nm[f]=String(val('s_'+f)||'').trim());
 if(SGN.some(([k])=>!nm[k]))return toast('Isi nama Tim Penilai dan Pendamping 1 sampai 3 terlebih dahulu.');
 const old=S.tm||{};S.ttd=S.ttd||{};S.lk=S.lk||{};let rs=0;
 SGN.forEach(([k])=>{if(old[k]!==undefined&&old[k]!==nm[k]){if(S.ttd[k]){delete S.ttd[k];rs++}delete S.lk[k]}});
 nm.cat=val('s_cat')||'';S.tm=nm;if(S.d)NMF.concat('cat').forEach(f=>S.d[f]=nm[f]);
 if(S.st=='Belum Survei')S.st='Draft';svBadge(S);Store.persist();svSync();
 toast(rs?'Nama disimpan. '+rs+' tanda tangan direset karena nama berubah.':'Nama tersimpan. Silakan lanjut ke tanda tangan.');
 const bx=$('#ttd_box');if(bx)bx.scrollIntoView({behavior:'smooth',block:'nearest'})}
function svStatus(S){if(S.st=='Selesai')return;S.st=(S.d||S.tm||sgDone(S))?'Draft':'Belum Survei';svBadge(S);svSync();const m=svMiss(S);Store.persist();
 toast('Status: '+S.st+' · TTD '+sgDone(S)+'/4'+(m.length?' · '+m.length+' hal belum lengkap':' · siap diselesaikan'))}
function mdlOpen(id,html){const o=$('#'+id);if(o)o.remove();const m=document.createElement('div');m.id=id;m.className='mdl on';m.innerHTML=html;document.body.appendChild(m);return m}
function sgModal(k){const S=SVS[svCur],nm=S.tm[k],role=SGN.find(x=>x[0]==k)[1];
 const m=mdlOpen('sgm',`<div class="mbx sgx"><h3>Tanda Tangan - ${esc(nm)}</h3><p style="margin-bottom:12px">${role}</p><canvas class="sgc" aria-label="Kotak tanda tangan"></canvas><div class="sgh">Tanda tangan di dalam kotak memakai mouse, stylus, atau jari.</div><div class="mft"><button class="btn o" data-x="c">Hapus</button><button class="btn o" data-x="0">Batal</button><button class="btn" data-x="1">Simpan Tanda Tangan</button></div></div>`),pad=sigPad(m.querySelector('canvas'));
 m.onclick=e=>{const x=(e.target.closest('[data-x]')||{dataset:{}}).dataset.x;if(x==null)return;if(x=='c')return pad.clear();
  if(x=='1'){if(pad.empty())return toast('Tanda tangan masih kosong.');const T=SVS[svCur];if(!T||T.st=='Selesai'||!T.tm||T.tm[k]!==nm){m.remove();return toast('Data survei berubah. Buka ulang kotak TTD.')}
   T.ttd=T.ttd||{};T.ttd[k]={img:pad.data(),ts:nowStr(),via:'langsung'};Store.persist();m.remove();svSync();return toast('Tanda tangan '+nm+' tersimpan.')}
  m.remove()}}
function lkModal(k){const S=SVS[svCur],nm=S.tm[k];S.lk=S.lk||{};const o=S.lk[k],l=(o&&o.nm==nm&&!(S.ttd&&S.ttd[k]))?o:(S.lk[k]={t:tokGen(),nm:nm,ts:nowStr()}),u=baseUrl()+'?ttd='+l.t;Store.persist();
 const m=mdlOpen('lkm',`<div class="mbx sgx"><h3>Link TTD - ${esc(nm)}</h3><p style="margin-bottom:12px">Kirim link ini ke penanda tangan. Mereka bisa tanda tangan tanpa login. Link tidak berlaku lagi bila nama diubah.${S.ttd&&S.ttd[k]?' <b>Catatan:</b> penanda tangan ini sudah punya tanda tangan; link baru akan menggantinya.':''}</p><input class="lki" id="lk_i" readonly value="${esc(u)}"><div class="sgh" style="margin-top:-6px">Versi prototype: link hanya berfungsi di browser yang sama dengan Admin.</div><div class="mft"><a class="btn o" href="${esc(u)}" target="_blank" rel="noopener">Buka Link</a><button class="btn o" data-x="0">Tutup</button><button class="btn" data-x="1">Salin Link</button></div></div>`);
 m.onclick=e=>{const x=(e.target.closest('[data-x]')||{dataset:{}}).dataset.x;if(x==null)return;
  if(x=='1'){const i=$('#lk_i'),ok=()=>toast('Link TTD disalin.'),fb=()=>{i.select();try{document.execCommand('copy');ok()}catch(z){toast('Salin manual dari kolom link.')}};
   if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(u).then(ok,fb);else fb();return}
  m.remove()}}
function svDoc(S,o,k){const w=window.open('','_blank');if(!w)return toast('Pop-up diblokir browser.');const tm=S.tm||{};
 const sg=SGN.map(([x,r])=>{const t=S.ttd&&S.ttd[x];return `<td style="text-align:center;width:25%;vertical-align:bottom;padding:6px"><div>${r}</div><div style="height:84px">${t?`<img src="${esc(t.img)}" style="max-height:80px;max-width:100%;margin-top:2px">`:''}</div><b>${esc(tm[x]||'-')}</b>${x!='tim'&&tm.jb?`<div style="font-size:12px">${esc(tm.jb)}</div>`:''}</td>`}).join('');
 w.document.write(`<title>${esc(o.basl)}</title><body style="font:14px Arial;padding:40px"><h2 style="text-align:center">BERITA ACARA SURVEI LAPANGAN</h2><p style="text-align:center">Nomor: ${esc(o.basl)} · ${fd(o.tb)}</p><p>Objek: <b>${esc(o.ob)}</b> · Lokasi: ${esc(o.lk)||'-'}</p><table border=1 cellpadding=6 style="border-collapse:collapse;width:100%;font-size:13px"><tr><th>No</th><th>KIB ID</th><th>Kode</th><th>Nama Barang</th><th>Tahun</th><th>Qty</th><th>RB / B</th><th>Kesesuaian</th><th>Keterangan</th></tr>${k.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td>${esc(x[5])} ${esc(x[6])}</td><td>${esc(o.it[i].c)}</td><td>${esc(o.it[i].m)}</td><td>${esc(o.it[i].k)}</td></tr>`).join('')}</table>${tm.cat?`<p>Catatan tim: ${esc(tm.cat)}</p>`:''}<p style="margin-top:36px">Tim Penilai / Pemohon Pendamping:</p><table style="width:100%;border-collapse:collapse;margin-top:8px"><tr>${sg}</tr></table>`);w.document.close()}
/* Untuk Generate Link (jadi nanti via link ttd nya) */
function ttdFind(t){for(const[no,S]of Object.entries(SVS))for(const[k,l]of Object.entries(S.lk||{}))if(l&&l.t===t)return{no,k};return null}
function ttdPage(t){document.body.classList.add('tpm');{const ts=$('#tst');if(ts&&ts.parentNode!==document.body)document.body.appendChild(ts)}let el=$('#ttdp');if(!el){el=document.createElement('div');el.id='ttdp';document.body.appendChild(el)}
 const hd='<header class="tph"><img alt="Logo BKAD Kota Bogor" src="assets/logo-bkad.png"><div><b>BKAD Kota Bogor</b><span>SI Penghapusan BMD</span></div></header>',
  msg=(h,s)=>{el.innerHTML=hd+`<div class="tpc"><h1 style="font-size:20px;margin:0 0 8px">${h}</h1><p class="mt" style="margin:0;line-height:1.6">${s}</p></div>`};
 const ns=ttdFindSurat(t);if(ns)return ttdSurat(el,hd,msg,t,ns);
 const f=ttdFind(t);if(!f)return msg('Link tidak valid','Link tanda tangan tidak ditemukan atau sudah diganti. Minta Admin membuat link baru.');
 const S=SVS[f.no],k=f.k,l=S.lk[k],nm=S.tm&&S.tm[k],role=SGN.find(x=>x[0]==k)[1];
 if(!nm||nm!==l.nm)return msg('Link kedaluwarsa','Nama penanda tangan sudah diubah. Minta Admin membuat link baru.');
 if(S.st=='Selesai')return msg('Survei sudah selesai','Tanda tangan tidak dapat diubah lagi.');
 if(S.ttd&&S.ttd[k])return msg('Sudah ditandatangani','Terima kasih, '+esc(nm)+'. Tanda tangan Anda tercatat pada '+esc(S.ttd[k].ts)+'.');
 el.innerHTML=hd+`<div class="tpc"><h1 style="font-size:20px;margin:0 0 4px">Tanda Tangan Digital</h1><p class="mt" style="margin:0 0 14px">Berita Acara Survei Lapangan · Permohonan ${esc(f.no)}</p><dl style="margin:0 0 14px"><dt>Nama</dt><dd>${esc(nm)}</dd><dt>Sebagai</dt><dd>${role}</dd></dl><canvas class="sgc" aria-label="Kotak tanda tangan"></canvas><div class="sgh">Tanda tangan di dalam kotak memakai jari, stylus, atau mouse.</div><div class="mft"><button class="btn o" data-x="c">Hapus</button><button class="btn" data-x="1">Kirim Tanda Tangan</button></div></div>`;
 const pad=sigPad(el.querySelector('canvas')); 
 el.onclick=e=>{const x=(e.target.closest('[data-x]')||{dataset:{}}).dataset.x;if(x==null)return;if(x=='c')return pad.clear();
  if(pad.empty())return toast('Tanda tangan masih kosong.');const T=SVS[f.no];
  if(!T||!T.lk||!T.lk[k]||T.lk[k].t!==t||T.st=='Selesai')return ttdPage(t);
  T.ttd=T.ttd||{};T.ttd[k]={img:pad.data(),ts:nowStr(),via:'link'};Store.persist();msg('Terima kasih','Tanda tangan '+esc(nm)+' sudah terkirim. Halaman ini boleh ditutup.')}}

/* TTD digital pakai RX (bisa diisi, setelah simpan draft, lalu generate link TTD digital */
const TTD_EXP=72*36e5;
function ttdSah(no,f){const t=(RX[no]||{}).ttd;return t&&f&&t.sig===suratSig(f)?t:null}
function ttdLinkAktif(no,f){const l=(RX[no]||{}).lk;return l&&f&&!l.used&&l.sig===suratSig(f)&&Date.now()<=l.exp?l:null}
function ttdBadge(no){const x=RX[no]||{},f=x.f;if(!f)return'';const t=ttdSah(no,f),d=R.find(r=>r[0]==no);
 if(t)return `<small class="ttds ok">✔ <b>Sudah ditandatangani digital</b> oleh ${esc(t.nm||f.kepala||'Kepala OPD')} · ${esc(t.ts)}${t.via=='link'?' · via link':''}${t.id?' · ID '+esc(t.id):''}</small>`;
 const lama=d&&d[6]!='Draft'&&d[6]!='Ditolak';
 return lama?'<small class="ttds">Diajukan sebelum fitur TTD digital tersedia.</small>':'<small class="ttds no">Belum ditandatangani digital oleh Kepala OPD.</small>'}
/* Regenerasi berkas surat (.docx) di data tersimpan agar memuat TTD terbaru. */
async function suratSimpan(no){const x=RX[no],f=x&&x.f;if(!f||!suratSiap(f))return;f.files=f.files||[];f.files[0]=await suratPermohonanDocx(f,ttdSah(no,f));Store.persist()}
function ttdFormF(){const r=$('input[name=jn]:checked');return{jn:r?r.value:'',no:$('#fn').value.trim(),tgl:$('#fd').value,pd:$('#fpd').value,kepala:$('#fkp').value.trim(),nip:$('#fnip').value.trim()}}
/* kotak TTD */
function ttdFormState(){const f=ttdFormF();if(!editNo)return{k:'baru',f};const sv=(RX[editNo]||{}).f;if(!sv)return{k:'baru',f};
 if(!f.kepala||!f.nip)return{k:'nokep',f,sv};
 if(suratSig(sv)!==suratSig(f))return{k:'dirty',f,sv,t:ttdSah(editNo,sv)};
 const t=ttdSah(editNo,sv);if(t)return{k:'signed',f,sv,t};
 const l=ttdLinkAktif(editNo,sv);return l?{k:'link',f,sv,l}:{k:'siap',f,sv}}
function ttdRender(){const b=$('#ttdb');if(!b)return;const S=ttdFormState(),ok=can('permohonan.kelola'),dis=ok?'':' disabled';let pill='<span class="stt s-n">Belum ditandatangani</span>',msg='',ex='',cls='ttdbx';
 if(S.k=='baru')msg='Simpan sebagai draft terlebih dahulu. Setelah itu akan ada Link TTD untuk Kepala OPD. Tombol <b>Ajukan Verifikasi</b> baru aktif setelah surat ditandatangani.';
 else if(S.k=='nokep')msg='Isi <b>Nama</b> dan <b>NIP Kepala OPD</b> pada Identitas Permohonan, lalu simpan draft, agar link TTD bisa dibuat.';
 else if(S.k=='dirty')msg=S.t?'<b>Isian surat berubah dan belum disimpan.</b> Jika disimpan, TTD digital yang sudah ada akan dibatalkan dan Kepala OPD perlu menandatangani ulang.':'<b>Isian surat berubah dan belum disimpan.</b> Simpan perubahan dulu sebelum membuat link TTD.';
 else if(S.k=='signed'){cls+=' ok';pill='<span class="stt s-g">Sudah ditandatangani</span>';msg='Ditandatangani oleh <b>'+esc(S.t.nm||S.sv.kepala)+'</b> · '+esc(S.t.ts)+(S.t.via=='link'?' · via link':'')+(S.t.id?' · ID '+esc(S.t.id):'')+'. TTD otomatis batal bila isian surat diubah.';
  ex='<div class="ttdp"><img alt="Tanda tangan Kepala OPD" src="'+esc(S.t.img)+'"></div><div class="tta"><button type="button" class="btn o sm" data-tt="mk"'+dis+'>Minta TTD Ulang</button></div>'}
 else if(S.k=='link'){const u=baseUrl()+'?ttd='+S.l.t;msg='Kirim link ini ke <b>'+esc(S.sv.kepala)+'</b>. Kepala OPD membuka link, memeriksa surat, lalu tanda tangan tanpa login. Berlaku sampai <b>'+esc(new Date(S.l.exp).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}))+'</b> dan hanya bisa dipakai sekali. Status di sini berubah otomatis setelah TTD masuk.';
  ex='<input class="lki" id="tt_i" readonly value="'+esc(u)+'"><div class="tta"><button type="button" class="btn sm" data-tt="cp">Salin Link</button><a class="btn o sm" href="'+esc(u)+'" target="_blank" rel="noopener">Buka Link</a><button type="button" class="btn o sm" data-tt="mk"'+dis+'>Buat Link Baru</button></div><div class="sgh">Versi prototype: link hanya berfungsi di browser yang sama dengan staf.</div>'}
 else{msg='Surat ini harus ditandatangani digital oleh <b>'+esc(S.sv.kepala)+'</b> sebelum bisa diajukan. Buat link, lalu kirim ke Kepala OPD. Link berlaku 3 hari dan hanya bisa dipakai sekali.';ex='<div class="tta"><button type="button" class="btn sm" data-tt="mk"'+dis+'>Buat Link TTD</button></div>'}
 b.className=cls;b.innerHTML='<div class="tth"><b>Tanda Tangan Digital Kepala OPD</b>'+pill+'</div><p>'+msg+'</p>'+ex;
 const c=$('#sttd');if(c){c.classList.toggle('y',S.k=='signed')}}
function ttdBuatLink(){if(!can('permohonan.kelola'))return deny();const S=ttdFormState();if(S.k!='siap'&&S.k!='link'&&S.k!='signed')return toast('Simpan draft dan isi nama/NIP Kepala OPD dulu.');
 const d=R.find(r=>r[0]==editNo);if(!d||!bolehTulis(d)||!EDIT_OK[d[6]])return deny();const x=RX[editNo];
 x.lk={t:tokGen(),sig:suratSig(S.sv),nm:S.sv.kepala,nip:S.sv.nip,ts:nowStr(),exp:Date.now()+TTD_EXP};hs(editNo,'Link TTD Kepala OPD dibuat',CUR.name);Store.persist();ttdRender();toast('Link TTD dibuat. Salin dan kirim ke Kepala OPD.')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tt]');if(!b||!$('#ttdb')||!$('#ttdb').contains(b))return;
 if(b.dataset.tt=='mk')return ttdBuatLink();
 if(b.dataset.tt=='cp'){const i=$('#tt_i'),ok=()=>toast('Link TTD disalin.'),fb=()=>{i.select();try{document.execCommand('copy');ok()}catch(z){toast('Salin manual dari kolom link.')}};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(i.value).then(ok,fb);else fb()}});
['#fkp','#fnip','#fpd','#fd','#fn'].forEach(q=>{const el=$(q);if(el){el.addEventListener('input',()=>{try{sum()}catch(er){}});el.addEventListener('change',()=>{try{sum()}catch(er){}})}});
$$('input[name=jn]').forEach(r=>r.addEventListener('change',()=>{try{sum()}catch(er){}}));
function ttdFindSurat(t){for(const[no,x]of Object.entries(RX))if(x&&x.lk&&x.lk.t===t)return no;return null}
/* Halaman TTD (setelah generate link ttd,untuk kepala OPD) */
function ttdSurat(el,hd,msg,t,no){const x=RX[no],lk=x.lk,f=x.f,d=R.find(r=>r[0]==no),nm=f&&f.kepala;
 if(!f||!d||lk.t!==t)return msg('Link tidak valid','Link tanda tangan tidak ditemukan atau sudah diganti. Minta staf pemohon membuat link baru.');
 if(lk.used)return msg('Sudah ditandatangani','Terima kasih'+(nm?', '+esc(nm):'')+'. Tanda tangan Anda tercatat pada '+esc(lk.used)+'. Link ini tidak dapat dipakai lagi.');
 if(Date.now()>lk.exp)return msg('Link kedaluwarsa','Masa berlaku link sudah habis. Minta staf pemohon membuat link baru.');
 if(lk.sig!==suratSig(f))return msg('Link tidak berlaku','Isi surat diubah setelah link dibuat. Minta staf pemohon membuat link baru.');
 if(!EDIT_OK[d[6]])return msg('Permohonan sudah diajukan','Surat tidak dapat ditandatangani lagi karena permohonan sudah diajukan.');
 el.innerHTML=hd+`<div class="tpc wide"><h1 style="font-size:20px;margin:0 0 4px">Tanda Tangan Digital Surat Permohonan</h1><p class="mt" style="margin:0 0 14px">Permohonan ${esc(no)} · ${esc(f.pd)}. Mohon periksa isi surat, lalu tanda tangani di bawahnya.</p>
<div class="tpv">${suratHtml(f)}</div><dl style="margin:0 0 14px"><dt>Nama</dt><dd>${esc(f.kepala)}</dd><dt>NIP</dt><dd>${esc(f.nip)}</dd><dt>Sebagai</dt><dd>Kepala ${esc(f.pd)}</dd></dl>
<label class="tpk"><input type="checkbox" id="tpk"> <span>Saya telah membaca isi surat di atas dan menyetujuinya.</span></label>
<canvas class="sgc" aria-label="Kotak tanda tangan"></canvas><div class="sgh">Tanda tangan di dalam kotak memakai jari, stylus, atau mouse.</div><div class="mft"><button class="btn o" data-x="c">Hapus</button><button class="btn" data-x="1">Tanda Tangani &amp; Kirim</button></div></div>`;
 const pad=sigPad(el.querySelector('canvas'));
 el.onclick=async e=>{const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x=='c')return pad.clear();
  if(!$('#tpk').checked)return toast('Centang pernyataan persetujuan terlebih dahulu.');
  if(pad.empty())return toast('Tanda tangan masih kosong.');const c=pad.crop();if(!c)return toast('Tanda tangan masih kosong.');
  const X=RX[no],D=R.find(r=>r[0]==no);
  if(!X||!X.lk||X.lk.t!==t||X.lk.used||Date.now()>X.lk.exp||!X.f||X.lk.sig!==suratSig(X.f)||!D||!EDIT_OK[D[6]])return ttdPage(t);
  const ts=nowStr(),id=tokGen().slice(0,8).toUpperCase();
  X.ttd={img:c.img,w:c.w,h:c.h,ts,via:'link',sig:suratSig(X.f),nm:X.f.kepala,nip:X.f.nip,id};X.lk.used=ts;
  hs(no,'Surat ditandatangani digital oleh Kepala OPD',X.f.kepala+' · via link');
  try{await suratSimpan(no)}catch(er){console.warn('[TTD] berkas surat belum diperbarui',er)}
  Store.persist();msg('Terima kasih','Tanda tangan '+esc(X.f.kepala)+' sudah terkirim dan tercatat pada '+esc(ts)+'. Halaman ini boleh ditutup.')}}
/* Dokumentasi lapangan: banyak foto + preview kartu kecil */
let svFt=[];const SV_FMAX=12;
function svFtRender(ro){const g=$('#s_fp'),c=$('#s_fc');if(!g)return;
 c.textContent=svFt.length?svFt.length+' foto':'Belum ada foto';
 g.innerHTML=svFt.map((f,i)=>`<figure class="fpc"><img src="${esc(f.img)}" alt="${esc(f.n)}">${ro?'':`<button type="button" class="fpx" data-fx="${i}" aria-label="Hapus foto">&times;</button>`}<figcaption title="${esc(f.n)}">${esc(f.n)}</figcaption></figure>`).join('')}
function svFtRead(file){return new Promise(res=>{const r=new FileReader();r.onerror=()=>res(null);r.onload=()=>{const im=new Image();im.onerror=()=>res(null);im.onload=()=>{const m=1200,k=Math.min(1,m/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);res({n:file.name,img:cv.toDataURL('image/jpeg',.72)})};im.src=r.result};r.readAsDataURL(file)})}
async function svFtAdd(inp,ro){if(ro)return;const fs=[...inp.files].filter(f=>/^image\//.test(f.type));inp.value='';if(!fs.length)return;
 const room=SV_FMAX-svFt.length;if(room<=0)return toast('Maksimal '+SV_FMAX+' foto per survei.');
 const cur=svCur,list=await Promise.all(fs.slice(0,room).map(svFtRead));if(svCur!==cur)return;
 list.filter(Boolean).forEach(x=>svFt.push(x));svFtRender(ro);
 if(fs.length>room)toast('Hanya '+room+' foto ditambahkan (maksimal '+SV_FMAX+').')}
function svForm(s){const d=R.find(x=>x[0]==svCur),S=SVS[svCur],v=S.d||{basl:'BASL-'+String(R.indexOf(d)+1).padStart(3,'0')+'/2026',tb:today(),st:'',ts:today(),pl:today(),tk:'Survei langsung',ob:d[2],lk:'',tim:'',p1:'',p2:'',cat:'',it:[],ft:[]},k=K.slice(0,3),ro=S.st=='Selesai',nvv=f=>((S.d&&S.d[f]!=null)?S.d[f]:(S.tm&&S.tm[f]))||'';
 svFt=Array.isArray(v.ft)?v.ft.slice():[];
 s.innerHTML=HD('Berita Acara Survei Lapangan',d[0]+' · '+d[1],`<button class="btn o" data-a="bk">← Kembali</button>`)+
 sec('1. Identitas Berita Acara Survei Lapangan','',PL(stSv[S.st],S.st))+`<div class="ff">${FL('s_basl','Nomor BASL',v.basl)}${FL('s_tb','Tanggal BASL',v.tb,'date')}${FL('s_st','Nomor Surat Permohonan',d[0])}${FL('s_ts','Tanggal Surat Tugas',v.ts,'date')}${FL('s_pl','Pelaksanaan Survei',v.pl,'date')}${FL('s_tk','Teknik Survei',v.tk,'text',0,['Survei langsung','Lainnya'])}${FL('s_ob','Nama / Deskripsi Objek',v.ob)}${FL('s_lk','Lokasi',v.lk)}</div></div>`+
 sec('2. Daftar Barang / KIB yang Disurvei','')+(ro?'':QK)+`<div class="tw"><table><thead><tr><th>No</th><th>KIB ID</th><th>Kode</th><th>Nama Barang</th><th>Tahun</th><th>Qty</th><th>RB / B</th><th>Kesesuaian</th><th>Keterangan</th></tr></thead><tbody>${k.map((x,i)=>{const t=v.it[i]||{};return`<tr><td>${i+1}</td><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td><td>${x[3]}</td><td>${x[5]} ${x[6]}</td><td><select class="sit" data-i="${i}" data-f="c"><option value="">Pilih</option>${['RB','B'].map(o=>`<option${t.c==o?' selected':''}>${o}</option>`).join('')}</select></td><td><select class="sit" data-i="${i}" data-f="m"><option value="">Pilih</option>${['Sesuai','Tidak Sesuai'].map(o=>`<option${t.m==o?' selected':''}>${o}</option>`).join('')}</select></td><td><input class="sit" data-i="${i}" data-f="k" value="${esc(t.k)}" style="width:150px;border:1px solid var(--ln);border-radius:8px;padding:6px 8px"></td></tr>`}).join('')}</tbody></table></div></div>`+
 sec('3. Dokumentasi Lapangan','Bisa lebih dari satu foto')+`${ro?'':'<label class="btn o sm" style="cursor:pointer">Tambah Foto<input type="file" id="s_ft" accept="image/*" multiple hidden></label> '}<span class="mt" id="s_fc"></span><div class="fpv" id="s_fp"></div></div>`+
 sec('4. Tim Penilai / Pemohon Pendamping','Isi Nama, lalu lanjut ke TTD ')+`<div class="ff">${FL('s_tim','Tim Penilai',nvv('tim'))}${FL('s_p1','Pemohon / Pendamping 1',nvv('p1'))}${FL('s_p2','Pemohon / Pendamping 2',nvv('p2'))}${FL('s_jb','Jabatan Pendamping',nvv('jb'))}${FL('s_p3','Pemohon / Pendamping 3',nvv('p3'))}<label class="l2 rs2">Catatan Tim<textarea id="s_cat" placeholder="Catatan tambahan tim">${esc(nvv('cat'))}</textarea></label><div class="nmx"><button type="button" class="btn o sm" data-a="nm"${ro?' disabled':''}>Simpan Nama &amp; Lanjut TTD</button><small class="mt" id="nm_note"></small></div></div></div>`+
 sgBox(S,sgDiff(S,nvv),ro)+
 `<div class="sg-bar"><span id="sv_ft"></span><div>${ro?'':'<button type="button" class="btn o" data-a="dr">Simpan Draft Survei</button>'}<button type="button" class="btn o" data-a="gen" id="sv_gen">Generate Dokumen</button>${ro?'':'<button type="button" class="btn" data-a="fin" id="sv_fin">Selesaikan Survei</button>'}</div></div>`;
 if(ro)$$('#sv input,#sv select,#sv textarea').forEach(x=>x.disabled=true);
 $('#s_st').readOnly=true;svFtRender(ro);syncQ();svSync();
 s.onchange=s.oninput=e=>{const t=e.target;if(t.id=='s_ft'){svFtAdd(t,ro);return}if(t.classList.contains('sit')){syncQ();svFoot()}else if(/^s_(tim|p1|p2|p3|jb|basl)$/.test(t.id||''))svSync()};
 s.onclick=e=>{const fx=e.target.closest('[data-fx]');if(fx){if(!ro){svFt.splice(+fx.dataset.fx,1);svFtRender(ro)}return}
  const q=e.target.closest('[data-q]');if(q){if(ro)return;const [f,v]=q.dataset.q.split(':'),sel=$$(`#sv .sit[data-f=${f}]`),sama=sel.every(x=>x.value==v);sel.forEach(x=>x.value=sama?'':v);syncQ();svFoot();return}
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,S=SVS[svCur];if(!S)return;
  if(a=='bk'){svCur=null;return pgSv()}
  if(a=='nm')return svSaveNames(S);
  if(a=='ttd'||a=='lnk'){if(!S.tm||sgDiff(S,f=>val('s_'+f))||S.st=='Selesai')return toast('Simpan nama terlebih dahulu.');return a=='ttd'?sgModal(b.dataset.k):lkModal(b.dataset.k)}
  if(a=='pst')return svStatus(S);
  const o={};'basl tb st ts pl tk ob lk tim p1 p2 p3 jb cat'.split(' ').forEach(f=>o[f]=val('s_'+f));o.it=k.map((_,i)=>({c:$(`.sit[data-i="${i}"][data-f=c]`).value,m:$(`.sit[data-i="${i}"][data-f=m]`).value,k:$(`.sit[data-i="${i}"][data-f=k]`).value}));o.ft=svFt.slice();
  if(a=='gen')return svDoc(S,o,k);
  if(a=='fin'&&(!o.basl||!o.tim||o.it.some(x=>!x.c||!x.m)))return toast('Lengkapi nomor BASL, tim penilai, serta RB/B dan kesesuaian semua barang.');
  if(a=='fin'){const m=svMiss(S);if(m.length)return toast('Belum bisa selesai: '+m.join(', ')+'.');
   return cfm('Selesaikan survei?','Data survei dan tanda tangan akan dikunci, lalu survei masuk ke Penelitian Tim Penghapusan.',()=>{const T=SVS[svCur];if(!T)return;T.d=o;T.st='Selesai';T.tgl=today();Store.persist();toast('Survei selesai. Siap diteliti Tim Penghapusan.');svCur=null;pgSv()},'Selesai')}
  S.d=o;S.st='Draft';Store.persist();toast('Draft survei disimpan. Bisa dilanjutkan nanti dari daftar survei.');svCur=null;pgSv()}}
const stPn={Belum:'s-n',Diteliti:'s-g'};
/* Pgpt untuk surat penelitian */
/* (Daftar Objek Penaksiran, kertas kerja penasksiran, laporan penaskiran), Database Referensi */
const OB=[{id:1,no:'PM-003-2026',tgl:'2026-09-12',pd:'Dinas PUPR',al:'Jl. Ir. H. Juanda No. 10, Kota Bogor',pf:'Penaksiran nilai scrap besi bongkaran jembatan',st:'Posted',o:[{n:'Besi Rangka Jembatan Bekas',k:'3.03.01.01.005',th:2005,kd:'Rusak Berat',bt:'Scrap',mt:'Data Pasar',q:1850,sn:'KG',jl:'Lelang',mp:'Besi'},{n:'Pipa Aluminium Bekas',k:'3.03.01.04.011',th:2010,kd:'Rusak Sedang',bt:'Scrap',mt:'Data Pasar',q:420,sn:'KG',jl:'Lelang',mp:'Aluminium'}]},{id:2,no:'PM-009-2026',tgl:'2026-09-30',pd:'Dinas Pendidikan',al:'Jl. Pajajaran No. 5, Kota Bogor',pf:'Penaksiran perabot sekolah rusak berat',st:'Draft',o:[{n:'Rangka Meja Besi Siswa',k:'3.05.01.01.007',th:2011,kd:'Rusak Berat',bt:'Scrap',mt:'Data Pasar',q:640,sn:'KG',jl:'Langsung',mp:'Besi'}]}];
let obCur=null,obEd=null;const KK={},stOb={Draft:'s-o',Posted:'s-b'};
const HP=[['2026-09-05','UD Berkah Logam','Tanah Sareal','Jl. Kayu Manis No. 12','0812-1111-2201','Besi','Rp/Kg',6200],['2026-09-06','Sinar Jaya','Bondongan','Jl. Bondongan Raya 3','0813-2222-3302','Besi','Rp/Kg',6500],['2026-09-09','Lapak Sinar Baja','Sukasari','Jl. Surya Kencana 21','0857-3333-4403','Besi','Rp/Kg',6350],['2026-09-05','UD Berkah Logam','Tanah Sareal','Jl. Kayu Manis No. 12','0812-1111-2201','Aluminium','Rp/Kg',17500],['2026-09-06','Pengepul Maju Jaya','Bondongan','Jl. Bondongan Raya 3','0813-2222-3302','Aluminium','Rp/Kg',18200],['2026-09-09','Lapak Sinar Baja','Sukasari','Jl. Surya Kencana 21','0857-3333-4403','Aluminium','Rp/Kg',17900],['2026-09-10','Lapak Sinar Baja','Sukasari','Jl. Surya Kencana 21','0857-3333-4403','Plastik','Rp/Kg',3100],['2026-09-10','UD Berkah Logam','Tanah Sareal','Jl. Kayu Manis No. 12','0812-1111-2201','Kertas','Rp/Kg',1900]].map(x=>({t:x[0],l:x[1],a:x[2],al:x[3],kt:x[4],m:x[5],s:x[6],h:x[7]}));
const avg=m=>{const r=HP.filter(x=>x.m==m);return{n:r.length,v:r.length?r.reduce((a,x)=>a+x.h,0)/r.length:0}};
function syncTksToObjects(){Object.entries(RX).forEach(([no,x])=>{const T=x&&x.tks,V=T&&T.verif;if(!V||V.st!='Disetujui'||!V.obId||OB.some(p=>p.id==V.obId))return;const d=R.find(r=>r[0]==no);if(!d)return;
 OB.push({id:V.obId,tksNo:no,no,tgl:today(),pd:d[1],al:'',pf:d[10]||'Permohonan penaksiran',st:'Draft',tksSource:true,o:(T.rows||[]).map(r=>({n:r.nama,k:r.kode,th:r.tahun,kd:r.kondisi,bt:'Tonase',mt:'Data Pasar',q:tksNum(r.tonase),sn:r.satt||'Kg',jl:'Lelang',mp:'Lainnya'}))})})}
/* Nomor di Daftar Objek = nomor permohonan asalnya (tidak membuat kode baru).
   Pilihan: permohonan yang sudah diterima Admin dan belum punya Daftar Objek. Data hasil penaksiran Pengguna Barang dikunci ke nomornya. */
function obNos(p){if(p.tksSource&&p.no)return[p.no];const l=[...new Set(R.filter(d=>(d[6]=='Dalam Proses'||d[6]=='Disetujui')&&!OB.some(q=>q!==p&&q.no==d[0])).map(d=>d[0]))];if(p.no&&!l.includes(p.no))l.unshift(p.no);return['',...l]}
function pgOb(){syncTksToObjects();const s=$('#ob');
 if(obEd&&OB.find(x=>x.id==obEd)?.st=='Posted'){obEd=null;toast('Permohonan yang sudah diposting tidak dapat diedit. Lakukan Unposting terlebih dahulu.')}
 if(obEd){const p=OB.find(x=>x.id==obEd);s.innerHTML=HD(p.no?'Edit Permohonan Penaksiran':'Tambah Permohonan Penaksiran','',`<button class="btn o" data-a="bk">← Kembali</button>`)+sec('Identitas Permohonan')+`<div class="ff">${FL('o_no','Nomor Permohonan',p.no,'text',0,obNos(p))}${FL('o_tgl','Tanggal',p.tgl,'date')}${FL('o_pd','Perangkat Daerah / Pengguna Barang',p.pd,'text',0,NM)}${FL('o_al','Alamat Perangkat Daerah',p.al)}${FL('o_pf','Perihal / Maksud Penaksiran',p.pf,'area',1)}</div></div>`+sec('Daftar Objek yang Dimohonkan','Tambahkan seluruh objek BMD.',`<button class="btn sm" data-a="ad">＋ Tambah Objek</button>`)+(p.o.length?`<div class="tw"><table><thead><tr><th>No</th><th>Nama Objek</th><th>Kode</th><th>Tahun</th><th>Kondisi</th><th>Bentuk</th><th>Metode</th><th>Kuantiti</th><th>Aksi</th></tr></thead><tbody>${p.o.map((o,i)=>`<tr><td>${i+1}</td><td>${esc(o.n)}</td><td>${o.k}</td><td>${o.th}</td><td>${o.kd}</td><td>${o.bt}</td><td>${o.mt}</td><td>${o.q} ${o.sn}</td><td><button class="db" data-del="${i}">Hapus</button></td></tr>`).join('')}</tbody></table></div>`:EM('Belum ada objek','Klik “Tambah Objek”.'))+'</div><div id="o_f"></div><div style="text-align:right;margin-bottom:20px"><button class="btn" data-a="sv">Simpan Permohonan</button></div>';
  s.onchange=e=>{if(e.target.id!='o_no')return;const d=R.find(r=>r[0]==e.target.value);if(!d)return;$('#o_pd').value=d[1];if(!val('o_pf'))$('#o_pf').value=d[10]||''};
  s.onclick=e=>{const b=e.target.closest('[data-a],[data-del]');if(!b)return;if(b.dataset.del!=null){p.o.splice(+b.dataset.del,1);return pgOb()}const a=b.dataset.a;
   if(a=='bk'){if(!p.no&&!p.o.length)OB.splice(OB.indexOf(p),1);obEd=null;return pgOb()}
   const sy=()=>{p.no=val('o_no');p.tgl=val('o_tgl');p.pd=val('o_pd');p.al=val('o_al');p.pf=val('o_pf')};
   if(a=='ad'){sy();$('#o_f').innerHTML=sec('Tambah Objek Penaksiran')+`<div class="ff">${FL('x_n','Nama Barang / Objek','')}${FL('x_k','Kode / NIBAR','')}${FL('x_th','Tahun Perolehan','2010','number')}${FL('x_kd','Kondisi','Rusak Berat','text',0,['Rusak Berat','Rusak Sedang'])}${FL('x_bt','Bentuk','Scrap','text',0,['Scrap','Satuan','Material Bongkaran'])}${FL('x_mt','Pendekatan Pasar','Pendekatan Biaya','text',0,['Pendekatan Pasar','Pendekatan'])}${FL('x_mp','Jenis Material','Besi','text',0,['Besi','Aluminium','Baja','Plastik','Kertas','Lainnya'])}${FL('x_q','Kuantiti','','number')}${FL('x_sn','Satuan','KG','text',0,['KG','Batang','Unit','Meter','Liter'])}${FL('x_jl','Metode Penjualan','Lelang','text',0,['Lelang','Langsung'])}</div><div style="text-align:right"><button class="btn" data-a="so">Simpan Objek</button></div></div>`;return}
   if(a=='so'){if(!val('x_n')||!(+val('x_q')>0))return toast('Isi nama objek dan kuantiti.');p.o.push({n:val('x_n'),k:val('x_k')||'-',th:val('x_th'),kd:val('x_kd'),bt:val('x_bt'),mt:val('x_mt'),mp:val('x_mp'),q:+val('x_q'),sn:val('x_sn'),jl:val('x_jl')});sy();return pgOb()}
   if(a=='sv'){sy();if(!p.no||!p.o.length)return toast('Isi nomor permohonan dan minimal satu objek.');toast('Permohonan penaksiran disimpan.');obEd=null;pgOb()}};return}
 s.innerHTML=HD('Daftar Objek Penaksiran','',`<button class="btn" data-a="nw">＋ Tambah Permohonan</button>`)+AL_OB+sec('Daftar Permohonan Penaksiran','')+(OB.length?`<div class="tw"><table><thead><tr><th>No</th><th>Permohonan</th><th>Tanggal</th><th>Perangkat Daerah</th><th>Jumlah Objek</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${OB.map((p,i)=>`<tr><td>${i+1}</td><td>${p.no}</td><td>${fd(p.tgl)}</td><td>${p.pd}</td><td>${p.o.length}</td><td>${PL(stOb[p.st],p.st)}</td><td style="white-space:nowrap"><button class="db" data-oe="${p.id}"${p.st=='Posted'?' disabled aria-disabled="true" title="Sudah diposting. Unposting terlebih dahulu untuk mengedit." style="opacity:.4;cursor:not-allowed"':''}>Edit</button> <button class="db" data-ps="${p.id}">${p.st=='Posted'?'Unposting':'Posting'}</button></td></tr>`).join('')}</tbody></table></div>`:EM('Belum ada permohonan','Klik “Tambah Permohonan”.'))+'</div>';
 s.onchange=null;s.onclick=e=>{const b=e.target.closest('[data-a],[data-oe],[data-ps]');if(!b)return;if(b.dataset.a=='nw'){OB.push({id:Date.now(),no:'',tgl:today(),pd:NM[0],al:'',pf:'',st:'Draft',o:[]});obEd=OB[OB.length-1].id}if(b.dataset.oe){const q=OB.find(x=>x.id==b.dataset.oe);if(q&&q.st=='Posted')return toast('Permohonan yang sudah diposting tidak dapat diedit. Lakukan Unposting terlebih dahulu.');obEd=+b.dataset.oe}if(b.dataset.ps){const p=OB.find(x=>x.id==b.dataset.ps);p.st=p.st=='Posted'?'Draft':'Posted';if(p.st=='Draft')delete KK[p.id];toast(p.st=='Posted'?'Diposting ke Kertas Kerja.':'Ditarik dari Kertas Kerja.')}pgOb()}}
function kkNilai(p,k){const o=p.o[k],r=KK[p.id]||{},m=r.m?.[k]||o.mp,a=avg(m),ad=r.a?.[k]??(o.kd=='Rusak Berat'?20:10);return{m,n:a.n,v:a.v,ad,nl:o.mt=='Data Pasar'?o.q*a.v*(1-ad/100):(+r.b?.[k]||0)}}
function pgKk(){syncTksToObjects();const s=$('#kk'),ps=OB.filter(p=>p.st=='Posted');
 if(obCur&&ps.find(p=>p.id==obCur)){const p=OB.find(x=>x.id==obCur),done=KK[p.id]?.done,rs=p.o.map((_,i)=>kkNilai(p,i)),tot=rs.reduce((a,x)=>a+x.nl,0);
  s.innerHTML=HD('Knertas Kerja Penaksiran',p.no+' · '+p.pd,`<button class="btn o" data-a="bk">← Kembali</button>`)+sec('Perhitungan Nilai Taksiran','Data Pasar: kuantiti × rata-rata harga pembanding × (1 − penyesuaian kondisi). Minimal 3 pembanding.',done?PL('s-g','Selesai'):'')+`<div class="tw"><table><thead><tr><th>No</th><th>Objek</th><th>Kuantiti</th><th>Metode</th><th>Material</th><th>Pembanding</th><th>Rata-rata</th><th>Penyesuaian %</th><th>Nilai Taksiran</th></tr></thead><tbody>${p.o.map((o,i)=>{const x=rs[i];return`<tr><td>${i+1}</td><td>${esc(o.n)}<small>${o.kd} · ${o.jl}</small></td><td>${o.q} ${o.sn}</td><td>${o.mt}</td><td>${o.mt=='Data Pasar'?`<select class="kkm" data-i="${i}" ${done?'disabled':''}>${['Besi','Aluminium','Baja','Plastik','Kertas'].map(m=>`<option${m==x.m?' selected':''}>${m}</option>`)}</select>`:'-'}</td><td>${o.mt=='Data Pasar'?`${x.n} ${x.n<3?'<span class="stt s-r">kurang</span>':''}`:'-'}</td><td>${o.mt=='Data Pasar'?RP(x.v)+'/'+o.sn:'-'}</td><td>${o.mt=='Data Pasar'?`<input class="kka" data-i="${i}" type="number" value="${x.ad}" ${done?'disabled':''} style="width:70px;border:1px solid var(--ln);border-radius:8px;padding:6px">`:'-'}</td><td><b>${o.mt=='Data Pasar'?RP(x.nl):`<input class="kkb" data-i="${i}" type="number" value="${x.nl}" ${done?'disabled':''} style="width:130px;border:1px solid var(--ln);border-radius:8px;padding:6px">`}</b></td></tr>`}).join('')}</tbody></table></div><div style="text-align:right;margin-top:14px;font-size:15px">Total nilai taksiran: <b>${RP(tot)}</b></div></div>`+(done?'':`<div style="text-align:right;margin-bottom:20px"><button class="btn" data-a="fin">Selesaikan Kertas Kerja</button></div>`);
  s.onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a=='bk'){obCur=null;return pgKk()}sv(p);if(rs.some((x,i)=>p.o[i].mt=='Data Pasar'&&x.n<3))return toast('Data Pasar membutuhkan minimal 3 pembanding per material.');KK[p.id].done=true;toast('Kertas Kerja selesai. Laporan tersedia.');pgKk()};
  s.onchange=e=>{if(KK[p.id]?.done)return;sv(p);pgKk()};return}
 s.innerHTML=HD('Kertas Kerja Penaksiran','')+sec('Permohonan Siap Ditaksir','')+(ps.length?`<div class="tw"><table><thead><tr><th>No</th><th>Permohonan</th><th>Tanggal</th><th>Jumlah Objek</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${ps.map((p,i)=>`<tr><td>${i+1}</td><td>${p.no}</td><td>${fd(p.tgl)}</td><td>${p.o.length}</td><td>${KK[p.id]?.done?PL('s-g','Selesai'):PL('s-o','Proses Taksir')}</td><td><button class="btn sm" data-kk="${p.id}">Buka</button></td></tr>`).join('')}</tbody></table></div>`:EM('Belum ada permohonan Posted','Posting permohonan dari Daftar Objek Penaksiran.'))+'</div>';
 s.onclick=e=>{const b=e.target.closest('[data-kk]');if(b){obCur=+b.dataset.kk;pgKk()}}}
function sv(p){const r=KK[p.id]=KK[p.id]||{m:{},a:{},b:{}};$$('#kk .kknm').forEach(x=>r.m[x.dataset.i]=x.value);$$('#kk .kka').forEach(x=>r.a[x.dataset.i]=+x.value);$$('#kk .kkb').forEach(x=>r.b[x.dataset.i]=+x.value)}
function pgLp(){syncTksToObjects();const s=$('#lpr'),ps=OB.filter(p=>KK[p.id]?.done);
 if(obCur&&ps.find(p=>p.id==obCur)){const p=OB.find(x=>x.id==obCur),rs=p.o.map((_,i)=>kkNilai(p,i)),tot=rs.reduce((a,x)=>a+x.nl,0);
  s.innerHTML=HD('Laporan Penaksiran',p.no,`<button class="btn o" data-a="bk">← Kembali</button><button class="btn" data-a="pr">Cetak Laporan</button>`)+`<div class="s4">${[['Jumlah Objek',p.o.length,'objek'],['Total Kuantiti',p.o.reduce((a,o)=>a+o.q,0).toLocaleString('id-ID'),'unit/kg'],['Nilai Taksiran',RP(tot),''],['Status','Final','kertas kerja selesai']].map(x=>`<div class="sc"><u style="background:#eff6ff;color:var(--bl)"><svg class="i"><use href="#c"/></svg></u><small>${x[0]}</small><b style="font-size:${x[1].length>9?18:26}px">${x[1]}</b><small>${x[2]}</small></div>`).join('')}</div>`+sec('Rincian Penaksiran',p.pf)+`<div class="tw"><table><thead><tr><th>No</th><th>Objek</th><th>Kuantiti</th><th>Metode</th><th>Penjualan</th><th>Nilai Taksiran</th></tr></thead><tbody>${p.o.map((o,i)=>`<tr><td>${i+1}</td><td>${esc(o.n)}</td><td>${o.q} ${o.sn}</td><td>${o.mt}</td><td>${o.jl}</td><td>${RP(rs[i].nl)}</td></tr>`).join('')}</tbody></table></div></div>`;
  s.onclick=e=>{const a=(e.target.closest('[data-a]')||{dataset:{}}).dataset.a;if(a=='bk'){obCur=null;pgLp()}if(a=='pr'){const w=window.open('','_blank');if(!w)return toast('Pop-up diblokir browser.');w.document.write(`<title>Laporan ${p.no}</title><body style="font:14px Arial;padding:40px"><h2 style="text-align:center">LAPORAN PENAKSIRAN BMD</h2><p>${p.no} · ${p.pd} · ${fd(p.tgl)}</p><p>${esc(p.pf)}</p><table border=1 cellpadding=6 style="border-collapse:collapse;width:100%"><tr><th>No</th><th>Objek</th><th>Kuantiti</th><th>Metode</th><th>Nilai</th></tr>${p.o.map((o,i)=>`<tr><td>${i+1}</td><td>${esc(o.n)}</td><td>${o.q} ${o.sn}</td><td>${o.mt}</td><td align=right>${RP(rs[i].nl)}</td></tr>`).join('')}<tr><td colspan=4 align=right><b>Total</b></td><td align=right><b>${RP(tot)}</b></td></tr></table>`);w.document.close()}};return}
 s.innerHTML=HD('Laporan Penaksiran','')+sec('Laporan Tersedia','Muncul setelah Kertas Kerja Penaksiran diselesaikan.')+(ps.length?`<div class="tw"><table><thead><tr><th>No</th><th>Permohonan</th><th>Perangkat Daerah</th><th>Objek</th><th>Aksi</th></tr></thead><tbody>${ps.map((p,i)=>`<tr><td>${i+1}</td><td>${p.no}</td><td>${p.pd}</td><td>${p.o.length}</td><td><button class="btn sm" data-lp="${p.id}">Lihat Laporan</button></td></tr>`).join('')}</tbody></table></div>`:EM('Belum ada laporan','Selesaikan Kertas Kerja Penaksiran terlebih dahulu.'))+'</div>';
 s.onclick=e=>{const b=e.target.closest('[data-lp]');if(b){obCur=+b.dataset.lp;pgLp()}}}
let hpAdd=false;const MT=['Besi','Aluminium','Baja','Plastik','Kertas','Lainnya']; 
function pgHp(){const s=$('#hp'),f=s.dataset.f||'';
 s.innerHTML=HD('Harga Pembanding','',`<button class="btn" data-a="ad">＋ Tambah Harga Pembanding</button>`)+(hpAdd?sec('Tambah Harga Pembanding','')+`<div class="ff">${FL('h_t','Tanggal Update Harga',today(),'date')}${FL('h_l','Nama Lapak / Pengepul','')}${FL('h_a','Area / Wilayah','')}${FL('h_al','Alamat Lengkap / Link Maps','')}${FL('h_k','Nomor Kontak','')}${FL('h_m','Jenis Material','Besi','text',0,MT)}${FL('h_s','Satuan Harga','Rp/Kg','text',0,['Rp/Kg','Rp/Batang'])}${FL('h_h','Harga Beli','','number')}</div><div style="text-align:right;margin-top:12px"><button class="btn o" data-a="ca">Batal</button> <button class="btn" data-a="sv">Simpan Harga</button></div></div>`:'')+
 sec('Daftar Harga Pembanding','',`<select id="h_f" style="border:1px solid var(--ln);border-radius:8px;padding:8px"><option value="">Semua Material</option>${MT.map(m=>`<option${m==f?' selected':''}>${m}</option>`)}</select>`)+`<div class="tw"><table><thead><tr><th>No</th><th>Tanggal Update</th><th>Lapak / Pengepul</th><th>Area / Wilayah </th><th>Alamat Lengkap / Link Maps</th><th> Nomor Kontak </th><th> Jenis Material</th><th>Satuan</th><th>Harga Beli</th><th>Aksi</th></tr></thead><tbody>${HP.filter(x=>!f||x.m==f).map((x,i)=>`<tr><td>${i+1}</td><td>${fd(x.t)}</td><td>${esc(x.l)}</td><td>${esc(x.a)}</td><td>${esc(x.al)}</td><td>${esc(x.kt)}</td><td>${x.m}</td><td>${x.s}</td><td><b>${RP(x.h)}</b></td><td><button class="db" data-del="${HP.indexOf(x)}">Hapus</button></td></tr>`).join('')}</tbody></table></div></div>`+sec('Import Database Harga Pembanding','')+`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input type="file" id="h_x" accept=".csv,.xlsx,.xls"><button class="btn" data-a="im">Upload & Import</button><button class="btn o" data-a="tp">Download Template CSV</button></div></div>`;
 s.onchange=e=>{if(e.target.id=='h_f'){s.dataset.f=e.target.value;pgHp()}};
 s.onclick=e=>{const b=e.target.closest('[data-a],[data-del]');if(!b)return;if(b.dataset.del!=null){HP.splice(+b.dataset.del,1);return pgHp()}const a=b.dataset.a;
  if(a=='ad'||a=='ca'){hpAdd=a=='ad';return pgHp()}
  if(a=='sv'){if(!val('h_l')||!(+val('h_h')>0))return toast('Isi nama lapak dan harga beli.');HP.unshift({t:val('h_t'),l:val('h_l'),a:val('h_a'),al:val('h_al'),kt:val('h_k'),m:val('h_m'),s:val('h_s'),h:+val('h_h')});hpAdd=false;toast('Harga pembanding disimpan.');return pgHp()}
  if(a=='tp'){const u=URL.createObjectURL(new Blob(['Tanggal Update Harga,Nama Lapak / Pengepul,Area / Wilayah,Alamat Lengkap / Link Maps,Nomor Kontak,Jenis Material,Satuan,Harga Beli\n2026-10-01,UD Contoh,Tanah Sareal,Jl. Contoh 1,0812-0000-0000,Besi,Rp/Kg,6300\n'],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download='Template_Harga_Pembanding.csv';l.click();return}
  if(a=='im'){const f=$('#h_x').files[0];if(!f)return toast('Pilih file terlebih dahulu.');const rd=new FileReader();rd.onload=()=>{const rows=String(rd.result).split(/\r?\n/).slice(1).filter(Boolean);let n=0;rows.forEach(r=>{const c=r.split(',');if(c.length>=8&&+c[7]>0){HP.push({t:c[0],l:c[1],a:c[2],al:c[3],kt:c[4],m:c[5],s:c[6],h:+c[7]});n++}});toast(n+' baris diimpor.');pgHp()};if(/\.csv$/i.test(f.name))rd.readAsText(f);else toast('Gunakan format CSV (simpan Excel sebagai .csv).')}}}
const RF={};let rfCur=null;
function pgRf(){const s=$('#rf'),g={};HP.forEach(x=>(g[x.l]=g[x.l]||{l:x.l,kt:x.kt,a:x.a,al:x.al,n:0}).n++);const r=Object.values(g);
 if(rfCur){const x=g[rfCur];s.innerHTML=HD('Dokumentasi Survei Lapak',rfCur,`<button class="btn o" data-a="bk">← Kembali</button>`)+sec('Gambar Survei','Foto/gambar survei lapak '+esc(rfCur))+`<label class="btn sm" style="cursor:pointer">＋ Tambah Gambar Survei<input id="r_f" type="file" accept="image/*" multiple hidden></label><div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px">${(RF[rfCur]||[]).map(u=>`<img src="${u}" style="width:150px;height:110px;object-fit:cover;border-radius:10px;border:1px solid var(--ln)">`).join('')||'<span class="mt">Belum ada gambar.</span>'}</div></div>`;
  $('#r_f').onchange=e=>{RF[rfCur]=(RF[rfCur]||[]).concat([...e.target.files].map(f=>URL.createObjectURL(f)));pgRf()};s.onclick=e=>{if(e.target.closest('[data-a]')){rfCur=null;pgRf()}};return}
 s.innerHTML=HD('Referensi Penaksiran','')+sec('Daftar Referensi Lapak / Pengepul','')+(r.length?`<div class="tw"><table><thead><tr><th>No</th><th>Lapak / Pengepul</th><th>Kontak</th><th>Area / Wilayah</th><th>Alamat / Maps </th><th>Data Harga</th><th>Gambar Survei</th><th>Aksi</th></tr></thead><tbody>${r.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.l)}</b></td><td>${esc(x.kt)}</td><td>${esc(x.a)}</td><td>${esc(x.al)}</td><td>${x.n} data</td><td>${(RF[x.l]||[]).length} gambar</td><td><button class="btn sm" data-rf="${esc(x.l)}">Dokumentasi</button></td></tr>`).join('')}</tbody></table></div>`:EM('Belum ada lapak','Lapak muncul otomatis setelah ada data Harga Pembanding.'))+'</div>';
 s.onclick=e=>{const b=e.target.closest('[data-rf]');if(b){rfCur=b.dataset.rf;pgRf()}}}
/* Tabel Data Master */
 const DM = [
  {kode:'1918171615', n:'Andrea anastasya', JS:'Pemindahtanganan' },
  {kode:'1918171615', n:'Arasya alfaira', JS:'Pemindahtanganan' },
  {kode:'1918171615', n:'Kania Cahaya', JS:'Izin Bongkar' },
  {kode:'1918171615', n:'Laila Nurazizah', JS: 'Izin Bongkar' },
  {kode:'1918171615', n:'Hana Rahmaya Zahra', JS:'Izin Bongkar' },
  {kode:'1918171615', n:'Syafira Aulia', JS:'Pemindahtanganan'  },
  {kode:'1980723457', n:'Jenny Syahira', JS:'-'}
];
function pgDm(){
  const s = $('#dm');
  s.innerHTML =
    HD('Data Master','') +
    sec('Daftar Nama Pengguna Barang','') +
    (DM.length
      ? `<div class="tw"><table>
          <thead><tr>
            <th>No</th><th>NIP</th><th>Nama Pengguna Barang</th><th>Jenis Penghapusan</th>
          </tr></thead>
          <tbody>${DM.map((x,i)=>`<tr>
            <td>${i+1}</td><td>${esc(x.kode)}</td><td>${esc(x.n)}</td><td>${esc(x.JS)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`
      : EM('Belum ada data','Data master akan muncul di sini.')
    ) + '</div>';
}
 const PG={sv:pgSv,pt:pgPt,psj:pgPsj,ob:pgOb,kk:pgKk,lpr:pgLp,hp:pgHp,rf:pgRf,dm:pgDm,pmp:pgPerpen,tksadm:pgTksAdmin},_s2=show;
show=function(v,b){svCur=penCur=psjCur=tksCur=tksAdminCur=obCur=obEd=rfCur=null;hpAdd=false;_s2(v,b);if(PG[v])PG[v]()};
$$('.nav').forEach(n=>n.onclick=()=>show(n.dataset.v,n));

/* Menu-menu Verifikasi */
let editPending=false,admCur=null,admRO=false,admPgV=1;
function cfm(t,m,ok,okTxt,only){let o=$('#mdl');if(!o){o=document.createElement('div');o.id='mdl';o.className='mdl';o.innerHTML='<div class="mbx"><h3></h3><p></p><div class="mft"><button class="btn o" data-x="0">Batal</button><button class="btn" data-x="1"></button></div></div>';document.body.appendChild(o)}
 o.querySelector('h3').textContent=t;o.querySelector('p').textContent=m;o.querySelector('[data-x="1"]').textContent=okTxt||'OK';o.classList.add('on');o.querySelector('[data-x="1"]').classList.toggle('dng',/hapus|tolak/i.test(okTxt||''));
 o.onclick=e=>{const b=e.target.closest('[data-x]');if(!b&&e.target!==o)return;o.classList.remove('on');if(b&&b.dataset.x=='1')ok()}}
window.addEventListener('scroll',()=>{const m=$('.rmn');if(m)m.remove()},true);
function rmClose(){const m=$('.rmn');if(m)m.remove()}
function rowMenu(i,btn){rmClose();const d=R[i],r=btn.getBoundingClientRect(),m=document.createElement('div');m.className='rmn';
 m.innerHTML=`<button data-m="h">Lihat Riwayat</button>${bolehTulis(d)&&d[6]=='Draft'?'<button data-m="x" class="dg">Hapus Draft</button>':''}`;m.style.left=Math.max(8,r.right-170)+'px';document.body.appendChild(m);const h=m.offsetHeight;m.style.top=(r.bottom+6+h>innerHeight?Math.max(8,r.top-h-6):r.bottom+6)+'px';
 m.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;rmClose();if(b.dataset.m=='h')detail(i,R,2);else if(!bolehTulis(d))deny();else cfm('Hapus draft?','Draft '+d[0]+' akan dihapus permanen.',()=>{R.splice(i,1);delete RX[d[0]];fl();toast('Draft dihapus.')},'Hapus')}}
/* Surat Permohonan (dibuat otomatis, berdasarkan input pengguna barang (kayak generate gitu)) */
function genRow(ok){const u=$('.upl.gen');if(!u)return;u.classList.toggle('y',ok);$('#gtx').textContent=ok?SURAT_DOCX_NAME+' · dibuat otomatis dari isian formulir (format Word)':'Dibuat otomatis setelah nomor dan tanggal surat terisi.';$('#gp').disabled=!ok}
function collect(){const up=$$('.upl'),f={jn:$('input[name=jn]:checked').value,no:$('#fn').value.trim(),tgl:$('#fd').value,pd:$('#fpd').value,pf:$('#fp2').value.trim(),kepala:$('#fkp').value.trim(),nip:$('#fnip').value.trim(),kib:$$('.kb:checked').map(x=>+x.dataset.k)};
 f.docs=up.map((u,k)=>{if(k==0)return suratSiap(f)?SURAT_DOCX_NAME:'';const g=u.querySelector('input[type=file]').files[0];return g?g.name:(u.classList.contains('y')?(u.dataset.nm||'dokumen.pdf'):'')});
 f.files=up.map((u,k)=>k==0?null:(u._file||null));
 return f}
function rowFrom(f,s){const ks=f.kib.map(i=>K[i]),t=new Date(f.tgl||Date.now());return[f.no,f.pd,ks.length?ks[0][2]+(ks.length>1?` +${ks.length-1} lainnya`:''):'-',ks.length?ks[0][1]:'-',f.jn,t.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}),s,ks.length?ks[0][3]:'-','-',ks.length?ks[0][4]:'-',f.pf||'-',f.docs.filter(Boolean).length+' file',ks.length?'B':'-']}
function missing(f){const m=[],dn=['Surat Permohonan','Surat Kajian / BA Penelitian','Surat Perintah','Surat Pernyataan'];if(!f.no)m.push('Nomor surat');if(!f.tgl)m.push('Tanggal surat');if(!f.pf)m.push('Perihal');if(!f.kepala||!f.nip)m.push('Nama & NIP Kepala OPD');if(!ttdSah(f.no,f))m.push('Tanda tangan digital Kepala OPD');f.docs.forEach((x,i)=>{if(!x&&i>0)m.push(dn[i])});if(!f.kib.length)m.push('Barang KIB');return m}
function resetForm(){editNo=null;$$('.rjn').forEach(x=>x.remove());$('#ff').reset();$$('.upl:not(.gen)').forEach(u=>{u._file=null;u.classList.remove('y');u.dataset.nm='';u.querySelector('small').textContent='PDF, maksimal 5 MB';u.querySelector('.bt').firstChild.textContent='Pilih File'});sum()}
/* selisih form lama dengan form baru (untuk hitung data realnya berapa). */
function diffForm(a,b){const c=[],dn=['Surat Permohonan','Surat Kajian','Surat Perintah','Surat Pernyataan'];a=a||{docs:[],kib:[]};
 if(a.jn&&a.jn!==b.jn)c.push('Jenis ('+a.jn+' → '+b.jn+')');
 if(a.no&&a.no!==b.no)c.push('Nomor ('+a.no+' → '+b.no+')');
 if((a.tgl||'')!==(b.tgl||''))c.push('Tanggal surat');
 if((a.pf||'')!==(b.pf||''))c.push('Perihal');
 if((a.kepala||'')!==(b.kepala||'')||(a.nip||'')!==(b.nip||''))c.push('Nama / NIP kepala');
 dn.forEach((n,i)=>{if(i==0)return;const x=(a.docs||[])[i]||'',y=b.docs[i]||'';if(x!==y||(x&&((a.files||[])[i]||null)!==((b.files||[])[i]||null)))c.push(n+(!x?' diunggah':!y?' dihapus':' diganti'))});
 if(JSON.stringify([...(a.kib||[])].sort())!==JSON.stringify([...b.kib].sort()))c.push('Barang KIB');
 return c}
function kirim(dr){if(!can('permohonan.kelola'))return deny();const f=collect();if(!f.no){toast('Isi nomor surat terlebih dahulu.');$('#fn').focus();return}
 const idx=editNo?R.findIndex(d=>d[0]==editNo):-1,old=idx>=0?R[idx]:null;
 if(!dr&&!old)return toast('Simpan sebagai draft terlebih dahulu, setelah itu baru dapat diajukan.');
 if(old&&!EDIT_OK[old[6]])return toast('Permohonan sudah diajukan dan tidak dapat diedit.');
 if(f.pd!==CUR.opd||(old&&!bolehTulis(old)))return deny();
 if(R.some((d,k)=>d[0]==f.no&&k!==idx))return toast('Nomor permohonan sudah digunakan. Gunakan nomor lain.');
 if(!dr){const m=missing(f);if(m.length)return toast('Belum lengkap: '+m.join(', ')+'.')}
 const prev=old?(RX[old[0]]||{}).f:null,chg=old?diffForm(prev,f):[];
 if(old&&dr&&!chg.length)return toast('Tidak ada perubahan yang perlu disimpan.');
 const rev=!!old&&old[6]=='Ditolak';
 if(rev&&!dr){const rj=(RX[old[0]]||{}).rj,blm=rj?cnRej(old[0]).filter(i=>sigDoc(f,i)===rj[i]).map(i=>i==0?'Surat Permohonan (ubah isian formulir)':DOCN[i]):[];if(blm.length)return toast('Dokumen yang ditolak belum diganti: '+blm.join(', ')+'.')}
 const go=async()=>{try{if(suratSiap(f))f.files[0]=await suratPermohonanDocx(f,ttdSah(old?old[0]:f.no,f))}catch(er){return toast('Gagal membuat Surat Permohonan: '+er.message)}
  const s=dr?(old?old[6]:'Draft'):'Menunggu Verifikasi',row=rowFrom(f,s);
  if(old){if(old[0]!=f.no){RX[f.no]=RX[old[0]];delete RX[old[0]]}R[idx]=row}else R.unshift(row);
  (RX[f.no]=RX[f.no]||{h:[]}).f=f;if(!dr){RX[f.no].chk=[];RX[f.no].cn=[];RX[f.no].kv={};RX[f.no].kn={};if(rev){RX[f.no].cat='';delete RX[f.no].rj}}
  if(!old)hs(f.no,'Draft dibuat',CUR.name);else if(chg.length)hs(f.no,rev?'Revisi disimpan':'Draft diedit',CUR.name+' · '+chg.join(', '));
  if(!dr)hs(f.no,rev?'Diajukan ulang setelah revisi':'Diajukan untuk verifikasi Admin',CUR.name);
  {const X=RX[f.no];if(X){if(X.ttd&&X.ttd.sig!==suratSig(f)){delete X.ttd;hs(f.no,'TTD digital Kepala OPD dibatalkan karena isi surat diubah',CUR.name)}if(X.lk&&X.lk.sig!==suratSig(f))delete X.lk}}
  resetForm();fs='';pg=1;$('#q2').value='';$$('.cs>div').forEach((x,i)=>x.classList.toggle('on',i==0));fl();show('list');toast(dr?(old?(rev?'Revisi disimpan. Klik Perbaiki & Ajukan Ulang bila sudah siap.':'Perubahan draft disimpan.'):'Draft disimpan. Klik "Ajukan Verifikasi" pada daftar untuk mengirim ke Admin.'):(rev?'Perbaikan diajukan ulang ke Admin.':'Permohonan diajukan ke Admin untuk verifikasi.'))};
 dr?go():cfm(rev?'Ajukan ulang untuk verifikasi?':'Ajukan untuk verifikasi?',rev?'Perbaikan Anda akan diperiksa ulang oleh Admin. Selama menunggu, permohonan tidak dapat diedit, tetapi dapat ditarik kembali.':'Setelah diajukan, permohonan tidak dapat diedit lagi. Anda masih bisa menariknya kembali selama belum diperiksa Admin.',go,rev?'Ajukan Ulang':'Ajukan')}
$('#aj').onclick=()=>kirim(false);$('#dr').onclick=()=>kirim(true);
function ajukan(i){if(!bolehTulis(R[i]))return deny();if(R[i][6]!='Draft')return toast('Hanya permohonan berstatus Draft yang dapat diajukan.');const d=R[i],f=(RX[d[0]]||{}).f,m=f?missing(f):['Data formulir'];
 if(m.length)return cfm('Permohonan belum lengkap','Lengkapi dulu: '+m.join(', ')+'.',()=>editRow(i),'Edit Sekarang');
 cfm('Ajukan untuk verifikasi?','Setelah diajukan, permohonan tidak dapat diedit lagi. Anda masih bisa menariknya kembali selama belum diperiksa Admin.',async()=>{try{await suratSimpan(d[0])}catch(er){return toast('Gagal menyiapkan surat: '+er.message)}d[6]='Menunggu Verifikasi';(RX[d[0]]=RX[d[0]]||{h:[]}).chk=[];RX[d[0]].cn=[];RX[d[0]].kv={};RX[d[0]].kn={};hs(d[0],'Diajukan untuk verifikasi Admin',CUR.name);fl();toast('Permohonan diajukan ke Admin.')},'Ajukan')}
function tarik(i){if(!bolehTulis(R[i]))return deny();if(R[i][6]!='Menunggu Verifikasi')return toast('Hanya permohonan yang menunggu verifikasi yang dapat ditarik.');const d=R[i];cfm('Tarik kembali permohonan?','Status kembali menjadi Draft dan dapat diedit lagi.',()=>{d[6]='Draft';hs(d[0],'Ditarik kembali oleh pemohon',CUR.name);fl();toast('Permohonan ditarik kembali menjadi Draft.')},'Tarik Kembali')}
function editRow(i){if(!bolehTulis(R[i]))return deny();if(!EDIT_OK[R[i][6]])return toast('Permohonan sudah diajukan dan tidak dapat diedit.');const d=R[i],f=(RX[d[0]]||{}).f||{jn:d[4],no:d[0],tgl:today(),pd:d[1],pf:d[10]=='-'?'':d[10],docs:[],kib:[]};editNo=d[0];editPending=true;show('form');
 $$('input[name=jn]').forEach(r=>r.checked=r.value==f.jn);$('#fn').value=f.no;$('#fd').value=f.tgl||today();$('#fpd').value=f.pd;$('#fp2').value=f.pf||'';$('#fkp').value=f.kepala||'';$('#fnip').value=f.nip||'';
 $$('.upl').forEach((u,k)=>{if(k==0)return;const n=f.docs[k]||'';u._file=(f.files||[])[k]||null;u.querySelector('input[type=file]').value='';u.dataset.nm=n;u.classList.toggle('y',!!n);u.querySelector('small').textContent=n?n+' · tersimpan':'PDF, maksimal 5 MB';u.querySelector('.bt').firstChild.textContent=n?'Ganti':'Pilih File'});
 $$('.kb').forEach((c,k)=>c.checked=f.kib.includes(k));$('#ka').checked=$$('.kb').every(c=>c.checked);sum();formMode()}
function formMode(){const e=!!editNo,d=e?R.find(x=>x[0]==editNo):null;const rv=!!d&&d[6]=='Ditolak';$('#form .bn h1').textContent=rv?'Perbaiki Permohonan':e?'Edit Permohonan':'Buat Permohonan';
 $('#form .bn p').textContent=rv?'Permohonan ditolak Admin. Perbaiki sesuai keterangan di bawah, ganti dokumen yang ditolak, lalu ajukan ulang.':e?'':'Lengkapi identitas, unggah 3 dokumen persyaratan (Surat Permohonan dibuat otomatis), lalu pilih barang dari daftar KIB. Simpan sebagai draft dulu sebelum diajukan.';
 const p=$('#form .bn .stt');p.className='stt '+(d?d[6]:'Draft');p.textContent=d?d[6]:'Draft';$('#aj').textContent=rv?'Simpan & Ajukan Ulang':e?'Simpan & Ajukan Verifikasi':'Ajukan Verifikasi';$('#dr').textContent=e?(rv?'Simpan Revisi':'Simpan Perubahan'):'Simpan Draft';
 $$('.rjn').forEach(x=>x.remove());if(rv)cnList(d[0]).forEach(([i,n,t])=>{const u=$$('.upl')[i];if(u)u.insertAdjacentHTML('afterend',`<div class="rjn"><b>${i==0?'Ditolak, perbaiki isian formulir (surat dibuat ulang otomatis).':'Ditolak, ganti dokumen ini.'}</b> ${esc(t)}</div>`)});
 if(rv)kbRej(d[0]).forEach(q=>{const cb=$(`.kb[data-k="${q}"]`),td=cb&&cb.closest('tr').children[3];if(td)td.insertAdjacentHTML('beforeend',`<div class="rjn" style="margin:6px 0 0"><b>Barang ditolak.</b> ${esc(kvN(d[0],q).trim()||'Lihat catatan Admin.')}</div>`)});
 let n=$('#fnote');if(!n){n=document.createElement('div');n.id='fnote';n.className='al2';$('#form .sw').before(n)}const c=e&&(RX[editNo]||{}).cat;n.style.display=c?'block':'none';n.innerHTML=c?'<b>Catatan Admin:</b> '+esc(c)+cnHtml(editNo):''}
const _s3=show;show=function(v,b){if(v=='form'){if(!editPending)resetForm()}else editNo=null;const keep=editPending;editPending=false;admCur=null;_s3(v,b);if(v=='form'&&!keep)formMode()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ed],[data-vf],[data-wd],[data-mn]');if(!b){if(!e.target.closest('.rmn'))rmClose();return}
 if(b.dataset.ed!=null)return editRow(+b.dataset.ed);if(b.dataset.vf!=null)return ajukan(+b.dataset.vf);if(b.dataset.wd!=null)return tarik(+b.dataset.wd);if(b.dataset.mn!=null)return rowMenu(+b.dataset.mn,b)});
/* Pratinjau dokumen */
/* Validasi dokumen oleh Admin, disimpan di RX[no], chk[i]:
   Nilai lama berupa true (versi centang) dianggap 'ok'. */
const cv=v=>v===true||v==='ok'?'ok':v==='no'?'no':'';
const chkC=(no,t)=>[0,1,2,3].filter(i=>cv(((RX[no]||{}).chk||[])[i])==t).length;
const chkN=no=>chkC(no,'ok');
/* Keterangan penolakan per dokumen: RX[no].cn[i] (wajib bila chk[i]=='no'), ditampilkan ke Pengguna Barang. */
const cnList=no=>{const x=RX[no]||{},f=x.f||{docs:[]},ck=x.chk||[],cn=x.cn||[];return DOCN.map((n,i)=>[i,n,String(cn[i]||'').trim()]).filter(([i,n,t])=>(f.docs||[])[i]&&cv(ck[i])=='no'&&t)};
const cnRej=no=>{const x=RX[no]||{},f=x.f||{docs:[]},ck=x.chk||[];return[0,1,2,3].filter(i=>(f.docs||[])[i]&&cv(ck[i])=='no')};
const sigDoc=(f,i)=>i==0?'gen|'+suratSig(f):(f.docs[i]||'')+'|'+(((f.files||[])[i]||{}).size||0);
/* Logic Verifikasi Barang oleh Admin: RX[no].kv[kIndex]='ok'|'no', RX[no].kn[kIndex]=keterangan. */
const kvV=(no,q)=>{const v=((RX[no]||{}).kv||{})[q];return v=='ok'||v=='no'?v:''},kvN=(no,q)=>String(((RX[no]||{}).kn||{})[q]||''),
 kvIdx=no=>((RX[no]||{}).f||{}).kib||[],kbRej=no=>kvIdx(no).filter(q=>kvV(no,q)=='no');
const kvSumHtml=no=>{const a=kvIdx(no),ok=a.filter(q=>kvV(no,q)=='ok').length,no_=a.filter(q=>kvV(no,q)=='no').length;return `<span><b>${ok+no_}/${a.length}</b>Barang diperiksa</span><span><b>${ok}</b>Sesuai</span><span><b>${no_}</b>Ditolak</span>`};
function kvTable(no,mode){const a=kvIdx(no);
 return `<div class="tw"><table class="kvt"><thead><tr><th>KIB ID</th><th>Kode Barang</th><th>Nama Barang</th><th>Tahun</th><th>Kondisi</th><th>Kuantitas</th><th>Satuan</th><th>Hasil</th><th>Keterangan</th></tr></thead><tbody>${a.map(q=>{const r=K[q],v=kvV(no,q),n=kvN(no,q);
  return `<tr><td class="mono"><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${mode===true?`<select class="dsel ${v}" data-kv="${q}" aria-label="Hasil ${esc(r[2])}"><option value="">Belum diperiksa</option><option value="ok"${v=='ok'?' selected':''}>Sesuai</option><option value="no"${v=='no'?' selected':''}>Ditolak</option></select>`:v?PL(v=='ok'?'s-g':'s-r',v=='ok'?'Sesuai':'Ditolak'):'-'}</td><td>${mode===true?`<textarea data-kn="${q}" rows="2" placeholder="Keterangan pemeriksaan...">${esc(n)}</textarea>`:esc(n)||'-'}</td></tr>`}).join('')}</tbody></table></div><div class="kvs" id="kvs">${kvSumHtml(no)}</div>`}
const cnHtml=no=>{const l=cnList(no),bk=kbRej(no).map(q=>[K[q][2],kvN(no,q).trim()]).filter(a=>a[1]);return l.length||bk.length?`<div style="margin-top:6px"><b>Yang perlu diperbaiki:</b><ul style="margin:4px 0 0;padding-left:18px">${l.map(([i,n,t])=>`<li><b>${n}:</b> ${esc(t)}</li>`).join('')}${bk.map(([n,t])=>`<li><b>Barang ${esc(n)}:</b> ${esc(t)}</li>`).join('')}</ul></div>`:''};
const chkSum=no=>{const n=chkC(no,'no');return chkN(no)+'/4 sesuai'+(n?' · '+n+' ditolak':'')};
const vdone=no=>{const d=R.find(r=>r[0]==no);return !!d&&d[6]!='Draft'&&d[6]!='Menunggu Verifikasi'};
function docRows(no,chk){const x=RX[no]||{},f=x.f||{docs:[],files:[]},ck=x.chk||[];
 return DOCN.map((n,i)=>{const nm=(f.docs||[])[i],b=(f.files||[])[i],sv=cv(ck[i]),nt=(x.cn||[])[i]||'';
  return`<div class="dr${nm?' y':''}"><span class="dn">${i+1}</span><div class="dm"><b>${n}</b><small class="mt">${nm?esc(nm)+(b?' · '+Math.max(1,Math.round(b.size/1024))+' KB':' · berkas tidak tersedia untuk pratinjau'):'Belum diunggah'}</small>${i==0&&nm?ttdBadge(no):''}</div><div class="da">${b?`<button type="button" class="btn o sm" data-pvo="${i}" data-no="${esc(no)}">Lihat</button>`:''}${chk&&nm?`<select class="dsel ${cv(ck[i])}" data-chk="${i}" aria-label="Validasi ${esc(n)}"${chk==='ro'?' disabled':''}><option value="">Belum diperiksa</option><option value="ok"${cv(ck[i])=='ok'?' selected':''}>Sesuai</option><option value="no"${cv(ck[i])=='no'?' selected':''}>Ditolak</option></select>`:!chk&&nm&&cv(ck[i])&&vdone(no)?`<span class="stt ${cv(ck[i])=='ok'?'s-g':'s-r'}">${cv(ck[i])=='ok'?'Sesuai':'Ditolak'}</span>`:''}</div>${chk&&chk!=='ro'&&nm?`<div class="dnote" data-cnw="${i}"${sv=='no'?'':' hidden'}><label>Keterangan penolakan <em>(wajib diisi)</em><textarea data-cn="${i}" rows="2" placeholder="Jelaskan apa yang harus diperbaiki pemohon pada dokumen ini...">${esc(nt)}</textarea></label></div>`:(sv=='no'&&nm&&String(nt).trim()&&(chk==='ro'||(!chk&&vdone(no))))?`<div class="dnote ro"><b>Keterangan:</b> ${esc(nt)}</div>`:''}</div>`}).join('')}
let pvUrl=null;
function pvClose(){const m=$('#pvm');if(m)m.remove();if(pvUrl){URL.revokeObjectURL(pvUrl);pvUrl=null}}
function pvOpen(no,k){const d=R.find(r=>r[0]==no);if(!d||!own(d))return deny();const f=(RX[no]||{}).f,b=f&&(f.files||[])[k];
 if(!b)return toast('Berkas belum tersedia untuk dipratinjau.');
 pvClose();pvUrl=URL.createObjectURL(b);const nm=esc(f.docs[k]),dx=k==0&&/\.docx$/i.test(f.docs[0]||'');
 const m=document.createElement('div');m.id='pvm';m.className='pvm';
 m.innerHTML=`<div class="pvb" role="dialog" aria-modal="true" aria-label="Pratinjau dokumen"><div class="pvh"><div><b>${DOCN[k]}</b><small class="mt">${esc(no)} · ${nm}</small></div><div class="pva"><a class="btn o sm" href="${pvUrl}" download="${nm}">Unduh</a>${dx?'':'<a class="btn o sm" href="'+pvUrl+'" target="_blank" rel="noopener">Tab baru</a>'}<button type="button" class="btn sm" data-pv="x">Tutup</button></div></div><div class="pvt">${DOCN.map((n,i)=>`<button type="button" class="${i==k?'on':''}" data-pv="${i}"${(f.files||[])[i]?'':' disabled'}>${i+1}. ${n}</button>`).join('')}</div>${dx?`<div class="pvf srt-wrap">${suratHtml(f,ttdSah(no,f))} </div>`:`<iframe class="pvf" src="${pvUrl}" title="Pratinjau ${esc(DOCN[k])}"></iframe>`}</div>`;
 m.onclick=e=>{if(e.target===m)return pvClose();const t=e.target.closest('[data-pv]');if(!t||t.disabled)return;t.dataset.pv=='x'?pvClose():pvOpen(no,+t.dataset.pv)};
 document.body.appendChild(m)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-pvo]');if(b)pvOpen(b.dataset.no,+b.dataset.pvo)});
document.addEventListener('keydown',e=>{if(e.key=='Escape')pvClose()});
/* Pratinjau Surat Permohonan Otomatis dari input (pengguna barang) */
async function pvGen(){const f=collect();if(!suratSiap(f))return toast('Isi nomor dan tanggal surat dulu.');
 let b;const tt=ttdSah(editNo||f.no,f);try{b=await suratPermohonanDocx(f,tt)}catch(er){return toast('Gagal membuat Surat Permohonan: '+er.message)}
 pvClose();pvUrl=URL.createObjectURL(b);const nm='Surat Permohonan - '+f.no.replace(/[\\/:*?"<>|]+/g,'-')+'.docx';
 const m=document.createElement('div');m.id='pvm';m.className='pvm';
 m.innerHTML=`<div class="pvb" role="dialog" aria-modal="true" aria-label="Pratinjau surat permohonan"><div class="pvh"><div><b>Surat Permohonan (otomatis)</b><small class="mt">${esc(f.no)} · ${esc(f.pd)}</small></div><div class="pva"><a class="btn o sm" href="${pvUrl}" download="${esc(nm)}">Unduh Word</a><button type="button" class="btn sm" data-pv="x">Tutup</button></div></div><div class="pvf srt-wrap">${suratHtml(f,tt)}</div><div class="pvn mt"></div></div>`;
 m.onclick=e=>{if(e.target===m||e.target.closest('[data-pv=x]'))pvClose()};document.body.appendChild(m)}
$('#gp').onclick=pvGen;
/* Template Contoh (Surat Kajian / Surat Pernyataan): hanya dilihat formatnya dan diunduh; tidak dibuat otomatis. */
const TPL={kajian:{t:'Surat Kajian / BA Penelitian',f:'Surat_Kajian_Penelitian',nm:'Template Surat Kajian Penelitian.docx'},pernyataan:{t:'Surat Pernyataan',f:'Surat_Pernyataan',nm:'Template Surat Pernyataan.docx'}};
function tplOpen(k){const t=TPL[k];if(!t)return;pvClose();
 const m=document.createElement('div');m.id='pvm';m.className='pvm';
 m.innerHTML=`<div class="pvb" role="dialog" aria-modal="true" aria-label="Contoh format ${esc(t.t)}"><div class="pvh"><div><b>Contoh Format: ${esc(t.t)}</b><small class="mt">Template untuk diunduh, diisi, lalu diunggah kembali sebagai PDF</small></div><div class="pva"><a class="btn sm" href="assets/template/${t.f}.docx" download="${esc(t.nm)}">Unduh Template (.docx)</a><a class="btn o sm" href="assets/template/${t.f}.pdf" target="_blank" rel="noopener">Tab baru</a><button type="button" class="btn o sm" data-pv="x">Tutup</button></div></div><iframe class="pvf" src="assets/template/${t.f}.pdf" title="Contoh format ${esc(t.t)}"></iframe><div class="pvn mt">Isi data sesuai permohonan Anda mengikuti format berikut.</div></div>`;
 m.onclick=e=>{if(e.target===m||e.target.closest('[data-pv=x]'))pvClose()};document.body.appendChild(m)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tpl]');if(b){e.preventDefault();tplOpen(b.dataset.tpl)}});
/* js Admin */
function pgAdm(){if(!can('verifikasi'))return;const s=$('#adm'),r=R.map((d,i)=>[d,i]).filter(([d])=>d[6]=='Menunggu Verifikasi');
 if(admCur!=null&&R[admCur]){const d=R[admCur],x0=RX[d[0]]||{},ro=d[6]!='Menunggu Verifikasi',ada=!!x0.f,f=x0.f||{docs:[],kib:[]},ks=(f.kib||[]).map(i=>K[i]);admRO=ro;
  /* hasil verifikasi (mode lihat): diambil dari riwayat, atau disimpulkan dari status untuk data contoh */
  const hv=[...(x0.h||[])].reverse().find(h=>/^(Diterima Admin|Ditolak oleh Admin)/.test(h.a)),tolak=d[6]=='Ditolak',
   hasil=ro?`<dl><dt>Keputusan</dt><dd>${PL(tolak?'s-r':'s-g',tolak?'Ditolak':'Diterima')}</dd><dt>Tanggal Verifikasi</dt><dd>${hv?hv.t:'-'}</dd><dt>Status Saat Ini</dt><dd>${st(d[6])}</dd><dt>Catatan untuk Pemohon</dt><dd>${esc((tolak?x0.cat:hv&&hv.n)||'-')}</dd></dl>`:'';
  s.innerHTML=HD(ro?'Hasil Verifikasi':'Verifikasi Permohonan',d[0]+' · '+d[1],`<button class="btn o" data-a="bk">← Kembali</button>`)+sec('Ringkasan Permohonan',ro?'Permohonan ini sudah diverifikasi. Tampilan hanya untuk dilihat.':'',st(d[6]))+`<dl><dt>Jenis</dt><dd>${d[4]}</dd><dt>Tanggal Surat</dt><dd>${d[5]}</dd><dt>Perangkat Daerah</dt><dd>${d[1]}</dd><dt>Perihal</dt><dd>${esc(d[10])}</dd></dl></div>`+
  sec('Verifikasi Dokumen',ro?'Hasil validasi tiap dokumen oleh Admin.':'',ada?`<span class="stt s-b" id="chkc">${chkSum(d[0])}</span>`:'')+(ada?`<div class="drs">${docRows(d[0],ro?'ro':true)}</div>`:EM('Data dokumen tidak tersedia','Permohonan contoh ini tidak menyimpan berkas.'))+'</div>'+
  sec('Verifikasi Daftar Barang / KIB',ro?'Hasil pemeriksaan tiap barang oleh Admin.':'',ks.length?`<span class="stt s-b">${ks.length} Barang</span>`:'')+(ks.length?kvTable(d[0],ro?'ro':true):ro?EM('Data barang tidak tersedia','Permohonan contoh ini tidak menyimpan rincian barang.'):EM('Belum ada barang','Pemohon belum memilih barang KIB.'))+'</div>'+
  (ro?sec('Keputusan Admin','Hasil verifikasi permohonan ini.')+hasil+'</div>':sec('Keputusan Akhir Admin','')+`<div class="ff">${FL('a_k','Keputusan','Terima','text',0,['Terima','Tolak'])}${FL('a_c','Catatan untuk Pemohon','','area',1)}</div></div><div style="text-align:right;margin-bottom:20px"><button class="btn" data-a="sv">Simpan Keputusan</button></div>`);
  s.onchange=e=>{const kv=e.target.closest('[data-kv]');if(kv){if(ro||!can('verifikasi'))return;const x=RX[d[0]]=RX[d[0]]||{h:[]};(x.kv=x.kv||{})[kv.dataset.kv]=kv.value;kv.className='dsel '+kv.value;const sm=$('#kvs');if(sm)sm.innerHTML=kvSumHtml(d[0]);if(kv.value=='no'){const ta=s.querySelector(`[data-kn="${kv.dataset.kv}"]`);ta&&ta.focus()}return}const c=e.target.closest('[data-chk]');if(!c||ro||!can('verifikasi'))return;const x=RX[d[0]]=RX[d[0]]||{h:[]};x.chk=x.chk||[];const i=+c.dataset.chk;x.chk[i]=c.value;c.className='dsel '+c.value;$('#chkc').textContent=chkSum(d[0]);const w=s.querySelector(`[data-cnw="${i}"]`);if(w){w.hidden=c.value!='no';if(c.value=='no'){const ta=w.querySelector('textarea');ta&&ta.focus()}else{(x.cn=x.cn||[])[i]='';const ta=w.querySelector('textarea');if(ta)ta.value=''}}};
  s.oninput=e=>{const kn=e.target.closest('[data-kn]');if(kn){if(ro||!can('verifikasi'))return;const x=RX[d[0]]=RX[d[0]]||{h:[]};(x.kn=x.kn||{})[kn.dataset.kn]=kn.value;kn.classList.remove('bad');return}const t=e.target.closest('[data-cn]');if(!t||ro||!can('verifikasi'))return;const x=RX[d[0]]=RX[d[0]]||{h:[]};(x.cn=x.cn||[])[+t.dataset.cn]=t.value;t.classList.remove('bad')};
  s.onclick=e=>{const a=(e.target.closest('[data-a]')||{dataset:{}}).dataset.a;if(a=='bk'){admCur=null;return pgAdm()}if(a!='sv'||ro)return;if(!can('verifikasi'))return deny();const k=val('a_k');let c=val('a_c').trim();
   const dn=(f.docs||[]),ti=[0,1,2,3].filter(i=>dn[i]&&cv(((RX[d[0]]||{}).chk||[])[i])=='no'),tl=ti.map(i=>DOCN[i]),cn=(RX[d[0]]||{}).cn||[],kosong=ti.filter(i=>!String(cn[i]||'').trim());
   if(k=='Tolak'&&kosong.length){const ta=s.querySelector(`[data-cn="${kosong[0]}"]`);if(ta){ta.classList.add('bad');ta.focus()}return toast('Isi keterangan untuk dokumen yang ditolak: '+kosong.map(i=>DOCN[i]).join(', ')+'.')}
   const kr=kbRej(d[0]),tb=kr.map(q=>K[q][2]),kko=kr.filter(q=>!kvN(d[0],q).trim()),kbl=kvIdx(d[0]).filter(q=>!kvV(d[0],q));
   if(k=='Tolak'&&kko.length){const ta=s.querySelector(`[data-kn="${kko[0]}"]`);if(ta){ta.classList.add('bad');ta.focus()}return toast('Isi keterangan untuk barang yang ditolak: '+kko.map(q=>K[q][2]).join(', ')+'.')}
   if(k=='Tolak'&&!c&&(tl.length||tb.length))c=[tl.length?'Dokumen ditolak: '+tl.join(', ')+'.':'',tb.length?'Barang KIB ditolak: '+tb.join(', ')+'.':''].filter(Boolean).join(' ')+' Lihat keterangan pada tiap item.';
   if(k=='Tolak'&&!c)return toast('Isi alasan penolakan untuk pemohon.');
   if(k=='Terima'&&!dn.every(Boolean))return toast('Ada dokumen yang belum diunggah pemohon. Permohonan belum dapat diterima.');
   if(k=='Terima'&&tl.length)return toast('Ada dokumen yang ditolak ('+tl.join(', ')+'). Ubah validasinya atau pilih Tolak.');
   if(k=='Terima'&&chkN(d[0])<4)return toast('Validasi keempat dokumen terlebih dahulu (pilih Sesuai) sebelum menerima.');
   if(k=='Terima'&&kr.length)return toast('Ada barang KIB yang ditolak ('+tb.join(', ')+'). Ubah hasilnya atau pilih Tolak.');
   if(k=='Terima'&&kbl.length)return toast('Periksa semua barang KIB terlebih dahulu (pilih Sesuai) sebelum menerima.');
   const x=RX[d[0]]=RX[d[0]]||{h:[]};if(k=='Terima'){d[6]='Dalam Proses';x.cat='';hs(d[0],'Diterima Admin, lanjut ke Survei Lapangan',c)}else{d[6]='Ditolak';x.cat=c;x.rj=[0,1,2,3].map(i=>sigDoc(f,i));hs(d[0],'Ditolak oleh Admin',c+(ti.length?' · '+ti.map(i=>DOCN[i]+': '+String(cn[i]).trim()).join(' · '):'')+(kr.length?' · Barang: '+kr.map(q=>K[q][2]+': '+kvN(d[0],q).trim()).join(' · '):''))}
   toast(k=='Terima'?'Permohonan diterima dan masuk ke Survei Lapangan.':'Permohonan ditolak.');admCur=null;fl();pgAdm()};return}
 admRO=false;
 /* Permohonan yang sudah diputuskan Admin: Diterima (Dalam Proses / Disetujui) atau Ditolak */
 const vr=R.map((d,i)=>[d,i]).filter(([d])=>['Dalam Proses','Disetujui','Ditolak'].includes(d[6])),PS=5,np=Math.max(1,Math.ceil(vr.length/PS));admPgV=Math.min(Math.max(1,admPgV),np);
 const vp=vr.slice((admPgV-1)*PS,admPgV*PS);
 s.innerHTML=HD('Verifikasi Permohonan','')+ALR('Alur:','Permohonan diajukan pemohon &rarr; Admin memeriksa kelengkapan &rarr; terima (lanjut Survei Lapangan), minta revisi, atau tolak.')+sec('Permohonan Menunggu Verifikasi','menunggu Verifikasi',`<span class="stt s-b">${r.length} Permohonan</span>`)+(r.length?`<div class="tw"><table><thead><tr><th>No</th><th>Nomor Surat</th><th>Tanggal</th><th>Jenis</th><th>Pemohon</th><th>Dokumen</th><th>Aksi</th></tr></thead><tbody>${r.map(([d,i],k)=>`<tr><td>${k+1}</td><td>${d[0]}</td><td>${d[5]}</td><td>${d[4]}</td><td>${d[1]}</td><td>${d[11]}</td><td><button class="btn sm" data-ad="${i}">Periksa</button></td></tr>`).join('')}</tbody></table></div>`:EM('Tidak ada permohonan menunggu','Permohonan yang diajukan pemohon akan muncul di sini.'))+'</div>'+
 sec('Permohonan Telah Diverifikasi','Permohonan yang sudah diterima.',`<span class="stt s-g">${vr.length} Permohonan</span>`)+(vr.length?`<div class="tw"><table><thead><tr><th>No</th><th>Nomor Surat</th><th>Tanggal</th><th>Jenis</th><th>Pemohon</th><th>Dokumen</th><th>Hasil Verifikasi</th><th>Status Saat Ini</th><th>Aksi</th></tr></thead><tbody>${vp.map(([d,i],k)=>`<tr><td>${(admPgV-1)*PS+k+1}</td><td>${d[0]}</td><td>${d[5]}</td><td>${d[4]}</td><td>${d[1]}</td><td>${d[11]}</td><td>${PL(d[6]=='Ditolak'?'s-r':'s-g',d[6]=='Ditolak'?'Ditolak':'Diterima')}</td><td>${st(d[6])}</td><td><button class="btn o sm" data-ad="${i}">Lihat</button></td></tr>`).join('')}</tbody></table></div><div class="pgn"><span>Menampilkan ${(admPgV-1)*PS+1}-${Math.min(admPgV*PS,vr.length)} dari ${vr.length} data</span><div>`+`<button data-ap="${Math.max(1,admPgV-1)}">&lsaquo;</button>`+Array.from({length:np},(_,k)=>`<button data-ap="${k+1}" class="${k+1==admPgV?'on':''}">${k+1}</button>`).join('')+`<button data-ap="${Math.min(np,admPgV+1)}">&rsaquo;</button></div></div>`:EM('Belum ada permohonan yang diverifikasi','Permohonan yang sudah diputuskan Admin akan muncul di sini.'))+'</div>';
 s.onchange=null;s.oninput=null;s.onclick=e=>{const p=e.target.closest('[data-ap]');if(p){admPgV=+p.dataset.ap;return pgAdm()}const b=e.target.closest('[data-ad]');if(b){admCur=+b.dataset.ad;pgAdm()}}}
PG.adm=pgAdm;
function dash(){const v=R.map((d,i)=>[d,i]).filter(([d])=>own(d)),c=x=>v.filter(([d])=>d[6]==x).length;
 $('#dsw').textContent=c('Menunggu Verifikasi');$('#dsp').textContent=c('Dalam Proses');$('#dss').textContent=c('Disetujui');
 $('#t1').innerHTML=v.slice(0,5).map(([d,i])=>`<tr><td class="dp" style="font-weight:700">${d[0]}</td><td>${d[1]}</td><td>${d[2]}</td><td>${d[4]}</td><td>${d[5]}</td><td>${st(d[6])}</td><td><button class="db" data-r="${i}">Detail</button></td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--mt);padding:26px">Belum ada permohonan.</td></tr>'}
 const _f2=fl;fl=function(){_f2();const n=R.filter(d=>d[6]=='Menunggu Verifikasi').length;$('#admc').textContent=n;const bb=$('#bellBtn b');bb.textContent=n;bb.style.display=n?'':'none';dash()};
/* Penjaga akses: dipasang paling luar, semua jalur pindah halaman lewat sini. */
const _s4=show;show=function(v,b){if(!CUR)return;if(v!='det')detCur=null;if(v=='list'&&!canView('list')){v='dash';b=null}if(!canView(v)){toast('Anda tidak memiliki akses ke halaman tersebut.');v='dash';b=null}_s4(v,b)};
/*  Logic biar bisa double tab tanpa harus logout */
const viewNow=()=>{const v=$('.vw.on');return v?v.id:''};
function terapkanRemote(o){
 const lama=new Map(R.map(d=>[d[0],d[6]])),
  admNo=admCur!=null&&R[admCur]?R[admCur][0]:null,admRef=admNo!=null?R[admCur]:null,
  keputusan=admNo!=null&&$('#a_k')?{k:$('#a_k').value,c:$('#a_c').value}:null,
  detRow=detCur?R.find(d=>d[0]==detCur.no):null,detRX=detCur?RX[detCur.no]:null;
 Store.apply(o);
 if(!CUR)return;
 const m=$('#mdl');if(m&&m.classList.contains('on'))m.classList.remove('on');rmClose();   /* dialog lama memegang data lama */
 admCur=admNo==null?null:R.findIndex(d=>d[0]==admNo);if(admCur<0)admCur=null;
 fl();
 const v=viewNow();
 if(v=='det'&&detCur){const i=R.findIndex(d=>d[0]==detCur.no);
  if(i<0||!own(R[i])){toast('Permohonan ini sudah tidak tersedia.');show('list')}
  else if(R[i]!==detRow||RX[detCur.no]!==detRX)detail(i,R,detCur.tab)}
 else if(v=='adm'){
  if(admNo!=null){const d=admCur!=null?R[admCur]:null;
   if(!d||(!admRO&&d[6]!='Menunggu Verifikasi')){admCur=null;toast('Permohonan yang sedang diperiksa sudah berubah statusnya.');pgAdm()}
   else if(d!==admRef){pgAdm();if(keputusan){$('#a_k').value=keputusan.k;$('#a_c').value=keputusan.c}}}
  else pgAdm()}
 else if(v=='sv'){if(svCur==null)pgSv();else svRefresh()}
 else if(v=='pt'&&penCur==null)pgPt();
 else if(v=='psj'&&psjCur==null)pgPsj();
 else if(v=='pmp')pgPerpen();
 else if(v=='tksadm')pgTksAdmin();
 else if(v=='ob')pgOb();
 else if(v=='kk')pgKk();
 else if(v=='lpr')pgLp();
 else if(v=='form'){try{ttdRender();sum()}catch(er){}}
 const b=R.find(d=>own(d)&&lama.get(d[0])!==d[6]);
 if(b)toast(isAdmin()?(!lama.has(b[0])||lama.get(b[0])=='Draft'?'Permohonan baru masuk: '+b[0]+' ('+b[1]+')':'Status '+b[0]+' berubah: '+b[6]):'Status '+b[0]+' kini: '+b[6])}
Store.onRemote(terapkanRemote,()=>location.reload());
/* Start: muat data bersama (atau simpan data awal bila belum ada). lalu pilihkan sesi tab ini */
Store.init({R,RX,SVS,PEN},a=>samplePdf(a[0],a[1])).then(()=>{
 Store.watch();
 const tq=location.search.match(/[?&]ttd=([\w-]+)/);if(tq){ttdPage(tq[1]);return}
 if(CUR)fl();else{const a=loadSession();if(a)masuk(a);else $('#lu').value=lastEmail()}});
document.addEventListener('keydown',e=>{if(e.key=='Escape'){const o=$('#mdl');if(o)o.classList.remove('on')}});
