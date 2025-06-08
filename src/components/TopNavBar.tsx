import {
  Bell,
  HelpCircle,
  LogOut,
  X,
  Phone,
  Mail,
  MessageCircle,
  User,
  Settings,
  Edit,
  Camera,
  Shield,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Lock,
  Key,
  CreditCard,
  Download,
  Upload,
  FileText,
  Calendar,
  MapPin,
  Languages,
  Palette,
  Zap,
  Database,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Save,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase } from "@/hooks/useDatabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface TopNavBarProps {
  className?: string;
  onLogout?: () => void;
}

export default function TopNavBar({ className, onLogout }: TopNavBarProps) {
  const {
    profileData,
    settings,
    updateProfile: updateAppProfile,
    updateSettings,
    resetSettings,
    exportData,
    clearLocalData,
  } = useAppContext();

  const { user } = useAuth();
  const { profile, updateProfile } = useDatabase(user?.id || null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempProfileData, setTempProfileData] = useState(
    profile || profileData,
  );

  // Update temp profile data when database profile changes
  useEffect(() => {
    if (profile) {
      setTempProfileData({
        fullName: profile.full_name || profileData.fullName || "",
        email: profile.email || user?.email || profileData.email || "",
        phone: profile.phone || profileData.phone || "",
        location: profile.address || profileData.location || "",
        accountNumber: profile.id?.slice(-8) || profileData.accountNumber || "",
        joinDate: profile.registration_date
          ? new Date(profile.registration_date).toLocaleDateString("ar-SA")
          : profileData.joinDate || "",
        address: profile.address || profileData.address || "",
        language: profileData.language || "العربية",
        currency: profileData.currency || "دينار جزائري",
        profileImage: profile.profile_image || profileData.profileImage || "",
        referralCode: profile.referral_code || profileData.referralCode || "",
        referredBy: profileData.referredBy || "",
      });
    }
  }, [profile, user, profileData]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [notifications] = useState([]);

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const handleSupport = () => {
    setShowSupport(true);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleProfile = () => {
    setShowProfile(true);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    if (onLogout) {
      onLogout();
    } else {
      // Fallback to reload if no onLogout prop
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleProfileSave = async () => {
    try {
      // Update database profile
      if (user?.id && profile) {
        await updateProfile({
          full_name: tempProfileData.fullName,
          phone: tempProfileData.phone,
          address: tempProfileData.location,
          username: tempProfileData.email.split("@")[0], // Extract username from email
        });
      }

      // Also update app context for consistency
      updateAppProfile(tempProfileData);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleProfileCancel = () => {
    setTempProfileData(profile || profileData);
    setEditMode(false);
  };

  const handleSettingsSave = () => {
    // Settings are saved automatically through context
    setShowSettings(false);
  };

  const handlePasswordChange = () => {
    // Simulate password change
    alert("سيتم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني");
  };

  const handleManageDevices = () => {
    // Simulate device management
    alert("سيتم فتح صفحة إدارة الأجهزة المتصلة");
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = () => {
    alert("تم إرسال طلب حذف الحساب. سيتم التواصل معك خلال 24 ساعة.");
    setShowDeleteConfirm(false);
  };

  const handleResetSettings = () => {
    setShowResetConfirm(true);
  };

  const confirmResetSettings = () => {
    resetSettings();
    setShowResetConfirm(false);
    alert("تم إعادة تعيين جميع الإعدادات إلى القيم الافتراضية");
  };

  const handleClearLocalData = () => {
    setShowClearDataConfirm(true);
  };

  const confirmClearLocalData = () => {
    clearLocalData();
    setShowClearDataConfirm(false);
    alert("تم مسح جميع البيانات المحلية");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setTempProfileData((prev) => ({ ...prev, profileImage: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Export data function is now handled by context

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-md border-b border-white/20 z-[9999] shadow-lg",
        className,
      )}
      style={{ position: "fixed" }}
    >
      <div className="flex justify-between items-center py-2 px-3 sm:py-3 sm:px-4 max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* Left Side - Settings and Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleSettings}
            className="flex items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/20 active:bg-white/30 touch-manipulation"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleProfile}
            className="flex items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/20 active:bg-white/30 touch-manipulation"
            title="الملف الشخصي"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Logo/Title Section */}
        <div className="flex items-center">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
            NETLIFY
          </h1>
        </div>

        {/* Right Side - Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications Button */}
          <button
            onClick={handleNotifications}
            className="relative flex items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/20 active:bg-white/30 touch-manipulation"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {/* Notification Badge */}
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white/20">
              {notifications.filter((n) => !n.read).length}
            </span>
          </button>

          {/* Support Button */}
          <button
            onClick={handleSupport}
            className="flex items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/20 active:bg-white/30 touch-manipulation"
            title="التواصل مع الدعم"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 text-gray-300 hover:text-red-400 hover:bg-red-500/30 active:bg-red-500/40 touch-manipulation"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-md mx-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Bell className="w-6 h-6 text-blue-400" />
              الإشعارات
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              آخر التحديثات والإشعارات المهمة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            {notifications.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white/10 border border-white/20 rounded-lg p-4 ${!notification.read ? "border-blue-400/50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {notification.type === "security" && (
                            <Shield className="w-4 h-4 text-green-400" />
                          )}
                          {notification.type === "transaction" && (
                            <CreditCard className="w-4 h-4 text-blue-400" />
                          )}
                          <h4 className="text-white font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 text-sm">لا توجد إشعارات جديدة</p>
                <p className="text-gray-500 text-xs mt-1">
                  ستظهر الإشعارات المهمة هنا
                </p>
              </div>
            )}
            <Button
              onClick={() => setShowNotifications(false)}
              className="w-full h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60 text-right"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 via-green-900/95 to-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-md mx-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-green-400" />
              التواصل مع الدعم
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              كيف يمكننا مساعدتك؟
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowSupport(false);
                  // Simulate opening chat
                }}
                variant="outline"
                className="w-full h-14 border-green-400/50 text-white hover:bg-green-500/20 flex items-center gap-3 justify-start"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                <div className="text-right">
                  <p className="font-medium">الدردشة المباشرة</p>
                  <p className="text-xs text-gray-300">متاح 24/7</p>
                </div>
              </Button>
              <Button
                onClick={() => {
                  setShowSupport(false);
                  window.location.href = "mailto:support@netlifyy.com";
                }}
                variant="outline"
                className="w-full h-14 border-blue-400/50 text-white hover:bg-blue-500/20 flex items-center gap-3 justify-start"
              >
                <Mail className="w-5 h-5 text-blue-400" />
                <div className="text-right">
                  <p className="font-medium">البريد الإلكتروني</p>
                  <p className="text-xs text-gray-300">support@netlifyy.com</p>
                </div>
              </Button>
              <Button
                onClick={() => {
                  setShowSupport(false);
                  window.location.href = "tel:0800123456";
                }}
                variant="outline"
                className="w-full h-14 border-purple-400/50 text-white hover:bg-purple-500/20 flex items-center gap-3 justify-start"
              >
                <Phone className="w-5 h-5 text-purple-400" />
                <div className="text-right">
                  <p className="font-medium">الهاتف</p>
                  <p className="text-xs text-gray-300">0800 123 456</p>
                </div>
              </Button>
            </div>
            <Button
              onClick={() => setShowSupport(false)}
              variant="outline"
              className="w-full h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60 text-right"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-md border border-red-400/30 text-white max-w-md mx-auto">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <LogOut className="w-6 h-6 text-red-400" />
              تسجيل الخروج
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              هل أنت متأكد من تسجيل الخروج من حسابك؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 my-4">
            <p className="text-red-200 text-sm text-center">
              سيتم إنهاء جلستك الحالية وستحتاج لتسجيل الدخول مرة أخرى
            </p>
          </div>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60 text-right">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              تسجيل الخروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <User className="w-6 h-6 text-blue-400" />
              الملف الشخصي
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              إدارة معلومات حسابك الشخصي
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger
                value="info"
                className="text-white data-[state=active]:bg-blue-500/50"
              >
                <Info className="w-4 h-4 mr-2" />
                المعلومات
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="text-white data-[state=active]:bg-blue-500/50"
              >
                <Shield className="w-4 h-4 mr-2" />
                الأمان
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="text-white data-[state=active]:bg-blue-500/50"
              >
                <FileText className="w-4 h-4 mr-2" />
                النشاط
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6 mt-6">
              {/* Profile Image Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage
                      src={
                        editMode
                          ? tempProfileData.profileImage
                          : profile?.profile_image || profileData.profileImage
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                      {(
                        profile?.full_name ||
                        profileData.fullName ||
                        user?.email ||
                        "U"
                      )
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {editMode
                      ? tempProfileData.fullName
                      : profile?.full_name ||
                        profileData.fullName ||
                        user?.user_metadata?.full_name ||
                        "المستخدم"}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {editMode
                      ? tempProfileData.email
                      : profile?.email ||
                        profileData.email ||
                        user?.email ||
                        "البريد الإلكتروني"}
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-400/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    حساب موثق
                  </Badge>
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Profile Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">
                    المعلومات الشخصية
                  </h4>
                  <Button
                    onClick={() =>
                      editMode ? handleProfileSave() : setEditMode(true)
                    }
                    variant="outline"
                    size="sm"
                    className="border-blue-400/50 text-blue-400 hover:bg-blue-500/20"
                  >
                    {editMode ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" /> حفظ
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-1" /> تعديل
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">الاسم الكامل</Label>
                    {editMode ? (
                      <Input
                        value={tempProfileData.fullName}
                        onChange={(e) =>
                          setTempProfileData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                        placeholder="أدخل الاسم الكامل"
                      />
                    ) : (
                      <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                        <span className="text-white">
                          {profile?.full_name ||
                            profileData.fullName ||
                            user?.user_metadata?.full_name ||
                            "غير محدد"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">البريد الإلكتروني</Label>
                    {editMode ? (
                      <Input
                        value={tempProfileData.email}
                        onChange={(e) =>
                          setTempProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="bg-white/10 border-white/30 text-white"
                      />
                    ) : (
                      <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                        <span className="text-white">
                          {profile?.email ||
                            profileData.email ||
                            user?.email ||
                            "غير محدد"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">رقم الهاتف</Label>
                    {editMode ? (
                      <Input
                        value={tempProfileData.phone}
                        onChange={(e) =>
                          setTempProfileData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="bg-white/10 border-white/30 text-white"
                      />
                    ) : (
                      <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                        <span className="text-white">
                          {profile?.phone ||
                            profileData.phone ||
                            user?.user_metadata?.phone ||
                            "غير محدد"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">العنوان</Label>
                    {editMode ? (
                      <Input
                        value={tempProfileData.location}
                        onChange={(e) =>
                          setTempProfileData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="bg-white/10 border-white/30 text-white"
                      />
                    ) : (
                      <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                        <span className="text-white">
                          {profile?.address ||
                            profileData.location ||
                            user?.user_metadata?.address ||
                            "غير محدد"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        رقم الحساب
                      </span>
                      <span className="text-white font-medium">
                        {profile?.id?.slice(-8) ||
                          profileData.accountNumber ||
                          user?.id?.slice(-8) ||
                          "غير محدد"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        تاريخ التسجيل
                      </span>
                      <span className="text-white font-medium">
                        {profile?.registration_date
                          ? new Date(
                              profile.registration_date,
                            ).toLocaleDateString("ar-SA")
                          : profileData.joinDate ||
                            (user?.created_at
                              ? new Date(user.created_at).toLocaleDateString(
                                  "ar-SA",
                                )
                              : "غير محدد")}
                      </span>
                    </div>
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleProfileCancel}
                      variant="outline"
                      className="flex-1 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleProfileSave}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      حفظ التغييرات
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  إعدادات الأمان
                </h4>

                <div className="space-y-4">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">
                            المصادقة الثنائية
                          </p>
                          <p className="text-gray-300 text-sm">
                            حماية إضافية لحسابك
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.twoFactorEnabled}
                        onCheckedChange={(checked) =>
                          updateSettings({ twoFactorEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-white font-medium">
                            تغيير كلمة المرور
                          </p>
                          <p className="text-gray-300 text-sm">
                            آخر تغيير: منذ 30 يوماً
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handlePasswordChange}
                        variant="outline"
                        size="sm"
                        className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-500/20"
                      >
                        تغيير
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">
                            الأجهزة المتصلة
                          </p>
                          <p className="text-gray-300 text-sm">3 أجهزة نشطة</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleManageDevices}
                        variant="outline"
                        size="sm"
                        className="border-purple-400/50 text-purple-400 hover:bg-purple-500/20"
                      >
                        إدارة
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-medium">حسابك محمي</p>
                      <p className="text-green-200 text-sm">
                        جميع إعدادات الأمان مفعلة
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  نشاط الحساب
                </h4>

                <div className="space-y-3">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        آخر تسجيل دخول
                      </span>
                      <span className="text-gray-300 text-sm">منذ 5 دقائق</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      من الجزائر العاصمة - Chrome
                    </p>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">آخر معاملة</span>
                      <span className="text-gray-300 text-sm">اليوم</span>
                    </div>
                    <p className="text-gray-300 text-sm">تحويل 5,000 دج</p>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        تغيير الملف الشخصي
                      </span>
                      <span className="text-gray-300 text-sm">منذ أسبوع</span>
                    </div>
                    <p className="text-gray-300 text-sm">تحديث رقم الهاتف</p>
                  </div>
                </div>

                <Button
                  onClick={exportData}
                  variant="outline"
                  className="w-full border-blue-400/50 text-blue-400 hover:bg-blue-500/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  تصدير بيانات الحساب
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowProfile(false)}
              className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Settings className="w-6 h-6 text-gray-400" />
              الإعدادات
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              تخصيص تجربتك وإعدادات التطبيق
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger
                value="general"
                className="text-white data-[state=active]:bg-gray-500/50"
              >
                <Settings className="w-4 h-4 mr-2" />
                عام
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="text-white data-[state=active]:bg-gray-500/50"
              >
                <Bell className="w-4 h-4 mr-2" />
                الإشعارات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  الإعدادات العامة
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Languages className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">اللغة</p>
                          <p className="text-gray-300 text-sm">
                            لغة واجهة التطبيق
                          </p>
                        </div>
                      </div>
                      <select
                        value={settings.language}
                        onChange={(e) =>
                          updateSettings({ language: e.target.value })
                        }
                        className="bg-white/10 border border-white/30 rounded px-3 py-1 text-white text-sm"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-white font-medium">
                            العملة الافتراضية
                          </p>
                          <p className="text-gray-300 text-sm">
                            عملة العرض الرئيسية
                          </p>
                        </div>
                      </div>
                      <select
                        value={settings.currency}
                        onChange={(e) =>
                          updateSettings({ currency: e.target.value })
                        }
                        className="bg-white/10 border border-white/30 rounded px-3 py-1 text-white text-sm"
                      >
                        <option value="dzd">دينار جزائري</option>
                        <option value="eur">يورو</option>
                        <option value="usd">دولار أمريكي</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">
                            المنطقة الزمنية
                          </p>
                          <p className="text-gray-300 text-sm">
                            توقيت المعاملات
                          </p>
                        </div>
                      </div>
                      <select
                        value={settings.timezone}
                        onChange={(e) =>
                          updateSettings({ timezone: e.target.value })
                        }
                        className="bg-white/10 border border-white/30 rounded px-3 py-1 text-white text-sm"
                      >
                        <option value="africa/algiers">الجزائر (GMT+1)</option>
                        <option value="europe/paris">باريس (GMT+1)</option>
                        <option value="utc">UTC (GMT+0)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">
                            تنسيق التاريخ
                          </p>
                          <p className="text-gray-300 text-sm">
                            طريقة عرض التواريخ
                          </p>
                        </div>
                      </div>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) =>
                          updateSettings({ dateFormat: e.target.value })
                        }
                        className="bg-white/10 border border-white/30 rounded px-3 py-1 text-white text-sm"
                      >
                        <option value="dd/mm/yyyy">يوم/شهر/سنة</option>
                        <option value="mm/dd/yyyy">شهر/يوم/سنة</option>
                        <option value="yyyy-mm-dd">سنة-شهر-يوم</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  إعدادات الإشعارات
                </h4>

                <div className="space-y-4">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">
                            الإشعارات العامة
                          </p>
                          <p className="text-gray-300 text-sm">
                            تلقي جميع الإشعارات
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notificationsEnabled}
                        onCheckedChange={(checked) =>
                          updateSettings({ notificationsEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {settings.soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">الأصوات</p>
                          <p className="text-gray-300 text-sm">
                            تشغيل أصوات الإشعارات
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) =>
                          updateSettings({ soundEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-white font-medium">أنواع الإشعارات</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <span className="text-gray-300 text-sm">
                          إشعارات المعاملات
                        </span>
                        <Switch
                          checked={settings.transactionNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({
                              transactionNotifications: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <span className="text-gray-300 text-sm">
                          إشعارات الأمان
                        </span>
                        <Switch
                          checked={settings.securityNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({ securityNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <span className="text-gray-300 text-sm">
                          إشعارات العروض
                        </span>
                        <Switch
                          checked={settings.promotionalNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({
                              promotionalNotifications: checked,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <span className="text-gray-300 text-sm">
                          إشعارات التحديثات
                        </span>
                        <Switch
                          checked={settings.updateNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({ updateNotifications: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowSettings(false)}
              className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60"
            >
              إغلاق
            </Button>
            <Button
              onClick={handleSettingsSave}
              className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              حفظ الإعدادات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-md border border-red-400/30 text-white max-w-md mx-auto">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              حذف الحساب
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              هل أنت متأكد من حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع
              عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 my-4">
            <p className="text-red-200 text-sm text-center">
              سيتم حذف جميع بياناتك ومعاملاتك بشكل نهائي
            </p>
          </div>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              حذف الحساب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Settings Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 via-yellow-900/95 to-slate-900/95 backdrop-blur-md border border-yellow-400/30 text-white max-w-md mx-auto">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-yellow-400" />
              إعادة تعيين الإعدادات
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              هل تريد إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetSettings}
              className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              إعادة تعيين
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Local Data Confirmation Dialog */}
      <AlertDialog
        open={showClearDataConfirm}
        onOpenChange={setShowClearDataConfirm}
      >
        <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 via-orange-900/95 to-slate-900/95 backdrop-blur-md border border-orange-400/30 text-white max-w-md mx-auto">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Trash2 className="w-6 h-6 text-orange-400" />
              مسح البيانات المحلية
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              هل تريد مسح جميع البيانات المحفوظة محلياً على هذا الجهاز؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearLocalData}
              className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              مسح البيانات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
