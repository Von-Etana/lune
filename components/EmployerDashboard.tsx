import React, { useState } from 'react';
import { Search, Play, Award, MapPin, CheckCircle, Sliders, FileText, ShieldCheck, XCircle, Plus, Sparkles, Briefcase, GraduationCap, Filter, Building2, DollarSign, Globe, Clock, Trash2, Mail, User, X, ExternalLink, Copy, Loader, ChevronDown } from 'lucide-react';
import { getCertificateDetails } from '../services/pwrService';
import { matchCandidatesToJob } from '../services/geminiService';
import { CertificateDetails, CandidateProfile, Job } from '../types';
import { useToast } from '../lib/toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EmployerDashboardProps {
   onLogout: () => void;
}

const MOCK_CANDIDATES: CandidateProfile[] = [
   {
      id: '1',
      name: 'Alex Chen',
      title: 'Full Stack Engineer',
      location: 'Toronto, Canada',
      skills: { 'React': 92, 'Node.js': 88, 'AWS': 75 },
      image: 'https://picsum.photos/300/300',
      certifications: ['0x7f2c3a1b9d8e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9'],
      verified: true,
      yearsOfExperience: 5,
      bio: "Passionate Full Stack Developer with 5 years of experience building scalable web applications. Expert in React and Node.js ecosystems with a strong focus on cloud-native architecture.",
      experience: "Lead Developer at TechFlow (2020-Present), Senior Frontend Dev at StartUp Inc (2018-2020).",
      preferredWorkMode: 'Remote'
   },
   {
      id: '2',
      name: 'Sarah Jones',
      title: 'Backend Specialist',
      location: 'London, UK',
      skills: { 'Python': 95, 'Django': 90, 'PostgreSQL': 85 },
      image: 'https://picsum.photos/301/301',
      certifications: ['0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1'],
      verified: true,
      yearsOfExperience: 7,
      bio: "Backend specialist obsessed with database optimization and API design. I build systems that can handle millions of requests without breaking a sweat.",
      experience: "Backend Lead at DataCorp (2019-Present), Python Developer at FinTech Solutions (2017-2019).",
      preferredWorkMode: 'Hybrid'
   },
   {
      id: '3',
      name: 'Mateo Garcia',
      title: 'Frontend Developer',
      location: 'Madrid, Spain',
      skills: { 'Vue.js': 89, 'CSS': 98, 'TypeScript': 85 },
      image: 'https://picsum.photos/302/302',
      certifications: [], // Unverified
      verified: false,
      yearsOfExperience: 3,
      bio: "Creative Frontend Developer with a background in graphic design. I bridge the gap between design and engineering to create beautiful user experiences.",
      experience: "Frontend Dev at CreativeStudio (2021-Present).",
      preferredWorkMode: 'On-site'
   },
   {
      id: '4',
      name: 'Aisha Khan',
      title: 'Data Scientist',
      location: 'Dubai, UAE',
      skills: { 'Python': 98, 'TensorFlow': 92, 'SQL': 88 },
      image: 'https://picsum.photos/303/303',
      certifications: ['0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1'],
      verified: true,
      yearsOfExperience: 4,
      bio: "Data Scientist leveraging machine learning to solve complex business problems. Certified in TensorFlow and Cloud Data Engineering.",
      experience: "Data Scientist at AI Innovations (2020-Present).",
      preferredWorkMode: 'Remote'
   }
];

