"use client";

import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the AdminHeader component.
 */
interface AdminHeaderProps {
  /** The title to display in the header */
  title: string;
  /** The destination URL for the back button. Defaults to "/admin". */
  backHref?: string;
  /** The text label for the back button. Defaults to "Back to Dashboard". */
  backLabel?: string;
  /** Whether to show the back button. Defaults to true. */
  showBackButton?: boolean;
  /** Optional React nodes to render on the right side of the header (e.g., action buttons) */
  rightActions?: ReactNode;
}

/**
 * AdminHeader Component
 * 
 * A reusable header component specifically designed for administrative views.
 * It provides:
 * - A consistent title layout with gradient styling.
 * - An optional back navigation button.
 * - Integration with the SignOutButton.
 * - Support for additional layout actions on the right side.
 * - Sticky positioning with backdrop-blur effects.
 * 
 * @param props - Component properties (see AdminHeaderProps)
 */
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
            <Button variant="default" size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
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
