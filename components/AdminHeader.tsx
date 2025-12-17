"use client";

import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  showBackButton?: boolean;
  rightActions?: ReactNode;
}

export default function AdminHeader({
  title,
  backHref = "/admin",
  backLabel = "Back to Dashboard",
  showBackButton = true,
  rightActions,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h1>
        <div className="flex items-center gap-3">
          {rightActions}
          {showBackButton && (
            <Button variant="outline" size="sm" asChild>
              <Link href={backHref} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </Button>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
