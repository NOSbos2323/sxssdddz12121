import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Wallet,
  TrendingUp,
  Send,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Eye,
  EyeOff,
  Bell,
  Settings,
  User,
  Star,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Activity,
  PieChart,
  Target,
  Gift,
  Calculator,
  PiggyBank,
  BarChart3,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import BottomNavBar from "./BottomNavBar";
import CardTab from "./CardTab";
import CurrencyConverter from "./CurrencyConverter";
import SavingsTab from "./SavingsTab";
import InstantTransferTab from "./InstantTransferTab";
import BillPaymentTab from "./BillPaymentTab";
import TransactionsTab from "./TransactionsTab";
import RechargeTab from "./RechargeTab";
import TopNavBar from "./TopNavBar";
import InvestmentTab from "./InvestmentTab";
import {
  createNotification,
  showBrowserNotification,
  type Notification,
} from "../utils/notifications";
import { ConversionResult } from "../utils/currency";
import { validateAmount } from "../utils/security";
import { useDatabase } from "../hooks/useDatabase";
import { useAuth } from "../hooks/useAuth";

interface HomeProps {
  onLogout?: () => void;
}

interface Investment {
  id: string;
  type: "weekly" | "monthly";
  amount: number;
  startDate: Date;
  endDate: Date;
  profitRate: number;
  status: "active" | "completed";
  profit: number;
}

