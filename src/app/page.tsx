"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, Sparkles, X, Globe,
  Calendar, MapPin, Trophy, CreditCard, BookOpen, GraduationCap,
  ShieldCheck, ArrowUpRight, MessageSquare, User, Clock
} from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { incrementWhatsAppShare, submitStudentForm } from "./actions";
import { cn, getSecurityCheck, generateWhatsAppLink } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email"),
  qualification: z.string().min(1, "Please select qualification"),
  college_name: z.string().min(2, "College name is required"),
  grad_score: z.string().optional(),
  backlogs: z.string().optional(),
  work_experience: z.string().optional(),
  ielts_gre: z.string().optional(),
  intake: z.string().min(1, "Please select intake"),
  budget: z.string().min(1, "Please select budget"),
  preferred_countries: z.array(z.string()).min(1, "Select at least one country"),
  course_interest: z.string().min(2, "Course interest is required"),
  visa_refusal: z.string().optional(),
  has_passport: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: "personal", title: "About Me" },
  { id: "academic", title: "My Studies" },
  { id: "preferences", title: "My Plans" },
];

const QUALIFICATIONS = ["High School / 12th", "Diploma", "Bachelors", "Masters", "Ph.D"];
const INTAKES = ["Fall 2026", "Spring 2027", "Fall 2027"];
const BUDGETS = ["10 to 15 Lakhs", "15 to 20 Lakhs", "20 to 25 Lakhs", "Above 25 Lakhs"];
import { COUNTRIES, EUROPE_COUNTRIES } from "@/lib/constants";

// --- New Engagement Components ---

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const targetDate = new Date("2026-04-24T10:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {Object.entries(timeLeft).map(([unit, value], i) => (
        <div key={unit} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black leading-none text-white">{value.toString().padStart(2, '0')}</span>
            <span className="text-[6px] text-primary uppercase font-black tracking-tight mt-0.5">{unit[0]}</span>
          </div>
          {i < 3 && <span className="text-[10px] font-black text-white/20">:</span>}
        </div>
      ))}
    </div>
  );
}

const NAMES = ["Sandeep", "Anusha", "Rahul", "Priya", "Kiran", "Sneha", "Vamsi", "Mounika", "Vijay", "Deepika", "Ravi", "Jyothi"];
const LOCATIONS = ["Guntur", "Vijayawada", "Tenali", "Mangalagiri", "Narasaraopet", "Bapatla", "Ponnuru", "Amaravati"];

function SocialProofPills() {
  const [data, setData] = useState({ name: NAMES[0], location: LOCATIONS[0], time: "Just now" });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const minutes = Math.floor(Math.random() * 55) + 2;
        setData({ name, location, time: `${minutes} mins ago` });
        setVisible(true);
      }, 500);
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed bottom-6 left-6 z-[60] bg-white/90 backdrop-blur-xl p-4 rounded-[24px] border border-slate-100 shadow-[0_8px_48px_rgba(0,0,0,0.06)] hidden sm:flex items-center gap-3 pr-6 group"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
             <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
             <User size={18} strokeWidth={3} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-900 tracking-tight">{data.name} from {data.location}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Registered</p>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <p className="text-[9px] text-primary font-black uppercase tracking-widest">{data.time}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WhatsAppBubble() {
  const waLink = "https://wa.me/917842489864?text=" + encodeURIComponent("Hi Eccho Team, I have a question about the Guntur Global Education Fair at Welcomhotel ITC. Can I get more details?");
  
  return (
    <motion.a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, y: 100 }}
      animate={{ scale: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_12px_48_rgba(37,211,102,0.4)] transition-all group"
    >
      <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20 group-hover:opacity-40" />
      <svg 
        viewBox="0 0 24 24" 
        className="w-8 h-8 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </motion.a>
  );
}

// ---------------------------------

