import { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, Edit, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  razao_social: string;
  telefone: string;
  email: string;
  endereco: string;
  status: 'ativa' | 'inativa';
  created_at: string;
  total_contas_pagar?: number;
  total_contas_receber?: number;
  saldo_caixa?: number;
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    razao_social: '',
    telefone: '',
    email: '',
    endereco: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Carregar empresas do localStorage
    const storedEmpresas = localStorage.getItem('empresas');
    if (storedEmpresas) {
      setEmpresas(JSON.parse(storedEmpresas));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmpresa) {
      // Editar empresa existente
      const updatedEmpresas = empresas.map(emp => 
        emp.id === editingEmpresa.id 
          ? { ...emp, ...formData }
          : emp
      );
      setEmpresas(updatedEmpresas);
      localStorage.setItem('empresas', JSON.stringify(updatedEmpresas));
      toast({
        title: "Empresa atualizada",
        description: "Os dados da empresa foram atualizados com sucesso."
      });
    } else {
      // Adicionar nova empresa
      const novaEmpresa: Empresa = {
        id: Date.now().toString(),
        ...formData,
        status: 'ativa',
        created_at: new Date().toISOString()
      };
      const updatedEmpresas = [...empresas, novaEmpresa];
      setEmpresas(updatedEmpresas);
      localStorage.setItem('empresas', JSON.stringify(updatedEmpresas));
      toast({
        title: "Empresa cadastrada",
        description: "Nova empresa adicionada com sucesso."
      });
    }

    // Resetar formulário
    setFormData({
      nome: '',
      cnpj: '',
      razao_social: '',
      telefone: '',
      email: '',
      endereco: ''
    });
    setShowForm(false);
    setEditingEmpresa(null);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setFormData({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      razao_social: empresa.razao_social,
      telefone: empresa.telefone,
      email: empresa.email,
      endereco: empresa.endereco
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      const updatedEmpresas = empresas.filter(emp => emp.id !== id);
      setEmpresas(updatedEmpresas);
      localStorage.setItem('empresas', JSON.stringify(updatedEmpresas));
      toast({
        title: "Empresa excluída",
        description: "A empresa foi removida com sucesso."
      });
    }
  };

  const toggleStatus = (id: string) => {
    const updatedEmpresas = empresas.map(emp => 
      emp.id === id 
        ? { ...emp, status: emp.status === 'ativa' ? 'inativa' : 'ativa' }
        : emp
    );
    setEmpresas(updatedEmpresas);
    localStorage.setItem('empresas', JSON.stringify(updatedEmpresas));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">Gerencie suas empresas e controle financeiro separado</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Lista de Empresas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {empresas.map((empresa) => (
          <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{empresa.nome}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(empresa)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(empresa.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-sm">
                {empresa.razao_social}
              </CardDescription>
              <Badge 
                variant={empresa.status === 'ativa' ? 'default' : 'secondary'}
                className="mt-2"
              >
                {empresa.status === 'ativa' ? 'Ativa' : 'Inativa'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">CNPJ:</span>
                  <p className="text-muted-foreground">{empresa.cnpj}</p>
                </div>
                <div>
                  <span className="font-medium">Telefone:</span>
                  <p className="text-muted-foreground">{empresa.telefone}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Email:</span>
                  <p className="text-muted-foreground">{empresa.email}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Endereço:</span>
                  <p className="text-muted-foreground">{empresa.endereco}</p>
                </div>
              </div>
              
              {/* Resumo Financeiro */}
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Resumo Financeiro
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-red-600 font-medium">Contas a Pagar</p>
                    <p className="text-lg font-bold text-red-700">
                      R$ {(empresa.total_contas_pagar || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-green-600 font-medium">Contas a Receber</p>
                    <p className="text-lg font-bold text-green-700">
                      R$ {(empresa.total_contas_receber || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-blue-600 font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Saldo Caixa
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      R$ {(empresa.saldo_caixa || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(empresa.id)}
                  className="flex-1"
                >
                  {empresa.status === 'ativa' ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // Selecionar empresa ativa
                    localStorage.setItem('empresaAtiva', JSON.stringify(empresa));
                    toast({
                      title: "Empresa selecionada",
                      description: `${empresa.nome} é agora a empresa ativa.`
                    });
                    window.location.reload();
                  }}
                  className="flex-1"
                >
                  Selecionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {empresas.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre sua primeira empresa para começar a controlar o fluxo financeiro.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro/Edição */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
              </CardTitle>
              <CardDescription>
                Preencha os dados da empresa para controle financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Fantasia *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                      placeholder="Razão social completa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="empresa@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      placeholder="Rua, número, bairro, cidade - UF"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEmpresa(null);
                      setFormData({
                        nome: '',
                        cnpj: '',
                        razao_social: '',
                        telefone: '',
                        email: '',
                        endereco: ''
                      });
                    }}
                    >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEmpresa ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
