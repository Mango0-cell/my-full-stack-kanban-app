"use client";
import { FC, CSSProperties } from "react";

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  bgColor?: string;
}

interface CustomCSSProperties extends CSSProperties {
  "--after-duration": string;
  "--before-duration": string;
  "--after-shadow": string;
  "--before-shadow": string;
}

const GlitchText: FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = "",
  bgColor = "#0f1117",
}) => {
  const inlineStyles: CustomCSSProperties = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    "--after-shadow": enableShadows ? "-5px 0 red" : "none",
    "--before-shadow": enableShadows ? "5px 0 cyan" : "none",
  };

  const bg = `bg-[${bgColor}]`;

  const baseClasses =
    "text-white text-[clamp(2rem,10vw,8rem)] font-black relative mx-auto select-none cursor-pointer";

  const pseudoClasses = !enableOnHover
    ? `after:content-[attr(data-text)] after:absolute after:top-0 after:left-[10px] after:text-white after:${bg} after:overflow-hidden after:[clip-path:inset(0_0_0_0)] after:[text-shadow:var(--after-shadow)] after:[animation:glitch_var(--after-duration)_infinite_linear_alternate-reverse] ` +
      `before:content-[attr(data-text)] before:absolute before:top-0 before:left-[-10px] before:text-white before:${bg} before:overflow-hidden before:[clip-path:inset(0_0_0_0)] before:[text-shadow:var(--before-shadow)] before:[animation:glitch_var(--before-duration)_infinite_linear_alternate-reverse]`
    : `after:content-[''] after:absolute after:top-0 after:left-[10px] after:text-white after:${bg} after:overflow-hidden after:[clip-path:inset(0_0_0_0)] after:opacity-0 ` +
      `before:content-[''] before:absolute before:top-0 before:left-[-10px] before:text-white before:${bg} before:overflow-hidden before:[clip-path:inset(0_0_0_0)] before:opacity-0 ` +
      `hover:after:content-[attr(data-text)] hover:after:opacity-100 hover:after:[text-shadow:var(--after-shadow)] hover:after:[animation:glitch_var(--after-duration)_infinite_linear_alternate-reverse] ` +
      `hover:before:content-[attr(data-text)] hover:before:opacity-100 hover:before:[text-shadow:var(--before-shadow)] hover:before:[animation:glitch_var(--before-duration)_infinite_linear_alternate-reverse]`;

  const combinedClasses = `${baseClasses} ${pseudoClasses} ${className}`;

  return (
    <div style={inlineStyles} data-text={children} className={combinedClasses}>
      {children}
    </div>
  );
};

export default GlitchText;
