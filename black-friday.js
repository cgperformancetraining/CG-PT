/* CG Performance Training: Black Friday countdown.
   Counts down to the time in the block's data-ends attribute (UK time)
   and hides the whole offer block once it reaches zero. */
(function () {
  var block = document.getElementById('black-friday');
  if (!block) return;
  var end = new Date(block.getAttribute('data-ends')).getTime();
  var out = {};
  ['d', 'h', 'm', 's'].forEach(function (k) { out[k] = block.querySelector('[data-bf="' + k + '"]'); });
  function two(n) { return n < 10 ? '0' + n : String(n); }
  var timer;
  function tick() {
    var left = end - Date.now();
    if (isNaN(end) || left <= 0) {
      block.hidden = true;
      clearInterval(timer);
      return;
    }
    var s = Math.floor(left / 1000);
    out.d.textContent = two(Math.floor(s / 86400));
    out.h.textContent = two(Math.floor(s % 86400 / 3600));
    out.m.textContent = two(Math.floor(s % 3600 / 60));
    out.s.textContent = two(s % 60);
  }
  timer = setInterval(tick, 1000);
  tick();
})();
