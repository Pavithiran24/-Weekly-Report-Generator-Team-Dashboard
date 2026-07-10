import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { projectsApi } from '../../api/projectsApi';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchProjects = () => {
    setIsLoading(true);
    projectsApi.getAll().then(res => setProjects(res.data)).catch(console.error).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await projectsApi.create(newProject);
      toast.success('Project created');
      setIsModalOpen(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error) { toast.error('Failed to create project'); }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-gray-400">Manage company projects.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={18} className="mr-2"/> New Project</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}><Skeleton className="h-32 w-full" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Card key={p.id} hover>
              <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{p.description || 'No description provided.'}</p>
              <div className="text-xs text-gray-500">Status: {p.is_active ? 'Active' : 'Inactive'}</div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required />
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
            <textarea className="input-field min-h-[120px] resize-y" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
          </div>
          <Button type="submit" className="w-full">Create Project</Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
