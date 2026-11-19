/* CG Performance Training: offer countdowns (Black Friday, New Year New Me).
   Every block with class "bf" and a data-ends attribute counts down to that time (UK time).
   A block with data-starts stays hidden until then. Each block hides itself once its countdown ends. */
(function () {
  function two(n) { return n < 10 ? '0' + n : String(n); }
  document.querySelectorAll('.bf[data-ends]').forEach(function (block) {
    var start = block.getAttribute('data-starts') ? new Date(block.getAttribute('data-starts')).getTime() : 0;
    var end = new Date(block.getAttribute('data-ends')).getTime();
    var out = {};
    ['d', 'h', 'm', 's'].forEach(function (k) { out[k] = block.querySelector('[data-bf="' + k + '"]'); });
    var timer;
    function tick() {
      var now = Date.now();
      if (isNaN(end) || now >= end) { block.hidden = true; clearInterval(timer); return; }
      if (now < start) { block.hidden = true; return; } // not started yet
      block.hidden = false;
      var s = Math.floor((end - now) / 1000);
      out.d.textContent = two(Math.floor(s / 86400));
      out.h.textContent = two(Math.floor(s % 86400 / 3600));
      out.m.textContent = two(Math.floor(s % 3600 / 60));
      out.s.textContent = two(s % 60);
    }
    timer = setInterval(tick, 1000);
    tick();
  });
})();
