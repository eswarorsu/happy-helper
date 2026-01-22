import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Rocket, TrendingUp, Users, Lightbulb, Quote, Building2, GraduationCap, Briefcase, CircleDollarSign } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const StatsCard = ({ icon: Icon, count, label, delay }: { icon: any, count: number, label: string, delay: number }) => {
  const [currentCount, setCurrentCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = count;
      const duration = 2000;
      const incrementTime = (duration / end) * 0.8; // Speed up a bit

      const timer = setInterval(() => {
        start += Math.ceil(end / 50); // Increment chunks
        if (start >= end) {
          setCurrentCount(end);
          clearInterval(timer);
        } else {
          setCurrentCount(start);
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [isVisible, count]);

  return (
    <div
      ref={ref}
      className={`glass rounded-2xl p-6 flex items-center justify-between hover:scale-105 transition-transform duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-primary/10 p-4 rounded-xl">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <div className="text-right">
        <h3 className="text-4xl font-bold text-slate-900 mb-1">
          {currentCount.toLocaleString()}+
        </h3>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
};

const ReviewCard = ({ name, role, content, direction, delay }: { name: string, role: string, content: string, direction: 'left' | 'right', delay: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const slideClass = direction === 'left' ? '-translate-x-20' : 'translate-x-20';

  // Custom angled shape styles - subtle futuristic cut
  const shapeStyle = direction === 'left'
    ? { clipPath: 'polygon(0 0, 95% 0, 100% 15%, 100% 100%, 0 100%)' }
    : { clipPath: 'polygon(0 15%, 5% 0, 100% 0, 100% 100%, 0 100%)' };

  return (
    <div
      ref={ref}
      className={`relative w-full p-8 bg-white/70 backdrop-blur-md border border-white/50 shadow-xl transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${slideClass}`
        } hover:shadow-2xl hover:bg-white/80 group`}
      style={{ transitionDelay: `${delay}ms`, ...shapeStyle }}
    >
      <div className="absolute top-6 left-6 text-primary/20 group-hover:text-primary/30 transition-colors">
        <Quote className="w-10 h-10" />
      </div>
      <div className="relative z-10 pl-8">
        <p className="text-slate-600 leading-relaxed mb-6 italic text-lg">
          "{content}"
        </p>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${direction === 'left' ? 'bg-primary' : 'bg-indigo-500'}`}>
            {name.charAt(0)}
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-900">{name}</h4>
            <span className={`text-sm font-medium ${direction === 'left' ? 'text-primary' : 'text-indigo-600'}`}>{role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0] text-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">INNOVESTOR</span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="lg" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                Login
              </Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <div className="mb-6 px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-primary text-sm font-medium shadow-sm backdrop-blur-sm">
          Where Innovation Meets Investment
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">INNOVESTOR</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
          "Bridging the gap between visionary founders and strategic investors.
          Transform your ideas into reality."
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link to="/auth?mode=register">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105">
              Get Started
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-slate-300 text-slate-700 hover:bg-slate-50">
            Learn More
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full mt-8">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 text-left hover:shadow-xl transition-all duration-300 border border-white/50 hover:border-white shadow-lg group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-slate-900">Share Your Vision</h3>
            <p className="text-slate-600">
              Founders can showcase their innovative ideas to a network of eager investors.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 text-left hover:shadow-xl transition-all duration-300 border border-white/50 hover:border-white shadow-lg group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-slate-900">Smart Investments</h3>
            <p className="text-slate-600">
              Investors discover curated opportunities aligned with their interests and capital.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 text-left hover:shadow-xl transition-all duration-300 border border-white/50 hover:border-white shadow-lg group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-slate-900">Direct Connection</h3>
            <p className="text-slate-600">
              Secure, encrypted chat to discuss ideas and negotiate terms privately.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full mt-32 px-4 max-w-7xl mx-auto grid grid-cols-4 gap-6">
          <StatsCard icon={Building2} count={1} label="Colleges Registered" delay={0} />
          <StatsCard icon={GraduationCap} count={5000} label="Student Users" delay={0} />
          <StatsCard icon={Briefcase} count={1500} label="Working Professionals" delay={400} />
          <StatsCard icon={CircleDollarSign} count={450} label="Investors Registered" delay={600} />
        </div>

        {/* Scrolling College Bars */}
        <div className="w-screen relative left-right[calc(-50vw+50%)] mt-32 py-16 space-y-8 bg-slate-100/50 backdrop-blur-sm overflow-hidden">
          {(() => {
            const colleges = [
              "Andhra University", "GODAVARI GLOBAL UNIVERSITY", "JNTU Kakinada", "JNTU Anantapur", "SV University", "Acharya Nagarjuna University", "Sri Krishnadevaraya University",
              "Yogi Vemana University", "Rayalaseema University", "GITAM Deemed University", "K L University", "Vignan University",
              "SRKR Engineering College", "Gayatri Vidya Parishad (GVP)", "RVR & JC", "MVGR", "GMRIT", "Vishnu Institute of Technology",
              "Aditya Engineering College", "Pragati Engineering College", "Vasireddy Venkatadri Institute of Technology",
              "VR Siddhartha", "Prasad V Potluri Siddhartha", "NRI Institute of Technology", "Gudlavalleru Engineering College",
              "SRIT", "G Pulla Reddy", "NBKR", "Audisankara", "Narayana Engineering College", "Sree Vidyanikethan",
              "Madanapalle Institute of Technology & Science (MITS)", "Annamacharya Institute of Technology & Sciences (AITS)", "Rajeev Gandhi Memorial (RGMCET)",
              "Santhiram", "G Pullaiah", "Srinivasa Ramanujan", "Vemu", "Siddarth Institute", "Yogananda", "Kuppam Engineering College",
              "Sri Venkateswara College of Engineering (SVCE)", "Chadalawada Ramanamma", "KSRM", "SV College of Engineering", "Visakha Institute",
              "Anil Neerukonda", "Raghu Engineering College", "Lendi", "Dadi Institute", "Avanthi", "Sanketika", "Chaitanya Engineering College",
              "Vignan's Institute of Information Technology (VIIT)", "Baba Institute", "Gonna Institute", "Miracle", "Swarnandhra", "Bhimavaram Institute",
              "Shri Vishnu", "DNR", "Grandhi Varalakshmi", "Sir C R Reddy", "Eluru College", "Ramachandra", "QIS", "St. Ann's", "Pace",
              "Rise Krishna Sai", "Chirala Engineering College", "Bapatla Engineering College", "Narasaraopeta Engineering College", "Tirumala",
              "Eswar", "Krishnaveni", "Priyadarshini", "Chalapathi", "Chebrolu", "Malineni", "KKR & KSR", "Kallam Haranadhareddy", "Vignan's Lara",
              "Paladugu Parvathi", "Usha Rama", "LBRCE", "MIC", "DVR & Dr. HS MIC", "Amrita Sai", "Nova", "Nimra", "MVR", "Sasi",
              "West Godavari Institute", "Akula Sree Ramulu", "Dr. Samuel George", "Loyala", "St. Mary's", "Newton's", "KIET", "Lenora", "GIET"
            ];

            return (
              <>
                {/* Row 1: Right to Left */}
                <div className="flex animate-marquee hover:[animation-play-state:paused]">
                  <div className="flex shrink-0 gap-8 px-4">
                    {colleges.map((college, i) => (
                      <span key={i} className="text-xl font-semibold text-slate-400 whitespace-nowrap px-4 border border-slate-0 py-2 rounded-full bg-white/50">{college}</span>
                    ))}
                  </div>
                  <div className="flex shrink-0 gap-8 px-4">
                    {colleges.map((college, i) => (
                      <span key={`dup-${i}`} className="text-xl font-semibold text-slate-400 whitespace-nowrap px-4 border border-slate-200 py-2 rounded-full bg-white/50">{college}</span>
                    ))}
                  </div>
                </div>

                {/* Row 2: Left to Right */}
                <div className="flex animate-marquee-reverse hover:[animation-play-state:paused]">
                  <div className="flex shrink-0 gap-8 px-4">
                    {colleges.reverse().map((college, i) => ( // Reverse order for variety
                      <span key={i} className="text-xl font-semibold text-blue-500/70 whitespace-nowrap px-4 border border-blue-100 py-2 rounded-full bg-blue-50/50">{college}</span>
                    ))}
                  </div>
                  <div className="flex shrink-0 gap-8 px-4">
                    {colleges.map((college, i) => (
                      <span key={`dup-${i}`} className="text-xl font-semibold text-blue-500/70 whitespace-nowrap px-4 border border-blue-100 py-2 rounded-full bg-blue-50/50">{college}</span>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Testimonials Section */}
        <div className="w-full mt-32 mb-20 px-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16 text-slate-900 drop-shadow-sm">
            What Our Community Says
          </h2>

          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            <ReviewCard
              name="Sarah Jenkins"
              role="Founder, EcoTech Solutions"
              direction="left"
              delay={0}
              content="Building a startup is an exhilarating yet daunting journey, especially when it comes to securing the right capital. Innovestor completely transformed how we approached fundraising. Before joining, we spent months cold-emailing with little success. With Innovestor, we instantly gained access to a curated network of investors who genuinely understood our vision. The platform's intuitive design and direct connection features allowed us to bypass the usual barriers and pitch directly to decision-makers. Within just three weeks, we secured our seed round from a lead investor we met right here. It’s not just a platform; it’s a catalyst for innovation."
            />

            <ReviewCard
              name="James Sterling"
              role="Angel Investor"
              direction="right"
              delay={200}
              content="As an angel investor constantly seeking high-potential opportunities, sifting through noise to find quality deal flow is the biggest challenge. Innovestor has solved this elegantly. The platform’s rigorous yet user-friendly vetting process ensures that the startups presented are of exceptional quality and ready for investment. I’ve been impressed by the detailed profiles and the transparency of the data provided. The ability to filter opportunities by specific industries and stages saves me hours of due diligence. I’ve already made two significant investments through Innovestor, and the returns on my time/efficiency are as valuable as the financial potential. A game-changer for modern investing."
            />

            <ReviewCard
              name="Robert Chen"
              role="Partner, Horizon VC"
              direction="right"
              delay={200}
              content="I've been in venture capital for over 15 years, and I’ve seen countless platforms promise to democratize investment, but Innovestor actually delivers. The interface is remarkably 'classy' and professional, which reflects the caliber of founders on the site. What I appreciate most is the friction-free communication. Being able to chat directly with founders within a secure environment expedites the relationship-building process, which is fundamental to early-stage investing. The visuals, the data presentation, and the overall user experience are top-tier. It feels like a private club that’s open to anyone serious about the future of technology. Highly recommended for serious investors."
            />

            <ReviewCard
              name="Elena Rossi"
              role="Strategic Investor"
              direction="right"
              delay={200}
              content="Innovestor stands out in the crowded fintech space by prioritizing clarity and connection. The design is not only beautiful but functional—allowing me to assess a startup's potential at a glance before diving deep. I was looking to diversify my portfolio into sustainable tech, and the search capabilities here made it effortless to find aligned founders. The 'Direct Connection' feature is brilliant; it removes the awkwardness of initial intros. I recently partnered with a green-energy firm I found here, and the process from discovery to term sheet was smoother than any traditional deal I’ve done. This is the future of deal-making."
            />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-slate-500 text-sm">
         © 2026 Innovest
Company Name: INNOVESTOR
Email: support@INNOVESTOR.com
Address: VIZAG,
        ANDHRAPRADESH,
        INDIA[530001]

Privacy Policy | Terms & Conditions | Refund Policy

      </footer>
    </div>
  );
};

export default Landing;
