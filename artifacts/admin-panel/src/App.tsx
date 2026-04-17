import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import SubscriptionsPage from "@/pages/subscriptions";
import PaymentsPage from "@/pages/payments";
import CareActivityPage from "@/pages/care-activity";
import ApiKeysPage from "@/pages/api-keys";
import ShopkeepersPage from "@/pages/shopkeepers";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/users" component={UsersPage} />
        <Route path="/subscriptions" component={SubscriptionsPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/care" component={CareActivityPage} />
        <Route path="/shopkeepers" component={ShopkeepersPage} />
        <Route path="/api-keys" component={ApiKeysPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mq_admin_token");
    setIsLoggedIn(!!token);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {isLoggedIn ? (
            <AppRoutes />
          ) : (
            <Login onLogin={() => setIsLoggedIn(true)} />
          )}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
