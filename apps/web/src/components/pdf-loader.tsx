"use client";

export function PdfLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Animated book + infinity loader */}
      <div className="relative w-24 h-24">
        {/* Glowing backdrop */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse" />
        
        {/* Infinity path animation */}
        <svg
          viewBox="0 0 100 50"
          className="absolute inset-0 w-full h-full"
          style={{ top: "10%", height: "80%" }}
        >
          <path
            d="M25,25 C25,10 10,10 10,25 C10,40 25,40 25,25 C25,10 40,10 40,25 C40,40 25,40 25,25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-primary/20"
            transform="translate(25, 0) scale(1.2)"
          />
          <path
            d="M25,25 C25,10 10,10 10,25 C10,40 25,40 25,25 C25,10 40,10 40,25 C40,40 25,40 25,25"
            fill="none"
            stroke="url(#infinityGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset="120"
            transform="translate(25, 0) scale(1.2)"
            className="animate-infinity-trace"
          />
          <defs>
            <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(260, 80%, 70%)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Book icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative animate-book-float">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Book spine */}
              <path
                d="M12 4 L12 20"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              {/* Left page */}
              <path
                d="M4 6 C4 4.5 7 3.5 12 4 L12 20 C7 19.5 4 18.5 4 17 Z"
                fill="hsl(var(--primary))"
                fillOpacity="0.15"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="animate-page-left"
              />
              {/* Right page */}
              <path
                d="M20 6 C20 4.5 17 3.5 12 4 L12 20 C17 19.5 20 18.5 20 17 Z"
                fill="hsl(var(--primary))"
                fillOpacity="0.08"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="animate-page-right"
              />
              {/* Text lines on left page */}
              <line x1="6.5" y1="8" x2="10.5" y2="8" stroke="hsl(var(--primary))" strokeWidth="0.8" strokeOpacity="0.3" strokeLinecap="round" className="animate-text-line-1" />
              <line x1="6.5" y1="10.5" x2="9.5" y2="10.5" stroke="hsl(var(--primary))" strokeWidth="0.8" strokeOpacity="0.3" strokeLinecap="round" className="animate-text-line-2" />
              <line x1="6.5" y1="13" x2="10" y2="13" stroke="hsl(var(--primary))" strokeWidth="0.8" strokeOpacity="0.3" strokeLinecap="round" className="animate-text-line-3" />
              {/* Text lines on right page */}
              <line x1="13.5" y1="8" x2="17.5" y2="8" stroke="hsl(var(--primary))" strokeWidth="0.8" strokeOpacity="0.2" strokeLinecap="round" className="animate-text-line-1" />
              <line x1="13.5" y1="10.5" x2="16.5" y2="10.5" stroke="hsl(var(--primary))" strokeWidth="0.8" strokeOpacity="0.2" strokeLinecap="round" className="animate-text-line-2" />
              <line x1="13.5" y1="13" x2="17" y2="13" stroke="hsl(var(--primary))" strokeWidth="0.8" strokeOpacity="0.2" strokeLinecap="round" className="animate-text-line-3" />
            </svg>
          </div>
        </div>

        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s" }}>
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 -ml-0.75 rounded-full bg-primary/60 blur-[1px]" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s", animationDirection: "reverse" }}>
          <div className="absolute bottom-1 right-2 w-1 h-1 rounded-full bg-violet-400/50 blur-[1px]" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium text-foreground/80 animate-pulse">Loading Document</p>
        <div className="flex items-center justify-center gap-1">
          <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes infinity-trace {
          0% { stroke-dashoffset: 240; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-infinity-trace {
          animation: infinity-trace 2.5s ease-in-out infinite;
        }
        @keyframes book-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .animate-book-float {
          animation: book-float 2s ease-in-out infinite;
        }
        @keyframes page-left {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.97); }
        }
        .animate-page-left {
          animation: page-left 3s ease-in-out infinite;
          transform-origin: right center;
        }
        @keyframes page-right {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.03); }
        }
        .animate-page-right {
          animation: page-right 3s ease-in-out infinite;
          transform-origin: left center;
        }
        @keyframes text-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .animate-text-line-1 { animation: text-line 2s ease-in-out infinite; animation-delay: 0ms; }
        .animate-text-line-2 { animation: text-line 2s ease-in-out infinite; animation-delay: 300ms; }
        .animate-text-line-3 { animation: text-line 2s ease-in-out infinite; animation-delay: 600ms; }
      `}</style>
    </div>
  );
}
