import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Target, CheckCircle, Clock, AlertCircle, Users } from "lucide-react";

interface ReportingMetric {
  title: string;
  value: number;
  target: number;
  trend: "up" | "down" | "stable";
  period: "Daily" | "Weekly" | "Monthly";
  status: "on-track" | "behind" | "ahead";
}

const reportingData: ReportingMetric[] = [
  {
    title: "AI/ML Data Pipeline Completion",
    value: 67.5,
    target: 80,
    trend: "up",
    period: "Daily",
    status: "behind"
  },
  {
    title: "Model Training Progress",
    value: 85,
    target: 75,
    trend: "up",
    period: "Weekly", 
    status: "ahead"
  },
  {
    title: "Feature Engineering Tasks",
    value: 40,
    target: 60,
    trend: "down",
    period: "Monthly",
    status: "behind"
  },
  {
    title: "Code Review & Documentation",
    value: 92,
    target: 90,
    trend: "stable",
    period: "Daily",
    status: "on-track"
  },
  {
    title: "Infrastructure Optimization",
    value: 58,
    target: 70,
    trend: "up",
    period: "Weekly",
    status: "behind"
  },
  {
    title: "Research & Development",
    value: 73,
    target: 65,
    trend: "up",
    period: "Monthly",
    status: "ahead"
  }
];

const teamPerformanceData = [
  { name: "Miklas A.", role: "AI and Data Science", completed: 8, total: 12, efficiency: 85 },
  { name: "Sarah Chen", role: "Machine Learning Engineer", completed: 15, total: 18, efficiency: 92 },
  { name: "David Kumar", role: "Data Engineer", completed: 11, total: 16, efficiency: 78 }
];

export function ReportingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"All" | "Daily" | "Weekly" | "Monthly">("All");
  const [selectedMetric, setSelectedMetric] = useState("overview");

  const filteredData = selectedPeriod === "All" 
    ? reportingData 
    : reportingData.filter(item => item.period === selectedPeriod);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ahead": return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "behind": return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "on-track": return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead": return "bg-green-100 text-green-800 border-green-200";
      case "behind": return "bg-red-100 text-red-800 border-red-200";
      case "on-track": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-3 h-3 text-green-600" />;
      case "down": return <TrendingDown className="w-3 h-3 text-red-600" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const averageCompletion = filteredData.reduce((sum, item) => sum + item.value, 0) / filteredData.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={(value: "All" | "Daily" | "Weekly" | "Monthly") => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Periods</SelectItem>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{averageCompletion.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">Overall Progress</p>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((metric, index) => (
          <Card key={index} className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.trend)}
                  <Badge variant="secondary" className="text-xs">
                    {metric.period}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{metric.value}%</span>
                  <span className="text-sm text-muted-foreground">/ {metric.target}% target</span>
                </div>
                
                <Progress value={metric.value} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(metric.status)} text-xs`}>
                    {getStatusIcon(metric.status)}
                    <span className="ml-1 capitalize">{metric.status.replace('-', ' ')}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {metric.value >= metric.target ? 
                      `+${(metric.value - metric.target).toFixed(1)}%` : 
                      `-${(metric.target - metric.value).toFixed(1)}%`
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformanceData.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{member.name}</h4>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold">{member.completed}/{member.total}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{member.efficiency}%</p>
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                  </div>
                  
                  <div className="w-24">
                    <Progress value={(member.completed / member.total) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {((member.completed / member.total) * 100).toFixed(0)}% Complete
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            AI-Powered Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-blue-900">Performance Insights</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Daily pipeline tasks showing 15% improvement over last week
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Weekly model training efficiency up 22% with new optimization
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Monthly feature engineering needs acceleration to meet Q4 goals
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-blue-900">Recommendations</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  Prioritize automated testing for model deployment pipeline
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  Schedule additional sync sessions between AI and engineering teams
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  Consider resource reallocation for feature development tasks
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}