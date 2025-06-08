import { useState, useEffect } from "react";
import {
  getUserProfile,
  updateUserProfile,
  getUserBalance,
  updateUserBalance,
  createTransaction,
  getUserTransactions,
  createInvestment,
  getUserInvestments,
  updateInvestment,
  createSavingsGoal,
  getUserSavingsGoals,
  updateSavingsGoal,
  getUserCards,
  updateCard,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  createReferral,
  getUserReferrals,
  updateInvestmentBalance,
  getInvestmentBalance,
  supabase,
} from "../lib/supabase";
import { generateSecureCardNumber } from "../utils/security";

export const useDatabase = (userId: string | null) => {
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [investmentBalance, setInvestmentBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user cards if they don't exist
  const initializeUserCards = async (userId: string) => {
    try {
      const { data: existingCards } = await getUserCards(userId);

      if (!existingCards || existingCards.length === 0) {
        // Create default cards for the user
        const solidCardNumber = generateSecureCardNumber();
        const virtualCardNumber = generateSecureCardNumber();

        await Promise.all([
          supabase.from("cards").insert({
            user_id: userId,
            card_number: solidCardNumber,
            card_type: "solid",
            is_frozen: false,
            spending_limit: 100000,
          }),
          supabase.from("cards").insert({
            user_id: userId,
            card_number: virtualCardNumber,
            card_type: "virtual",
            is_frozen: false,
            spending_limit: 50000,
          }),
        ]);
      }
    } catch (error) {
      console.error("Error initializing user cards:", error);
    }
  };

  // Initialize user balance if it doesn't exist
  const initializeUserBalance = async (userId: string) => {
    try {
      const { data: existingBalance } = await getUserBalance(userId);

      if (!existingBalance) {
        await supabase.from("balances").insert({
          user_id: userId,
          dzd: 15000,
          eur: 75,
          usd: 85,
          gbp: 65.5,
        });
      }
    } catch (error) {
      console.error("Error initializing user balance:", error);
    }
  };

  // Load user data
  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Initialize user data if needed
      await Promise.all([
        initializeUserBalance(userId),
        initializeUserCards(userId),
      ]);

      // Load all user data in parallel
      const [
        profileRes,
        balanceRes,
        transactionsRes,
        investmentsRes,
        goalsRes,
        cardsRes,
        notificationsRes,
        referralsRes,
        investmentBalanceRes,
      ] = await Promise.all([
        getUserProfile(userId),
        getUserBalance(userId),
        getUserTransactions(userId),
        getUserInvestments(userId),
        getUserSavingsGoals(userId),
        getUserCards(userId),
        getUserNotifications(userId),
        getUserReferrals(userId),
        getInvestmentBalance(userId),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (balanceRes.data) setBalance(balanceRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (investmentsRes.data) setInvestments(investmentsRes.data);
      if (goalsRes.data) setSavingsGoals(goalsRes.data);
      if (cardsRes.data) setCards(cardsRes.data);
      if (notificationsRes.data) setNotifications(notificationsRes.data);
      if (referralsRes.data) setReferrals(referralsRes.data);
      if (investmentBalanceRes.data)
        setInvestmentBalance(investmentBalanceRes.data.investment_balance || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userId]);

  // Profile operations
  const updateProfile = async (updates: any) => {
    if (!userId) return;

    const { data, error } = await updateUserProfile(userId, updates);
    if (error) {
      setError(error.message);
      return { error };
    }

    setProfile(data);
    return { data };
  };

  // Balance operations
  const updateBalance = async (balances: any) => {
    if (!userId) return;

    console.log("updateBalance called with:", {
      userId,
      balances,
      currentBalance: balance,
    });

    // Only pass the fields that are explicitly being updated
    // This allows the database function to preserve other fields
    const updatedBalances: any = {};

    if (balances.dzd !== undefined) updatedBalances.dzd = balances.dzd;
    if (balances.eur !== undefined) updatedBalances.eur = balances.eur;
    if (balances.usd !== undefined) updatedBalances.usd = balances.usd;
    if (balances.gbp !== undefined) updatedBalances.gbp = balances.gbp;
    if (balances.investment_balance !== undefined) {
      updatedBalances.investment_balance = balances.investment_balance;
    }

    const { data, error } = await updateUserBalance(userId, updatedBalances);
    if (error) {
      console.error("Database update error:", error);
      setError(error.message);
      return { error };
    }

    console.log("Database update successful, new data:", data);
    if (data) {
      setBalance(data);
      // Update investment balance state if it was updated
      if (data.investment_balance !== undefined) {
        setInvestmentBalance(data.investment_balance);
      }
    }
    return { data };
  };

  // Transaction operations
  const addTransaction = async (transaction: any) => {
    if (!userId) return;

    // التحقق من صحة البيانات قبل الإرسال
    const { validateTransactionData } = await import("../utils/validation");
    const validation = validateTransactionData(transaction);

    if (!validation.isValid) {
      const errorMessage = validation.errors.join(", ");
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }

    const { data, error } = await createTransaction({
      ...transaction,
      user_id: userId,
    });
    if (error) {
      setError(error.message);
      return { error };
    }

    setTransactions((prev) => [data, ...prev]);
    return { data };
  };

  // Investment operations
  const addInvestment = async (investment: any) => {
    if (!userId) return;

    // التحقق من صحة البيانات قبل الإرسال
    const { validateInvestmentData } = await import("../utils/validation");
    const validation = validateInvestmentData(investment);

    if (!validation.isValid) {
      const errorMessage = validation.errors.join(", ");
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }

    const { data, error } = await createInvestment({
      ...investment,
      user_id: userId,
    });
    if (error) {
      setError(error.message);
      return { error };
    }

    setInvestments((prev) => [data, ...prev]);
    return { data };
  };

  const updateInvestmentStatus = async (investmentId: string, updates: any) => {
    const { data, error } = await updateInvestment(investmentId, updates);
    if (error) {
      setError(error.message);
      return { error };
    }

    setInvestments((prev) =>
      prev.map((inv) => (inv.id === investmentId ? data : inv)),
    );
    return { data };
  };

  // Savings goals operations
  const addSavingsGoal = async (goal: any) => {
    if (!userId) return;

    const { data, error } = await createSavingsGoal({
      ...goal,
      user_id: userId,
    });
    if (error) {
      setError(error.message);
      return { error };
    }

    setSavingsGoals((prev) => [data, ...prev]);
    return { data };
  };

  const updateGoal = async (goalId: string, updates: any) => {
    const { data, error } = await updateSavingsGoal(goalId, updates);
    if (error) {
      setError(error.message);
      return { error };
    }

    setSavingsGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? data : goal)),
    );
    return { data };
  };

  // Card operations
  const updateCardStatus = async (cardId: string, updates: any) => {
    const { data, error } = await updateCard(cardId, updates);
    if (error) {
      setError(error.message);
      return { error };
    }

    setCards((prev) => prev.map((card) => (card.id === cardId ? data : card)));
    return { data };
  };

  // Notification operations
  const addNotification = async (notification: any) => {
    if (!userId) return;

    const { data, error } = await createNotification({
      ...notification,
      user_id: userId,
    });
    if (error) {
      setError(error.message);
      return { error };
    }

    setNotifications((prev) => [data, ...prev]);
    return { data };
  };

  const markAsRead = async (notificationId: string) => {
    const { data, error } = await markNotificationAsRead(notificationId);
    if (error) {
      setError(error.message);
      return { error };
    }

    setNotifications((prev) =>
      prev.map((notif) => (notif.id === notificationId ? data : notif)),
    );
    return { data };
  };

  // Referral operations
  const addReferral = async (referral: any) => {
    if (!userId) return;

    const { data, error } = await createReferral({
      ...referral,
      referrer_id: userId,
    });
    if (error) {
      setError(error.message);
      return { error };
    }

    setReferrals((prev) => [data, ...prev]);
    return { data };
  };

  // Investment balance operations
  const updateUserInvestmentBalance = async (
    amount: number,
    operation: "add" | "subtract",
  ) => {
    if (!userId) {
      console.error("No user ID provided for investment balance update");
      return { error: { message: "معرف المستخدم غير متوفر" } };
    }

    console.log(
      `🔄 Updating investment balance: ${operation} ${amount} for user ${userId}`,
    );

    try {
      const { data, error } = await updateInvestmentBalance(
        userId,
        amount,
        operation,
      );

      if (error) {
        console.error("Investment balance update error:", error);
        setError(error.message);
        return { error };
      }

      if (data) {
        console.log("Investment balance updated successfully:", data);
        setInvestmentBalance(data.investment_balance || 0);
        // Also update the main balance state to reflect the change
        setBalance((prev) => ({
          ...prev,
          ...data,
        }));
      }

      return { data };
    } catch (err: any) {
      console.error("Unexpected error in updateUserInvestmentBalance:", err);
      const errorMessage =
        err.message || "خطأ غير متوقع في تحديث رصيد الاستثمار";
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Transfer operations - Simplified system
  const processTransfer = async (
    amount: number,
    recipientIdentifier: string,
    description?: string,
  ) => {
    if (!profile?.email) {
      console.error("❌ No user email available for transfer");
      return { error: { message: "البريد الإلكتروني غير متوفر" } };
    }

    try {
      console.log(
        `🔄 Processing simple transfer: ${amount} DZD to ${recipientIdentifier}`,
        {
          senderEmail: profile.email,
          amount,
          recipientIdentifier: recipientIdentifier.trim(),
          description,
          timestamp: new Date().toISOString(),
        },
      );

      // Validate inputs
      if (!amount || amount <= 0) {
        return { error: { message: "مبلغ التحويل يجب أن يكون أكبر من صفر" } };
      }

      if (!recipientIdentifier || recipientIdentifier.trim().length === 0) {
        return { error: { message: "معرف المستلم مطلوب" } };
      }

      if (amount < 100) {
        return { error: { message: "الحد الأدنى للتحويل هو 100 دج" } };
      }

      // Use the simplified transfer function
      const { data, error } = await supabase.rpc("process_simple_transfer", {
        p_sender_email: profile.email,
        p_recipient_identifier: recipientIdentifier.trim(),
        p_amount: parseFloat(amount.toString()),
        p_description: description || "تحويل فوري",
      });

      console.log("🔍 Database response:", { data, error });

      if (error) {
        console.error("❌ Transfer RPC error:", error);
        return {
          error: {
            message: error.message || "فشل في إجراء التحويل",
          },
        };
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("❌ No data returned from database function");
        return { error: { message: "لم يتم إرجاع نتيجة من قاعدة البيانات" } };
      }

      const result = data[0];
      console.log("📊 Transfer result:", result);

      if (!result || result.success === false) {
        console.error("❌ Transfer failed:", result);
        return {
          error: {
            message: result?.message || "فشل في معالجة التحويل",
          },
        };
      }

      console.log("✅ Transfer successful:", {
        reference: result.reference_number,
        newBalance: result.sender_new_balance,
      });

      // Update local balance state immediately
      if (
        result.sender_new_balance !== undefined &&
        result.sender_new_balance !== null
      ) {
        const newBalance = parseFloat(result.sender_new_balance.toString());
        console.log("💰 Updating local balance to:", newBalance);
        setBalance((prev) => ({
          ...prev,
          dzd: newBalance,
        }));
      }

      // Reload user data to show the new transfer in transactions
      setTimeout(() => {
        console.log("🔄 Reloading user data after transfer");
        loadUserData();
      }, 1000);

      return {
        data: {
          success: true,
          message: result.message || "تم التحويل بنجاح",
          reference: result.reference_number,
          newBalance: result.sender_new_balance,
        },
        error: null,
      };
    } catch (error: any) {
      console.error("💥 Unexpected error in processTransfer:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return {
        error: {
          message: error.message || "حدث خطأ غير متوقع أثناء التحويل",
        },
      };
    }
  };

  // Get transfer history - simplified
  const getInstantTransferHistory = async (limit: number = 50) => {
    if (!profile?.email)
      return { data: null, error: { message: "البريد الإلكتروني غير متوفر" } };

    try {
      const { data, error } = await supabase.rpc(
        "get_transfer_history_simple",
        {
          p_user_email: profile.email,
        },
      );

      if (error) {
        console.error("Error fetching transfer history:", error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      console.error("Unexpected error in getInstantTransferHistory:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  // Get transfer history (legacy)
  const getTransferHistory = async () => {
    if (!userId)
      return { data: null, error: { message: "معرف المستخدم غير متوفر" } };

    try {
      const { data, error } = await supabase
        .from("transfer_requests")
        .select(
          `
          *,
          recipient:users!transfer_requests_recipient_id_fkey(full_name, email)
        `,
        )
        .eq("sender_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transfer history:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("Unexpected error in getTransferHistory:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  // Get instant transfer stats and limits
  const getInstantTransferStats = async () => {
    if (!userId)
      return { data: null, error: { message: "معرف المستخدم غير متوفر" } };

    try {
      const { data, error } = await supabase.rpc("get_instant_transfer_stats", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching instant transfer stats:", error);
        return { data: null, error };
      }

      return { data: data?.[0] || null, error: null };
    } catch (err: any) {
      console.error("Unexpected error in getInstantTransferStats:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  // Check instant transfer limits
  const checkInstantTransferLimits = async (amount: number) => {
    if (!userId)
      return { data: null, error: { message: "معرف المستخدم غير متوفر" } };

    try {
      const { data, error } = await supabase.rpc(
        "check_instant_transfer_limits",
        {
          p_user_id: userId,
          p_amount: amount,
        },
      );

      if (error) {
        console.error("Error checking instant transfer limits:", error);
        return { data: null, error };
      }

      return { data: data?.[0] || null, error: null };
    } catch (err: any) {
      console.error("Unexpected error in checkInstantTransferLimits:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  // Get transfer limits (legacy)
  const getTransferLimits = async () => {
    if (!userId)
      return { data: null, error: { message: "معرف المستخدم غير متوفر" } };

    try {
      const { data, error } = await supabase
        .from("transfer_limits")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        console.error("Error fetching transfer limits:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("Unexpected error in getTransferLimits:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  // Search for users in simplified system
  const searchUsers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase.rpc("find_user_simple", {
        p_identifier: query.trim(),
      });

      if (error) {
        console.error("Error searching users:", error);
        return { data: [], error };
      }

      // Transform data to match expected format
      const transformedData = (data || []).map((user: any) => ({
        email: user.user_email,
        full_name: user.user_name,
        account_number: user.account_number,
        balance: user.balance,
      }));

      return { data: transformedData, error: null };
    } catch (err: any) {
      console.error("Unexpected error in searchUsers:", err);
      return { data: [], error: { message: err.message } };
    }
  };

  // Get user balance by identifier
  const getUserBalanceSimple = async (identifier: string) => {
    try {
      const { data, error } = await supabase.rpc("get_user_balance_simple", {
        p_identifier: identifier,
      });

      if (error) {
        console.error("Error getting user balance:", error);
        return { data: null, error };
      }

      return { data: data?.[0] || null, error: null };
    } catch (err: any) {
      console.error("Unexpected error in getUserBalanceSimple:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  // Update user balance
  const updateUserBalanceSimple = async (
    identifier: string,
    newBalance: number,
  ) => {
    try {
      const { data, error } = await supabase.rpc("update_user_balance_simple", {
        p_identifier: identifier,
        p_new_balance: newBalance,
      });

      if (error) {
        console.error("Error updating user balance:", error);
        return { data: null, error };
      }

      return { data: data?.[0] || null, error: null };
    } catch (err: any) {
      console.error("Unexpected error in updateUserBalanceSimple:", err);
      return { data: null, error: { message: err.message } };
    }
  };

  return {
    // Data
    profile,
    balance,
    transactions,
    investments,
    savingsGoals,
    cards,
    notifications,
    referrals,
    investmentBalance,
    loading,
    error,

    // Operations
    loadUserData,
    updateProfile,
    updateBalance,
    addTransaction,
    addInvestment,
    updateInvestmentStatus,
    addSavingsGoal,
    updateGoal,
    updateCardStatus,
    addNotification,
    markAsRead,
    addReferral,
    updateUserInvestmentBalance,
    processTransfer,
    getTransferHistory,
    getTransferLimits,
    getInstantTransferHistory,
    getInstantTransferStats,
    checkInstantTransferLimits,
    searchUsers,
    getUserBalanceSimple,
    updateUserBalanceSimple,
  };
};
