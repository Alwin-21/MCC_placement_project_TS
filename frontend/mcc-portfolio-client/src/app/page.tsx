"use client";

import Link from "next/link";
import {
  ArrowRight,
  Trophy,
  Code,
  Award,
  Briefcase,
  Sparkles,
  BookOpen,
  Globe,
  ChevronRight,
  Shield,
  Layers,
  MapPin,
  Building,
  GraduationCap,
  Search,
  CheckCircle,
  Clock
} from "lucide-react";

export default function HomePage() {
  const gallery = [
    {
      src: "/mcc-facade.jpg",
      title: "Historical Main Building",
      desc: "The iconic facade and main campus quadrant with the historical anchor monument."
    },
    {
      src: "/mcc-entrance-gate.jpg",
      title: "Students at the Main Archway",
      desc: "Entrance gateway welcoming students into a lush, sprawling academic forest campus."
    },
    {
      src: "/mcc-main-gate.jpg",
      title: "Madras Christian College Portal",
      desc: "Founded in 1837, the historic stone archway stands as a symbol of excellence."
    },
    {
      src: "/mcc-building.jpg",
      title: "Colonial Quadrangle & Halls",
      desc: "Historic halls and residential quad design that defines the unique heritage of MCC."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#2c2c2c] selection:bg-[#781c1c]/20 selection:text-[#781c1c]">
      
      {/* INSTITUTIONAL TOP BAR */}
      <div className="bg-[#18233c] text-[#f7f5f0] text-xs font-semibold py-2.5 px-6 border-b border-amber-600/30 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium tracking-wide">Official Verified Placement & Resume Directory</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] opacity-90 font-mono">
            <span>Established 1837</span>
            <span>·</span>
            <span>Chennai, India</span>
          </div>
        </div>
      </div>

      {/* HEADER NAV */}
      <header className="border-b border-[#781c1c]/10 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-full bg-[#781c1c] flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-355">
              {/* Custom Anchor SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f7f5f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <circle cx="12" cy="5" r="3" />
                <line x1="12" y1="8" x2="12" y2="22" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <path d="M5 12a7 7 0 0 0 14 0" />
              </svg>
            </div>
            <div>
              <span className="font-serif font-black text-lg md:text-xl tracking-tight text-[#18233c] block group-hover:text-[#781c1c] transition-colors">
                MADRAS CHRISTIAN COLLEGE
              </span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#781c1c] block font-extrabold leading-none">
                Autonomous · Resume Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-650">
            <a href="#about" className="hover:text-[#781c1c] transition-colors">Campus Heritage</a>
            <a href="#features" className="hover:text-[#781c1c] transition-colors">Capabilities</a>
            <a href="#gallery" className="hover:text-[#781c1c] transition-colors">Gallery</a>
            <Link href="/search" className="hover:text-[#781c1c] transition-colors flex items-center gap-1">
              <Search size={13} /> Directory
            </Link>
            <Link href="/leaderboard" className="hover:text-[#781c1c] transition-colors">Leaderboard</Link>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-black uppercase tracking-wider text-slate-700 hover:text-[#781c1c] transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-[#781c1c] hover:bg-[#5f1515] text-[#f7f5f0] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:-translate-y-0.5"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH CAMPUS WALL BANNER */}
      <section className="relative bg-[#18233c] text-white overflow-hidden py-24 lg:py-32">
        {/* Background Overlay of the Main Gate */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/mcc-entrance-gate.jpg" 
            alt="MCC Campus Gate" 
            className="w-full h-full object-cover opacity-25 filter brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#18233c] via-[#18233c]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            
            {/* Academic Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-600/20 border border-amber-500/30 rounded-full text-xs font-bold text-amber-300 shadow-sm uppercase font-mono tracking-wider">
              <GraduationCap size={14} />
              <span>Official placement registry</span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Heritage of Excellence. <br />
              <span className="text-[#d4af37] font-serif italic">Digital Showcases.</span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
              Showcase your projects, academic transcript details, research publications, certifications, and licenses under specialized layout themes tailored to your professional ambitions.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#781c1c] hover:bg-[#5f1515] border border-amber-600/30 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg shadow-black/20 hover:-translate-y-0.5"
              >
                Register Your Profile
                <ArrowRight size={16} />
              </Link>
              
              <Link
                href="/search"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
              >
                <Search size={15} />
                Find Students
              </Link>
            </div>
          </div>

          {/* Quick Stats Overlay Card */}
          <div className="lg:col-span-5 bg-white/95 text-slate-800 p-6 md:p-8 rounded-3xl border border-white/20 shadow-2xl relative z-10">
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
              <Trophy size={20} />
            </div>
            
            <h3 className="font-serif font-black text-[#18233c] text-lg border-b pb-3 mb-4">Student Placements</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-[#781c1c] mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-bold text-xs block text-slate-900">Verified Credentials Only</span>
                  <p className="text-[11px] text-slate-500 leading-snug">All CGPA, degrees, and academic standings are checked directly against the college registry.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-[#781c1c] mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-bold text-xs block text-slate-900">13 Completed Sections</span>
                  <p className="text-[11px] text-slate-500 leading-snug">Everything from academics, research papers, patents, test scores to internships and media handles.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-[#781c1c] mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-bold text-xs block text-slate-900">Flexible Design Themes</span>
                  <p className="text-[11px] text-slate-500 leading-snug">Choose dynamic layouts: Academic Serif, AI Futuristic, Corporate, Creative, LinkedIn, and Startup.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: CAMPUS HERITAGE & MISSION */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#781c1c] font-mono">Heritage Founded 1837</h4>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-[#18233c] leading-tight">
              Madras Christian College (Autonomous)
            </h2>
            <p className="text-sm text-slate-650 leading-relaxed">
              Madras Christian College (MCC) has stood as a beacon of academic excellence for nearly two centuries. Known for its historical stone architecture, lush forest campus, and stellar list of alumni, MCC continues to combine historic values with state-of-the-art technological systems.
            </p>
            <p className="text-sm text-slate-650 leading-relaxed">
              This portfolio dashboard provides every student with an elegant, digital voice to showcase their technical prowess, creative design projects, verified marksheet records, and achievements.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4 relative">
            <div className="space-y-4">
              <img 
                src="/mcc-facade.jpg" 
                alt="MCC Campus Building" 
                className="w-full h-48 object-cover rounded-2xl shadow-md border-4 border-white transform hover:scale-[1.02] transition"
              />
              <img 
                src="/mcc-building.jpg" 
                alt="MCC Colonial Quad" 
                className="w-full h-64 object-cover rounded-2xl shadow-md border-4 border-white transform hover:scale-[1.02] transition"
              />
            </div>
            <div className="space-y-4 pt-8">
              <img 
                src="/mcc-main-gate.jpg" 
                alt="MCC Historic Entrance Stone Wall" 
                className="w-full h-64 object-cover rounded-2xl shadow-md border-4 border-white transform hover:scale-[1.02] transition"
              />
              <div className="bg-[#781c1c] text-[#f7f5f0] p-6 rounded-2xl shadow-lg border border-amber-600/20 flex flex-col justify-between h-48">
                <div>
                  <span className="text-3xl font-serif font-black text-amber-400">185+</span>
                  <span className="block text-xs font-bold uppercase tracking-wider mt-1.5 opacity-90">Years of History</span>
                </div>
                <p className="text-[10px] opacity-75">Nurturing global leaders, research scientists, developers, and writers since 1837.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: PLATFORM CAPABILITIES */}
      <section id="features" className="bg-[#f0ece1] py-20 border-y border-[#781c1c]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#781c1c] font-mono">Modern Capabilities</h4>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-[#18233c]">
              Comprehensive Portfolio Infrastructure
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every student gets a dashboard containing all academic and professional fields verified directly by MCC.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#781c1c]/10 text-[#781c1c] flex items-center justify-center mb-6">
                <Briefcase size={22} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#18233c] mb-3">Professional Experience</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log full-time jobs, internships, part-time opportunities, administrative roles, and volunteering works.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#781c1c]/10 text-[#781c1c] flex items-center justify-center mb-6">
                <Code size={22} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#18233c] mb-3">Projects & Publications</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Compile academic designs, collaborative projects, journal publications, and conference papers.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#781c1c]/10 text-[#781c1c] flex items-center justify-center mb-6">
                <Award size={22} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#18233c] mb-3">Honors & Achievements</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Record institutional scholarships, department ranks, national awards, and standardized test scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CAMPUS GALLERY */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#781c1c] font-mono">Heritage Campus</h4>
          <h2 className="font-serif text-3xl font-extrabold text-[#18233c]">The Madras Christian College Campus</h2>
          <p className="text-xs text-slate-500 leading-relaxed">Images of the sprawling halls, historic stone pillars, and green surroundings of the MCC campus.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gallery.map((img, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src={img.src} 
                  alt={img.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
              </div>
              <div className="p-4">
                <h4 className="font-serif font-black text-[#18233c] text-xs leading-snug">{img.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">{img.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-[#18233c] border border-amber-600/30 text-white rounded-[32px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img 
              src="/mcc-facade.jpg" 
              alt="MCC Main Facade Background" 
              className="w-full h-full object-cover opacity-10 filter blur-xs"
            />
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="font-serif text-3xl md:text-5xl font-black text-white">
              Launch Your Showcase
            </h2>
            <p className="text-slate-350 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
              Join fellow students at Madras Christian College. Stand out in placements and academic directories by building your unified showcase profile today.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-200 shadow-md"
              >
                Register Profile
              </Link>
              
              <Link
                href="/search"
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
              >
                Search Placement Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#781c1c]/10 py-12 bg-[#18233c] text-[#f7f5f0]/80">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="5" r="3" />
                <line x1="12" y1="8" x2="12" y2="22" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <path d="M5 12a7 7 0 0 0 14 0" />
              </svg>
              <span className="font-serif font-black text-sm text-white tracking-wide">MADRAS CHRISTIAN COLLEGE</span>
            </div>
            <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} Madras Christian College (Autonomous). All Rights Reserved.</p>
          </div>
          
          <div className="flex flex-wrap md:justify-end gap-6 text-[10px] uppercase font-bold tracking-wider text-[#d4af37]">
            <Link href="/login" className="hover:text-white transition">Dashboard Log In</Link>
            <Link href="/search" className="hover:text-white transition">Student Search</Link>
            <Link href="/admin/login" className="hover:text-white transition">Admin Portal</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}