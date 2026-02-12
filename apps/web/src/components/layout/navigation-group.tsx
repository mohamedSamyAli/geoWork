import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  to: string;
  items?: NavItem[];
  defaultOpen?: boolean;
}

interface NavigationGroupProps {
  group: NavGroup;
  isSidebarCollapsed?: boolean;
}

export function NavigationGroup({ group, isSidebarCollapsed }: NavigationGroupProps) {
  const { label, icon: GroupIcon, to, items = [] } = group;
  const location = useLocation();

  // If no items or only one item, render as a simple nav link (not collapsible)
  if (items.length <= 1) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )
        }
        title={isSidebarCollapsed ? label : undefined}
      >
        <GroupIcon className="h-4 w-4 shrink-0" />
        {!isSidebarCollapsed && label}
      </NavLink>
    );
  }

  // Multiple items: render as collapsible accordion
  const [isOpen, setIsOpen] = React.useState(group.defaultOpen ?? false);

  const hasActiveChild = items.some(
    (item) => location.pathname === item.to
  );

  // Auto-expand if any child is active
  React.useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  function handleArrowClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  }

  return (
    <Collapsible open={isOpen && !isSidebarCollapsed} onOpenChange={setIsOpen}>
      <div className="space-y-1">
        {/* Group label: clickable for navigation */}
        <NavLink
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive || hasActiveChild
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
          title={isSidebarCollapsed ? label : undefined}
        >
          <GroupIcon className="h-4 w-4 shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left">{label}</span>
              {/* Arrow: separate click handler for toggling */}
              <button
                type="button"
                onClick={handleArrowClick}
                className={cn(
                  "shrink-0 rounded p-0.5 hover:bg-accent-foreground/10",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </button>
            </>
          )}
        </NavLink>

        {/* Children */}
        {!isSidebarCollapsed && (
          <CollapsibleContent className="space-y-1 pl-4">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