const MOCK_POSTED_JOBS: Job[] = [
   {
      id: 'job-1',
      title: 'Senior Frontend Engineer',
      company: 'TechCorp Global',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120k - $150k',
      description: 'We are looking for a React expert to lead our core product team. Experience with Web3 is a plus.'
   },
   {
      id: 'job-2',
      title: 'Backend Go Developer',
      company: 'TechCorp Global',
      location: 'New York, NY',
      type: 'Hybrid',
      salary: '$140k - $180k',
      description: 'Join our infrastructure team building high-scale microservices.'
   }
];

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ onLogout }) => {
   const toast = useToast();
   const [activeTab, setActiveTab] = useState<'candidates' | 'jobs'>('candidates');

   // Candidate Interaction State
   const [viewingCandidate, setViewingCandidate] = useState<CandidateProfile | null>(null);
   const [profileModalTab, setProfileModalTab] = useState<'overview' | 'credentials'>('overview');

   // Candidate Search State
   const [selectedIndustry, setSelectedIndustry] = useState('All');
   const [showVerification, setShowVerification] = useState(false);
   const [verifyHash, setVerifyHash] = useState('');
   const [verifyResult, setVerifyResult] = useState<CertificateDetails | null>(null);
   const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'error'>('idle');
   const [skillSearch, setSkillSearch] = useState('');
   const [minExperience, setMinExperience] = useState(0);
   const [verifiedOnly, setVerifiedOnly] = useState(false);
   const [showFilters, setShowFilters] = useState(false);

   // Job Management State
   const [showPostJob, setShowPostJob] = useState(false);
   const [postedJobs, setPostedJobs] = useState<Job[]>(MOCK_POSTED_JOBS);
   const [jobSearchQuery, setJobSearchQuery] = useState('');
   const [rankedCandidates, setRankedCandidates] = useState<any[]>([]);
   const [isMatching, setIsMatching] = useState(false);

   // New Job Form State
   const [jobTitle, setJobTitle] = useState('');
   const [jobCompany, setJobCompany] = useState('');
   const [jobLocation, setJobLocation] = useState('');
   const [jobSalary, setJobSalary] = useState('');
   const [jobType, setJobType] = useState('Remote');
   const [jobDescription, setJobDescription] = useState('');

   const handleVerify = async (hash: string) => {
      if (!hash) return;
      setVerifyStatus('loading');
      setVerifyResult(null);

      const details = await getCertificateDetails(hash);
      if (details) {
         setVerifyResult(details);
         setVerifyStatus('idle');
      } else {
         setVerifyStatus('error');
      }
   };

   const openProfile = (candidate: CandidateProfile, tab: 'overview' | 'credentials' = 'overview') => {
      setViewingCandidate(candidate);
      setProfileModalTab(tab);
   };

   const handlePostJob = async () => {
      setIsMatching(true);

      // 1. Create and Save Job
      const newJob: Job = {
         id: Date.now().toString(),
         title: jobTitle,
         company: jobCompany || 'My Company', // Default if empty
         location: jobLocation,
         salary: jobSalary,
         type: jobType,
         description: jobDescription
      };

      setPostedJobs(prev => [newJob, ...prev]);

      // 2. Call Gemini to rank candidates
      const rankings = await matchCandidatesToJob(jobDescription, MOCK_CANDIDATES);

      // Merge ranking data with candidate data
      const enrichedCandidates = rankings.map(r => {
         const candidate = MOCK_CANDIDATES.find(c => c.id === r.candidateId);
         return { ...candidate, ...r };
      }).sort((a, b) => (b.score || 0) - (a.score || 0));

      setRankedCandidates(enrichedCandidates);
      setIsMatching(false);
      setShowPostJob(false);

      // 3. Reset Form
      setJobTitle('');
      setJobCompany('');
      setJobLocation('');
      setJobSalary('');
      setJobType('Remote');
      setJobDescription('');

      // 4. Switch view to candidates to show results
      setActiveTab('candidates');
      setSelectedIndustry('All');

      // 5. Show success toast
      toast.success(`💼 Job posted! Found ${enrichedCandidates.length} matching candidates.`);
   };

   const deleteJob = (id: string) => {
      setPostedJobs(prev => prev.filter(j => j.id !== id));
      toast.info('🗑️ Job listing removed.');
   };

   // Filter Candidates
   const displayedCandidates = (rankedCandidates.length > 0 ? rankedCandidates : MOCK_CANDIDATES).filter(candidate => {
      const matchesIndustry = selectedIndustry === 'All' ||
         candidate.title.toLowerCase().includes(selectedIndustry.toLowerCase()) ||
         (selectedIndustry === 'Data Science' && candidate.title.includes('Data')) ||
         (selectedIndustry === 'Software Engineering' && (candidate.title.includes('Developer') || candidate.title.includes('Engineer')));

      const matchesSearch = skillSearch === '' ||
         candidate.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
         candidate.title.toLowerCase().includes(skillSearch.toLowerCase()) ||
         Object.keys(candidate.skills).some(s => s.toLowerCase().includes(skillSearch.toLowerCase()));

      const matchesExperience = (candidate.yearsOfExperience || 0) >= minExperience;
      const matchesVerified = !verifiedOnly || candidate.verified;

      return matchesIndustry && matchesSearch && matchesExperience && matchesVerified;
   });

   // Filter Jobs
   const displayedJobs = postedJobs.filter(job =>
      job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(jobSearchQuery.toLowerCase())
   );

   // Helper for score colors
   const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 75) return 'bg-teal-500';
      if (score >= 60) return 'bg-blue-500';
      return 'bg-orange-500';
   };

   const getScoreTextColor = (score: number) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 75) return 'text-teal-600';
      if (score >= 60) return 'text-blue-600';
      return 'text-orange-600';
   };

   // Animation Variants
   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
   };

   return (
      <div className="min-h-screen bg-cream font-sans relative">
         {/* Independent Verification Modal (Global) */}
         <AnimatePresence>
            {showVerification && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
               >
                  <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                  >
                     <div className="bg-teal p-6 text-white flex justify-between items-start">
                        <div>
                           <h3 className="text-xl font-bold">Verify Certificate</h3>
                           <p className="text-teal-200 text-sm">Powered by PWR Chain</p>
                        </div>
                        <button onClick={() => setShowVerification(false)} className="text-teal-200 hover:text-white"><XCircle /></button>
                     </div>
                     <div className="p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Transaction Hash</label>
                        <div className="flex gap-2 mb-6">
                           <input
                              type="text"
                              value={verifyHash}
                              onChange={(e) => setVerifyHash(e.target.value)}
                              placeholder="0x..."
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                           />
                           <button
                              onClick={() => handleVerify(verifyHash)}
                              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                           >
                              {verifyStatus === 'loading' ? '...' : 'Check'}
                           </button>
                        </div>

                        {verifyStatus === 'error' && (
                           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                              Invalid Certificate Hash or Not Found on Chain
                           </motion.div>
                        )}

                        {verifyResult && (
                           <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-green-50 border border-green-100 rounded-xl p-4"
                           >
                              <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
                                 <ShieldCheck size={18} />
                                 <span>Valid Certificate</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                 <div className="flex justify-between"><span className="text-gray-500">Candidate:</span> <span className="font-semibold">{verifyResult.candidateName}</span></div>
                                 <div className="flex justify-between"><span className="text-gray-500">Skill:</span> <span className="font-semibold">{verifyResult.skill}</span></div>
                                 <div className="flex justify-between"><span className="text-gray-500">Score:</span> <span className="font-semibold text-green-600">{verifyResult.score}%</span></div>
                                 <div className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="font-semibold">{new Date(verifyResult.timestamp).toLocaleDateString()}</span></div>
                                 <div className="text-xs text-gray-400 mt-2 border-t pt-2 font-mono">{verifyResult.hash.substring(0, 16)}...</div>
                              </div>
                           </motion.div>
                        )}
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Candidate Profile Modal */}
         <AnimatePresence>
            {viewingCandidate && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md"
               >
                  <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >

                     {/* Modal Header */}
                     <div className="relative h-32 bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
                        <motion.button
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.9 }}
                           onClick={() => setViewingCandidate(null)}
                           className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition backdrop-blur-sm z-10"
                        >
                           <X size={20} />
                        </motion.button>

                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                           <div className="grid grid-cols-8 gap-4">
                              {Array.from({ length: 32 }).map((_, i) => <div key={i} className="bg-white rounded-full aspect-square m-2"></div>)}
                           </div>
                        </div>
                     </div>

                     <div className="px-8 pb-8 flex-1 overflow-y-auto">
                        {/* Profile Header Info */}
                        <div className="flex flex-col md:flex-row gap-6 -mt-12 mb-8 items-start">
                           <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-200 flex-shrink-0"
                           >
                              <img src={viewingCandidate.image || `https://ui-avatars.com/api/?name=${viewingCandidate.name}`} alt={viewingCandidate.name} className="w-full h-full object-cover" />
                           </motion.div>
                           <div className="flex-1 mt-4 md:mt-12">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{viewingCandidate.name}</h2>
                                    <p className="text-slate-500 font-medium">{viewingCandidate.title}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                       <span className="flex items-center gap-1"><MapPin size={14} /> {viewingCandidate.location}</span>
                                       <span className="flex items-center gap-1"><Briefcase size={14} /> {viewingCandidate.yearsOfExperience} Yrs Exp</span>
                                       <span className="flex items-center gap-1"><Globe size={14} /> {viewingCandidate.preferredWorkMode}</span>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 flex items-center gap-2">
                                       <Mail size={16} /> Contact
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-6">
                           <button
                              onClick={() => setProfileModalTab('overview')}
                              className={`px-6 py-3 font-bold text-sm border-b-2 transition ${profileModalTab === 'overview' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                           >
                              Overview
                           </button>
                           <button
                              onClick={() => setProfileModalTab('credentials')}
                              className={`px-6 py-3 font-bold text-sm border-b-2 transition flex items-center gap-2 ${profileModalTab === 'credentials' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                           >
                              Credentials
                              {viewingCandidate.certifications.length > 0 && (
                                 <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{viewingCandidate.certifications.length}</span>
                              )}
                           </button>
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                           {profileModalTab === 'overview' && (
                              <motion.div
                                 key="overview"
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="grid md:grid-cols-3 gap-8"
                              >
                                 <div className="md:col-span-2 space-y-6">
                                    <div>
                                       <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">About</h3>
                                       <p className="text-gray-600 leading-relaxed text-sm">
                                          {viewingCandidate.bio || "No bio available."}
                                       </p>
                                    </div>

                                    <div>
                                       <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">Experience</h3>
                                       <p className="text-gray-600 leading-relaxed text-sm">
                                          {viewingCandidate.experience || "No detailed experience listed."}
                                       </p>
                                    </div>

                                    {viewingCandidate.videoIntroUrl && (
                                       <div>
                                          <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">Video Introduction</h3>
                                          <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                                             <video src={viewingCandidate.videoIntroUrl} controls className="w-full h-full object-cover" />
                                          </div>
                                       </div>
                                    )}
                                 </div>

                                 <div className="bg-gray-50 p-6 rounded-xl h-fit">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                       <Sparkles size={16} className="text-teal-600" /> Verified Skills
                                    </h3>
                                    <div className="space-y-4">
                                       {Object.entries(viewingCandidate.skills).map(([skill, score]) => (
                                          <div key={skill}>
                                             <div className="flex justify-between text-xs mb-1.5 font-bold">
                                                <span className="text-slate-700">{skill}</span>
                                                <span className={getScoreTextColor(score as number)}>{score as number}%</span>
                                             </div>
                                             <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                   initial={{ width: 0 }}
                                                   animate={{ width: `${score}%` }}
                                                   transition={{ duration: 0.8, ease: "easeOut" }}
                                                   className={`h-full rounded-full ${getScoreColor(score as number)}`}
                                                ></motion.div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </motion.div>
                           )}

                           {profileModalTab === 'credentials' && (
                              <motion.div
                                 key="credentials"
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="space-y-4"
                              >
                                 {viewingCandidate.certifications.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                       <ShieldCheck className="mx-auto text-gray-300 mb-3" size={48} />
                                       <p className="text-gray-500 font-medium">No verified certificates found.</p>
                                    </div>
                                 ) : (
                                    viewingCandidate.certifications.map((hash, idx) => (
                                       <motion.div
                                          key={idx}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: idx * 0.1 }}
                                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                                       >
                                          <div className="flex items-start gap-4">
                                             <div className="bg-teal/10 p-3 rounded-lg text-teal-700">
                                                <Award size={24} />
                                             </div>
                                             <div>
                                                <h4 className="font-bold text-slate-900">PWR Chain Certificate of Competence</h4>
                                                <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1">
                                                   {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}
                                                   <button className="hover:text-teal-600" onClick={() => navigator.clipboard.writeText(hash)} title="Copy Hash"><Copy size={10} /></button>
                                                </p>
                                             </div>
                                          </div>
                                          <div className="flex gap-2 w-full md:w-auto">
                                             <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2 flex-1 justify-center">
                                                <ExternalLink size={14} /> View on Chain
                                             </button>
                                             <button
                                                onClick={() => {
                                                   setVerifyHash(hash);
                                                   setShowVerification(true);
                                                }}
                                                className="px-4 py-2 bg-teal text-white rounded-lg text-sm font-bold hover:bg-teal-700 flex items-center gap-2 flex-1 justify-center shadow-sm"
                                             >
                                                <ShieldCheck size={14} /> Verify
                                             </button>
                                          </div>
                                       </motion.div>
                                    ))
                                 )}

                                 <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                                    <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-600 mt-0.5">
                                       <ShieldCheck size={16} />
                                    </div>
                                    <div>
                                       <h5 className="text-blue-900 font-bold text-sm">Immutable Verification</h5>
                                       <p className="text-blue-800/80 text-xs mt-1">
                                          These certificates are minted directly on the PWR Chain. They are tamper-proof and serve as mathematical proof of the candidate's skill assessment performance.
                                       </p>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Post Job Modal */}
         <AnimatePresence>
            {showPostJob && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
               >
                  <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Post New Job</h3>
                           <p className="text-sm text-slate-500">Create a listing to find the perfect candidate</p>
                        </div>
                        <button onClick={() => setShowPostJob(false)} className="text-gray-400 hover:text-gray-600"><XCircle /></button>
                     </div>

                     <div className="p-6 space-y-5 overflow-y-auto">
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                           <input
                              type="text"
                              value={jobTitle}
                              onChange={(e) => setJobTitle(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                              placeholder="e.g. Senior React Developer"
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Building2 size={14} /> Company</label>
                              <input
                                 type="text"
                                 value={jobCompany}
                                 onChange={(e) => setJobCompany(e.target.value)}
                                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                                 placeholder="Your Company Name"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><MapPin size={14} /> Location</label>
                              <input
                                 type="text"
                                 value={jobLocation}
                                 onChange={(e) => setJobLocation(e.target.value)}
                                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                                 placeholder="e.g. New York, NY"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><DollarSign size={14} /> Salary Range</label>
                              <input
                                 type="text"
                                 value={jobSalary}
                                 onChange={(e) => setJobSalary(e.target.value)}
                                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                                 placeholder="e.g. $120k - $150k"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Globe size={14} /> Job Type</label>
                              <select
                                 value={jobType}
                                 onChange={(e) => setJobType(e.target.value)}
                                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition bg-white"
                              >
                                 <option value="Remote">Remote</option>
                                 <option value="On-site">On-site</option>
                                 <option value="Hybrid">Hybrid</option>
                                 <option value="Contract">Contract</option>
                              </select>
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Job Description</label>
                           <textarea
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition"
                              placeholder="Describe the role, responsibilities, and requirements..."
                           />
                        </div>
                     </div>

                     <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button
                           onClick={() => setShowPostJob(false)}
                           className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
                        >
                           Cancel
                        </button>
                        <button
                           onClick={handlePostJob}
                           disabled={isMatching || !jobTitle || !jobDescription}
                           className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                        >
                           {isMatching ? 'Analyzing...' : 'Post & Find Candidates'}
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Header */}
         <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm"
         >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="bg-black text-white p-1.5 rounded-full">
                     <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                        <div className="bg-white rounded-full"></div>
                        <div className="bg-white rounded-full"></div>
                        <div className="bg-white rounded-full"></div>
                        <div className="bg-white rounded-full"></div>
                     </div>
                  </div>
                  <span className="font-bold text-xl">lune <span className="text-gray-400 font-normal">| Employer</span></span>
               </div>
               <div className="flex items-center gap-4">
                  <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setShowVerification(true)}
                     className="flex items-center gap-2 text-sm font-medium text-teal-700 hover:bg-teal-50 px-3 py-2 rounded-lg transition"
                  >
                     <ShieldCheck size={16} /> Verify Hash
                  </motion.button>
                  <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setShowPostJob(true)}
                     className="flex items-center gap-2 text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-lg shadow-black/20"
                  >
                     <Plus size={16} /> Post Job
                  </motion.button>
                  <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-white font-bold text-xs">C</div>
                  <button onClick={onLogout} className="text-sm font-medium hover:text-red-600">Log out</button>
               </div>
            </div>
         </motion.header>

         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Main Header & Tabs */}
            <div className="mb-8">
               <div className="flex justify-between items-end mb-6">
                  <div>
                     <h1 className="text-3xl font-bold text-slate-900">
                        {activeTab === 'candidates' ? 'Talent Discovery' : 'My Job Listings'}
                     </h1>
                     <p className="text-slate-500 mt-1">
                        {activeTab === 'candidates'
                           ? 'Find and hire verified professionals.'
                           : 'Manage your active job posts.'}
                     </p>
                  </div>

                  {/* Tab Switcher */}
                  <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
                     <button
                        onClick={() => setActiveTab('candidates')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'candidates' ? 'bg-teal text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                        <Search size={16} /> Find Talent
                     </button>
                     <button
                        onClick={() => setActiveTab('jobs')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'jobs' ? 'bg-teal text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                        <Briefcase size={16} /> My Jobs
                     </button>
                  </div>
               </div>

               {/* CANDIDATE FILTERS */}
               {activeTab === 'candidates' && (
                  <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="space-y-4"
                  >
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['All', 'Software Engineering', 'Data Science', 'Product Design', 'Cloud Architecture'].map(ind => (
                           <button
                              key={ind}
                              onClick={() => {
                                 setSelectedIndustry(ind);
                                 setRankedCandidates([]);
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedIndustry === ind ? 'bg-teal text-white' : 'bg-white text-slate-600 hover:bg-gray-100'}`}
                           >
                              {ind}
                           </button>
                        ))}
                     </div>

                     <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex gap-4 flex-1">
                           <div className="relative flex-1 max-w-md">
                              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                              <input
                                 type="text"
                                 placeholder="Search by name, skill, or role..."
                                 value={skillSearch}
                                 onChange={(e) => setSkillSearch(e.target.value)}
                                 className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal focus:border-transparent text-sm"
                              />
                           </div>
                           <button
                              onClick={() => setShowFilters(!showFilters)}
                              className={`p-2 rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-semibold transition ${showFilters ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                           >
                              <Sliders size={18} /> <span className="hidden sm:inline">Filters</span>
                           </button>
                        </div>

                        <AnimatePresence>
                           {showFilters && (
                              <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="w-full overflow-hidden"
                              >
                                 <div className="pt-4 mt-2 border-t border-gray-100 flex flex-wrap gap-6">
                                    <div className="flex items-center gap-4">
                                       <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Clock size={16} /> Min Experience:</span>
                                       <div className="flex items-center gap-3">
                                          <input
                                             type="range"
                                             min="0"
                                             max="10"
                                             value={minExperience}
                                             onChange={(e) => setMinExperience(parseInt(e.target.value))}
                                             className="w-32 accent-teal-600"
                                          />
                                          <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{minExperience}+ Years</span>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                       <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><Award size={16} /> Certification:</span>
                                       <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                             type="checkbox"
                                             checked={verifiedOnly}
                                             onChange={(e) => setVerifiedOnly(e.target.checked)}
                                             className="w-4 h-4 accent-teal-600 rounded"
                                          />
                                          <span className="text-sm text-gray-600">Verified Only</span>
                                       </label>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                     {rankedCandidates.length > 0 && (
                        <p className="text-teal-600 text-sm font-medium flex items-center gap-2 mt-2 animate-pulse">
                           <Sparkles size={14} /> Showing top AI matches
                        </p>
                     )}
                  </motion.div>
               )}

               {/* JOB SEARCH */}
               {activeTab === 'jobs' && (
                  <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                  >
                     <div className="relative w-full">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                           type="text"
                           placeholder="Search your posted jobs by title, company, or location..."
                           value={jobSearchQuery}
                           onChange={(e) => setJobSearchQuery(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal focus:border-transparent text-sm"
                        />
                     </div>
                  </motion.div>
               )}
            </div>

            {/* CONTENT GRID */}
            {activeTab === 'candidates' ? (
               displayedCandidates.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                     <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-gray-400" size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-gray-900">No candidates found</h3>
                     <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
                     <button
                        onClick={() => { setSkillSearch(''); setMinExperience(0); setVerifiedOnly(false); setSelectedIndustry('All'); }}
                        className="mt-4 text-teal-600 font-semibold text-sm hover:underline"
                     >
                        Clear all filters
                     </button>
                  </div>
               ) : (
                  <motion.div
                     variants={containerVariants}
                     initial="hidden"
                     animate="visible"
                     className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                     {displayedCandidates.map((candidate) => (
                        <motion.div
                           key={candidate.id}
                           variants={itemVariants}
                           className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 group flex flex-col"
                        >
                           <div className="relative h-48 bg-gray-200">
                              <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                 <button
                                    onClick={() => openProfile(candidate, 'overview')}
                                    className="bg-white/90 text-black px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transform scale-95 group-hover:scale-100 transition"
                                 >
                                    <Play size={16} fill="black" /> View Intro
                                 </button>
                              </div>
                              {candidate.verified && (
                                 <button
                                    onClick={() => openProfile(candidate, 'credentials')}
                                    className="absolute top-4 right-4 bg-teal text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-md bg-opacity-90 hover:scale-105 transition"
                                 >
                                    <Award size={12} /> PWR Certified
                                 </button>
                              )}
                              {candidate.matchScore && (
                                 <div className="absolute bottom-4 left-4 bg-white text-teal-700 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-teal-100">
                                    {candidate.matchScore}% Match
                                 </div>
                              )}
                           </div>

                           <div className="p-6 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h3 className="font-bold text-lg text-slate-900">{candidate.name}</h3>
                                    <p className="text-slate-500 text-sm">{candidate.title}</p>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-slate-400 text-xs flex items-center justify-end gap-1 mb-1">
                                       <MapPin size={12} /> {candidate.location}
                                    </div>
                                    <div className="text-slate-600 text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded inline-block">
                                       {candidate.yearsOfExperience} Yrs Exp
                                    </div>
                                 </div>
                              </div>

                              {candidate.matchReason && (
                                 <div className="mb-4 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 italic">
                                    "{candidate.matchReason}"
                                 </div>
                              )}

                              <div className="mt-4 flex flex-wrap gap-2">
                                 {Object.entries(candidate.skills).slice(0, 3).map(([skill, score]) => (
                                    <span key={skill} className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                                       {skill} <span className={`font-semibold ${getScoreTextColor(score as number)}`}>{score}%</span>
                                    </span>
                                 ))}
                              </div>

                              <div className="mt-auto pt-6 flex gap-3">
                                 <button
                                    onClick={() => openProfile(candidate)}
                                    className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
                                 >
                                    View Profile
                                 </button>
                                 <button className="px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                                    <Mail size={18} />
                                 </button>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </motion.div>
               )
            ) : (
               <div className="space-y-4">
                  <AnimatePresence>
                     {displayedJobs.map((job) => (
                        <motion.div
                           key={job.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                           className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                           <div>
                              <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                                 <span className="flex items-center gap-1"><Building2 size={14} /> {job.company}</span>
                                 <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                                 <span className="flex items-center gap-1"><DollarSign size={14} /> {job.salary}</span>
                                 <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{job.type}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 w-full md:w-auto">
                              <button className="flex-1 md:flex-initial px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-black transition">
                                 Edit
                              </button>
                              <button
                                 onClick={() => deleteJob(job.id)}
                                 className="px-3 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>

                  {displayedJobs.length === 0 && (
                     <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Briefcase className="mx-auto text-gray-300 mb-3" size={48} />
                        <h3 className="text-lg font-bold text-gray-900">No active job posts</h3>
                        <p className="text-gray-500 text-sm mb-6">Create a listing to start finding talent.</p>
                        <button
                           onClick={() => setShowPostJob(true)}
                           className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-lg"
                        >
                           Post a Job
                        </button>
                     </div>
                  )}
               </div>
            )}
         </main>
      </div>
   );
};
