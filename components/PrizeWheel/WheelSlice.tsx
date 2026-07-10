"use client";

type WheelSliceProps = {
  startAngle: number;
  endAngle: number;
  radius: number;
  gradientIndex: number;
};

function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angle: number
) {
    const rad = ((angle - 90) * Math.PI) / 180;

    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}


export default function WheelSlice({
  startAngle,
  endAngle,
  radius,
  gradientIndex,
}: WheelSliceProps)
{
    const center = 450;

    const start = polarToCartesian(
        center,
        center,
        radius,
        endAngle
    );

    const end = polarToCartesian(
        center,
        center,
        radius,
        startAngle
    );

    const largeArc =
        endAngle - startAngle <= 180 ? "0" : "1";

    const d = `
    M ${center} ${center}
    L ${start.x} ${start.y}
    A ${radius} ${radius}
      0 ${largeArc} 0
      ${end.x} ${end.y}
    Z
  `;

    return (
        <path
            d={d}
            fill={`url(#sliceGradient${gradientIndex})`}
            stroke="#ffffff"
            strokeWidth="3"
        />
    );
}
