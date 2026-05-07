import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ShopkeeperPage from "@/pages/shopkeeper";
import ConsultPage from "@/pages/consult";
import MedicinePage from "@/pages/medicine";
import DoctorPanelPage from "@/pages/doctor-panel";
import LabTestsPage from "@/pages/lab-tests";
import MyDashboardPage from "@/pages/my-dashboard";
import PlansPage from "@/pages/plans";
import LabCenterPage from "@/pages/lab-center";
import MyProfilePage from "@/pages/my-profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/shopkeeper" component={ShopkeeperPage} />
      <Route path="/consult" component={ConsultPage} />
      <Route path="/medicine" component={MedicinePage} />
      <Route path="/doctor-panel" component={DoctorPanelPage} />
      <Route path="/lab-tests" component={LabTestsPage} />
      <Route path="/my-dashboard" component={MyDashboardPage} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/lab-center" component={LabCenterPage} />
      <Route path="/my-profile" component={MyProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
