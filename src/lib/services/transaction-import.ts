import { db } from "@/lib/db";
import { normalizeMerchantName, normalizeCategory } from "./normalize";
import type { TrueLayerTransaction } from "@/lib/truelayer/client";

interface ImportResult {
  imported: number;
  skipped: number;
}

export async function importTransactions(
  userId: string,
  accountId: string,
  rawTransactions: TrueLayerTransaction[]
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;

  for (const tx of rawTransactions) {
    const direction = tx.amount < 0 ? "debit" : "credit";
    const absAmount = Math.abs(tx.amount);

    try {
      await db.transaction.upsert({
        where: {
          accountId_externalId: {
            accountId,
            externalId: tx.transaction_id,
          },
        },
        create: {
          userId,
          accountId,
          externalId: tx.transaction_id,
          amount: absAmount,
          currency: tx.currency,
          direction,
          description: tx.description,
          merchantName: tx.merchant_name || null,
          normalizedName: normalizeMerchantName(
            tx.merchant_name || tx.description
          ),
          category: normalizeCategory(
            tx.transaction_category,
            tx.description
          ),
          transactionDate: new Date(tx.timestamp),
          rawPayload: JSON.parse(JSON.stringify(tx)),
        },
        update: {},
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}
