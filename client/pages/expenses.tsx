import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import ExpenseForm from "@/components/expense-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Expense } from "@shared/schema";

export default function Expenses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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

  // Fetch all expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", { limit: 100 }],
    queryFn: async () => {
      const response = await fetch("/api/expenses?limit=100");
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          matchesDate = expenseDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = expenseDate >= weekAgo;
          break;
        case "month":
          matchesDate = expenseDate.getMonth() === now.getMonth() && 
                       expenseDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const categories = Array.from(new Set(expenses.map(e => e.category)));

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
          <h1 className="text-3xl font-bold text-text-dark" data-testid="text-page-title">All Expenses</h1>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-emerald-600 text-white"
            data-testid="button-add-expense"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Expense
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-expenses"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger data-testid="select-date-filter">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span data-testid="text-expenses-count">
                {filteredExpenses.length} Expense{filteredExpenses.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm text-secondary font-normal">
                Total: ${filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-secondary">Loading expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-receipt text-4xl text-secondary mb-4"></i>
                <p className="text-secondary">No expenses found matching your criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="py-4 hover:bg-gray-50 transition-colors" data-testid={`expense-item-${expense.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-receipt text-primary"></i>
                        </div>
                        <div>
                          <p className="font-medium text-text-dark" data-testid={`text-expense-description-${expense.id}`}>
                            {expense.description}
                          </p>
                          <p className="text-sm text-secondary">
                            {expense.category} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-dark" data-testid={`text-expense-amount-${expense.id}`}>
                          ${parseFloat(expense.amount).toFixed(2)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <button 
                            className="text-secondary hover:text-primary transition-colors"
                            data-testid={`button-edit-expense-${expense.id}`}
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button 
                            className="text-secondary hover:text-red-500 transition-colors"
                            data-testid={`button-delete-expense-${expense.id}`}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <ExpenseForm 
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      <MobileNav />
    </div>
  );
}
