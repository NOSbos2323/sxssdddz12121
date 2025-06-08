import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// Use environment variables for Supabase configuration
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) are set.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (
  email: string,
  password: string,
  userData: any,
) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        data: null,
        error: { message: "البريد الإلكتروني وكلمة المرور مطلوبان" },
      };
    }

    if (password.length < 6) {
      return {
        data: null,
        error: { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
      };
    }

    // Referral code will be processed automatically by the database trigger
    // No need for upfront validation - let the user sign up immediately

    // إنشاء حساب جديد مع إرسال كود الإحالة إلى قاعدة البيانات
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: userData.full_name || userData.fullName,
          phone: userData.phone,
          username: userData.username,
          address: userData.address,
          used_referral_code: userData.referralCode
            ? userData.referralCode.trim().toUpperCase()
            : null, // كود الإحالة سيتم معالجته تلقائياً في قاعدة البيانات
        },
      },
    });

    if (error) {
      console.error("Supabase signup error:", error);
      let errorMessage = "حدث خطأ غير متوقع";
      if (error.message.includes("Signup is disabled")) {
        errorMessage = "نظام تسجيل الدخول معطل مؤقتاً. يرجى المحاولة لاحقاً.";
      } else if (error.message.includes("disabled")) {
        errorMessage = "الخدمة معطلة مؤقتاً. يرجى المحاولة لاحقاً.";
      }
      return { data: null, error: { message: errorMessage } };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("Signup catch error:", err);
    return {
      data: null,
      error: { message: err.message || "حدث خطأ غير متوقع" },
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        data: null,
        error: { message: "البريد الإلكتروني وكلمة المرور مطلوبان" },
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        data: null,
        error: { message: "تنسيق البريد الإلكتروني غير صحيح" },
      };
    }

    // Validate password length
    if (password.length < 6) {
      return {
        data: null,
        error: { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
      };
    }

    // Log connection attempt with more details
    console.log("🔐 محاولة تسجيل الدخول:", {
      url: supabaseUrl,
      email: email.trim(),
      hasKey: !!supabaseAnonKey,
      keyLength: supabaseAnonKey?.length || 0,
      timestamp: new Date().toISOString(),
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("❌ خطأ Supabase في تسجيل الدخول:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        name: error.name,
        details: error,
      });

      let errorMessage = "حدث خطأ غير متوقع";

      // More specific and accurate error handling
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Invalid credentials") ||
        error.message.includes("invalid_credentials")
      ) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage =
          "يرجى تأكيد البريد الإلكتروني من خلال الرسالة المرسلة إليك";
      } else if (error.message.includes("Too many requests")) {
        errorMessage =
          "محاولات كثيرة جداً. يرجى الانتظار 5 دقائق قبل المحاولة مرة أخرى";
      } else if (error.message.includes("User not found")) {
        errorMessage =
          "لا يوجد حساب مسجل بهذا البريد الإلكتروني. يرجى التسجيل أولاً";
      } else if (
        error.message.includes("Signup is disabled") ||
        error.message.includes("disabled")
      ) {
        errorMessage =
          "الخدمة معطلة مؤقتاً. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني";
      } else if (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "مشكلة في الاتصال بالإنترنت. تأكد من اتصالك وحاول مرة أخرى";
      } else if (error.message.includes("timeout")) {
        errorMessage = "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى";
      } else if (error.status === 400) {
        errorMessage =
          "بيانات غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور";
      } else if (error.status === 401) {
        errorMessage = "بيانات الدخول غير صحيحة";
      } else if (error.status === 422) {
        errorMessage = "البريد الإلكتروني غير صحيح أو كلمة المرور ضعيفة";
      } else if (error.status === 429) {
        errorMessage =
          "محاولات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى";
      } else if (error.status >= 500) {
        errorMessage = "خطأ في الخادم. يرجى المحاولة لاحقاً";
      }

      return { data: null, error: { ...error, message: errorMessage } };
    }

    if (data?.user) {
      console.log("✅ نجح تسجيل الدخول في Supabase:", {
        userId: data.user.id,
        email: data.user.email,
        confirmed: data.user.email_confirmed_at ? "نعم" : "لا",
        hasSession: !!data.session,
        sessionExpiry: data.session?.expires_at,
      });
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("💥 خطأ غير متوقع في Supabase signin:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
      cause: err.cause,
    });

    let errorMessage = "حدث خطأ غير متوقع في الاتصال";

    if (
      err.message?.includes("fetch") ||
      err.message?.includes("Failed to fetch")
    ) {
      errorMessage =
        "مشكلة في الاتصال بالخادم. تأكد من اتصال الإنترنت وحاول مرة أخرى";
    } else if (err.message?.includes("timeout")) {
      errorMessage = "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى";
    } else if (err.name === "TypeError") {
      errorMessage = "خطأ في إعدادات الاتصال. يرجى إعادة تحميل الصفحة";
    } else if (err.message?.includes("CORS")) {
      errorMessage = "مشكلة في إعدادات الأمان. يرجى المحاولة لاحقاً";
    }

    return {
      data: null,
      error: { message: errorMessage, originalError: err.message },
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signout error:", error);
      return { error };
    }

    return { error: null };
  } catch (err: any) {
    console.error("Signout catch error:", err);
    return {
      error: { message: err.message || "حدث خطأ في تسجيل الخروج" },
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Get user error:", error);
      return { user: null, error };
    }

    return { user, error: null };
  } catch (err: any) {
    console.error("Get user catch error:", err);
    return {
      user: null,
      error: { message: err.message || "حدث خطأ في جلب بيانات المستخدم" },
    };
  }
};

