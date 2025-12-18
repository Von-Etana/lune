import React, { useState, useEffect, useRef } from 'react';
import { Code, Award, TrendingUp, Briefcase, MapPin, User, Play, Plus, Sparkles, CheckCircle, Loader, ArrowRight, Video, X, Upload, Edit2, Save, Bookmark, Star, Mic, Globe, Clock } from 'lucide-react';
import { CandidateProfile, RecommendedCertification, Job } from '../types';
import { getCareerRecommendations } from '../services/geminiService';
import { MockInterview } from './MockInterview';
import { useToast } from '../lib/toast';
import { motion, AnimatePresence } from 'framer-motion';

interface CandidateDashboardProps {
   candidate: CandidateProfile;
   onStartAssessment: (skill?: string) => void;
   onLogout: () => void;
   onUpdateProfile: (profile: Partial<CandidateProfile>) => void;
}

const AVAILABLE_ASSESSMENTS = {
   'Frontend': ['React', 'Vue', 'CSS', 'Angular'],
   'Backend': ['Node.js', 'Python', 'Java', 'Go'],
   'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'Terraform']
};

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ candidate, onStartAssessment, onLogout, onUpdateProfile }) => {
   const toast = useToast();
   const [activeTab, setActiveTab] = useState<'overview' | 'interview'>('overview');
   const [recommendations, setRecommendations] = useState<{
      certifications: RecommendedCertification[];
      jobs: Job[];
   } | null>(null);
   const [loadingRecommendations, setLoadingRecommendations] = useState(false);

   // Edit Mode State
   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({
      bio: candidate.bio || '',
      experience: candidate.experience || '',
      location: candidate.location || '',
      yearsOfExperience: candidate.yearsOfExperience || 0,
      preferredWorkMode: candidate.preferredWorkMode || 'Remote'
   });

   const fileInputRef = useRef<HTMLInputElement>(null);

   // Update local form data when prop changes
   useEffect(() => {
      setFormData({
         bio: candidate.bio || '',
         experience: candidate.experience || '',
         location: candidate.location || '',
         yearsOfExperience: candidate.yearsOfExperience || 0,
         preferredWorkMode: candidate.preferredWorkMode || 'Remote'
      });
   }, [candidate]);

   const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      const result = await getCareerRecommendations(candidate.skills);
      setRecommendations(result);
      setLoadingRecommendations(false);
   };

   const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         const url = URL.createObjectURL(file);
         onUpdateProfile({ videoIntroUrl: url });
      }
   };

   const handleSaveProfile = () => {
      onUpdateProfile(formData);
      setIsEditing(false);
      toast.success("✨ Profile saved successfully!");
   };

   const getMatchColor = (score: number) => {
      if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
      if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
      return 'text-orange-600 bg-orange-50 border-orange-200';
   };

   const getMatchLabel = (score: number) => {
      if (score >= 90) return "Excellent Match";
      if (score >= 75) return "Strong Match";
      return "Potential Match";
   };

   // Animation Variants
   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
   };

   return (
      <div className="min-h-screen bg-cream font-sans">
         {/* Header */}
         <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-10 shadow-sm"
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
                  <span className="font-bold text-xl hidden md:inline">lune <span className="text-gray-400 font-normal">| Candidate</span></span>
                  <span className="font-bold text-xl md:hidden">lune</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     Open for Work
                  </div>
                  <button onClick={onLogout} className="text-sm font-medium text-gray-600 hover:text-red-600">Log out</button>
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                     {candidate.name.substring(0, 2).toUpperCase()}
                  </div>
               </div>
            </div>
         </motion.header>

         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <motion.div
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
               {/* Left Sidebar: Profile Info */}
               <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                     {/* Edit Toggle Button */}
                     <button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition z-20 shadow-sm"
                        title={isEditing ? "Save Profile" : "Edit Profile"}
                     >
                        {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                     </button>

                     <div className="relative z-10 mt-12">
                        <motion.div
                           whileHover={{ scale: 1.05 }}
                           className="w-24 h-24 bg-white rounded-full p-1 mx-auto shadow-lg mb-4"
                        >
                           <img src="https://picsum.photos/300/300" alt="Profile" className="w-full h-full rounded-full object-cover" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
                        <p className="text-slate-500 text-sm mb-4">{candidate.title}</p>

                        {/* Video Intro Upload */}
                        <div className="mb-6">
                           {candidate.videoIntroUrl ? (
                              <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-sm group mx-auto max-w-[280px]">
                                 <video src={candidate.videoIntroUrl} className="w-full h-full object-cover" controls />
                                 <button
                                    onClick={() => onUpdateProfile({ videoIntroUrl: undefined })}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500 backdrop-blur-sm"
                                    title="Remove Video"
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                           ) : (
                              <motion.button
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => fileInputRef.current?.click()}
                                 className="text-indigo-600 text-xs font-bold flex items-center justify-center gap-2 mx-auto hover:bg-indigo-50 px-4 py-2 rounded-full transition border border-indigo-100 bg-indigo-50/50"
                              >
                                 <Video size={14} /> Add Video Intro
                              </motion.button>
                           )}
                           <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="video/*"
                              onChange={handleVideoUpload}
                           />
                        </div>

                        {/* Profile Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 text-left mb-6">
                           <div className="bg-gray-50 p-2 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin size={10} /> Location</div>
                              {isEditing ? (
                                 <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                 />
                              ) : (
                                 <div className="font-semibold text-sm text-slate-700 truncate">{candidate.location}</div>
                              )}
                           </div>
                           <div className="bg-gray-50 p-2 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={10} /> Experience</div>
                              {isEditing ? (
                                 <div className="flex items-center gap-1">
                                    <input
                                       type="number"
                                       value={formData.yearsOfExperience}
                                       onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })}
                                       className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                    />
                                    <span className="text-xs text-gray-500">Yrs</span>
                                 </div>
                              ) : (
                                 <div className="font-semibold text-sm text-slate-700">{candidate.yearsOfExperience || 0} Years</div>
                              )}
                           </div>
                           <div className="bg-gray-50 p-2 rounded-lg col-span-2">
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Globe size={10} /> Preference</div>
                              {isEditing ? (
                                 <select
                                    value={formData.preferredWorkMode}
                                    onChange={(e) => setFormData({ ...formData, preferredWorkMode: e.target.value as any })}
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                 >
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                    <option value="On-site">On-site</option>
                                 </select>
                              ) : (
                                 <div className="font-semibold text-sm text-slate-700">{candidate.preferredWorkMode || 'Remote'}</div>
                              )}
                           </div>
                        </div>

                        {/* Bio & Experience Section */}
                        <div className="text-left pt-4 border-t border-gray-100 space-y-4">
                           <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">About Me</label>
                              {isEditing ? (
                                 <textarea
                                    className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                    rows={3}
                                    placeholder="Tell us about yourself..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                 />
                              ) : (
                                 <p className="text-sm text-slate-600 leading-relaxed">
                                    {candidate.bio || <span className="text-gray-400 italic text-xs">No bio added yet.</span>}
                                 </p>
                              )}
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Work Summary</label>
                              {isEditing ? (
                                 <textarea
                                    className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                    rows={3}
                                    placeholder="Briefly describe your past roles..."
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                 />
                              ) : (
                                 <p className="text-sm text-slate-600 leading-relaxed">
                                    {candidate.experience || <span className="text-gray-400 italic text-xs">No details added.</span>}
                                 </p>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-4">
                           <div>
                              <div className="text-2xl font-bold text-slate-900">88%</div>
                              <div className="text-xs text-slate-500">Avg. Score</div>
                           </div>
                           <div>
                              <div className="text-2xl font-bold text-slate-900">{candidate.certifications.length}</div>
                              <div className="text-xs text-slate-500">Certificates</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Get Verified / Skills Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Award className="text-teal-600" size={18} /> Verified Skills</h3>
                     </div>
                     <div className="space-y-4 mb-6">
                        {Object.entries(candidate.skills).map(([skill, score]) => (
                           <div key={skill}>
                              <div className="flex justify-between text-xs mb-1.5">
                                 <span className="font-medium text-slate-700">{skill}</span>
                                 <span className={`font-bold ${(score as number) >= 80 ? 'text-green-600' : 'text-slate-600'}`}>{score as number}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                                 <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${(score as number) >= 80 ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                 ></motion.div>
                              </div>
                           </div>
                        ))}
                        {Object.keys(candidate.skills).length === 0 && (
                           <p className="text-xs text-gray-400 italic">No skills verified yet.</p>
                        )}
                     </div>

                     <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Available Assessments</h4>
                        <div className="space-y-4">
                           {Object.entries(AVAILABLE_ASSESSMENTS).map(([category, skills]) => (
                              <div key={category}>
                                 <h5 className="text-xs font-bold text-slate-800 mb-2">{category}</h5>
                                 <div className="flex flex-wrap gap-2">
                                    {skills.map(skill => (
                                       <motion.button
                                          key={skill}
                                          whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff", borderColor: "#000" }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => onStartAssessment(skill)}
                                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 transition"
                                       >
                                          {skill}
                                       </motion.button>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

               </motion.div>

               {/* Right Content */}
               <motion.div variants={itemVariants} className="lg:col-span-8">

                  {/* Tab Navigation */}
                  <div className="flex gap-6 mb-6 border-b border-gray-200 pb-1">
                     <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 font-bold text-sm transition relative ${activeTab === 'overview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
                     >
                        <span className="flex items-center gap-2"><TrendingUp size={16} /> Career Path</span>
                        {activeTab === 'overview' && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"
                           />
                        )}
                     </button>
                     <button
                        onClick={() => setActiveTab('interview')}
                        className={`pb-3 px-2 font-bold text-sm transition relative ${activeTab === 'interview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
                     >
                        <span className="flex items-center gap-2"><Mic size={16} /> Mock Interview</span>
                        {activeTab === 'interview' && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"
                           />
                        )}
                     </button>
                  </div>

                  <AnimatePresence mode="wait">
                     {activeTab === 'overview' && (
                        <motion.div
                           key="overview"
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           transition={{ duration: 0.3 }}
                        >
                           {/* AI Recommendation Banner */}
                           <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
                              <motion.div
                                 animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                                 transition={{ duration: 10, repeat: Infinity }}
                                 className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"
                              />
                              <div className="relative z-10">
                                 <div className="flex items-start gap-4">
                                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                       <Sparkles className="text-yellow-400" size={24} />
                                    </div>
                                    <div className="flex-1">
                                       <h2 className="text-2xl font-bold mb-2">Unlock your Career Path</h2>
                                       <p className="text-indigo-200 mb-6 max-w-lg">Let our AI analyze your verified skills to suggest the best certifications and job opportunities for you.</p>

                                       {!recommendations ? (
                                          <motion.button
                                             whileHover={{ scale: 1.05 }}
                                             whileTap={{ scale: 0.95 }}
                                             onClick={fetchRecommendations}
                                             disabled={loadingRecommendations}
                                             className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition flex items-center gap-2 shadow-md disabled:opacity-80"
                                          >
                                             {loadingRecommendations ? <Loader className="animate-spin" size={18} /> : <Sparkles size={18} className="animate-wiggle" />}
                                             {loadingRecommendations ? 'Analyzing Profile...' : 'Generate Recommendations'}
                                          </motion.button>
                                       ) : (
                                          <motion.div
                                             initial={{ opacity: 0, scale: 0.8 }}
                                             animate={{ opacity: 1, scale: 1 }}
                                             className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 backdrop-blur-sm font-medium"
                                          >
                                             <CheckCircle size={16} /> Analysis Complete
                                          </motion.div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Recommendations Content */}
                           {recommendations && (
                              <motion.div
                                 initial="hidden"
                                 animate="visible"
                                 variants={{
                                    hidden: {},
                                    visible: { transition: { staggerChildren: 0.1 } }
                                 }}
                                 className="space-y-10"
                              >

                                 {/* Recommended Jobs */}
                                 <motion.div variants={itemVariants}>
                                    <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                                       <TrendingUp className="text-indigo-600" />
                                       Job Matches
                                       <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full font-bold">{recommendations.jobs.length}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                       {recommendations.jobs.map((job, i) => (
                                          <motion.div
                                             key={i}
                                             variants={itemVariants}
                                             whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                             className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
                                          >
                                             <div className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                                   <div className="flex-1">
                                                      <h4 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{job.title}</h4>
                                                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                                         <Briefcase size={14} />
                                                         <span>{job.company}</span>
                                                      </div>
                                                   </div>

                                                   {/* Match Score Badge */}
                                                   {job.matchScore && (
                                                      <div className={`flex flex-col items-end`}>
                                                         <div className={`px-3 py-1 rounded-full border font-bold text-sm flex items-center gap-1.5 ${getMatchColor(job.matchScore)}`}>
                                                            <Star size={14} fill="currentColor" />
                                                            {job.matchScore}% Match
                                                         </div>
                                                         <span className="text-xs text-slate-400 mt-1 font-medium">{getMatchLabel(job.matchScore)}</span>
                                                      </div>
                                                   )}
                                                </div>

                                                {/* Job Details Grid */}
                                                <div className="flex flex-wrap gap-3 mb-6">
                                                   <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 flex items-center gap-1.5">
                                                      <MapPin size={12} /> {job.location}
                                                   </div>
                                                   <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 flex items-center gap-1.5">
                                                      <Briefcase size={12} /> {job.type}
                                                   </div>
                                                   <div className="px-3 py-1.5 bg-green-50 rounded-lg text-xs font-semibold text-green-700 border border-green-200 flex items-center gap-1.5">
                                                      <span className="font-sans">$</span> {job.salary}
                                                   </div>
                                                </div>

                                                {/* AI Reasoning Box */}
                                                {job.matchReason && (
                                                   <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 mb-6 relative">
                                                      <div className="absolute -left-1 top-4 bottom-4 w-1 bg-indigo-400 rounded-r-full"></div>
                                                      <div className="flex items-start gap-3">
                                                         <div className="bg-white p-1.5 rounded-full shadow-sm text-indigo-600 mt-0.5">
                                                            <Sparkles size={14} />
                                                         </div>
                                                         <div>
                                                            <h5 className="text-indigo-900 font-bold text-sm mb-1">Why this is a great fit</h5>
                                                            <p className="text-sm text-indigo-800/80 leading-relaxed">{job.matchReason}</p>
                                                         </div>
                                                      </div>
                                                   </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                                   <motion.button
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                      className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                                                   >
                                                      Apply Now
                                                   </motion.button>
                                                   <motion.button
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                                                   >
                                                      <Bookmark size={20} />
                                                   </motion.button>
                                                </div>
                                             </div>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </motion.div>

                                 {/* Recommended Certifications */}
                                 <motion.div variants={itemVariants}>
                                    <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                                       <Award className="text-indigo-600" />
                                       Recommended Certifications
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                       {recommendations.certifications.map((cert, i) => (
                                          <motion.div
                                             key={i}
                                             variants={itemVariants}
                                             whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                             className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 flex flex-col h-full group"
                                          >
                                             <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-4 group-hover:scale-110 transition-transform">
                                                <Award size={24} />
                                             </div>

                                             <h4 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{cert.name}</h4>
                                             <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4">{cert.provider}</p>

                                             <div className="flex-1">
                                                <p className="text-sm text-gray-500 leading-relaxed mb-4">{cert.reason}</p>
                                             </div>

                                             <button className="mt-auto w-full py-2.5 rounded-lg border border-indigo-100 text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition flex items-center justify-center gap-2 group-hover:border-indigo-200">
                                                Start Learning <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                             </button>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </motion.div>

                              </motion.div>
                           )}

                           {/* Empty State if no recommendations yet */}
                           {!recommendations && (
                              <motion.div
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: 0.2 }}
                                 className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50"
                              >
                                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <TrendingUp size={32} className="text-gray-300" />
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 mb-2">No recommendations yet</h3>
                                 <p className="text-gray-500 max-w-md mx-auto">Click the "Generate Recommendations" button above to let our AI analyze your profile and find the perfect opportunities.</p>
                              </motion.div>
                           )}
                        </motion.div>
                     )}

                     {activeTab === 'interview' && (
                        <motion.div
                           key="interview"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                        >
                           <MockInterview candidate={candidate} />
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
            </motion.div>
         </main>
      </div>
   );
};