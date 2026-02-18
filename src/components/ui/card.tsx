import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, interactive = false, children, ...props }, ref) => {
  const localRef = React.useRef<HTMLDivElement | null>(null);
  const titleFloatRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") ref(localRef.current);
    else (ref as React.MutableRefObject<HTMLDivElement | null>).current = localRef.current;
  }, [ref]);

  // mouse tilt handlers for interactive cards
  React.useEffect(() => {
    const el = localRef.current;
    const floatEl = titleFloatRef.current;
    if (!el || !interactive) return;

    let raf = 0;

    const onMove = (e: MouseEvent) => {
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotateY = x * 10; // degrees
        const rotateX = -y * 8; // degrees
        el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`;

        if (floatEl) {
          floatEl.style.left = `${e.clientX - rect.left + 12}px`;
          floatEl.style.top = `${e.clientY - rect.top + 12}px`;
        }
      });
    };

    const onEnter = (e: MouseEvent) => {
      if (floatEl) {
        // try to find a title inside the card
        const title = el.querySelector('h3')?.textContent;
        if (title) {
          floatEl.textContent = title;
          floatEl.style.opacity = '1';
          floatEl.style.transform = 'translate3d(0,0,0)';
        }
      }
      el.style.transition = 'transform 160ms cubic-bezier(.2,.9,.2,1)';
    };

    const onLeave = () => {
      if (!el) return;
      el.style.transform = '';
      el.style.transition = 'transform 260ms cubic-bezier(.2,.9,.2,1)';
      if (floatEl) {
        floatEl.style.opacity = '0';
      }
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <div
      ref={localRef}
      className={cn(
        "rounded-2xl border border-border/60 bg-black text-white shadow-sm transition-shadow duration-200 hover:shadow-md",
        interactive ? 'card-3d' : '',
        className,
      )}
      {...props}
    >
      {interactive && <div className="card-outline absolute inset-0 rounded-2xl pointer-events-none" />}
      {interactive && <div ref={titleFloatRef} className="card-title-float" aria-hidden />}
      {children}
    </div>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl sm:text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 sm:p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 sm:p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
