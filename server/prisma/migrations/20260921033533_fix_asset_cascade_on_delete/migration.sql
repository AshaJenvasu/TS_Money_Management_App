-- DropForeignKey
ALTER TABLE "asset_holdings" DROP CONSTRAINT "asset_holdings_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "portfolio_transactions" DROP CONSTRAINT "portfolio_transactions_asset_id_fkey";

-- AddForeignKey
ALTER TABLE "asset_holdings" ADD CONSTRAINT "asset_holdings_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_transactions" ADD CONSTRAINT "portfolio_transactions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
