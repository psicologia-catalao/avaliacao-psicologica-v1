import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let app, auth, db;
if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

const DASS21_QUESTIONS = [ { text: "1. Achei difícil me acalmar.", scale: 'S' }, { text: "2. Senti minha boca seca.", scale: 'A' }, { text: "3. Não consegui sentir nenhum sentimento positivo.", scale: 'D' }, { text: "4. Tive dificuldade em respirar (ex: respiração ofegante, falta de ar).", scale: 'A' }, { text: "5. Achei difícil ter iniciativa para fazer as coisas.", scale: 'D' }, { text: "6. Tendi a reagir de forma exagerada às situações.", scale: 'S' }, { text: "7. Senti tremores (ex: nas mãos).", scale: 'A' }, { text: "8. Senti que estava usando muita energia nervosa.", scale: 'S' }, { text: "9. Preocupei-me com situações em que eu pudesse entrar em pânico e parecer ridículo(a).", scale: 'A' }, { text: "10. Senti que não tinha nada a esperar.", scale: 'D' }, { text: "11. Senti-me agitado(a).", scale: 'S' }, { text: "12. Tive dificuldade em relaxar.", scale: 'S' }, { text: "13. Senti-me triste e deprimido(a).", scale: 'D' }, { text: "14. Fui intolerante com coisas que me impediam de continuar o que eu estava fazendo.", scale: 'S' }, { text: "15. Senti que estava prestes a entrar em pânico.", scale: 'A' }, { text: "16. Não consegui me entusiasmar com nada.", scale: 'D' }, { text: "17. Senti que não tinha valor como pessoa.", scale: 'D' }, { text: "18. Senti que estava um pouco sensível demais.", scale: 'S' }, { text: "19. Percebi meu coração alterar o ritmo na ausência de esforço físico.", scale: 'A' }, { text: "20. Senti medo sem motivo.", scale: 'A' }, { text: "21. Senti que a vida não tinha sentido.", scale: 'D' } ];
const DSM5_QUESTIONS = [ { text: "1. Pouco interesse ou prazer em fazer as coisas." }, { text: "2. Sentir-se triste, deprimido(a) ou sem esperança." }, { text: "3. Sentir mais irritação, mau humor ou raiva do que o habitual." }, { text: "4. Sentir-se nervoso(a), ansioso(a), assustado(a) ou em pânico." }, { text: "5. Preocupar-se demais com diferentes coisas." }, { text: "6. Evitar situações que o(a) deixam ansioso(a)." }, { text: "7. Ter pensamentos sobre se machucar ou que seria melhor estar morto(a)." }, { text: "8. Ouvir coisas que outras pessoas não podiam ouvir." }, { text: "9. Sentir que alguém poderia feri-lo(a) ou que sua mente estava lhe pregando peças." }, { text: "10. Problemas de memória ou concentração." }, { text: "11. Ter pensamentos ou imagens indesejadas que você não consegue tirar da cabeça." }, { text: "12. Sentir-se compelido(a) a realizar certos comportamentos repetidamente." }, { text: "13. Sentir-se distante ou desapegado(a) de si mesmo(a), do seu corpo ou do seu ambiente." }, { text: "14. Problemas com dores de cabeça, dores de estômago ou outras dores físicas." }, { text: "15. Problemas para dormir que afetam sua qualidade de sono ou o deixam cansado(a)." }, { text: "16. Problemas com o apetite, comer demais ou evitar alimentos." }, { text: "17. Sentir-se confuso(a) sobre sua identidade ou para onde está indo na vida." }, { text: "18. Problemas em se dar bem ou manter relacionamentos." }, { text: "19. Problemas no trabalho, na escola ou em casa." }, { text: "20. Consumo de álcool ou drogas mais do que o habitual." }, { text: "21. Pensar em seus hábitos de jogo, álcool ou drogas como um problema." }, { text: "22. Ter problemas médicos que o(a) preocupam." }, { text: "23. Ter pensamentos, memórias ou pesadelos sobre um evento traumático." } ];
const WHOQOL_QUESTIONS = [ { text: "1. Como você avaliaria sua qualidade de vida?", domain: "Geral", options: [{text:"Muito ruim", value:1}, {text:"Ruim", value:2}, {text:"Nem ruim, nem boa", value:3}, {text:"Boa", value:4}, {text:"Muito boa", value:5}] }, { text: "2. Quão satisfeito(a) você está com a sua saúde?", domain: "Geral", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "3. Em que medida você acha que sua dor (física) impede você de fazer o que você precisa?", domain: "Físico", options: [{text:"Nada", value:5}, {text:"Um pouco", value:4}, {text:"Médio", value:3}, {text:"Muito", value:2}, {text:"Extremamente", value:1}] }, { text: "4. O quanto você precisa de algum tratamento médico para levar sua vida diária?", domain: "Físico", options: [{text:"Nada", value:5}, {text:"Um pouco", value:4}, {text:"Médio", value:3}, {text:"Muito", value:2}, {text:"Extremamente", value:1}] }, { text: "5. O quanto você aproveita a vida?", domain: "Psicológico", options: [{text:"Nada", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito", value:4}, {text:"Extremamente", value:5}] }, { text: "6. Em que medida você sente que a sua vida tem sentido?", domain: "Psicológico", options: [{text:"Nada", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito", value:4}, {text:"Extremamente", value:5}] }, { text: "7. Quão bem você é capaz de se concentrar?", domain: "Psicológico", options: [{text:"Nada bem", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito bem", value:4}, {text:"Extremamente bem", value:5}] }, { text: "8. Quão seguro(a) você se sente em sua vida diária?", domain: "Físico", options: [{text:"Nada seguro", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito seguro", value:4}, {text:"Extremamente seguro", value:5}] }, { text: "9. Quão saudável é o seu ambiente físico (clima, barulho, poluição, atrativos)?", domain: "Ambiente", options: [{text:"Nada saudável", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito saudável", value:4}, {text:"Extremamente saudável", value:5}] }, { text: "10. Você tem energia suficiente para o seu dia-a-dia?", domain: "Físico", options: [{text:"Nada", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito", value:4}, {text:"Extremamente", value:5}] }, { text: "11. Você é capaz de aceitar sua aparência física?", domain: "Psicológico", options: [{text:"Nada capaz", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito capaz", value:4}, {text:"Completamente capaz", value:5}] }, { text: "12. Você tem dinheiro suficiente para satisfazer suas necessidades?", domain: "Ambiente", options: [{text:"Nada", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito", value:4}, {text:"Completamente", value:5}] }, { text: "13. Quão disponíveis estão para você as informações que precisa no seu dia-a-dia?", domain: "Ambiente", options: [{text:"Nada", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito", value:4}, {text:"Completamente", value:5}] }, { text: "14. Em que medida você tem oportunidades de atividades de lazer?", domain: "Ambiente", options: [{text:"Nenhuma", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muitas", value:4}, {text:"Extremamente", value:5}] }, { text: "15. Quão bem você é capaz de se locomover?", domain: "Físico", options: [{text:"Nada bem", value:1}, {text:"Um pouco", value:2}, {text:"Médio", value:3}, {text:"Muito bem", value:4}, {text:"Extremamente bem", value:5}] }, { text: "16. Quão satisfeito(a) você está com o seu sono?", domain: "Físico", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "17. Quão satisfeito(a) você está com sua capacidade para o trabalho?", domain: "Físico", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "18. Quão satisfeito(a) você está consigo mesmo?", domain: "Psicológico", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "19. Quão satisfeito(a) você está com suas relações pessoais (amigos, parentes, conhecidos, colegas)?", domain: "Social", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "20. Quão satisfeito(a) você está com sua vida sexual?", domain: "Social", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "21. Quão satisfeito(a) você está com o apoio que você recebe de seus amigos?", domain: "Social", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "22. Quão satisfeito(a) você está com as condições do local onde mora?", domain: "Ambiente", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "23. Quão satisfeito(a) você está com o seu acesso aos serviços de saúde?", domain: "Ambiente", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "24. Quão satisfeito(a) você está com o seu meio de transporte?", domain: "Ambiente", options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] }, { text: "25. Com que frequência você tem sentimentos negativos como mau humor, desespero, ansiedade, depressão?", domain: "Psicológico", inverted: true, options: [{text:"Nunca", value:5}, {text:"Raramente", value:4}, {text:"Às vezes", value:3}, {text:"Frequentemente", value:2}, {text:"Sempre", value:1}] }, { text: "26. Quão satisfeito(a) você está com suas atividades do dia-a-dia?", domain: "Físico", isNew: true, options: [{text:"Muito insatisfeito", value:1}, {text:"Insatisfeito", value:2}, {text:"Nem satisfeito, nem insatisfeito", value:3}, {text:"Satisfeito", value:4}, {text:"Muito satisfeito", value:5}] } ];

