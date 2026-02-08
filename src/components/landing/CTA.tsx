import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl gradient-hero p-12 text-center lg:p-20"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex items-center justify-center gap-2"
            >
              <Heart className="h-8 w-8 text-primary-foreground" />
            </motion.div>

            <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Take Control of Your Health Today
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
              Join thousands who are already using AI-powered preventive healthcare to live healthier, longer lives.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/signup">
                  Start Your Health Journey
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-primary-foreground/60">
              Free to start • No credit card required • Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
