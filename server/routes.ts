import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertExpenseSchema, insertBudgetSchema, updateExpenseSchema, updateBudgetSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      if (process.env.AUTH_DISABLED === 'true') {
        return res.json({
          id: 'dev-user',
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null,
        });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Expense routes
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      let expenses;
      if (startDate && endDate) {
        expenses = await storage.getExpensesByDateRange(userId, startDate, endDate);
      } else if (category) {
        expenses = await storage.getExpensesByCategory(userId, category);
      } else {
        expenses = await storage.getExpenses(userId, limit, offset);
      }

      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get('/api/expenses/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getExpenseStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching expense stats:", error);
      res.status(500).json({ message: "Failed to fetch expense stats" });
    }
  });

  app.get('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expense = await storage.getExpense(req.params.id, userId);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId,
        date: new Date(req.body.date),
      });

      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = updateExpenseSchema.parse(req.body);
      
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const expense = await storage.updateExpense(req.params.id, userId, updateData);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteExpense(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Budget routes
  app.get('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.get('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budget = await storage.getBudget(req.params.id, userId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId,
      });

      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      console.error("Error creating budget:", error);
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  app.patch('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = updateBudgetSchema.parse(req.body);

      const budget = await storage.updateBudget(req.params.id, userId, updateData);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      console.error("Error updating budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  app.delete('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteBudget(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Budget not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Budget progress route
  app.get('/api/budgets/progress/:category', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const category = req.params.category;
      
      const budget = await storage.getBudgetByCategory(userId, category);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found for category" });
      }

      const now = new Date();
      let startDate: Date;
      
      if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      const expenses = await storage.getExpensesByDateRange(userId, startDate, now);
      const categoryExpenses = expenses.filter(expense => expense.category === category);
      const spent = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const budgetAmount = parseFloat(budget.amount);
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      res.json({
        budget,
        spent,
        remaining: Math.max(0, budgetAmount - spent),
        percentage: Math.min(100, percentage),
        isOverBudget: spent > budgetAmount,
      });
    } catch (error) {
      console.error("Error fetching budget progress:", error);
      res.status(500).json({ message: "Failed to fetch budget progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
