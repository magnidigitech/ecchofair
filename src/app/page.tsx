"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { submitStudentForm } from "./actions";

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
  { id: "personal", title: "Personal Details" },
  { id: "academic", title: "Academic Profile" },
  { id: "preferences", title: "Study Preferences" },
];

const QUALIFICATIONS = ["High School / 12th", "Diploma", "Bachelors", "Masters", "Ph.D"];
const INTAKES = ["Fall 2026", "Spring 2027", "Fall 2027"];
const BUDGETS = ["Under $20k", "$20k - $40k", "$40k - $60k", "Above $60k"];
const COUNTRIES = ["USA", "UK", "Australia", "Canada", "Ireland", "New Zealand", "Europe"];

export default function StudentForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

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
    if (currentStep === 1) fieldsToValidate = ["qualification", "course_interest"];
    if (currentStep === 2) fieldsToValidate = ["intake", "budget", "preferred_countries"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Server action call
    const result = await submitStudentForm(data);
    
    if (result.success && result.generated_id) {
      setSuccessId(result.generated_id);
    } else {
      alert("Error submitting form: " + result.error);
    }
    
    setIsSubmitting(false);
  };

  if (successId) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-border"
        >
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Check size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
          <p className="text-muted-foreground mb-6">Present this ID at counseling desks</p>
          
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            <p className="text-sm font-medium text-primary mb-1">Your Unique ID</p>
            <p className="text-3xl font-black tracking-wider text-foreground">{successId}</p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-secondary text-secondary-foreground font-medium py-3 rounded-xl hover:bg-secondary/80 transition-colors"
          >
            Register Another Student
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Eccho Overseas Form
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fast-track your counseling session
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-border -z-10 -translate-y-1/2 rounded-full"></div>
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 bg-background transition-colors
                    ${currentStep >= idx ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  {currentStep > idx ? <Check size={16} /> : idx + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1">
            {steps.map((step, idx) => (
              <span key={step.id} className={`text-xs font-medium ${currentStep >= idx ? "text-primary" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-background rounded-2xl shadow-xl shadow-black/5 border border-border p-6 sm:p-8 overflow-hidden relative">
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
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input 
                        {...register("name")}
                        className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="e.g. Rahul Sharma"
                      />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <input 
                        {...register("phone")}
                        type="tel"
                        className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="e.g. 9876543210"
                      />
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email Address</label>
                      <input 
                        {...register("email")}
                        type="email"
                        className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="e.g. yourname@gmail.com"
                      />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Highest Qualification</label>
                      <select 
                        {...register("qualification")}
                        className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Select qualification</option>
                        {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                      {errors.qualification && <p className="text-destructive text-xs mt-1">{errors.qualification.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Current College / University</label>
                      <input 
                        {...register("college_name")}
                        className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Your College"
                      />
                      {errors.college_name && <p className="text-destructive text-xs mt-1">{errors.college_name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">GPA / Percentage</label>
                        <input 
                          {...register("grad_score")}
                          className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          placeholder="e.g. 8.5 CGPA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Backlogs</label>
                        <input 
                          {...register("backlogs")}
                          type="number"
                          className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Course Interest</label>
                      <input 
                        {...register("course_interest")}
                        className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="e.g. Masters in Data Science"
                      />
                      {errors.course_interest && <p className="text-destructive text-xs mt-1">{errors.course_interest.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Work Exp (Years)</label>
                        <input 
                          {...register("work_experience")}
                          className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          placeholder="e.g. 2 Years"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">IELTS / GRE</label>
                        <input 
                          {...register("ielts_gre")}
                          className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          placeholder="e.g. 7.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Preferred Countries</label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Controller
                          name="preferred_countries"
                          control={control}
                          render={({ field }) => (
                            <>
                              {COUNTRIES.map(country => {
                                const isSelected = field.value.includes(country);
                                return (
                                  <div 
                                    key={country}
                                    onClick={() => {
                                      const newValue = isSelected 
                                        ? field.value.filter(v => v !== country)
                                        : [...field.value, country];
                                      field.onChange(newValue);
                                    }}
                                    className={`
                                      cursor-pointer px-4 py-3 rounded-xl border text-sm font-medium text-center transition-all flex items-center justify-center select-none
                                      ${isSelected 
                                        ? "bg-primary/10 border-primary text-primary" 
                                        : "bg-background border-border hover:border-primary/50"}
                                    `}
                                  >
                                    {country}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        />
                      </div>
                      {errors.preferred_countries && <p className="text-destructive text-xs mt-1">{errors.preferred_countries.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visa Refusal?</label>
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
                                    "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                                    field.value === val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                                  )}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Have Passport?</label>
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
                                    "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                                    field.value === val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-50">
                      <div>
                        <label className="block text-sm font-medium mb-1">Target Intake</label>
                        <select 
                          {...register("intake")}
                          className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                        >
                          <option value="">Select intake</option>
                          {INTAKES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        {errors.intake && <p className="text-destructive text-xs mt-1">{errors.intake.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Budget</label>
                        <select 
                          {...register("budget")}
                          className="w-full !bg-background border-border border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                        >
                          <option value="">Select budget</option>
                          {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        {errors.budget && <p className="text-destructive text-xs mt-1">{errors.budget.message}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl text-foreground font-medium flex items-center hover:bg-secondary transition-colors"
                >
                  <ChevronLeft size={18} className="mr-1" /> Back
                </button>
              ) : <div></div>}

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={validateStep}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                  Next Step <ChevronRight size={18} className="ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-foreground text-background font-semibold flex items-center shadow-lg transition-all hover:bg-foreground/90 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">Processing...</span>
                  ) : (
                    <span className="flex items-center"><Sparkles size={16} className="mr-2" /> Finish & Generate ID</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
