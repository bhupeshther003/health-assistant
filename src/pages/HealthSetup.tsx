import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowRight, ArrowLeft, User, Heart, Dumbbell, MapPin, Check, Plus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Medical Background", icon: Heart },
  { id: 3, title: "Lifestyle", icon: Dumbbell },
  { id: 4, title: "Location", icon: MapPin },
];

const diseases = [
  "Diabetes",
  "Blood Pressure",
  "Heart Disease",
  "Thyroid",
  "Asthma",
  "Cholesterol",
  "Kidney Disease",
  "Liver Disease",
];

const physicalProblems = [
  "Back Pain",
  "Joint Pain",
  "Knee Pain",
  "Obesity",
  "Sleep Issues",
  "Migraine",
  "Arthritis",
  "Muscle Pain",
];

const activityLevels = [
  { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { value: "light", label: "Light", desc: "Light exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", desc: "Moderate exercise 3-5 days/week" },
  { value: "active", label: "Active", desc: "Hard exercise 6-7 days/week" },
  { value: "very-active", label: "Very Active", desc: "Very hard exercise & physical job" },
];

const foodPreferences = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non-vegetarian", label: "Non-Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
];

const dailyRoutines = [
  { value: "desk-job", label: "Desk Job", desc: "Mostly sitting, computer work" },
  { value: "field-work", label: "Field Work", desc: "Active, outdoor work" },
  { value: "mixed", label: "Mixed", desc: "Combination of both" },
  { value: "remote", label: "Remote/Home", desc: "Work from home" },
];

