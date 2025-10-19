import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plaibook } from "@/lib/types";
import { getAllPlaibooks } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Published = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plaibook, setPlaibook] = useState<Plaibook | null>(null);
  const [showDataSource, setShowDataSource] = useState(false);

  useEffect(() => {
    const plaibooks = getAllPlaibooks();
    const found = plaibooks.find((p) => p.id === id);
    if (found) {
      setPlaibook(found);
    }
  }, [id]);

  if (!plaibook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Plaibook not found</h2>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{plaibook.title}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDataSource(true)}
          >
            <Database className="h-4 w-4 mr-2" />
            View Data Source
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {plaibook.questions && plaibook.questions.length > 0 ? (
            plaibook.questions.map((question, idx) => (
              <div
                key={question.id}
                className="border rounded-lg p-6 space-y-4 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-sm text-primary">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-semibold">{question.question}</h3>
                    {question.answer && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed">{question.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questions available yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Data Source Dialog */}
      <Dialog open={showDataSource} onOpenChange={setShowDataSource}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Source</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div 
              className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: plaibook.content }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Published;
