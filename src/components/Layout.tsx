import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, BookOpen, DollarSign, Clock, BarChart3, Target, Calendar, Users, Download, Plus } from "lucide-react";
import { OKRModal } from "./okr/OKRModal";
import { ChatBot } from "./chat/ChatBot";
import { PlanningDashboard } from "./PlanningDashboard";
import { ReportingDashboard } from "./ReportingDashboard";

interface SidebarItem {
  icon: any;
  label: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    icon: BarChart3,
    label: "Dashboard"
  },
  {
    icon: Settings,
    label: "Organization"
  },
  {
    icon: Target,
    label: "OKR",
    children: [
      { icon: BarChart3, label: "Dashboard" },
      { icon: Target, label: "OKR" },
      { icon: Calendar, label: "Planning and Reporting" }
    ]
  },
  {
    icon: BookOpen,
    label: "Learning & Growth",
    children: [
      { icon: BookOpen, label: "Training Management" }
    ]
  },
  {
    icon: DollarSign,
    label: "Payroll",
    children: [
      { icon: DollarSign, label: "My Payroll" }
    ]
  },
  {
    icon: Clock,
    label: "Time & Attendance",
    children: [
      { icon: Clock, label: "My Timesheet" },
      { icon: Users, label: "Employee Attendance" }
    ]
  }
];

export function Layout() {
  const [expandedItems, setExpandedItems] = useState<string[]>(["OKR"]);
  const [activeItem, setActiveItem] = useState("OKR");
  const [showOKRModal, setShowOKRModal] = useState(false);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const SidebarItemComponent = ({ item, depth = 0 }: { item: SidebarItem; depth?: number }) => {
    const Icon = item.icon;
    const isExpanded = expandedItems.includes(item.label);
    const isActive = activeItem === item.label;
    
    return (
      <div>
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          } ${depth > 0 ? "ml-6" : ""}`}
          onClick={() => {
            if (item.children) {
              toggleExpanded(item.label);
            }
            setActiveItem(item.label);
          }}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm">{item.label}</span>
        </div>
        
        {item.children && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <SidebarItemComponent key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (activeItem === "Planning and Reporting") {
      return (
        <div className="flex">
          <PlanningDashboard />
          {/* <ReportingDashboard /> */}
        </div>
      );
    }

    // Default OKR content
    return (
      <>
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Objective</h1>
                <p className="text-sm text-muted-foreground">Employee's objective setting up</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowOKRModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Set Objective
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <select className="px-3 py-2 border border-border rounded-lg text-sm">
              <option>FY2018</option>
              <option>FY2019</option>
              <option>FY2020</option>
            </select>
            
            <div className="flex flex-col gap-1">
              <select className="px-3 py-1 border border-border rounded text-xs">
                <option>FY-2018 Q1</option>
              </select>
              <select className="px-3 py-1 border border-border rounded text-xs">
                <option>FY-2018 Q2</option>
              </select>
            </div>
            
            <select className="px-3 py-2 border border-border rounded-lg text-sm">
              <option>Filter by Metric Type</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <div className="flex gap-8">
              {["My OKR", "Team OKR", "Company OKR", "All Employee OKR"].map((tab, index) => (
                <button
                  key={tab}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    index === 0
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Objective Cards */}
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Objective */}
          <div className="mt-8 bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              Implement and validate robust data pipelines for 2 selected feature by end of Q1
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4 space-y-6">
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
          {sidebarItems.map((item) => (
            <SidebarItemComponent key={item.label} item={item} />
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* OKR Modal */}
      <OKRModal open={showOKRModal} onOpenChange={setShowOKRModal} />
      
      {/* ChatBot */}
      <ChatBot />
    </div>
  );
}