function Home({ onLogout }: HomeProps) {
  const { user } = useAuth();
  const {
    balance,
    transactions,
    notifications,
    updateBalance,
    addTransaction,
    addNotification,
    loading,
    error,
  } = useDatabase(user?.id || null);

  const [activeTab, setActiveTab] = useState("home");
  const [showBalance, setShowBalance] = useState(true);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [isCardActivated] = useState(true);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [showBonusDialog, setShowBonusDialog] = useState(false);

  // Default balance if not loaded from database
  const currentBalance = balance || {
    dzd: 15000,
    eur: 75,
    usd: 85,
    gbp: 65.5,
  };

  const currentTransactions = transactions || [];
  const currentNotifications = notifications || [];

  const handleSavingsDeposit = async (amount: number, goalId: string) => {
    if (!user?.id) return;

    try {
      console.log("Starting handleSavingsDeposit:", {
        amount,
        goalId,
        currentBalance: currentBalance.dzd,
        userId: user.id,
      });

      // Check if user has sufficient balance
      if (currentBalance.dzd < amount) {
        console.error("Insufficient balance:", {
          required: amount,
          available: currentBalance.dzd,
        });
        return;
      }

      // Calculate new balance after deduction
      const newBalance = {
        ...currentBalance,
        dzd: currentBalance.dzd - amount,
      };

      console.log("Calculated new balance:", {
        oldBalance: currentBalance.dzd,
        deductedAmount: amount,
        newBalance: newBalance.dzd,
      });

      // Update balance in database first
      const balanceResult = await updateBalance(newBalance);
      if (balanceResult?.error) {
        console.error("Error updating balance:", balanceResult.error);
        return;
      }

      console.log("Balance updated successfully in database");

      // Add transaction to database
      const transactionData = {
        type: goalId === "investment" ? "investment" : "transfer",
        amount: amount,
        currency: "dzd",
        description: goalId === "investment" ? `استثمار` : `إيداع في الادخار`,
        status: "completed",
      };

      const transactionResult = await addTransaction(transactionData);
      if (transactionResult?.error) {
        console.error("Error adding transaction:", transactionResult.error);
      } else {
        console.log("Transaction added successfully");
      }
    } catch (error) {
      console.error("Error processing savings deposit:", error);
    }
  };

  const handleInvestmentReturn = async (amount: number) => {
    if (!user?.id) return;

    try {
      // Update balance in database
      const newBalance = {
        ...currentBalance,
        dzd: currentBalance.dzd + amount,
      };
      await updateBalance(newBalance);

      // Add transaction to database
      const transactionData = {
        type: "investment",
        amount: amount,
        currency: "dzd",
        description: `عائد استثمار`,
        status: "completed",
      };
      await addTransaction(transactionData);
    } catch (error) {
      console.error("Error processing investment return:", error);
    }
  };

  const handleNotification = async (notification: Notification) => {
    if (!user?.id) return;

    try {
      const notificationData = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: false,
      };
      await addNotification(notificationData);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  const handleCurrencyConversion = async (result: ConversionResult) => {
    if (!user?.id) return;

    try {
      let newBalance = { ...currentBalance };

      if (result.fromCurrency === "DZD" && result.toCurrency === "EUR") {
        newBalance = {
          ...newBalance,
          dzd: newBalance.dzd - result.fromAmount,
          eur: newBalance.eur + result.toAmount,
        };
      } else if (result.fromCurrency === "EUR" && result.toCurrency === "DZD") {
        newBalance = {
          ...newBalance,
          dzd: newBalance.dzd + result.toAmount,
          eur: newBalance.eur - result.fromAmount,
        };
      }

      await updateBalance(newBalance);

      const transactionData = {
        type: "conversion",
        amount: result.fromAmount,
        currency: result.fromCurrency.toLowerCase(),
        description: `تحويل ${result.fromCurrency} إلى ${result.toCurrency}`,
        status: "completed",
      };
      await addTransaction(transactionData);
    } catch (error) {
      console.error("Error processing currency conversion:", error);
    }
  };

  const handleAddMoney = () => {
    setShowAddMoneyDialog(true);
  };

  const confirmAddMoney = async () => {
    if (!user?.id || !addMoneyAmount || parseFloat(addMoneyAmount) <= 0) return;

    try {
      const chargeAmount = parseFloat(addMoneyAmount);

      // Update balance in database
      const newBalance = {
        ...currentBalance,
        dzd: currentBalance.dzd + chargeAmount,
      };
      await updateBalance(newBalance);

      // Add transaction to database
      const transactionData = {
        type: "recharge",
        amount: chargeAmount,
        currency: "dzd",
        description: "شحن المحفظة",
        status: "completed",
      };
      await addTransaction(transactionData);

      const notification = createNotification(
        "success",
        "تم الشحن بنجاح",
        `تم شحن ${chargeAmount.toLocaleString()} دج في محفظتك`,
      );
      await handleNotification(notification);
      showBrowserNotification(
        "تم الشحن بنجاح",
        `تم شحن ${chargeAmount.toLocaleString()} دج في محفظتك`,
      );
      setShowAddMoneyDialog(false);
      setAddMoneyAmount("");
    } catch (error) {
      console.error("Error adding money:", error);
    }
  };

  const quickActions = [
    {
      icon: Plus,
      title: "إضافة أموال",
      subtitle: "شحن سريع",
      color: "from-emerald-500 to-teal-600",
      action: () => {
        console.log("Recharge button clicked");
        setActiveTab("recharge");
      },
    },
    {
      icon: TrendingUp,
      title: "الأرباح",
      subtitle: "حقق أهدافك",
      color: "from-green-500 to-emerald-600",
      action: () => {
        console.log("Savings button clicked");
        setActiveTab("savings");
      },
    },
    {
      icon: CreditCard,
      title: "البطاقة",
      subtitle: "إدارة البطاقة",
      color: "from-purple-500 to-pink-600",
      action: () => {
        console.log("Card button clicked");
        setActiveTab("card");
      },
    },
    {
      icon: Calculator,
      title: "محول العملات",
      subtitle: "تحويل سريع",
      color: "from-indigo-500 to-purple-600",
      action: () => {
        console.log("Currency converter button clicked");
        setShowCurrencyConverter(true);
      },
    },
  ];

  const recentTransactions = [];

  const features = [
    {
      icon: Shield,
      title: "أمان عالي",
      description: "حماية متقدمة لأموالك",
    },
    {
      icon: Zap,
      title: "سرعة فائقة",
      description: "معاملات فورية",
    },
    {
      icon: Globe,
      title: "عالمي",
      description: "تحويلات دولية",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-4 sm:space-y-6 pb-20 px-2 sm:px-0">
            {/* Page Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                الصفحة الرئيسية
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                إدارة أموالك بسهولة وأمان
              </p>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-0 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
                    <span className="text-white/80 text-xs sm:text-sm">
                      الرصيد الإجمالي
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-white/80 hover:bg-white/10 p-1"
                  >
                    {showBalance ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="space-y-4">
                  {/* Primary Balance - DZD */}
                  <div className="space-y-2">
                    <div className="flex items-baseline space-x-2 space-x-reverse">
                      <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                        {showBalance
                          ? currentBalance.dzd.toLocaleString()
                          : "••••••"}
                      </span>
                      <span className="text-white/80 text-xl sm:text-2xl lg:text-3xl">
                        دج
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-white/80 text-sm">≈</span>
                      <span className="text-white/80 text-lg sm:text-xl lg:text-2xl font-medium">
                        {showBalance
                          ? currentBalance.eur.toLocaleString()
                          : "••••••"}
                      </span>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <span className="text-green-400 text-xs sm:text-sm">
                          +2.5%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Other Currencies */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/20">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-2xl sm:text-3xl font-bold text-blue-300">
                          $
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                        {showBalance
                          ? currentBalance.usd.toLocaleString()
                          : "••••••"}
                      </p>
                      <p className="text-sm sm:text-base text-white/60">USD</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-2xl sm:text-3xl font-bold text-amber-300">
                          €
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                        {showBalance
                          ? currentBalance.eur.toLocaleString()
                          : "••••••"}
                      </p>
                      <p className="text-sm sm:text-base text-white/60">EUR</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-2xl sm:text-3xl font-bold text-emerald-300">
                          £
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
                        {showBalance
                          ? currentBalance.gbp?.toFixed(2) || "0.00"
                          : "••••"}
                      </p>
                      <p className="text-sm sm:text-base text-white/60">GBP</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Card
                    key={index}
                    className={`bg-gradient-to-br ${action.color} border-0 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group relative overflow-hidden`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`Quick action clicked: ${action.title}`);
                      action.action();
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-4 sm:p-6 text-center relative z-10">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-white font-semibold text-sm mb-1">
                        {action.title}
                      </p>
                      <p className="text-white/80 text-xs">{action.subtitle}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* Recent Transactions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  المعاملات الأخيرة
                </h2>
                <Button
                  onClick={() => setActiveTab("transactions")}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                >
                  عرض الكل
                  <ChevronRight className="w-4 h-4 mr-1" />
                </Button>
              </div>
              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد معاملات حتى الآن</p>
                    <p className="text-xs mt-1">
                      ابدأ باستخدام محفظتك لرؤية المعاملات هنا
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "recharge":
        return (
          <RechargeTab
            balance={currentBalance}
            onRecharge={async (amount, method, rib) => {
              if (!user?.id) return;

              try {
                // Add transaction to database
                const transactionData = {
                  type: "recharge",
                  amount: amount,
                  currency: "dzd",
                  description: `شحن من ${method} - RIB: ${rib}`,
                  status: "pending",
                  reference: rib,
                };
                await addTransaction(transactionData);

                const notification = createNotification(
                  "success",
                  "تم استلام طلب الشحن",
                  `سيتم إضافة ${amount.toLocaleString()} دج من RIB: ${rib} خلال 5-10 دقائق`,
                );
                await handleNotification(notification);
                showBrowserNotification(
                  "تم استلام طلب الشحن",
                  `سيتم إضافة ${amount.toLocaleString()} دج خلال 5-10 دقائق`,
                );
              } catch (error) {
                console.error("Error processing recharge:", error);
              }
            }}
            onNotification={handleNotification}
          />
        );
      case "savings":
        return (
          <SavingsTab
            balance={currentBalance}
            onSavingsDeposit={handleSavingsDeposit}
            onInvestmentReturn={handleInvestmentReturn}
            onNotification={handleNotification}
            onAddTestBalance={async (amount) => {
              if (!user?.id) return;

              try {
                const newBalance = {
                  ...currentBalance,
                  dzd: currentBalance.dzd + amount,
                };
                await updateBalance(newBalance);

                const transactionData = {
                  type: "recharge",
                  amount: amount,
                  currency: "dzd",
                  description: "إضافة رصيد تجريبي",
                  status: "completed",
                };
                await addTransaction(transactionData);
              } catch (error) {
                console.error("Error adding test balance:", error);
              }
            }}
          />
        );
      case "card":
        return (
          <CardTab isActivated={isCardActivated} balance={currentBalance} />
        );
      case "instant-transfer":
        return (
          <InstantTransferTab
            balance={currentBalance}
            onTransfer={async (amount, recipient) => {
              if (!user?.id) return;

              try {
                const newBalance = {
                  ...currentBalance,
                  dzd: currentBalance.dzd - amount,
                };
                await updateBalance(newBalance);

                const transactionData = {
                  type: "instant_transfer",
                  amount: amount,
                  currency: "dzd",
                  description: `تحويل فوري إلى ${recipient}`,
                  recipient: recipient,
                  status: "completed",
                };
                await addTransaction(transactionData);
              } catch (error) {
                console.error("Error processing instant transfer:", error);
              }
            }}
          />
        );
      case "bills":
        return (
          <BillPaymentTab
            balance={currentBalance}
            onPayment={async (amount, billType, reference) => {
              if (!user?.id) return;

              try {
                const newBalance = {
                  ...currentBalance,
                  dzd: currentBalance.dzd - amount,
                };
                await updateBalance(newBalance);

                const transactionData = {
                  type: "bill",
                  amount: amount,
                  currency: "dzd",
                  description: `دفع فاتورة ${billType} - ${reference}`,
                  reference: reference,
                  status: "completed",
                };
                await addTransaction(transactionData);
              } catch (error) {
                console.error("Error processing bill payment:", error);
              }
            }}
            onNotification={handleNotification}
          />
        );
      case "investment":
        return (
          <InvestmentTab
            balance={currentBalance}
            onSavingsDeposit={handleSavingsDeposit}
            onInvestmentReturn={handleInvestmentReturn}
            onNotification={handleNotification}
          />
        );
      case "transactions":
        return <TransactionsTab transactions={currentTransactions} />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-white text-lg">قريباً...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>
      {/* Top Navigation */}
      <TopNavBar className="relative z-20" onLogout={onLogout} />
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-2 sm:p-4 lg:p-8 pt-20">
        <div className="max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl w-full">
          {renderTabContent()}
          <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
          <CurrencyConverter
            isOpen={showCurrencyConverter}
            onClose={() => setShowCurrencyConverter(false)}
            onConvert={handleCurrencyConversion}
          />

          {/* Add Money Dialog */}
          <Dialog
            open={showAddMoneyDialog}
            onOpenChange={setShowAddMoneyDialog}
          >
            <DialogContent className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-md mx-auto">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Plus className="w-6 h-6 text-green-400" />
                  شحن المحفظة
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  أدخل المبلغ الذي تريد إضافته إلى محفظتك
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="addAmount" className="text-white font-medium">
                    مبلغ الشحن (دج)
                  </Label>
                  <Input
                    id="addAmount"
                    type="number"
                    placeholder="أدخل المبلغ"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    className="text-center text-lg bg-white/10 border-white/30 text-white placeholder:text-gray-400 h-12 focus:border-green-400 focus:ring-green-400"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowAddMoneyDialog(false);
                      setAddMoneyAmount("");
                    }}
                    variant="outline"
                    className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60 text-right"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={confirmAddMoney}
                    disabled={
                      !addMoneyAmount || parseFloat(addMoneyAmount) <= 0
                    }
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    شحن المحفظة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bonus Dialog */}
          <Dialog open={showBonusDialog} onOpenChange={setShowBonusDialog}>
            <DialogContent className="bg-gradient-to-br from-slate-900/95 via-yellow-900/95 to-slate-900/95 backdrop-blur-md border border-yellow-400/30 text-white max-w-md mx-auto">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Gift className="w-6 h-6 text-yellow-400" />
                  مكافأة خاصة!
                </DialogTitle>
                <DialogDescription className="text-yellow-200">
                  احصل على 5% مكافأة من رصيدك الحالي
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 text-center">
                  <p className="text-yellow-200 text-sm mb-2">رصيدك الحالي:</p>
                  <p className="text-2xl font-bold text-white mb-2">
                    {currentBalance.dzd.toLocaleString()} دج
                  </p>
                  <p className="text-yellow-200 text-sm mb-2">ستحصل على:</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {Math.floor(currentBalance.dzd * 0.05).toLocaleString()} دج
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowBonusDialog(false)}
                    variant="outline"
                    className="flex-1 h-12 bg-gray-600/50 border-gray-500/50 text-white hover:bg-gray-500/60 text-right"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!user?.id) return;

                      try {
                        const bonusAmount = Math.floor(
                          currentBalance.dzd * 0.05,
                        );
                        const newBalance = {
                          ...currentBalance,
                          dzd: currentBalance.dzd + bonusAmount,
                        };
                        await updateBalance(newBalance);

                        const transactionData = {
                          type: "recharge",
                          amount: bonusAmount,
                          currency: "dzd",
                          description: "كافأة خاصة - 5% من الرصيد",
                          status: "completed",
                        };
                        await addTransaction(transactionData);

                        const notification = createNotification(
                          "success",
                          "تم الحصول على المكافأة!",
                          `تم إضافة ${bonusAmount.toLocaleString()} دج ككافأة`,
                        );
                        await handleNotification(notification);
                        showBrowserNotification(
                          "تم الحصول على المكافأة!",
                          `تم إضافة ${bonusAmount.toLocaleString()} دج ككافأة`,
                        );
                        setShowBonusDialog(false);
                      } catch (error) {
                        console.error("Error processing bonus:", error);
                      }
                    }}
                    className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    احصل على المكافأة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default Home;
