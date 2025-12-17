import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Users, Menu, X, Check, Globe, Lock, Zap, Layers, Brain, Briefcase } from 'lucide-react';
import { ViewState, UserRole } from '../types';

interface LandingProps {
   onNavigate: (view: ViewState, role?: UserRole) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

   return (
      <div className="min-h-screen bg-cream font-sans selection:bg-teal selection:text-white flex flex-col">
         {/* Header */}
         <nav className="px-6 md:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-50">
            <div className="flex items-center gap-2">
               <div className="bg-black text-white p-1.5 rounded-full">
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                     <div className="bg-white rounded-full"></div>
                     <div className="bg-white rounded-full"></div>
                     <div className="bg-white rounded-full"></div>
                     <div className="bg-white rounded-full"></div>
                  </div>
               </div>
               <span className="font-bold text-2xl tracking-tight">lune</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
               <a href="#features" className="hover:text-black transition">Features</a>
               <a href="#how-it-works" className="hover:text-black transition">How it Works</a>
               <a href="#solution" className="hover:text-black transition">For Business</a>
            </div>

            <div className="hidden md:flex gap-4">
               <button onClick={() => onNavigate(ViewState.AUTH_SELECTION)} className="text-sm font-semibold px-4 py-2 hover:bg-gray-200 rounded-lg transition">Log in</button>
               <button onClick={() => onNavigate(ViewState.AUTH_SELECTION)} className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition">Sign up</button>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
               {mobileMenuOpen ? <X /> : <Menu />}
            </button>
         </nav>

         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-white shadow-lg py-4 px-6 flex flex-col gap-4 z-40 border-b border-gray-100">
               <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">Features</a>
               <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">How it Works</a>
               <hr className="border-gray-100" />
               <button onClick={() => onNavigate(ViewState.AUTH_SELECTION)} className="text-left font-semibold py-2">Log in</button>
               <button onClick={() => onNavigate(ViewState.AUTH_SELECTION)} className="bg-black text-white font-semibold py-3 rounded-lg text-center">Sign up</button>
            </div>
         )}

         {/* Hero Section */}
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

               {/* Left Geometric Grid - Hidden on small screens for better flow, visible on lg */}
               <div className="hidden lg:grid lg:col-span-5 grid-cols-2 gap-4">
                  {/* Card 1: Problem */}
                  <div className="bg-[#8AA8A1] rounded-t-full rounded-b-2xl p-6 flex flex-col items-center justify-center text-center aspect-square shadow-lg">
                     <span className="text-teal-900 text-xs font-bold uppercase mb-2">Problem</span>
                     <ArrowRight className="text-teal-900 rotate-90 my-2" />
                     <span className="text-teal-900 text-xs font-bold uppercase">Solution</span>
                  </div>

                  {/* Card 2: Orange Circle */}
                  <div className="bg-orange rounded-full aspect-square shadow-lg"></div>

                  {/* Card 3: Pattern */}
                  <div className="bg-white rounded-2xl aspect-square flex items-center justify-center p-4 relative overflow-hidden shadow-sm">
                     <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4 opacity-20">
                        {Array.from({ length: 16 }).map((_, i) => (
                           <div key={i} className="bg-orange h-full w-full rounded-full"></div>
                        ))}
                     </div>
                     <ArrowRight className="text-orange w-12 h-12 -rotate-45 relative z-10" />
                  </div>

                  {/* Card 4: Teal Squiggle */}
                  <div className="bg-darkblue rounded-2xl aspect-square flex items-center justify-center rounded-tr-[100px] shadow-lg">
                     <svg className="w-24 h-24 text-white/50" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M10 50 C 30 20, 70 20, 90 50 C 70 80, 30 80, 10 50" />
                        <path d="M10 30 C 30 0, 70 0, 90 30" className="opacity-50" />
                        <path d="M10 70 C 30 100, 70 100, 90 70" className="opacity-50" />
                     </svg>
                  </div>
               </div>

               {/* Right Content */}
               <div className="lg:col-span-7 flex flex-col justify-center lg:pl-12">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight text-slate-900 mb-6 text-center lg:text-left">
                     Hire Talent <br />
                     <span className="text-slate-700">Beyond Borders</span>
                  </h1>

                  <p className="text-slate-600 text-lg mb-8 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                     Seamless skills evaluation and immutable certification powered by AI and Blockchain. Join 2.5M+ users verifying talent globally.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-12">
                     <button
                        onClick={() => onNavigate(ViewState.AUTH_SELECTION)}
                        className="btn-bounce btn-ripple bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition w-full sm:w-auto shadow-xl shadow-orange/10 hover:shadow-2xl hover:shadow-orange/20"
                     >
                        Get Started
                     </button>
                     <button className="btn-bounce btn-ripple animate-jelly px-8 py-4 rounded-xl font-semibold text-lg border border-slate-300 hover:bg-white hover:border-slate-400 transition w-full sm:w-auto">
                        Book Demo
                     </button>
                  </div>

                  <div className="flex items-center gap-4 mb-12 justify-center lg:justify-start">
                     <div className="flex -space-x-4">
                        <img src="https://picsum.photos/60/60?1" className="w-12 h-12 rounded-full border-2 border-cream object-cover" alt="User" />
                        <img src="https://picsum.photos/60/60?2" className="w-12 h-12 rounded-full border-2 border-cream object-cover" alt="User" />
                        <img src="https://picsum.photos/60/60?3" className="w-12 h-12 rounded-full border-2 border-cream object-cover" alt="User" />
                        <div className="w-12 h-12 rounded-full border-2 border-cream bg-teal text-white flex items-center justify-center text-xs font-bold">+2k</div>
                     </div>
                     <div>
                        <p className="text-slate-900 font-bold text-sm">Trusted by Developers</p>
                        <p className="text-slate-500 text-xs">From 120+ countries</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Trusted Companies Section */}
            <div className="mt-16 border-t border-gray-200 pt-10">
               <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-widest mb-8">Trusted by leading innovators</p>
               <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="text-2xl font-bold text-slate-800">Google</span>
                  <span className="text-2xl font-bold text-slate-800">Airbnb</span>
                  <span className="text-2xl font-bold text-slate-800">Stripe</span>
                  <span className="text-2xl font-bold text-slate-800">Vercel</span>
                  <span className="text-2xl font-bold text-slate-800">Shopify</span>
               </div>
            </div>

            {/* How It Works Section */}
            <div id="how-it-works" className="mt-32 scroll-mt-24">
               <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Lune Works</h2>
                  <p className="text-slate-600 text-lg">A streamlined process ensuring quality and trust for both sides of the hiring equation.</p>
               </div>

               <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                  {/* For Candidates */}
                  <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                     <div className="flex items-center gap-3 mb-8">
                        <div className="bg-orange/10 p-2 rounded-lg">
                           <Users className="text-orange w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">For Candidates</h3>
                     </div>

                     <div className="space-y-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                        <div className="flex gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">1</div>
                           <div>
                              <h4 className="font-bold text-lg mb-1">Select a Skill</h4>
                              <p className="text-gray-500 text-sm">Choose from over 50+ technical domains including Frontend, Backend, AI, and more.</p>
                           </div>
                        </div>
                        <div className="flex gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">2</div>
                           <div>
                              <h4 className="font-bold text-lg mb-1">Take AI Assessment</h4>
                              <p className="text-gray-500 text-sm">Complete a proctored challenge generated in real-time by AI to match your level.</p>
                           </div>
                        </div>
                        <div className="flex gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">3</div>
                           <div>
                              <h4 className="font-bold text-lg mb-1">Get Verified</h4>
                              <p className="text-gray-500 text-sm">Passing scores mint an immutable certificate on PWR Chain, proving your expertise forever.</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* For Employers */}
                  <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                     <div className="flex items-center gap-3 mb-8">
                        <div className="bg-teal/10 p-2 rounded-lg">
                           <Briefcase className="text-teal w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">For Employers</h3>
                     </div>

                     <div className="space-y-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                        <div className="flex gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">1</div>
                           <div>
                              <h4 className="font-bold text-lg mb-1">Post a Job</h4>
                              <p className="text-gray-500 text-sm">Define your requirements. Our system supports role-based and skill-based targeting.</p>
                           </div>
                        </div>
                        <div className="flex gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">2</div>
                           <div>
                              <h4 className="font-bold text-lg mb-1">AI Matching</h4>
                              <p className="text-gray-500 text-sm">We instantly scan verified profiles to find candidates that match your exact criteria.</p>
                           </div>
                        </div>
                        <div className="flex gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">3</div>
                           <div>
                              <h4 className="font-bold text-lg mb-1">Verify & Hire</h4>
                              <p className="text-gray-500 text-sm">Check blockchain credentials instantly and hire with confidence, bias-free.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Features Section */}
            <div id="features" className="mt-24 md:mt-32 scroll-mt-24">
               <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">The Future of Hiring is Verified</h2>
                  <p className="text-slate-600">We combine AI's advanced reasoning with PWR Chain's immutability to create a hiring platform you can trust.</p>
               </div>

               <div className="grid md:grid-cols-3 gap-8">
                  <div className="card-lift bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group cursor-pointer">
                     <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                        <Zap size={24} />
                     </div>
                     <h3 className="text-xl font-bold mb-3">AI Proctoring</h3>
                     <p className="text-slate-500 leading-relaxed">Real-time analysis of coding patterns, gaze tracking, and browser interactions to ensure 100% integrity.</p>
                  </div>
                  <div className="card-lift bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group cursor-pointer">
                     <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                        <Lock size={24} />
                     </div>
                     <h3 className="text-xl font-bold mb-3">On-Chain Verification</h3>
                     <p className="text-slate-500 leading-relaxed">Every passing score is minted as a certificate on PWR Chain. Immutable, shareable, and instantly verifiable.</p>
                  </div>
                  <div className="card-lift bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group cursor-pointer">
                     <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                        <Globe size={24} />
                     </div>
                     <h3 className="text-xl font-bold mb-3">Global Access</h3>
                     <p className="text-slate-500 leading-relaxed">Talent is universal. We remove bias by focusing purely on demonstrated ability, not pedigree.</p>
                  </div>
               </div>
            </div>

            {/* Stats Section */}
            <div className="mt-24 bg-darkblue rounded-[3rem] p-12 md:p-24 text-white text-center overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="grid grid-cols-6 gap-4 h-full">
                     {Array.from({ length: 24 }).map((_, i) => <div key={i} className="bg-white rounded-full aspect-square"></div>)}
                  </div>
               </div>

               <div className="relative z-10 max-w-4xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-bold mb-12">Join the movement</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div>
                        <div className="text-4xl font-bold mb-2 text-orange">12k+</div>
                        <div className="text-sm text-gray-300 uppercase tracking-wider">Certificates Minted</div>
                     </div>
                     <div>
                        <div className="text-4xl font-bold mb-2 text-teal-300">98%</div>
                        <div className="text-sm text-gray-300 uppercase tracking-wider">Hire Rate</div>
                     </div>
                     <div>
                        <div className="text-4xl font-bold mb-2 text-orange">450+</div>
                        <div className="text-sm text-gray-300 uppercase tracking-wider">Companies</div>
                     </div>
                     <div>
                        <div className="text-4xl font-bold mb-2 text-teal-300">$0</div>
                        <div className="text-sm text-gray-300 uppercase tracking-wider">Bias</div>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         {/* Footer */}
         <footer className="bg-white pt-16 pb-8 px-8 border-t border-gray-100">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
               <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="bg-black text-white p-1.5 rounded-full">
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                           <div className="bg-white rounded-full"></div>
                           <div className="bg-white rounded-full"></div>
                           <div className="bg-white rounded-full"></div>
                           <div className="bg-white rounded-full"></div>
                        </div>
                     </div>
                     <span className="font-bold text-xl">lune</span>
                  </div>
                  <p className="text-gray-500 text-sm">Empowering the world's workforce through transparent skill verification.</p>
               </div>

               <div>
                  <h4 className="font-bold mb-4">Platform</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                     <li><a href="#" className="hover:text-black">For Candidates</a></li>
                     <li><a href="#" className="hover:text-black">For Employers</a></li>
                     <li><a href="#" className="hover:text-black">Pricing</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                     <li><a href="#" className="hover:text-black">About Us</a></li>
                     <li><a href="#" className="hover:text-black">Careers</a></li>
                     <li><a href="#" className="hover:text-black">Blog</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                     <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                     <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                  </ul>
               </div>
            </div>
            <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between text-xs text-gray-400">
               <p>© 2024 Lune Inc. All rights reserved.</p>
               <div className="flex gap-4 mt-4 md:mt-0">
                  <span>Twitter</span>
                  <span>LinkedIn</span>
                  <span>GitHub</span>
               </div>
            </div>
         </footer>
      </div>
   );
};