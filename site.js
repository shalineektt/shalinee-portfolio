(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal sections as they scroll into view
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  // Journeys: slow, smooth step-through; paused off-screen; static when reduced motion
  [].slice.call(document.querySelectorAll('[data-journey]')).forEach(function (root) {
    var nodes = [].slice.call(root.querySelectorAll('.jn-node'));
    var cats = [].slice.call(root.querySelectorAll('[data-lit-at]'));
    var route = root.querySelector('.jn-route');
    var n = nodes.length, active = 0, timer = null;
    function paint(a) {
      nodes.forEach(function (el, i) { el.classList.toggle('is-reached', i <= a); el.classList.toggle('is-active', i === a); });
      cats.forEach(function (el) { el.classList.toggle('is-lit', Number(el.getAttribute('data-lit-at')) === a); });
      route.style.setProperty('--p', a / (n - 1));
    }
    paint(reduce ? n - 1 : 0);
    if (reduce) return;
    function start() { if (!timer) timer = setInterval(function () { active = (active + 1) % n; paint(active); }, 5200); }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.25 }).observe(root);
    } else { start(); }
  });

  // Tabs
  [].slice.call(document.querySelectorAll('[data-tabs]')).forEach(function (wrap) {
    var tabs = [].slice.call(wrap.querySelectorAll('[role=tab]'));
    var panels = [].slice.call(wrap.querySelectorAll('[role=tabpanel]'));
    function select(i, focus) {
      tabs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach(function (p, k) { p.hidden = k !== i; if (k === i) { p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); } });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    select(0);
  });


  // ---------- motion layer (kept subtle: 12-16px reveals, 2-4px magnets, 8-12px depth) ----------
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  // Scroll-progress rail: 01 THINK, 02 BUILD, 03 LAUNCH, 04 SCALE
  (function () {
    var names = ['THINK', 'BUILD', 'LAUNCH', 'SCALE'];
    var rail = document.createElement('div');
    rail.className = 'rail'; rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<div class="rail-line"></div><div class="rail-fill"></div><div class="rail-dot"></div>' +
      names.map(function (n, i) { return '<div class="rail-stage" style="top:' + (i * 33.333) + '%"><b>0' + (i + 1) + '</b><span>' + n + '</span></div>'; }).join('');
    document.body.appendChild(rail);
    var stages = [].slice.call(rail.querySelectorAll('.rail-stage')), ticking = false;
    function update() {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      rail.style.setProperty('--rp', p.toFixed(4));
      var st = Math.min(3, Math.floor(p * 4));
      stages.forEach(function (el, i) { el.classList.toggle('is-on', i === st); });
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('hashchange', function () { setTimeout(update, 60); });
    update();
  })();

  // Numbers resolve when they enter the viewport (about 650 ms)
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  var numRe = /^([\u2212-]?)([\d,]+(?:\.\d+)?)([KM]?)([+%]?)$/;
  function parseCount(el) {
    var m = (el.getAttribute('data-count') || '').match(numRe);
    return m ? { sign: m[1], num: parseFloat(m[2].replace(/,/g, '')), unit: m[3], suf: m[4], commas: m[2].indexOf(',') > -1, text: el.getAttribute('data-count') } : null;
  }
  function fmt(n, commas) { var s = String(Math.round(n)); return commas ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s; }
  function runCount(el) {
    var c = el._c; if (!c || el._done) return; el._done = true;
    el.textContent = c.text;
    var w = el.getBoundingClientRect().width; if (w) el.style.minWidth = w + 'px';
    var t0 = performance.now(), dur = 650;
    (function frame(now) {
      var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      el.textContent = t < 1 ? c.sign + fmt(c.num * e, c.commas) + c.unit + c.suf : c.text;
      if (t < 1) requestAnimationFrame(frame);
    })(t0);
  }
  counters.forEach(function (el) {
    var c = parseCount(el); if (!c) return; el._c = c;
    if (!reduce) el.textContent = c.sign + '0' + c.unit + c.suf;
  });
  if (!reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.closest('.layers') && !e.target.closest('.card-in')) return;   // wait for the card's layers
        cio.unobserve(e.target); runCount(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { if (el._c) cio.observe(el); });
  } else { counters.forEach(function (el) { if (el._c) { el.textContent = el._c.text; } }); }

  // Product cards reveal their layers one after another
  [].slice.call(document.querySelectorAll('.lift')).forEach(function (card) {
    if (reduce || !('IntersectionObserver' in window)) { card.classList.add('card-in'); return; }
    var io2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      card.classList.add('card-in'); io2.disconnect();
      setTimeout(function () { [].slice.call(card.querySelectorAll('[data-count]')).forEach(runCount); }, 380);
    }, { threshold: 0.35 });
    io2.observe(card);
  });

  // Depth: screenshots drift 8-12px slower than the page
  var depthImgs = [].slice.call(document.querySelectorAll('.depth img'));
  function parallax() {
    depthImgs.forEach(function (im) {
      var r = im.parentNode.getBoundingClientRect();
      if (!r.height || r.bottom < -60 || r.top > window.innerHeight + 60) return;
      var t = ((r.top + r.height / 2) - window.innerHeight / 2) / window.innerHeight;
      var max = Math.min(12, r.height * 0.025);
      var y = Math.max(-max, Math.min(max, -t * 14));
      im.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) scale(1.05)';
    });
  }
  if (!reduce && depthImgs.length) {
    var pt = false;
    window.addEventListener('scroll', function () { if (!pt) { pt = true; requestAnimationFrame(function () { pt = false; parallax(); }); } }, { passive: true });
    window.addEventListener('resize', parallax); window.addEventListener('hashchange', function () { setTimeout(parallax, 80); });
    depthImgs.forEach(function (im) { if (!im.complete) im.addEventListener('load', parallax); });
    parallax();
  }

  // Product decision points light up as you read through them (the one nearest the middle of the screen)
  var dps = [].slice.call(document.querySelectorAll('.decision-point'));
  if (dps.length) {
    if (reduce) { dps.forEach(function (d) { d.classList.add('is-active'); }); }
    else {
      var dq = false;
      var pick = function () {
        dq = false;
        var mid = window.innerHeight * 0.5, best = null, bd = 1e9;
        dps.forEach(function (d) {
          var r = d.getBoundingClientRect(); if (!r.height) return;
          var dist = Math.abs((r.top + r.bottom) / 2 - mid);
          if (r.top < mid + 140 && r.bottom > mid - 140 && dist < bd) { bd = dist; best = d; }
        });
        if (best) dps.forEach(function (d) { d.classList.toggle('is-active', d === best); });
      };
      window.addEventListener('scroll', function () { if (!dq) { dq = true; requestAnimationFrame(pick); } }, { passive: true });
      window.addEventListener('resize', pick); window.addEventListener('hashchange', function () { setTimeout(pick, 80); });
      pick();
    }
  }

  // Magnetic CTAs: 2-4px toward the cursor, nothing more
  if (!reduce && fine) {
    var mags = [].slice.call(document.querySelectorAll('.mag'));
    document.addEventListener('pointermove', function (e) {
      mags.forEach(function (b) {
        var r = b.getBoundingClientRect(); if (!r.width) return;
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var reach = Math.max(r.width, r.height) / 2 + 70, d = Math.hypot(dx, dy);
        if (d < reach) {
          var k = Math.min(1, (1 - d / reach) * 2);
          b.style.transform = 'translate(' + (Math.max(-3, Math.min(3, dx * 0.08)) * k).toFixed(2) + 'px,' + (Math.max(-3, Math.min(3, dy * 0.12)) * k).toFixed(2) + 'px)';
        } else if (b.style.transform) { b.style.transform = ''; }
      });
    }, { passive: true });
    document.addEventListener('pointerleave', function () { mags.forEach(function (b) { b.style.transform = ''; }); });
  }

  // Page transition: a short fade out before moving to another page of the site
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target === '_blank') return;
    var h = a.getAttribute('href');
    if (!reduce && /^[\w\-]+\.html(#.*)?$/.test(h)) {
      e.preventDefault(); document.documentElement.classList.add('leaving');
      setTimeout(function () { location.href = h; }, 300);
    }
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) document.documentElement.classList.remove('leaving'); });

  // Contact form -> /api/contact -> email
  var form = document.getElementById('contact-form');
  if (form) {
    var button = form.querySelector('button[type=submit]');
    var status = document.getElementById('contact-status');
    var idle = button.textContent;
    function show(msg, ok) { status.textContent = msg; status.setAttribute('data-state', ok ? 'success' : 'error'); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), message: form.elements.message.value.trim(), website: form.elements.website.value };
      if (data.name.length < 2 || data.phone.replace(/\D/g, '').length < 7 || data.message.length < 10) {
        return show('Please add your name, phone number and a short message.', false);
      }
      button.disabled = true; button.textContent = 'Sending…'; status.textContent = ''; status.removeAttribute('data-state');
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) { form.reset(); show('Thank you. Your message is on its way, and I will get back to you soon.', true); }
          else { show((res.j && res.j.error) || 'Something went wrong. Please try again.', false); }
        })
        .catch(function () { show('Network problem. Please try again.', false); })
        .then(function () { button.disabled = false; button.textContent = idle; });
    });
  }
})();
