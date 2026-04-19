"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/counselor") || pathname?.startsWith("/admin");

  if (isDashboard) return null;

  return (
    <footer className={cn("py-8 border-t border-border/40 bg-background/50 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">
            Powered by{" "}
            <Link 
              href="https://magnidigitech.com" 
              target="_blank" 
              className="text-foreground hover:text-primary transition-colors border-b border-primary/20 hover:border-primary pb-0.5"
            >
              Magni Digitech
            </Link>
          </p>
        </div>
        
        {/* Hit Counter */}
        <div className="opacity-80 hover:opacity-100 transition-opacity">
          <a href="https://www.hitwebcounter.com/convert-png-to-jpg" target="_blank" rel="noopener noreferrer">
            <img 
              src="https://hitwebcounter.com/counter/counter.php?page=21489906&style=0024&nbdigits=4&type=page&initCount=0"
              title="Visitor Counter"
              alt="Visitor Counter"
              className="h-6"
              style={{ border: 0 }}
            />
          </a>
          <p className="text-[10px] text-center text-muted-foreground mt-1 uppercase tracking-widest font-bold">
            Live Visitors
          </p>
        </div>
        
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest text-center mt-2">
          &copy; {new Date().getFullYear()} Eccho Overseas. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
