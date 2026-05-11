import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, Phone, Loader2, AlertCircle, Store } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isLoginTab, setIsLoginTab] = useState(searchParams.get('tab') !== 'signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLoginTab) {
        await login({ username, password });
      } else {
        await signup({ username, full_name: fullName, email, phone, password });
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.error || (isLoginTab ? 'Invalid username or password' : 'Error signing up'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E40AF] mb-4">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">Anitha Jewellers</h1>
          <p className="text-sm text-[#6B7280] mt-1">Billing & Due Management</p>
        </div>

        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#E5E7EB]">
            <button
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                isLoginTab
                  ? 'text-[#1E40AF] border-b-2 border-[#1E40AF]'
                  : 'text-[#9CA3AF] hover:text-[#374151]'
              }`}
              onClick={() => { setIsLoginTab(true); setError(''); }}
            >
              Sign in
            </button>
            <button
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                !isLoginTab
                  ? 'text-[#1E40AF] border-b-2 border-[#1E40AF]'
                  : 'text-[#9CA3AF] hover:text-[#374151]'
              }`}
              onClick={() => { setIsLoginTab(false); setError(''); }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-[#DC2626] text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label block mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              {!isLoginTab && (
                <>
                  <div>
                    <label className="label block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input pl-10"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input pl-10"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label block mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input pl-10"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="label block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 active:scale-[0.98] justify-center disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                isLoginTab ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
