// Real silk shader extracted from sreedotee.framer.website
// Paper-Shaders-style turbulent gradient in OKLab color space.
// Source: reference/silk/shader-01-fragment.frag (verified identical across all 3 program instances on OG)

const VERT = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_uv;
void main() {
  v_uv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

#define NUM_COLORS 8

uniform vec4 u_colors[NUM_COLORS];
uniform int u_colors_length;
uniform float u_seed;
uniform float u_speed;
uniform float u_loop;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_turbIter;
uniform float u_waveFreq;
uniform float u_distBias;
uniform float u_jellify;
uniform float u_ditherMode;
uniform float u_dither;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

uvec3 hash3(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 seedRandom(float s) {
  uvec3 u = uvec3(floatBitsToUint(s), floatBitsToUint(s*1.5+7.31), floatBitsToUint(s*2.7+13.37));
  u = hash3(u);
  return vec3(u) / float(0xFFFFFFFFu);
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c)  { return pow(clamp(c,0.0,1.0), vec3(0.4545)); }

vec3 linearToOklab(vec3 c) {
  float l = 0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b;
  float m = 0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b;
  float s = 0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b;
  l = pow(max(l,0.0), 1.0/3.0); m = pow(max(m,0.0), 1.0/3.0); s = pow(max(s,0.0), 1.0/3.0);
  return vec3(
    0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
    1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
    0.0259040371*l + 0.7827717662*m - 0.8086757660*s);
}
vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z;
  float m = c.x - 0.1055613458*c.y - 0.0638541728*c.z;
  float s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  return vec3(
     4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
    -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
    -0.0041960863*l - 0.7034186147*m + 1.7076147010*s);
}
vec3 oklabToLch(vec3 lab) { return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y)); }
vec3 lchToOklab(vec3 lch) { return vec3(lch.x, lch.y*cos(lch.z), lch.y*sin(lch.z)); }
vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
  vec3 lch0 = oklabToLch(lab0);
  vec3 lch1 = oklabToLch(lab1);
  if (lch0.y < 0.05) lch0.z = lch1.z;
  if (lch1.y < 0.05) lch1.z = lch0.z;
  float dh = lch1.z - lch0.z;
  if (dh > 3.14159265) dh -= 6.28318530;
  if (dh < -3.14159265) dh += 6.28318530;
  return lchToOklab(vec3(mix(lch0.x, lch1.x, t), mix(lch0.y, lch1.y, t), lch0.z + dh*t));
}

vec3 getColor(int idx) {
  if (u_colors_length < 1) return vec3(0.0);
  int safeIdx = clamp(idx, 0, u_colors_length - 1);
  return u_colors[safeIdx].rgb;
}
vec3 paletteN(float t, int count) {
  if (count < 1) return vec3(0.0);
  if (count < 2) return toLinear(getColor(0));
  float seg = 1.0 / float(count - 1);
  t = clamp(t, 0.0, 1.0);
  int idx = min(int(floor(t / seg)), count - 2);
  float localT = clamp((t - float(idx) * seg) / seg, 0.0, 1.0);
  vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
  vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));
  return oklabToLinear(mixLch(lab0, lab1, localT));
}

float IGN(vec2 uv) { return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715)))); }
float quickNoise(vec2 I) { return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453); }
float getDither(vec2 I, float mode) {
  if (mode < 0.5) return 0.5;
  if (mode < 1.5) return IGN(I);
  return quickNoise(I);
}

