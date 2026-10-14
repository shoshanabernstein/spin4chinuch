"use client";

import { useLayoutEffect, useRef } from "react";

export default function WheelLabel({ label, provider, angle, sliceAngle }: {
  label: string;
  provider?: string | null;
  angle: number;
  sliceAngle: number;
}) {
  const textRef = useRef<SVGTextElement>(null);
  const providerRef = useRef<SVGTextElement>(null);
  // Keep the full label between the hub and rim, along the slice's radius.
  const innerRadius = 140;
  const outerRadius = 382;
  const maxWidth = outerRadius - innerRadius;
  const maxHeight = Math.max(1, 2 * innerRadius * Math.sin(Math.min(sliceAngle, 180) * Math.PI / 360) - 4);

  useLayoutEffect(() => {
    let cancelled = false;
    function fitLabel() {
      if (cancelled) return;
      const lineHeight = provider ? Math.max(1, maxHeight / 2 - 1) : maxHeight;
      for (const text of [textRef.current, providerRef.current]) {
        if (!text) continue;
        text.setAttribute("font-size", "34");
        const bounds = text.getBBox();
        const scale = Math.min(1, maxWidth / Math.max(bounds.width, 1), lineHeight / Math.max(bounds.height * 1.05, 1));
        text.setAttribute("font-size", String(34 * scale));
      }
    }
    fitLabel();
    void document.fonts.ready.then(fitLabel);
    return () => { cancelled = true; };
  }, [label, provider, maxWidth, maxHeight]);

  const radius = (innerRadius + outerRadius) / 2;
  const radians = (angle - 90) * Math.PI / 180;
  const rotation = angle > 180 ? angle + 90 : angle - 90;

  return (
    <g transform={`translate(${450 + radius * Math.cos(radians)} ${450 + radius * Math.sin(radians)}) rotate(${rotation})`}>
      <text
        ref={textRef}
        x={0}
        y={provider ? -maxHeight / 4 : 0}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={34}
        fontWeight={750}
        filter="url(#labelShadow)"
      >
        {label}
      </text>
      {provider && (
        <>
          <line x1={-maxWidth * 0.35} x2={maxWidth * 0.35} y1={0} y2={0} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
          <text
            ref={providerRef}
            x={0}
            y={maxHeight / 4}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={34}
            fontWeight={600}
            filter="url(#labelShadow)"
          >
            {provider}
          </text>
        </>
      )}
    </g>
  );
}
