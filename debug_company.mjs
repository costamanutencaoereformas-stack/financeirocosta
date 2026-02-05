import { db } from './server/db.js';
import { companies, cashFlowEntries, accountsPayable, accountsReceivable } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function debugCompanyData() {
  try {
    console.log('Verificando empresas...');
    const allCompanies = await db.select().from(companies);
    
    const contaManutencao = allCompanies.find(c => c.nome?.toLowerCase().includes('manutencao') || c.razao_social?.toLowerCase().includes('manutencao'));
    
    if (contaManutencao) {
      console.log(`Empresa encontrada: ID ${contaManutencao.id}, Nome: ${contaManutencao.nome}`);
      
      console.log('Verificando dados de fluxo de caixa...');
      const cashFlow = await db.select().from(cashFlowEntries).where(eq(cashFlowEntries.companyId, contaManutencao.id));
      console.log(`Cash flow entries: ${cashFlow.length}`);
      
      console.log('Verificando contas a pagar...');
      const payables = await db.select().from(accountsPayable).where(eq(accountsPayable.companyId, contaManutencao.id));
      console.log(`Accounts payable: ${payables.length}`);
      
      console.log('Verificando contas a receber...');
      const receivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.companyId, contaManutencao.id));
      console.log(`Accounts receivable: ${receivables.length}`);
      
    } else {
      console.log('Empresa "Conta Manutenção" não encontrada');
      console.log('Empresas disponíveis:');
      allCompanies.forEach(c => console.log(`- ${c.nome} (${c.id})`));
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
  process.exit(0);
}

debugCompanyData();