// Database helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
};

export const getUserBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from("balances")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
};

export const updateUserBalance = async (userId: string, balances: any) => {
  try {
    // التحقق من صحة مبالغ الأرصدة
    const validatedBalances = {
      dzd:
        balances.dzd !== undefined
          ? Math.max(0, parseFloat(balances.dzd) || 0)
          : undefined,
      eur:
        balances.eur !== undefined
          ? Math.max(0, parseFloat(balances.eur) || 0)
          : undefined,
      usd:
        balances.usd !== undefined
          ? Math.max(0, parseFloat(balances.usd) || 0)
          : undefined,
      gbp:
        balances.gbp !== undefined
          ? Math.max(0, parseFloat(balances.gbp) || 0)
          : undefined,
      investment_balance:
        balances.investment_balance !== undefined
          ? Math.max(0, parseFloat(balances.investment_balance) || 0)
          : undefined,
    };

    // استخدام الدالة المخصصة لتحديث الأرصدة
    const { data, error } = await supabase.rpc("update_user_balance", {
      p_user_id: userId,
      p_dzd: validatedBalances.dzd,
      p_eur: validatedBalances.eur,
      p_usd: validatedBalances.usd,
      p_gbp: validatedBalances.gbp,
      p_investment_balance: validatedBalances.investment_balance,
    });

    if (error) {
      console.error("Error calling update_user_balance function:", error);
      return { data: null, error };
    }

    // إرجاع أول سجل من النتائج
    return { data: data?.[0] || null, error: null };
  } catch (err: any) {
    console.error("Error in updateUserBalance:", err);
    return {
      data: null,
      error: { message: err.message || "خطأ في تحديث الرصيد" },
    };
  }
};

// Get investment balance for a user
export const getInvestmentBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from("balances")
    .select("investment_balance")
    .eq("user_id", userId)
    .single();
  return { data, error };
};

