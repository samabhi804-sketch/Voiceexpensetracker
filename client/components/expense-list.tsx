import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ExpenseForm from "./expense-form";
import type { Expense } from "@shared/schema";

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onExpenseUpdate: () => void;
}

export default function ExpenseList({ expenses, isLoading, onExpenseUpdate }: ExpenseListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      return await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
      setDeletingExpenseId(null);
      toast({
        title: "Success",
        description: "Expense deleted successfully!",
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
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "Food & Dining": "fas fa-utensils",
      "Groceries": "fas fa-shopping-cart",
      "Transportation": "fas fa-car",
      "Entertainment": "fas fa-film",
      "Shopping": "fas fa-shopping-bag",
      "Utilities": "fas fa-bolt",
      "Healthcare": "fas fa-heartbeat",
      "Other": "fas fa-tag"
    };
    return icons[category] || "fas fa-receipt";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Food & Dining": "bg-blue-100 text-blue-600",
      "Groceries": "bg-green-100 text-green-600",
      "Transportation": "bg-red-100 text-red-600",
      "Entertainment": "bg-purple-100 text-purple-600",
      "Shopping": "bg-pink-100 text-pink-600",
      "Utilities": "bg-yellow-100 text-yellow-600",
      "Healthcare": "bg-indigo-100 text-indigo-600",
      "Other": "bg-gray-100 text-gray-600"
    };
    return colors[category] || "bg-gray-100 text-gray-600";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle data-testid="text-recent-expenses-title">Recent Expenses</CardTitle>
            <Button 
              variant="ghost" 
              className="text-primary hover:text-emerald-600 text-sm font-medium"
              onClick={() => {/* Navigate to expenses page */}}
              data-testid="button-view-all-expenses"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-secondary">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-receipt text-4xl text-secondary mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-secondary">Start by adding your first expense using voice or manual entry.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="py-4 hover:bg-gray-50 transition-colors" 
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(expense.category)}`}>
                        <i className={`${getCategoryIcon(expense.category)}`}></i>
                      </div>
                      <div>
                        <p className="font-medium text-text-dark" data-testid={`text-expense-description-${expense.id}`}>
                          {expense.description}
                        </p>
                        <p className="text-sm text-secondary">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()} at {new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          onClick={() => setEditingExpense(expense)}
                          data-testid={`button-edit-expense-${expense.id}`}
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          className="text-secondary hover:text-red-500 transition-colors"
                          onClick={() => setDeletingExpenseId(expense.id)}
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
          
          {/* Add Expense Button */}
          <div className="pt-6 border-t border-gray-100 mt-6">
            <Button 
              variant="outline"
              className="w-full border-dashed border-2 hover:border-primary hover:text-primary"
              onClick={() => setIsCreating(true)}
              data-testid="button-add-manual-expense"
            >
              <i className="fas fa-plus mr-2"></i>Add Manual Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Expense Form */}
      {isCreating && (
        <ExpenseForm
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            onExpenseUpdate();
          }}
        />
      )}

      {editingExpense && (
        <ExpenseForm
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            onExpenseUpdate();
          }}
          expenseId={editingExpense.id}
          initialData={{
            amount: editingExpense.amount,
            category: editingExpense.category,
            description: editingExpense.description,
            date: new Date(editingExpense.date).toISOString().split('T')[0],
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingExpenseId} onOpenChange={() => setDeletingExpenseId(null)}>
        <AlertDialogContent data-testid="dialog-delete-expense">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingExpenseId && deleteExpenseMutation.mutate(deletingExpenseId)}
              disabled={deleteExpenseMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              {deleteExpenseMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