vec3 softGamutMap(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  if (minC >= 0.0 && maxC <= 1.0) return c;
  vec3 lab = linearToOklab(max(c, 0.0));
  float L = clamp(lab.x, 0.0, 1.0);
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  float maxChroma = 0.4 * (1.0 - pow(abs(2.0*L - 1.0), 2.0));
  if (C > maxChroma * 0.7) {
    float knee = maxChroma * 0.7;
    C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
  }
  return clamp(oklabToLinear(vec3(L, C*cos(h), C*sin(h))), 0.0, 1.0);
}
vec3 applyContrastSaturation(vec3 c, float contrast, float saturation) {
  vec3 lab = linearToOklab(c);
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  lab.x = clamp((lab.x - 0.5) * contrast + 0.5, 0.0, 1.0);
  C *= saturation;
  lab.y = C * cos(h);
  lab.z = C * sin(h);
  return oklabToLinear(lab);
}

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  vec2 r = u_resolution;
  vec2 p = (fragCoord * 2.0 - r) / r.y;

  int colorCount = u_colors_length;
  if (colorCount < 1) { fragColor = vec4(0.0,0.0,0.0,1.0); return; }

  float t = u_time * 0.3;

  float looping = step(0.5, u_loop);
  float phase = TAU * u_time / max(u_loop, 0.01);
  float radius = u_loop * u_speed * 0.3 / TAU;
  float tA = sin(phase) * radius;
  float tB = (1.0 - cos(phase)) * radius;

  vec3 seedOffset  = seedRandom(u_seed);
  vec3 seedOffset2 = seedRandom(u_seed + 100.0);

  float seedAngle = u_seed * GOLDEN_ANGLE;
  vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

  float cs = cos(seedAngle);
  float sn = sin(seedAngle);
  p = mat2(cs, -sn, sn, cs) * p;

  float totalVal = 0.0;
  float totalWeight = 0.0;
  int turbIter = int(u_turbIter);
  float freq = 1.0 / max(u_turbFreq, 0.01);

  for (float i = 0.0; i < 4.0; i++) {
    float eph = i / 4.0;
    vec2 q = p * u_scale;
    float sq = eph * eph;
    if (u_jellify > 0.5) q.yx *= mix(1.0, 0.5, 1.0 - exp(-sq));

    float a = seedPhase.x;
    float d = seedPhase.y;
    for (int j = 2; j < 13; j++) {
      if (j >= turbIter) break;
      float fj = float(j);
      float t1 = mix(t * u_speed, tA, looping);
      float t2 = mix(t * u_speed, tB, looping);
      q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;
      a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z + t2 * 0.3 * looping);
      d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y + t2 * 0.3 * looping);
    }
    float v = 0.5 + 0.5 * sin(length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + i * i + seedOffset.x);
    float weight = smoothstep(0.0, 0.5, eph) * smoothstep(1.0, 0.5, eph);
    totalVal += v * weight;
    totalWeight += weight;
  }

  float val = totalVal / totalWeight;
  val = clamp((val - 0.3) / 0.4, 0.0, 1.0);
  val = pow(val, exp(-u_distBias));
  val = clamp(val, 0.0, 1.0);

  // Silk base
  vec3 col = paletteN(val, colorCount);
  col *= u_exposure;
  col = applyContrastSaturation(col, u_contrast, u_saturation);
  col = softGamutMap(col);
  col = toSrgb(col);

  // Metallic dot overlay — silver pearls with radial highlight
  vec2 dotCoord = fragCoord / u_pixelRatio;
  float cellPx = 5.0;
  float ang = 0.2618;
  float ca = cos(ang), sa = sin(ang);
  vec2 rCoord = mat2(ca, -sa, sa, ca) * dotCoord;
  vec2 cellUV = fract(rCoord / cellPx) - 0.5;
  float dotDist = length(cellUV) * 2.0;
  float dotMask = smoothstep(0.5 + 0.08, 0.5 - 0.08, dotDist);
  float hl = pow(clamp(1.0 - dotDist / 0.5, 0.0, 1.0), 2.0);
  vec3 dotCol = mix(vec3(0.44, 0.60, 0.74), vec3(0.93, 0.97, 1.0), hl);
  col = mix(col, dotCol, dotMask * 0.3);

  fragColor = vec4(col, 1.0);
}`

// Uniforms captured from OG (reference/silk/uniforms.json)
const PARAMS = {
  colors: new Float32Array([
    0.4863, 0.7216, 0.9098, 1, // #7cb8e8 — bright sky blue
    0.6431, 0.8118, 0.9412, 1, // #a4cff0 — light sky / glass
    0.7843, 0.8941, 0.9725, 1, // #c8e4f8 — very light sky
    0.3529, 0.6039, 0.8314, 1, // #5a9ad4 — vivid sky (darkest)
    0.9294, 0.9647, 1.0,    1, // #edf6ff — sky white
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ]),
  colorsLength: 5,
  seed: 689,
  speed: 0.79,
  loop: 0,
  scale: 0.28,
  turbAmp: 0,
  turbFreq: 2,
  turbIter: 9,
  waveFreq: 1.5,
  distBias: 0,
  jellify: 0,
  ditherMode: 1,
  dither: 0.1,
  exposure: 1.1,
  contrast: 1.1,
  saturation: 1,
}

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error('Shader compile error: ' + log)
  }
  return sh
}

export function initSilk(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
  if (!gl) {
    console.warn('WebGL2 not supported — silk shader skipped')
    return null
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(prog))
  }
  gl.useProgram(prog)

  // Fullscreen quad (two triangles)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    // x,    y,    u,   v
    -1, -1,  0, 0,
     1, -1,  1, 0,
    -1,  1,  0, 1,
    -1,  1,  0, 1,
     1, -1,  1, 0,
     1,  1,  1, 1,
  ]), gl.STATIC_DRAW)

  const posLoc = gl.getAttribLocation(prog, 'a_position')
  const uvLoc  = gl.getAttribLocation(prog, 'a_texCoord')
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
  gl.enableVertexAttribArray(uvLoc)
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8)

  const u = (n) => gl.getUniformLocation(prog, n)
  const uniforms = {
    colors: u('u_colors'),
    colorsLength: u('u_colors_length'),
    seed: u('u_seed'),
    speed: u('u_speed'),
    loop: u('u_loop'),
    scale: u('u_scale'),
    turbAmp: u('u_turbAmp'),
    turbFreq: u('u_turbFreq'),
    turbIter: u('u_turbIter'),
    waveFreq: u('u_waveFreq'),
    distBias: u('u_distBias'),
    jellify: u('u_jellify'),
    ditherMode: u('u_ditherMode'),
    dither: u('u_dither'),
    exposure: u('u_exposure'),
    contrast: u('u_contrast'),
    saturation: u('u_saturation'),
    time: u('u_time'),
    resolution: u('u_resolution'),
    pixelRatio: u('u_pixelRatio'),
  }

  // Set static uniforms once
  gl.uniform4fv(uniforms.colors, PARAMS.colors)
  gl.uniform1i(uniforms.colorsLength, PARAMS.colorsLength)
  gl.uniform1f(uniforms.seed, PARAMS.seed)
  gl.uniform1f(uniforms.speed, PARAMS.speed)
  gl.uniform1f(uniforms.loop, PARAMS.loop)
  gl.uniform1f(uniforms.scale, PARAMS.scale)
  gl.uniform1f(uniforms.turbAmp, PARAMS.turbAmp)
  gl.uniform1f(uniforms.turbFreq, PARAMS.turbFreq)
  gl.uniform1f(uniforms.turbIter, PARAMS.turbIter)
  gl.uniform1f(uniforms.waveFreq, PARAMS.waveFreq)
  gl.uniform1f(uniforms.distBias, PARAMS.distBias)
  gl.uniform1f(uniforms.jellify, PARAMS.jellify)
  gl.uniform1f(uniforms.ditherMode, PARAMS.ditherMode)
  gl.uniform1f(uniforms.dither, PARAMS.dither)
  gl.uniform1f(uniforms.exposure, PARAMS.exposure)
  gl.uniform1f(uniforms.contrast, PARAMS.contrast)
  gl.uniform1f(uniforms.saturation, PARAMS.saturation)

  let dpr = Math.min(window.devicePixelRatio || 1, 2)
  let width = 0, height = 0

  function resize() {
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.floor(rect.width * dpr))
    const h = Math.max(1, Math.floor(rect.height * dpr))
    if (w === width && h === height) return
    width = w
    height = h
    canvas.width = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
    gl.uniform2f(uniforms.resolution, w, h)
    gl.uniform1f(uniforms.pixelRatio, dpr)
  }

  const start = performance.now()
  let running = true
  let lastFrame = 0
  const FRAME_INTERVAL = 1000 / 60

  function frame(now) {
    if (!running) return
    if (now - lastFrame >= FRAME_INTERVAL - 1) {
      lastFrame = now
      resize()
      gl.uniform1f(uniforms.time, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  // Pause when hero leaves viewport
  const io = new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting
    if (running) {
      lastFrame = 0
      requestAnimationFrame(frame)
    }
  }, { threshold: 0 })
  io.observe(canvas)

  window.addEventListener('resize', resize)

  return { canvas, gl, stop: () => { running = false; io.disconnect() } }
}
