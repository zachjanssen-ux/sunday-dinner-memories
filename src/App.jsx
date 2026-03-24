import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ui/ErrorBoundary'
import ProtectedRoute from './components/guards/ProtectedRoute'
import ActiveMemberGate from './components/guards/ActiveMemberGate'
import InstallPrompt from './components/pwa/InstallPrompt'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FamilyPage from './pages/FamilyPage'
import JoinFamily from './pages/JoinFamily'
import ViewerLanding from './pages/ViewerLanding'
import CreateFamily from './pages/CreateFamily'
import ImportPage from './pages/ImportPage'
import ScanPage from './pages/ScanPage'
import RecipeDetail from './pages/RecipeDetail'
import RecipeNew from './pages/RecipeNew'
import RecipeEdit from './pages/RecipeEdit'
import CookbooksPage from './pages/CookbooksPage'
import CookbookDetail from './pages/CookbookDetail'
import PrintableCookbooksPage from './pages/PrintableCookbooksPage'
import CookbookBuilder from './pages/CookbookBuilder'
import MealPlanPage from './pages/MealPlanPage'
import ShoppingListPage from './pages/ShoppingListPage'
import PublicRecipe from './pages/PublicRecipe'
import SearchPage from './pages/SearchPage'
import NotFound from './pages/NotFound'
import useAuthStore from './store/authStore'
import { Loader2 } from 'lucide-react'

function AppRoutes() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sienna animate-spin mx-auto mb-4" />
          <p className="text-sunday-brown font-body">Setting the table...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public recipe page — NO auth required (Phase 5) */}
      <Route path="/r/:slug" element={<PublicRecipe />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <FamilyPage />
          </ProtectedRoute>
        }
      />
      <Route path="/join" element={<JoinFamily />} />
      <Route path="/join/:token" element={<JoinFamily />} />
      <Route path="/view/:token" element={<ViewerLanding />} />
      <Route
        path="/create-family"
        element={
          <ProtectedRoute>
            <CreateFamily />
          </ProtectedRoute>
        }
      />

      {/* Import & Scan routes — Phase 3 */}
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <ScanPage />
          </ProtectedRoute>
        }
      />

      {/* Recipe routes — Phase 2 */}
      <Route
        path="/recipes/new"
        element={
          <ProtectedRoute>
            <ActiveMemberGate>
              <RecipeNew />
            </ActiveMemberGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes/:id/edit"
        element={
          <ProtectedRoute>
            <RecipeEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes/:id"
        element={
          <ProtectedRoute>
            <RecipeDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      {/* Cookbook routes — Phase 2 */}
      <Route
        path="/cookbooks"
        element={
          <ProtectedRoute>
            <CookbooksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cookbooks/:id"
        element={
          <ProtectedRoute>
            <CookbookDetail />
          </ProtectedRoute>
        }
      />

      {/* Printable Cookbook routes — Phase 6 */}
      <Route
        path="/cookbooks/printable"
        element={
          <ProtectedRoute>
            <PrintableCookbooksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cookbooks/printable/new"
        element={
          <ProtectedRoute>
            <ActiveMemberGate>
              <CookbookBuilder />
            </ActiveMemberGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cookbooks/printable/:id"
        element={
          <ProtectedRoute>
            <ActiveMemberGate>
              <CookbookBuilder />
            </ActiveMemberGate>
          </ProtectedRoute>
        }
      />

      {/* Search route — Phase 8 */}
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />

      {/* Meal Plan & Shopping List routes — Phase 7 */}
      <Route
        path="/meal-plan"
        element={
          <ProtectedRoute>
            <MealPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shopping-list"
        element={
          <ProtectedRoute>
            <ShoppingListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shopping-list/:id"
        element={
          <ProtectedRoute>
            <ShoppingListPage />
          </ProtectedRoute>
        }
      />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  useAuth()

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <InstallPrompt />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              fontFamily: "'Lora', Georgia, serif",
              borderRadius: '0.5rem',
            },
          }}
          containerStyle={{
            bottom: 80,
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
