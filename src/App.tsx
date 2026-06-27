import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ScrollToTop } from "@/components/site/ScrollToTop";

// Lazy-loaded pages
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const MarketWithUs = lazy(() => import("@/pages/MarketWithUs"));

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Forgot = lazy(() => import("@/pages/Forgot"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

// Dashboard
const DashLayout = lazy(() => import("@/pages/DashLayout"));
const DashOverview = lazy(() => import("@/pages/Overview"));
const AvailableTasks = lazy(() => import("@/pages/AvailableTasks"));
const Applied = lazy(() => import("@/pages/Applied"));
const Completed = lazy(() => import("@/pages/Completed"));
const Rejected = lazy(() => import("@/pages/Rejected"));
const MyTasks = lazy(() => import("@/pages/MyTasks"));
const NewTask = lazy(() => import("@/pages/NewTask"));
const ReviewTask = lazy(() => import("@/pages/ReviewTask"));
const HiringAnalytics = lazy(() => import("@/pages/Analytics"));
const HiringReviews = lazy(() => import("@/pages/Reviews"));
const WalletPage = lazy(() => import("@/pages/WalletPage"));
const Notifs = lazy(() => import("@/pages/Notifs"));
const Messages = lazy(() => import("@/pages/Messages"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const Support = lazy(() => import("@/pages/Support"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const Settings = lazy(() => import("@/pages/Settings"));
const EarnAds = lazy(() => import("@/pages/EarnAds"));
const TierUnlock = lazy(() => import("@/pages/TierUnlock"));
const AdvertiserCampaign = lazy(() => import("@/pages/AdvertiserCampaign"));
const AdvertiserDashboard = lazy(() => import("@/pages/AdvertiserDashboard"));
const AdminAds = lazy(() => import("@/pages/AdminAds"));

// Admin
const AdminLayout = lazy(() => import("@/pages/AdminLayout"));
const AdminOverview = lazy(() => import("@/pages/AdminOverview"));
const AdminUsers = lazy(() => import("@/pages/Users"));
const AdminTasks = lazy(() => import("@/pages/Tasks"));
const AdminNewTask = lazy(() => import("@/pages/AdminNewTask"));
const AdminTaskReview = lazy(() => import("@/pages/AdminTaskReview"));
const AdminSubmissions = lazy(() => import("@/pages/AdminSubmissions"));
const AdminCampaigns = lazy(() => import("@/pages/AdminCampaigns"));
const AdminWithdrawals = lazy(() => import("@/pages/Withdrawals"));
const AdminCountries = lazy(() => import("@/pages/Countries"));
const AdminReferrals = lazy(() => import("@/pages/Refs"));
const AdminFraud = lazy(() => import("@/pages/Fraud"));
const AdminSupport = lazy(() => import("@/pages/AdminSupport"));
const TaskDetail = lazy(() => import("@/pages/TaskDetail"));

function PageFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-muted-foreground text-sm">Loading…</div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/market-with-us" element={<MarketWithUs />} />


        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot" element={<Forgot />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        <Route path="/dashboard" element={<DashLayout />}>
          <Route index element={<DashOverview />} />
          <Route path="worker" element={<AvailableTasks />} />
          <Route path="worker/:id" element={<TaskDetail />} />
          <Route path="worker/applied" element={<Applied />} />
          <Route path="worker/completed" element={<Completed />} />
          <Route path="worker/rejected" element={<Rejected />} />
          <Route path="hiring" element={<MyTasks />} />
          <Route path="hiring/new" element={<NewTask />} />
          <Route path="hiring/analytics" element={<HiringAnalytics />} />
          <Route path="hiring/reviews" element={<HiringReviews />} />
          <Route path="hiring/:id" element={<ReviewTask />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="notifications" element={<Notifs />} />
          <Route path="messages" element={<Messages />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="support" element={<Support />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="earn" element={<EarnAds />} />
          <Route path="earn/unlock" element={<TierUnlock />} />
          <Route path="advertise" element={<AdvertiserCampaign />} />
          <Route path="advertise/campaigns" element={<AdvertiserDashboard />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="tasks/new" element={<AdminNewTask />} />
          <Route path="tasks/:id" element={<AdminTaskReview />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="countries" element={<AdminCountries />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="fraud" element={<AdminFraud />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="ads" element={<AdminAds />} />
        </Route>

        <Route path="/dashboard/overview" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}