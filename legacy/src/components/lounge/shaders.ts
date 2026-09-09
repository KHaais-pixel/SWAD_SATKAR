/**
 * One full-screen pass draws the whole lounge. Two pictures, each with a depth
 * map, are placed as planes in front of a virtual camera; depth displaces
 * their texels as the camera moves (parallax), and normals recovered from
 * the depth catch a moving light, so highlights travel over metal and glass.
 * The join between the two is a reflection: the hookah's shiny parts admit
 * the bar first, warped through the metal's own surface.
 */
export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uHk;      // hookah colour + alpha
uniform sampler2D uHkD;     // hookah depth, near = bright
uniform sampler2D uBar;     // bar colour
uniform sampler2D uBarD;    // bar depth
uniform sampler2D uGlow;    // bar bright parts, blurred

// planes: centre and half extents in screen-height units (y up, origin centre)
uniform vec2 uHkC, uHkH, uBarC, uBarH;
// camera: lateral parallax per unit of depth, dolly parallax about a focus point
uniform vec2 uHkPar, uBarPar;
uniform float uHkDolly, uBarDolly;
uniform vec2 uHkFocus, uBarFocus;
// look
uniform float uHkExposure, uHkSpec, uHkRim, uHkRelief, uHkBlur, uHkCA, uHkRed;
uniform float uBarExposure, uBarSpec, uBarRelief, uBarBlur, uBloom;
uniform float uLight;      // light angle, radians
uniform float uMix, uWarp; // the reflection join
uniform float uParticles, uVignette, uFloor;

const vec3 BG = vec3(0.012, 0.015, 0.024);

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float inside(vec2 t) { vec2 a = step(vec2(0.0), t) * step(t, vec2(1.0)); return a.x * a.y; }

// texture coordinate of a plane for a screen point, then displaced by its depth
vec2 planeUv(vec2 s, vec2 c, vec2 h) { return (s - c) / h * 0.5 + 0.5; }
vec2 displace(sampler2D depth, vec2 t, vec2 h, vec2 par, float dolly, vec2 focus) {
  vec2 scale = 0.5 / h;
  vec2 t1 = t;
  for (int i = 0; i < 2; i++) {
    float d = texture(depth, clamp(t1, 0.0, 1.0)).r - 0.5;
    t1 = t + d * (par * scale + dolly * (t - focus));
  }
  return t1;
}
vec3 normalFrom(sampler2D depth, vec2 t, float relief) {
  vec2 e = 1.5 / vec2(textureSize(depth, 0));
  float dx = texture(depth, t + vec2(e.x, 0.0)).r - texture(depth, t - vec2(e.x, 0.0)).r;
  float dy = texture(depth, t + vec2(0.0, e.y)).r - texture(depth, t - vec2(0.0, e.y)).r;
  return normalize(vec3(-dx * relief, -dy * relief, 1.0));
}

