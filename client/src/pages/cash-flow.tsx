import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Target,
  Activity,
  DollarSign,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CashFlowData, CashFlowKPIs, CashFlowAlert, DailyMovement } from "@shared/schema";

export default function CashFlow() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [period, setPeriod] = useState("daily");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  });
  const [useDateRange, setUseDateRange] = useState(false);
  const [activeTab, setActiveTab] = useState("transaction");
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const queryClient = useQueryClient();

  const { data: cashFlowData, isLoading } = useQuery<CashFlowData[]>({
    queryKey: ["/api/cash-flow", useDateRange ? { startDate, endDate } : period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useDateRange) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      const response = await fetch(`/api/cash-flow?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar dados do fluxo de caixa");
      return response.json();
    },
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<CashFlowSummary>({
    queryKey: ["/api/cash-flow/summary", useDateRange ? { startDate, endDate } : period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useDateRange) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      const response = await fetch(`/api/cash-flow/summary?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar resumo do fluxo de caixa");
      return response.json();
    },
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery<CashFlowKPIs>({
    queryKey: ["/api/cash-flow/kpis", useDateRange ? { startDate, endDate } : period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useDateRange) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      const response = await fetch(`/api/cash-flow/kpis?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar KPIs do fluxo de caixa");
      return response.json();
    },
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<CashFlowAlert[]>({
    queryKey: ["/api/cash-flow/alerts"],
  });

  const { data: movements, isLoading: movementsLoading } = useQuery<DailyMovement[]>({
    queryKey: ["/api/cash-flow/movements", useDateRange ? { startDate, endDate } : period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useDateRange) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      const response = await fetch(`/api/cash-flow/movements?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar movimentações");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entry: {
      date: string;
      competenceDate?: string;
      type: 'income' | 'expense';
      description: string;
      categoryId: string;
      subcategoryId?: string;
      amount: number;
      grossAmount?: number;
      fees?: number;
      paymentMethod: string;
      account: string;
      status: 'confirmed' | 'pending' | 'overdue';
      document?: string;
      costCenter?: string;
      recurrence?: string;
      dueDate?: string;
      actualDate?: string;
    }) => {
      const response = await fetch("/api/cash-flow/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error("Erro ao criar movimentação");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      setIsDialogOpen(false);
    },
  });

  const createBalanceAdjustmentMutation = useMutation({
    mutationFn: async (entry: {
      date: string;
      balanceType: 'initial' | 'final';
      description: string;
      amount: number;
      account: string;
    }) => {
      const response = await fetch("/api/balance-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error("Erro ao criar ajuste de saldo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      setIsDialogOpen(false);
    },
  });

  const getChartData = () => {
    if (!cashFlowData) return [];
    return cashFlowData;
  };

  const chartData = getChartData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Realizado";
      case "pending":
        return "Previsto";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setUseDateRange(true);
  };

  const setPeriodFilter = (newPeriod: string) => {
    setPeriod(newPeriod);
    setUseDateRange(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Gestão financeira completa com sistema brasileiro
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Filtros de Período</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Períodos Pré-definidos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant={!useDateRange && period === "daily" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriodFilter("daily")}
                    >
                      Diário (7 dias)
                    </Button>
                    <Button
                      variant={!useDateRange && period === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriodFilter("weekly")}
                    >
                      Semanal (28 dias)
                    </Button>
                    <Button
                      variant={!useDateRange && period === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriodFilter("monthly")}
                    >
                      Mensal (90 dias)
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Períodos Rápidos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setDateRange(7)}>
                      Últimos 7 dias
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange(30)}>
                      Últimos 30 dias
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange(90)}>
                      Últimos 90 dias
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Data Inicial</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setUseDateRange(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Data Final</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setUseDateRange(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Saldo Inicial</p>
                <p className="text-2xl font-bold text-blue-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.initialBalance || 0)
                  )}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Entradas</p>
                <p className="text-2xl font-bold text-green-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.totalIncome || 0)
                  )}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Entradas Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.totalIncomePending || 0)
                  )}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Saídas</p>
                <p className="text-2xl font-bold text-red-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.totalExpense || 0)
                  )}
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Saídas Pendentes</p>
                <p className="text-2xl font-bold text-orange-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.totalExpensePending || 0)
                  )}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Saldo Final</p>
                <p className="text-2xl font-bold text-purple-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.finalBalance || 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Saldo Projetado</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(summary?.projectedBalance || 0)
                  )}
                </p>
              </div>
              <Target className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Indicadores Chave (KPIs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : kpis ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Médio</p>
                  <p className="text-xl font-bold">{formatCurrency(kpis.averageBalance)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Índice Entradas/Saídas</p>
                  <p className="text-xl font-bold">{kpis.incomeVsExpense.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Inadimplência</p>
                  <p className="text-xl font-bold">{kpis.delinquencyRate.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Liquidez Imediata</p>
                  <p className="text-xl font-bold">{kpis.immediateLiquidity.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Burn Rate</p>
                  <p className="text-xl font-bold">{formatCurrency(kpis.burnRate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Sem dados disponíveis</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {alert.severity === 'high' ? 'Alto' :
                          alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum alerta no momento</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa - Tendência</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px]" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2" />
                <div>Sem dados para exibir</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px]" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Entradas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Saídas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2" />
                <div>Sem dados para exibir</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Movements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Movimentações Diárias</span>
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Lançamento Financeiro</DialogTitle>
                  </DialogHeader>

                  <Tabs defaultValue="transaction" className="w-full" onValueChange={(val) => setActiveTab(val)}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="transaction">Movimentação</TabsTrigger>
                      <TabsTrigger value="adjustment">Ajuste de Saldo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transaction" className="space-y-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);

                          const entry = {
                            date: formData.get("date") as string,
                            competenceDate: formData.get("competenceDate") as string || undefined,
                            type: transactionType,
                            movementType: "normal" as const,
                            description: formData.get("description") as string,
                            categoryId: formData.get("categoryId") as string,
                            subcategoryId: formData.get("subcategoryId") as string || undefined,
                            amount: parseFloat(formData.get("amount") as string),
                            grossAmount: formData.get("grossAmount") ? parseFloat(formData.get("grossAmount") as string) : undefined,
                            fees: formData.get("fees") ? parseFloat(formData.get("fees") as string) : undefined,
                            paymentMethod: formData.get("paymentMethod") as string,
                            account: formData.get("account") as string,
                            status: formData.get("status") as 'confirmed' | 'pending' | 'overdue',
                            document: formData.get("document") as string || undefined,
                            costCenter: formData.get("costCenter") as string || undefined,
                            recurrence: formData.get("recurrence") as string || undefined,
                            dueDate: formData.get("dueDate") as string || undefined,
                            actualDate: formData.get("actualDate") as string || undefined,
                          };
                          createEntryMutation.mutate(entry);
                        }}
                        className="space-y-4"
                      >
                        {/* Transaction Type Toggle */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <Button
                            type="button"
                            variant={transactionType === 'income' ? 'default' : 'ghost'}
                            className={`flex-1 ${transactionType === 'income' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                            onClick={() => setTransactionType('income')}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Entrada
                          </Button>
                          <Button
                            type="button"
                            variant={transactionType === 'expense' ? 'default' : 'ghost'}
                            className={`flex-1 ${transactionType === 'expense' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                            onClick={() => setTransactionType('expense')}
                          >
                            <TrendingDown className="mr-2 h-4 w-4" />
                            Saída
                          </Button>
                        </div>

                        {/* Amount */}
                        <div>
                          <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">Valor (R$)</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="text-2xl font-bold h-12"
                            required
                            autoFocus
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <Label htmlFor="description">Descrição</Label>
                          <Input
                            id="description"
                            name="description"
                            placeholder={transactionType === 'income' ? "Ex: Venda de Serviços, Reembolso" : "Ex: Conta de Luz, Material de Escritório"}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Categoria</Label>
                            <Select name="categoryId" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.filter(c => c.type === transactionType).map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="date">Data</Label>
                            <Input
                              id="date"
                              name="date"
                              type="date"
                              defaultValue={new Date().toISOString().split("T")[0]}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="account">Conta/Caixa</Label>
                            <Input
                              id="account"
                              name="account"
                              defaultValue="Caixa Principal"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="paymentMethod">Pagamento</Label>
                            <Select name="paymentMethod" defaultValue="pix" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="money">Dinheiro</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                <SelectItem value="boleto">Boleto</SelectItem>
                                <SelectItem value="transfer">Transferência</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Collapsible Advanced Options */}
                        <div className="border rounded-lg p-3 space-y-3">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full flex justify-between items-center h-auto p-0 hover:bg-transparent"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                          >
                            <span className="text-sm font-medium">Opções Avançadas</span>
                            {showAdvanced ? (
                              <ArrowUpRight className="h-4 w-4 transform rotate-45" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>

                          {showAdvanced && (
                            <div className="space-y-4 pt-2 border-t">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="status">Status</Label>
                                  <Select name="status" defaultValue="confirmed">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="confirmed">Realizado</SelectItem>
                                      <SelectItem value="pending">Agendado</SelectItem>
                                      <SelectItem value="overdue">Atrasado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="competenceDate">Data Competência</Label>
                                  <Input type="date" name="competenceDate" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="subcategoryId">Subcategoria</Label>
                                  <Select name="subcategoryId">
                                    <SelectTrigger>
                                      <SelectValue placeholder="Opcional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories?.filter(c => c.type === transactionType).map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                          {category.name} (Sub)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="document">Documento/NF</Label>
                                  <Input name="document" placeholder="Nº Documento" />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label htmlFor="grossAmount" className="text-xs">Valor Bruto</Label>
                                  <Input name="grossAmount" type="number" step="0.01" className="h-8" />
                                </div>
                                <div>
                                  <Label htmlFor="fees" className="text-xs">Taxas</Label>
                                  <Input name="fees" type="number" step="0.01" className="h-8" />
                                </div>
                                <div>
                                  <Label htmlFor="costCenter" className="text-xs">Centro Custo</Label>
                                  <Input name="costCenter" className="h-8" />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="recurrence">Recorrência</Label>
                                <Select name="recurrence" defaultValue="none">
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Não recorrente</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={createEntryMutation.isPending}
                            className={transactionType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                          >
                            {createEntryMutation.isPending ? "Salvando..." : "Salvar Lançamento"}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="adjustment">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const balanceEntry = {
                            date: formData.get("date") as string,
                            balanceType: formData.get("balanceType") as 'initial' | 'final',
                            description: formData.get("description") as string,
                            amount: parseFloat(formData.get("amount") as string),
                            account: formData.get("account") as string,
                          };
                          createBalanceAdjustmentMutation.mutate(balanceEntry);
                        }}
                        className="space-y-4 pt-4"
                      >
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Use esta opção apenas para corrigir o saldo do sistema quando este não bater com o físico.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="adj-date">Data do Ajuste</Label>
                            <Input
                              id="adj-date"
                              name="date"
                              type="date"
                              defaultValue={new Date().toISOString().split("T")[0]}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="balanceType">Tipo de Saldo</Label>
                            <Select name="balanceType" defaultValue="final">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="initial">Saldo Inicial</SelectItem>
                                <SelectItem value="final">Saldo Final</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="adj-amount">Valor Real em Caixa (R$)</Label>
                          <Input
                            id="adj-amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            className="text-lg font-bold"
                            placeholder="0,00"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="adj-account">Conta/Caixa</Label>
                          <Input
                            id="adj-account"
                            name="account"
                            defaultValue="Caixa Principal"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="adj-description">Motivo do Ajuste</Label>
                          <Input
                            id="adj-description"
                            name="description"
                            placeholder="Ex: Diferença de caixa, Correção de saldo"
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={createBalanceAdjustmentMutation.isPending}
                          >
                            {createBalanceAdjustmentMutation.isPending ? "Salvando..." : "Confirmar Ajuste"}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : movements && movements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Forma Pag</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(movement.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {movement.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.account}</TableCell>
                      <TableCell>{movement.paymentMethod}</TableCell>
                      <TableCell className={`text-right font-semibold ${movement.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(movement.status)}>
                          {getStatusLabel(movement.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando sua primeira movimentação de caixa.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Movimentação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
