import { VERT, FRAG } from "./shaders";

export interface LoungeTextures {
  hookah: string;
  hookahDepth: string;
  bar: string;
  barDepth: string;
  barGlow: string;
}

/** Every uniform the timeline drives, in one bag. Vec2s are [x, y]. */
export interface LoungeState {
  hkC: [number, number]; hkH: [number, number]; hkPar: [number, number]; hkDolly: number; hkFocus: [number, number];
  hkExposure: number; hkSpec: number; hkRim: number; hkRelief: number; hkBlur: number; hkCA: number; hkRed: number;
  barC: [number, number]; barH: [number, number]; barPar: [number, number]; barDolly: number; barFocus: [number, number];
  barExposure: number; barSpec: number; barRelief: number; barBlur: number; bloom: number;
  light: number; mix: number; warp: number; particles: number; vignette: number; floor: number;
}

const UNIFORM_NAMES = {
  hkC: "uHkC", hkH: "uHkH", hkPar: "uHkPar", hkDolly: "uHkDolly", hkFocus: "uHkFocus",
  hkExposure: "uHkExposure", hkSpec: "uHkSpec", hkRim: "uHkRim", hkRelief: "uHkRelief", hkBlur: "uHkBlur", hkCA: "uHkCA", hkRed: "uHkRed",
  barC: "uBarC", barH: "uBarH", barPar: "uBarPar", barDolly: "uBarDolly", barFocus: "uBarFocus",
  barExposure: "uBarExposure", barSpec: "uBarSpec", barRelief: "uBarRelief", barBlur: "uBarBlur", bloom: "uBloom",
  light: "uLight", mix: "uMix", warp: "uWarp", particles: "uParticles", vignette: "uVignette", floor: "uFloor",
} as const;

/**
 * A single-pass WebGL2 renderer for the lounge. Nothing here knows about
 * scroll: it takes a state and draws it. Textures are decoded off the main
 * thread and uploaded once; the colour maps get mipmaps so a blur is one
 * sample with a level bias.
 */
export class LoungeRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private loc = new Map<string, WebGLUniformLocation | null>();
  private textures = new Map<string, WebGLTexture>();
  private lost = false;
  private width = 0;
  private height = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.lost = true; });
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link");
    this.program = program;
    gl.useProgram(program);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    for (const name of ["uRes", "uTime", "uHk", "uHkD", "uBar", "uBarD", "uGlow", ...Object.values(UNIFORM_NAMES)]) this.loc.set(name, gl.getUniformLocation(program, name));
    // texture units are fixed for the life of the program
    gl.uniform1i(this.loc.get("uHk")!, 0);
    gl.uniform1i(this.loc.get("uHkD")!, 1);
    gl.uniform1i(this.loc.get("uBar")!, 2);
    gl.uniform1i(this.loc.get("uBarD")!, 3);
    gl.uniform1i(this.loc.get("uGlow")!, 4);
    // until a picture arrives, every unit holds one dark texel
    const blank = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    for (let u = 0; u < 5; u++) { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, blank); }
  }

  get isLost() { return this.lost; }

  /** Loads one picture into a unit. Colour maps get mipmaps; depth maps stay linear. */
  async load(unit: 0 | 1 | 2 | 3 | 4, url: string, mip: boolean) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const { gl } = this;
    if (this.lost) return;
    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (mip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    const old = this.textures.get(url);
    if (old) gl.deleteTexture(old);
    this.textures.set(url, tex);
  }

  resize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  render(state: LoungeState, time: number) {
    if (this.lost) return;
    const { gl, loc } = this;
    gl.uniform2f(loc.get("uRes")!, this.width, this.height);
    gl.uniform1f(loc.get("uTime")!, time);
    for (const key of Object.keys(UNIFORM_NAMES) as (keyof LoungeState)[]) {
      const v = state[key];
      const l = loc.get(UNIFORM_NAMES[key])!;
      if (typeof v === "number") gl.uniform1f(l, v);
      else gl.uniform2f(l, v[0], v[1]);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * Frees what was made. The context itself is left alone: React may mount
   * again on the same canvas (it does, in development), and a context that
   * was deliberately lost cannot make shaders.
   */
  dispose() {
    const { gl } = this;
    for (const t of this.textures.values()) gl.deleteTexture(t);
    this.textures.clear();
    gl.deleteProgram(this.program);
  }
}
