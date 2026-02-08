import { motion } from "framer-motion";
import { Brain, Heart, MapPin, Watch, Users, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Personalized AI Agent",
    description: "An intelligent agent that learns your health profile and provides tailored preventive guidance.",
  },
  {
    icon: Heart,
    title: "Health Profile Analysis",
    description: "Comprehensive analysis of your age, conditions, lifestyle, and family history for accurate recommendations.",
  },
  {
    icon: MapPin,
    title: "Location-Aware Services",
    description: "Discover nearby hospitals, health camps, and fitness centers based on your location.",
  },
  {
    icon: Watch,
    title: "Wearable Integration",
    description: "Connect your smartwatch for real-time vitals monitoring and intelligent health alerts.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "AI-moderated health community for safe, vetted advice and shared experiences.",
  },
  {
    icon: Shield,
    title: "Privacy First Design",
    description: "Your health data is encrypted and never shared. You control who sees what.",
  },
];

const Features = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Intelligent Health Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Our AI agents work together to provide comprehensive, preventive healthcare guidance tailored just for you.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
