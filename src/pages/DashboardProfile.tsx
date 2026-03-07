import { Camera, Mail, Phone, MapPin, Briefcase, GraduationCap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "@/lib/api";
import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const indianMobileRegex = /^(?:[6-9]\d{9})$/;

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  email: z.string().trim().email("Email must be valid."),
  phone: z
    .string()
    .trim()
    .regex(indianMobileRegex, "Please enter a valid 10-digit Indian mobile number (starts with 6-9)")
    .or(z.literal(""))
    .optional(),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  experience: z
    .string()
    .trim()
    .regex(/^\d+$/, "Experience must be a number")
    .transform((val) => (val === "" ? null : Number(val)))
    .refine((val) => val === null || (val >= 0 && val <= 50), {
      message: "Experience must be between 0 and 50 years",
    })
    .optional()
    .nullable(),
  education: z.string().trim().max(200).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const DashboardProfile = () => {
  const { user, isLoaded } = useUser();
  const api = useApi();

  const fullName = user?.fullName ?? user?.firstName ?? user?.username ?? "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lastSavedValues, setLastSavedValues] = useState<ProfileFormValues | null>(null);
  const [savedProfile, setSavedProfile] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email,
      phone: "",
      role: "",
      experience: null,
      education: "",
      location: "",
    },
  });

  useEffect(() => {
    if (!isLoaded) return;

    reset((prev) => ({
      ...prev,
      firstName: user?.firstName ?? prev.firstName ?? "",
      lastName: user?.lastName ?? prev.lastName ?? "",
      email,
    }));
  }, [isLoaded, user?.id, email, reset]);

  useEffect(() => {
    if (!isLoaded) return;

    (async () => {
      try {
        setLoadingProfile(true);
        const res = await api.getProfile();
        const profile = res?.profile ?? null;
        setSavedProfile(profile);

        const nextValues: ProfileFormValues = {
          firstName: profile?.firstName ?? user?.firstName ?? "",
          lastName: profile?.lastName ?? user?.lastName ?? "",
          email,
          phone: profile?.phone ?? "",
          role: profile?.preferences?.currentRole ?? "",
          experience: profile?.preferences?.experience
            ? Number(profile.preferences.experience)
            : null,
          education: profile?.education ?? "",
          location: profile?.location ?? "",
        };

        setLastSavedValues(nextValues);
        reset(nextValues);
      } catch (err: any) {
        toast.error(err.message || "Failed to load profile.");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [isLoaded, email, reset, user?.firstName, user?.lastName]);

  const phoneDisplay = savedProfile?.phone || user?.phoneNumbers?.[0]?.phoneNumber || "—";
  const locationDisplay = savedProfile?.location || "—";

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (jpg, png, etc.)");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image size must be under 25MB");
      return;
    }

    setUploadingPhoto(true);

    try {
      await user.setProfileImage({ file });
      toast.success("Profile picture updated successfully!");
      // Clerk auto-updates user object → imageUrl will refresh
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingPhoto(false);
      // Reset input
      e.target.value = "";
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone?.trim() || null,
        location: values.location?.trim() || null,
        education: values.education?.trim() || null,
        preferences: {
          currentRole: values.role?.trim() || null,
          experience: values.experience ?? null,
        },
      };

      const res = await api.upsertProfile(payload);
      const profile = res?.profile ?? null;
      setSavedProfile(profile);

      const updatedFormValues: ProfileFormValues = {
        ...values,
        experience: profile?.preferences?.experience ?? null,
      };

      setLastSavedValues(updatedFormValues);
      reset(updatedFormValues);
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading user...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="relative inline-block mb-4 group">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-3xl font-bold text-white shadow-md">
                    {initials || "U"}
                  </div>
                )}

                {/* Upload trigger */}
                <label
                  htmlFor="profile-photo"
                  className={`absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-all cursor-pointer shadow-lg transform group-hover:scale-110 ${
                    uploadingPhoto ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera size={18} />
                  )}
                </label>

                <input
                  type="file"
                  accept="image/*"
                  id="profile-photo"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto || !user}
                />
              </div>

              <h2 className="text-xl font-semibold text-foreground">{fullName}</h2>
              <p className="text-muted-foreground">{email}</p>

              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail size={16} />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone size={16} />
                  <span>{phoneDisplay}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin size={16} />
                  <span>{locationDisplay}</span>
                </div>
              </div>

              {/* Stats – optional */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">14</p>
                    <p className="text-xs text-muted-foreground">Interviews</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">85%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">12</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form – remains almost same */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="bg-secondary border-border"
                      readOnly
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (10-digit Indian mobile)</Label>
                    <Input
                      id="phone"
                      placeholder="9876543210"
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center gap-2">
                      <Briefcase size={14} />
                      Current Role
                    </Label>
                    <Input
                      id="role"
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("role")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      max={50}
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("experience")}
                    />
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education" className="flex items-center gap-2">
                      <GraduationCap size={14} />
                      Education
                    </Label>
                    <Input
                      id="education"
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("education")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      className="bg-secondary border-border"
                      disabled={loadingProfile}
                      {...register("location")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  disabled={saving || loadingProfile}
                  onClick={() => lastSavedValues && reset(lastSavedValues)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary text-primary-foreground"
                  disabled={saving || loadingProfile || !isDirty}
                >
                  {saving ? "Saving..." : "Save Information"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardProfile;