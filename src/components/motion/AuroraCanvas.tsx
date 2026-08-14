"use client";

import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.2113248654, 0.3660254038, -0.5773502692, 0.0243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.792842914 - 0.853734721 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 left = uColorStops[0];
  vec3 middle = uColorStops[1];
  vec3 right = uColorStops[2];
  vec3 ramp = uv.x < 0.5
    ? mix(left, middle, uv.x * 2.0)
    : mix(middle, right, (uv.x - 0.5) * 2.0);
  float wave = snoise(vec2(uv.x * 2.1 + uTime * 0.08, uTime * 0.18));
  float edge = 0.72 + wave * 0.16;
  float alpha = smoothstep(edge, edge - 0.28, uv.y) * smoothstep(0.02, 0.24, uv.y);
  alpha *= 0.36;
  fragColor = vec4(ramp * alpha, alpha);
}`;

function accentStops(element: HTMLElement): number[][] {
  const style = getComputedStyle(element);
  return ["--accent-700", "--accent-500", "--accent-300"].map((name) => {
    const raw = style.getPropertyValue(name).trim();
    const channels = raw.split(/\s+/).map(Number);
    if (channels.length === 3 && channels.every(Number.isFinite)) {
      return channels.map((channel) => channel / 255);
    }
    const fallback = new Color(name === "--accent-500" ? "#3abef9" : "#0b7dbd");
    return [fallback.r, fallback.g, fallback.b];
  });
}

/**
 * The WebGL half of {@link import("./Aurora").Aurora}, kept in its own module
 * so `ogl` and this shader stay out of the initial bundle. Reads the site's
 * inherited accent variables, including per-character themes.
 *
 * Only rendered for visitors who have not asked for reduced motion — the
 * wrapper decides that on the client, where the answer is actually known.
 */
export function AuroraCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const element = container;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;
    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uColorStops: { value: accentStops(element) },
        uResolution: { value: [1, 1] },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    element.appendChild(gl.canvas);

    function resize() {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    resize();

    const themedShell = element.parentElement?.parentElement;
    const themeObserver = themedShell
      ? new MutationObserver(() => {
          program.uniforms.uColorStops.value = accentStops(element);
        })
      : null;
    themeObserver?.observe(themedShell!, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Shader time accumulates only while the layer is on screen, so scrolling
    // past it stops the loop without the noise jumping when it resumes.
    let frame = 0;
    let lastTimestamp = 0;
    let elapsed = 0;

    function render(now: number) {
      elapsed += (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      program.uniforms.uTime.value = elapsed;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(render);
    }

    function start() {
      if (frame) return;
      lastTimestamp = performance.now();
      frame = requestAnimationFrame(render);
    }

    function stop() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    // A full-screen shader is the most expensive thing on the page; there is
    // no reason to keep painting it for a visitor who has scrolled past it.
    const visibilityObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
      else stop();
    });
    visibilityObserver.observe(element);

    return () => {
      stop();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      themeObserver?.disconnect();
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 top-0 h-[min(58lvh,560px)] opacity-70"
      aria-hidden
    />
  );
}
