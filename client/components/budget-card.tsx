import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Budget } from "@shared/schema";

interface BudgetCardProps {
  budgets: Budget[];
}

export default function BudgetCard({ budgets }: BudgetCardProps) {
  // Mock progress data - in real app this would come from API
  const mockProgress = [
    { category: "Food & Dining", spent: 456, budget: 600, percentage: 76 },
    { category: "Transportation", spent: 234, budget: 300, percentage: 78 },
    { category: "Entertainment", spent: 180, budget: 150, percentage: 120 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="text-budget-progress-title">Budget Progress</CardTitle>
          <Button 
            variant="ghost"
            className="text-primary hover:text-emerald-600 text-sm font-medium"
            data-testid="button-manage-budgets"
          >
            Manage
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-6">
            <i className="fas fa-wallet text-3xl text-secondary mb-3"></i>
            <p className="text-secondary mb-3">No budgets set yet</p>
            <Button 
              size="sm"
              className="bg-primary hover:bg-emerald-600 text-white"
              data-testid="button-create-budget"
            >
              Create Budget
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {mockProgress.map((item) => {
              const isOverBudget = item.percentage > 100;
              const displayPercentage = Math.min(100, item.percentage);
              
              return (
                <div key={item.category} data-testid={`budget-progress-${item.category.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm text-secondary">
                      ${item.spent} / ${item.budget}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress 
                      value={displayPercentage}
                      className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-primary'}`}
                      data-testid={`progress-${item.category.replace(/\s+/g, '-').toLowerCase()}`}
                    />
                    {isOverBudget && (
                      <p className="text-xs text-red-600 flex items-center">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Over budget by ${item.spent - item.budget}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