export default function App() {
    const [page, setPage] = useState('auth');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleDemoLogin = () => {
        setUser({ uid: 'demo-user', email: 'cliente@demo.com', isDemo: true });
        setPage('consent');
    };

    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, currentUser => {
            setUser(currentUser);
            if (!currentUser) setPage('auth');
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const renderPage = () => {
        if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">A carregar...</div></div>;
        
        switch (page) {
            case 'auth': return <AuthPage onDemoLogin={handleDemoLogin} setPage={setPage} />;
            case 'consent': return <ConsentPage user={user} setPage={setPage} />;
            case 'assessment': return <AssessmentPage user={user} setPage={setPage} />;
            case 'dashboard': return <DashboardPage user={user} />;
            case 'profile': return <ProfilePage user={user} />;
            default: return user ? <DashboardPage user={user} /> : <AuthPage onDemoLogin={handleDemoLogin} setPage={setPage} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800" style={{'--primary-color': '#82b3cc'}}>
            {page !== 'auth' && user && <Header user={user} setPage={setPage} />}
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                {renderPage()}
            </main>
        </div>
    );
}

function Header({ user, setPage }) {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    const handleSignOut = async () => {
        if (user && user.isDemo) {
            window.location.reload();
        } else if (auth) {
            await signOut(auth);
        }
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl md:text-2xl font-bold" style={{ color: primaryColor }}>Plataforma de Avaliação</h1>
                    {user?.isDemo && <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">DEMO</span>}
                </div>
                <div className="flex items-center space-x-2 md:space-x-6 text-sm md:text-base">
                    <button onClick={() => setPage('dashboard')} className="text-gray-600 hover:text-[--primary-color] font-medium transition-colors">Dashboard</button>
                    <button onClick={() => setPage('assessment')} className="text-gray-600 hover:text-[--primary-color] font-medium transition-colors">Avaliações</button>
                    <button onClick={() => setPage('profile')} className="text-gray-600 hover:text-[--primary-color] font-medium transition-colors">Perfil</button>
                    <button onClick={handleSignOut} className="bg-[--primary-color] text-white py-2 px-4 rounded-lg hover:opacity-90 transition shadow-sm font-semibold">Sair</button>
                </div>
            </nav>
        </header>
    );
}

function AuthPage({ onDemoLogin, setPage }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (email.toLowerCase() === 'cliente@demo.com') { onDemoLogin(); return; }
        if (!auth) { setError("Plataforma não configurada. Por favor, contacte o suporte."); return; }
        
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setPage('dashboard');
            } else {
                if (!age || !gender) { setError("Idade e sexo são obrigatórios."); return; }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: userCredential.user.email,
                    age: age,
                    gender: gender,
                    createdAt: new Date()
                });
                setPage('consent');
            }
        } catch (err) {
            setError(err.code === 'auth/weak-password' ? 'A senha deve ter pelo menos 6 caracteres.' : 'Email ou senha inválidos.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">{isLogin ? 'Login do Cliente' : 'Cadastro de Novo Cliente'}</h2>
                <p className="text-center text-gray-500 mb-6">Acesso seguro à sua jornada terapêutica.</p>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 mb-6 rounded-lg text-sm">
                  <p><b>Para testar:</b> use o email <b className="font-mono">cliente@demo.com</b> e qualquer senha.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary-color]" required />
                    <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary-color]" required />
                    {!isLogin && (
                        <>
                            <input type="number" placeholder="Idade" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary-color]" required />
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary-color] text-gray-500" required>
                                <option value="">Selecione o sexo...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-[--primary-color] text-white py-3 rounded-lg hover:opacity-90 transition font-semibold text-lg shadow-sm">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
                </form>
                <p className="text-center mt-4">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-[--primary-color] hover:underline font-medium">
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                    </button>
                </p>
            </div>
        </div>
    );
}

