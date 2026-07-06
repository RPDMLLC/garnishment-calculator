// Force full page loads for routes not handled by the client-side app.
// The SPA router has no routes for these pages (they are server-rendered),
// so in-app navigation to them must trigger a real page load.
(function () {
  var serverOnly = ['/resources', '/guide', '/disclosure', '/terms', '/legal', '/contact'];
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '/') return;
    var p = href.split('?')[0].split('#')[0];
    for (var i = 0; i < serverOnly.length; i++) {
      if (p === serverOnly[i] || p.indexOf(serverOnly[i] + '/') === 0) {
        e.preventDefault();
        e.stopPropagation();
        window.location.assign(href);
        return;
      }
    }
  }, true);
})();
