"use client";

import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilePlus, List, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const dashboardCards = [
    {
      href: "/admin/create",
      title: "Create Work Order",
      description: "Create a new work order with full administrative control.",
      icon: FilePlus,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-600",
    },
    {
      href: "/admin/list",
      title: "List All Orders",
      description: "View and manage all active and past work orders.",
      icon: List,
      gradient: "from-green-500 to-green-600",
      iconColor: "text-green-600",
    },
    {
      href: "/admin/search",
      title: "Find Order by #",
      description: "Quickly lookup a specific work order by its unique ID.",
      icon: Search,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-600",
    },
    {
      href: "/admin/add-user",
      title: "Add User",
      description: "Add a new user to the system.",
      icon: UserPlus,
      gradient: "from-orange-500 to-orange-600",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader title="Admin Dashboard" showBackButton={false} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/20 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "p-3 rounded-lg bg-gradient-to-br",
                          card.gradient,
                          "bg-opacity-10"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", card.iconColor)} />
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
