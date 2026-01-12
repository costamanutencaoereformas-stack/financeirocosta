const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixStorageFile() {
  try {
    console.log('Fixing storage.ts file...');
    
    // Read the current file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'server', 'storage.ts');
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the problematic section and fix it
    const startMarker = '  async getCashFlowAlerts(): Promise<CashFlowAlert[]> {';
    const endMarker = '  async getDailyMovements(date: string): Promise<DailyMovement[]> {';
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const before = content.substring(0, startIndex);
      const after = content.substring(endIndex);
      
      const fixedSection = `  async getCashFlowAlerts(): Promise<CashFlowAlert[]> {
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
        message: \`Saldo negativo: R\$ \${currentBalance.toFixed(2)}\`,
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
        message: \`\${overduePayables.length} contas a pagar vencidas (R\$ \${totalOverdue.toFixed(2)})\`,
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
        message: \`\${lateReceivables.length} contas a receber em atraso (R\$ \${totalLate.toFixed(2)})\`,
        severity: "medium",
        relatedId: null,
        type: "receivable"
      });
    }
    
    return alerts;
  }

  `;
      
      content = before + fixedSection + after;
      
      fs.writeFileSync(filePath, content);
      console.log('Storage file fixed successfully!');
    }
    
  } catch (error) {
    console.error('Error fixing storage file:', error);
  } finally {
    await pool.end();
  }
}

fixStorageFile();
