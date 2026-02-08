import { Heart, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-foreground">HealthAI</span>
            </Link>
            <p className="mb-4 max-w-sm text-muted-foreground">
              Your personalized AI-powered health companion for preventive care and wellness monitoring.
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HealthAI. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Platform</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link to="/login" className="transition-colors hover:text-primary">Sign In</Link></li>
              <li><Link to="/signup" className="transition-colors hover:text-primary">Create Account</Link></li>
              <li><Link to="/" className="transition-colors hover:text-primary">Features</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Legal</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link to="/" className="transition-colors hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/" className="transition-colors hover:text-primary">Terms of Service</Link></li>
              <li><Link to="/" className="transition-colors hover:text-primary">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl bg-muted/50 p-4">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>
              <strong>Health Disclaimer:</strong> This platform provides general health information and personalized guidance for preventive care only. It does not provide medical diagnoses or prescribe medications. Always consult with qualified healthcare professionals for medical advice.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
