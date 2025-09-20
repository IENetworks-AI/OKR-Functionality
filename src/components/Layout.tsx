
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, BookOpen, DollarSign, Clock, BarChart3, Target, Calendar, Users, Download, Plus, Edit2, RefreshCw } from "lucide-react";
import { OKRModal } from "./okr/OKRModal";
import { ChatBot } from "./chat/ChatBot";
import { PlanningDashboard } from "./PlanningDashboard";
import { ReportingDashboard } from "./ReportingDashboard";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAIObjectiveAndKeyResults } from "@/lib/okrAi";

interface SidebarItem {
  icon: any;
  label: string;
  children?: SidebarItem[];
}

interface Objective {
  id: string;
  title: string;
  alignment: string;
  deadline?: Date;
  keyResults: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  metricType: "milestone" | "percentage" | "numeric" | "currency" | "achieved";
  targetValue: number;
  currentValue: number;
  weight: number;
  completed: boolean;
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
  const [currentOKR, setCurrentOKR] = useState<Objective | undefined>(undefined);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activeTab, setActiveTab] = useState("My OKR");

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

  const handleSaveOKR = (savedOkr: any) => {
    const incoming: Objective[] = (savedOkr?.objectives || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      alignment: o.alignment || "",
      deadline: savedOkr.deadline,
      keyResults: o.keyResults || [],
    }));

    if (currentOKR) {
      // Replace current objective with the edited one (use first incoming if multiple)
      const replacement = incoming[0] || {
        id: currentOKR.id,
        title: currentOKR.title,
        alignment: currentOKR.alignment || "",
        deadline: savedOkr.deadline ?? currentOKR.deadline,
        keyResults: currentOKR.keyResults || [],
      };

      const remaining = incoming.slice(1);

      setObjectives(prev => {
        const updated = prev.map(obj => (obj.id === currentOKR.id ? replacement : obj));
        // Append any additional new objectives that don't already exist
        const additional = remaining.filter(n => !updated.some(u => u.id === n.id));
        return [...updated, ...additional];
      });
    } else {
      // Creating new: append all incoming objectives
      setObjectives(prev => [...prev, ...incoming]);
    }

    setCurrentOKR(undefined);
    setShowOKRModal(false);
  };

  const handleEditOKR = (okr: Objective) => {
    setCurrentOKR(okr);
    setShowOKRModal(true);
  };

  const handleRegenerateOKR = async (objective: Objective) => {
    const { title, keyResults } = await generateAIObjectiveAndKeyResults(objective.title, false);
    setObjectives(prev => prev.map(o => o.id === objective.id ? { ...o, title, keyResults } : o));
  };

  const calculateProgress = (keyResult: KeyResult): number => {
    if (keyResult.metricType === "milestone" || keyResult.metricType === "achieved") {
      return keyResult.completed ? 100 : 0;
    }
    
    if (keyResult.targetValue === 0) return 0;
    
    return Math.min(100, Math.round((keyResult.currentValue / keyResult.targetValue) * 100));
  };

  const calculateObjectiveProgress = (objective: Objective): number => {
    if (!objective.keyResults.length) return 0;
    
    const totalWeight = objective.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedProgress = objective.keyResults.reduce((sum, kr) => {
      return sum + (calculateProgress(kr) * kr.weight);
    }, 0);
    
    return Math.round(weightedProgress / totalWeight);
  };

  const formatMetricValue = (keyResult: KeyResult): string => {
    switch (keyResult.metricType) {
      case "milestone":
        return keyResult.completed ? "Completed" : "Not Completed";
      case "percentage":
        return `${keyResult.currentValue}% / ${keyResult.targetValue}%`;
      case "currency":
        return `$${keyResult.currentValue} / $${keyResult.targetValue}`;
      case "achieved":
        return keyResult.completed ? "Achieved" : "Not Achieved";
      default:
        return `${keyResult.currentValue} / ${keyResult.targetValue}`;
    }
  };

  const renderContent = () => {
    if (activeItem === "Planning and Reporting") {
      return (
        <div className="flex-1">
          <PlanningDashboard />
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
                <h1 className="text-xl font-semibold">Objectives and Key Results</h1>
                <p className="text-sm text-muted-foreground">Employee's objective setting up</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => {
                setCurrentOKR(undefined);
                setShowOKRModal(true);
              }}>
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
            <Select defaultValue="FY2018">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FY2018">FY2018</SelectItem>
                <SelectItem value="FY2019">FY2019</SelectItem>
                <SelectItem value="FY2020">FY2020</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex flex-col gap-1">
              <Select defaultValue="FY-2018 Q1">
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FY-2018 Q1">FY-2018 Q1</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="FY-2018 Q2">
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FY-2018 Q2">FY-2018 Q2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Metric Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="achieved">Achieved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <div className="flex gap-8">
              {["My OKR", "Team OKR", "Company OKR", "All Employee OKR"].map((tab) => (
                <button
                  key={tab}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Objective Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.length > 0 ? (
              objectives.map((objective, index) => (
                <div key={objective.id} className="bg-card border border-border rounded-lg p-6 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-10 h-8 w-8"
                    onClick={() => handleRegenerateOKR(objective)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => handleEditOKR(objective)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <h3 className="font-semibold mb-2 text-lg">{objective.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">Aligned to: {objective.alignment}</p>
                  {objective.deadline && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Deadline: {format(objective.deadline, "PPP")}
                    </p>
                  )}
                  
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{calculateObjectiveProgress(objective)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${calculateObjectiveProgress(objective)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3">Key Results:</h4>
                    <div className="space-y-3">
                      {objective.keyResults.map((kr) => (
                        <div key={kr.id} className="text-sm">
                          <div className="font-medium mb-1">{kr.title}</div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {formatMetricValue(kr)} ({kr.weight}%)
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              calculateProgress(kr) === 100 
                                ? "bg-green-100 text-green-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {calculateProgress(kr)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${calculateProgress(kr)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3].map((item) => (
                <div key={item} className="bg-card border border-border rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="h-3 bg-muted rounded animate-pulse w-full mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))
            )}
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
      <OKRModal 
        open={showOKRModal} 
        onOpenChange={setShowOKRModal}
        onSave={handleSaveOKR}
        existingOKR={currentOKR}
      />
      
      {/* ChatBot */}
      <ChatBot />
    </div>
  );
}