import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins globally
gsap.registerPlugin(ScrollTrigger);

// Default easing for the INNOVESTOR brand — snappy & precise
export const EASE = "power2.out";
export const EASE_IN_OUT = "power2.inOut";

// Standard animation durations
export const DURATION = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  hero: 0.8,
};

// Reusable animation presets
export const fadeUp = (element: gsap.TweenTarget, delay = 0) =>
  gsap.from(element, {
    opacity: 0,
    y: 30,
    duration: DURATION.slow,
    delay,
    ease: EASE,
  });

export const fadeIn = (element: gsap.TweenTarget, delay = 0) =>
  gsap.from(element, {
    opacity: 0,
    duration: DURATION.normal,
    delay,
    ease: EASE,
  });

export const slideInLeft = (element: gsap.TweenTarget, delay = 0) =>
  gsap.from(element, {
    opacity: 0,
    x: -40,
    duration: DURATION.slow,
    delay,
    ease: EASE,
  });

export const slideInRight = (element: gsap.TweenTarget, delay = 0) =>
  gsap.from(element, {
    opacity: 0,
    x: 40,
    duration: DURATION.slow,
    delay,
    ease: EASE,
  });

// ScrollTrigger-based reveal (attach to sections)
export const scrollReveal = (element: gsap.TweenTarget, trigger?: Element) =>
  gsap.from(element, {
    scrollTrigger: {
      trigger: (trigger as Element) || (element as Element),
      start: "top 85%",
      toggleActions: "play none none none",
    },
    opacity: 0,
    y: 40,
    duration: DURATION.slow,
    ease: EASE,
  });

// Staggered children reveal
export const staggerReveal = (
  elements: gsap.TweenTarget,
  trigger: Element,
  stagger = 0.1,
) =>
  gsap.from(elements, {
    scrollTrigger: {
      trigger,
      start: "top 85%",
      toggleActions: "play none none none",
    },
    opacity: 0,
    y: 30,
    duration: DURATION.normal,
    stagger,
    ease: EASE,
  });

// Counter animation (for stats)
export const animateCounter = (
  element: HTMLElement,
  target: number,
  duration = 1.5,
) => {
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: target,
    duration,
    ease: "power1.out",
    onUpdate: () => {
      element.textContent = Math.floor(obj.val).toLocaleString();
    },
  });
};

export { gsap, ScrollTrigger };