export default function StudentForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isEuropeModalOpen, setIsEuropeModalOpen] = useState(false);

  const { control, register, handleSubmit, trigger, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferred_countries: [],
      ielts_gre: "",
    },
    mode: "onChange",
  });

  const validateStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 0) fieldsToValidate = ["name", "phone", "email"];
    if (currentStep === 1) fieldsToValidate = ["qualification", "course_interest", "college_name"];
    if (currentStep === 2) fieldsToValidate = ["intake", "budget", "preferred_countries"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev: number) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    // Server action call
    const result = await submitStudentForm(data);

    if (result.success && result.generated_id) {
      setSuccessData({ ...data, id: result.id, generated_id: result.generated_id });
    } else {
      alert("Error submitting form: " + result.error);
    }

    setIsSubmitting(false);
  };

  if (successData) {
    const securityHash = getSecurityCheck(successData.generated_id);
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://fair.ecchouk.co.uk").replace(/\/$/, "");
    const passportUrl = `${baseUrl}/status/${successData.generated_id}-${securityHash}`;

    const waLink = generateWhatsAppLink({
      ...successData,
      passport_url: passportUrl
    });

    return (
      <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-6 sm:p-12">
        <Logo className="mb-12 scale-110" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full rounded-3xl md:rounded-[40px] shadow-2xl shadow-slate-200/50 p-6 sm:p-10 text-center border border-slate-100"
        >
          <div className="mx-auto w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">Passport Secured!</h2>
          <p className="text-slate-500 font-medium mb-8 sm:mb-10 leading-relaxed text-sm sm:text-base">Your registration is successful. Present this ID at the desk.</p>

          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 mb-8 sm:mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Your Journey ID</p>
            <p className="text-4xl font-black tracking-tighter text-primary">{successData.generated_id}</p>
          </div>

          <div className="space-y-4">
            <a
              onClick={async () => {
                if (successData.id) {
                  await incrementWhatsAppShare(successData.id);
                  router.refresh();
                }
              }}
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 text-white font-bold py-5 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
            >
              Share on WhatsApp
            </a>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Register Another Student
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] pb-24 flex flex-col items-center">
      {/* Top Announcement Bar */}
      <div className="w-full bg-slate-900 overflow-hidden relative">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
        >
          <div className="flex items-center gap-x-8 whitespace-nowrap">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              <Calendar size={14} className="text-primary" />
              <span>24 April 2026</span>
            </div>
            <div className="w-1 h-1 bg-white/20 rounded-full hidden sm:block" />
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
              <MapPin size={14} className="text-primary" />
              <span className="hidden sm:inline">Welcomhotel By ITC, Guntur</span>
              <span className="sm:hidden">ITC Guntur</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
              <Sparkles size={14} />
              <span>Scholarships up to ₹10 Lakhs</span>
            </div>
          </div>

          <CountdownTimer />
        </motion.div>
      </div>

      <SocialProofPills />
      <WhatsAppBubble />

      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col items-center mb-16">
          <Logo className="mb-10 sm:mb-12 scale-110" />

          <div className="text-center space-y-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-[9px] font-black uppercase tracking-widest text-primary mb-2 shadow-sm border border-primary/10"
            >
              <Trophy size={12} /> Guntur's Biggest Event
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[0.95]">
              Abroad Education Fair <span className="text-primary">2026</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-bold uppercase tracking-[0.15em]">
              The Ultimate Launchpad For Your Global Career
            </p>
          </div>
        </div>

        {/* Feature Grid - Based on Flyer */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {[
            { icon: <Trophy />, title: "Scholarships", detail: "Up to ₹10 Lakhs", color: "bg-amber-50 text-amber-600 border-amber-100" },
            { icon: <CreditCard />, title: "Loan Support", detail: "Non-Collateral Info", color: "bg-blue-50 text-blue-600 border-blue-100" },
            { icon: <BookOpen />, title: "Free IELTS", detail: "Training & Support", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { icon: <ShieldCheck />, title: "Passport", detail: "Free Application", color: "bg-indigo-50 text-indigo-600 border-indigo-100" }
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={item.title}
              className={cn(
                "p-5 rounded-[24px] border flex flex-col items-center text-center group hover:scale-[1.02] transition-all cursor-default shadow-sm",
                item.color
              )}
            >
              <div className="mb-3 opacity-80 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">{item.title}</h4>
              <p className="text-[11px] font-bold opacity-70 leading-tight">{item.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="max-w-xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12 px-8">
            <div className="flex justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
              <motion.div
                className="absolute top-1/2 left-0 h-[2px] bg-primary -z-10 -translate-y-1/2 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "circOut" }}
              />
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-500
                    ${currentStep >= idx ? "bg-white border-primary text-primary shadow-lg shadow-primary/10" : "bg-white border-slate-100 text-slate-300"}`}
                  >
                    {currentStep > idx ? <Check size={20} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span className={cn(
                    "absolute mt-12 text-[10px] font-bold uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                    currentStep >= idx ? "text-primary opacity-100" : "text-slate-300 opacity-0"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-3xl md:rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 p-6 md:p-12 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-10" />
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                          {...register("name")}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                          placeholder="Your Name"
                        />
                        {errors.name && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input
                          {...register("phone")}
                          type="tel"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                          placeholder="9876543210"
                        />
                        {errors.phone && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.phone.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                          {...register("email")}
                          type="email"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                          placeholder="Please Enter Valid Email"
                        />
                        {errors.email && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">What did you study last?</label>
                        <div className="relative">
                          <select
                            {...register("qualification")}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium appearance-none"
                          >
                            <option value="">Select qualification</option>
                            {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={18} />
                        </div>
                        {errors.qualification && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.qualification.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">College / School Name</label>
                        <input
                          {...register("college_name")}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                          placeholder="Your University"
                        />
                        {errors.college_name && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.college_name.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">GPA / Percentage</label>
                          <input
                            {...register("grad_score")}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                            placeholder="8.5 CGPA"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Backlogs</label>
                          <input
                            {...register("backlogs")}
                            type="number"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">What do you want to study?</label>
                        <input
                          {...register("course_interest")}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                          placeholder="e.g. MS in Data Science"
                        />
                        {errors.course_interest && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.course_interest.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Exp</label>
                          <input
                            {...register("work_experience")}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                            placeholder="2 Years"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">IELTS / GRE</label>
                          <input
                            {...register("ielts_gre")}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium placeholder:text-slate-300"
                            placeholder="7.5"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6 sm:space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Countries you like</label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <Controller
                            name="preferred_countries"
                            control={control}
                            render={({ field }) => (
                              <>
                                {COUNTRIES.map(country => {
                                  const isEurope = country === "Europe";
                                  const selectedEUCount = field.value.filter((v: string) => EUROPE_COUNTRIES.includes(v)).length;
                                  const isSelected = isEurope ? selectedEUCount > 0 : field.value.includes(country);

                                  return (
                                    <div
                                      key={country}
                                      onClick={() => {
                                        if (isEurope) {
                                          setIsEuropeModalOpen(true);
                                          return;
                                        }
                                        const newValue = isSelected
                                          ? field.value.filter((v: string) => v !== country)
                                          : [...field.value, country];
                                        field.onChange(newValue);
                                      }}
                                      className={cn(
                                        "cursor-pointer px-3 py-3 sm:py-4 rounded-2xl border text-[11px] font-bold uppercase tracking-tight text-center transition-all flex items-center justify-center select-none shadow-sm gap-2",
                                        isSelected
                                          ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                                          : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                                      )}
                                    >
                                      {country}
                                      {isEurope && selectedEUCount > 0 && (
                                        <span className="bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                          {selectedEUCount}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          />
                        </div>
                        {errors.preferred_countries && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.preferred_countries.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Any visa rejections before?</label>
                          <Controller
                            name="visa_refusal"
                            control={control}
                            render={({ field }) => (
                              <div className="flex gap-2">
                                {["Yes", "No"].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => field.onChange(val)}
                                    className={cn(
                                      "flex-1 py-4 rounded-2xl border text-xs font-bold transition-all",
                                      field.value === val ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                    )}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Do you have a passport?</label>
                          <Controller
                            name="has_passport"
                            control={control}
                            render={({ field }) => (
                              <div className="flex gap-2">
                                {["Yes", "No"].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => field.onChange(val)}
                                    className={cn(
                                      "flex-1 py-4 rounded-2xl border text-xs font-bold transition-all",
                                      field.value === val ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                    )}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">When do you want to join?</label>
                          <div className="relative">
                            <select
                              {...register("intake")}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium appearance-none"
                            >
                              <option value="">Select intake</option>
                              {INTAKES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={18} />
                          </div>
                          {errors.intake && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.intake.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">How much can you spend?</label>
                          <div className="relative">
                            <select
                              {...register("budget")}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium appearance-none"
                            >
                              <option value="">Select budget</option>
                              {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={18} />
                          </div>
                          {errors.budget && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-wide ml-1 mt-1">{errors.budget.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-50 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-4">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev: number) => prev - 1)}
                    className="w-full sm:flex-1 px-6 py-3.5 sm:py-4 rounded-2xl text-slate-500 font-bold text-sm flex items-center justify-center hover:bg-slate-50 transition-colors uppercase tracking-widest"
                  >
                    <ChevronLeft size={18} className="mr-2" /> Back
                  </button>
                ) : <div className="hidden sm:block sm:flex-1"></div>}

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={validateStep}
                    className="w-full sm:flex-1 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 uppercase tracking-widest"
                  >
                    Continue <ChevronRight size={18} className="ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 uppercase tracking-wide sm:tracking-widest"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">Processing...</span>
                    ) : (
                      <span className="flex items-center"><Sparkles size={16} className="mr-2 text-primary" /> Finish Registration</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
          {/* Europe Selection Modal */}
          <AnimatePresence>
            {isEuropeModalOpen && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                <Controller
                  name="preferred_countries"
                  control={control}
                  render={({ field }) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white/90 backdrop-blur-3xl p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.1)] max-w-2xl w-full border border-white/20 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-400 to-indigo-500" />

                      <div className="flex justify-between items-center mb-6 sm:mb-10">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <Globe className="text-primary" size={24} /> Global Destinations
                          </h3>
                          <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">Select your preferred destinations</p>
                        </div>
                        <button onClick={() => setIsEuropeModalOpen(false)} className="bg-slate-50 p-3 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-inner">
                          <X size={20} strokeWidth={3} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto px-1 custom-scrollbar pb-6">
                        {EUROPE_COUNTRIES.map(c => {
                          const isSelected = field.value.includes(c);
                          return (
                            <div
                              key={c}
                              onClick={() => {
                                const newValue = isSelected
                                  ? field.value.filter((v: string) => v !== c)
                                  : [...field.value, c];
                                field.onChange(newValue);
                              }}
                              className={cn(
                                "cursor-pointer px-4 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-tight text-center transition-all flex items-center justify-center select-none shadow-sm",
                                isSelected
                                  ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                              )}
                            >
                              {c}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                          {field.value.filter((v: string) => EUROPE_COUNTRIES.includes(v)).length} Selections Active
                        </p>
                        <button
                          onClick={() => setIsEuropeModalOpen(false)}
                          className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                        >
                          Confirm Choices
                        </button>
                      </div>
                    </motion.div>
                  )}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Study Destinations - From Flyer */}
          <div className="mt-16 text-center space-y-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Explore Top Study Destinations</p>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap justify-center gap-y-10 gap-x-4 sm:gap-x-10 opacity-70 hover:opacity-100 transition-opacity duration-700">
              {[
                { id: "UK", src: "/images/UK.png" },
                { id: "USA", src: "/images/USA.png" },
                { id: "Ireland", src: "/images/Ireland.png" },
                { id: "Europe", src: "/images/Europe.png" },
                { id: "Canada", src: "/images/Canada.png" },
                { id: "Australia", src: "/images/Australia.png" }
              ].map((c: { id: string; src?: string; icon?: any }) => (
                <div key={c.id} className="flex flex-col items-center gap-3 group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                    {c.src ? (
                      <Image
                        src={c.src}
                        alt={c.id}
                        fill
                        sizes="48px"
                        className="object-contain p-2 group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="text-slate-400 group-hover:text-primary transition-colors">
                        {c.icon}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">{c.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Partners Row - From Flyer */}
          <div className="mt-20 pt-10 border-t border-slate-50 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-10 opacity-50">Educational Loan Partners</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 px-4">
              {[
                { id: "avanse", src: "/images/avanse.png" },
                { id: "credila", src: "/images/credila.png" },
                { id: "incred", src: "/images/incred.png" },
                { id: "unionbank", src: "/images/unionbank.png" }
              ].map(bank => (
                <div
                  key={bank.id}
                  className="h-10 w-32 relative opacity-90 hover:opacity-100 transition-all duration-500 cursor-default"
                >
                  <Image
                    src={bank.src}
                    alt={bank.id}
                    fill
                    sizes="(max-width: 768px) 128px, 160px"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
            <p className="mt-8 text-[9px] font-bold text-slate-400 italic">Non-Collateral Education Loans Available*</p>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        ` }} />
        </div>
      </div>
    </div>
  );
}
