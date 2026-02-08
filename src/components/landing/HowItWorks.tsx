import { motion } from "framer-motion";
import { UserPlus, ClipboardList, LayoutDashboard, MessageSquare } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Account",
    description: "Quick signup with just email and password. Your data stays private.",
  },
  {
    icon: ClipboardList,
    step: "02",
    title: "Complete Health Profile",
    description: "Share your health context—conditions, lifestyle, and location for personalized care.",
  },
  {
    icon: LayoutDashboard,
    step: "03",
    title: "Access Dashboard",
    description: "View your health summary, risk indicators, and AI-generated recommendations.",
  },
  {
    icon: MessageSquare,
    step: "04",
    title: "Chat with AI Assistant",
    description: "Get instant, personalized health guidance from your AI health companion.",
  },
];

const HowItWorks = () => {
  return (
    <section className="gradient-subtle py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in minutes with our simple onboarding process designed for your privacy and convenience.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary/50 via-primary to-primary/50 lg:block" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className={`relative flex flex-col items-center gap-8 lg:flex-row ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <div className={`mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg lg:mx-0 ${
                    index % 2 === 0 ? "lg:ml-auto" : "lg:mr-auto"
                  }`}>
                    <div className={`mb-4 flex items-center gap-3 ${
                      index % 2 === 0 ? "lg:flex-row-reverse" : ""
                    }`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <step.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold text-primary">{step.step}</span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-card-foreground">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="relative z-10 hidden lg:block">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                </div>

                {/* Empty space for alignment */}
                <div className="hidden flex-1 lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
