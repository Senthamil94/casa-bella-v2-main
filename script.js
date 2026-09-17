(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Preloader */
  window.addEventListener('load', function(){ setTimeout(function(){ document.getElementById('loader').classList.add('done'); }, reduce?100:1300); });
  setTimeout(function(){ document.getElementById('loader').classList.add('done'); }, 4500);

  /* Chrome bg on scroll */
  var chrome = document.getElementById('chrome');
  window.addEventListener('scroll', function(){ chrome.classList.toggle('solid', window.scrollY > 30); }, {passive:true});

  /* Menu overlay */
  var menuBtn = document.getElementById('menuBtn'),
      menu = document.getElementById('menu'),
      menuBack = document.getElementById('menuBack');
  function setMenu(open){
    menuBtn.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    menuBack.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
  document.querySelectorAll('[data-close]').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });

  /* Overture slideshow */
  var slides = document.querySelectorAll('.overture .slide'),
      dotsWrap = document.getElementById('ovDots'),
      cur = 0, ovTimer;
  slides.forEach(function(_, i){
    var b = document.createElement('button');
    b.setAttribute('aria-label','Slide ' + (i+1));
    if(i===0) b.classList.add('on');
    b.addEventListener('click', function(){ goSlide(i); restart(); });
    dotsWrap.appendChild(b);
  });
  var dots = dotsWrap.querySelectorAll('button');
  function goSlide(i){
    cur = i;
    slides.forEach(function(s,j){ s.classList.toggle('on', j===i); });
    dots.forEach(function(d,j){ d.classList.toggle('on', j===i); });
  }
  function restart(){
    clearInterval(ovTimer);
    if(!reduce) ovTimer = setInterval(function(){ goSlide((cur+1)%slides.length); }, 6000);
  }
  restart();

  /* Chapter reveal + parallax */
  var chapters = document.querySelectorAll('.chapter');
  var touchMode = false;
  function isTouchUI(){
    return window.matchMedia('(hover: none)').matches
      || window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(any-pointer: coarse)').matches
      || window.matchMedia('(max-width: 1024px)').matches;
  }
  function viewportH(){
    return (window.visualViewport && window.visualViewport.height) || window.innerHeight || 1;
  }
  function enableTouchMode(){
    if(touchMode) return;
    touchMode = true;
    document.documentElement.classList.add('touch-ui');
  }
  function setActiveChapter(target){
    chapters.forEach(function(c){
      var on = c === target;
      c.classList.toggle('tapped', on);
      c.classList.toggle('in-view', on);
      if(on){
        c.classList.add('seen', 'revealed');
      } else if(touchMode){
        c.classList.remove('revealed');
      }
    });
  }
  function chapterFromPoint(x, y){
    var els = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
    for(var i = 0; i < els.length; i++){
      var el = els[i];
      if(!el) continue;
      if(el.closest && el.closest('#chrome, #menu, #menuBack, .ovl, #lightbox, #bookBadge, #loader')) continue;
      var ch = el.closest && el.closest('.chapter');
      if(ch) return ch;
    }
    return null;
  }
  function updateActiveChapter(){
    if(!touchMode && !isTouchUI()) return;
    enableTouchMode();
    var vh = viewportH();
    var best = null, bestAmt = 0;
    chapters.forEach(function(c){
      var r = c.getBoundingClientRect();
      var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if(vis > bestAmt){ bestAmt = vis; best = c; }
    });
    setActiveChapter(best && bestAmt > vh * 0.2 ? best : null);
  }
  function onFinger(e){
    if(e.target && e.target.closest && e.target.closest('a, button, input, textarea, select, label, #chrome, #menu, #menuBack, .ovl, #lightbox, #bookBadge')) return;
    var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    if(!t || typeof t.clientX !== 'number') return;
    if(e.pointerType === 'mouse' && !isTouchUI() && !touchMode) return;
    enableTouchMode();
    var ch = chapterFromPoint(t.clientX, t.clientY);
    if(ch) setActiveChapter(ch);
    else updateActiveChapter();
  }
  if(isTouchUI()) enableTouchMode();

  var cio = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('seen'); });
  }, {threshold:.08});
  chapters.forEach(function(c){
    cio.observe(c);
    c.addEventListener('mouseenter', function(){
      if(touchMode || isTouchUI()) return;
      c.classList.add('revealed');
    });
    c.addEventListener('mouseleave', function(){
      if(touchMode || isTouchUI()) return;
      if(!c.contains(document.activeElement)) c.classList.remove('revealed');
    });
    c.addEventListener('focusin', function(){
      if(touchMode || isTouchUI()) return;
      c.classList.add('revealed');
    });
    c.addEventListener('focusout', function(){
      setTimeout(function(){
        if(touchMode || isTouchUI()) return;
        if(!c.contains(document.activeElement) && !c.matches(':hover')) c.classList.remove('revealed');
      }, 0);
    });
  });

  var fingerOpts = {passive:true, capture:true};
  window.addEventListener('touchstart', onFinger, fingerOpts);
  window.addEventListener('touchmove', onFinger, fingerOpts);
  window.addEventListener('pointerdown', onFinger, fingerOpts);
  window.addEventListener('pointermove', function(e){
    if(e.pointerType === 'touch' || isTouchUI()) onFinger(e);
  }, fingerOpts);

  var activeTick = false;
  function onScrollReveal(){
    if(!touchMode && !isTouchUI()) return;
    if(activeTick) return;
    activeTick = true;
    requestAnimationFrame(function(){
      updateActiveChapter();
      activeTick = false;
    });
  }
  window.addEventListener('scroll', onScrollReveal, {passive:true});
  window.addEventListener('touchend', onScrollReveal, {passive:true});
  window.addEventListener('resize', function(){
    if(isTouchUI()){
      enableTouchMode();
      updateActiveChapter();
    } else {
      touchMode = false;
      document.documentElement.classList.remove('touch-ui');
      setActiveChapter(null);
    }
  });
  if(window.visualViewport){
    window.visualViewport.addEventListener('scroll', onScrollReveal, {passive:true});
    window.visualViewport.addEventListener('resize', onScrollReveal, {passive:true});
  }
  updateActiveChapter();

  if(!reduce){
    var bgs = document.querySelectorAll('.ch-bg');
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return;
        ticking = true;
      requestAnimationFrame(function(){
        bgs.forEach(function(bg){
          var r = bg.parentElement.getBoundingClientRect();
          if(r.bottom > 0 && r.top < window.innerHeight){
            var p = (r.top + r.height/2 - window.innerHeight/2) / window.innerHeight;
            bg.style.transform = 'translateY(' + (p * -60) + 'px)';
          }
        });
        ticking = false;
      });
    }, {passive:true});
  }

  /* Quotes (Adore) */
  var qs = document.querySelectorAll('.q'),
      qDots = document.getElementById('qDots'),
      qi = 0, qTimer;
  qs.forEach(function(_, i){
    var b = document.createElement('button');
    b.setAttribute('aria-label','Quote ' + (i+1));
    if(i===0) b.classList.add('on');
    b.addEventListener('click', function(){ goQ(i); qRestart(); });
    qDots.appendChild(b);
  });
  var qDotEls = qDots.querySelectorAll('button');
  function goQ(i){
    qi = i;
    qs.forEach(function(q,j){ q.classList.toggle('on', j===i); });
    qDotEls.forEach(function(d,j){ d.classList.toggle('on', j===i); });
  }
  function qRestart(){
    clearInterval(qTimer);
    if(!reduce) qTimer = setInterval(function(){ goQ((qi+1)%qs.length); }, 6500);
  }
  qRestart();

  /* Overlays */
  var openOvl = null;
  function showOvl(id){
    var o = document.getElementById(id);
    if(!o) return;
    openOvl = o;
    o.classList.add('open');
    document.body.style.overflow = 'hidden';
    o.scrollTop = 0;
  }
  function hideOvl(){
    if(!openOvl) return;
    openOvl.classList.remove('open');
    openOvl = null;
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-ovl]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-ovl');
      showOvl(id);
      if(btn.hasAttribute('data-room')) selectRoom(+btn.getAttribute('data-room'));
      if(btn.hasAttribute('data-menu')) selectMenu(+btn.getAttribute('data-menu'));
    });
  });
  document.querySelectorAll('[data-close-ovl]').forEach(function(b){ b.addEventListener('click', hideOvl); });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(document.getElementById('lightbox').classList.contains('open')) return;
    if(openOvl) hideOvl();
    else if(menu.classList.contains('open')) setMenu(false);
  });

  /* Room tabs */
  var roomTabs = document.querySelectorAll('.room-tab'),
      roomPanels = document.querySelectorAll('.room');
  function selectRoom(i){
    roomTabs.forEach(function(t,j){ t.classList.toggle('on', j===i); });
    roomPanels.forEach(function(p,j){ p.classList.toggle('on', j===i); });
  }
  roomTabs.forEach(function(t,i){ t.addEventListener('click', function(){ selectRoom(i); }); });

  /* Menu tabs */
  var mTabs = document.querySelectorAll('.mtab'),
      mPanels = document.querySelectorAll('.mpanel');
  function selectMenu(i){
    mTabs.forEach(function(t,j){ t.classList.toggle('on', j===i); });
    mPanels.forEach(function(p,j){ p.classList.toggle('on', j===i); });
  }
  mTabs.forEach(function(t,i){ t.addEventListener('click', function(){ selectMenu(i); }); });

  /* Lightbox */
  var gImgs = Array.prototype.slice.call(document.querySelectorAll('#gGrid img')),
      lb = document.getElementById('lightbox'),
      lbImg = document.getElementById('lbImg'),
      lbCap = document.getElementById('lbCap'),
      li = 0;
  function openLb(i){
    li = i;
    var img = gImgs[i];
    lbImg.src = img.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
    lb.classList.add('open');
  }
  function closeLb(){ lb.classList.remove('open'); }
  function stepLb(d){ openLb((li + d + gImgs.length) % gImgs.length); }
  gImgs.forEach(function(img,i){ img.parentElement.addEventListener('click', function(){ openLb(i); }); });
  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', function(e){ e.stopPropagation(); stepLb(-1); });
  document.getElementById('lbNext').addEventListener('click', function(e){ e.stopPropagation(); stepLb(1); });
  lb.addEventListener('click', function(e){ if(e.target === lb) closeLb(); });
  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key === 'Escape') closeLb();
    if(e.key === 'ArrowLeft') stepLb(-1);
    if(e.key === 'ArrowRight') stepLb(1);
  });

  /* Form -> prefilled email */
  document.getElementById('tourForm').addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('fName').value.trim(),
        email = document.getElementById('fEmail').value.trim(),
        note = document.getElementById('formNote');
    if(!name || !email){ note.textContent = 'Please share your names and an email so we can reply.'; return; }
    var body = 'Names: ' + name + '\nEmail: ' + email +
      '\nPreferred date: ' + (document.getElementById('fDate').value || 'Flexible') +
      '\nCelebration: ' + document.getElementById('fType').value +
      '\n\n' + document.getElementById('fMsg').value;
    window.location.href = 'mailto:info@sunolscasabella.com?subject=' +
      encodeURIComponent('Tour Request — ' + name) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Opening your email app — we can\u2019t wait to meet you.';
  });

  /* hide book badge over the contact section */
  var badge = document.getElementById('bookBadge'),
      helloSec = document.getElementById('hello');
  if(badge && helloSec){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ badge.classList.toggle('hide', e.isIntersecting); });
    }, {threshold:.08}).observe(helloSec);
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();

