import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Lock, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

export function Login() {
  const [showForm, setShowForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // Bypass for preview when Supabase is not configured
        if (isRegistering) {
          alert("Cadastro simulado com sucesso! (Modo Preview - Configure o Supabase para funcionar de verdade)");
          setIsRegistering(false);
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Cadastro realizado com sucesso! Faça login para continuar.");
        setIsRegistering(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-secondary/10 blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 p-8 transition-all duration-500" style={{ transform: showForm ? 'translateX(-10%)' : 'translateX(0)' }}>
        <div className="text-center max-w-md">
          <img 
            src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1776262898/LOGO_Fotus_1A_r2m41s.png" 
            alt="Logo Fotus" 
            className="w-64 mx-auto mb-4 object-contain drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
          
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Novos Produtos</h2>
          
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowForm(true)}
              className="bg-secondary hover:bg-secondary-hover text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-secondary/30 transition-all hover:scale-105 flex items-center gap-3 mx-auto"
            >
              Acessar Plataforma
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white shadow-2xl border-l border-gray-100 z-20 flex flex-col justify-center p-12 absolute right-0 h-full"
          >
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isRegistering ? "Criar uma conta" : "Bem-vindo de volta"}
              </h2>
              <p className="text-gray-500">
                {isRegistering ? "Preencha os dados para se cadastrar." : "Insira suas credenciais para acessar."}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <a href="#" className="text-xs font-medium text-secondary hover:text-secondary-hover">Esqueceu a senha?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? "Aguarde..." : (isRegistering ? "Cadastrar" : "Entrar")}
              </button>

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-bold transition-all"
              >
                {isRegistering ? "Já tenho uma conta" : "Criar nova conta"}
              </button>
            </form>
            
            <button 
              onClick={() => setShowForm(false)}
              className="mt-8 text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