// Update investment balance using database function
export const updateInvestmentBalance = async (
  userId: string,
  amount: number,
  operation: "add" | "subtract",
) => {
  try {
    // استخدام دالة قاعدة البيانات لمعالجة الاستثمار
    const dbOperation = operation === "add" ? "invest" : "return";

    const { data, error } = await supabase.rpc("process_investment", {
      p_user_id: userId,
      p_amount: amount,
      p_operation: dbOperation,
    });

    if (error) {
      console.error("Error calling process_investment function:", error);
      return { data: null, error };
    }

    const result = data?.[0];
    if (!result?.success) {
      return {
        data: null,
        error: { message: result?.message || "فشل في معالجة الاستثمار" },
      };
    }

    // إرجاع البيانات المحدثة بتنسيق متوافق
    const updatedBalance = {
      user_id: userId,
      dzd: result.new_dzd_balance,
      investment_balance: result.new_investment_balance,
      updated_at: new Date().toISOString(),
    };

    return { data: updatedBalance, error: null };
  } catch (error: any) {
    console.error("Error in updateInvestmentBalance:", error);
    return {
      data: null,
      error: { message: error.message || "خطأ في تحديث رصيد الاستثمار" },
    };
  }
};

export const createTransaction = async (transaction: any) => {
  // التحقق من صحة بيانات المعاملة
  const validatedTransaction = {
    ...transaction,
    amount: Math.abs(parseFloat(transaction.amount) || 0),
    currency: (transaction.currency || "dzd").toLowerCase(),
    type: transaction.type || "transfer",
    status: transaction.status || "completed",
    description: transaction.description || "معاملة",
  };

  // التحقق من أن المبلغ أكبر من صفر
  if (validatedTransaction.amount <= 0) {
    return {
      data: null,
      error: { message: "مبلغ المعاملة يجب أن يكون أكبر من صفر" },
    };
  }

  // التحقق من صحة نوع العملة
  const validCurrencies = ["dzd", "eur", "usd", "gbp"];
  if (!validCurrencies.includes(validatedTransaction.currency)) {
    return { data: null, error: { message: "نوع العملة غير صحيح" } };
  }

  // التحقق من صحة نوع المعاملة
  const validTypes = [
    "recharge",
    "transfer",
    "bill",
    "investment",
    "conversion",
    "withdrawal",
  ];
  if (!validTypes.includes(validatedTransaction.type)) {
    return { data: null, error: { message: "نوع المعاملة غير صحيح" } };
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert(validatedTransaction)
    .select()
    .single();
  return { data, error };
};

export const getUserTransactions = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data, error };
};

export const createInvestment = async (investment: any) => {
  // التحقق من صحة بيانات الاستثمار
  const validatedInvestment = {
    ...investment,
    amount: Math.abs(parseFloat(investment.amount) || 0),
    profit_rate: Math.max(
      0,
      Math.min(100, parseFloat(investment.profit_rate) || 0),
    ),
    profit: 0, // يبدأ الربح من صفر
    status: investment.status || "active",
    type: investment.type || "monthly",
  };

  // التحقق من أن المبلغ أكبر من صفر
  if (validatedInvestment.amount <= 0) {
    return {
      data: null,
      error: { message: "مبلغ الاستثمار يجب أن يكون أكبر من صفر" },
    };
  }

  // التحقق من صحة نوع الاستثمار
  const validTypes = ["weekly", "monthly", "quarterly", "yearly"];
  if (!validTypes.includes(validatedInvestment.type)) {
    return { data: null, error: { message: "نوع الاستثمار غير صحيح" } };
  }

  // التحقق من صحة التواريخ
  const startDate = new Date(validatedInvestment.start_date);
  const endDate = new Date(validatedInvestment.end_date);
  if (endDate <= startDate) {
    return {
      data: null,
      error: {
        message: "تاريخ انتهاء الاستثمار يجب أن يكون بعد تاريخ البداية",
      },
    };
  }

  const { data, error } = await supabase
    .from("investments")
    .insert(validatedInvestment)
    .select()
    .single();
  return { data, error };
};

