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
  Edit,
  Trash2,
  CheckCircle,
  Upload,
  Calendar,
  Building2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  Percent,
  CreditCard,
  FileText,
  Banknote,
  Wallet,
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
import type { AccountPayable, Supplier, Category, CostCenter } from "@shared/schema";

const accountPayableFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  lateFees: z.string().optional(),
  supplierId: z.string().min(1, "Fornecedor é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  costCenterId: z.string().min(1, "Centro de Custo é obrigatório"),
  paymentMethod: z.string().min(1, "Meio de pagamento é obrigatório"),
  notes: z.string().optional(),
  recurrence: z.string().optional(),
});

type AccountPayableFormData = z.infer<typeof accountPayableFormSchema>;

const paymentFormSchema = z.object({
  lateFees: z.string().optional(),
  paymentDate: z.string().min(1, "Data de pagamento é obrigatória"),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function AccountsPayable() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [accountToPay, setAccountToPay] = useState<AccountPayable | null>(null);
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery<AccountPayable[]>({
    queryKey: ["/api/accounts-payable"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: costCenters } = useQuery<CostCenter[]>({
    queryKey: ["/api/cost-centers"],
  });

  const form = useForm<AccountPayableFormData>({
    resolver: zodResolver(accountPayableFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: "",
      supplierId: "",
      categoryId: "",
      costCenterId: "",
      paymentMethod: "",
      lateFees: "",
      notes: "",
      recurrence: "none",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      lateFees: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AccountPayableFormData) =>
      apiRequest("POST", "/api/accounts-payable", {
        ...data,
        amount: data.amount,
        supplierId: data.supplierId || null,
        categoryId: data.categoryId || null,
        costCenterId: data.costCenterId || null,
        paymentMethod: data.paymentMethod || null,
        lateFees: data.lateFees || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta a pagar criada com sucesso.",
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
    mutationFn: (data: AccountPayableFormData & { id: string }) =>
      apiRequest("PATCH", `/api/accounts-payable/${data.id}`, {
        ...data,
        amount: data.amount,
        supplierId: data.supplierId || null,
        categoryId: data.categoryId || null,
        costCenterId: data.costCenterId || null,
        paymentMethod: data.paymentMethod || null,
        lateFees: data.lateFees || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/accounts-payable/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Sucesso",
        description: "Conta desativada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desativar a conta.",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (data: { id: string; lateFees?: string; paymentDate: string }) =>
      apiRequest("PATCH", `/api/accounts-payable/${data.id}/pay`, {
        paymentDate: data.paymentDate,
        lateFees: data.lateFees || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setPaymentDialogOpen(false);
      setAccountToPay(null);
      paymentForm.reset();
      toast({
        title: "Sucesso",
        description: "Conta marcada como paga.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a conta como paga.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AccountPayableFormData) => {
    if (editingAccount) {
      updateMutation.mutate({ ...data, id: editingAccount.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePaymentSubmit = (data: PaymentFormData) => {
    if (accountToPay) {
      markAsPaidMutation.mutate({
        id: accountToPay.id,
        lateFees: data.lateFees,
        paymentDate: data.paymentDate,
      });
    }
  };

  const handleMarkAsPaid = (account: AccountPayable) => {
    setAccountToPay(account);
    paymentForm.reset({
      lateFees: account.lateFees || "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogOpenChange = (open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) {
      setAccountToPay(null);
      paymentForm.reset();
    }
  };

  const handleEdit = (account: AccountPayable) => {
    setEditingAccount(account);
    form.reset({
      description: account.description,
      amount: account.amount,
      dueDate: account.dueDate,
      supplierId: account.supplierId || "",
      categoryId: account.categoryId || "",
      costCenterId: account.costCenterId || "",
      paymentMethod: account.paymentMethod || "",
      lateFees: account.lateFees || "",
      notes: account.notes || "",
      recurrence: account.recurrence || "none",
    });
    setIsOpen(true);
  };

  const handleClone = (account: AccountPayable) => {
    const clonedAccount = {
      description: `${account.description} (Cópia)`,
      amount: account.amount,
      dueDate: account.dueDate,
      supplierId: account.supplierId || "",
      categoryId: account.categoryId || "",
      costCenterId: account.costCenterId || "",
      paymentMethod: account.paymentMethod || "",
      lateFees: account.lateFees || "",
      notes: account.notes || "",
      recurrence: account.recurrence || "none",
    };
    
    form.reset(clonedAccount);
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingAccount(null);
      form.reset();
    }
  };

  const filteredAccounts = accounts?.filter((account) => {
    const matchesSearch = account.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isOverdueAccount = isOverdue(account.dueDate, account.status);
    const displayStatus = isOverdueAccount ? "overdue" : account.status;
    
    const matchesStatus = statusFilter === "all" || displayStatus === statusFilter;
    const matchesActive = activeFilter === "all" || (activeFilter === "active" && account.active !== false) || (activeFilter === "inactive" && account.active === false);
    
    // Date range filter
    const matchesDateRange = (!dateFilter.start || account.dueDate >= dateFilter.start) &&
                             (!dateFilter.end || account.dueDate <= dateFilter.end);
    
    return matchesSearch && matchesStatus && matchesActive && matchesDateRange;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [];

  // Calculate statistics
  const stats = accounts ? {
    total: accounts.reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    pending: accounts.filter(acc => acc.status === "pending").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    paid: accounts.filter(acc => acc.status === "paid").reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdue: accounts.filter(acc => isOverdue(acc.dueDate, acc.status)).reduce((sum, acc) => sum + parseFloat(acc.amount), 0),
    overdueCount: accounts.filter(acc => isOverdue(acc.dueDate, acc.status)).length,
    pendingCount: accounts.filter(acc => acc.status === "pending").length,
    paidCount: accounts.filter(acc => acc.status === "paid").length,
    totalLateFees: accounts.reduce((sum, acc) => sum + (acc.lateFees && acc.lateFees !== null ? parseFloat(acc.lateFees) : 0), 0),
  } : {
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    overdueCount: 0,
    pendingCount: 0,
    paidCount: 0,
    totalLateFees: 0,
  };

  const expenseCategories = categories?.filter((c) => c.type === "expense");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gerencie suas despesas e pagamentos
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-payable">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingAccount ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da conta a pagar
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Main Information Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Principais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-900 font-medium">Descrição *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Aluguel do escritório"
                              {...field}
                              data-testid="input-description"
                              className="bg-white border-blue-300"
                            />
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
                          <FormLabel className="text-blue-900 font-medium">Valor *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              data-testid="input-amount"
                              className="bg-white border-blue-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-900 font-medium">Data de Vencimento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-due-date" className="bg-white border-blue-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lateFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-900 font-medium">Juros / Multa</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              data-testid="input-late-fees"
                              className="bg-white border-blue-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Details Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Detalhes Financeiros
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-900 font-medium">Fornecedor *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-supplier" className="bg-white border-green-300">
                                <SelectValue placeholder="Selecione um fornecedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers?.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
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
                          <FormLabel className="text-green-900 font-medium">Categoria *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category" className="bg-white border-green-300">
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories?.map((category) => (
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
                    <FormField
                      control={form.control}
                      name="costCenterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-900 font-medium">Centro de Custo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-cost-center" className="bg-white border-green-300">
                                <SelectValue placeholder="Selecione um centro de custo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {costCenters?.map((cc) => (
                                <SelectItem key={cc.id} value={cc.id}>
                                  {cc.name}
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

                {/* Additional Information Section */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informações Adicionais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-900 font-medium">Meio de Pagamento *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method" className="bg-white border-purple-300">
                                <SelectValue placeholder="Selecione o meio de pagamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="boleto">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Boleto
                                </div>
                              </SelectItem>
                              <SelectItem value="credit_card">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Cartão de Crédito
                                </div>
                              </SelectItem>
                              <SelectItem value="debit_card">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Cartão de Débito
                                </div>
                              </SelectItem>
                              <SelectItem value="cash">
                                <div className="flex items-center gap-2">
                                  <Banknote className="h-4 w-4" />
                                  Dinheiro
                                </div>
                              </SelectItem>
                              <SelectItem value="transfer">
                                <div className="flex items-center gap-2">
                                  <Wallet className="h-4 w-4" />
                                  Transferência Bancária
                                </div>
                              </SelectItem>
                              <SelectItem value="pix">
                                <div className="flex items-center gap-2">
                                  <Wallet className="h-4 w-4" />
                                  PIX
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-900 font-medium">Recorrência</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-recurrence" className="bg-white border-purple-300">
                                <SelectValue placeholder="Sem recorrência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sem recorrência</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="text-purple-900 font-medium">Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais..."
                            {...field}
                            data-testid="input-notes"
                            className="bg-white border-purple-300 min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    data-testid="button-cancel"
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                    className="px-6"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingAccount
                      ? "Atualizar"
                      : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmar Pagamento
            </DialogTitle>
            <DialogDescription>
              {accountToPay && (
                <span>
                  Registrar pagamento para: <strong>{accountToPay.description}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Valor original: <strong>{accountToPay && formatCurrency(accountToPay.amount)}</strong></p>
                  <p>Data de vencimento: <strong>{accountToPay && formatDate(accountToPay.dueDate)}</strong></p>
                </div>
              </div>
              
              <FormField
                control={paymentForm.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="lateFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juros / Multa (se aplicável)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePaymentDialogOpenChange(false)}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={markAsPaidMutation.isPending}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  {markAsPaidMutation.isPending
                    ? "Processando..."
                    : "Confirmar Pagamento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.total)}</p>
                <p className="text-xs text-blue-600 mt-1">{accounts?.length || 0} contas</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pendentes</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.pending)}</p>
                <p className="text-xs text-orange-600 mt-1">{stats.pendingCount} contas</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Pagos</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.paid)}</p>
                <p className="text-xs text-green-600 mt-1">{stats.paidCount} contas</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
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
                <p className="text-sm font-medium text-purple-600">Juros/Multa</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalLateFees)}</p>
                <p className="text-xs text-purple-600 mt-1">Valor total registrado</p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
              <p className="text-gray-600 mt-1">Gerencie suas contas e pagamentos</p>
            </div>
            <Button
              onClick={() => {
                setEditingAccount(null);
                form.reset();
                setIsOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-new-account"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar contas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status da Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="overdue">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  placeholder="Data Início"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="w-[150px]"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="date"
                  placeholder="Data Fim"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="w-[150px]"
                />
              </div>
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
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Juros/Multa</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => {
                    const supplier = suppliers?.find((s) => s.id === account.supplierId);
                    const category = categories?.find((c) => c.id === account.categoryId);
                    const overdue = isOverdue(account.dueDate, account.status);
                    const displayStatus = overdue ? "overdue" : account.status;

                    return (
                      <TableRow key={account.id} data-testid={`row-payable-${account.id}`}>
                        <TableCell className="font-medium">
                          {account.description}
                        </TableCell>
                        <TableCell>
                          {supplier ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{supplier.name}</span>
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
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(account.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.lateFees && account.lateFees !== null ? (
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(account.lateFees)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.paymentDate ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">{formatDate(account.paymentDate)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                              {account.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsPaid(account)}
                                  data-testid={`button-mark-paid-${account.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleEdit(account)}
                                data-testid={`button-edit-${account.id}`}
                                disabled={account.status === "paid"}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                                {account.status === "paid" && (
                                  <span className="ml-2 text-xs text-gray-400">(Não disponível)</span>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(account.id)}
                                data-testid={`button-delete-${account.id}`}
                                className="text-red-600"
                                disabled={account.status === "paid"}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desativar
                                {account.status === "paid" && (
                                  <span className="ml-2 text-xs text-gray-400">(Não disponível)</span>
                                )}
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
              <Building2 className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Nenhuma conta encontrada</p>
              <p className="text-sm">Clique em "Nova Conta" para adicionar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
