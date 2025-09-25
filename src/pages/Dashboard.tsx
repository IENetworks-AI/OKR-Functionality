import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

// Mock data - replace with actual API calls
const dashboardData = {
  totalObjectives: 12,
  completedObjectives: 8,
  totalKeyResults: 36,
  completedKeyResults: 24,
  teamMembers: 15,
  activeProjects: 5,
  upcomingDeadlines: 3,
};

const recentActivities = [
  {
    id: 1,
    type: "objective_completed",
    title: "Q4 Revenue Target",
    user: "John Doe",
    timestamp: "2 hours ago",
    status: "completed"
  },
  {
    id: 2,
    type: "key_result_updated",
    title: "Customer Satisfaction Score",
    user: "Jane Smith",
    timestamp: "4 hours ago",
    status: "updated"
  },
  {
    id: 3,
    type: "new_objective",
    title: "Market Expansion",
    user: "Mike Johnson",
    timestamp: "1 day ago",
    status: "created"
  },
];

const teamPerformance = [
  { name: "Sales Team", progress: 85, target: 100 },
  { name: "Engineering", progress: 72, target: 100 },
  { name: "Marketing", progress: 90, target: 100 },
  { name: "HR", progress: 68, target: 100 },
];

export default function Dashboard() {
  const objectiveProgress = (dashboardData.completedObjectives / dashboardData.totalObjectives) * 100;
  const keyResultProgress = (dashboardData.completedKeyResults / dashboardData.totalKeyResults) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your OKR performance and team progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalObjectives}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.completedObjectives} completed
            </p>
            <Progress value={objectiveProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.completedKeyResults} completed
            </p>
            <Progress value={keyResultProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((team, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-muted-foreground">{team.progress}%</span>
                  </div>
                  <Progress value={team.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {activity.status === "completed" && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {activity.status === "updated" && (
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    )}
                    {activity.status === "created" && (
                      <Target className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
