import { useQuery } from "@tanstack/react-query";
import { assetService } from "../services/asset.services";

// ดึงรายการ Asset ทั้งหมดของผู้ใช้ ใช้แสดงใน list หลักของหน้า Investment
export const useAssetsQuery = () => {
  return useQuery({
    queryKey: ["assets"],
    queryFn: assetService.getAssets,
  });
};
