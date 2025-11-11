import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_logo_url: string | null;
  is_active: boolean;
}

export const AgentManagement = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company_logo_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAgent) {
        const { error } = await supabase
          .from("agents")
          .update(formData)
          .eq("id", editingAgent.id);

        if (error) throw error;
        toast({ title: "Agent updated successfully" });
      } else {
        const { error } = await supabase
          .from("agents")
          .insert([{ ...formData, is_active: true }]);

        if (error) throw error;
        toast({ title: "Agent added successfully" });
      }

      setIsDialogOpen(false);
      setEditingAgent(null);
      setFormData({ first_name: "", last_name: "", email: "", company_logo_url: "" });
      fetchAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      first_name: agent.first_name,
      last_name: agent.last_name,
      email: agent.email,
      company_logo_url: agent.company_logo_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const { error } = await supabase.from("agents").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Agent deleted successfully" });
      fetchAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingAgent(null);
    setFormData({ first_name: "", last_name: "", email: "", company_logo_url: "" });
    setIsDialogOpen(true);
  };

  if (loading) return <div>Loading agents...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_logo_url">Company Logo URL</Label>
                <Input
                  id="company_logo_url"
                  type="url"
                  value={formData.company_logo_url}
                  onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingAgent ? "Update Agent" : "Add Agent"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Logo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>{agent.first_name} {agent.last_name}</TableCell>
              <TableCell>{agent.email}</TableCell>
              <TableCell>
                {agent.company_logo_url && (
                  <img src={agent.company_logo_url} alt="Logo" className="h-8 w-8 object-contain" />
                )}
              </TableCell>
              <TableCell>
                <span className={agent.is_active ? "text-green-600" : "text-gray-400"}>
                  {agent.is_active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(agent.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
