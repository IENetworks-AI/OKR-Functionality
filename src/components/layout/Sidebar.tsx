import { useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { SIDEBAR_ITEMS } from "@/constants/routes";
import { 
  BarChart3, 
  Settings, 
  Target, 
  BookOpen, 
  DollarSign, 
  Clock, 
  Calendar, 
  Users,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for dynamic icon rendering
const iconMap = {
  BarChart3,
  Settings,
  Target,
  BookOpen,
  DollarSign,
  Clock,
  Calendar,
  Users,
} as const;

interface SidebarItem {
  id: string;
  label: string;
  path?: string;
  icon: keyof typeof iconMap;
  children?: SidebarItem[];
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["okr"]);
  const { navigateTo, isActiveRoute, isParentRoute } = useNavigation();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else if (item.path) {
      navigateTo(item.path);
    }
  };

  const SidebarItemComponent = ({ item, depth = 0 }: { item: SidebarItem; depth?: number }) => {
    const Icon = iconMap[item.icon];
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path ? isActiveRoute(item.path) : false;
    const isParentActive = item.children ? isParentRoute(item.path || '') : false;
    
    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : isParentActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            depth > 0 ? "ml-6" : ""
          )}
          onClick={() => handleItemClick(item)}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm flex-1">{item.label}</span>
          {item.children && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          )}
        </div>
        
        {item.children && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <SidebarItemComponent key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-64 bg-card border-r border-border p-4 space-y-6", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/2d567e40-963a-4be7-aacd-f6669ccd6bdf.png" 
          alt="Selam Logo" 
          className="w-8 h-8 rounded-lg"
        />
        <span className="font-semibold">SelamNew Workspace</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarItemComponent key={item.id} item={item} />
        ))}
      </nav>
    </div>
  );
}
