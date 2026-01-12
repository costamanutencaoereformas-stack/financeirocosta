import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  Percent,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, isOverdue } from "@/lib/utils";
import type { AccountReceivable, Client, Category } from "@shared/schema";

const accountReceivableFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  clientId: z.string().optional(),
  categoryId: z.string().optional(),
  discount: z.string().optional(),
  notes: z.string().optional(),
  markAsReceived: z.boolean().default(false).optional(),
  receivedDate: z.string().optional(),
  isRecurring: z.boolean().default(false).optional(),
  recurrence: z.string().optional(),
  recurrencePeriod: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.markAsReceived && !data.receivedDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de recebimento é obrigatória quando marcado como recebido",
      path: ["receivedDate"],
    });
  }
  if (data.isRecurring) {
    if (!data.recurrence) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Frequência é obrigatória para lançamentos recorrentes",
        path: ["recurrence"],
      });
    }
    if (!data.recurrencePeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final é obrigatória para lançamentos recorrentes",
        path: ["recurrencePeriod"],
      });
    }
  }
});

type AccountReceivableFormData = z.infer<typeof accountReceivableFormSchema>;

export default function AccountsReceivable() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountReceivable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [accountToReceive, setAccountToReceive] = useState<AccountReceivable | null>(null);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery<AccountReceivable[]>({
    queryKey: ["/api/accounts-receivable"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<AccountReceivableFormData>({
    resolver: zodResolver(accountReceivableFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: "",
      clientId: "",
      categoryId: "",
      discount: "",
      notes: "",
      markAsReceived: false,
      receivedDate: new Date().toISOString().split("T")[0],
      isRecurring: false,
      recurrence: "",
      recurrencePeriod: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountReceivableFormData) =>
      apiRequest("POST", "/api/accounts-receivable", {
        ...data,
        amount: data.amount,
        discount: data.discount || null,
        clientId: data.clientId || null,
        categoryId: data.categoryId || null,
        status: data.markAsReceived ? "received" : "pending",
        receivedDate: data.markAsReceived ? data.receivedDate : null,
        recurrence: data.isRecurring ? data.recurrence : null,
        recurrencePeriod: data.isRecurring ? data.recurrencePeriod : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta a receber criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AccountReceivableFormData & { id: string }) =>
      apiRequest("PATCH", `/api/accounts-receivable/${data.id}`, {
        ...data,
        amount: data.amount,
        discount: data.discount || null,
        clientId: data.clientId || null,
        categoryId: data.categoryId || null,
        recurrence: data.isRecurring ? data.recurrence : null,
        recurrencePeriod: data.isRecurring ? data.recurrencePeriod : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      setIsOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts-receivable/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta.",
        variant: "destructive",
      });
    },
  });

  const markAsReceivedMutation = useMutation({
    mutationFn: (data: { id: string; discount?: string; receivedDate: string }) =>
      apiRequest("PATCH", `/api/accounts-receivable/${data.id}/receive`, {
        receivedDate: data.receivedDate,
        discount: data.discount || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-flow/movements"] });
      setPaymentDialogOpen(false);
      setAccountToReceive(null);
      setReceivedDate(new Date().toISOString().split("T")[0]);
      toast({
        title: "Sucesso",
        description: "Conta marcada como recebida.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a conta como recebida.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AccountReceivableFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ ...data, id: editingAccount.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: AccountReceivable) => {
    setEditingAccount(account);
    form.reset({
      description: account.description,
      amount: account.amount,
      dueDate: account.dueDate,
      clientId: account.clientId || "",
      categoryId: account.categoryId || "",
      discount: account.discount || "",
      notes: account.notes || "",
      markAsReceived: account.status === 'received',
      receivedDate: account.receivedDate || new Date().toISOString().split("T")[0],
      isRecurring: !!account.recurrence && account.recurrence !== 'none',
      recurrence: account.recurrence || "",
      recurrencePeriod: account.recurrencePeriod || "",
    });
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingAccount(null);
      form.reset();
    }
  };

  const handleMarkAsReceived = (account: AccountReceivable) => {
    setAccountToReceive(account);
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogOpenChange = (open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) {
      setAccountToReceive(null);
    }
  };

  const handleClone = (account: AccountReceivable) => {
    const clonedAccount = {
      description: `${account.description} (Cópia)`,
      amount: account.amount,
      dueDate: account.dueDate,
      clientId: account.clientId || "",
      categoryId: account.categoryId || "",
      discount: account.discount || "",
      notes: account.notes || "",
    };

    form.reset(clonedAccount);
    setIsOpen(true);
  };

  const filteredAccounts = accounts?.filter((account) => {
    const matchesSearch = account.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let actualStatus = account.status;
    if (actualStatus === "pending" && isOverdue(account.dueDate, account.status)) {
      actualStatus = "overdue";
    }

    const matchesStatus =
      statusFilter === "all" || actualStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const incomeCategories = categories?.filter((c) => c.type === "income");

  // Calculate statistics
  const stats = accounts ? {
    total: accounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    pending: accounts.filter(acc => acc.status === "pending").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    received: accounts.filter(acc => acc.status === "received").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdue: accounts.filter(acc => isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdueCount: accounts.filter(acc => isOverdue(acc.dueDate, acc.status)).length,
    pendingCount: accounts.filter(acc => acc.status === "pending").length,
    receivedCount: accounts.filter(acc => acc.status === "received").length,
    totalDiscounts: accounts.reduce((sum, acc) => sum + (acc.discount && acc.discount !== null ? parseFloat(acc.discount) : 0), 0),
  } : {
    total: 0,
    pending: 0,
    received: 0,
    overdue: 0,
    overdueCount: 0,
    pendingCount: 0,
    receivedCount: 0,
    totalDiscounts: 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Contas a Receber</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e recebimentos
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-receivable" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {editingAccount ? <Pencil className="h-6 w-6 text-blue-500" /> : <Plus className="h-6 w-6 text-blue-500" />}
                {editingAccount ? "Editar Conta a Receber" : "Nova Conta a Receber"}
              </DialogTitle>
              <DialogDescription className="text-base">
                Preencha os dados abaixo para registrar um novo recebimento.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                {/* Linha 1: Descrição e Valores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-base font-medium text-gray-700">Descrição *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Ex: Venda de Consultoria..."
                              {...field}
                              className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                              data-testid="input-description"
                            />
                            <Wallet className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Valor (R$) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-medium"
                              data-testid="input-amount"
                            />
                            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Desconto (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-red-500"
                            />
                            <Percent className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Linha 2: Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Data de Vencimento *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="date" {...field} className="h-10 pl-10 cursor-pointer" data-testid="input-due-date" />
                            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo de Status/Recebimento Imediato - Novo */}
                  {!editingAccount && (
                    <FormField
                      control={form.control}
                      name="markAsReceived"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 shadow-sm mt-1">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Já recebido?</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Marcar como pago no ato
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("markAsReceived") && !editingAccount && (
                    <FormField
                      control={form.control}
                      name="receivedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">Data do Recebimento *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="date" {...field} className="h-10 pl-10 cursor-pointer border-green-200 focus:border-green-500" />
                              <CheckCircle className="absolute left-3 top-2.5 h-5 w-5 text-green-500" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recorrência</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Lançamento Recorrente?</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Repetir este lançamento periodicamente
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("isRecurring") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <FormField
                          control={form.control}
                          name="recurrence"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium text-gray-700">Frequência *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Selecione a frequência" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="recurrencePeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium text-gray-700">Data Final da Recorrência *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type="date" {...field} className="h-10 pl-10 cursor-pointer" />
                                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Classificação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">Cliente</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-client" className="h-10">
                                <SelectValue placeholder="Selecione um cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium text-gray-700">Categoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category" className="h-10">
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {incomeCategories?.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-700">Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais, número da NF, etc..."
                            {...field}
                            className="resize-none min-h-[80px]"
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="gap-2 pt-2 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    data-testid="button-cancel"
                    className="h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                    className="h-10 bg-blue-600 hover:bg-blue-700"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center">
                        <span className="animate-spin mr-2">⏳</span> Salvando...
                      </div>
                    ) : (
                      editingAccount ? "Atualizar Lançamento" : "Confirmar Lançamento"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total a Receber</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.total)}</p>
                <p className="text-xs text-blue-600 mt-1">{stats.pendingCount + stats.receivedCount} contas</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.pending)}</p>
                <p className="text-xs text-yellow-600 mt-1">{stats.pendingCount} contas</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Recebidos</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.received)}</p>
                <p className="text-xs text-green-600 mt-1">{stats.receivedCount} contas</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.overdue)}</p>
                <p className="text-xs text-red-600 mt-1">{stats.overdueCount} contas</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Descontos</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalDiscounts)}</p>
                <p className="text-xs text-purple-600 mt-1">Valor total concedido</p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Lista de Contas</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="received">Recebidos</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAccounts && filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Recebimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => {
                    const client = clients?.find((c) => c.id === account.clientId);
                    const category = categories?.find((c) => c.id === account.categoryId);
                    const overdue = isOverdue(account.dueDate, account.status);
                    const displayStatus = overdue ? "overdue" : account.status;

                    return (
                      <TableRow key={account.id} data-testid={`row-receivable-${account.id}`}>
                        <TableCell className="font-medium">
                          {account.description}
                        </TableCell>
                        <TableCell>
                          {client ? (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{client.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {category ? (
                            <Badge variant="secondary" className="font-normal">
                              {category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(account.dueDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.receivedDate ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{formatDate(account.receivedDate)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(account.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(displayStatus)}>
                            {getStatusLabel(displayStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${account.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleClone(account)}
                                data-testid={`button-clone-${account.id}`}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Clonar Lançamento
                              </DropdownMenuItem>
                              {account.status !== "received" && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsReceived(account)}
                                  data-testid={`button-mark-received-${account.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Recebido
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleEdit(account)}
                                data-testid={`button-edit-${account.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(account.id)}
                                className="text-destructive"
                                data-testid={`button-delete-${account.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Nenhuma conta encontrada</p>
              <p className="text-sm">Clique em "Nova Conta" para adicionar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              {accountToReceive && `Registrar recebimento da conta: ${accountToReceive.description}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data do Recebimento</label>
              <Input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor Original</label>
              <p className="text-lg font-semibold">
                {accountToReceive && formatCurrency(accountToReceive.amount)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Desconto (opcional)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                onChange={(e) => {
                  if (accountToReceive) {
                    setAccountToReceive({ ...accountToReceive, discount: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor Final</label>
              <p className="text-lg font-semibold text-green-600">
                {accountToReceive && formatCurrency(
                  parseFloat(accountToReceive.amount) - (parseFloat(accountToReceive.discount || "0") || 0)
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePaymentDialogOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (accountToReceive) {
                  markAsReceivedMutation.mutate({
                    id: accountToReceive.id,
                    discount: accountToReceive.discount ?? undefined,
                    receivedDate: receivedDate,
                  });
                }
              }}
              disabled={markAsReceivedMutation.isPending}
            >
              {markAsReceivedMutation.isPending ? "Processando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
