/* Compare table sorter — progressive enhancement, no dependencies.
 * The table is fully readable and crawlable without this; JS only adds
 * click-to-sort. Served as a file (not inline) to stay CSP-safe. */
(function () {
  var table = document.getElementById('gc-compare');
  if (!table) return;
  var tbody = table.querySelector('tbody');
  var heads = table.querySelectorAll('thead th[data-key]');
  var state = { key: 'name', dir: 1 };

  function cellValue(row, idx, key) {
    var cell = row.children[idx];
    if (!cell) return '';
    if (key === 'name' || key === 'cs') return cell.textContent.trim().toLowerCase();
    var ds = cell.getAttribute('data-sort');
    return ds != null ? parseFloat(ds) : cell.textContent.trim().toLowerCase();
  }

  function sortBy(key, idx) {
    state.dir = state.key === key ? -state.dir : 1;
    state.key = key;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      var va = cellValue(a, idx, key), vb = cellValue(b, idx, key);
      if (va < vb) return -1 * state.dir;
      if (va > vb) return 1 * state.dir;
      return 0;
    });
    rows.forEach(function (r) { tbody.appendChild(r); });
  }

  heads.forEach(function (th, i) {
    th.addEventListener('click', function () { sortBy(th.getAttribute('data-key'), i); });
  });
})();
