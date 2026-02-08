import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileNav } from "@/components/layout/MobileNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Heart,
  Dumbbell,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, updateProfile: updateAuthProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    marital_status: "",
    number_of_children: 0,
    location_city: "",
    location_state: "",
    location_country: "",
    smoking_status: "",
    alcohol_consumption: "",
    activity_level: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        marital_status: profile.marital_status || "",
        number_of_children: profile.number_of_children || 0,
        location_city: profile.location_city || "",
        location_state: profile.location_state || "",
        location_country: profile.location_country || "",
        smoking_status: profile.smoking_status || "",
        alcohol_consumption: profile.alcohol_consumption || "",
        activity_level: profile.activity_level || "",
      });
    }
  }, [profile]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await updateAuthProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !profile?.avatar_url) return;

    try {
      const { error } = await updateAuthProfile({ avatar_url: null });
      if (error) throw error;

      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove photo.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await updateAuthProfile(formData);
      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const healthConditions = profile?.health_conditions || [];
  const physicalProblems = profile?.physical_problems || [];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-foreground">Profile</span>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-4 ring-background shadow-lg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-14 w-14 text-primary" />
                )}
              </div>
              {profile?.avatar_url && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
              {profile?.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Personal Details</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
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
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(v) => updateField("marital_status", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.marital_status === "married" || formData.marital_status === "divorced") && (
                <div className="space-y-2">
                  <Label htmlFor="children">Number of Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    max="20"
                    value={formData.number_of_children}
                    onChange={(e) => updateField("number_of_children", parseInt(e.target.value) || 0)}
                    className="h-12"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Location</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.location_city}
                  onChange={(e) => updateField("location_city", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.location_state}
                  onChange={(e) => updateField("location_state", e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.location_country}
                  onChange={(e) => updateField("location_country", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </motion.div>

          {/* Health Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Health Summary</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/health-setup">Update Health Info</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="mb-2 text-sm text-muted-foreground">Health Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {healthConditions.length > 0 ? (
                    healthConditions.map((condition: string) => (
                      <span
                        key={condition}
                        className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                      >
                        {condition}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None reported</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="mb-2 text-sm text-muted-foreground">Physical Problems</p>
                <div className="flex flex-wrap gap-2">
                  {physicalProblems.length > 0 ? (
                    physicalProblems.map((problem: string) => (
                      <span
                        key={problem}
                        className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground"
                      >
                        {problem}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None reported</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lifestyle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Lifestyle</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Smoking</Label>
                <Select value={formData.smoking_status} onValueChange={(v) => updateField("smoking_status", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="former">Former</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcohol</Label>
                <Select value={formData.alcohol_consumption} onValueChange={(v) => updateField("alcohol_consumption", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={formData.activity_level} onValueChange={(v) => updateField("activity_level", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very-active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Profile;
