import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import VoiceInput from "@/components/voice-input";
import StatsCard from "@/components/stats-card";
import ExpenseList from "@/components/expense-list";
import CategoryChart from "@/components/category-chart";
import BudgetCard from "@/components/budget-card";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import type { Expense, Budget } from "@shared/schema";

interface ExpenseStats {
  monthlyTotal: number;
  dailyAverage: number;
  categoryBreakdown: { category: string; total: number }[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch recent expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      const response = await fetch("/api/expenses?limit=5");
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch expense stats
  const { data: stats } = useQuery<ExpenseStats>({
    queryKey: ["/api/expenses/stats"],
    enabled: isAuthenticated,
  });

  // Fetch budgets
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    enabled: isAuthenticated,
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      return await apiRequest("POST", "/api/expenses", expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Voice Input Section */}
        <VoiceInput 
          onExpenseAdd={(expenseData) => addExpenseMutation.mutate(expenseData)}
          isLoading={addExpenseMutation.isPending}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="This Month"
            value={`$${stats?.monthlyTotal?.toFixed(2) || '0.00'}`}
            icon="fas fa-calendar-alt"
            iconBg="bg-primary/10"
            iconColor="text-primary"
            change="+12.3%"
            changeLabel="vs last month"
            isPositive={false}
          />
          
          <StatsCard
            title="Avg Daily"
            value={`$${stats?.dailyAverage?.toFixed(2) || '0.00'}`}
            icon="fas fa-chart-line"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            change="-5.2%"
            changeLabel="vs last month"
            isPositive={true}
          />
          
          <StatsCard
            title="Budget Used"
            value="73%"
            icon="fas fa-wallet"
            iconBg="bg-accent/10"
            iconColor="text-accent"
            showProgress={true}
            progressValue={73}
          />
          
          <StatsCard
            title="Categories"
            value={stats?.categoryBreakdown?.length?.toString() || '0'}
            icon="fas fa-tags"
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            subtitle={`Most: ${stats?.categoryBreakdown?.[0]?.category || 'None'}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Expenses */}
          <div className="lg:col-span-2">
            <ExpenseList 
              expenses={expenses}
              isLoading={expensesLoading}
              onExpenseUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
                queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CategoryChart data={stats?.categoryBreakdown || []} />
            <BudgetCard budgets={budgets} />
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
