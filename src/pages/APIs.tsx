import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Code2, Copy, Trash2, RefreshCw, ChevronDown, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/localStorage";
import { Plaibook } from "@/lib/types";

interface APIEndpoint {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  selectedPlaybooks: string[]; // Array of playbook IDs
  dataPoints: {
    playbookContent: boolean;
    questions: boolean;
    answers: boolean;
    scores: boolean;
    createdDate: boolean;
    updatedDate: boolean;
  };
}

const APIs = () => {
  const [plaibooks] = useLocalStorage<Plaibook[]>("plaibooks", []);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<APIEndpoint | null>(null);

  // Load endpoints from database
  useEffect(() => {
    loadEndpoints();
  }, []);

  const loadEndpoints = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading endpoints:', error);
        toast.error('Failed to load API endpoints');
        return;
      }

      // Transform database records to component state format
      const transformedEndpoints = data.map((endpoint) => ({
        id: endpoint.id,
        name: endpoint.name,
        isActive: endpoint.is_active,
        createdAt: new Date(endpoint.created_at).getTime(),
        updatedAt: new Date(endpoint.updated_at).getTime(),
        selectedPlaybooks: endpoint.selected_playbooks as string[],
        dataPoints: endpoint.data_points as APIEndpoint['dataPoints'],
      }));

      // Check if Golden Datasets API exists
      const hasGoldenDataset = transformedEndpoints.some(e => e.name === 'Golden Datasets API');
      
      if (!hasGoldenDataset) {
        // Create Golden Datasets API if it doesn't exist
        const { data: goldenDataset, error: createError } = await supabase
          .from('api_endpoints')
          .insert({
            user_id: user.id,
            name: 'Golden Datasets API',
            is_active: true,
            selected_playbooks: [],
            data_points: {
              playbookContent: true,
              questions: true,
              answers: true,
              scores: true,
              createdDate: true,
              updatedDate: true,
            },
          })
          .select()
          .single();

        if (!createError && goldenDataset) {
          transformedEndpoints.unshift({
            id: goldenDataset.id,
            name: goldenDataset.name,
            isActive: goldenDataset.is_active,
            createdAt: new Date(goldenDataset.created_at).getTime(),
            updatedAt: new Date(goldenDataset.updated_at).getTime(),
            selectedPlaybooks: goldenDataset.selected_playbooks as string[],
            dataPoints: goldenDataset.data_points as APIEndpoint['dataPoints'],
          });
        }
      }

      setEndpoints(transformedEndpoints);
    } catch (error) {
      console.error('Error in loadEndpoints:', error);
      toast.error('Failed to load API endpoints');
    } finally {
      setIsLoading(false);
    }
  };
  const [newEndpoint, setNewEndpoint] = useState<Partial<APIEndpoint>>({
    name: "",
    selectedPlaybooks: [],
    dataPoints: {
      playbookContent: true,
      questions: true,
      answers: true,
      scores: true,
      createdDate: false,
      updatedDate: false,
    },
  });

  const handleCreateEndpoint = async () => {
    if (!newEndpoint.name?.trim()) {
      toast.error("Please enter an API name");
      return;
    }

    if (!newEndpoint.selectedPlaybooks || newEndpoint.selectedPlaybooks.length === 0) {
      toast.error("Please select at least one playbook");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create an API endpoint");
        return;
      }

      const { data, error } = await supabase
        .from('api_endpoints')
        .insert({
          user_id: user.id,
          name: newEndpoint.name,
          is_active: false,
          selected_playbooks: newEndpoint.selectedPlaybooks,
          data_points: newEndpoint.dataPoints,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating endpoint:', error);
        toast.error('Failed to create API endpoint');
        return;
      }

      // Add to local state
      const endpoint: APIEndpoint = {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        selectedPlaybooks: data.selected_playbooks as string[],
        dataPoints: data.data_points as APIEndpoint['dataPoints'],
      };

      setEndpoints([...endpoints, endpoint]);
      setIsDialogOpen(false);
      setNewEndpoint({
        name: "",
        selectedPlaybooks: [],
        dataPoints: {
          playbookContent: true,
          questions: true,
          answers: true,
          scores: true,
          createdDate: false,
          updatedDate: false,
        },
      });
      toast.success("API endpoint created successfully");
    } catch (error) {
      console.error('Error in handleCreateEndpoint:', error);
      toast.error('Failed to create API endpoint');
    }
  };

  const handleEditEndpoint = (endpoint: APIEndpoint) => {
    setEditingEndpoint(endpoint);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEndpoint = async () => {
    if (!editingEndpoint) return;

    try {
      const { error } = await supabase
        .from('api_endpoints')
        .update({
          data_points: editingEndpoint.dataPoints,
        })
        .eq('id', editingEndpoint.id);

      if (error) {
        console.error('Error updating endpoint:', error);
        toast.error('Failed to update API endpoint');
        return;
      }

      setEndpoints(
        endpoints.map((endpoint) =>
          endpoint.id === editingEndpoint.id
            ? { ...editingEndpoint, updatedAt: Date.now() }
            : endpoint
        )
      );
      setIsEditDialogOpen(false);
      setEditingEndpoint(null);
      toast.success("API endpoint updated successfully");
    } catch (error) {
      console.error('Error in handleUpdateEndpoint:', error);
      toast.error('Failed to update API endpoint');
    }
  };

  const togglePlaybookSelection = (playbookId: string) => {
    const current = newEndpoint.selectedPlaybooks || [];
    if (current.includes(playbookId)) {
      setNewEndpoint({
        ...newEndpoint,
        selectedPlaybooks: current.filter((id) => id !== playbookId),
      });
    } else {
      setNewEndpoint({
        ...newEndpoint,
        selectedPlaybooks: [...current, playbookId],
      });
    }
  };

  const getPlaybookNames = (playbookIds: string[]) => {
    return playbookIds
      .map((id) => plaibooks.find((p) => p.id === id)?.title)
      .filter(Boolean)
      .join(", ");
  };

  const toggleEndpointStatus = async (id: string) => {
    // Prevent deactivating Golden Datasets API
    const isGolden = endpoints.find(e => e.id === id)?.name === 'Golden Datasets API';
    if (isGolden) {
      toast.error("Golden Datasets API cannot be deactivated");
      return;
    }

    const endpoint = endpoints.find(e => e.id === id);
    if (!endpoint) return;

    try {
      const { error } = await supabase
        .from('api_endpoints')
        .update({ is_active: !endpoint.isActive })
        .eq('id', id);

      if (error) {
        console.error('Error toggling endpoint:', error);
        toast.error('Failed to update API endpoint status');
        return;
      }

      setEndpoints(
        endpoints.map((endpoint) =>
          endpoint.id === id
            ? { ...endpoint, isActive: !endpoint.isActive, updatedAt: Date.now() }
            : endpoint
        )
      );
      toast.success(`API endpoint ${!endpoint.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error in toggleEndpointStatus:', error);
      toast.error('Failed to update API endpoint status');
    }
  };

  const deleteEndpoint = async (id: string) => {
    // Prevent deleting Golden Datasets API
    const isGolden = endpoints.find(e => e.id === id)?.name === 'Golden Datasets API';
    if (isGolden) {
      toast.error("Golden Datasets API cannot be deleted");
      return;
    }

    try {
      const { error } = await supabase
        .from('api_endpoints')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting endpoint:', error);
        toast.error('Failed to delete API endpoint');
        return;
      }

      setEndpoints(endpoints.filter((endpoint) => endpoint.id !== id));
      toast.success("API endpoint deleted");
    } catch (error) {
      console.error('Error in deleteEndpoint:', error);
      toast.error('Failed to delete API endpoint');
    }
  };

  const copyEndpointURL = (id: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/api-endpoint/${id}`;
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

                <div className="space-y-2">
                  <Label>Select Playbooks</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-background hover:bg-accent"
                      >
                        <span className="truncate">
                          {newEndpoint.selectedPlaybooks && newEndpoint.selectedPlaybooks.length > 0
                            ? `${newEndpoint.selectedPlaybooks.length} playbook${newEndpoint.selectedPlaybooks.length > 1 ? 's' : ''} selected`
                            : "Select playbooks..."}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[400px] max-h-[300px] overflow-y-auto bg-popover z-50">
                      {plaibooks.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No playbooks available. Create a playbook first.
                        </div>
                      ) : (
                        plaibooks.map((playbook) => (
                          <DropdownMenuCheckboxItem
                            key={playbook.id}
                            checked={newEndpoint.selectedPlaybooks?.includes(playbook.id)}
                            onCheckedChange={() => togglePlaybookSelection(playbook.id)}
                            className="cursor-pointer"
                          >
                            <span className="truncate">{playbook.title}</span>
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {newEndpoint.selectedPlaybooks && newEndpoint.selectedPlaybooks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newEndpoint.selectedPlaybooks.map((id) => {
                        const playbook = plaibooks.find((p) => p.id === id);
                        return playbook ? (
                          <Badge key={id} variant="secondary">
                            {playbook.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Data Points to Include</Label>
                  <div className="grid grid-cols-2 gap-4">
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

          {/* Edit Dialog for Golden Datasets API */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit {editingEndpoint?.name}</DialogTitle>
                <DialogDescription>
                  Configure which data points to include in this API endpoint
                </DialogDescription>
              </DialogHeader>
              {editingEndpoint && (
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <Label>Data Points to Include</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-playbookContent"
                          checked={editingEndpoint.dataPoints.playbookContent}
                          onCheckedChange={(checked) =>
                            setEditingEndpoint({
                              ...editingEndpoint,
                              dataPoints: {
                                ...editingEndpoint.dataPoints,
                                playbookContent: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="edit-playbookContent" className="text-sm cursor-pointer">
                          Playbook Content
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-questions"
                          checked={editingEndpoint.dataPoints.questions}
                          onCheckedChange={(checked) =>
                            setEditingEndpoint({
                              ...editingEndpoint,
                              dataPoints: {
                                ...editingEndpoint.dataPoints,
                                questions: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="edit-questions" className="text-sm cursor-pointer">
                          Questions
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-answers"
                          checked={editingEndpoint.dataPoints.answers}
                          onCheckedChange={(checked) =>
                            setEditingEndpoint({
                              ...editingEndpoint,
                              dataPoints: {
                                ...editingEndpoint.dataPoints,
                                answers: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="edit-answers" className="text-sm cursor-pointer">
                          Answers
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-scores"
                          checked={editingEndpoint.dataPoints.scores}
                          onCheckedChange={(checked) =>
                            setEditingEndpoint({
                              ...editingEndpoint,
                              dataPoints: {
                                ...editingEndpoint.dataPoints,
                                scores: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="edit-scores" className="text-sm cursor-pointer">
                          Scores
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-createdDate"
                          checked={editingEndpoint.dataPoints.createdDate}
                          onCheckedChange={(checked) =>
                            setEditingEndpoint({
                              ...editingEndpoint,
                              dataPoints: {
                                ...editingEndpoint.dataPoints,
                                createdDate: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="edit-createdDate" className="text-sm cursor-pointer">
                          Created Date
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-updatedDate"
                          checked={editingEndpoint.dataPoints.updatedDate}
                          onCheckedChange={(checked) =>
                            setEditingEndpoint({
                              ...editingEndpoint,
                              dataPoints: {
                                ...editingEndpoint.dataPoints,
                                updatedDate: checked as boolean,
                              },
                            })
                          }
                        />
                        <label htmlFor="edit-updatedDate" className="text-sm cursor-pointer">
                          Updated Date
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateEndpoint}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Endpoints List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            endpoints.map((endpoint) => (
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
                    {endpoint.name === 'Golden Datasets API' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditEndpoint(endpoint)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyEndpointURL(endpoint.id)}
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {endpoint.name !== 'Golden Datasets API' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEndpoint(endpoint.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 space-y-1">
                      <code className="text-sm font-mono break-all">
                        {import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-endpoint/{endpoint.id}
                      </code>
                      <p className="text-xs text-muted-foreground">API Endpoint URL</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Playbooks:</Label>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.name === 'Golden Datasets API' ? (
                        <Badge variant="secondary">All Playbooks</Badge>
                      ) : (
                        endpoint.selectedPlaybooks.map((playbookId) => {
                          const playbook = plaibooks.find((p) => p.id === playbookId);
                          return playbook ? (
                            <Badge key={playbookId} variant="secondary">
                              {playbook.title}
                            </Badge>
                          ) : null;
                        })
                      )}
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

                  {endpoint.name === 'Golden Datasets API' ? (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Created: {formatDate(endpoint.createdAt)}
                      </p>
                    </div>
                  ) : (
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))
          )}
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
