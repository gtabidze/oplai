import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook } from "@/lib/types";
import { ExperimentSidebar } from "@/components/ExperimentSidebar";
import { ActiveUsers } from "@/components/ActiveUsers";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Eye, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plaibooks, setPlaibooks] = useLocalStorage<Plaibook[]>('plaibooks', []);
  const [currentPlaibook, setCurrentPlaibook] = useState<Plaibook | null>(null);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your AI agent's knowledge base...",
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html); // Update state immediately
      if (!currentPlaibook) return;
      
      const timer = setTimeout(() => {
        const updatedPlaibooks = plaibooks.map((p) =>
          p.id === currentPlaibook.id
            ? { ...p, content: html, updatedAt: Date.now() }
            : p
        );
        setPlaibooks(updatedPlaibooks);
        setCurrentPlaibook(prev => prev ? { ...prev, content: html, updatedAt: Date.now() } : null);
      }, 500);
      
      return () => clearTimeout(timer);
    },
  });

  useEffect(() => {
    const plaibook = plaibooks.find((p) => p.id === id);
    if (plaibook) {
      // Ensure user_id is set for existing playbooks
      if (!plaibook.user_id) {
        const updatedPlaibook = { ...plaibook, user_id: user?.id || '' };
        const updatedPlaibooks = plaibooks.map((p) =>
          p.id === id ? updatedPlaibook : p
        );
        setPlaibooks(updatedPlaibooks);
        setCurrentPlaibook(updatedPlaibook);
      } else {
        setCurrentPlaibook(plaibook);
      }
      
      setTitle(plaibook.title);
      setEditorContent(plaibook.content);
      if (editor && !editor.isFocused) {
        editor.commands.setContent(plaibook.content);
      }
    } else {
      navigate('/');
    }
  }, [id, navigate, editor]);

  useEffect(() => {
    if (!currentPlaibook) return;

    const timer = setTimeout(() => {
      const updatedPlaibooks = plaibooks.map((p) =>
        p.id === currentPlaibook.id
          ? { ...p, title, updatedAt: Date.now() }
          : p
      );
      setPlaibooks(updatedPlaibooks);
    }, 500);

    return () => clearTimeout(timer);
  }, [title, currentPlaibook?.id]);

  const handleUpdateQuestions = (questions: any[]) => {
    if (!currentPlaibook) return;
    
    const updatedPlaibooks = plaibooks.map((p) =>
      p.id === currentPlaibook.id
        ? { ...p, questions, updatedAt: Date.now() }
        : p
    );
    setPlaibooks(updatedPlaibooks);
    setCurrentPlaibook({ ...currentPlaibook, questions });
  };

  const handleUpdateDocuments = (docIds: string[]) => {
    if (!currentPlaibook) return;
    
    const updatedPlaibooks = plaibooks.map((p) =>
      p.id === currentPlaibook.id
        ? { ...p, selectedDocuments: docIds, updatedAt: Date.now() }
        : p
    );
    setPlaibooks(updatedPlaibooks);
    setCurrentPlaibook({ ...currentPlaibook, selectedDocuments: docIds });
  };

  const handlePreview = () => {
    if (!currentPlaibook?.questions || currentPlaibook.questions.length === 0) {
      toast.error("No questions to preview. Generate questions first.");
      return;
    }
    setShowPreview(true);
  };

  const handlePublish = () => {
    if (!currentPlaibook?.questions || currentPlaibook.questions.length === 0) {
      toast.error("No questions to publish. Generate questions first.");
      return;
    }
    
    // Mark as published
    const updatedPlaibooks = plaibooks.map((p) =>
      p.id === currentPlaibook.id
        ? { ...p, published: true, updatedAt: Date.now() }
        : p
    );
    setPlaibooks(updatedPlaibooks);
    
    toast.success("Plaibook published successfully!");
    
    // Navigate to the published page
    const publishUrl = `/published/${currentPlaibook.id}`;
    window.open(publishUrl, '_blank');
  };

  if (!currentPlaibook) return null;

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 h-[72px]">
        <div className="max-w-[1800px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none focus-visible:ring-0 px-0 bg-transparent flex-1"
              placeholder="Untitled Plaibook"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <ActiveUsers plaibookId={id!} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handlePublish}>
                <Upload className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <EditorContent editor={editor} className="text-lg" />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="h-full border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4">
              <ExperimentSidebar
                plaibook={{
                  ...currentPlaibook,
                  content: editorContent || currentPlaibook.content
                }}
                onUpdateQuestions={handleUpdateQuestions}
                onUpdateDocuments={handleUpdateDocuments}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{currentPlaibook?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {currentPlaibook?.questions?.map((question, idx) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-sm text-muted-foreground">Q{idx + 1}:</span>
                  <p className="font-medium">{question.question}</p>
                </div>
                {question.answer && (
                  <div className="flex items-start gap-2 pl-6">
                    <span className="font-semibold text-sm text-primary">A:</span>
                    <p className="text-sm text-muted-foreground">{question.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Editor;
