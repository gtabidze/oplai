import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook } from "@/lib/types";
import { ExperimentSidebar } from "@/components/ExperimentSidebar";
import { ArrowLeft, Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plaibooks, setPlaibooks] = useLocalStorage<Plaibook[]>('plaibooks', []);
  const [currentPlaibook, setCurrentPlaibook] = useState<Plaibook | null>(null);
  const [title, setTitle] = useState('');

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
      if (!currentPlaibook) return;
      
      const timer = setTimeout(() => {
        const updatedPlaibooks = plaibooks.map((p) =>
          p.id === currentPlaibook.id
            ? { ...p, content: html, updatedAt: Date.now() }
            : p
        );
        setPlaibooks(updatedPlaibooks);
      }, 500);
      
      return () => clearTimeout(timer);
    },
  });

  useEffect(() => {
    const plaibook = plaibooks.find((p) => p.id === id);
    if (plaibook) {
      setCurrentPlaibook(plaibook);
      setTitle(plaibook.title);
      if (editor && plaibook.content !== editor.getHTML()) {
        editor.commands.setContent(plaibook.content);
      }
    } else {
      navigate('/');
    }
  }, [id, plaibooks, navigate, editor]);

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

  const handlePreview = () => {
    toast.info("Preview functionality coming soon!");
  };

  const handlePublish = () => {
    toast.info("Publish functionality coming soon!");
  };

  if (!currentPlaibook) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
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
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl font-bold border-none focus-visible:ring-0 px-0 mb-6 bg-transparent"
              placeholder="Untitled Plaibook"
            />
            
            <EditorContent editor={editor} className="text-lg" />
          </div>
        </div>

        <div className="w-96 border-l border-border bg-card/30 backdrop-blur-sm overflow-y-auto">
          <div className="p-6 h-full">
            <ExperimentSidebar documentContent={editor?.getText() || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