function ConsentPage({ setPage }) {
    const [agreed, setAgreed] = useState(false);
    return (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Termo de Consentimento Informado</h2>
            <div className="text-gray-600 space-y-3 text-sm max-h-60 overflow-y-auto pr-3 border-l-2 pl-4">
                <p>Bem-vindo(a) à nossa plataforma de avaliação. Ao continuar, você concorda com os seguintes pontos:</p>
                <p><b>1. Finalidade:</b> Os dados coletados através dos questionários serão utilizados exclusivamente para fins de acompanhamento terapêutico e psicoeducação, sob a supervisão do seu psicólogo.</p>
                <p><b>2. Confidencialidade:</b> Suas respostas são confidenciais. Apenas você e seu terapeuta terão acesso aos dados brutos e relatórios de progresso. A plataforma utiliza criptografia para proteger suas informações.</p>
                <p><b>3. Natureza dos Instrumentos:</b> As ferramentas aqui presentes são instrumentos de rastreio e acompanhamento, e não substituem uma avaliação psicológica completa ou um diagnóstico formal.</p>
                <p><b>4. Seus Direitos (LGPD):</b> Você tem o direito de solicitar a exportação ou a exclusão completa de seus dados a qualquer momento, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
            </div>
            <div className="mt-6">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="h-5 w-5 rounded border-gray-300 text-[--primary-color] focus:ring-[--primary-color]" />
                    <span className="ml-3 text-gray-700 font-medium">Li e concordo com os termos.</span>
                </label>
            </div>
            <button onClick={() => setPage('assessment')} disabled={!agreed} className="w-full mt-6 bg-[--primary-color] text-white py-3 rounded-lg hover:opacity-90 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                Continuar para as Avaliações
            </button>
        </div>
    );
}

