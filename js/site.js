/* ============================================================
   AutoGate Link - shared behaviour (site.js)
   - mobile navigation toggle
   - product carousel (2 per view, auto switch)
   ============================================================ */
(function () {
    'use strict';

    /* ---------------- mobile navigation ---------------- */
    function initNav() {
        var toggles = document.querySelectorAll('.nav-toggle');
        Array.prototype.forEach.call(toggles, function (btn) {
            var links = btn.parentNode ? btn.parentNode.querySelector('.nav-links') : null;
            if (!links) return;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                links.classList.toggle('open');
            });
        });

        document.addEventListener('click', function (e) {
            var open = document.querySelectorAll('.nav-links.open');
            if (!open.length) return;
            Array.prototype.forEach.call(open, function (links) {
                if (!links.contains(e.target)) links.classList.remove('open');
            });
        });
    }

    /* ---------------- carousel ---------------- */
    function perView() {
        return window.matchMedia('(max-width: 768px)').matches ? 1 : 2;
    }

    function initCarousel(root) {
        var track = root.querySelector('.carousel-track');
        if (!track) return;

        var slides = Array.prototype.slice.call(track.children);
        if (!slides.length) return;

        var prev = root.querySelector('.carousel-prev');
        var next = root.querySelector('.carousel-next');
        var dotsBox = root.querySelector('.carousel-dots');
        var interval = parseInt(root.getAttribute('data-interval') || '4500', 10);
        var idx = 0;
        var timer = null;
        var paused = false;

        function maxIndex() {
            return Math.max(0, slides.length - perView());
        }

        function buildDots() {
            if (!dotsBox) return;
            dotsBox.innerHTML = '';
            var total = maxIndex() + 1;
            for (var i = 0; i < total; i++) {
                var b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', 'Go to page ' + (i + 1));
                (function (n) {
                    b.addEventListener('click', function () {
                        go(n, true);
                    });
                })(i);
                dotsBox.appendChild(b);
            }
        }

        function updateDots() {
            if (!dotsBox) return;
            var kids = dotsBox.children;
            for (var i = 0; i < kids.length; i++) {
                if (i === idx) kids[i].classList.add('active');
                else kids[i].classList.remove('active');
            }
        }

        function gapPx() {
            return window.matchMedia('(max-width: 768px)').matches ? 16 : 24;
        }

        // Stack every slide at left:0 (inside the clip) and only shift the
        // visible window into place. This keeps all slides painted (no
        // overflow:hidden culling) while preserving the slide animation.
        function place() {
            var pv = perView();
            var m = maxIndex();
            if (idx > m) idx = m;
            var g = gapPx();
            slides.forEach(function (s, i) {
                var pos = i - idx;
                if (pos >= 0 && pos < pv) {
                    s.style.opacity = '1';
                    s.style.transform = 'translateX(calc(' + pos + ' * (100% + ' + g + 'px)))';
                    s.style.pointerEvents = 'auto';
                    s.style.zIndex = '2';
                } else {
                    s.style.opacity = '0';
                    s.style.transform = 'translateX(0)';
                    s.style.pointerEvents = 'none';
                    s.style.zIndex = '1';
                }
            });
            // give the absolutely-positioned track a real height
            var h = 0;
            for (var k = idx; k < idx + pv && k < slides.length; k++) {
                if (slides[k].offsetHeight > h) h = slides[k].offsetHeight;
            }
            if (h) track.style.height = h + 'px';
            updateDots();
        }

        function go(n, userAction) {
            var m = maxIndex();
            if (n < 0) n = m;
            if (n > m) n = 0;
            idx = n;
            place();
            if (userAction) restart();
        }

        function restart() {
            stop();
            if (root.getAttribute('data-state') === 'single') return;
            timer = window.setInterval(function () {
                if (paused) return;
                go(idx + 1);
            }, interval);
        }

        function stop() {
            if (timer) { window.clearInterval(timer); timer = null; }
        }

        function sync() {
            var m = maxIndex();
            if (idx > m) idx = m;
            if (m === 0) {
                root.setAttribute('data-state', 'single');
            } else {
                root.setAttribute('data-state', 'multi');
            }
            buildDots();
            go(idx);
            restart();
        }

        if (prev) prev.addEventListener('click', function () { go(idx - 1, true); });
        if (next) next.addEventListener('click', function () { go(idx + 1, true); });

        root.addEventListener('mouseenter', function () { paused = true; });
        root.addEventListener('mouseleave', function () { paused = false; });
        root.addEventListener('focusin', function () { paused = true; });
        root.addEventListener('focusout', function () { paused = false; });

        // Pause only when the whole tab is hidden (saves CPU); do NOT gate on
        // scroll position, otherwise a below-the-fold carousel stays frozen.
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else restart();
        });

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(sync, 160);
        });

        // recompute stacked track height as lazy/late images finish loading
        Array.prototype.forEach.call(track.querySelectorAll('img'), function (im) {
            if (!im.complete) im.addEventListener('load', place);
        });
        window.addEventListener('load', place);

        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        sync();
        if (reduce) {
            stop();
        }
    }

    function boot() {
        initNav();
        var carousels = document.querySelectorAll('[data-carousel]');
        Array.prototype.forEach.call(carousels, initCarousel);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
