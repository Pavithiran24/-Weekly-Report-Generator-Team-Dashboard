import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { reportsApi } from '../../api/reportsApi';
import { projectsApi } from '../../api/projectsApi';
import toast from 'react-hot-toast';

const toList = (value) => value
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);

export default function CreateReport() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    week_start: '',
    week_end: '',
    tasks_completed: '',
    tasks_planned: '',
    blockers: '',
    hours_worked: ''
  });

  useEffect(() => {
    projectsApi.getAll().then(res => setProjects(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e, isSubmit = false) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        project_id: parseInt(formData.project_id, 10),
        hours_worked: parseFloat(formData.hours_worked) || 0,
        tasks_completed: toList(formData.tasks_completed),
      };

      const createdReport = await reportsApi.create(payload);
      if (isSubmit) {
        await reportsApi.submit(createdReport.data.id);
        toast.success('Report submitted!');
      } else {
        toast.success('Draft saved!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Weekly Report</h1>
        <p className="text-gray-400">Fill out your tasks and progress for the week.</p>
      </div>
      <Card className="max-w-3xl">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Project</label>
              <select
                className="input-field"
                value={formData.project_id}
                onChange={e => setFormData({...formData, project_id: e.target.value})}
                required
              >
                <option value="" className="text-gray-900">Select Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Hours Worked"
              type="number"
              step="0.5"
              value={formData.hours_worked}
              onChange={e => setFormData({...formData, hours_worked: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Week Start Date"
              type="date"
              value={formData.week_start}
              onChange={e => setFormData({...formData, week_start: e.target.value})}
              required
            />
            <Input
              label="Week End Date"
              type="date"
              value={formData.week_end}
              onChange={e => setFormData({...formData, week_end: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Tasks Completed</label>
            <textarea
              className="input-field min-h-[120px] resize-y"
              placeholder="What did you accomplish?"
              value={formData.tasks_completed}
              onChange={e => setFormData({...formData, tasks_completed: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Tasks Planned (Next Week)</label>
            <textarea
              className="input-field min-h-[120px] resize-y"
              placeholder="What are you doing next?"
              value={formData.tasks_planned}
              onChange={e => setFormData({...formData, tasks_planned: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Blockers / Impediments</label>
            <textarea
              className="input-field min-h-[100px] resize-y"
              placeholder="Any issues blocking your progress?"
              value={formData.blockers}
              onChange={e => setFormData({...formData, blockers: e.target.value})}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 border-t border-white/10 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" onClick={(e) => handleSubmit(e, false)} disabled={isLoading}>
              Save as Draft
            </Button>
            <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isLoading}>
              Submit Report
            </Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  );
}
