import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, CheckCircle, Clock, TrendingUp, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "completed" | "paused";
  createdAt: number;
  totalTests: number;
  completedTests: number;
  successRate: number;
  playbookId?: string;
}

const Experiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: "1",
      name: "Q&A Accuracy Test",
      description: "Testing question generation accuracy across different prompts",
      status: "completed",
      createdAt: Date.now() - 86400000 * 2,
      totalTests: 50,
      completedTests: 50,
      successRate: 94,
    },
    {
      id: "2",
      name: "Answer Quality Comparison",
      description: "Comparing different system prompts for answer generation",
      status: "running",
      createdAt: Date.now() - 86400000,
      totalTests: 30,
      completedTests: 18,
      successRate: 87,
    },
    {
      id: "3",
      name: "Tone Analysis",
      description: "Evaluating response tone variations",
      status: "draft",
      createdAt: Date.now(),
      totalTests: 40,
      completedTests: 0,
      successRate: 0,
    },
  ]);

  const getStatusIcon = (status: Experiment["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Experiment["status"]) => {
    const variants: Record<Experiment["status"], string> = {
      draft: "secondary",
      running: "default",
      completed: "outline",
      paused: "secondary",
    };

    return (
      <Badge variant={variants[status] as any} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCreateExperiment = () => {
    // Placeholder for create experiment logic
    console.log("Create new experiment");
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Experiments</h1>
            <p className="text-muted-foreground mt-2">
              Run batch evaluations and A/B tests on your playbooks
            </p>
          </div>
          <Button onClick={handleCreateExperiment} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Experiment
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{experiments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {experiments.filter((e) => e.status === "running").length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {experiments.reduce((sum, exp) => sum + exp.completedTests, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {experiments.reduce((sum, exp) => sum + exp.totalTests, 0)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  experiments.reduce((sum, exp) => sum + exp.successRate, 0) / experiments.length
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all experiments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Experiments</CardTitle>
            <CardDescription>
              Track and manage your evaluation experiments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{experiment.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {experiment.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(experiment.status)}
                        {getStatusBadge(experiment.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[150px]">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {experiment.completedTests}/{experiment.totalTests}
                          </span>
                          <span className="font-medium">
                            {Math.round((experiment.completedTests / experiment.totalTests) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={(experiment.completedTests / experiment.totalTests) * 100}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{experiment.successRate}%</span>
                        {experiment.successRate >= 90 && (
                          <Badge variant="outline" className="text-green-600">
                            Excellent
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(experiment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to experiment?</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create a new experiment to run batch evaluations, test different prompts, or compare
              answer quality across your playbooks
            </p>
            <Button onClick={handleCreateExperiment}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Experiment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Experiments;
