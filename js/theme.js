/* Dark theme, Light theme (tema gelap & terang) */
(function () {
  var KEY = 'sipbmd-theme', root = document.documentElement;

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function systemDark() { return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }

  function apply(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) { try { localStorage.setItem(KEY, theme); } catch (e) {} }
    var label = 'Ganti ke tema ' + (theme === 'dark' ? 'terang' : 'gelap');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', label);
      b.title = label;
    });
  }

  apply(saved() || (systemDark() ? 'dark' : 'light'), false);

  // label diperbarui ketika dokumen sudah siap
  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-theme'), false);
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-theme-toggle]')) {
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    }
  });

  // untuk menyesuaikan tema dari sistem komputer sendiri, sebelum memilih tema
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!saved()) apply(e.matches ? 'dark' : 'light', false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
