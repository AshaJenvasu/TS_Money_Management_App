/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  CircleAlert,
  Plus,
} from "lucide-react";
import { useAssetsQuery } from "../hooks/useAssetsQuery";
import { usePortfolioQuery } from "../hooks/usePortfolioQuery";
import { usePortfolioTransactionsQuery } from "../hooks/usePortfolioTransactionsQuery";
import { PortfolioSummaryCard } from "../components/investment/PortfolioSummaryCard";
import { AssetListSection } from "../components/investment/AssetListSection";
import { TransactionHistorySection } from "../components/investment/TransactionHistorySection";
import { AssetCreateDialog } from "../components/investment/AssetCreateDialog";
import { AssetEditDialog } from "../components/investment/AssetEditDialog";
import { AssetDeleteDialog } from "../components/investment/AssetDeleteDialog";
import { TransactionCreateDialog } from "../components/investment/TransactionCreateDialog";
import { TransactionEditDialog } from "../components/investment/TransactionEditDialog";
import { TransactionDeleteDialog } from "../components/investment/TransactionDeleteDialog";
import WalletDetailScene from "../components/wallet-detail/WalletDetailScene";
import SakuraPetals from "../components/wallet-detail/SakuraPetals";
import PeekingCat from "../components/wallet-detail/PeekingCat";
import type { AssetView } from "../types/investment";
import type { PortfolioTransactionListItem } from "../services/portfolio.services";

function InvestmentPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(
    new Set(),
  );
  const [filterAssetId, setFilterAssetId] = useState<string | null>(null);
  const [historyShown, setHistoryShown] = useState(5);
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [editingAssetView, setEditingAssetView] = useState<AssetView | null>(
    null,
  );
  const [deletingAssetView, setDeletingAssetView] = useState<AssetView | null>(
    null,
  );
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<PortfolioTransactionListItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<PortfolioTransactionListItem | null>(null);

  const assetsQuery = useAssetsQuery();
  const portfolioQuery = usePortfolioQuery();
  const transactionsQuery = usePortfolioTransactionsQuery();

  const isPending =
    assetsQuery.isPending ||
    portfolioQuery.isPending ||
    transactionsQuery.isPending;
  const isError =
    assetsQuery.isError || portfolioQuery.isError || transactionsQuery.isError;

  const assets = assetsQuery.data ?? [];
  const holdings = portfolioQuery.data?.holdings ?? [];
  const transactions = transactionsQuery.data ?? [];

  // รวมข้อมูล Asset เข้ากับยอดถือครองและประวัติธุรกรรม ไม่มี endpoint รวมให้ คำนวณฝั่ง client
  const assetViews = useMemo<AssetView[]>(() => {
    const holdingByAssetId = new Map(
      holdings.map((holding) => [holding.assetId, holding]),
    );

    return assets.map((asset) => {
      const holding = holdingByAssetId.get(asset.id);
      const quantity = holding ? Number(holding.quantity) : 0;
      const avgCostPerUnit = holding ? Number(holding.avgCostPerUnit) : 0;
      const cost = quantity * avgCostPerUnit;

      const assetTransactions = transactions.filter(
        (t) => t.assetId === asset.id,
      );
      const buyCount = assetTransactions.filter(
        (t) => t.transactionType === "buy",
      ).length;
      const sellCount = assetTransactions.filter(
        (t) => t.transactionType === "sell",
      ).length;
      const lastTransactionDate = assetTransactions.reduce<string | null>(
        (latest, t) =>
          !latest || t.transactionDate > latest ? t.transactionDate : latest,
        null,
      );

      return {
        asset,
        quantity,
        avgCostPerUnit,
        cost,
        buyCount,
        sellCount,
        lastTransactionDate,
      };
    });
  }, [assets, holdings, transactions]);

  const heldAssetViews = useMemo(
    () => assetViews.filter((view) => view.cost > 0),
    [assetViews],
  );
  const totalCost = heldAssetViews.reduce((sum, view) => sum + view.cost, 0);

  const filteredAssetViews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return assetViews;
    return assetViews.filter(
      (view) =>
        view.asset.symbol.toLowerCase().includes(normalizedQuery) ||
        view.asset.name.toLowerCase().includes(normalizedQuery),
    );
  }, [assetViews, query]);

  const sortedTransactions = useMemo(
    () =>
      [...transactions]
        .filter((t) => filterAssetId == null || t.assetId === filterAssetId)
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [transactions, filterAssetId],
  );

  const toggleExpanded = (assetId: string) => {
    setExpandedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const showHistoryOfAsset = (assetId: string) => {
    setFilterAssetId(assetId);
    setHistoryShown(5);
    document
      .getElementById("investment-history")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E9EAF8]">
        <span className="loading loading-spinner loading-lg text-[#7566C7]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E9EAF8] px-5">
        <div className="w-full max-w-sm rounded-[28px] bg-white p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto mb-3 text-[#CF3D6B]" size={40} />
          <h2 className="text-xl font-bold text-[#1F2A5C]">
            โหลดข้อมูลไม่สำเร็จ
          </h2>
          <p className="mt-2 text-sm text-[#5C6899]">
            ลองรีเฟรชหน้าใหม่อีกครั้งนะ
          </p>
        </div>
      </div>
    );
  }

  const filterAssetSymbol =
    assets.find((a) => a.id === filterAssetId)?.symbol ?? null;

  return (
    <div className="relative z-0 min-h-screen overflow-hidden bg-[#E9EAF8] px-5 py-6 text-[#1F2A5C] sm:px-8">
      <WalletDetailScene />
      <SakuraPetals />
      <div className="relative mx-auto w-full max-w-3xl">
        <header className="relative mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            aria-label="กลับ"
            className="flex size-11 items-center justify-center rounded-full bg-white/80 text-[#1F2A5C] shadow-sm transition hover:bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#FFE3EC] text-[#CF3D6B]">
              <ChartNoAxesCombined size={16} />
            </span>
            พอร์ตการลงทุนของฉัน
          </h1>
        </header>

        <div className="relative mt-20">
          <PeekingCat />
          <PortfolioSummaryCard
            totalCost={totalCost}
            heldAssetViews={heldAssetViews}
          />
        </div>

        <AssetListSection
          assetViews={filteredAssetViews}
          hasAnyAssets={assets.length > 0}
          query={query}
          onQueryChange={setQuery}
          expandedAssetIds={expandedAssetIds}
          onToggleExpand={toggleExpanded}
          onShowHistoryOfAsset={showHistoryOfAsset}
          onCreateAssetClick={() => setIsCreateAssetOpen(true)}
          onEditAsset={(assetId) =>
            setEditingAssetView(
              assetViews.find((view) => view.asset.id === assetId) ?? null,
            )
          }
          onDeleteAsset={(assetId) =>
            setDeletingAssetView(
              assetViews.find((view) => view.asset.id === assetId) ?? null,
            )
          }
        />

        <button
          type="button"
          onClick={() => setIsCreateTransactionOpen(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F2709F] to-[#D8407B] py-3.5 text-base font-bold text-white shadow-lg shadow-pink-200/60"
        >
          <Plus size={20} /> เพิ่มรายการซื้อขาย
        </button>

        <TransactionHistorySection
          transactions={sortedTransactions}
          visibleCount={historyShown}
          onShowMore={() => setHistoryShown((prev) => prev + 5)}
          filterSymbol={filterAssetSymbol}
          onClearFilter={() => {
            setFilterAssetId(null);
            setHistoryShown(5);
          }}
          onEditTransaction={setEditingTransaction}
          onDeleteTransaction={setDeletingTransaction}
        />
      </div>
      {isCreateAssetOpen && (
        <AssetCreateDialog onClose={() => setIsCreateAssetOpen(false)} />
      )}

      {editingAssetView && (
        <AssetEditDialog
          assetView={editingAssetView}
          onClose={() => setEditingAssetView(null)}
        />
      )}

      {deletingAssetView && (
        <AssetDeleteDialog
          assetView={deletingAssetView}
          onClose={() => setDeletingAssetView(null)}
          onDeleted={(assetId) => {
            setFilterAssetId((prev) => (prev === assetId ? null : prev));
            setExpandedAssetIds((prev) => {
              const next = new Set(prev);
              next.delete(assetId);
              return next;
            });
          }}
        />
      )}

      {isCreateTransactionOpen && (
        <TransactionCreateDialog
          assetViews={assetViews}
          onClose={() => setIsCreateTransactionOpen(false)}
        />
      )}

      {editingTransaction && (
        <TransactionEditDialog
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {deletingTransaction && (
        <TransactionDeleteDialog
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute("/investment")({
  component: InvestmentPage,
});
