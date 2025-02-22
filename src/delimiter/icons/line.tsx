import React from "react";

interface SvgLineProps {
  width: number;
}

const SvgLine: React.FC<SvgLineProps> = ({ width }) => {
  let x: number;
  let y: number;

  if (width === 8) {
    x = 10;
    y = 14;
  } else if (width === 15) {
    x = 9;
    y = 15;
  } else if (width === 25) {
    x = 8;
    y = 16;
  } else if (width === 35) {
    x = 7;
    y = 17;
  } else if (width === 50) {
    x = 6;
    y = 18;
  } else if (width === 60) {
    x = 5;
    y = 19;
  } else {
    // 100% width
    x = 4;
    y = 20;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={x} y1={12} x2={y} y2={12} />
    </svg>
  );
};

export default SvgLine
