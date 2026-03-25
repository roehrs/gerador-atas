
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  Video, 
  Users, 
  Clock, 
  GraduationCap,
  Save,
  CheckCircle2,
  Filter,
  FileText,
  X,
  Download,
  Sparkles
} from 'lucide-react';
import PizZip from 'pizzip';
import {
  fillRelatorioDocumentXml,
  mergeRelatorioPayload,
  parseGeminiJsonResponse,
} from './reportDocx.js';
import { geminiGenerateContent, isGeminiConfiguredForCurrentEnv } from './geminiClient.js';

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
import { Wand2 } from 'lucide-react';
// export const supabase = null;

// --- Fontes Externas e Estilos Globais ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500;600&display=swap');
  
  .font-brand {
    font-family: 'Oswald', sans-serif;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  .font-body {
    font-family: 'Inter', sans-serif;
  }
  
  /* Custom Scrollbar */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// --- Cores da Marca (Manual Senac Competições) ---
const BRAND = {
  blue: '#1331a1',
  pink: '#F31366',
  orange: '#F44528',
  yellow: '#F8b62F',
  green: '#a2ca02'
};

const CHART_COLORS = [BRAND.blue, BRAND.pink, BRAND.orange, BRAND.yellow, BRAND.green, '#8884d8', '#82ca9d', '#ffc658'];

// --- Constantes e Dados de Referência ---
const TRAINERS = [
  { name: 'Amanda', occupation: 'Estética e Bem Estar' },
  { name: 'Cristina', occupation: 'Recepção de Hotel' },
  { name: 'Diogo', occupation: 'Desenvolvimento de Sistemas' },
  { name: 'Elis', occupation: 'Cuidados de Saúde e Apoio Social' },
  { name: 'Georgia', occupation: 'Comportamental' },
  { name: 'Maíra', occupation: 'Confeitaria' },
  { name: 'Thiago', occupation: 'Cozinha' },
  { name: 'Vitória', occupation: 'Cabeleireiro' }
];

const SCHOOLS = [
  'Alegrete','Bagé','Bento Gonçalves','Cachoeira do Sul','Camaquã','Canoas',
  'Caxias do Sul','Distrito Criativo','Erechim','Farroupilha','Gramado',
  'Gravataí','Ijuí','Lindóia','Montenegro','Novo Hamburgo','Passo Fundo',
  'Pelotas','Rio Grande','Santa Cruz','Santa Maria','Santa Rosa',
  'Santana do Livramento','Santo Ângelo','São Borja','São Leopoldo',
  'São Luiz Gonzaga','Saúde','Senac Tech','Taquara','Tramandaí',
  'Unidade','Unisenac Pelotas','Unisenac POA','Uruguaiana'
].sort();

// Mapeamento de Cores por Ocupação (Baseado no Manual)
const getOccupationColor = (occupation) => {
  if (occupation.includes('Cozinha')) return { bg: 'bg-[#F44528]/10', text: 'text-[#F44528]', border: 'border-[#F44528]/20' };
  if (occupation.includes('Estética') || occupation.includes('Cabeleireiro')) return { bg: 'bg-[#F31366]/10', text: 'text-[#F31366]', border: 'border-[#F31366]/20' };
  if (occupation.includes('Desenvolvimento') || occupation.includes('Informática')) return { bg: 'bg-[#1331a1]/10', text: 'text-[#1331a1]', border: 'border-[#1331a1]/20' };
  if (occupation.includes('Florista') || occupation.includes('Comportamental')) return { bg: 'bg-[#a2ca02]/10', text: 'text-[#6a8500]', border: 'border-[#a2ca02]/20' }; 
  if (occupation.includes('Confeitaria')) return { bg: 'bg-[#F8b62F]/10', text: 'text-[#b37c00]', border: 'border-[#F8b62F]/20' }; 
  return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
};

// Conversor de Ponto Flutuante para Visão (ex: 1.5 -> "1h 30m")
const formatDurationDisplay = (decimalHours) => {
  if (!decimalHours) return '0h';
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};


// --- Componente: Símbolo da Marca Senac ---
const BrandLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 shrink-0">
    <path d="M15,10 Q50,30 40,65 Q5,40 15,10" fill={BRAND.pink} />
    <circle cx="70" cy="25" r="16" fill={BRAND.orange} />
    <path d="M25,35 Q50,55 35,80 Q10,55 25,35" fill={BRAND.blue} />
    <path d="M35,85 Q75,45 95,55 Q60,75 35,85" fill={BRAND.yellow} />
    <path d="M45,95 Q65,85 70,80 Q55,95 45,95" fill={BRAND.green} />
  </svg>
);

