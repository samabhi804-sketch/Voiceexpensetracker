import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import CategoryChart from "@/components/category-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { Expense } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  // Set default date range
  useEffect(() => {
    const now = new Date();
    let start: Date;
    
    switch (dateRange) {
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    
    setStartDate(start);
    setEndDate(now);
  }, [dateRange]);

  // Build query params
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate.toISOString());
  if (endDate) queryParams.append("endDate", endDate.toISOString());
  if (selectedCategory !== "all") queryParams.append("category", selectedCategory);

  // Fetch expenses for reports
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?${queryParams.toString()}&limit=1000`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Calculate report data
  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const avgExpense = expenses.length > 0 ? totalAmount / expenses.length : 0;
  
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryBreakdown)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const dailySpending = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date).toDateString();
    acc[date] = (acc[date] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const categories = Array.from(new Set(expenses.map(e => e.category)));

  const exportToCsv = () => {
    const headers = ["Date", "Category", "Description", "Amount"];
    const csvData = [
      headers.join(","),
      ...expenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        `"${expense.description.replace(/"/g, '""')}"`,
        expense.amount
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${startDate?.toISOString().split('T')[0]}-${endDate?.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your expense report has been downloaded as CSV.",
    });
  };

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
          <h1 className="text-3xl font-bold text-text-dark" data-testid="text-page-title">Expense Reports</h1>
          <Button 
            onClick={exportToCsv}
            disabled={expenses.length === 0}
            className="bg-primary hover:bg-emerald-600 text-white"
            data-testid="button-export-csv"
          >
            <i className="fas fa-download mr-2"></i>
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateRange === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={startDate?.toISOString().split('T')[0] || ""}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                      data-testid="input-start-date"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">End Date</label>
                    <Input
                      type="date"
                      value={endDate?.toISOString().split('T')[0] || ""}
                      onChange={(e) => setEndDate(new Date(e.target.value))}
                      data-testid="input-end-date"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-dollar-sign text-primary"></i>
                </div>
                <p className="text-secondary text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-text-dark" data-testid="text-total-spent">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calculator text-blue-600"></i>
                </div>
                <p className="text-secondary text-sm">Average Expense</p>
                <p className="text-2xl font-bold text-text-dark" data-testid="text-average-expense">
                  ${avgExpense.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-list text-green-600"></i>
                </div>
                <p className="text-secondary text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-text-dark" data-testid="text-total-transactions">
                  {expenses.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-tags text-purple-600"></i>
                </div>
                <p className="text-secondary text-sm">Categories</p>
                <p className="text-2xl font-bold text-text-dark" data-testid="text-categories-count">
                  {categoryData.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-secondary">Loading chart...</p>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-chart-pie text-4xl text-secondary mb-4"></i>
                  <p className="text-secondary">No data available for the selected period.</p>
                </div>
              ) : (
                <CategoryChart data={categoryData} />
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary">No expenses found for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" 
                             style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}></div>
                        <span className="font-medium" data-testid={`text-category-${item.category.replace(/\s+/g, '-').toLowerCase()}`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-category-amount-${item.category.replace(/\s+/g, '-').toLowerCase()}`}>
                          ${item.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-secondary">
                          {((item.total / totalAmount) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
