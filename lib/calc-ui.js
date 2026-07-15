/* Calculator UI — progressive enhancement over the server-rendered form.
 * Expects GCMath (bundled above this file in calc.js) and a JSON data block
 * with id="gc-state-data" on the page. No frameworks, no dependencies.
 *
 * NOTE ON SEO: everything here renders only AFTER the user submits the form.
 * Googlebot never triggers it, so the crawled page is unchanged. Nothing is
 * gated — the answer the visitor came for is always shown in full first.
 */
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
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function freqLabel(f) {
    return { weekly: 'Weekly', biweekly: 'Bi-weekly (every 2 weeks)', semimonthly: 'Twice a month', monthly: 'Monthly' }[f] || f;
  }
  function card(label, value, sub) {
    return '<div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">' +
      '<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">' + esc(label) + '</p>' +
      '<p class="mt-1 text-2xl font-bold text-slate-900">' + esc(value) + '</p>' +
      '<p class="mt-1 text-xs text-slate-500">' + esc(sub) + '</p></div>';
  }

  // ---- contextual next-step + guide offer, shown only after a real result ----
  // Copy is tailored to what the person just learned. It never blocks the answer.
  function nextStep(r, type) {
    var name = esc(st.name);
    if (type === 'student_loans') {
      return {
        head: 'What you can do about it',
        body: 'This is administrative wage garnishment — no court judgment needed, up to 15% of disposable pay. But getting out of default stops it: nine affordable payments over ten months (rehabilitation), or consolidation into an income-driven plan. There are deadlines, and the notice window is short.',
        offer: 'The free survival guide walks through the exit paths, the forms, and the timing.'
      };
    }
    if (type === 'child_support') {
      return {
        head: 'What you can do about it',
        body: 'Child support garnishment can reach 50–65% of disposable earnings — the highest cap in the system, and it does not require a separate lawsuit. If the amount is based on outdated income, a modification request is usually the real lever, not an objection.',
        offer: 'The free survival guide covers modification, arrears, and what to do when multiple orders hit one paycheck.'
      };
    }
    if (type === 'tax_levy') {
      return {
        head: 'This one is an estimate — here is the real rule',
        body: 'IRS levies do not use a flat percentage. They use Publication 1494 tables based on your filing status and dependents, and they leave you an exempt amount rather than taking a set share. Filing missing returns is usually the required first step before any release or payment plan.',
        offer: 'The free survival guide explains levy releases, hardship status, and the order of operations.'
      };
    }
    if (r.prohibition) {
      return {
        head: 'Your wages are protected — but read this part',
        body: name + ' bars wage garnishment for consumer debts, so a credit card or medical debt creditor cannot touch your paycheck. The catch: once that money lands in a bank account, those protections often stop applying, and a creditor with a judgment can pursue a bank levy instead.',
        offer: 'The free survival guide covers protecting deposited funds, and what still can be garnished here.'
      };
    }
    return {
      head: 'What you can do about it',
      body: money(r.max) + ' is the legal ceiling in ' + name + ' — not a certainty. Garnishments get reduced or stopped every day through hardship claims, exemption filings, and settlements, and the deadline to object is usually short and starts the day you are served.',
      offer: 'The free survival guide walks through each option with the forms, deadlines, and what to say.'
    };
  }

  function offerBlock(r, type) {
    var ns = nextStep(r, type);
    return '' +
      '<div class="mt-6 rounded-xl border border-slate-200 bg-white p-5">' +
        '<h3 class="text-base font-semibold text-slate-900">' + ns.head + '</h3>' +
        '<p class="mt-2 text-sm leading-6 text-slate-700">' + ns.body + '</p>' +
        '<p class="mt-3 text-sm leading-6 text-slate-700">' + ns.offer + '</p>' +
        '<form id="gc-guide-form" class="mt-4 flex flex-col gap-2 sm:flex-row">' +
          '<div style="position:absolute;left:-9999px" aria-hidden="true">' +
            '<input type="text" name="company_website" tabindex="-1" autocomplete="off" />' +
          '</div>' +
          '<label class="sr-only" for="gc-guide-email">Email address</label>' +
          '<input id="gc-guide-email" name="email_address" type="email" required autocomplete="email" placeholder="you@example.com" ' +
            'class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100" />' +
          '<button type="submit" class="shrink-0 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">Get the free guide</button>' +
        '</form>' +
        '<p id="gc-guide-note" class="mt-2 text-xs leading-5 text-slate-500">Free. No spam — unsubscribe anytime. You can also <a class="text-blue-700 hover:underline" href="/guide">read it here</a>.</p>' +
      '</div>';
  }

  function wireGuideForm() {
    var gf = $('gc-guide-form');
    if (!gf) return;
    gf.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('gc-guide-email').value.trim();
      if (!email || email.indexOf('@') === -1) { $('gc-guide-email').focus(); return; }
      var btn = gf.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      var body = new URLSearchParams();
      body.append('email_address', email);
      body.append('company_website', gf.querySelector('[name="company_website"]').value || '');
      fetch('/api/subscribe', { method: 'POST', body: body })
        .then(function () { showGuideSuccess(); })
        .catch(function () { showGuideSuccess(); }); // guide is public either way
    });
  }

  function showGuideSuccess() {
    var gf = $('gc-guide-form');
    var note = $('gc-guide-note');
    if (gf) {
      gf.outerHTML = '<div class="mt-4 rounded-xl bg-teal-50 p-4 ring-1 ring-teal-200">' +
        '<p class="text-sm font-semibold text-teal-900">Check your email — the guide is on its way.</p>' +
        '<p class="mt-1 text-sm text-teal-800">Or open it right now: <a class="font-semibold underline" href="/guide">Wage Garnishment Survival Guide</a></p>' +
      '</div>';
    }
    if (note) note.style.display = 'none';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var gross = parseFloat($('gc-gross').value);
    if (!gross || gross <= 0) { $('gc-gross').focus(); return; }

    var type = typeSel.value;
    var r = GCMath.calculate(st, {
      gross: gross,
      frequency: $('gc-freq').value,
      type: type,
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
      'Your true disposable earnings depend on your tax situation. This is educational information, not legal advice.</p>' +
      offerBlock(r, type);

    result.style.display = '';
    wireGuideForm();
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
