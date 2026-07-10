import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { registerUser, loginUser, getMe } from '../../api/authApi';
import WelcomePopup from '../../components/ui/WelcomePopup';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role_name: 'member' });
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerUser(formData);
      const { data: tokenData } = await loginUser({ username: formData.email, password: formData.password });
      localStorage.setItem('token', tokenData.access_token);
      const { data: userData } = await getMe();
      login(tokenData.access_token, userData);
      
      toast.success('Registration successful!');
      navigate(userData.role === 'manager' ? '/manager/dashboard' : '/dashboard');
    } catch (error) {
      toast.error('Registration failed. Email might be taken.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
      <WelcomePopup open={showWelcome} onClose={() => setShowWelcome(false)} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/30">
            <UserPlus className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 text-sm">Join the team dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder="John Doe"
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            placeholder="you@company.com"
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            placeholder="••••••••"
          />
          
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg border text-sm transition-colors ${formData.role_name === 'member' ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                onClick={() => setFormData({...formData, role_name: 'member'})}
              >
                Team Member
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg border text-sm transition-colors ${formData.role_name === 'manager' ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                onClick={() => setFormData({...formData, role_name: 'manager'})}
              >
                Manager
              </button>
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
