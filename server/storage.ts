import { eq, and, lte, gte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, suppliers, clients, categories, costCenters,
  accountsPayable, accountsReceivable, mercadoPagoTransactions, cashFlowEntries, balanceAdjustments,
} from "@shared/schema";
import type {
  User, InsertUser,
  Supplier, InsertSupplier,
  Client, InsertClient,
  Category, InsertCategory,
  CostCenter, InsertCostCenter,
  AccountPayable, InsertAccountPayable,
  AccountReceivable, InsertAccountReceivable,
  MercadoPagoTransaction, InsertMercadoPagoTransaction,
  DashboardStats, CashFlowData, DREData, CategoryExpense,
  CashFlowEntry, InsertCashFlowEntry, CashFlowKPIs, CashFlowAlert, DailyMovement,
  BalanceAdjustment, InsertBalanceAdjustment,
} from "@shared/schema";
import { hashPassword } from "./auth";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deactivateSupplier(id: string): Promise<Supplier | undefined>;

  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  getCostCenters(): Promise<CostCenter[]>;
  getCostCenter(id: string): Promise<CostCenter | undefined>;
  createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter>;
  updateCostCenter(id: string, costCenter: Partial<InsertCostCenter>): Promise<CostCenter | undefined>;
  deleteCostCenter(id: string): Promise<boolean>;

  getAccountsPayable(): Promise<AccountPayable[]>;
  getAccountPayable(id: string): Promise<AccountPayable | undefined>;
  getUpcomingAccountsPayable(): Promise<AccountPayable[]>;
  createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable>;
  updateAccountPayable(id: string, account: Partial<InsertAccountPayable>): Promise<AccountPayable | undefined>;
  markAccountPayableAsPaid(id: string, paymentDate: string, lateFees?: string): Promise<AccountPayable | undefined>;
  deleteAccountPayable(id: string): Promise<boolean>;
  deactivateAccountPayable(id: string): Promise<AccountPayable | undefined>;

  getAccountsReceivable(): Promise<AccountReceivable[]>;
  getAccountReceivable(id: string): Promise<AccountReceivable | undefined>;
  getUpcomingAccountsReceivable(): Promise<AccountReceivable[]>;
  createAccountReceivable(account: InsertAccountReceivable): Promise<AccountReceivable>;
  updateAccountReceivable(id: string, account: Partial<InsertAccountReceivable>): Promise<AccountReceivable | undefined>;
  markAccountReceivableAsReceived(id: string, receivedDate: string, discount?: string): Promise<AccountReceivable | undefined>;
  deleteAccountReceivable(id: string): Promise<boolean>;

  getDashboardStats(): Promise<DashboardStats>;
  getCashFlowData(period: string): Promise<CashFlowData[]>;
  getCashFlowDataByDateRange(startDate: string, endDate: string): Promise<CashFlowData[]>;
  getCashFlowSummary(period: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }>;
  getCashFlowSummaryByDateRange(startDate: string, endDate: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }>;
  getCashFlowKPIs(period: string): Promise<CashFlowKPIs>;
  getCashFlowKPIsByDateRange(startDate: string, endDate: string): Promise<CashFlowKPIs>;
  getCashFlowAlerts(): Promise<CashFlowAlert[]>;
  getDailyMovements(date: string): Promise<DailyMovement[]>;
  getMovementsByPeriod(period: string): Promise<DailyMovement[]>;
  getMovementsByDateRange(startDate: string, endDate: string): Promise<DailyMovement[]>;
  createCashFlowEntry(entry: InsertCashFlowEntry & { userId: string }): Promise<CashFlowEntry>;
  getCashFlowEntries(): Promise<CashFlowEntry[]>;
  createBalanceAdjustment(entry: InsertBalanceAdjustment & { userId: string }): Promise<BalanceAdjustment>;
  getBalanceAdjustments(date?: string): Promise<BalanceAdjustment[]>;
  getCategoryExpenses(): Promise<CategoryExpense[]>;
  getDREData(year: number, month: number): Promise<{ current: DREData; previous: DREData; percentageChange: { grossRevenue: number; netProfit: number } }>;
  
  seedDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private formatDate(date: Date, daysOffset: number = 0): string {
    const d = new Date(date);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split("T")[0];
  }

  async seedDefaultData(): Promise<void> {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) return;

    // Create default admin user
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      const hashedPassword = await hashPassword("admin123");
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        name: "Administrador",
        role: "admin",
        active: true,
      });
    }

    const defaultCategories = [
      { name: "Vendas de Produtos", type: "income", dreCategory: "revenue" },
      { name: "Prestação de Serviços", type: "income", dreCategory: "revenue" },
      { name: "Outras Receitas", type: "income", dreCategory: "revenue" },
      { name: "Impostos sobre Vendas", type: "income", dreCategory: "deductions" },
      { name: "Devoluções", type: "income", dreCategory: "deductions" },
      { name: "Custo de Mercadorias", type: "expense", dreCategory: "costs" },
      { name: "Aluguel", type: "expense", dreCategory: "operational_expenses" },
      { name: "Salários", type: "expense", dreCategory: "operational_expenses" },
      { name: "Marketing", type: "expense", dreCategory: "operational_expenses" },
      { name: "Utilidades", type: "expense", dreCategory: "operational_expenses" },
      { name: "Material de Escritório", type: "expense", dreCategory: "operational_expenses" },
    ];

    for (const cat of defaultCategories) {
      await db.insert(categories).values(cat);
    }

    const defaultCostCenters = [
      { name: "Administrativo", description: "Despesas administrativas gerais" },
      { name: "Comercial", description: "Departamento de vendas e marketing" },
      { name: "Operacional", description: "Operações e produção" },
      { name: "TI", description: "Tecnologia da informação" },
    ];

    for (const cc of defaultCostCenters) {
      await db.insert(costCenters).values(cc);
    }

    const supplierData = [
      { name: "Fornecedor ABC Ltda", document: "12.345.678/0001-90", email: "contato@abc.com", phone: "(11) 3456-7890", address: "Rua das Flores, 123" },
      { name: "Distribuidora XYZ", document: "98.765.432/0001-10", email: "vendas@xyz.com", phone: "(11) 9876-5432", address: "Av. Principal, 456" },
    ];

    for (const sup of supplierData) {
      await db.insert(suppliers).values(sup);
    }

    const clientData = [
      { name: "Cliente Premium S.A.", document: "11.222.333/0001-44", email: "compras@premium.com", phone: "(11) 1234-5678", address: "Av. Comercial, 789" },
      { name: "Empresa Beta Ltda", document: "44.555.666/0001-77", email: "financeiro@beta.com", phone: "(11) 8765-4321", address: "Rua Industrial, 321" },
    ];

    for (const cli of clientData) {
      await db.insert(clients).values(cli);
    }

    const allSuppliers = await db.select().from(suppliers);
    const allClients = await db.select().from(clients);
    const allCategories = await db.select().from(categories);
    const allCostCenters = await db.select().from(costCenters);

    const expenseCategories = allCategories.filter(c => c.type === "expense");
    const incomeCategories = allCategories.filter(c => c.type === "income" && c.dreCategory === "revenue");

    const today = new Date();

    const payables = [
      { description: "Aluguel do escritório", amount: "5000.00", dueDate: this.formatDate(today, 5), status: "pending" },
      { description: "Conta de energia", amount: "850.00", dueDate: this.formatDate(today, -2), status: "pending" },
      { description: "Internet e telefone", amount: "450.00", dueDate: this.formatDate(today, 10), status: "pending" },
      { description: "Material de escritório", amount: "320.00", dueDate: this.formatDate(today, -5), status: "paid", paymentDate: this.formatDate(today, -5) },
      { description: "Manutenção equipamentos", amount: "1200.00", dueDate: this.formatDate(today, 15), status: "pending" },
    ];

    for (let i = 0; i < payables.length; i++) {
      const pay = payables[i];
      await db.insert(accountsPayable).values({
        ...pay,
        supplierId: allSuppliers[i % allSuppliers.length]?.id || null,
        categoryId: expenseCategories[i % expenseCategories.length]?.id || null,
        costCenterId: allCostCenters[i % allCostCenters.length]?.id || null,
      });
    }

    const receivables = [
      { description: "Venda produto lote 001", amount: "15000.00", dueDate: this.formatDate(today, 3), status: "pending" },
      { description: "Serviço de consultoria", amount: "8500.00", dueDate: this.formatDate(today, -1), status: "pending" },
      { description: "Venda produto lote 002", amount: "12000.00", dueDate: this.formatDate(today, 7), status: "pending" },
      { description: "Manutenção mensal", amount: "3500.00", dueDate: this.formatDate(today, -3), status: "received", receivedDate: this.formatDate(today, -3) },
      { description: "Projeto especial", amount: "25000.00", dueDate: this.formatDate(today, 20), status: "pending" },
    ];

    for (let i = 0; i < receivables.length; i++) {
      const rec = receivables[i];
      await db.insert(accountsReceivable).values({
        ...rec,
        clientId: allClients[i % allClients.length]?.id || null,
        categoryId: incomeCategories[i % incomeCategories.length]?.id || null,
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser & { password: string }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(supplier).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deactivateSupplier(id: string): Promise<Supplier | undefined> {
    const [deactivated] = await db.update(suppliers)
      .set({ active: false })
      .where(eq(suppliers.id, id))
      .returning();
    return deactivated;
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async getCostCenters(): Promise<CostCenter[]> {
    return db.select().from(costCenters);
  }

  async getCostCenter(id: string): Promise<CostCenter | undefined> {
    const [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, id));
    return costCenter;
  }

  async createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter> {
    const [newCostCenter] = await db.insert(costCenters).values(costCenter).returning();
    return newCostCenter;
  }

  async updateCostCenter(id: string, costCenter: Partial<InsertCostCenter>): Promise<CostCenter | undefined> {
    const [updated] = await db.update(costCenters).set(costCenter).where(eq(costCenters.id, id)).returning();
    return updated;
  }

  async deleteCostCenter(id: string): Promise<boolean> {
    await db.delete(costCenters).where(eq(costCenters.id, id));
    return true;
  }

  async getAccountsPayable(): Promise<AccountPayable[]> {
    const results = await db.select().from(accountsPayable);
    return results.map(account => ({
      ...account,
      lateFees: account.lateFees || null,
    }));
  }

  async getAccountPayable(id: string): Promise<AccountPayable | undefined> {
    const [account] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id));
    return account ? {
      ...account,
      lateFees: account.lateFees || null,
    } : undefined;
  }

  async getUpcomingPayables(startDate?: string, endDate?: string): Promise<AccountPayable[]> {
    if (startDate && endDate) {
      return db.select().from(accountsPayable)
        .where(and(
          eq(accountsPayable.status, "pending"),
          gte(accountsPayable.dueDate, startDate),
          lte(accountsPayable.dueDate, endDate)
        ));
    }
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    return db.select().from(accountsPayable)
      .where(and(
        eq(accountsPayable.status, "pending"),
        lte(accountsPayable.dueDate, nextWeekStr)
      ));
  }

  async createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable> {
    const [newAccount] = await db.insert(accountsPayable).values({
      ...account,
      status: account.status || "pending",
    }).returning();
    return newAccount;
  }

  async updateAccountPayable(id: string, account: Partial<InsertAccountPayable>): Promise<AccountPayable | undefined> {
    const [updated] = await db.update(accountsPayable).set(account).where(eq(accountsPayable.id, id)).returning();
    return updated;
  }

  async markAccountPayableAsPaid(id: string, paymentDate: string, lateFees?: string): Promise<AccountPayable | undefined> {
    const updateData: any = { status: "paid", paymentDate };
    if (lateFees !== undefined) {
      updateData.lateFees = lateFees || null;
    }
    const [updated] = await db.update(accountsPayable)
      .set(updateData)
      .where(eq(accountsPayable.id, id))
      .returning();
    return updated;
  }

  async deleteAccountPayable(id: string): Promise<boolean> {
    await db.delete(accountsPayable).where(eq(accountsPayable.id, id));
    return true;
  }

  async deactivateAccountPayable(id: string): Promise<AccountPayable | undefined> {
    const [updated] = await db.update(accountsPayable)
      .set({ active: false })
      .where(eq(accountsPayable.id, id))
      .returning();
    return updated;
  }

  async getAccountsReceivable(): Promise<AccountReceivable[]> {
    return db.select().from(accountsReceivable);
  }

  async getAccountReceivable(id: string): Promise<AccountReceivable | undefined> {
    const [account] = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, id));
    return account;
  }

  async getUpcomingReceivables(startDate?: string, endDate?: string): Promise<AccountReceivable[]> {
    if (startDate && endDate) {
      return db.select().from(accountsReceivable)
        .where(and(
          eq(accountsReceivable.status, "pending"),
          gte(accountsReceivable.dueDate, startDate),
          lte(accountsReceivable.dueDate, endDate)
        ));
    }
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    return db.select().from(accountsReceivable)
      .where(and(
        eq(accountsReceivable.status, "pending"),
        lte(accountsReceivable.dueDate, nextWeekStr)
      ));
  }

  async createAccountReceivable(account: InsertAccountReceivable): Promise<AccountReceivable> {
    const [newAccount] = await db.insert(accountsReceivable).values({
      ...account,
      status: account.status || "pending",
    }).returning();
    return newAccount;
  }

  async updateAccountReceivable(id: string, account: Partial<InsertAccountReceivable>): Promise<AccountReceivable | undefined> {
    const [updated] = await db.update(accountsReceivable).set(account).where(eq(accountsReceivable.id, id)).returning();
    return updated;
  }

  async markAccountReceivableAsReceived(id: string, receivedDate: string, discount?: string): Promise<AccountReceivable | undefined> {
    const updateData: any = { status: "received", receivedDate };
    if (discount !== undefined) {
      updateData.discount = discount || null;
    }
    const [updated] = await db.update(accountsReceivable)
      .set(updateData)
      .where(eq(accountsReceivable.id, id))
      .returning();
    return updated;
  }

  async deleteAccountReceivable(id: string): Promise<boolean> {
    await db.delete(accountsReceivable).where(eq(accountsReceivable.id, id));
    return true;
  }

  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    // Filter by date range if provided
    const filteredPayables = startDate && endDate 
      ? allPayables.filter(p => {
          const date = p.paymentDate || p.dueDate;
          return date >= startDate && date <= endDate;
        })
      : allPayables;
      
    const filteredReceivables = startDate && endDate
      ? allReceivables.filter(r => {
          const date = r.receivedDate || r.dueDate;
          return date >= startDate && date <= endDate;
        })
      : allReceivables;
      
    const filteredCashFlowEntries = startDate && endDate
      ? allCashFlowEntries.filter(e => e.date >= startDate && e.date <= endDate)
      : allCashFlowEntries;

    const totalRevenue = filteredReceivables
      .filter(r => r.status === "received")
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0) +
      filteredCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed")
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const totalExpenses = filteredPayables
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0) +
      filteredCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed")
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

    const pendingReceivables = filteredReceivables
      .filter(r => r.status === "pending")
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

    const pendingPayables = filteredPayables
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

    const overduePayables = startDate && endDate
      ? filteredPayables.filter(p => {
          if (p.status === "paid") return false;
          return p.dueDate < startDate;
        }).length
      : allPayables.filter(p => {
          if (p.status === "paid") return false;
          return p.dueDate < todayStr;
        }).length;

    const overdueReceivables = startDate && endDate
      ? filteredReceivables.filter(r => {
          if (r.status === "received") return false;
          return r.dueDate < startDate;
        }).length
      : allReceivables.filter(r => {
          if (r.status === "received") return false;
          return r.dueDate < todayStr;
        }).length;

    const dueTodayCount = startDate && endDate
      ? [...filteredPayables, ...filteredReceivables].filter(a => {
          if (a.status === "paid" || a.status === "received") return false;
          return a.dueDate >= startDate && a.dueDate <= endDate && a.dueDate === todayStr;
        }).length
      : [...allPayables, ...allReceivables].filter(a => {
          if (a.status === "paid" || a.status === "received") return false;
          return a.dueDate === todayStr;
        }).length;

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const dueThisWeekCount = startDate && endDate
      ? [...filteredPayables, ...filteredReceivables].filter(a => {
          if (a.status === "paid" || a.status === "received") return false;
          return a.dueDate >= startDate && a.dueDate <= endDate && a.dueDate >= todayStr && a.dueDate <= nextWeekStr;
        }).length
      : [...allPayables, ...allReceivables].filter(a => {
          if (a.status === "paid" || a.status === "received") return false;
          return a.dueDate >= todayStr && a.dueDate <= nextWeekStr;
        }).length;

    const balance = totalRevenue - totalExpenses;
    const projectedBalance = balance + pendingReceivables - pendingPayables;

    return {
      totalRevenue,
      totalExpenses,
      balance,
      projectedBalance,
      overduePayables,
      overdueReceivables,
      dueTodayCount,
      dueThisWeekCount,
    };
  }

  async getCashFlowData(period: string): Promise<CashFlowData[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    
    const today = new Date();
    const data: Map<string, CashFlowData> = new Map();
    
    let days = 7;
    if (period === "weekly") days = 28;
    if (period === "monthly") days = 90;
    
    let runningBalance = 0;
    let initialBalance = 0;

    // Calculate initial balance (sum of all confirmed transactions before start date)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];
    
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate < startDateStr)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
      
    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate < startDateStr)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      
    // Add manual cash flow entries to initial balance
    const manualIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date < startDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
    const manualExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date < startDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    
    initialBalance = confirmedIncome - confirmedExpense + manualIncome - manualExpense;
    runningBalance = initialBalance;

    for (let i = -days; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayIncome = allReceivables
        .filter(r => (r.status === "received" ? r.receivedDate === dateStr : r.dueDate === dateStr))
        .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
      
      // Add manual income entries for the day
      const manualDayIncome = allCashFlowEntries
        .filter(e => e.type === "income" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
      const totalDayIncome = dayIncome + manualDayIncome;
      
      const dayExpense = allPayables
        .filter(p => (p.status === "paid" ? p.paymentDate === dateStr : p.dueDate === dateStr))
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      
      // Add manual expense entries for the day
      const manualDayExpense = allCashFlowEntries
        .filter(e => e.type === "expense" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
      const totalDayExpense = dayExpense + manualDayExpense;
      
      const dayInitialBalance = runningBalance;
      runningBalance += totalDayIncome - totalDayExpense;
      const dayFinalBalance = runningBalance;
      
      data.set(dateStr, {
        date: dateStr,
        income: totalDayIncome,
        expense: totalDayExpense,
        balance: runningBalance,
        projected: i > 0,
        initialBalance: dayInitialBalance,
        finalBalance: dayFinalBalance,
      });
    }
    
    return Array.from(data.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCashFlowSummary(period: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }> {
    const cashFlowData = await this.getCashFlowData(period);
    const stats = await this.getDashboardStats();
    
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);
    
    // Calcular valores separados por status
    const allReceivables = await db.select().from(accountsReceivable);
    const allPayables = await db.select().from(accountsPayable);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    
    // Filtrar por período
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (period === "daily") {
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (period === "weekly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 28);
      endDate = new Date(today);
    } else if (period === "monthly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      endDate = new Date(today);
    } else {
      startDate = new Date(today);
      endDate = new Date(today);
    }
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    
    // Receitas confirmadas (recebidas)
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate >= startDateStr && r.receivedDate <= endDateStr)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
    
    // Receitas manuais confirmadas
    const manualConfirmedIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date >= startDateStr && e.date <= endDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    
    const totalIncomeConfirmed = confirmedIncome + manualConfirmedIncome;
    
    // Receitas pendentes - APENAS contas a receber pendentes
    const totalIncomePending = allReceivables
      .filter(r => r.status === "pending" && r.dueDate && r.dueDate >= startDateStr && r.dueDate <= endDateStr)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
    
    // Despesas confirmadas (pagas)
    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate >= startDateStr && p.paymentDate <= endDateStr)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    
    // Despesas manuais confirmadas
    const manualConfirmedExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date >= startDateStr && e.date <= endDateStr)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    
    const totalExpenseConfirmed = confirmedExpense + manualConfirmedExpense;
    
    // Despesas pendentes - APENAS contas a pagar pendentes
    const totalExpensePending = allPayables
      .filter(p => p.status === "pending" && p.dueDate && p.dueDate >= startDateStr && p.dueDate <= endDateStr)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    
    // Calcular saldo inicial (ajustes de saldo do tipo 'initial')
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);
    const initialBalanceAdjustments = allBalanceAdjustments
      .filter(a => a.balanceType === 'initial' && a.date >= startDateStr && a.date <= endDateStr)
      .reduce((sum, a) => sum + parseFloat(a.amount?.toString() || "0"), 0);
    
    const todayData = cashFlowData.find(d => d.date === today.toISOString().split("T")[0]);
    
    // Novo cálculo do saldo projetado: Total Entradas + Entradas Pendentes - Total Saídas - Saídas Pendentes
    const totalAllIncome = totalIncomeConfirmed + totalIncomePending;
    const totalAllExpense = totalExpenseConfirmed + totalExpensePending;
    const projectedBalance = totalAllIncome - totalAllExpense;
    
    return {
      totalIncome: totalIncomeConfirmed + initialBalanceAdjustments, // Total Entradas = Saldo Inicial + Entradas Confirmadas
      totalExpense: totalExpenseConfirmed,
      netFlow: totalIncome - totalExpense,
      projectedBalance,
      currentBalance: stats.balance,
      initialBalance: initialBalanceAdjustments,
      finalBalance: totalIncomeConfirmed - totalExpenseConfirmed, // Saldo Final = Entradas Realizadas - Saídas Finalizadas
      totalIncomePending,
      totalExpensePending,
      totalIncomeConfirmed,
      totalExpenseConfirmed,
    };
  }

  async getCashFlowKPIs(period: string): Promise<CashFlowKPIs> {
    const cashFlowData = await this.getCashFlowData(period);
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    
    // Average balance
    const averageBalance = cashFlowData.reduce((sum, d) => sum + d.balance, 0) / cashFlowData.length;
    
    // Income vs Expense ratio
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);
    const incomeVsExpense = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    
    // Delinquency rate (overdue accounts)
    const today = new Date().toISOString().split("T")[0];
    const overduePayables = allPayables.filter(p => p.status !== "paid" && p.dueDate < today);
    const overdueReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate < today);
    const totalPayables = allPayables.filter(p => p.status !== "paid").length;
    const totalReceivables = allReceivables.filter(r => r.status !== "received").length;
    const delinquencyRate = (totalPayables + totalReceivables) > 0 ? 
      (overduePayables.length + overdueReceivables.length) / (totalPayables + totalReceivables) : 0;
    
    // Immediate liquidity (current balance / next 7 days expenses)
    const next7Days = cashFlowData.filter(d => !d.projected && d.date >= today).slice(0, 7);
    const next7DaysExpenses = next7Days.reduce((sum, d) => sum + d.expense, 0);
    const currentBalance = cashFlowData.find(d => d.date === today)?.balance || 0;
    const immediateLiquidity = next7DaysExpenses > 0 ? currentBalance / next7DaysExpenses : 1;
    
    // Burn rate (average daily expense)
    const dailyExpenses = cashFlowData.filter(d => !d.projected && d.expense > 0);
    const burnRate = dailyExpenses.length > 0 ? 
      dailyExpenses.reduce((sum, d) => sum + d.expense, 0) / dailyExpenses.length : 0;
    
    return {
      averageBalance,
      incomeVsExpense,
      delinquencyRate,
      immediateLiquidity,
      burnRate,
    };
  }

  async getCashFlowSummaryByDateRange(startDate: string, endDate: string): Promise<{ totalIncome: number; totalExpense: number; netFlow: number; projectedBalance: number; currentBalance: number; initialBalance: number; finalBalance: number; totalIncomePending: number; totalExpensePending: number; totalIncomeConfirmed: number; totalExpenseConfirmed: number }> {
    const cashFlowData = await this.getCashFlowDataByDateRange(startDate, endDate);
    const stats = await this.getDashboardStats();
    
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);
    
    // Calcular valores separados por status
    const allReceivables = await db.select().from(accountsReceivable);
    const allPayables = await db.select().from(accountsPayable);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);
    
    // Receitas confirmadas (recebidas)
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate >= startDate && r.receivedDate <= endDate)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
    
    // Receitas manuais confirmadas
    const manualConfirmedIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date >= startDate && e.date <= endDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    
    const totalIncomeConfirmed = confirmedIncome + manualConfirmedIncome;
    
    // Receitas pendentes - APENAS contas a receber pendentes
    const totalIncomePending = allReceivables
      .filter(r => r.status === "pending" && r.dueDate && r.dueDate >= startDate && r.dueDate <= endDate)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
    
    // Despesas confirmadas (pagas)
    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate >= startDate && p.paymentDate <= endDate)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    
    // Despesas manuais confirmadas
    const manualConfirmedExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date >= startDate && e.date <= endDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    
    const totalExpenseConfirmed = confirmedExpense + manualConfirmedExpense;
    
    // Despesas pendentes - APENAS contas a pagar pendentes
    const totalExpensePending = allPayables
      .filter(p => p.status === "pending" && p.dueDate && p.dueDate >= startDate && p.dueDate <= endDate)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    
    // Calcular saldo inicial (ajustes de saldo do tipo 'initial')
    const initialBalanceAdjustments = allBalanceAdjustments
      .filter(a => a.balanceType === 'initial' && a.date >= startDate && a.date <= endDate)
      .reduce((sum, a) => sum + parseFloat(a.amount?.toString() || "0"), 0);
    
    const today = new Date().toISOString().split("T")[0];
    const todayData = cashFlowData.find(d => d.date === today);
    
    // Novo cálculo do saldo projetado: Total Entradas + Entradas Pendentes - Total Saídas - Saídas Pendentes
    const totalAllIncome = totalIncomeConfirmed + totalIncomePending;
    const totalAllExpense = totalExpenseConfirmed + totalExpensePending;
    const projectedBalance = totalAllIncome - totalAllExpense;
    
    return {
      totalIncome: totalIncomeConfirmed + initialBalanceAdjustments, // Total Entradas = Saldo Inicial + Entradas Confirmadas
      totalExpense: totalExpenseConfirmed,
      netFlow: totalIncome - totalExpense,
      projectedBalance,
      currentBalance: stats.balance,
      initialBalance: initialBalanceAdjustments,
      finalBalance: totalIncomeConfirmed - totalExpenseConfirmed, // Saldo Final = Entradas Realizadas - Saídas Finalizadas
      totalIncomePending,
      totalExpensePending,
      totalIncomeConfirmed,
      totalExpenseConfirmed,
    };
  }

  async getCashFlowKPIsByDateRange(startDate: string, endDate: string): Promise<CashFlowKPIs> {
    const cashFlowData = await this.getCashFlowDataByDateRange(startDate, endDate);
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    
    // Average balance
    const averageBalance = cashFlowData.reduce((sum, d) => sum + d.balance, 0) / cashFlowData.length;
    
    // Income vs Expense ratio
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);
    const incomeVsExpense = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    
    // Delinquency rate (overdue accounts)
    const today = new Date().toISOString().split("T")[0];
    const overduePayables = allPayables.filter(p => p.status !== "paid" && p.dueDate < today);
    const overdueReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate < today);
    const totalPayables = allPayables.filter(p => p.status !== "paid").length;
    const totalReceivables = allReceivables.filter(r => r.status !== "received").length;
    const delinquencyRate = (totalPayables + totalReceivables) > 0 ? 
      (overduePayables.length + overdueReceivables.length) / (totalPayables + totalReceivables) : 0;
    
    // Immediate liquidity (current balance / next 7 days expenses)
    const next7Days = cashFlowData.filter(d => !d.projected && d.date >= today).slice(0, 7);
    const next7DaysExpenses = next7Days.reduce((sum, d) => sum + d.expense, 0);
    const currentBalance = cashFlowData.find(d => d.date === today)?.balance || 0;
    const immediateLiquidity = next7DaysExpenses > 0 ? currentBalance / next7DaysExpenses : 1;
    
    // Burn rate (average daily expense)
    const dailyExpenses = cashFlowData.filter(d => !d.projected && d.expense > 0);
    const burnRate = dailyExpenses.length > 0 ? 
      dailyExpenses.reduce((sum, d) => sum + d.expense, 0) / dailyExpenses.length : 0;
    
    return {
      averageBalance,
      incomeVsExpense,
      delinquencyRate,
      immediateLiquidity,
      burnRate,
    };
  }

  async getCashFlowAlerts(): Promise<CashFlowAlert[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    const cashFlowData = await this.getCashFlowData("daily");
    
    const alerts: CashFlowAlert[] = [];
    const today = new Date().toISOString().split("T")[0];
    
    // Check for negative balance
    const currentBalance = cashFlowData.find(d => d.date === today)?.balance || 0;
    if (currentBalance < 0) {
      alerts.push({
        id: "negative-balance",
        message: `Saldo negativo: R$ ${currentBalance.toFixed(2)}`,
        severity: "high",
        relatedId: null,
        type: "balance"
      });
    }
    
    // Check overdue payables
    const overduePayables = allPayables.filter(p => p.status !== "paid" && p.dueDate < today);
    if (overduePayables.length > 0) {
      const totalOverdue = overduePayables.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      alerts.push({
        id: "overdue-payables",
        message: `${overduePayables.length} contas a pagar vencidas (R$ ${totalOverdue.toFixed(2)})`,
        severity: "medium",
        relatedId: null,
        type: "payable"
      });
    }
    
    // Check late receivables
    const lateReceivables = allReceivables.filter(r => r.status !== "received" && r.dueDate < today);
    if (lateReceivables.length > 0) {
      const totalLate = lateReceivables.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
      alerts.push({
        id: "late-receivables",
        message: `${lateReceivables.length} contas a receber em atraso (R$ ${totalLate.toFixed(2)})`,
        severity: "medium",
        relatedId: null,
        type: "receivable"
      });
    }
    
    return alerts;
  }

    async getDailyMovements(date: string): Promise<DailyMovement[]> {
    console.log(`[DEBUG] getDailyMovements called for date: ${date}`);
    
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    const allCategories = await db.select().from(categories);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);
    
    console.log(`[DEBUG] Found ${allCashFlowEntries.length} cash flow entries`);
    console.log(`[DEBUG] Found ${allBalanceAdjustments.length} balance adjustments`);
    console.log(`[DEBUG] Cash flow entries:`, allCashFlowEntries.map(e => ({ id: e.id, date: e.date, type: e.type, description: e.description, amount: e.amount })));
    console.log(`[DEBUG] Balance adjustments:`, allBalanceAdjustments.map(a => ({ id: a.id, date: a.date, balanceType: a.balanceType, description: a.description, amount: a.amount })));
    
    const movements: DailyMovement[] = [];
    
    // Process balance adjustments first
    allBalanceAdjustments
      .filter(adjustment => adjustment.date === date)
      .forEach(adjustment => {
        movements.push({
          id: `balance-${adjustment.id}`,
          date,
          type: adjustment.balanceType === 'initial' ? 'income' : 'expense',
          movementType: adjustment.balanceType === 'initial' ? 'initial_balance' : 'balance_adjustment',
          description: `Ajuste de Saldo - ${adjustment.balanceType === 'initial' ? 'Inicial' : 'Final'}: ${adjustment.description}`,
          categoryId: '',
          categoryName: 'Ajuste de Saldo',
          amount: parseFloat(adjustment.amount?.toString() || "0"),
          paymentMethod: 'N/A',
          account: adjustment.account || 'Conta Principal',
          status: 'confirmed' as const,
          createdAt: adjustment.createdAt.toISOString(),
          competenceDate: undefined,
          subcategoryId: undefined,
          subcategoryName: undefined,
          grossAmount: undefined,
          fees: undefined,
          document: undefined,
          costCenter: undefined,
          recurrence: undefined,
          dueDate: undefined,
          actualDate: undefined,
        });
      });
    
    // Process receivables
    allReceivables
      .filter(r => (r.status === "received" && r.receivedDate === date) || (r.status === "pending" && r.dueDate === date))
      .forEach(r => {
        const category = allCategories.find(c => c.id === r.categoryId);
        movements.push({
          id: `receivable-${r.id}`,
          date,
          type: 'income',
          movementType: 'normal',
          description: r.description,
          categoryId: r.categoryId || '',
          categoryName: category?.name || 'Sem categoria',
          amount: parseFloat(r.amount || "0"),
          paymentMethod: 'N/A', // Receivables don't have paymentMethod field
          account: 'Conta Principal',
          status: r.status === "received" ? 'confirmed' : 'pending',
          createdAt: new Date().toISOString(),
          competenceDate: undefined,
          subcategoryId: undefined,
          subcategoryName: undefined,
          grossAmount: undefined,
          fees: undefined,
          document: undefined,
          costCenter: undefined,
          recurrence: undefined,
          dueDate: r.dueDate || undefined,
          actualDate: r.receivedDate || undefined,
        });
      });

    // Process payables
    allPayables
      .filter(p => (p.status === "paid" && p.paymentDate === date) || (p.status === "pending" && p.dueDate === date))
      .forEach(p => {
        const category = allCategories.find(c => c.id === p.categoryId);
        movements.push({
          id: `payable-${p.id}`,
          date,
          type: 'expense',
          movementType: 'normal',
          description: p.description,
          categoryId: p.categoryId || '',
          categoryName: category?.name || 'Sem categoria',
          amount: parseFloat(p.amount || "0"),
          paymentMethod: p.paymentMethod || 'N/A',
          account: 'Conta Principal',
          status: p.status === "paid" ? 'confirmed' : 'pending',
          createdAt: new Date().toISOString(),
          competenceDate: undefined,
          subcategoryId: undefined,
          subcategoryName: undefined,
          grossAmount: undefined,
          fees: undefined,
          document: undefined,
          costCenter: undefined,
          recurrence: undefined,
          dueDate: p.dueDate || undefined,
          actualDate: p.paymentDate || undefined,
        });
      });

    // Process manual cash flow entries
    const manualEntries = allCashFlowEntries.filter(entry => entry.date === date);
    console.log(`[DEBUG] Found ${manualEntries.length} manual entries for date ${date}`);
    
    manualEntries.forEach(entry => {
      const category = allCategories.find(c => c.id === entry.categoryId);
      const movement = {
        id: `manual-${entry.id}`,
        date,
        competenceDate: entry.competenceDate || undefined,
        type: entry.type as 'income' | 'expense',
        movementType: (entry.movementType as 'normal' | 'balance_adjustment' | 'withdrawal' | 'initial_balance') || 'normal',
        description: entry.description,
        categoryId: entry.categoryId || '',
        categoryName: category?.name || 'Sem categoria',
        subcategoryId: entry.subcategoryId || undefined,
        subcategoryName: entry.subcategoryId ? allCategories.find(c => c.id === entry.subcategoryId)?.name : undefined,
        amount: parseFloat(entry.amount?.toString() || "0"),
        grossAmount: entry.grossAmount ? parseFloat(entry.grossAmount.toString()) : undefined,
        fees: entry.fees ? parseFloat(entry.fees.toString()) : undefined,
        paymentMethod: entry.paymentMethod || 'N/A',
        account: entry.account || 'Conta Principal',
        status: entry.status as 'confirmed' | 'pending' | 'overdue',
        document: entry.document || undefined,
        costCenter: entry.costCenter || undefined,
        recurrence: entry.recurrence || undefined,
        dueDate: entry.dueDate || undefined,
        actualDate: entry.actualDate || undefined,
        createdAt: entry.createdAt.toISOString(),
      };
      console.log(`[DEBUG] Adding manual movement:`, movement);
      movements.push(movement);
    });
    
    console.log(`[DEBUG] Total movements: ${movements.length}`);
    return movements.sort((a, b) => a.type.localeCompare(b.type));
  }

  async getMovementsByPeriod(period: string): Promise<DailyMovement[]> {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "daily") {
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (period === "weekly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 28);
      endDate = new Date(today);
    } else if (period === "monthly") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      endDate = new Date(today);
    } else {
      // Default to daily
      startDate = new Date(today);
      endDate = new Date(today);
    }

    return this.getMovementsByDateRange(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    );
  }

  async getMovementsByDateRange(startDate: string, endDate: string): Promise<DailyMovement[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    const allCategories = await db.select().from(categories);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    const allBalanceAdjustments = await db.select().from(balanceAdjustments);

    const movements: DailyMovement[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Process each date in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      // Process balance adjustments
      allBalanceAdjustments
        .filter(adjustment => adjustment.date === dateStr)
        .forEach(adjustment => {
          movements.push({
            id: `balance-${adjustment.id}`,
            date: dateStr,
            type: adjustment.balanceType === 'initial' ? 'income' : 'expense',
            movementType: adjustment.balanceType === 'initial' ? 'initial_balance' : 'balance_adjustment',
            description: `Ajuste de Saldo - ${adjustment.balanceType === 'initial' ? 'Inicial' : 'Final'}: ${adjustment.description}`,
            categoryId: '',
            categoryName: 'Ajuste de Saldo',
            amount: parseFloat(adjustment.amount?.toString() || "0"),
            paymentMethod: 'N/A',
            account: adjustment.account || 'Conta Principal',
            status: 'confirmed' as const,
            createdAt: adjustment.createdAt.toISOString(),
            competenceDate: undefined,
            subcategoryId: undefined,
            subcategoryName: undefined,
            grossAmount: undefined,
            fees: undefined,
            document: undefined,
            costCenter: undefined,
            recurrence: undefined,
            dueDate: undefined,
            actualDate: undefined,
          });
        });

      // Process receivables
      allReceivables
        .filter(r => (r.status === "received" && r.receivedDate === dateStr) || (r.status === "pending" && r.dueDate === dateStr))
        .forEach(r => {
          const category = allCategories.find(c => c.id === r.categoryId);
          movements.push({
            id: `receivable-${r.id}`,
            date: dateStr,
            type: 'income',
            movementType: 'normal',
            description: r.description,
            categoryId: r.categoryId || '',
            categoryName: category?.name || 'Sem categoria',
            amount: parseFloat(r.amount || "0"),
            paymentMethod: 'N/A',
            account: 'Conta Principal',
            status: r.status === "received" ? 'confirmed' : 'pending',
            createdAt: new Date().toISOString(),
            competenceDate: undefined,
            subcategoryId: undefined,
            subcategoryName: undefined,
            grossAmount: undefined,
            fees: undefined,
            document: undefined,
            costCenter: undefined,
            recurrence: undefined,
            dueDate: r.dueDate || undefined,
            actualDate: r.receivedDate || undefined,
          });
        });

      // Process payables
      allPayables
        .filter(p => (p.status === "paid" && p.paymentDate === dateStr) || (p.status === "pending" && p.dueDate === dateStr))
        .forEach(p => {
          const category = allCategories.find(c => c.id === p.categoryId);
          movements.push({
            id: `payable-${p.id}`,
            date: dateStr,
            type: 'expense',
            movementType: 'normal',
            description: p.description,
            categoryId: p.categoryId || '',
            categoryName: category?.name || 'Sem categoria',
            amount: parseFloat(p.amount || "0"),
            paymentMethod: p.paymentMethod || 'N/A',
            account: 'Conta Principal',
            status: p.status === "paid" ? 'confirmed' : 'pending',
            createdAt: new Date().toISOString(),
            competenceDate: undefined,
            subcategoryId: undefined,
            subcategoryName: undefined,
            grossAmount: undefined,
            fees: undefined,
            document: undefined,
            costCenter: undefined,
            recurrence: undefined,
            dueDate: p.dueDate || undefined,
            actualDate: p.paymentDate || undefined,
          });
        });

      // Process manual cash flow entries
      allCashFlowEntries
        .filter(entry => entry.date === dateStr)
        .forEach(entry => {
          const category = allCategories.find(c => c.id === entry.categoryId);
          const subcategory = allCategories.find(c => c.id === entry.subcategoryId);
          movements.push({
            id: entry.id,
            date: dateStr,
            type: entry.type,
            movementType: entry.movementType,
            description: entry.description,
            categoryId: entry.categoryId || '',
            categoryName: category?.name || 'Sem categoria',
            subcategoryId: entry.subcategoryId || undefined,
            subcategoryName: subcategory?.name || undefined,
            amount: parseFloat(entry.amount?.toString() || "0"),
            grossAmount: entry.grossAmount ? parseFloat(entry.grossAmount.toString()) : undefined,
            fees: entry.fees ? parseFloat(entry.fees.toString()) : undefined,
            paymentMethod: entry.paymentMethod,
            account: entry.account,
            status: entry.status,
            document: entry.document || undefined,
            costCenter: entry.costCenter || undefined,
            recurrence: entry.recurrence || undefined,
            competenceDate: entry.competenceDate || undefined,
            dueDate: entry.dueDate || undefined,
            actualDate: entry.actualDate || undefined,
            createdAt: entry.createdAt.toISOString(),
          });
        });
    }

    return movements.sort((a, b) => {
      // Sort by date first, then by type
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.type.localeCompare(b.type);
    });
  }

  async createCashFlowEntry(entry: InsertCashFlowEntry & { userId: string }): Promise<CashFlowEntry> {
    const [newEntry] = await db.insert(cashFlowEntries).values({
      ...entry,
      amount: entry.amount,
    }).returning();
    return newEntry;
  }

  async getCashFlowEntries(): Promise<CashFlowEntry[]> {
    return await db.select().from(cashFlowEntries);
  }

  async getCashFlowDataByDateRange(startDate: string, endDate: string): Promise<CashFlowData[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allReceivables = await db.select().from(accountsReceivable);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    
    const data: Map<string, CashFlowData> = new Map();
    let runningBalance = 0;
    
    // Calculate initial balance before start date
    const confirmedIncome = allReceivables
      .filter(r => r.status === "received" && r.receivedDate && r.receivedDate < startDate)
      .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
      
    const confirmedExpense = allPayables
      .filter(p => p.status === "paid" && p.paymentDate && p.paymentDate < startDate)
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      
    const manualIncome = allCashFlowEntries
      .filter(e => e.type === "income" && e.status === "confirmed" && e.date < startDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
    const manualExpense = allCashFlowEntries
      .filter(e => e.type === "expense" && e.status === "confirmed" && e.date < startDate)
      .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    
    runningBalance = confirmedIncome - confirmedExpense + manualIncome - manualExpense;
    
    // Generate data for each day in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      
      const dayIncome = allReceivables
        .filter(r => (r.status === "received" ? r.receivedDate === dateStr : r.dueDate === dateStr))
        .reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
        
      const manualDayIncome = allCashFlowEntries
        .filter(e => e.type === "income" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
      const totalDayIncome = dayIncome + manualDayIncome;
      
      const dayExpense = allPayables
        .filter(p => (p.status === "paid" ? p.paymentDate === dateStr : p.dueDate === dateStr))
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
        
      const manualDayExpense = allCashFlowEntries
        .filter(e => e.type === "expense" && e.date === dateStr)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
      const totalDayExpense = dayExpense + manualDayExpense;
      
      const dayInitialBalance = runningBalance;
      runningBalance += totalDayIncome - totalDayExpense;
      const dayFinalBalance = runningBalance;
      
      data.set(dateStr, {
        date: dateStr,
        income: totalDayIncome,
        expense: totalDayExpense,
        balance: runningBalance,
        projected: false,
        initialBalance: dayInitialBalance,
        finalBalance: dayFinalBalance,
      });
    }
    
    return Array.from(data.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCategoryExpensesByDateRange(startDate: string, endDate: string): Promise<CategoryExpense[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allCashFlowEntries = await db.select().from(cashFlowEntries);
    const allCategories = await db.select().from(categories);
    
    // Filter by date range
    const filteredPayables = allPayables.filter(p => {
      const date = p.paymentDate || p.dueDate;
      return date >= startDate && date <= endDate;
    });
    
    const filteredCashFlowEntries = allCashFlowEntries.filter(e => 
      e.type === "expense" && e.date >= startDate && e.date <= endDate
    );
    
    const expenseCategories = allCategories.filter(c => c.type === "expense");
    
    // Calculate total for percentage
    const payablesTotal = filteredPayables.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    const cashFlowTotal = filteredCashFlowEntries.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    const total = payablesTotal + cashFlowTotal;
    
    return expenseCategories.map(cat => {
      const payablesAmount = filteredPayables
        .filter(p => p.categoryId === cat.id)
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
        
      const cashFlowAmount = filteredCashFlowEntries
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      
      const amount = payablesAmount + cashFlowAmount;
      
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    }).filter(c => c.amount > 0);
  }

  async getCategoryExpenses(): Promise<CategoryExpense[]> {
    const allPayables = await db.select().from(accountsPayable);
    const allCategories = await db.select().from(categories);
    
    const expenseCategories = allCategories.filter(c => c.type === "expense");
    const payablesWithCategory = allPayables.filter(p => p.categoryId);
    
    const total = payablesWithCategory.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
    
    return expenseCategories.map(cat => {
      const amount = payablesWithCategory
        .filter(p => p.categoryId === cat.id)
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    }).filter(c => c.amount > 0);
  }

  async getDREData(year: number, month: number): Promise<{ current: DREData; previous: DREData; percentageChange: { grossRevenue: number; netProfit: number } }> {
    const allReceivables = await db.select().from(accountsReceivable);
    const allPayables = await db.select().from(accountsPayable);
    const allCategories = await db.select().from(categories);

    const calculateDRE = (y: number, m: number): DREData => {
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0);
      const startStr = monthStart.toISOString().split("T")[0];
      const endStr = monthEnd.toISOString().split("T")[0];

      const monthReceivables = allReceivables.filter(r => {
        const dateStr = r.receivedDate || r.dueDate;
        return dateStr >= startStr && dateStr <= endStr;
      });

      const monthPayables = allPayables.filter(p => {
        const dateStr = p.paymentDate || p.dueDate;
        return dateStr >= startStr && dateStr <= endStr;
      });

      let grossRevenue = 0;
      let deductions = 0;
      let costs = 0;
      let operationalExpenses = 0;

      monthReceivables.forEach(r => {
        const cat = allCategories.find(c => c.id === r.categoryId);
        const amount = parseFloat(r.amount || "0");
        if (cat?.dreCategory === "revenue") grossRevenue += amount;
        if (cat?.dreCategory === "deductions") deductions += amount;
      });

      monthPayables.forEach(p => {
        const cat = allCategories.find(c => c.id === p.categoryId);
        const amount = parseFloat(p.amount || "0");
        if (cat?.dreCategory === "costs") costs += amount;
        if (cat?.dreCategory === "operational_expenses") operationalExpenses += amount;
      });

      const netRevenue = grossRevenue - deductions;
      const grossProfit = netRevenue - costs;
      const operationalProfit = grossProfit - operationalExpenses;
      const netProfit = operationalProfit;
      const contributionMargin = netRevenue - costs;

      return {
        grossRevenue,
        deductions,
        netRevenue,
        costs,
        grossProfit,
        operationalExpenses,
        operationalProfit,
        netProfit,
        contributionMargin,
        ebitda: operationalProfit,
        irpj: 0,
        csll: 0,
        pis: 0,
        cofins: 0,
        otherTaxes: 0,
        depreciation: 0,
        amortization: 0,
        financialResult: 0,
        profitBeforeTax: operationalProfit,
        taxExpense: 0,
        netIncome: operationalProfit,
      };
    };

    const current = calculateDRE(year, month);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previous = calculateDRE(prevYear, prevMonth);

    return {
      current,
      previous,
      percentageChange: {
        grossRevenue: previous.grossRevenue > 0 ? ((current.grossRevenue - previous.grossRevenue) / previous.grossRevenue) * 100 : 0,
        netProfit: previous.netProfit !== 0 ? ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100 : 0,
      },
    };
  }

  async createBalanceAdjustment(entry: InsertBalanceAdjustment & { userId: string }): Promise<BalanceAdjustment> {
    const [newAdjustment] = await db.insert(balanceAdjustments).values({
      ...entry,
      amount: entry.amount,
    }).returning();
    return newAdjustment;
  }

  async getBalanceAdjustments(date?: string): Promise<BalanceAdjustment[]> {
    if (date) {
      return await db
        .select()
        .from(balanceAdjustments)
        .where(eq(balanceAdjustments.date, date));
    }
    return await db.select().from(balanceAdjustments);
  }
}

export const storage = new DatabaseStorage();
