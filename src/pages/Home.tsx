import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook, SavedQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, FileText, MessageSquare, CheckCircle, TrendingUp, Clock, ArrowRight, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Home = () => {
  const navigate = useNavigate();
  const [plaibooks] = useLocalStorage<Plaibook[]>("plaibooks", []);
  const [stats, setStats] = useState({
    totalPlaibooks: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    avgCompletionRate: 0,
  });
  const [recentPlaibooks, setRecentPlaibooks] = useState<Plaibook[]>([]);

  useEffect(() => {
    calculateStats();
    loadRecentPlaibooks();
  }, [plaibooks]);

  const calculateStats = () => {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    plaibooks.forEach((plaibook: Plaibook) => {
      if (plaibook.questions) {
        totalQuestions += plaibook.questions.length;
        answeredQuestions += plaibook.questions.filter((q: SavedQuestion) => q.answer).length;
      }
    });

    const avgCompletion = totalQuestions > 0 
      ? Math.round((answeredQuestions / totalQuestions) * 100) 
      : 0;

    setStats({
      totalPlaibooks: plaibooks.length,
      totalQuestions,
      answeredQuestions,
      avgCompletionRate: avgCompletion,
    });
  };

  const loadRecentPlaibooks = () => {
    const sorted = [...plaibooks].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
    setRecentPlaibooks(sorted);
  };

  const handleCreateNew = () => {
    const newPlaibook: Plaibook = {
      id: crypto.randomUUID(),
      title: "Untitled Playbook",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      questions: [],
    };

    const updatedPlaibooks = [...plaibooks, newPlaibook];
    localStorage.setItem("plaibooks", JSON.stringify(updatedPlaibooks));
    navigate(`/doc/${newPlaibook.id}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getQuestionStats = (plaibook: Plaibook) => {
    const total = plaibook.questions?.length || 0;
    const answered = plaibook.questions?.filter((q) => q.answer).length || 0;
    return { total, answered };
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl space-y-8">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="search all playbooks or questions"
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playbooks</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlaibooks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Knowledge bases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Evaluation questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.answeredQuestions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.totalQuestions} questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCompletionRate}%</div>
              <Progress value={stats.avgCompletionRate} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCreateNew}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Playbook
              </CardTitle>
              <CardDescription>
                Start a new knowledge base with AI evaluation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/playbooks')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                View All Playbooks
              </CardTitle>
              <CardDescription>
                Manage and organize your playbooks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/monitor')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                View Analytics
              </CardTitle>
              <CardDescription>
                Check performance and insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Playbooks */}
        {recentPlaibooks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Playbooks</CardTitle>
                  <CardDescription>Your most recently updated playbooks</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => navigate('/playbooks')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPlaibooks.map((plaibook) => {
                  const stats = getQuestionStats(plaibook);
                  return (
                    <div
                      key={plaibook.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/doc/${plaibook.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{plaibook.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(plaibook.updatedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {stats.answered}/{stats.total} answered
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0}%
                          </div>
                          <Progress 
                            value={stats.total > 0 ? (stats.answered / stats.total) * 100 : 0} 
                            className="w-20 h-2 mt-1"
                          />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {plaibooks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Oplai</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first playbook to start building your AI evaluation workspace
              </p>
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Playbook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Home;
