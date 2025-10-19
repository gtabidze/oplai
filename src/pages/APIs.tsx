import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Code2, Copy, Trash2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface APIEndpoint {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  dataPoints: {
    playbookName: boolean;
    playbookContent: boolean;
    questions: boolean;
    answers: boolean;
    scores: boolean;
    createdDate: boolean;
    updatedDate: boolean;
  };
}

const APIs = () => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    {
      id: "1",
      name: "Main Playbook API",
      isActive: true,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
      dataPoints: {
        playbookName: true,
        playbookContent: true,
        questions: true,
        answers: true,
        scores: true,
        createdDate: true,
        updatedDate: true,
      },
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState<Partial<APIEndpoint>>({
    name: "",
    dataPoints: {
      playbookName: true,
      playbookContent: true,
      questions: true,
      answers: true,
      scores: true,
      createdDate: false,
      updatedDate: false,
    },
  });

  const handleCreateEndpoint = () => {
    if (!newEndpoint.name?.trim()) {
      toast.error("Please enter an API name");
      return;
    }

    const endpoint: APIEndpoint = {
      id: crypto.randomUUID(),
      name: newEndpoint.name,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dataPoints: newEndpoint.dataPoints!,
    };

    setEndpoints([...endpoints, endpoint]);
    setIsDialogOpen(false);
    setNewEndpoint({
      name: "",
      dataPoints: {
        playbookName: true,
        playbookContent: true,
        questions: true,
        answers: true,
        scores: true,
        createdDate: false,
        updatedDate: false,
      },
    });
    toast.success("API endpoint created successfully");
  };

  const toggleEndpointStatus = (id: string) => {
    setEndpoints(
      endpoints.map((endpoint) =>
        endpoint.id === id
          ? { ...endpoint, isActive: !endpoint.isActive, updatedAt: Date.now() }
          : endpoint
      )
    );
  };

  const deleteEndpoint = (id: string) => {
    setEndpoints(endpoints.filter((endpoint) => endpoint.id !== id));
    toast.success("API endpoint deleted");
  };

  const copyEndpointURL = (id: string) => {
    const url = `${window.location.origin}/api/v1/endpoint/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("API URL copied to clipboard");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActiveDataPoints = (dataPoints: APIEndpoint["dataPoints"]) => {
    return Object.entries(dataPoints)
      .filter(([_, value]) => value)
      .map(([key]) => key.replace(/([A-Z])/g, " $1").trim())
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1));
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage API endpoints for your playbook data
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New API Endpoint</DialogTitle>
                <DialogDescription>
                  Configure your API endpoint with the data points you want to expose
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="api-name">API Name</Label>
                  <Input
                    id="api-name"
                    placeholder="e.g., Production Playbook API"
                    value={newEndpoint.name}
                    onChange={(e) =>
                      setNewEndpoint({ ...newEndpoint, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>Data Points to Include</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="playbookName"
                        checked={newEndpoint.dataPoints?.playbookName}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              playbookName: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="playbookName" className="text-sm cursor-pointer">
                        Playbook Name
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="playbookContent"
                        checked={newEndpoint.dataPoints?.playbookContent}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              playbookContent: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="playbookContent" className="text-sm cursor-pointer">
                        Playbook Content
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="questions"
                        checked={newEndpoint.dataPoints?.questions}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              questions: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="questions" className="text-sm cursor-pointer">
                        Questions
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="answers"
                        checked={newEndpoint.dataPoints?.answers}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              answers: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="answers" className="text-sm cursor-pointer">
                        Answers
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scores"
                        checked={newEndpoint.dataPoints?.scores}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              scores: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="scores" className="text-sm cursor-pointer">
                        Scores
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createdDate"
                        checked={newEndpoint.dataPoints?.createdDate}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              createdDate: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="createdDate" className="text-sm cursor-pointer">
                        Created Date
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="updatedDate"
                        checked={newEndpoint.dataPoints?.updatedDate}
                        onCheckedChange={(checked) =>
                          setNewEndpoint({
                            ...newEndpoint,
                            dataPoints: {
                              ...newEndpoint.dataPoints!,
                              updatedDate: checked as boolean,
                            },
                          })
                        }
                      />
                      <label htmlFor="updatedDate" className="text-sm cursor-pointer">
                        Updated Date
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEndpoint}>Create API</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Endpoints List */}
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="flex items-center gap-2">
                        <Code2 className="h-5 w-5" />
                        {endpoint.name}
                      </CardTitle>
                      <Badge
                        variant={endpoint.isActive ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            endpoint.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                          }`}
                        />
                        {endpoint.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Last updated: {formatDate(endpoint.updatedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyEndpointURL(endpoint.id)}
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEndpoint(endpoint.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 space-y-1">
                      <code className="text-sm font-mono break-all">
                        {window.location.origin}/api/v1/endpoint/{endpoint.id}
                      </code>
                      <p className="text-xs text-muted-foreground">API Endpoint URL</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Included Data Points:</Label>
                    <div className="flex flex-wrap gap-2">
                      {getActiveDataPoints(endpoint.dataPoints).map((point) => (
                        <Badge key={point} variant="outline">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={endpoint.isActive}
                        onCheckedChange={() => toggleEndpointStatus(endpoint.id)}
                      />
                      <Label className="text-sm">
                        {endpoint.isActive ? "Deactivate" : "Activate"} API
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDate(endpoint.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {endpoints.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Code2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No API Endpoints Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first API endpoint to start exposing your playbook data
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First API
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default APIs;
