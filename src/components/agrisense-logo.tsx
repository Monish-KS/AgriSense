
import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
}

export function AgriSenseLogo({ showText = true, className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="h-8 w-8 rounded-md flex items-center justify-center bg-agrisense-primary text-agrisense-primary">
        <LeafIcon className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <span className="font-semibold text-xl text-agrisense-primary">
          AgriSense
        </span>
      )}
    </div>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 22c1.25-1.25 2.5-2.5 3.5-4 .83-1.25 1.5-2.5 2-4 .5-1.5.8-3 1-4.5.2-1.5.3-3 .3-4.5 0 0 1.5 0 2.5.5s2 1.5 3 3 1.5 2.5 2 4c.5 1.5.5 3 .5 4.5m-5-4.5c-.5-1.5-1-2-2-2.5m9 7c-1-1-1.5-2-1.5-3.5s.5-2.5 1.5-3.5 2-1.5 3.5-1.5h.5" />
    </svg>
  );
}
