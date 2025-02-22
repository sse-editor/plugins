import React from "react";

interface SvgLineProps {
  thicnkness: number;
}

const SvgThickness: React.FC<SvgLineProps> = ({ thicnkness }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={thicnkness}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

export default SvgThickness