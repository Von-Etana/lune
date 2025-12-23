import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Assessment } from './components/Assessment';
import { EmployerDashboard } from './components/EmployerDashboard';
import { CandidateDashboard } from './components/CandidateDashboard';
import { AuthModal } from './components/AuthModal';
import { ViewState, UserRole, EvaluationResult, CandidateProfile, DifficultyLevel } from './types';
import { CheckCircle, AlertCircle, Code, ArrowLeft, ArrowRight, Award, ShieldCheck, Share2, Copy, Github, Download, ExternalLink } from 'lucide-react';
import { ToastProvider, useToast } from './lib/toast';
import { celebrateSuccess } from './lib/confetti';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Mock logged-in candidate
const MOCK_PROFILE: CandidateProfile = {
  id: '123',
  name: 'Jordan Lee',
  title: 'Junior Developer',
  location: 'San Francisco, CA',
  yearsOfExperience: 2,
  preferredWorkMode: 'Hybrid',
  skills: { 'JavaScript': 75, 'React': 60 },
  certifications: []
};

function AppContent() {
  const toast = useToast();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Mid-Level');
  const [assessmentResult, setAssessmentResult] = useState<EvaluationResult | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(MOCK_PROFILE);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setCandidateProfile(prev => ({
        ...prev,
        id: user.id,
        name: user.name,
      }));
      setUserRole(user.role === 'candidate' ? UserRole.CANDIDATE : UserRole.EMPLOYER);
    }
  }, [user]);

  const handleNavigate = (view: ViewState, role?: UserRole) => {
    if (role) setUserRole(role);

    // Handle auth views by opening modal instead
    if (view === ViewState.LOGIN) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (view === ViewState.SIGNUP) {
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      return;
    }
    if (view === ViewState.AUTH_SELECTION) {
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      return;
    }

    setCurrentView(view);
  };

  const handleAuthSuccess = (role: 'candidate' | 'employer') => {
    setAuthModalOpen(false);
    if (role === 'candidate') {
      setUserRole(UserRole.CANDIDATE);
      setCurrentView(ViewState.CANDIDATE_DASHBOARD);
    } else {
      setUserRole(UserRole.EMPLOYER);
      setCurrentView(ViewState.EMPLOYER_DASHBOARD);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserRole(null);
    setCurrentView(ViewState.LANDING);
    toast.success('👋 Logged out successfully!');
  };

  const handleStartAssessment = (skill?: string) => {
    if (skill) {
      setSelectedSkill(skill);
      // Instead of going directly to assessment, go to difficulty selection
      setCurrentView(ViewState.SKILL_SELECTION); // Or create a new ViewState for Difficulty if preferred, but we can re-use logic
    } else {
      setCurrentView(ViewState.SKILL_SELECTION);
    }
  };

  const startAssessmentFlow = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setCurrentView(ViewState.ASSESSMENT);
  };

  const handleAssessmentComplete = (result: EvaluationResult) => {
    setAssessmentResult(result);
    setCurrentView(ViewState.ASSESSMENT_RESULT);

    // Update local profile if passed
    if (result.passed && result.certificationHash) {
      setCandidateProfile(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [selectedSkill]: result.score
        },
        certifications: [...prev.certifications, result.certificationHash!]
      }));

      // Celebrate with confetti!
      celebrateSuccess();
      toast.success(`🎉 Congratulations! You scored ${result.score}/100 on ${selectedSkill}!`);
    } else if (result.cheatingDetected) {
      toast.error('❌ Assessment invalidated due to integrity concerns.');
    } else {
      toast.warning(`Keep practicing! You scored ${result.score}/100. Need 70+ to pass.`);
    }
  };



  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://lune.platform/verify/${assessmentResult?.certificationHash}`);
    toast.success("🔗 Verification link copied to clipboard!");
  };

  const handleShare = () => {
    const text = `I just verified my ${selectedSkill} skills on Lune with a score of ${assessmentResult?.score}/100! #LuneVerified #Web3`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.info("📤 Opening Twitter to share...");
  };

  const renderAuthSelection = () => (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2 text-teal-900">Welcome to Lune</h2>
        <p className="text-gray-500 mb-8">Select your role to continue</p>

        <div className="space-y-4">
          <button
            onClick={() => handleNavigate(ViewState.CANDIDATE_DASHBOARD, UserRole.CANDIDATE)}
            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-orange hover:bg-orange/5 transition flex items-center gap-4 group text-left"
          >
            <div className="bg-orange/10 p-3 rounded-lg text-orange group-hover:bg-orange group-hover:text-white transition">
              <Code size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">I am a Candidate</div>
              <div className="text-xs text-slate-500">Verify skills & get certified</div>
            </div>
          </button>

          <button
            onClick={() => handleNavigate(ViewState.EMPLOYER_DASHBOARD, UserRole.EMPLOYER)}
            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-teal hover:bg-teal/5 transition flex items-center gap-4 group text-left"
          >
            <div className="bg-teal/10 p-3 rounded-lg text-teal group-hover:bg-teal group-hover:text-white transition">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">I am an Employer</div>
              <div className="text-xs text-slate-500">Find verified talent</div>
            </div>
          </button>
        </div>
        <button
          onClick={() => setCurrentView(ViewState.LANDING)}
          className="mt-8 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>
    </div>
  );

  // Combined Skill & Difficulty Selection
  const renderSkillSelection = () => (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex items-center mb-8">
          <button onClick={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)} className="bg-white p-2 rounded-full hover:bg-gray-100 mr-4">
            <ArrowLeft />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {selectedSkill ? 'Select Difficulty' : 'Select a Skill to Verify'}
            </h2>
            <p className="text-gray-500">
              {selectedSkill ? `Choose the level for your ${selectedSkill} assessment.` : 'Choose a domain to start your proctored assessment.'}
            </p>
          </div>
        </div>

        {!selectedSkill ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Frontend Engineering', 'Backend Engineering', 'Cloud Architecture'].map((domain) => (
              <div key={domain} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-lg mb-4 text-teal-800">{domain}</h3>
                <div className="flex flex-wrap gap-2">
                  {(domain === 'Frontend Engineering' ? ['React', 'Vue', 'CSS'] :
                    domain === 'Backend Engineering' ? ['Node.js', 'Python', 'Java'] :
                      ['AWS', 'Docker', 'Kubernetes']).map(skill => (
                        <button
                          key={skill}
                          onClick={() => setSelectedSkill(skill)}
                          className="px-3 py-1.5 border border-gray-200 rounded-full text-sm hover:bg-teal hover:text-white hover:border-teal transition"
                        >
                          {skill}
                        </button>
                      ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Beginner', 'Mid-Level', 'Advanced'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => startAssessmentFlow(level)}
                className="bg-white p-8 rounded-2xl border-2 border-transparent hover:border-teal hover:shadow-lg transition text-left group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${level === 'Beginner' ? 'bg-green-100 text-green-700' : level === 'Mid-Level' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {level}
                  </span>
                  <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 text-teal transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{level}</h3>
                <p className="text-sm text-gray-500">
                  {level === 'Beginner' ? 'Basic syntax and core concepts.' :
                    level === 'Mid-Level' ? 'Best practices, patterns, and optimization.' :
                      'System design, edge cases, and performance.'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderResult = () => {
    if (!assessmentResult) return null;

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className={`md:w-1/3 p-8 ${assessmentResult.passed ? 'bg-teal' : 'bg-red-500'} flex flex-col items-center justify-center text-white`}>
            {assessmentResult.passed ? <ShieldCheck size={80} className="mb-4" /> : <AlertCircle size={80} className="mb-4" />}
            <h2 className="text-2xl font-bold text-center mb-2">
              {assessmentResult.passed ? 'Verified!' : 'Not Passed'}
            </h2>
            <div className="text-5xl font-bold my-2">{assessmentResult.score}</div>
            <div className="text-sm opacity-80">{selectedDifficulty} • {selectedSkill}</div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <div className="flex-1">
              <div className="bg-gray-50 p-4 rounded-xl text-left text-sm text-gray-600 mb-6 border border-gray-100">
                <p className="font-bold mb-1 text-gray-900">AI Performance Analysis:</p>
                {assessmentResult.feedback}
              </div>

              {assessmentResult.cheatingDetected && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm mb-6 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Integrity Flag Raised:</strong> {assessmentResult.cheatingReason}
                  </div>
                </div>
              )}

              {assessmentResult.certificationHash && (
                <div className="mb-6">
                  <div className="text-xs uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                    <Award size={12} /> PWR Chain Certificate
                  </div>
                  <div className="font-mono text-xs bg-gray-100 p-3 rounded border border-gray-200 text-teal-700 break-all">
                    {assessmentResult.certificationHash}
                  </div>
                </div>
              )}
            </div>

            {assessmentResult.passed && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                  <Copy size={16} /> Copy Link
                </button>
                <button onClick={handleShare} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                  <Share2 size={16} /> Share
                </button>
                <button className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800">
                  <Github size={16} /> Add to GitHub Profile
                </button>
              </div>
            )}

            <button
              onClick={() => setCurrentView(ViewState.CANDIDATE_DASHBOARD)}
              className="mt-4 text-center text-gray-400 text-sm hover:text-gray-600"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {currentView === ViewState.LANDING && <Landing onNavigate={handleNavigate} />}

      {currentView === ViewState.CANDIDATE_DASHBOARD && (
        <CandidateDashboard
          candidate={candidateProfile}
          onStartAssessment={handleStartAssessment}
          onLogout={handleLogout}
          onUpdateProfile={(updates) => setCandidateProfile(prev => ({ ...prev, ...updates }))}
        />
      )}

      {currentView === ViewState.SKILL_SELECTION && renderSkillSelection()}

      {currentView === ViewState.ASSESSMENT && (
        <Assessment skill={selectedSkill} difficulty={selectedDifficulty} onComplete={handleAssessmentComplete} />
      )}

      {currentView === ViewState.ASSESSMENT_RESULT && renderResult()}

      {currentView === ViewState.EMPLOYER_DASHBOARD && (
        <EmployerDashboard onLogout={handleLogout} />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

// Main App wrapper with ToastProvider and AuthProvider
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;