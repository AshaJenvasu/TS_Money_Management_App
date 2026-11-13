import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Search, X } from "lucide-react";
import {
  assetService,
  type AssetType,
  type CoinSearchResult,
} from "../../services/asset.services";
import { useCoinSearchQuery } from "../../hooks/useCoinSearchQuery";

// symbol ใช้เป็นแค่ชื่อแสดงผล ตัดอักขระที่ backend ไม่รับ (รับเฉพาะ A-Z a-z 0-9 ไม่เกิน 10 ตัว)
const sanitizeSymbol = (value: string) =>
  value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);

interface AssetCreateDialogProps {
  onClose: () => void;
}

// Dialog สร้าง Asset ใหม่ (symbol/name/ประเภท) เรียก POST /assets
export function AssetCreateDialog({ onClose }: AssetCreateDialogProps) {
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("crypto");
  // เหรียญที่ผู้ใช้เลือกจากผลค้นหา (CoinGecko id ไม่กำกวมต่างจาก symbol) บังคับเมื่อเป็น crypto
  const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(
    null,
  );
  const [coinQuery, setCoinQuery] = useState("");
  const [debouncedCoinQuery, setDebouncedCoinQuery] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // หน่วงการค้นหา 300ms หลังหยุดพิมพ์ ไม่ยิง CoinGecko ทุกตัวอักษร
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCoinQuery(coinQuery), 300);
    return () => clearTimeout(timer);
  }, [coinQuery]);

  const coinSearchQuery = useCoinSearchQuery(debouncedCoinQuery);
  const coinResults = coinSearchQuery.data?.slice(0, 8) ?? [];
  const showCoinResults =
    assetType === "crypto" && !selectedCoin && coinQuery.trim().length >= 2;

  const handleSelectCoin = (coin: CoinSearchResult) => {
    setSelectedCoin(coin);
    // กัน symbol ว่างหลังตัดอักขระพิเศษ (ช่องนี้แก้เองไม่ได้ ถ้าว่างจะสร้างไม่ได้)
    setSymbol(sanitizeSymbol(coin.symbol) || sanitizeSymbol(coin.id));
    setName(coin.name.slice(0, 100));
    setCoinQuery("");
    setDebouncedCoinQuery("");
    setValidationError("");
    setErrorMessage("");
  };

  const handleChangeAssetType = (nextType: AssetType) => {
    if (nextType === assetType) return;
    setAssetType(nextType);
    // เคลียร์ค่าที่เติมไว้ ไม่ให้ symbol/name ของเหรียญติดไปกับหุ้น (และกลับกัน)
    setSelectedCoin(null);
    setCoinQuery("");
    setDebouncedCoinQuery("");
    setSymbol("");
    setName("");
    setValidationError("");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      assetService.createAsset({
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        asset_type: assetType,
        coingecko_id:
          assetType === "crypto" ? selectedCoin?.id : undefined,
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },

    onError: (error: unknown) => {
      if (axios.isAxiosError<{ message: string }>(error)) {
        if (error.response?.status === 409) {
          setErrorMessage("มีสินทรัพย์นี้อยู่แล้ว (ชื่อหรือ Symbol ซ้ำ)");
          return;
        }
        setErrorMessage(
          error.response?.data?.message || "สร้างสินทรัพย์ไม่สำเร็จ",
        );
        return;
      }
      setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    },
  });

  const handleCreate = () => {
    const trimmedSymbol = symbol.trim();
    const trimmedName = name.trim();

    if (assetType === "crypto" && !selectedCoin) {
      setValidationError("กรุณาค้นหาและเลือกเหรียญจากรายการ");
      return;
    }

    if (!trimmedSymbol) {
      setValidationError("กรุณากรอก Symbol");
      return;
    }

    if (trimmedSymbol.length > 10) {
      setValidationError("Symbol ต้องไม่เกิน 10 ตัวอักษร");
      return;
    }

    if (!trimmedName) {
      setValidationError("กรุณากรอกชื่อสินทรัพย์");
      return;
    }

    if (trimmedName.length > 100) {
      setValidationError("ชื่อต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    setValidationError("");
    setErrorMessage("");
    createMutation.mutate();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-asset-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#EAE5FF] text-[#7566C7]">
            <Layers size={24} />
          </div>
          <div>
            <h3
              id="create-asset-title"
              className="text-xl font-bold text-[#39365F]"
            >
              เพิ่มสินทรัพย์
            </h3>
            <p className="text-sm text-gray-500">
              บันทึกสินทรัพย์ใหม่ที่จะติดตาม
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Type
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChangeAssetType("crypto")}
                  disabled={createMutation.isPending}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    assetType === "crypto"
                      ? "border-[#7566C7] bg-[#EAE5FF] text-[#7566C7]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Crypto
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeAssetType("stock")}
                  disabled={createMutation.isPending}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    assetType === "stock"
                      ? "border-[#7566C7] bg-[#EAE5FF] text-[#7566C7]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Stock
                </button>
              </div>
            </div>

            {assetType === "crypto" && (
              <div className="form-control">
                <span className="label-text mb-2 font-medium text-[#39365F]">
                  เหรียญ
                </span>
                {selectedCoin ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#7566C7] bg-[#EAE5FF] px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-semibold text-[#39365F]">
                      {selectedCoin.name}{" "}
                      <span className="font-normal text-[#5C6899]">
                        ({selectedCoin.symbol.toUpperCase()})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoin(null);
                        setSymbol("");
                        setName("");
                      }}
                      disabled={createMutation.isPending}
                      aria-label="เปลี่ยนเหรียญ"
                      className="shrink-0 text-[#7566C7]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6E7BB3]" />
                    <input
                      type="search"
                      className="input input-bordered w-full bg-white pl-9 text-[#39365F] focus:border-[#7566C7] focus:outline-none"
                      placeholder="ค้นหาเหรียญ เช่น bitcoin"
                      value={coinQuery}
                      onChange={(e) => {
                        setCoinQuery(e.target.value);
                        setValidationError("");
                      }}
                      autoFocus
                      disabled={createMutation.isPending}
                    />
                    {showCoinResults && (
                      <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                        {coinSearchQuery.isFetching && (
                          <li className="px-4 py-2 text-sm text-[#5C6899]">
                            กำลังค้นหา...
                          </li>
                        )}
                        {coinSearchQuery.isError && (
                          <li className="px-4 py-2 text-sm text-error">
                            ค้นหาเหรียญไม่สำเร็จ ลองใหม่อีกครั้ง
                          </li>
                        )}
                        {!coinSearchQuery.isFetching &&
                          !coinSearchQuery.isError &&
                          coinResults.length === 0 && (
                            <li className="px-4 py-2 text-sm text-[#5C6899]">
                              ไม่พบเหรียญที่ตรงกับคำค้นหา
                            </li>
                          )}
                        {coinResults.map((coin) => (
                          <li key={coin.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectCoin(coin)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-[#F3F5FD]"
                            >
                              <span className="min-w-0 truncate font-semibold text-[#39365F]">
                                {coin.name}
                              </span>
                              <span className="shrink-0 text-xs text-[#5C6899]">
                                {coin.symbol.toUpperCase()}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Symbol
              </span>
              {/* crypto: เติมให้อัตโนมัติจากเหรียญที่เลือก ห้ามพิมพ์เอง / stock: พิมพ์เองได้ */}
              <input
                type="text"
                className={`input input-bordered w-full uppercase text-[#39365F] focus:border-[#7566C7] focus:outline-none ${
                  assetType === "crypto" ? "cursor-not-allowed bg-gray-100" : "bg-white"
                }`}
                placeholder={
                  assetType === "crypto"
                    ? "เติมให้อัตโนมัติเมื่อเลือกเหรียญ"
                    : "เช่น AAPL"
                }
                value={symbol}
                onChange={(e) => {
                  setSymbol(sanitizeSymbol(e.target.value));
                  setValidationError("");
                  setErrorMessage("");
                }}
                readOnly={assetType === "crypto"}
                maxLength={10}
                autoFocus={assetType === "stock"}
                disabled={createMutation.isPending}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2 font-medium text-[#39365F]">
                Name
              </span>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-[#39365F] focus:border-[#7566C7] focus:outline-none"
                placeholder="เช่น Bitcoin"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError("");
                  setErrorMessage("");
                }}
                maxLength={100}
                disabled={createMutation.isPending}
              />
            </label>

            {validationError && (
              <p className="text-sm text-error">{validationError}</p>
            )}
            {errorMessage && (
              <p className="text-sm text-error">{errorMessage}</p>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="btn border-0 bg-[#7566C7] text-white hover:bg-[#6356B8]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  กำลังสร้าง...
                </>
              ) : (
                "สร้างสินทรัพย์"
              )}
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="ปิด Popup"
        onClick={() => {
          if (!createMutation.isPending) {
            onClose();
          }
        }}
      />
    </div>,
    document.body,
  );
}
