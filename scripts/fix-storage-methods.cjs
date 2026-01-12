const fs = require('fs');
const path = require('path');

function fixStorageFile() {
  try {
    console.log('Fixing storage.ts file...');
    
    const filePath = path.join(__dirname, 'server', 'storage.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the broken getAccountPayable method
    const brokenStart = 'async getAccountPayable(id: string): Promise<AccountPayable | undefined> {\n    const [account] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id));\n    return account ? {\n\n    return db.select().from(accountsPayable)';
    const brokenEnd = 'async createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable> {';
    
    const startIndex = content.indexOf(brokenStart);
    const endIndex = content.indexOf(brokenEnd);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const before = content.substring(0, startIndex);
      const after = content.substring(endIndex);
      
      const fixedMethod = `async getAccountPayable(id: string): Promise<AccountPayable | undefined> {
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

  async createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable> {`;
      
      content = before + fixedMethod + after;
      
      fs.writeFileSync(filePath, content);
      console.log('Storage file fixed successfully!');
    }
    
  } catch (error) {
    console.error('Error fixing storage file:', error);
  }
}

fixStorageFile();
