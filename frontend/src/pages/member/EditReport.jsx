import React, { useState, useEffect } from 'react';

const toList = (value) => value
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { reportsApi } from '../../api/reportsApi';
import { projectsApi } from '../../api/projectsApi';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '', week_start: '', week_end: '', tasks_completed: '',
    tasks_planned: '', blockers: '', hours_worked: ''
  });

  useEffect(() => {
    Promise.all([projectsApi.getAll(), reportsApi.getById(id)])
      .then(([projRes, repRes]) => {
        setProjects(projRes.data);
        setFormData({
          project_id: repRes.data.project_id,
          week_start: repRes.data.week_start,
          week_end: repRes.data.week_end,
          tasks_completed: Array.isArray(repRes.data.tasks_completed) ? repRes.data.tasks_completed.join('\n') : '',
          tasks_planned: repRes.data.tasks_planned || '',
          blockers: repRes.data.blockers || '',
          hours_worked: repRes.data.hours_worked || ''
        });
      })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e, isSubmit = false) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        project_id: parseInt(formData.project_id, 10),
        hours_worked: parseFloat(formData.hours_worked) || 0,
        tasks_completed: toList(formData.tasks_completed),
      };

      if (isSubmit) {
        await reportsApi.update(id, payload);
        await reportsApi.submit(id);
        toast.success('Report submitted!');
      } else {
        await reportsApi.update(id, payload);
        toast.success('Draft updated!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AppLayout><Spinner size="xl" className="mt-20" /></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Draft Report</h1>
      </div>
      <Card className="max-w-3xl">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
              <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} required>
                <option value="" className="text-gray-900">Select Project...</option>
                {projects.map(p => <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>)}
              </select>
            </div>
            <Input label="Hours Worked" type="number" step="0.5" value={formData.hours_worked} onChange={e => setFormData({...formData, hours_worked: e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Week Start Date" type="date" value={formData.week_start} onChange={e => setFormData({...formData, week_start: e.target.value})} required />
            <Input label="Week End Date" type="date" value={formData.week_end} onChange={e => setFormData({...formData, week_end: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tasks Completed</label>
            <textarea className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white min-h-[100px]" value={formData.tasks_completed} onChange={e => setFormData({...formData, tasks_completed: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tasks Planned (Next Week)</label>
            <textarea className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white min-h-[100px]" value={formData.tasks_planned} onChange={e => setFormData({...formData, tasks_planned: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Blockers / Impediments</label>
            <textarea className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white min-h-[80px]" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} />
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <Button variant="secondary" onClick={(e) => handleSubmit(e, false)} disabled={isSaving}>Update Draft</Button>
            <Button onClick={(e) => handleSubmit(e, true)} disabled={isSaving}>Submit Report</Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}
