"use client";

import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { ReactNode } from "react";

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
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4">
            {rightActions}
            {showBackButton && (
              <Link
                href={backHref}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {backLabel}
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
