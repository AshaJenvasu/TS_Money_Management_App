-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_user_id_fkey";

-- DropForeignKey
ALTER TABLE "portfolio_transactions" DROP CONSTRAINT "portfolio_transactions_portfolio_id_fkey";

-- AddForeignKey
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_transactions" ADD CONSTRAINT "portfolio_transactions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
