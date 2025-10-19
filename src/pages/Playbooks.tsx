import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Calendar, Trash2, MessageSquare } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Playbooks = () => {
  const navigate = useNavigate();
  const [plaibooks, setPlaibooks] = useLocalStorage<Plaibook[]>("plaibooks", []);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreateNew = () => {
    const newPlaibook: Plaibook = {
      id: crypto.randomUUID(),
      title: "Untitled Playbook",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      questions: [],
    };

    setPlaibooks([...plaibooks, newPlaibook]);
    navigate(`/doc/${newPlaibook.id}`);
  };

  const handleDelete = () => {
    if (deleteId) {
      setPlaibooks(plaibooks.filter((pb) => pb.id !== deleteId));
      setDeleteId(null);
    }
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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Playbooks</h1>
            <p className="text-muted-foreground mt-2">
              Manage and organize your evaluation playbooks
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Playbook
          </Button>
        </div>

        {plaibooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No playbooks yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first playbook to start organizing your evaluation questions and answers
              </p>
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Playbook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plaibooks.map((plaibook) => {
              const stats = getQuestionStats(plaibook);
              return (
                <Card
                  key={plaibook.id}
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/doc/${plaibook.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-2 flex-1">{plaibook.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(plaibook.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(plaibook.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium">{stats.answered}</span>
                        <span className="text-muted-foreground"> / {stats.total} questions answered</span>
                      </span>
                    </div>
                    {plaibook.content && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {plaibook.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="flex gap-2 w-full">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: stats.total > 0 ? `${(stats.answered / stats.total) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0}% complete
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playbook? This action cannot be undone and will
              remove all associated questions and answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Playbooks;
