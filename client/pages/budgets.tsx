import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Budget } from "@shared/schema";

interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export default function Budgets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly"
  });

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

  // Fetch budgets
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    enabled: isAuthenticated,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      return await apiRequest("POST", "/api/budgets", budgetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setShowForm(false);
      setFormData({ category: "", amount: "", period: "monthly" });
      toast({
        title: "Success",
        description: "Budget created successfully!",
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
        description: "Failed to create budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      return await apiRequest("DELETE", `/api/budgets/${budgetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully!",
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
        description: "Failed to delete budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createBudgetMutation.mutate({
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
    });
  };

  const categories = [
    "Food & Dining",
    "Groceries", 
    "Transportation",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Healthcare",
    "Other"
  ];

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-dark" data-testid="text-page-title">Budget Management</h1>
          
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-emerald-600 text-white"
                data-testid="button-add-budget"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-budget-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    data-testid="input-budget-amount"
                  />
                </div>
                
                <div>
                  <Label htmlFor="period">Period</Label>
                  <Select 
                    value={formData.period} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
                  >
                    <SelectTrigger data-testid="select-budget-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-emerald-600 text-white"
                    disabled={createBudgetMutation.isPending}
                    data-testid="button-save-budget"
                  >
                    {createBudgetMutation.isPending ? "Creating..." : "Create Budget"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel-budget"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {budgetsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <i className="fas fa-wallet text-4xl text-secondary mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">No Budgets Set</h3>
              <p className="text-secondary mb-4">Create your first budget to start tracking your spending limits.</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-emerald-600 text-white"
                data-testid="button-create-first-budget"
              >
                Create Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <BudgetProgressCard 
                key={budget.id} 
                budget={budget}
                onDelete={() => deleteBudgetMutation.mutate(budget.id)}
                isDeleting={deleteBudgetMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}

function BudgetProgressCard({ 
  budget, 
  onDelete, 
  isDeleting 
}: { 
  budget: Budget; 
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { data: progress } = useQuery<BudgetProgress>({
    queryKey: ["/api/budgets/progress", budget.category],
    queryFn: async () => {
      const response = await fetch(`/api/budgets/progress/${encodeURIComponent(budget.category)}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const spent = progress?.spent || 0;
  const budgetAmount = parseFloat(budget.amount);
  const percentage = budgetAmount > 0 ? Math.min(100, (spent / budgetAmount) * 100) : 0;
  const isOverBudget = spent > budgetAmount;

  return (
    <Card data-testid={`budget-card-${budget.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg" data-testid={`text-budget-category-${budget.id}`}>
              {budget.category}
            </CardTitle>
            <p className="text-sm text-secondary capitalize">{budget.period}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-secondary hover:text-red-500"
            data-testid={`button-delete-budget-${budget.id}`}
          >
            <i className="fas fa-trash text-xs"></i>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Spent</span>
            <span className="font-medium" data-testid={`text-budget-spent-${budget.id}`}>
              ${spent.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">Budget</span>
            <span className="font-medium" data-testid={`text-budget-limit-${budget.id}`}>
              ${budgetAmount.toFixed(2)}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-secondary">Progress</span>
              <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-text-dark'}`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-primary'}`}
              data-testid={`progress-budget-${budget.id}`}
            />
          </div>
          
          {isOverBudget && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 flex items-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Over budget by ${(spent - budgetAmount).toFixed(2)}
              </p>
            </div>
          )}
          
          <div className="text-sm text-secondary">
            Remaining: ${Math.max(0, budgetAmount - spent).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