export const getUserInvestments = async (userId: string) => {
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const updateInvestment = async (investmentId: string, updates: any) => {
  const { data, error } = await supabase
    .from("investments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", investmentId)
    .select()
    .single();
  return { data, error };
};

export const createSavingsGoal = async (goal: any) => {
  // التحقق من صحة بيانات هدف الادخار
  const validatedGoal = {
    ...goal,
    target_amount: Math.abs(parseFloat(goal.target_amount) || 0),
    current_amount: Math.max(0, parseFloat(goal.current_amount) || 0),
    status: goal.status || "active",
    name: goal.name || "هدف ادخار",
    category: goal.category || "عام",
    icon: goal.icon || "target",
    color: goal.color || "#3B82F6",
  };

  // التحقق من أن المبلغ المستهدف أكبر من صفر
  if (validatedGoal.target_amount <= 0) {
    return {
      data: null,
      error: { message: "المبلغ المستهدف يجب أن يكون أكبر من صفر" },
    };
  }

  // التحقق من أن المبلغ الحالي لا يتجاوز المستهدف
  if (validatedGoal.current_amount > validatedGoal.target_amount) {
    return {
      data: null,
      error: { message: "المبلغ الحالي لا يمكن أن يتجاوز المبلغ المستهدف" },
    };
  }

  // التحقق من صحة تاريخ الموعد النهائي
  const deadline = new Date(validatedGoal.deadline);
  if (deadline <= new Date()) {
    return {
      data: null,
      error: { message: "الموعد النهائي يجب أن يكون في المستقبل" },
    };
  }

  const { data, error } = await supabase
    .from("savings_goals")
    .insert(validatedGoal)
    .select()
    .single();
  return { data, error };
};

export const getUserSavingsGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return { data, error };
};

export const updateSavingsGoal = async (goalId: string, updates: any) => {
  const { data, error } = await supabase
    .from("savings_goals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .select()
    .single();
  return { data, error };
};

export const getUserCards = async (userId: string) => {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", userId);
  return { data, error };
};

export const updateCard = async (cardId: string, updates: any) => {
  const { data, error } = await supabase
    .from("cards")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", cardId)
    .select()
    .single();
  return { data, error };
};

export const createNotification = async (notification: any) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();
  return { data, error };
};

export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();
  return { data, error };
};

export const createReferral = async (referral: any) => {
  const { data, error } = await supabase
    .from("referrals")
    .insert(referral)
    .select()
    .single();
  return { data, error };
};

export const getUserReferrals = async (userId: string) => {
  const { data, error } = await supabase
    .from("referrals")
    .select(
      `
      *,
      referred_user:users!referrals_referred_id_fkey(full_name, email)
    `,
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
};

// Get referral statistics for a user
export const getReferralStats = async (userId: string) => {
  try {
    // Get total referrals count
    const { count: totalReferrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId);

    // Get completed referrals count
    const { count: completedReferrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .eq("status", "completed");

    // Get total earnings from referrals
    const { data: userEarnings } = await supabase
      .from("users")
      .select("referral_earnings")
      .eq("id", userId)
      .single();

    // Get this month's referrals
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonthReferrals } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    return {
      data: {
        totalReferrals: totalReferrals || 0,
        completedReferrals: completedReferrals || 0,
        totalEarnings: userEarnings?.referral_earnings || 0,
        thisMonthReferrals: thisMonthReferrals || 0,
        pendingRewards: (totalReferrals || 0) - (completedReferrals || 0),
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message || "خطأ في جلب إحصائيات الإحالة" },
    };
  }
};

// Validate referral code
export const validateReferralCode = async (code: string) => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: "كود الإحالة مطلوب" };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("referral_code", code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return { isValid: false, error: "كود الإحالة غير صحيح" };
  }

  return { isValid: true, referrer: data };
};

// Get user credentials (username and password)
export const getUserCredentials = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_credentials")
    .select("username, password_hash")
    .eq("user_id", userId)
    .single();
  return { data, error };
};

// Get all user credentials (for admin viewing)
export const getAllUserCredentials = async () => {
  const { data, error } = await supabase.from("user_credentials").select(`
      username,
      password_hash,
      user_id,
      users!inner(email, full_name)
    `);
  return { data, error };
};
