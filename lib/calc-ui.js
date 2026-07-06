/* Calculator UI — progressive enhancement over the server-rendered form.
 * Expects GCMath (bundled above this file in calc.js) and a JSON data block
 * with id="gc-state-data" on the page. No frameworks, no dependencies. */
(function () {
  var dataEl = document.getElementById('gc-state-data');
  if (!dataEl) return;
  var st = JSON.parse(dataEl.textContent);

  var $ = function (id) { return document.getElementById(id); };
  var form = $('gc-calc-form');
  var result = $('gc-result');
  if (!form || !result) return;

  // state switcher: navigate to the chosen state's calculator page
  var stateSel = $('gc-state');
  if (stateSel) {
    stateSel.addEventListener('change', function () {
      if (stateSel.value && stateSel.value !== st.slug) {
        window.location.assign('/' + stateSel.value + '-wage-garnishment-calculator');
      }
    });
  }

  // show child-support options only when that type is selected
  var typeSel = $('gc-type');
  var csOpts = $('gc-cs-options');
  function syncTypeOptions() {
    if (csOpts) csOpts.style.display = typeSel.value === 'child_support' ? '' : 'none';
  }
  typeSel.addEventListener('change', syncTypeOptions);
  syncTypeOptions();

  function money(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var gross = parseFloat($('gc-gross').value);
    if (!gross || gross <= 0) { $('gc-gross').focus(); return; }

    var r = GCMath.calculate(st, {
      gross: gross,
      frequency: $('gc-freq').value,
      type: typeSel.value,
      supportsOtherFamily: $('gc-cs-family') ? $('gc-cs-family').checked : true,
      inArrears: $('gc-cs-arrears') ? $('gc-cs-arrears').checked : false
    });

    var headline = r.prohibition ? 'Your Wages Are Protected' : 'Garnishment Estimate';
    var note = r.prohibition
      ? st.name + ' does not allow wage garnishment for consumer debts. Only child support, taxes, and federal student loans can be garnished from your wages.'
      : 'Basis: ' + r.basis + '.';

    result.innerHTML =
      '<h2 class="text-xl font-semibold text-slate-900">' + headline + '</h2>' +
      '<div class="mt-4 grid gap-4 sm:grid-cols-3">' +
        card('Gross income', money(r.gross), freqLabel($('gc-freq').value)) +
        card('Protected amount', money(r.protectedAmount), 'Cannot be garnished') +
        card('Max garnishment', money(r.max), r.pctOfDisposable.toFixed(1) + '% of disposable') +
      '</div>' +
      '<p class="mt-4 text-sm leading-6 text-slate-700">' + esc(note) + '</p>' +
      '<p class="mt-3 text-xs leading-5 text-slate-500">Estimate assumes roughly 25% of gross pay goes to legally required deductions. ' +
      'Your true disposable earnings depend on your tax situation. This is educational information, not legal advice.</p>';
    result.style.display = '';
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function card(label, value, sub) {
    return '<div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">' +
      '<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">' + esc(label) + '</p>' +
      '<p class="mt-1 text-2xl font-bold text-slate-900">' + esc(value) + '</p>' +
      '<p class="mt-1 text-xs text-slate-500">' + esc(sub) + '</p></div>';
  }
  function freqLabel(f) {
    return { weekly: 'Weekly', biweekly: 'Bi-weekly (every 2 weeks)', semimonthly: 'Twice a month', monthly: 'Monthly' }[f] || f;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
