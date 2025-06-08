import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Search,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  User,
  DollarSign,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useAuth } from "../hooks/useAuth";
import { useDatabase } from "../hooks/useDatabase";

interface InstantTransferTabProps {
  balance: { dzd: number; eur: number; usd?: number; gbp?: number };
  onTransfer?: (amount: number, recipientEmail: string) => void;
}

function InstantTransferTab({ balance, onTransfer }: InstantTransferTabProps) {
  const { user } = useAuth();
  const { processTransfer, searchUsers } = useDatabase(user?.id || null);

  const [amount, setAmount] = useState("");
  const [recipientIdentifier, setRecipientIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [transferResult, setTransferResult] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Confirm, 3: Processing, 4: Success

  // Search for users as user types
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (recipientIdentifier.trim().length >= 2 && !selectedUser) {
        const { data } = await searchUsers(recipientIdentifier);
        setSearchResults(data || []);
        setShowSearchResults(true);
      } else if (recipientIdentifier.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        setSelectedUser(null);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [recipientIdentifier, searchUsers, selectedUser]);

  const handleNext = () => {
    if (!amount || !recipientIdentifier) {
      setErrorMessage("يرجى إدخال جميع البيانات المطلوبة");
      setShowErrorDialog(true);
      return;
    }

    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      setErrorMessage("يرجى إدخال مبلغ صحيح");
      setShowErrorDialog(true);
      return;
    }

    if (!balance || balance.dzd === undefined) {
      setErrorMessage("لا يمكن تحديد الرصيد الحالي");
      setShowErrorDialog(true);
      return;
    }

    if (transferAmount > balance.dzd) {
      setErrorMessage("الرصيد غير كافي لإجراء هذا التحويل");
      setShowErrorDialog(true);
      return;
    }

    if (transferAmount < 100) {
      setErrorMessage("الحد الأدنى للتحويل هو 100 دج");
      setShowErrorDialog(true);
      return;
    }

    if (transferAmount > 100000) {
      setErrorMessage("الحد الأقصى للتحويل هو 100,000 دج");
      setShowErrorDialog(true);
      return;
    }

    // Skip recipient validation - allow any format

    setCurrentStep(2);
  };

  const confirmTransfer = useCallback(async () => {
    if (isProcessing) return;

    setCurrentStep(3);
    setIsProcessing(true);

    try {
      const transferAmount = parseFloat(amount);

      console.log("🚀 Starting instant transfer:", {
        transferAmount,
        recipientIdentifier: recipientIdentifier.trim(),
        description,
        userId: user?.id,
        currentBalance: balance?.dzd,
        timestamp: new Date().toISOString(),
      });

      // Additional validation before processing
      if (!user?.id) {
        setErrorMessage("معرف المستخدم غير متوفر");
        setShowErrorDialog(true);
        setCurrentStep(1);
        return;
      }

      if (transferAmount > balance.dzd) {
        setErrorMessage("الرصيد غير كافي لإجراء هذا التحويل");
        setShowErrorDialog(true);
        setCurrentStep(1);
        return;
      }

      const result = await processTransfer(
        transferAmount,
        recipientIdentifier.trim(),
        description?.trim() || "تحويل فوري",
      );

      console.log("📋 Transfer processing result:", result);

      if (result?.error) {
        console.error("❌ Transfer failed:", result.error);
        const errorMsg = result.error.message || "فشل في إجراء التحويل";
        setErrorMessage(errorMsg);
        setShowErrorDialog(true);
        setCurrentStep(1);
        return;
      }

      if (!result?.data) {
        console.error("❌ No transfer data returned");
        setErrorMessage("لم يتم إرجاع بيانات التحويل");
        setShowErrorDialog(true);
        setCurrentStep(1);
        return;
      }

      // Transfer successful
      console.log("✅ Transfer completed successfully:", result.data);
      setTransferResult(result.data);
      setCurrentStep(4);
      onTransfer?.(transferAmount, recipientIdentifier.trim());

      // Reset form after 5 seconds
      setTimeout(() => {
        console.log("🔄 Resetting instant transfer form");
        setCurrentStep(1);
        setTransferResult(null);
        setAmount("");
        setRecipientIdentifier("");
        setDescription("");
        setSelectedUser(null);
        setSearchResults([]);
        setShowSearchResults(false);
      }, 5000);
    } catch (error: any) {
      console.error("💥 Transfer error:", error);
      setErrorMessage(error.message || "حدث خطأ غير متوقع أثناء التحويل");
      setShowErrorDialog(true);
      setCurrentStep(1);
    } finally {
      setIsProcessing(false);
    }
  }, [
    amount,
    recipientIdentifier,
    description,
    onTransfer,
    isProcessing,
    processTransfer,
    user?.id,
    balance?.dzd,
  ]);

  const resetForm = () => {
    setCurrentStep(1);
    setAmount("");
    setRecipientIdentifier("");
    setDescription("");
    setSelectedUser(null);
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Step 4: Success Page
  if (currentStep === 4 && transferResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md shadow-2xl border border-green-400/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              تم التحويل بنجاح!
            </h2>
            <p className="text-green-200 mb-6 text-lg">
              تم إرسال {amount} دج بنجاح
            </p>

            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-200">المبلغ:</span>
                <span className="text-white font-bold text-lg">
                  {parseFloat(amount).toLocaleString()} دج
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-200">إلى:</span>
                <span className="text-white font-medium text-sm">
                  {selectedUser?.full_name || recipientIdentifier}
                </span>
              </div>
              {transferResult.reference && (
                <div className="border-t border-green-400/30 pt-3">
                  <p className="text-green-200 text-sm mb-1">رقم المرجع:</p>
                  <p className="text-white font-mono text-base bg-green-500/10 rounded-lg p-2">
                    {transferResult.reference}
                  </p>
                </div>
              )}
              {transferResult.processingTime && (
                <div className="border-t border-green-400/30 pt-3">
                  <p className="text-green-200 text-sm mb-1">وقت المعالجة:</p>
                  <p className="text-white text-sm">
                    {transferResult.processingTime} مللي ثانية
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-6 space-x-reverse text-sm text-green-200 mb-6">
              <div className="flex items-center">
                <Shield className="w-4 h-4 ml-1" />
                <span>آمن ومشفر</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 ml-1" />
                <span>معالجة فورية</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 ml-1" />
                <span>أقل من ثانية</span>
              </div>
            </div>

            <Button
              onClick={resetForm}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
            >
              إجراء تحويل جديد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Processing
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-md shadow-2xl border border-blue-400/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              جاري معالجة التحويل...
            </h2>
            <p className="text-blue-200 mb-6">
              يرجى الانتظار، سيتم إتمام العملية خلال ثوانٍ
            </p>
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-blue-200">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 ml-1" />
                  <span>تشفير البيانات</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 ml-1" />
                  <span>التحقق من الرصيد</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Confirmation
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-md shadow-2xl border border-purple-400/30 max-w-md w-full">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-white text-2xl flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              تأكيد التحويل الفوري
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-purple-200 flex items-center">
                  <DollarSign className="w-4 h-4 ml-2" />
                  المبلغ:
                </span>
                <span className="text-white font-bold text-xl">
                  {parseFloat(amount || "0").toLocaleString()} دج
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200 flex items-center">
                  <User className="w-4 h-4 ml-2" />
                  إلى:
                </span>
                <div className="text-left">
                  <div className="text-white font-medium text-sm">
                    {selectedUser?.full_name || "مستخدم"}
                  </div>
                  <div className="text-purple-300 text-xs">
                    {recipientIdentifier}
                  </div>
                </div>
              </div>
              {description && (
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">الوصف:</span>
                  <span className="text-white text-sm">{description}</span>
                </div>
              )}
              <div className="border-t border-purple-400/30 pt-4 flex justify-between items-center">
                <span className="text-purple-200">الرصيد بعد التحويل:</span>
                <span className="text-green-400 font-bold text-lg">
                  {(balance.dzd - parseFloat(amount || "0")).toLocaleString()}{" "}
                  دج
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="flex-1 h-12 border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
              >
                تراجع
              </Button>
              <Button
                onClick={confirmTransfer}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold"
              >
                تأكيد الإرسال
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">تحويل فوري</h1>
          <p className="text-gray-300">أرسل الأموال بسرعة البرق</p>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-md shadow-2xl border border-blue-400/30 text-white">
          <CardContent className="p-6 text-center">
            <p className="text-blue-200 text-sm mb-2">الرصيد المتاح</p>
            <p className="text-3xl font-bold text-white mb-3">
              {balance.dzd.toLocaleString()} دج
            </p>
            <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-gray-300">
              <span>€{balance.eur}</span>
              <span>•</span>
              <span>${balance.usd || 0}</span>
              <span>•</span>
              <span>£{balance.gbp?.toFixed(2) || "0.00"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md shadow-2xl border border-green-400/30 text-white">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center justify-center">
              <Send className="w-6 h-6 ml-3" />
              بيانات التحويل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipient */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium mb-2 flex items-center">
                <Search className="w-4 h-4 ml-2 text-green-400" />
                البريد الإلكتروني أو رقم الحساب
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="example@email.com أو ACC123456789"
                  value={recipientIdentifier}
                  onChange={(e) => {
                    setRecipientIdentifier(e.target.value);
                    if (selectedUser && e.target.value !== selectedUser.email) {
                      setSelectedUser(null);
                    }
                  }}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400 h-12 pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                {/* Search Results */}
                {showSearchResults &&
                  searchResults.length > 0 &&
                  !selectedUser && (
                    <div className="absolute top-full left-0 right-0 bg-slate-800/95 backdrop-blur-md border border-green-400/30 rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
                      {searchResults.map((user, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-green-500/20 cursor-pointer border-b border-gray-600/30 last:border-b-0"
                          onClick={() => {
                            setRecipientIdentifier(user.email);
                            setSelectedUser(user);
                            setShowSearchResults(false);
                          }}
                        >
                          <div className="text-white font-medium">
                            {user.full_name}
                          </div>
                          <div className="text-green-400 text-sm">
                            {user.email}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {user.account_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Selected User */}
                {selectedUser && (
                  <div className="absolute top-full left-0 right-0 bg-green-500/20 backdrop-blur-md border border-green-400/50 rounded-lg mt-1 z-50">
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">
                          {selectedUser.full_name}
                        </div>
                        <div className="text-green-400 text-sm">
                          {selectedUser.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setRecipientIdentifier("");
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium mb-2">
                المبلغ (دج)
              </label>
              <Input
                type="number"
                placeholder="أدخل المبلغ"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive numbers
                  if (
                    value === "" ||
                    (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)
                  ) {
                    setAmount(value);
                  }
                }}
                min="100"
                max="100000"
                step="1"
                className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400 h-14 text-center text-xl font-bold"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>الحد الأدنى: 100 دج</span>
                <span>الحد الأقصى: 100,000 دج</span>
              </div>
              {amount && parseFloat(amount) > 0 && (
                <div className="text-center text-sm text-green-400">
                  الرصيد بعد التحويل:{" "}
                  {(balance.dzd - parseFloat(amount)).toLocaleString()} دج
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-medium mb-2">
                وصف التحويل (اختياري)
              </label>
              <Input
                type="text"
                placeholder="تحويل فوري"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400 h-12"
              />
            </div>

            <Button
              onClick={handleNext}
              disabled={
                !amount ||
                !recipientIdentifier ||
                parseFloat(amount || "0") <= 0 ||
                parseFloat(amount || "0") < 100 ||
                parseFloat(amount || "0") > 100000 ||
                parseFloat(amount || "0") > balance.dzd
              }
              className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 ml-3" />
              التالي
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 via-red-900/95 to-slate-900/95 backdrop-blur-md border border-red-400/30 text-white max-w-md mx-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              خطأ في التحويل
            </DialogTitle>
          </DialogHeader>
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 my-4">
            <p className="text-red-200 text-center">{errorMessage}</p>
          </div>
          <Button
            onClick={() => setShowErrorDialog(false)}
            className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            حسناً
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstantTransferTab;
