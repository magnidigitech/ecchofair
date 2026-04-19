"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, noLink = false }: { className?: string, noLink?: boolean }) {
  const content = (
    <div className="relative w-48 h-12">
      <Image
        src="/images/logo.png"
        alt="Eccho Overseas Logo"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  );

  if (noLink) {
    return <div className={cn("block", className)}>{content}</div>;
  }

  return (
    <Link href="/" className={cn("block hover:opacity-90 transition-opacity", className)}>
      {content}
    </Link>
  );
}