const HealthSetup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, updateProfile, onboardingComplete, refreshProfile } = useAuth();

  // Redirect to dashboard if onboarding already completed
  useEffect(() => {
    if (onboardingComplete) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboardingComplete, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    maritalStatus: "",
    numberOfChildren: "",
    diseases: [] as string[],
    customDisease: "",
    noDisease: false,
    physicalProblems: [] as string[],
    customPhysicalProblem: "",
    noPhysicalProblem: false,
    smoking: "",
    alcohol: "",
    activityLevel: "",
    foodPreference: "",
    dailyRoutine: "",
    sleepHours: "",
    heightCm: "",
    weightKg: "",
    city: "",
    state: "",
    country: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [customDiseases, setCustomDiseases] = useState<string[]>([]);
  const [customPhysicalProblems, setCustomPhysicalProblems] = useState<string[]>([]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "diseases" | "physicalProblems", value: string) => {
    const current = formData[field];
    const newArray = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFormData(field, newArray);
    
    if (field === "diseases" && newArray.length > 0) {
      updateFormData("noDisease", false);
    }
    if (field === "physicalProblems" && newArray.length > 0) {
      updateFormData("noPhysicalProblem", false);
    }
  };

  const handleNoneToggle = (field: "noDisease" | "noPhysicalProblem") => {
    const newValue = !formData[field];
    updateFormData(field, newValue);
    
    if (newValue) {
      if (field === "noDisease") {
        updateFormData("diseases", []);
        setCustomDiseases([]);
      } else {
        updateFormData("physicalProblems", []);
        setCustomPhysicalProblems([]);
      }
    }
  };

  const addCustomDisease = () => {
    if (formData.customDisease.trim()) {
      setCustomDiseases([...customDiseases, formData.customDisease.trim()]);
      updateFormData("diseases", [...formData.diseases, formData.customDisease.trim()]);
      updateFormData("customDisease", "");
      updateFormData("noDisease", false);
    }
  };

  const removeCustomDisease = (disease: string) => {
    setCustomDiseases(customDiseases.filter(d => d !== disease));
    updateFormData("diseases", formData.diseases.filter(d => d !== disease));
  };

  const addCustomPhysicalProblem = () => {
    if (formData.customPhysicalProblem.trim()) {
      setCustomPhysicalProblems([...customPhysicalProblems, formData.customPhysicalProblem.trim()]);
      updateFormData("physicalProblems", [...formData.physicalProblems, formData.customPhysicalProblem.trim()]);
      updateFormData("customPhysicalProblem", "");
      updateFormData("noPhysicalProblem", false);
    }
  };

  const removeCustomPhysicalProblem = (problem: string) => {
    setCustomPhysicalProblems(customPhysicalProblems.filter(p => p !== problem));
    updateFormData("physicalProblems", formData.physicalProblems.filter(p => p !== problem));
  };

  const showChildrenQuestion = formData.maritalStatus === "married" || formData.maritalStatus === "divorced";

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Calculate health score based on lifestyle factors
  const calculateHealthScore = () => {
    let score = 70; // Base score

    // Activity level bonus
    if (formData.activityLevel === "active" || formData.activityLevel === "very-active") {
      score += 15;
    } else if (formData.activityLevel === "moderate") {
      score += 10;
    } else if (formData.activityLevel === "light") {
      score += 5;
    }

    // Smoking penalty
    if (formData.smoking === "current") {
      score -= 15;
    } else if (formData.smoking === "former") {
      score -= 5;
    }

    // Alcohol penalty
    if (formData.alcohol === "regular") {
      score -= 10;
    } else if (formData.alcohol === "occasional") {
      score -= 3;
    }

    // Health conditions penalty
    const conditionCount = formData.diseases.length;
    score -= conditionCount * 5;

    // Physical problems penalty
    const problemCount = formData.physicalProblems.length;
    score -= problemCount * 3;

    // Sleep hours bonus
    const sleepHours = parseFloat(formData.sleepHours);
    if (sleepHours >= 7 && sleepHours <= 9) {
      score += 5;
    } else if (sleepHours < 6 || sleepHours > 10) {
      score -= 5;
    }

    return Math.max(20, Math.min(100, score));
  };

  // Calculate health risk level
  const calculateRiskLevel = () => {
    const hasChronicDisease = formData.diseases.some(d => 
      ["Diabetes", "Heart Disease", "Blood Pressure", "Kidney Disease"].includes(d)
    );
    const isSmoker = formData.smoking === "current";
    const lowActivity = formData.activityLevel === "sedentary";
    const regularDrinker = formData.alcohol === "regular";

    const riskFactors = [hasChronicDisease, isSmoker, lowActivity, regularDrinker].filter(Boolean).length;

    if (riskFactors >= 3) return "high";
    if (riskFactors >= 1) return "moderate";
    return "low";
  };

  // Generate lifestyle summary
  const generateLifestyleSummary = () => {
    const parts = [];
    
    if (formData.activityLevel) {
      parts.push(`${formData.activityLevel.replace("-", " ")} activity level`);
    }
    if (formData.foodPreference) {
      parts.push(`${formData.foodPreference} diet`);
    }
    if (formData.dailyRoutine) {
      parts.push(`${formData.dailyRoutine.replace("-", " ")} work style`);
    }
    if (formData.sleepHours) {
      parts.push(`${formData.sleepHours} hours of sleep`);
    }

    return parts.join(", ") || "Lifestyle details not provided";
  };

  const getLocation = () => {
    if ("geolocation" in navigator) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          updateFormData("latitude", latitude);
          updateFormData("longitude", longitude);

          // Try to reverse geocode using a free API
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            if (data.address) {
              updateFormData("city", data.address.city || data.address.town || data.address.village || "");
              updateFormData("state", data.address.state || "");
              updateFormData("country", data.address.country || "");
            }
          } catch (error) {
            console.error("Geocoding error:", error);
          }

          setIsDetectingLocation(false);
          toast({
            title: "Location detected",
            description: "Your location has been set successfully.",
          });
        },
        (error) => {
          setIsDetectingLocation(false);
          toast({
            title: "Location access denied",
            description: "Please enter your location manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete setup.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const healthScore = calculateHealthScore();
    const riskLevel = calculateRiskLevel();
    const lifestyleSummary = generateLifestyleSummary();

    // Calculate date of birth from age
    const age = parseInt(formData.age);
    const birthYear = new Date().getFullYear() - age;
    const dateOfBirth = `${birthYear}-01-01`;

    const profileData = {
      first_name: formData.firstName || null,
      last_name: formData.lastName || null,
      date_of_birth: age ? dateOfBirth : null,
      gender: formData.gender || null,
      marital_status: formData.maritalStatus || null,
      number_of_children: formData.numberOfChildren ? parseInt(formData.numberOfChildren) : 0,
      health_conditions: formData.noDisease ? [] : formData.diseases,
      physical_problems: formData.noPhysicalProblem ? [] : formData.physicalProblems,
      smoking_status: formData.smoking || null,
      alcohol_consumption: formData.alcohol || null,
      activity_level: formData.activityLevel || null,
      food_preference: formData.foodPreference || null,
      daily_routine: formData.dailyRoutine || null,
      sleep_hours: formData.sleepHours ? parseFloat(formData.sleepHours) : null,
      height_cm: formData.heightCm ? parseFloat(formData.heightCm) : null,
      weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
      location_city: formData.city || null,
      location_state: formData.state || null,
      location_country: formData.country || null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      health_score: healthScore,
      health_risk_level: riskLevel,
      lifestyle_summary: lifestyleSummary,
      onboarding_completed: true,
    };

    const { error } = await updateProfile(profileData);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    await refreshProfile();

    toast({
      title: "Profile complete!",
      description: `Health Score: ${healthScore}/100 | Risk Level: ${riskLevel}`,
    });

    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => updateFormData("age", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => updateFormData("gender", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Marital Status</Label>
              <RadioGroup
                value={formData.maritalStatus}
                onValueChange={(v) => {
                  updateFormData("maritalStatus", v);
                  if (v === "single" || v === "widowed") {
                    updateFormData("numberOfChildren", "");
                  }
                }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {["single", "married", "divorced", "widowed"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={status} />
                    <Label htmlFor={status} className="cursor-pointer capitalize">{status}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {showChildrenQuestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="numberOfChildren">Number of Children</Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  min="0"
                  max="20"
                  placeholder="Enter number of children"
                  value={formData.numberOfChildren}
                  onChange={(e) => updateFormData("numberOfChildren", e.target.value)}
                  className="h-12 max-w-xs"
                />
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label>Existing Health Conditions (select all that apply)</Label>
              
              <div
                onClick={() => handleNoneToggle("noDisease")}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  formData.noDisease
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={formData.noDisease}
                  onCheckedChange={() => handleNoneToggle("noDisease")}
                />
                <span className="text-sm font-medium">None - I don't have any health conditions</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {diseases.map((disease) => (
                  <div
                    key={disease}
                    onClick={() => !formData.noDisease && toggleArrayField("diseases", disease)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      formData.diseases.includes(disease)
                        ? "border-primary bg-primary/5"
                        : formData.noDisease
                        ? "border-muted bg-muted/50 cursor-not-allowed opacity-50"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.diseases.includes(disease)}
                      onCheckedChange={() => !formData.noDisease && toggleArrayField("diseases", disease)}
                      disabled={formData.noDisease}
                    />
                    <span className="text-sm font-medium">{disease}</span>
                  </div>
                ))}
              </div>

              {customDiseases.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {customDiseases.map((disease) => (
                    <span
                      key={disease}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {disease}
                      <button onClick={() => removeCustomDisease(disease)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {!formData.noDisease && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Other condition not listed..."
                    value={formData.customDisease}
                    onChange={(e) => updateFormData("customDisease", e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCustomDisease()}
                    className="h-10"
                  />
                  <Button type="button" size="sm" onClick={addCustomDisease} disabled={!formData.customDisease.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Physical Problems (select all that apply)</Label>
              
              <div
                onClick={() => handleNoneToggle("noPhysicalProblem")}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  formData.noPhysicalProblem
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={formData.noPhysicalProblem}
                  onCheckedChange={() => handleNoneToggle("noPhysicalProblem")}
                />
                <span className="text-sm font-medium">None - I don't have any physical problems</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {physicalProblems.map((problem) => (
                  <div
                    key={problem}
                    onClick={() => !formData.noPhysicalProblem && toggleArrayField("physicalProblems", problem)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      formData.physicalProblems.includes(problem)
                        ? "border-primary bg-primary/5"
                        : formData.noPhysicalProblem
                        ? "border-muted bg-muted/50 cursor-not-allowed opacity-50"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.physicalProblems.includes(problem)}
                      onCheckedChange={() => !formData.noPhysicalProblem && toggleArrayField("physicalProblems", problem)}
                      disabled={formData.noPhysicalProblem}
                    />
                    <span className="text-sm font-medium">{problem}</span>
                  </div>
                ))}
              </div>

              {customPhysicalProblems.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {customPhysicalProblems.map((problem) => (
                    <span
                      key={problem}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {problem}
                      <button onClick={() => removeCustomPhysicalProblem(problem)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {!formData.noPhysicalProblem && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Other problem not listed..."
                    value={formData.customPhysicalProblem}
                    onChange={(e) => updateFormData("customPhysicalProblem", e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCustomPhysicalProblem()}
                    className="h-10"
                  />
                  <Button type="button" size="sm" onClick={addCustomPhysicalProblem} disabled={!formData.customPhysicalProblem.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  min="50"
                  max="300"
                  placeholder="Enter height in cm"
                  value={formData.heightCm}
                  onChange={(e) => updateFormData("heightCm", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min="20"
                  max="500"
                  placeholder="Enter weight in kg"
                  value={formData.weightKg}
                  onChange={(e) => updateFormData("weightKg", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Food Preference</Label>
              <RadioGroup
                value={formData.foodPreference}
                onValueChange={(v) => updateFormData("foodPreference", v)}
                className="grid gap-3 sm:grid-cols-2"
              >
                {foodPreferences.map((pref) => (
                  <div key={pref.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={pref.value} id={`food-${pref.value}`} />
                    <Label htmlFor={`food-${pref.value}`} className="cursor-pointer">{pref.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Daily Routine Type</Label>
              <div className="grid gap-3">
                {dailyRoutines.map((routine) => (
                  <div
                    key={routine.value}
                    onClick={() => updateFormData("dailyRoutine", routine.value)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      formData.dailyRoutine === routine.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{routine.label}</p>
                      <p className="text-sm text-muted-foreground">{routine.desc}</p>
                    </div>
                    {formData.dailyRoutine === routine.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Smoking Habit</Label>
              <RadioGroup
                value={formData.smoking}
                onValueChange={(v) => updateFormData("smoking", v)}
                className="grid gap-3 sm:grid-cols-3"
              >
                {["never", "current", "former"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={`smoking-${status}`} />
                    <Label htmlFor={`smoking-${status}`} className="cursor-pointer capitalize">{status}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Alcohol Consumption</Label>
              <RadioGroup
                value={formData.alcohol}
                onValueChange={(v) => updateFormData("alcohol", v)}
                className="grid gap-3 sm:grid-cols-3"
              >
                {["never", "occasional", "regular"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={`alcohol-${status}`} />
                    <Label htmlFor={`alcohol-${status}`} className="cursor-pointer capitalize">{status}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Activity Level</Label>
              <div className="grid gap-3">
                {activityLevels.map((level) => (
                  <div
                    key={level.value}
                    onClick={() => updateFormData("activityLevel", level.value)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      formData.activityLevel === level.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.desc}</p>
                    </div>
                    {formData.activityLevel === level.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleepHours">Average Sleep Hours</Label>
              <Input
                id="sleepHours"
                type="number"
                min="1"
                max="24"
                step="0.5"
                placeholder="Enter average sleep hours"
                value={formData.sleepHours}
                onChange={(e) => updateFormData("sleepHours", e.target.value)}
                className="h-12 max-w-xs"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-primary" />
              <h3 className="mb-2 font-semibold">Location Access</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                We use your location to recommend nearby health services, hospitals, and wellness centers.
              </p>
              <Button type="button" onClick={getLocation} variant="outline" disabled={isDetectingLocation}>
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Detect My Location
                  </>
                )}
              </Button>
              {formData.latitude && formData.longitude && (
                <p className="mt-2 text-xs text-success">
                  ✓ Location detected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Or enter your location manually:</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Health Summary Preview */}
            {(formData.activityLevel || formData.diseases.length > 0) && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <h3 className="mb-3 font-semibold text-foreground">Health Summary Preview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Health Score</span>
                    <span className="font-medium text-primary">{calculateHealthScore()}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className={`font-medium capitalize ${
                      calculateRiskLevel() === "high" ? "text-destructive" :
                      calculateRiskLevel() === "moderate" ? "text-warning" : "text-success"
                    }`}>
                      {calculateRiskLevel()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lifestyle</span>
                    <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                      {generateLifestyleSummary()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Activity className="h-7 w-7" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">Set Up Your Health Profile</h1>
            <p className="text-muted-foreground">
              Help us understand your health context for personalized guidance
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        currentStep >= step.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`mt-2 hidden text-xs sm:block ${
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 transition-all ${
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : currentStep === 4 ? (
                  <>
                    Complete
                    <Check className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthSetup;
