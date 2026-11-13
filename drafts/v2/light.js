// The wall light: one abstract image (public/textures/print-glow.webp, an orange long exposure on white) drawn
// on a fixed canvas behind the pages and kept moving the way the design portfolio's header moves: four
// travelling sine waves, gently warped, bend the picture; the pointer stirs it (a twist and a push that ease
// back). Here the waves move a photograph instead of a dither pattern, so nothing is pixelated.
const VERT = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const FRAG = `precision mediump float;
uniform sampler2D img; uniform vec2 res; uniform float t; uniform vec2 ptr; uniform float twist; uniform vec2 push; uniform float unit;
varying vec2 v;
float wave(vec2 p, float t) {
  vec2 q = p + .14 * vec2(sin(p.y * .9 + t * .04), sin(p.x * .7 - t * .06));
  return .46 * sin(dot(q, vec2(.848, .530)) * 6.283 - t * .30)
       + .22 * sin(dot(q, vec2(.545, .839)) * 9.111 - t * .42)
       + .20 * sin(dot(q, vec2(.993, .122)) * 3.896 + t * .22)
       + .12 * sin(dot(q, vec2(.743, .669)) * 18.22 - t * .60);
}
void main() {
  vec2 px = vec2(v.x, 1. - v.y) * res;                 // CSS px from the top left
  vec2 d = px - ptr; float g = exp(-dot(d, d) / (220. * 220.));
  float a = twist * g; vec2 sp = ptr + mat2(cos(a), sin(a), -sin(a), cos(a)) * d - push * g;
  vec2 p = sp / unit;
  float w1 = wave(p, t), w2 = wave(p + vec2(3.7, 1.9), t * .8);
  vec2 uv = sp / res + .075 * vec2(w1, w2);
  vec3 c = texture2D(img, clamp(uv, .003, .997)).rgb;
  c = mix(c, vec3(.992, .992, .988), clamp(.16 * w1, 0., .2));   // the bands lift toward white as they pass
  gl_FragColor = vec4(c, 1.);
}`;

export function mountLight(canvas, src) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => { canvas.style.background = `url(${src}) center / cover no-repeat`; };
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return still();
  const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return still();
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['res', 't', 'ptr', 'twist', 'push', 'unit'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  let w = 1, h = 1, ready = false;
  function size() { w = innerWidth; h = innerHeight;
    // a third of the screen's resolution is plenty for something this soft; the browser smooths it back up
    canvas.width = Math.max(2, Math.round(w / 3)); canvas.height = Math.max(2, Math.round(h / 3)); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, w, h); gl.uniform1f(U.unit, w < 640 ? 520 : 800); if (ready) draw(); }
  const image = new Image();
  image.onload = () => { const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
    ready = true; canvas.classList.add('on'); size(); if (!reduce.matches) requestAnimationFrame(loop); };
  image.onerror = still; image.src = src;

  // the stir: the centre trails the pointer, twist and push rise with its speed and ease back when it stops
  const P = { x: -9999, y: -9999, cx: -9999, cy: -9999, twist: 0, tTwist: 0, px: 0, py: 0, tpx: 0, tpy: 0, at: 0, lx: 0, ly: 0, lt: 0 };
  addEventListener('pointermove', (e) => {
    if (reduce.matches || e.pointerType === 'touch') return; const now = performance.now(), dt = Math.max(8, now - P.lt);
    const vx = (e.clientX - P.lx) / dt * 1000, vy = (e.clientY - P.ly) / dt * 1000;
    if (P.lt && now - P.lt < 200) { const sp = Math.hypot(vx, vy);
      P.tTwist = Math.min(1.2, sp * 0.0014) * (Math.abs(vx) > Math.abs(vy) * 0.36 ? Math.sign(vx) : Math.sign(vy));
      const k = Math.min(1, 176 / (Math.hypot(vx, vy) * 0.14 || 1)); P.tpx = vx * 0.14 * k * 0.45; P.tpy = vy * 0.14 * k * 0.45; }
    if (P.cx < -999) { P.cx = e.clientX; P.cy = e.clientY; }
    P.x = P.lx = e.clientX; P.y = P.ly = e.clientY; P.lt = P.at = now;
  }, { passive: true });

  let t = 40, last = 0;
  function draw() { gl.uniform1f(U.t, t); gl.uniform2f(U.ptr, P.cx, P.cy); gl.uniform1f(U.twist, P.twist); gl.uniform2f(U.push, P.px, P.py); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  function loop(now) {
    if (reduce.matches) return draw();
    requestAnimationFrame(loop);
    if (document.hidden || now - last < 30) return;                    // about 30 frames a second is enough
    const dt = Math.min(0.1, (now - last) / 1000); last = now; t = (t + dt * 6) % 314.159;
    const lag = 1 - Math.exp(-dt / 0.08); P.cx += (P.x - P.cx) * lag; P.cy += (P.y - P.cy) * lag;
    const moving = now - P.at < 90, k = 1 - Math.exp(-dt / (moving ? 0.15 : 0.9));
    if (!moving) P.tTwist = P.tpx = P.tpy = 0;
    P.twist += (P.tTwist - P.twist) * k; P.px += (P.tpx - P.px) * k; P.py += (P.tpy - P.py) * k;
    draw();
  }
  addEventListener('resize', size);
  reduce.addEventListener?.('change', () => { if (ready && !reduce.matches) requestAnimationFrame(loop); });
}
