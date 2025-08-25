import {
  users,
  expenses,
  budgets,
  type User,
  type UpsertUser,
  type Expense,
  type InsertExpense,
  type UpdateExpense,
  type Budget,
  type InsertBudget,
  type UpdateBudget,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Expense operations
  getExpenses(userId: string, limit?: number, offset?: number): Promise<Expense[]>;
  getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(userId: string, category: string): Promise<Expense[]>;
  getExpense(id: string, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, userId: string, expense: UpdateExpense): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<boolean>;
  getExpenseStats(userId: string): Promise<{
    monthlyTotal: number;
    dailyAverage: number;
    categoryBreakdown: { category: string; total: number }[];
  }>;
  
  // Budget operations
  getBudgets(userId: string): Promise<Budget[]>;
  getBudget(id: string, userId: string): Promise<Budget | undefined>;
  getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, userId: string, budget: UpdateBudget): Promise<Budget | undefined>;
  deleteBudget(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Expense operations
  async getExpenses(userId: string, limit = 50, offset = 0): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date))
      .limit(limit)
      .offset(offset);
  }

  async getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ))
      .orderBy(desc(expenses.date));
  }

  async getExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        eq(expenses.category, category)
      ))
      .orderBy(desc(expenses.date));
  }

  async getExpense(id: string, userId: string): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.userId, userId)
      ));
    return expense;
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(expenseData)
      .returning();
    return expense;
  }

  async updateExpense(id: string, userId: string, updateData: UpdateExpense): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(
        eq(expenses.id, id),
        eq(expenses.userId, userId)
      ))
      .returning();
    return expense;
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(and(
        eq(expenses.id, id),
        eq(expenses.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getExpenseStats(userId: string): Promise<{
    monthlyTotal: number;
    dailyAverage: number;
    categoryBreakdown: { category: string; total: number }[];
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyExpenses = await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startOfMonth)
      ));

    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => 
      sum + parseFloat(expense.amount), 0
    );

    const daysInMonth = now.getDate();
    const dailyAverage = daysInMonth > 0 ? monthlyTotal / daysInMonth : 0;

    const categoryTotals = new Map<string, number>();
    monthlyExpenses.forEach(expense => {
      const current = categoryTotals.get(expense.category) || 0;
      categoryTotals.set(expense.category, current + parseFloat(expense.amount));
    });

    const categoryBreakdown = Array.from(categoryTotals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    return { monthlyTotal, dailyAverage, categoryBreakdown };
  }

  // Budget operations
  async getBudgets(userId: string): Promise<Budget[]> {
    return await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId));
  }

  async getBudget(id: string, userId: string): Promise<Budget | undefined> {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(
        eq(budgets.id, id),
        eq(budgets.userId, userId)
      ));
    return budget;
  }

  async getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined> {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(
        eq(budgets.userId, userId),
        eq(budgets.category, category)
      ));
    return budget;
  }

  async createBudget(budgetData: InsertBudget): Promise<Budget> {
    const [budget] = await db
      .insert(budgets)
      .values(budgetData)
      .returning();
    return budget;
  }

  async updateBudget(id: string, userId: string, updateData: UpdateBudget): Promise<Budget | undefined> {
    const [budget] = await db
      .update(budgets)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(
        eq(budgets.id, id),
        eq(budgets.userId, userId)
      ))
      .returning();
    return budget;
  }

  async deleteBudget(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(budgets)
      .where(and(
        eq(budgets.id, id),
        eq(budgets.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
