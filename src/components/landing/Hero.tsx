import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Activity, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm"
            >
              <Shield className="h-4 w-4" />
              AI-Powered Preventive Healthcare
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Your Personal
              <span className="relative">
                <span className="relative z-10"> Health </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent" />
                </svg>
              </span>
              Intelligence
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80 lg:mx-0">
              An AI-powered platform that understands your unique health profile, provides personalized preventive guidance, and helps you stay ahead of health issues.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="xl" className="text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-12 flex flex-wrap justify-center gap-6 text-primary-foreground/70 lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Privacy First</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <span className="text-sm">Personalized AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span className="text-sm">Preventive Care</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto w-full max-w-md">
              {/* Main card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="glass rounded-3xl p-8 shadow-2xl"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Heart className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Health Score</h3>
                    <p className="text-sm text-muted-foreground">Based on your profile</p>
                  </div>
                </div>
                <div className="mb-4 flex items-end gap-2">
                  <span className="text-5xl font-bold text-primary">87</span>
                  <span className="mb-2 text-lg text-success">+5%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  />
                </div>
              </motion.div>

              {/* Floating card 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
                transition={{ delay: 0.6, duration: 0.5, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
                className="absolute -left-16 top-1/4 glass rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-success-foreground">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Daily Steps</p>
                    <p className="font-semibold text-foreground">8,432</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating card 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
                transition={{ delay: 0.8, duration: 0.5, y: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
                className="absolute -right-12 bottom-1/4 glass rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="font-semibold text-foreground">72 bpm</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path
            d="M0 120L48 110C96 100 192 80 288 70C384 60 480 60 576 65C672 70 768 80 864 85C960 90 1056 90 1152 85C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
