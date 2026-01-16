import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireFinancial, requireViewer } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Legacy local auth routes disabled - moving to Supabase Auth
  /*
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Credenciais inválidas" });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } });
      });
    })(req, res, next);
  });
  */

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    res.json({
      user: {
        id: req.user!.id,
        fullName: req.user!.fullName,
        role: req.user!.role,
        status: req.user!.status,
        team: req.user!.team
      }
    });
  });

  /*
  app.post("/api/auth/register", async (req, res) => {
    // Disabled registration via this endpoint for now
    res.status(501).json({ error: "Registration disabled in favor of Supabase Auth" });
  });
  */

  app.get("/api/users", requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(u => ({ id: u.id, fullName: u.fullName, role: u.role, status: u.status, team: u.team })));
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    const data = req.body;
    const user = await storage.updateUser(req.params.id, data);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ id: user.id, fullName: user.fullName, role: user.role, status: user.status, team: user.team });
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    if (req.user!.id === req.params.id) {
      return res.status(400).json({ error: "Você não pode excluir sua própria conta" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

  app.get("/api/suppliers", requireViewer, async (req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", requireViewer, async (req, res) => {
    const supplier = await storage.getSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Fornecedor não encontrado" });
    res.json(supplier);
  });

  app.post("/api/suppliers", requireFinancial, async (req, res) => {
    const supplier = await storage.createSupplier(req.body);
    res.status(201).json(supplier);
  });

  app.patch("/api/suppliers/:id", requireFinancial, async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: "Not found" });
    res.json(supplier);
  });

  app.patch("/api/suppliers/:id/deactivate", requireFinancial, async (req, res) => {
    const supplier = await storage.deactivateSupplier(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Not found" });
    res.json(supplier);
  });

  app.get("/api/clients", requireViewer, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get("/api/clients/:id", requireViewer, async (req, res) => {
    const client = await storage.getClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(client);
  });

  app.post("/api/clients", requireFinancial, async (req, res) => {
    const client = await storage.createClient(req.body);
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireFinancial, async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body);
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json(client);
  });

  app.delete("/api/clients/:id", requireFinancial, async (req, res) => {
    await storage.deleteClient(req.params.id);
    res.status(204).send();
  });

  app.get("/api/categories", requireViewer, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    const category = await storage.createCategory(req.body);
    res.status(201).json(category);
  });

  app.patch("/api/categories/:id", requireAdmin, async (req, res) => {
    const category = await storage.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: "Not found" });
    res.json(category);
  });

  app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.status(204).send();
  });

  app.get("/api/cost-centers", requireViewer, async (req, res) => {
    const costCenters = await storage.getCostCenters();
    res.json(costCenters);
  });

  app.post("/api/cost-centers", requireAdmin, async (req, res) => {
    const costCenter = await storage.createCostCenter(req.body);
    res.status(201).json(costCenter);
  });

  app.patch("/api/cost-centers/:id", requireAdmin, async (req, res) => {
    const costCenter = await storage.updateCostCenter(req.params.id, req.body);
    if (!costCenter) return res.status(404).json({ error: "Not found" });
    res.json(costCenter);
  });

  app.delete("/api/cost-centers/:id", requireAdmin, async (req, res) => {
    await storage.deleteCostCenter(req.params.id);
    res.status(204).send();
  });

  app.get("/api/accounts-payable", requireViewer, async (req, res) => {
    const accounts = await storage.getAccountsPayable();
    res.json(accounts);
  });

  app.get("/api/accounts-payable/upcoming", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const upcoming = await storage.getUpcomingAccountsPayable(startDate, endDate);
    res.json(upcoming);
  });

  app.post("/api/accounts-payable", requireFinancial, async (req, res) => {
    try {
      console.log("POST /api/accounts-payable", JSON.stringify(req.body));
      const account = await storage.createAccountPayable(req.body);
      res.status(201).json(account);
    } catch (err) {
      res.status(400).json({ error: "Erro ao criar conta a pagar" });
    }
  });

  app.patch("/api/accounts-payable/:id", requireFinancial, async (req, res) => {
    const account = await storage.updateAccountPayable(req.params.id, req.body);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.patch("/api/accounts-payable/:id/pay", requireFinancial, async (req, res) => {
    const account = await storage.markAccountPayableAsPaid(req.params.id, req.body.paymentDate, req.body.lateFees, req.body.discount);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.delete("/api/accounts-payable/:id", requireFinancial, async (req, res) => {
    await storage.deleteAccountPayable(req.params.id);
    res.status(204).send();
  });

  app.patch("/api/accounts-payable/:id/deactivate", requireFinancial, async (req, res) => {
    const account = await storage.deactivateAccountPayable(req.params.id);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.get("/api/accounts-receivable", requireViewer, async (req, res) => {
    const accounts = await storage.getAccountsReceivable();
    res.json(accounts);
  });

  app.get("/api/accounts-receivable/upcoming", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const upcoming = await storage.getUpcomingAccountsReceivable(startDate, endDate);
    res.json(upcoming);
  });

  app.post("/api/accounts-receivable", requireFinancial, async (req, res) => {
    const account = await storage.createAccountReceivable(req.body);
    res.status(201).json(account);
  });

  app.patch("/api/accounts-receivable/:id", requireFinancial, async (req, res) => {
    const account = await storage.updateAccountReceivable(req.params.id, req.body);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.patch("/api/accounts-receivable/:id/receive", requireFinancial, async (req, res) => {
    const account = await storage.markAccountReceivableAsReceived(req.params.id, req.body.receivedDate, req.body.discount, req.body.paymentMethod);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  });

  app.delete("/api/accounts-receivable/:id", requireFinancial, async (req, res) => {
    await storage.deleteAccountReceivable(req.params.id);
    res.status(204).send();
  });

  app.get("/api/dashboard/stats", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const stats = await storage.getDashboardStats(startDate, endDate);
    res.json(stats);
  });

  app.get("/api/dashboard/cash-flow", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const data = await storage.getCashFlowDataByDateRange(startDate, endDate);
    res.json(data);
  });

  app.get("/api/dashboard/category-expenses", requireViewer, async (req, res) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const data = await storage.getCategoryExpensesByDateRange(startDate, endDate);
    res.json(data);
  });

  app.get("/api/cash-flow", requireViewer, async (req, res) => {
    const period = (req.query.period as string) || "daily";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let data;
    if (startDate && endDate) {
      data = await storage.getCashFlowDataByDateRange(startDate, endDate);
    } else {
      data = await storage.getCashFlowData(period);
    }
    res.json(data);
  });

  app.get("/api/cash-flow/summary", requireViewer, async (req, res) => {
    const period = (req.query.period as string) || "daily";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let summary;
    if (startDate && endDate) {
      summary = await storage.getCashFlowSummaryByDateRange(startDate, endDate);
    } else {
      summary = await storage.getCashFlowSummary(period);
    }
    res.json(summary);
  });

  app.get("/api/cash-flow/kpis", requireViewer, async (req, res) => {
    const period = (req.query.period as string) || "daily";
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let kpis;
    if (startDate && endDate) {
      kpis = await storage.getCashFlowKPIsByDateRange(startDate, endDate);
    } else {
      kpis = await storage.getCashFlowKPIs(period);
    }
    res.json(kpis);
  });

  app.get("/api/cash-flow/alerts", requireViewer, async (req, res) => {
    const alerts = await storage.getCashFlowAlerts();
    res.json(alerts);
  });

  app.get("/api/cash-flow/movements/:date", requireViewer, async (req, res) => {
    const { date } = req.params;
    const movements = await storage.getDailyMovements(date);
    res.json(movements);
  });

  app.get("/api/cash-flow/movements", requireViewer, async (req, res) => {
    const date = req.query.date as string;
    const period = req.query.period as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let movements;
    if (startDate && endDate) {
      movements = await storage.getMovementsByDateRange(startDate, endDate);
    } else if (period) {
      movements = await storage.getMovementsByPeriod(period);
    } else if (date) {
      movements = await storage.getDailyMovements(date);
    } else {
      // Default to today's movements
      const today = new Date().toISOString().split("T")[0];
      movements = await storage.getDailyMovements(today);
    }
    res.json(movements);
  });

  app.post("/api/cash-flow/entries", requireFinancial, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      console.log("Creating cash flow entry with body:", req.body);
      const entry = await storage.createCashFlowEntry({ ...req.body, userId });
      res.json(entry);
    } catch (error: any) {
      console.error("Error creating cash flow entry:", error);
      res.status(400).json({ error: "Erro ao criar movimentação", details: error.message });
    }
  });

  app.get("/api/cash-flow/entries", requireViewer, async (req, res) => {
    const entries = await storage.getCashFlowEntries();
    res.json(entries);
  });

  app.post("/api/balance-adjustments", requireFinancial, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const adjustment = await storage.createBalanceAdjustment({ ...req.body, userId });
      res.json(adjustment);
    } catch (error) {
      console.error("Error creating balance adjustment:", error);
      res.status(400).json({ error: "Erro ao criar ajuste de saldo" });
    }
  });

  app.get("/api/balance-adjustments", requireViewer, async (req, res) => {
    const date = req.query.date as string;
    const adjustments = await storage.getBalanceAdjustments(date);
    res.json(adjustments);
  });

  app.get("/api/dre", requireViewer, async (req, res) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const data = await storage.getDREData(year, month);
    res.json(data);
  });

  app.get("/api/notes", requireViewer, async (req, res) => {
    const notes = await storage.getNotes();
    res.json(notes);
  });

  app.post("/api/notes", requireFinancial, async (req, res) => {
    const note = await storage.createNote(req.body);
    res.status(201).json(note);
  });

  app.patch("/api/notes/:id", requireFinancial, async (req, res) => {
    const note = await storage.updateNote(req.params.id, req.body);
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  });

  app.delete("/api/notes/:id", requireFinancial, async (req, res) => {
    await storage.deleteNote(req.params.id);
    res.status(204).send();
  });

  app.get("/api/financial-goals", requireViewer, async (req, res) => {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const goals = await storage.getFinancialGoals(month, year);
    res.json(goals);
  });

  app.post("/api/financial-goals", requireFinancial, async (req, res) => {
    try {
      console.log("POST /api/financial-goals", JSON.stringify(req.body));
      const goal = await storage.createFinancialGoal(req.body);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(400).json({ error: "Erro ao criar meta" });
    }
  });

  app.patch("/api/financial-goals/:id", requireFinancial, async (req, res) => {
    const goal = await storage.updateFinancialGoal(req.params.id, req.body);
    if (!goal) return res.status(404).json({ error: "Not found" });
    res.json(goal);
  });

  app.delete("/api/financial-goals/:id", requireFinancial, async (req, res) => {
    await storage.deleteFinancialGoal(req.params.id);
    res.status(204).send();
  });

  app.get("/api/financial-goals/progress", requireViewer, async (req, res) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const progress = await storage.getFinancialGoalsProgress(month, year);
    res.json(progress);
  });

  app.get("/api/reports/:type", requireViewer, async (req, res) => {
    const { type } = req.params;
    const { format, month, year } = req.query;

    res.json({
      message: `Report ${type} requested in ${format} format for ${month}/${year}`,
      note: "PDF/Excel generation requires additional libraries",
    });
  });

  return httpServer;
}