void main() {
  vec2 s = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec3 L = normalize(vec3(cos(uLight), 0.55 + 0.25 * sin(uLight * 0.7), 0.8));
  vec3 V = vec3(0.0, 0.0, 1.0);

  /* ---------------------------------------------------------- studio */
  vec3 col = BG;
  // one low pool of light on the floor under the object
  float floorD = length((s - uHkC + vec2(0.0, uHkH.y * 0.98)) / vec2(uHkH.x * 2.6, uHkH.y * 0.35));
  col += vec3(0.11, 0.07, 0.05) * uFloor * exp(-floorD * floorD * 1.6);
  // dust: two sparse layers, drifting, each with its own parallax
  for (int layer = 0; layer < 2; layer++) {
    float k = layer == 0 ? 9.0 : 15.0;
    vec2 drift = vec2(uTime * (0.012 + 0.008 * float(layer)), uTime * 0.02) + uHkPar * (layer == 0 ? 1.5 : 4.0);
    vec2 g = s * k + drift;
    vec2 cell = floor(g);
    vec2 pt = vec2(hash(cell), hash(cell + 7.3));
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + hash(cell + 3.1)) + hash(cell) * 6.28);
    float d = length(g - cell - pt) * (layer == 0 ? 11.0 : 16.0);
    float dot_ = exp(-d * d) * step(0.72, hash(cell + 1.7)) * twinkle;
    col += vec3(0.7, 0.62, 0.55) * dot_ * uParticles * (layer == 0 ? 0.55 : 0.32);
  }

  /* ---------------------------------------------------------- hookah */
  vec2 th = planeUv(s, uHkC, uHkH);
  vec2 thd = displace(uHkD, th, uHkH, uHkPar, uHkDolly, uHkFocus);
  vec4 hk = vec4(0.0);
  vec3 nH = vec3(0.0, 0.0, 1.0);
  float specH = 0.0;
  if (inside(thd) > 0.5) {
    // a touch of colour fringing when very close, as a lens would
    vec2 ca = (thd - 0.5) * uHkCA;
    hk.r = texture(uHk, thd + ca, uHkBlur).r;
    hk.g = texture(uHk, thd, uHkBlur).g;
    hk.ba = texture(uHk, thd - ca, uHkBlur).ba;
    nH = normalFrom(uHkD, thd, uHkRelief);
    float lum = luma(hk.rgb);
    float sat = max(hk.r, max(hk.g, hk.b)) - min(hk.r, min(hk.g, hk.b));
    float gloss = clamp(lum * 1.4 + sat * 0.8, 0.0, 1.5);
    specH = pow(max(dot(reflect(-L, nH), V), 0.0), 42.0) * gloss;
    float rim = pow(1.0 - nH.z, 2.2);
    vec3 specTint = mix(vec3(1.0, 0.96, 0.9), vec3(1.0, 0.35, 0.3), sat * 0.8);
    vec3 lit = hk.rgb * uHkExposure + specTint * specH * uHkSpec + vec3(0.9, 0.55, 0.45) * rim * uHkRim * (0.4 + lum);
    lit = mix(lit, lit * vec3(1.25, 0.55, 0.5) + vec3(0.08, 0.0, 0.0), uHkRed);
    hk = vec4(lit, hk.a);
  }
  vec3 hookahScene = mix(col, hk.rgb, hk.a);

  /* ---------------------------------------------------------- bar */
  vec3 barScene = col;
  float barLum = 0.0;
  if (uMix > 0.001) {
    vec2 tb = planeUv(s, uBarC, uBarH);
    // seen in the metal first: warped by the hookah's surface, then flat
    tb += nH.xy * uWarp;
    vec2 tbd = clamp(displace(uBarD, tb, uBarH, uBarPar, uBarDolly, uBarFocus), 0.0, 1.0);
    vec3 bar = texture(uBar, tbd, uBarBlur).rgb;
    vec3 nB = normalFrom(uBarD, tbd, uBarRelief);
    float lumB = luma(bar);
    float glossB = lumB * lumB * 1.6;
    // only rounded surfaces shine: where depth jumps (a shelf edge) the normal is a cliff, not a curve
    float edgeB = smoothstep(0.55, 0.9, 1.0 - nB.z);
    float specB = pow(max(dot(reflect(-L, nB), V), 0.0), 26.0) * glossB * (1.0 - edgeB);
    vec3 glow = texture(uGlow, tbd).rgb;
    barScene = bar * uBarExposure + vec3(1.0, 0.82, 0.55) * specB * uBarSpec + glow * uBloom;
    barLum = lumB;
  }

  /* ---------------------------------------------------------- the join */
  // the reflection takes the bright, shiny parts first, then everything
  float field = clamp(specH * 0.7 + barLum * 0.6 + hash(floor(s * 220.0)) * 0.06, 0.0, 1.0);
  float m = smoothstep(0.0, 1.0, (uMix - 0.5) * 2.2 + 0.5 + (field - 0.5) * 0.8);
  vec3 c = mix(hookahScene, barScene, clamp(m, 0.0, 1.0));

  /* ---------------------------------------------------------- lens */
  float v = length(s * vec2(0.8, 1.0));
  c *= 1.0 - uVignette * smoothstep(0.35, 1.15, v);
  c += (hash(vUv * uRes + fract(uTime) * 7.0) - 0.5) * 0.02;
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
