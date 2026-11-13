const CEK_PASSWORD = false;

const TAMPIL_AKUN_DEMO = true;


const ROLES = {
  pengguna_barang: {
    label: 'Pengguna Barang',
    views: ['dash', 'list', 'form', 'det','pmp'],
    perms: ['permohonan.kelola'],           
    listDesc: 'Buat Permohonan',
    listSub: 'Permohonan yang sudah disimpan tampil di sini. Gunakan Edit untuk memperbaiki dan Ajukan Verifikasi untuk mengirim ke Admin.',
    listEmpty: 'Klik tombol "Buat Permohonan" untuk memulai.'
  },
  admin: {
    label: 'Admin',
    views: ['dash', 'det', 'adm', 'sv', 'pt', 'psj', 'tksadm', 'soon', 'ob', 'kk', 'lpr', 'hp', 'rf','dm'],  
    perms: ['verifikasi'],
    listDesc: 'Pantau seluruh permohonan yang diajukan Pengguna Barang. Draft milik pemohon tidak ditampilkan.',
    listSub: 'Daftar permohonan yang sudah diajukan.',
    listEmpty: 'Belum ada permohonan yang diajukan oleh Pengguna Barang.'
  }
};

const ACCOUNTS = [
  { email: 'penggunabarang.dinkes@gmail.com', pw: 'pengguna123', role: 'pengguna_barang', name: 'Pengguna Barang Dinkes', ini: 'PB', opd: 'Dinas Kesehatan', tag: 'Pengguna Barang: Dinkes' },
  { email: 'penggunabarang.pupr@gmail.com',   pw: 'pengguna123', role: 'pengguna_barang', name: 'Pengguna Barang PUPR',  ini: 'PB', opd: 'Dinas PUPR',      tag: 'Pengguna Barang: PUPR' },
  { email: 'penggunabarang.dinsos@gmail.com', pw: 'pengguna123', role: 'pengguna_barang', name: 'Pengguna Barang Dinsos', ini: 'PB', opd: 'Dinas Sosial',   tag: 'Pengguna Barang: Dinsos' },
  { email: 'admin@gmail.com',                 pw: 'admin123',    role: 'admin',           name: 'Admin BKAD',            ini: 'AD', unit: 'Badan Keuangan dan Aset Daerah', tag: 'Admin' }
];


let CUR = null;

function authenticate(email, pw) {
  const e = String(email || '').trim().toLowerCase();
  const a = ACCOUNTS.find(x => x.email === e);
  if (!a || (CEK_PASSWORD && a.pw !== pw)) {
    return { error: 'Email atau kata sandi tidak sesuai, atau akun tidak terdaftar.' };
  }
  return { account: a };
}

/*  */
const SESSION_KEY = 'sipbmd-session', MAIL_KEY = 'sipbmd-lastmail';

function saveSession(a, remember) {
  try {
    sessionStorage.setItem(SESSION_KEY, a.email);
    if (remember) localStorage.setItem(MAIL_KEY, a.email); else localStorage.removeItem(MAIL_KEY);
  } catch (e) {}
}
function loadSession() {
  try {
    localStorage.removeItem(SESSION_KEY);   // sisa versi lama: sesi bersama antar tab
    const e = sessionStorage.getItem(SESSION_KEY);
    return ACCOUNTS.find(x => x.email === e) || null;
  } catch (e) { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}
function lastEmail() {
  try { return localStorage.getItem(MAIL_KEY) || ''; } catch (e) { return ''; }
}

const canView = v => !!CUR && ROLES[CUR.role].views.includes(v);
const can     = p => !!CUR && ROLES[CUR.role].perms.includes(p);
const isAdmin = () => !!CUR && CUR.role === 'admin';

const own = d => !!CUR && !!d && (isAdmin() ? d[6] != 'Draft' : d[1] === CUR.opd);
const bolehTulis = d => can('permohonan.kelola') && !!d && d[1] === CUR.opd;