'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Lock, ChevronDown } from 'lucide-react';

export default function Login() {
  const { login, userNames } = useAuth();
  const [name, setName] = useState(userNames[0]);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (mode) => {
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const result = login(name, password, mode);
    if (!result.ok) setError(result.error);
    setLoading(false);
  };

  const userColors = { 'م.فواز': '#2563eb', 'أ.خالد': '#7c3aed', 'د.محمد': '#059669', 'م.احمد': '#d97706' };
  const activeColor = userColors[name] || '#2563eb';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)',
      padding: '0 20px', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '22px',
          background: 'white', margin: '0 auto 16px',
          boxShadow: `0 8px 30px ${activeColor}55`,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${activeColor}44`, transition: 'border-color 0.4s, box-shadow 0.4s',
        }}>
          <img src="/icon.png" alt="FRAME" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 900, letterSpacing: '2px' }}>فرييم</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '6px' }}>نظام الإدارة الداخلي</p>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px',
        padding: '28px 24px', width: '100%', maxWidth: '400px',
      }}>
        {/* User Select */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            المستخدم
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              width: '8px', height: '8px', borderRadius: '50%', background: activeColor, transition: 'background 0.3s',
            }} />
            <select
              value={name} onChange={e => { setName(e.target.value); setPassword(''); setError(''); }}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '13px 32px 13px 14px', fontSize: '16px', fontFamily: 'inherit',
                color: 'white', outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {userNames.map(u => <option key={u} value={u} style={{ background: '#1e3a5f', color: 'white' }}>{u}</option>)}
            </select>
            <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            كلمة السر
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && password && handleLogin('edit')}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', border: `1.5px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '12px', padding: '13px 42px', fontSize: '20px', fontFamily: 'inherit',
                color: 'white', outline: 'none', letterSpacing: '4px', transition: 'border-color 0.2s',
              }}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              {showPw ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '14px', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => password && handleLogin('edit')}
            disabled={!password || loading}
            style={{
              padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: password ? activeColor : 'rgba(255,255,255,0.1)',
              color: 'white', fontSize: '16px', fontWeight: 700, fontFamily: 'inherit',
              transition: 'all 0.3s', opacity: (!password || loading) ? 0.6 : 1,
              boxShadow: password ? `0 4px 16px ${activeColor}55` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            {loading ? '⏳ جاري الدخول...' : '✏️ دخول (تعديل وعرض)'}
          </button>

        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '32px', textAlign: 'center' }}>
        فرييم © 2025
      </p>
    </div>
  );
}
