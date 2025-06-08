import { Suspense, useState, useEffect } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import DebugAuth from "./components/DebugAuth";
import InstantTransferTab from "./components/InstantTransferTab";
import routes from "tempo-routes";
import { AppProvider } from "./contexts/AppContext";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, logout, loading } = useAuth();

  const handleSignup = (userData: {
    fullName: string;
    email: string;
    phone: string;
    username: string;
    password: string;
    address: string;
    referralCode: string;
  }) => {
    console.log("New user signup:", userData);
  };

  // Show loading spinner while checking authentication with timeout
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowLoadingTimeout(true);
        console.log("⏰ انتهت مهلة التحميل - سيتم عرض خيارات إضافية");
      }, 15000); // 15 seconds

      return () => clearTimeout(timeout);
    } else {
      setShowLoadingTimeout(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg mb-4">جاري التحميل...</p>

          {showLoadingTimeout && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 mt-4">
              <p className="text-white text-sm mb-3">
                يبدو أن التحميل يستغرق وقتاً أطول من المعتاد
              </p>
              <button
                onClick={() => {
                  console.log("🔄 إعادة تحميل الصفحة بناءً على طلب المستخدم");
                  window.location.reload();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-lg">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <>
        {/* Tempo routes must come first */}
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/home" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to="/home" replace />
              ) : (
                <Signup onSignup={handleSignup} />
              )
            }
          />
          <Route path="/debug-auth" element={<DebugAuth />} />
          <Route
            path="/home"
            element={
              user ? (
                <Home onLogout={logout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/instant-transfer"
            element={
              user ? (
                <InstantTransferTab
                  balance={{ dzd: 15000, eur: 75, usd: 85, gbp: 65.5 }}
                  onTransfer={(amount, recipient) =>
                    console.log("Instant Transfer:", amount, recipient)
                  }
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Add tempo route before catchall */}
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" />
          )}

          {/* Catch all route */}
          <Route
            path="*"
            element={<Navigate to={user ? "/home" : "/login"} replace />}
          />
        </Routes>
      </>
    </Suspense>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
