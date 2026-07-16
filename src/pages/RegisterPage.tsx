import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showInfo } = useToast();

  useEffect(() => {
    showInfo('Nuvora Café menggunakan Google Sign-In untuk login cepat & aman.');
    navigate('/login', { replace: true });
  }, [navigate, showInfo]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-8 h-8 text-caramel animate-spin" />
      <span className="text-xs text-charcoal/50">Mengalihkan ke halaman login Google...</span>
    </div>
  );
};