function AssessmentPage({ user, setPage }) {
    const [activeTab, setActiveTab] = useState('dass21');
    const tabs = [
        { id: 'dass21', label: 'DASS-21' },
        { id: 'dsm5', label: 'DSM-5 Nível 1' },
        { id: 'whoqol', label: 'WHOQOL-Bref' },
    ];
    
    return (
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
             <h2 className="text-2xl sm:text-3xl font-bold mb-1">Central de Avaliação Inicial</h2>
             <p className="text-gray-500 mb-6">Por favor, responda aos questionários abaixo. Seus dados são confidenciais.</p>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-[--primary-color] text-[--primary-color]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6">
                <InstrumentRenderer instrumentKey={activeTab} user={user} setPage={setPage} />
            </div>
        </div>
    );
}

const InstrumentRenderer = ({ instrumentKey, user, setPage }) => {
    const [responses, setResponses] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    let questions, title, reference, options, scoreFunction, instruction;
    switch (instrumentKey) {
        case 'dass21':
            title = 'Escala de Depressão, Ansiedade e Estresse (DASS-21)';
            questions = DASS21_QUESTIONS;
            instruction = "Indique o quanto cada afirmação se aplicou a você durante a última semana.";
            options = [ { text: "Não se aplicou", value: 0 }, { text: "Aplicou-se em algum grau", value: 1 }, { text: "Aplicou-se consideravelmente", value: 2 }, { text: "Aplicou-se muito", value: 3 } ];
            reference = "Fonte: Lovibond, S.H. & Lovibond, P.F. (1995). Manual for the Depression Anxiety Stress Scales. (2nd. Ed.) Sydney: Psychology Foundation.";
            scoreFunction = (res) => {
                let scores = { D: 0, A: 0, S: 0 };
                questions.forEach((q, i) => { if(res[i] !== undefined) scores[q.scale] += res[i] });
                return { depression: scores.D * 2, anxiety: scores.A * 2, stress: scores.S * 2 };
            };
            break;
        case 'dsm5':
            title = 'Medida Transversal do Nível 1 do DSM-5 — Adulto';
            questions = DSM5_QUESTIONS;
            instruction = "Indique o quanto você foi incomodado(a) por cada problema nas últimas 2 semanas.";
            options = [ { text: "Nenhuma (0)", value: 0 }, { text: "Leve (1)", value: 1 }, { text: "Moderada (2)", value: 2 }, { text: "Grave (3)", value: 3 }, { text: "Muito Grave (4)", value: 4 } ];
            reference = "Fonte: American Psychiatric Association (2013). DSM-5. Adaptação da medida de autoavaliação.";
            scoreFunction = (res) => ({ totalScore: Object.values(res).reduce((a, b) => a + b, 0) });
            break;
        case 'whoqol':
            title = 'Instrumento de Avaliação de Qualidade de Vida da OMS (WHOQOL-Bref)';
            questions = WHOQOL_QUESTIONS;
            instruction = "Responda com base na sua experiência nas últimas 2 semanas.";
            reference = "Fonte: The WHOQOL Group (1998). Development of the World Health Organization WHOQOL-BREF quality of life assessment.";
            scoreFunction = (res) => ({ rawResponses: res });
            break;
        default: return null;
    }

    const handleSubmit = async () => {
        if (Object.keys(responses).length < questions.length) { alert("Por favor, responda a todas as perguntas."); return; }
        setIsSubmitting(true);
        if (user.isDemo) {
            alert(`Respostas do ${title} salvas com sucesso! (Modo Demonstração)`);
            setIsSubmitting(false);
            setPage('dashboard');
            return;
        }

        const calculatedScores = scoreFunction(responses);
        try {
            await addDoc(collection(db, "assessmentResponses"), {
                userId: user.uid,
                instrument: instrumentKey,
                scores: calculatedScores,
                responses: responses,
                createdAt: new Date(),
            });
            alert(`${title} salvo com sucesso!`);
            setPage('dashboard');
        } catch (error) {
            console.error("Error: ", error);
            alert("Ocorreu um erro ao salvar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-1">{title}</h3>
            <p className="text-gray-500 mb-6 text-sm"><b>{instruction}</b></p>
            <div className="space-y-5">
                {questions.map((q, i) => (
                    <div key={`${instrumentKey}-${i}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="font-medium mb-3">{q.text}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                            {(q.options || options).map(opt => (
                                <label key={`${instrumentKey}-${i}-${opt.value}`} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name={`q${i}`} value={opt.value} onChange={(e) => setResponses(prev => ({ ...prev, [i]: parseInt(e.target.value) }))} className="form-radio h-4 w-4 text-[--primary-color] focus:ring-2 focus:ring-[--primary-color]" required/>
                                    <span>{opt.text}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-6 italic">{reference}</p>
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6 bg-[--primary-color] text-white py-3 rounded-lg hover:opacity-90 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isSubmitting ? 'A Salvar...' : 'Salvar e Concluir'}
            </button>
        </div>
    );
};

function DashboardPage({ user }) {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user.isDemo) {
                setChartData({ labels: ['01/04', '08/04', '15/04', '22/04'], datasets: [ { label: 'Depressão', data: [22, 18, 16, 14], borderColor: '#82b3cc', backgroundColor: '#82b3cc20', fill: true }, { label: 'Ansiedade', data: [18, 15, 12, 10], borderColor: '#333', backgroundColor: '#33333320', fill: true }, { label: 'Stress', data: [28, 25, 20, 18], borderColor: '#888', backgroundColor: '#88888820', fill: true }, ] });
                setLoading(false);
                return;
            }
            if (!db) { setLoading(false); return; }
            try {
                const q = query(collection(db, "assessmentResponses"), where("userId", "==", user.uid), where("instrument", "==", "dass21"), orderBy("createdAt", "asc"));
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs.map(doc => doc.data());

                if (results.length > 0) {
                    const labels = results.map(r => new Date(r.createdAt.seconds * 1000).toLocaleDateString('pt-PT'));
                    setChartData({
                        labels,
                        datasets: [
                            { label: 'Depressão', data: results.map(r => r.scores.depression), borderColor: '#82b3cc', backgroundColor: '#82b3cc20', fill: true, tension: 0.1 },
                            { label: 'Ansiedade', data: results.map(r => r.scores.anxiety), borderColor: '#333', backgroundColor: '#33333320', fill: true, tension: 0.1 },
                            { label: 'Stress', data: results.map(r => r.scores.stress), borderColor: '#888', backgroundColor: '#88888820', fill: true, tension: 0.1 },
                        ],
                    });
                }
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [user]);

    return (
        <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-2">Dashboard de Progresso</h2>
            <p className="text-gray-500 mb-6">Olá, {user.email}! Aqui pode ver a sua evolução.</p>
            {loading ? <div className="text-center p-10">A carregar o seu progresso...</div> : chartData ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <Line options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Evolução DASS-21', font: {size: 16} } }, scales: { y: { beginAtZero: true, suggestedMax: 42 } } }} data={chartData} />
                </div>
            ) : <p className="text-center p-10 bg-gray-50 rounded-lg text-gray-600">Ainda não existem dados do DASS-21 para exibir. Responda na Central de Avaliação para começar.</p>}
        </div>
    );
}

function ProfilePage({ user }) {
    const handleRequest = (type) => {
        alert(`(Simulação) Pedido de ${type} dos seus dados foi enviado. Em um sistema real, isso iniciaria um processo administrativo. Contacte o terapeuta para mais informações.`);
    };
    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Perfil do Cliente</h2>
            <p className="text-gray-500 mb-6">Gerencie suas informações e dados.</p>
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Email:</strong> {user.email}</p>
                </div>
                <p className="text-sm text-gray-600 pt-2">Conforme a LGPD, você tem o direito de solicitar seus dados ou a exclusão da sua conta.</p>
                <div className="flex space-x-4 pt-4">
                    <button onClick={() => handleRequest('exportação')} className="flex-1 bg-gray-600 text-white py-2.5 rounded-lg hover:bg-gray-700 transition font-semibold">Exportar Meus Dados</button>
                    <button onClick={() => handleRequest('exclusão')} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition font-semibold">Excluir Minha Conta</button>
                </div>
            </div>
        </div>
    );
}
