import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-primary-foreground/10 bg-transparent backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary-foreground">HealthAI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 md:flex">
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="hero-outline" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-primary-foreground transition-colors hover:bg-primary-foreground/10 md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-primary-foreground/10 bg-primary/95 backdrop-blur-lg md:hidden"
          >
            <div className="container mx-auto space-y-4 px-4 py-6">
              <Button variant="ghost" className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
              </Button>
              <Button variant="hero-outline" className="w-full" asChild>
                <Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
