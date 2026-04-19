"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/counselor") || pathname?.startsWith("/admin");

  if (isDashboard) return null;

  return (
    <footer className={cn("py-8 border-t border-border/40 bg-background/50 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">
            Powered by
          </p>
          <Link
            href="https://magnidigitech.com"
            target="_blank"
            className="block hover:opacity-100 transition-all hover:scale-120"
          >
            <Image
              src="/images/magni2.png"
              alt="Magni Digitech Logo"
              width={100}
              height={30}
              className="h-8 w-auto object-contain opacity-100 hover:opacity-100 transition-all duration-500"
            />
          </Link>
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