// --- Componente: Tela de Login (E-mail e Senha) ---
function LoginScreen({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null); // Estado para guardar a mensagem de erro

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null); // Limpa erros anteriores

    // Verifica se o Supabase está configurado
    if (!supabase) {
      setErrorMsg("Erro de configuração: Faltam as chaves do Supabase no .env.local");
      setIsLoading(false);
      return;
    }

    // Chamada REAL de autenticação ao Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email, 
      password: password 
    });
    
    setIsLoading(false);

    if (error) {
      // Se as credenciais estiverem erradas, bloqueia e avisa
      setErrorMsg("E-mail ou senha incorretos.");
    } else {
      // Se estiver tudo certo, entra na plataforma!
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center relative overflow-hidden font-body">
      {/* Grafismos de Fundo */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-[#1331a1] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-[#F31366] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-2xl border-t-[8px] border-[#F8b62F] max-w-md w-full relative z-10 mx-4">
      <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo Competições Senac" 
            className="h-24 w-auto object-contain" 
          />
        </div>
        
        <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">
          Bem-vindo à plataforma de gestão. Insira as suas credenciais para iniciar a jornada.
        </p>

        {/* Alerta de Erro Visual */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-sm font-bold mb-6 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#1331a1] uppercase tracking-wider mb-2">E-mail Institucional</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@senac.br"
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none transition-all bg-slate-50 font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1331a1] uppercase tracking-wider mb-2">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none transition-all bg-slate-50 font-medium text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#1331a1] hover:bg-[#0b1f69] text-white font-brand text-xl py-4 px-6 rounded-xl transition-transform hover:-translate-y-1 mt-4 shadow-[0_8px_20px_-6px_rgba(19,49,161,0.5)] disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "ENTRAR NA PLATAFORMA"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

// --- Componentes Principais ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('form');
  const [records, setRecords] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false); // Novo estado para o loading

  // Função REAL para buscar dados do Supabase (Leitura)
  const fetchRecords = async () => {
    setIsLoadingData(true);
    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .order('date', { ascending: false }); // Traz os mais recentes primeiro
      
    if (error) {
      console.error("Erro ao buscar dados:", error);
    } else if (data) {
      setRecords(data);
    }
    setIsLoadingData(false);
  };

  // Quando o utilizador faz login, o sistema vai buscar as ATAs reais!
  useEffect(() => {
    if (isAuthenticated && supabase) {
      fetchRecords();
    }
  }, [isAuthenticated]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Função REAL para gravar no Supabase (Inserção)
  const handleAddRecord = async (newRecord) => {
    // Insere no banco de dados
    const { data, error } = await supabase
      .from('registros')
      .insert([newRecord])
      .select(); // Pede ao banco para devolver a linha acabada de criar

    if (error) {
      console.error("Erro ao gravar jornada:", error);
      alert("Houve um erro ao guardar. Verifica o teu acesso à internet.");
      return;
    }

    if (data && data.length > 0) {
      // Adiciona o novo registo (com o ID real do banco) ao topo da lista local
      setRecords([data[0], ...records]);
      showNotification('A jornada foi registada com sucesso no servidor!');
      setCurrentView('history');
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <style>{globalStyles}</style>
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-body text-slate-800">
        
        {/* Sidebar / Navegação */}
        <aside className="w-full lg:w-72 bg-[#1331a1] text-white shadow-2xl flex flex-col transition-all duration-300 relative overflow-hidden shrink-0">
          
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#F31366] rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-[#a2ca02] rounded-full blur-3xl"></div>
          </div>

          <div className="p-6 relative z-10 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
              <img 
            src="/logo.png" 
            alt="Logo Competições Senac" 
            className="h-24 w-auto object-contain" 
          />
                <div>
                  
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 py-2 px-3 rounded-lg transition-colors lg:w-full lg:mt-4"
            >
              Terminar Sessão
            </button>
          </div>
          
          <nav className="w-full px-4 pb-4 lg:py-4 flex flex-row lg:flex-col gap-2 overflow-x-auto hide-scrollbar relative z-10">
            <NavItem icon={<FilePlus size={20}/>} label="Novo Registro" active={currentView === 'form'} onClick={() => setCurrentView('form')} />
            <NavItem icon={<History size={20}/>} label="Histórico" active={currentView === 'history'} onClick={() => setCurrentView('history')} />
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          </nav>
          
          
        </aside>

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto relative w-full">
          {notification && (
            <div className="fixed top-4 right-4 bg-[#a2ca02] text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce font-medium">
              <CheckCircle2 size={24} className="text-[#1331a1]" />
              {notification}
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            {/* Aviso de carregamento na tela */}
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-[#1331a1] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#1331a1] font-brand text-lg animate-pulse">CARREGANDO DADOS DO SERVIDOR...</p>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && <DashboardView records={records} />}
                {currentView === 'form' && <FormView onSubmit={handleAddRecord} />}
                {currentView === 'history' && <HistoryView records={records} />}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// --- Componentes de Vista (Views) ---

function DashboardView({ records }) {
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterOccupation, setFilterOccupation] = useState('');
  const [filterSchool, setFilterSchool] = useState('');

  const availableTrainers = useMemo(() => {
    const filtered = records.filter(r => (!filterOccupation || r.occupation === filterOccupation) && (!filterSchool || r.school === filterSchool));
    return Array.from(new Set(filtered.map(r => r.trainer))).sort();
  }, [records, filterOccupation, filterSchool]);

  const availableOccupations = useMemo(() => {
    const filtered = records.filter(r => (!filterTrainer || r.trainer === filterTrainer) && (!filterSchool || r.school === filterSchool));
    return Array.from(new Set(filtered.map(r => r.occupation))).sort();
  }, [records, filterTrainer, filterSchool]);

  const availableSchools = useMemo(() => {
    const filtered = records.filter(r => (!filterTrainer || r.trainer === filterTrainer) && (!filterOccupation || r.occupation === filterOccupation));
    return Array.from(new Set(filtered.map(r => r.school))).sort();
  }, [records, filterTrainer, filterOccupation]);

  useEffect(() => { if (filterTrainer && !availableTrainers.includes(filterTrainer)) setFilterTrainer(''); }, [filterTrainer, availableTrainers]);
  useEffect(() => { if (filterOccupation && !availableOccupations.includes(filterOccupation)) setFilterOccupation(''); }, [filterOccupation, availableOccupations]);
  useEffect(() => { if (filterSchool && !availableSchools.includes(filterSchool)) setFilterSchool(''); }, [filterSchool, availableSchools]);

  const stats = useMemo(() => {
    let totalHours = 0;
    const hoursBySchool = {};
    const hoursByOccupation = {};
    const typeCount = { Presencial: 0, Web: 0 };

    const filteredRecords = records.filter(r => {
      if (filterTrainer && r.trainer !== filterTrainer) return false;
      if (filterOccupation && r.occupation !== filterOccupation) return false;
      if (filterSchool && r.school !== filterSchool) return false;
      return true;
    });

    filteredRecords.forEach(r => {
      const hrs = Number(r.duration) || 0;
      totalHours += hrs;
      hoursBySchool[r.school] = (hoursBySchool[r.school] || 0) + hrs;
      hoursByOccupation[r.occupation] = (hoursByOccupation[r.occupation] || 0) + hrs;
      typeCount[r.type] = (typeCount[r.type] || 0) + 1;
    });

    const schoolData = Object.keys(hoursBySchool)
      .map(name => ({ name, horas: Number(hoursBySchool[name].toFixed(2)) }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 10); 

    const occupationData = Object.keys(hoursByOccupation)
      .map(name => ({ name, value: Number(hoursByOccupation[name].toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    const typeData = [
      { name: 'Presencial', value: typeCount['Presencial'] || 0 },
      { name: 'Web', value: typeCount['Web'] || 0 }
    ];

    return { 
      totalHours, 
      totalMeetings: filteredRecords.length, 
      schoolData, 
      occupationData, 
      typeData,
      uniqueSchoolsAttended: new Set(filteredRecords.map(r => r.school)).size
    };
  }, [records, filterTrainer, filterOccupation, filterSchool]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="mb-6">
        <h2 className="text-3xl md:text-4xl font-brand text-[#1331a1]">Dashboard</h2>
        <p className="text-slate-500 font-medium text-base md:text-lg mt-1">Acompanhamento dos dados.</p>
      </header>

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border-t-4 border-[#F31366] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end mb-6">
        <div className="w-full">
          <label className="block text-xs font-bold text-[#1331a1] uppercase tracking-wider mb-2 flex items-center gap-1"><Filter size={14} /> Treinador</label>
          <select value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1331a1] bg-slate-50 font-medium">
            <option value="">Todos</option>
            {availableTrainers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-full">
          <label className="block text-xs font-bold text-[#1331a1] uppercase tracking-wider mb-2 flex items-center gap-1"><Filter size={14} /> Ocupação</label>
          <select value={filterOccupation} onChange={(e) => setFilterOccupation(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1331a1] bg-slate-50 font-medium">
            <option value="">Todas</option>
            {availableOccupations.map(occ => <option key={occ} value={occ}>{occ}</option>)}
          </select>
        </div>
        <div className="w-full">
          <label className="block text-xs font-bold text-[#1331a1] uppercase tracking-wider mb-2 flex items-center gap-1"><Filter size={14} /> Escola</label>
          <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1331a1] bg-slate-50 font-medium">
            <option value="">Todas</option>
            {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(filterTrainer || filterOccupation || filterSchool) ? (
          <div className="w-full sm:col-span-2 xl:col-span-1">
            <button onClick={() => { setFilterTrainer(''); setFilterOccupation(''); setFilterSchool(''); }} className="w-full px-6 py-2.5 text-sm font-bold text-[#F31366] hover:bg-[#F31366]/10 rounded-xl transition-colors whitespace-nowrap h-[46px] border border-[#F31366]/20">
              LIMPAR FILTROS
            </button>
          </div>
        ) : <div className="hidden xl:block"></div>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Clock size={28} className="text-[#1331a1]"/>} title="Total de Horas" value={formatDurationDisplay(stats.totalHours)} bg="bg-[#1331a1]/5" border="border-[#1331a1]/20" />
        <StatCard icon={<Users size={28} className="text-[#F31366]"/>} title="Total de Encontros" value={stats.totalMeetings} bg="bg-[#F31366]/5" border="border-[#F31366]/20" />
        <StatCard icon={<Video size={28} className="text-[#F44528]"/>} title="Encontros Web" value={stats.typeData.find(d=>d.name==='Web')?.value || 0} bg="bg-[#F44528]/5" border="border-[#F44528]/20" />
        <StatCard icon={<GraduationCap size={28} className="text-[#F8b62F]"/>} title="Escolas Atendidas" value={stats.uniqueSchoolsAttended} bg="bg-[#F8b62F]/10" border="border-[#F8b62F]/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-brand text-[#1331a1] mb-6">TOP 10 ESCOLAS (HORAS)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.schoolData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} tickFormatter={(val) => val.substring(0, 10) + '...'} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value) => [formatDurationDisplay(value), 'Tempo Total']} cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="horas" fill={BRAND.blue} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-brand text-[#1331a1] mb-6">HORAS POR OCUPAÇÃO</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.occupationData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={4}
                  dataKey="value"
                  label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.occupationData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [formatDurationDisplay(value), 'Tempo Total']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '20px' }} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormView({ onSubmit }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '01:00',
    trainerName: '',
    school: '',
    type: 'Presencial',
    link: '',
    ata: ''
  });

  // Estado para controlar o botão de IA (Loading)
  const [isGeneratingAta, setIsGeneratingAta] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Função de Integração com a IA (Copilot / Azure OpenAI) ---
  const handleGenerateATA = async () => {
    if (!formData.ata || formData.ata.length < 15) {
      alert("Cole um rascunho, anotações soltas ou a transcrição no campo primeiro para a IA organizar.");
      return;
    }

    setIsGeneratingAta(true);

    try {
      if (!isGeminiConfiguredForCurrentEnv()) {
        alert('Configure VITE_GEMINI_API_KEY no ficheiro .env local (pasta gerador-atas).');
        return;
      }

      const systemPrompt = `Você é um assistente especialista em gestão educacional e documentação ágil de alto nível. 
      Sua missão é LER, INTERPRETAR e SINTETIZAR a transcrição bruta de um encontro de alinhamento entre a gestão e o Treinador Escolar.
      
      ## REGRAS DE PROCESSAMENTO E ESTILO (MUITO IMPORTANTE):
      1. Síntese Extrema: Seja cirúrgico. Use frases curtas e diretas.
      2. Limpeza Absoluta: Ignore falhas técnicas, gagueiras e repetições de palavras.
      3. Formatação TEXTO PURO: Não use Markdown (asteriscos, hashtags) nem tags HTML. Use apenas CAIXA ALTA para simular negrito em títulos e categorias.
      
      ## ESTRUTURA OBRIGATÓRIA DA ATA (Gere APENAS o modelo abaixo preenchido):
      
      ATA DE ALINHAMENTO DE TREINAMENTO
      
      PARTICIPANTES: [Nomes e Cargos]
      
      ---
      1. OBJETIVO DO ENCONTRO
      [Apenas uma frase curta resumindo o propósito principal da call]
      
      ---
      2. DIAGNÓSTICO E PONTOS DE ATENÇÃO
      - [ÁREA/TECNOLOGIA]: [Descrição hiper-resumida do problema]
      - [ÁREA/TECNOLOGIA]: [Descrição hiper-resumida do problema]
      
      ---
      3. DIRETRIZES E SOLUÇÕES TÉCNICAS
      - [FOCO DE MELHORIA]: [Orientação técnica/pedagógica]
      - [FOCO DE MELHORIA]: [Orientação...]
      
      ---
      4. PLANO DE AÇÃO (PRÓXIMOS PASSOS)
      - AÇÃO: [O que fazer] | RESPONSÁVEL: [Quem] | PRAZO: [Quando]
      - AÇÃO: [O que fazer] | RESPONSÁVEL: [Quem] | PRAZO: [Quando]
      `;

      const response = await geminiGenerateContent({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analise criticamente a transcrição abaixo e elabore a Ata final:\n\nTRANSCRIÇÃO:\n${formData.ata}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha na API: ${errorText}`);
      }

      const data = await response.json();
      const ataFormatada = data.candidates[0].content.parts[0].text.trim();

      // Atualiza o estado da tela com a Ata bonitona
      setFormData(prev => ({ ...prev, ata: ataFormatada }));
      
    } catch (error) {
      console.error("Deu ruim na geração real:", error);
      alert("Ocorreu um erro ao gerar a ATA real. Verifique o console.");
    } finally {
      setIsGeneratingAta(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trainerObj = TRAINERS.find(t => t.name === formData.trainerName);
    
    const timeParts = formData.duration ? formData.duration.split(':') : ['0', '0'];
    const hours = Number(timeParts[0]) || 0;
    const minutes = Number(timeParts[1]) || 0;
    const decimalDuration = hours + (minutes / 60);
    
    onSubmit({
      date: formData.date,
      duration: decimalDuration,
      trainer: trainerObj?.name || '',
      occupation: trainerObj?.occupation || '',
      school: formData.school,
      type: formData.type,
      link: formData.type === 'Web' ? formData.link : '',
      ata: formData.ata
    });

    setFormData({ date: new Date().toISOString().split('T')[0], duration: '01:00', trainerName: '', school: '', type: 'Presencial', link: '', ata: '' });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-12">
      <header className="mb-8">
        <h2 className="text-3xl md:text-4xl font-brand text-[#1331a1]">Registro de Encontro</h2>
        <p className="text-slate-500 font-medium text-base md:text-lg mt-1">Registro do momento de acessoria.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-xl border-t-[6px] border-[#F31366] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-sm font-bold text-[#1331a1] mb-2 uppercase">Data do Encontro *</label>
              <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none bg-slate-50 font-medium text-slate-700" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1331a1] mb-2 uppercase">Duração (Horas e Minutos) *</label>
              <input 
                type="time" 
                name="duration"
                required
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none transition-all bg-slate-50 font-medium text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1331a1] mb-2 uppercase">Treinador *</label>
              <select name="trainerName" required value={formData.trainerName} onChange={handleChange} className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none bg-slate-50 font-medium text-slate-700 cursor-pointer">
                <option value="">Selecione...</option>
                {TRAINERS.map(t => <option key={t.name} value={t.name}>{t.name} ({t.occupation})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1331a1] mb-2 uppercase">Escola / Unidade *</label>
              <select name="school" required value={formData.school} onChange={handleChange} className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none bg-slate-50 font-medium text-slate-700 cursor-pointer">
                <option value="">Selecione...</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-[#1331a1] mb-4 uppercase">Modalidade do Encontro *</label>
            <div className="flex flex-wrap gap-6 md:gap-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.type === 'Presencial' ? 'border-[#F44528]' : 'border-slate-300 group-hover:border-[#F44528]'}`}>
                  {formData.type === 'Presencial' && <div className="w-3 h-3 bg-[#F44528] rounded-full"></div>}
                </div>
                <input type="radio" name="type" value="Presencial" checked={formData.type === 'Presencial'} onChange={handleChange} className="hidden" />
                <span className="text-slate-700 font-bold group-hover:text-[#F44528] transition-colors">Presencial</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.type === 'Web' ? 'border-[#1331a1]' : 'border-slate-300 group-hover:border-[#1331a1]'}`}>
                  {formData.type === 'Web' && <div className="w-3 h-3 bg-[#1331a1] rounded-full"></div>}
                </div>
                <input type="radio" name="type" value="Web" checked={formData.type === 'Web'} onChange={handleChange} className="hidden" />
                <span className="text-slate-700 font-bold group-hover:text-[#1331a1] transition-colors">Online (Web)</span>
              </label>
            </div>
          </div>

          {formData.type === 'Web' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-bold text-[#1331a1] mb-2 uppercase">Link da Gravação</label>
              <input type="url" name="link" placeholder="https://meet.google.com/..." value={formData.link} onChange={handleChange} className="w-full px-5 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#1331a1] outline-none bg-slate-50 font-medium text-slate-700" />
            </div>
          )}

          {/* ÁREA DA ATA ATUALIZADA COM O BOTÃO DE IA */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-3">
              <label className="block text-sm font-bold text-[#1331a1] uppercase">
                ATA / Relato do Encontro *
              </label>
              <button 
                type="button" 
                onClick={handleGenerateATA}
                disabled={isGeneratingAta}
                className="text-xs font-bold text-white bg-gradient-to-r from-[#1331a1] to-[#F31366] hover:opacity-90 py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingAta ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Wand2 size={14} />
                )}
                {isGeneratingAta ? "ORGANIZANDO COM GEMINI..." : "ORGANIZAR COM GEMINI"}
              </button>
            </div>
            
            <textarea 
              name="ata" 
              required 
              rows="7" 
              placeholder="Descreve os pontos principais abordados ou cola aqui a transcrição bruta da reunião..." 
              value={formData.ata} 
              onChange={handleChange} 
              className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#F31366] outline-none bg-slate-50 font-medium text-slate-700 resize-y leading-relaxed" 
            />
            <p className="text-xs text-slate-400 mt-2 font-medium">
              💡 Dica: Cole anotações rápidas e clique no botão acima para formatar usando Inteligência Artificial.
            </p>
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-100">
            <button type="submit" className="w-full md:w-auto bg-[#F31366] hover:bg-[#d40c55] text-white font-brand text-xl py-4 px-10 rounded-xl transition-transform hover:-translate-y-1 flex justify-center items-center gap-3 shadow-[0_8px_20px_-6px_rgba(243,19,102,0.5)]">
              <Save size={24} /> SALVAR JORNADA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryView({ records }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedForReport, setSelectedForReport] = useState([]);
  const [isEmittingReport, setIsEmittingReport] = useState(false);

  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Templates em public/ — nomes só ASCII (Vercel / CDN).
  const ATA_TEMPLATE_URL = encodeURI(
    `${import.meta.env.BASE_URL}ata-competicao-2026.docx`.replaceAll('\\', '/')
  );
  const REPORT_TEMPLATE_URL = encodeURI(
    `${import.meta.env.BASE_URL}relatorio-competicao-2026.docx`.replaceAll('\\', '/')
  );

  const allSelectedForReport =
    sortedRecords.length > 0 && sortedRecords.every((r) => selectedForReport.includes(r.id));

  const toggleSelectForReport = (id) => {
    setSelectedForReport((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllForReport = () => {
    if (allSelectedForReport) setSelectedForReport([]);
    else setSelectedForReport(sortedRecords.map((r) => r.id));
  };

  const escapeXml = (str) => {
    const s = String(str ?? '');
    return s
      .replace(/\r?\n/g, ' ')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const replaceNextWTextAfterLabel = (xml, labelText, value) => {
    const idx = xml.indexOf(labelText);
    if (idx === -1) return xml;

    const nextWTextStart = xml.indexOf('<w:t', idx + labelText.length);
    if (nextWTextStart === -1) return xml;

    const start = xml.indexOf('>', nextWTextStart) + 1;
    const end = xml.indexOf('</w:t>', start);
    if (start <= 0 || end === -1) return xml;

    return xml.slice(0, start) + escapeXml(value) + xml.slice(end);
  };

  const safeValue = (s) => {
    const v = String(s ?? '').trim();
    return v ? v : 'Não informado';
  };

  const parseAtaForTemplate = (ataText) => {
    const raw = String(ataText ?? '');
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const findIndex = (re) => lines.findIndex((l) => re.test(l));

    const idxObj = findIndex(/^1\.\s*OBJETIVO DO ENCONTRO/i);
    const idxDiag = findIndex(/^2\.\s*DIAGN/i);
    const idxDir = findIndex(/^3\.\s*DIRETR/i);
    const idxPlan = findIndex(/^4\.\s*PLANO/i);

    const getFirstAfter = (startIdx) => {
      for (let i = startIdx + 1; i < lines.length; i++) {
        const l = lines[i];
        if (l === '---') continue;
        if (/^2\.\s*DIAGN/i.test(l) || /^3\.\s*DIRETR/i.test(l) || /^4\.\s*PLANO/i.test(l)) return '';
        return l;
      }
      return '';
    };

    const objective = idxObj !== -1 ? getFirstAfter(idxObj) : '';

    const collectUntilHeadingOrDash = (startIdx, stopRe) => {
      const acc = [];
      for (let i = startIdx + 1; i < lines.length; i++) {
        const l = lines[i];
        if (l === '---') break;
        if (stopRe.test(l)) break;
        acc.push(l);
      }
      return acc;
    };

    const diagnosisBlock = idxDiag !== -1 ? collectUntilHeadingOrDash(idxDiag, /^3\.\s*DIRETR/i) : [];
    const directivesBlock = idxDir !== -1 ? collectUntilHeadingOrDash(idxDir, /^4\.\s*PLANO/i) : [];
    const planBlock = idxPlan !== -1 ? collectUntilHeadingOrDash(idxPlan, /^$|^---$|^\s*$/) : [];

    const bullets = (block) => block.filter((l) => l.startsWith('-'));

    const parseKeyValueBullet = (line) => {
      // Esperado: "- X: Y"
      const cleaned = line.replace(/^-+\s*/, '');
      const idxColon = cleaned.indexOf(':');
      if (idxColon === -1) return { key: '', value: '' };
      const key = cleaned.slice(0, idxColon).trim();
      const value = cleaned.slice(idxColon + 1).trim();
      return {
        key: key.replace(/^\[(.*)\]$/, '$1').trim(),
        value: value.replace(/^\[(.*)\]$/, '$1').trim(),
      };
    };

    const parseDiagnosis = () => {
      const b = bullets(diagnosisBlock).map(parseKeyValueBullet);
      return [b[0], b[1]];
    };

    const parseDirectives = () => {
      const b = bullets(directivesBlock).map(parseKeyValueBullet);
      return [b[0], b[1]];
    };

    const parsePlan = () => {
      const b = bullets(planBlock).map((line) => {
        // Esperado: "- AÇÃO: ... | RESPONSÁVEL: ... | PRAZO: ..."
        const cleaned = line.replace(/^-+\s*/, '');
        const parts = cleaned.split('|').map((p) => p.trim());
        const getPart = (prefixRe) => {
          const found = parts.find((p) => prefixRe.test(p));
          if (!found) return '';
          const idx = found.indexOf(':');
          if (idx === -1) return found.trim();
          return found.slice(idx + 1).trim();
        };
        return {
          // Aceita tanto "AÇÃO" quanto "ACAO" (sem cedilha/acentos).
          action: getPart(/^A[CÇ][AÃ]O/i),
          responsible: getPart(/^RESPONS[AÁ]VEL/i),
          prazo: getPart(/^PRAZO/i),
        };
      });
      return [b[0], b[1]];
    };

    const participantsLine = lines.find((l) => /^PARTICIPANTES:/i.test(l));
    const participants = participantsLine
      ? participantsLine.replace(/^PARTICIPANTES:\s*/i, '').trim().replace(/^\[(.*)\]$/, '$1').trim()
      : '';

    const [d1, d2] = parseDiagnosis();
    const [f1, f2] = parseDirectives();
    const [p1, p2] = parsePlan();

    return {
      participants: participants.trim(),
      objective: objective.trim(),
      diag1: { area: d1?.key ?? '', desc: d1?.value ?? '' },
      diag2: { area: d2?.key ?? '', desc: d2?.value ?? '' },
      dir1: { focus: f1?.key ?? '', orient: f1?.value ?? '' },
      dir2: { focus: f2?.key ?? '', orient: f2?.value ?? '' },
      plan1: { action: p1?.action ?? '', responsible: p1?.responsible ?? '', prazo: p1?.prazo ?? '' },
      plan2: { action: p2?.action ?? '', responsible: p2?.responsible ?? '', prazo: p2?.prazo ?? '' },
    };
  };

  const handleExportATA = async (record) => {
    try {
      const response = await fetch(ATA_TEMPLATE_URL);
      if (!response.ok) throw new Error('Falha ao carregar o template DOCX.');

      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);

      const docFile = zip.file('word/document.xml');
      if (!docFile) throw new Error('document.xml não encontrado dentro do DOCX.');

      let xml = docFile.asText();

      // Campos "fixos" do modelo (caixas vazias após os labels)
      const dataPT = record?.date
        ? new Date(record.date + 'T00:00:00').toLocaleDateString('pt-PT')
        : '';

      const parsed = parseAtaForTemplate(record?.ata);

      xml = replaceNextWTextAfterLabel(xml, 'Escola atendida:', safeValue(record?.school));
      xml = replaceNextWTextAfterLabel(xml, 'Ocupa', safeValue(record?.occupation)); // evita acentos na busca
      xml = replaceNextWTextAfterLabel(xml, 'Competidor:', safeValue(parsed.participants || record?.trainer));
      xml = replaceNextWTextAfterLabel(xml, 'Treinador escolar:', safeValue(record?.trainer));
      xml = replaceNextWTextAfterLabel(xml, 'Treinador Regional:', ''); // se você souber, posso parametrizar
      xml = replaceNextWTextAfterLabel(xml, 'Data:', safeValue(dataPT));

      // Placeholders em colchetes (ordem no XML): 15 ocorrências
      const replacements = [
        safeValue(parsed.objective), // objetivo
        safeValue(parsed.diag1.area),
        safeValue(parsed.diag1.desc),
        safeValue(parsed.diag2.area),
        safeValue(parsed.diag2.desc),
        safeValue(parsed.dir1.focus),
        safeValue(parsed.dir1.orient),
        safeValue(parsed.dir2.focus),
        safeValue(parsed.dir2.orient),
        safeValue(parsed.plan1.action),
        safeValue(parsed.plan1.responsible),
        safeValue(parsed.plan1.prazo),
        safeValue(parsed.plan2.action),
        safeValue(parsed.plan2.responsible),
        safeValue(parsed.plan2.prazo),
      ];

      let tokenIndex = 0;
      xml = xml.replace(/\[[^\]]*\]/g, (match) => {
        const rep = replacements[tokenIndex];
        tokenIndex += 1;
        return rep !== undefined ? rep : match;
      });

      zip.file('word/document.xml', xml);

      const outBlob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = URL.createObjectURL(outBlob);
      const fileDate = record?.date ? String(record.date).slice(0, 10) : 'data';
      const fileName = `ATA_${record?.school || 'escola'}_${fileDate}.docx`.replace(/[\\/:*?"<>|]/g, '_');

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      console.error('Erro ao exportar DOCX:', e);
      alert('Não foi possível baixar a ATA em DOCX. Verifique o Console.');
    }
  };

  const handleEmitRelatorio = async () => {
    const selected = sortedRecords.filter((r) => selectedForReport.includes(r.id));
    if (selected.length === 0) {
      alert('Selecione pelo menos um registo para emitir o relatório.');
      return;
    }

    if (!isGeminiConfiguredForCurrentEnv()) {
      alert('Configure VITE_GEMINI_API_KEY no ficheiro .env local (pasta gerador-atas).');
      return;
    }

    setIsEmittingReport(true);
    try {
      const payloadRegistos = selected.map((r) => ({
        id: r.id,
        date: r.date,
        school: r.school,
        occupation: r.occupation,
        trainer: r.trainer,
        type: r.type,
        duration: r.duration,
        link: r.link || '',
        ata: r.ata || '',
      }));

      const registosJson = JSON.stringify(payloadRegistos, null, 2);

      const schemaDescr = `{
  "cabecalho": {
    "escola_atendida": "texto",
    "ocupacao": "texto",
    "competidor": "texto",
    "treinador_escolar": "texto",
    "treinador_regional": "texto"
  },
  "data_relatorio": "DD/MM/AAAA",
  "introducao": "um parágrafo",
  "atividades_realizadas": [
    "Dia DD/MM/AAAA - resumo do dia ou do conjunto de encontros desse dia",
    "- detalhe ou subtópico (opcional, repetir linhas conforme necessário)"
  ],
  "parecer_tecnico_desenvolvimento": "texto substituindo a área de parecer técnico (critérios, organização, interação, ergonomia, etc.)",
  "nota_simulado_medias_objetivos": "texto curto; se não existir nos registos: Não informado nos registos",
  "pontos_fortes_competidor": "texto após o rótulo Pontos Fortes",
  "pontos_melhoria_competidor": "texto após o rótulo Pontos de Melhoria",
  "consideracoes_infra_treinamento": "parágrafo",
  "consideracoes_docente": "parágrafo",
  "observacoes_complementares_fotos": "parágrafo (referir ausência de fotos se for o caso)",
  "encaminhamentos_paragrafo_1": "substitui o primeiro parágrafo orientativo após ENCAMINHAMENTOS",
  "encaminhamentos_paragrafo_2": "substitui o segundo parágrafo (plano de ação com a escola)",
  "local_data_assinatura": "ex.: Cidade, 24 de março de 2026"
}`;

      const systemPrompt = `Você é um especialista em documentação educacional do Senac Competições (Etapa Escolar 2026).
Recebe um array JSON de REGISTOS DE ENCONTROS; cada registo inclui data, escola, ocupação, treinador, tipo (Presencial/Web), duração, link (se Web) e o TEXTO COMPLETO DA ATA.

Sua tarefa: ler TODAS as atas, compreender o conjunto dos encontros selecionados e produzir o conteúdo de UM ÚNICO RELATÓRIO DE ACOMPANHAMENTO consolidado, para preencher o modelo oficial.

Regras:
- Responda APENAS com um objeto JSON válido (sem Markdown, sem texto antes ou depois).
- Use português (Portugal ou Brasil) de forma profissional e clara.
- Baseie-se apenas nos dados fornecidos; onde faltar informação, use expressões como "Não informado nos registos".
- Se houver mais do que uma escola ou ocupação nos registos, indique isso explicitamente em cabecalho.escola_atendida e cabecalho.ocupacao (ex.: listar ou "Consolidado — várias unidades").
- cabecalho.treinador_escolar: sintetize a partir dos treinadores nos registos (ou o principal se for um só).
- cabecalho.competidor: se as atas citarem participantes/competidor, sintetize; senão, infira do contexto ou "Não informado nos registos".
- atividades_realizadas: lista ORDENADA cronologicamente; para cada dia relevante use linha "Dia DD/MM/AAAA - …"; use linhas "- …" para subtópicos. Cubra todos os encontros dos registos.
- Os campos parecer_*, consideracoes_* e encaminhamentos_* devem integrar o conteúdo das atas (objetivos, diagnóstico, diretrizes, plano de ação) de forma coerente.
- data_relatorio e local_data_assinatura: use a data lógica do relatório (pode ser a data de hoje em formato português no local_data_assinatura).

Estrutura EXATA do JSON (chaves obrigatórias):
${schemaDescr}`;

      const geminiRes = await geminiGenerateContent({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Gere o JSON do relatório final a partir dos seguintes registos:\n\n${registosJson}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.25 },
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini: ${errText}`);
      }

      const geminiData = await geminiRes.json();
      const raw = geminiData.candidates[0].content.parts[0].text.trim();
      const parsed = parseGeminiJsonResponse(raw);
      const merged = mergeRelatorioPayload(parsed);

      const tplRes = await fetch(REPORT_TEMPLATE_URL);
      if (!tplRes.ok) throw new Error('Falha ao carregar o template do relatório DOCX.');
      const zip = new PizZip(await tplRes.arrayBuffer());
      const docFile = zip.file('word/document.xml');
      if (!docFile) throw new Error('document.xml não encontrado no relatório.');

      let xml = docFile.asText();
      xml = fillRelatorioDocumentXml(xml, merged);
      zip.file('word/document.xml', xml);

      const outBlob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const urlDl = URL.createObjectURL(outBlob);
      const stamp = new Date().toISOString().slice(0, 10);
      const escolaStub = (merged.cabecalho?.escola_atendida || 'relatorio')
        .slice(0, 40)
        .replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `Relatorio_${escolaStub}_${stamp}.docx`;

      const a = document.createElement('a');
      a.href = urlDl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(urlDl), 1500);
    } catch (e) {
      console.error('Erro ao emitir relatório:', e);
      alert('Não foi possível emitir o relatório. Verifique o console ou a resposta do Gemini.');
    } finally {
      setIsEmittingReport(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Escola', 'Treinador', 'Ocupação', 'Horas', 'Tipo', 'Link Gravação', 'ATA'];
    const csvRows = [
      headers.join(','),
      ...sortedRecords.map(record => {
        const escapeCSV = (str) => {
          if (!str) return '""';
          return `"${String(str).replace(/"/g, '""').replace(/\n/g, ' | ')}"`;
        };
        return [
          record.date, 
          escapeCSV(record.school), 
          escapeCSV(record.trainer), 
          escapeCSV(record.occupation),
          // Exporta como decimal com vírgula para o Excel (PT/BR) fazer contas nativamente
          record.duration.toString().replace('.', ','), 
          escapeCSV(record.type), 
          escapeCSV(record.link), 
          escapeCSV(record.ata)
        ].join(',');
      })
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jornada_herois_senac_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="animate-fadeIn pb-12">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-brand text-[#1331a1]">ENCONTROS REGISTRADOS</h2>
            <p className="text-slate-500 font-medium text-base md:text-lg mt-1">Histórico completo dos encontros realizadas pelos treinadores.</p>
            {selectedForReport.length > 0 && (
              <p className="text-sm font-bold text-[#1331a1] mt-2">{selectedForReport.length} selecionado(s) para relatório</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleEmitRelatorio}
              disabled={isEmittingReport || selectedForReport.length === 0}
              className="w-full sm:w-auto bg-[#1331a1] hover:bg-[#0b1f69] disabled:opacity-50 disabled:cursor-not-allowed text-white font-brand text-lg py-3 px-6 rounded-xl transition-transform hover:-translate-y-1 flex justify-center items-center gap-2 shadow-[0_8px_20px_-6px_rgba(19,49,161,0.4)] whitespace-nowrap"
            >
              {isEmittingReport ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              EMITIR RELATÓRIO
            </button>
            <button onClick={handleExportCSV} className="w-full sm:w-auto bg-[#a2ca02] hover:bg-[#8eb300] text-slate-900 font-brand text-lg py-3 px-6 rounded-xl transition-transform hover:-translate-y-1 flex justify-center items-center gap-2 shadow-[0_8px_20px_-6px_rgba(162,202,2,0.5)] whitespace-nowrap">
              <Download size={20} /> EXPORTAR CSV
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1331a1] text-white">
                <th className="py-4 px-3 w-14 text-center font-brand text-sm tracking-wide" title="Incluir no relatório">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/50 accent-[#F31366] cursor-pointer"
                    checked={allSelectedForReport}
                    onChange={toggleSelectAllForReport}
                    disabled={sortedRecords.length === 0}
                    aria-label="Selecionar todos para relatório"
                  />
                </th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide">Data</th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide">Escola</th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide">Treinador</th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide">Ocupação</th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide">Duração</th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide">Tipo</th>
                <th className="py-4 px-6 font-brand text-sm tracking-wide text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecords.length === 0 ? (
                <tr><td colSpan="8" className="py-12 text-center text-slate-500 font-medium text-lg">Nenhuma jornada registada ainda.</td></tr>
              ) : (
                sortedRecords.map(record => {
                  const style = getOccupationColor(record.occupation);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 accent-[#1331a1] cursor-pointer"
                          checked={selectedForReport.includes(record.id)}
                          onChange={() => toggleSelectForReport(record.id)}
                          aria-label={`Incluir relatório: ${record.school}`}
                        />
                      </td>
                      <td className="py-4 px-6 text-sm font-medium whitespace-nowrap text-slate-500">{new Date(record.date).toLocaleDateString('pt-PT')}</td>
                      <td className="py-4 px-6 text-sm font-bold text-[#1331a1]">{record.school}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-800">{record.trainer}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`py-1.5 px-3 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>{record.occupation}</span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {/* Chamada da função que formata visualmente os valores guardados */}
                        <span className="font-bold text-slate-700">{formatDurationDisplay(record.duration)}</span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          {record.type === 'Web' ? <Video size={16} className="text-[#1331a1]"/> : <Users size={16} className="text-[#F44528]"/>}
                          {record.type}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="text-[#1331a1] hover:text-white bg-blue-50 hover:bg-[#1331a1] p-2 rounded-xl transition-colors inline-flex items-center gap-1"
                            title="Ver Detalhes da Missão"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => handleExportATA(record)}
                            className="text-[#a2ca02] hover:text-slate-900 bg-[#a2ca02]/10 hover:bg-[#a2ca02]/20 p-2 rounded-xl transition-colors inline-flex items-center gap-1"
                            title="Baixar ATA (DOCX)"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-[#1331a1]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border-t-8 border-[#F8b62F]">
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data</p><p className="text-base text-[#1331a1] font-bold mt-1">{new Date(selectedRecord.date).toLocaleDateString('pt-PT')}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escola</p><p className="text-base text-[#1331a1] font-bold mt-1">{selectedRecord.school}</p></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duração</p>
                  <p className="text-base text-[#1331a1] font-bold mt-1">{formatDurationDisplay(selectedRecord.duration)}</p>
                </div>
                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treinador (Herói)</p><p className="text-base text-slate-800 font-bold mt-1">{selectedRecord.trainer}</p></div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ocupação</p>
                  <span className={`py-1.5 px-3 rounded-lg text-xs font-bold border ${getOccupationColor(selectedRecord.occupation).bg} ${getOccupationColor(selectedRecord.occupation).text} ${getOccupationColor(selectedRecord.occupation).border}`}>{selectedRecord.occupation}</span>
                </div>
              </div>

              {selectedRecord.type === 'Web' && selectedRecord.link && (
                <div className="bg-[#1331a1]/5 p-5 rounded-2xl border border-[#1331a1]/10">
                  <p className="text-xs font-bold text-[#1331a1] uppercase mb-2 flex items-center gap-2"><Video size={14}/> Gravação da Sessão Web</p>
                  <a href={selectedRecord.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#F31366] hover:text-[#d40c55] underline break-all">{selectedRecord.link}</a>
                </div>
              )}

              <div>
                <p className="text-sm font-brand text-[#1331a1] uppercase mb-3">Relato / ATA do Encontro</p>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">{selectedRecord.ata || 'Nenhuma ATA registada para este encontro.'}</div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => selectedRecord && handleExportATA(selectedRecord)}
                className="px-6 py-3 bg-[#1331a1] hover:bg-[#0b1f69] text-white font-bold rounded-xl transition-colors shadow-sm mr-3"
              >
                <span className="inline-flex items-center gap-2">
                  <Download size={18} /> BAIXAR ATA (DOCX)
                </span>
              </button>
              <button onClick={() => setSelectedRecord(null)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Componentes Menores Auxiliares ---
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 min-w-[140px] lg:min-w-0 flex items-center justify-center lg:justify-start gap-2 lg:gap-4 px-4 py-3.5 rounded-xl transition-all font-bold ${active ? 'bg-[#F31366] text-white shadow-[0_4px_12px_rgba(243,19,102,0.4)] lg:translate-x-1' : 'text-blue-100 hover:bg-[#0f2780] hover:text-white lg:hover:translate-x-1'}`}>
      <span className="shrink-0">{icon}</span>
      <span className="text-xs sm:text-sm tracking-wide whitespace-nowrap">{label}</span>
    </button>
  );
}

function StatCard({ icon, title, value, bg, border }) {
  return (
    <div className={`bg-white p-4 lg:p-6 rounded-2xl shadow-sm border ${border} flex flex-col xl:flex-row items-center justify-center xl:justify-start gap-2 xl:gap-5 hover:-translate-y-1 transition-transform cursor-default overflow-hidden text-center xl:text-left`}>
      <div className={`hidden xl:flex p-4 ${bg} rounded-2xl shrink-0 items-center justify-center`}>{icon}</div>
      <div className="flex-1 w-full flex flex-col justify-center items-center xl:items-start overflow-hidden">
        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2 w-full truncate">{title}</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-brand text-[#1331a1] leading-none whitespace-nowrap">{value}</p>
      </div>
    </div>
  );
}