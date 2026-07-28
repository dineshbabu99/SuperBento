import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Row 1 */}
        <rect x="5" y="5" width="24" height="24" rx="6" fill="#0056A8" />
        <rect x="38" y="5" width="24" height="24" rx="6" fill="#0056A8" />
        {/* Yellow Rectangle spanning Row 1 & 2 */}
        <rect x="71" y="5" width="24" height="57" rx="6" fill="#F3C623" />
        
        {/* Row 2 */}
        <rect x="5" y="38" width="24" height="24" rx="6" fill="#0056A8" />
        <rect x="38" y="38" width="24" height="24" rx="6" fill="#0056A8" />
        
        {/* Row 3 */}
        <rect x="5" y="71" width="24" height="24" rx="6" fill="#0056A8" />
        <rect x="38" y="71" width="24" height="24" rx="6" fill="#0056A8" />
        <rect x="71" y="71" width="24" height="24" rx="6" fill="#0056A8" />
      </svg>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-black text-[15px] leading-none tracking-tighter text-foreground">
            SUPER BENTO
          </span>
          <span className="text-[7px] font-bold text-primary tracking-widest leading-none mt-[2px]">
            THE OTHER HALF.
          </span>
        </div>
      )}
    </div>
  );
};
