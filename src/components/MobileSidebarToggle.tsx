"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSidebarToggleProps {
  onClick: () => void;
}

export function MobileSidebarToggle({ onClick }: MobileSidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden h-8 w-8"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">打开侧边栏</span>
    </Button>
  );
}
