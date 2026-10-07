import { describe, test, expect, beforeEach, vi } from "vitest";
import { WalletService } from "../../services/wallet.services";
import { WalletRepository } from "../../../src/repositories/wallet.repository";

describe("WalletService Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks(); // Mock ทั้งหมดใน Vitest ก่อนเริ่ม Test แต่ละข้อ
  });

  // -------------------------------------------------------------------
  // 📁 Sub-Describe 1: GET /api/v1/wallets (getWallets)
  // -------------------------------------------------------------------
  describe("getWallets()", () => {
    test("should return formatted wallets when userId is valid", async () => {
      // Arrange
      // เติมn เพื่อให้เป็น BigInt
      const mockUserId = 1n;
      const mockWalletsFromDb = [
        {
          id: 101n,
          userId: mockUserId,
          name: "Main Wallet",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ];

      // ใช้ vi.spyOn() ในการ Mock Repository Method
      const findManySpy = vi
        .spyOn(WalletRepository, "findManyByUserId")
        .mockResolvedValue(mockWalletsFromDb);

      // Act
      const result = await WalletService.getWallets(mockUserId);

      // Assert
      expect(findManySpy).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([
        {
          id: "101",
          name: "Main Wallet",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]);
    });

    test("should return empty array when user has no wallets", async () => {
      // Arrange
      const mockUserId = 2n;
      vi.spyOn(WalletRepository, "findManyByUserId").mockResolvedValue([]);

      // Act
      const result = await WalletService.getWallets(mockUserId);

      // Assert
      expect(result).toEqual([]);
    });

    test("should throw INTERNAL_SERVER_ERROR when repository fails", async () => {
      // Arrange
      const mockUserId = 3n;
      vi.spyOn(WalletRepository, "findManyByUserId").mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(WalletService.getWallets(mockUserId)).rejects.toThrow(
        "INTERNAL_SERVER_ERROR",
      );
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 2: POST /api/v1/wallets (createWallet)
  // -------------------------------------------------------------------
  describe("createWallet()", () => {
    test("should create wallet successfully when name is unique", async () => {
      // Arrange
      const mockUserId = 1n;
      const walletName = "Savings";
      const mockCreatedWallet = {
        id: 201n,
        userId: mockUserId,
        name: walletName,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      // Mock 1: เช็กชื่อซ้ำ -> ไม่เจอ (return null)
      const findByNameSpy = vi
        .spyOn(WalletRepository, "findByNameAndUserId")
        .mockResolvedValue(null);

      // Mock 2: สร้าง Wallet ลง DB -> สำเร็จ
      const createSpy = vi
        .spyOn(WalletRepository, "create")
        .mockResolvedValue(mockCreatedWallet);

      // Act
      const result = await WalletService.createWallet(mockUserId, walletName);

      // Assert
      expect(findByNameSpy).toHaveBeenCalledWith(walletName, mockUserId);
      expect(createSpy).toHaveBeenCalledWith(mockUserId, walletName);
      expect(result).toEqual({
        id: "201",
        name: "Savings",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    test("should throw WALLET_NAME_EXISTS error when wallet name already exists", async () => {
      // Arrange
      const mockUserId = 1n;
      const walletName = "Savings";
      const existingWallet = {
        id: 101n,
        userId: mockUserId,
        name: walletName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock: เช็กชื่อซ้ำ -> เจอข้อมูลเดิมอยู่แล้ว
      vi.spyOn(WalletRepository, "findByNameAndUserId").mockResolvedValue(
        existingWallet,
      );

      // Act & Assert: ต้อง Throw Error ชื่อซ้ำกลับมา
      await expect(
        WalletService.createWallet(mockUserId, walletName),
      ).rejects.toThrow("WALLET_NAME_EXISTS");
    });

    test("should throw INTERNAL_SERVER_ERROR when repository fails", async () => {
      // Arrange
      const mockUserId = 1n;
      vi.spyOn(WalletRepository, "findByNameAndUserId").mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(
        WalletService.createWallet(mockUserId, "New Wallet"),
      ).rejects.toThrow("INTERNAL_SERVER_ERROR");
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 3: GET /api/v1/wallets/:id (getWalletById)
  // -------------------------------------------------------------------
  describe("getWalletById()", () => {
    test("should return formatted wallet when wallet exists and belongs to user", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;
      const mockWalletFromDb = {
        id: mockWalletId,
        userId: mockUserId,
        name: "Main Wallet",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      // Mock: ค้นหาเจอ Wallet ใน DB
      const findByIdSpy = vi
        .spyOn(WalletRepository, "findByIdAndUserId")
        .mockResolvedValue(mockWalletFromDb);

      // Act
      const result = await WalletService.getWalletById(
        mockWalletId,
        mockUserId,
      );

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(mockWalletId, mockUserId);
      expect(result).toEqual({
        id: "101",
        name: "Main Wallet",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    test("should throw WALLET_NOT_FOUND error when wallet does not exist or user has no access", async () => {
      // Arrange
      const mockWalletId = 999n;
      const mockUserId = 1n;

      // Mock: ค้นหาไม่เจอ (return null)
      vi.spyOn(WalletRepository, "findByIdAndUserId").mockResolvedValue(null);

      // Act & Assert
      await expect(
        WalletService.getWalletById(mockWalletId, mockUserId),
      ).rejects.toThrow("WALLET_NOT_FOUND");
    });

    test("should throw INTERNAL_SERVER_ERROR when repository fails", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;

      vi.spyOn(WalletRepository, "findByIdAndUserId").mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(
        WalletService.getWalletById(mockWalletId, mockUserId),
      ).rejects.toThrow("INTERNAL_SERVER_ERROR");
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 4: PUT /api/v1/wallets/:id (updateWallet)
  // -------------------------------------------------------------------
  describe("updateWallet()", () => {
    test("should update wallet successfully when name is valid and unique", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;
      const newName = "Investment";

      const existingWallet = {
        id: mockWalletId,
        userId: mockUserId,
        name: "Old Name",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      const updatedWalletFromDb = {
        ...existingWallet,
        name: newName,
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      };

      // Mock 1: เช็กสิทธิ์ Ownership -> เจอ Wallet เดิม
      const findByIdSpy = vi
        .spyOn(WalletRepository, "findByIdAndUserId")
        .mockResolvedValue(existingWallet);

      // Mock 2: เช็กชื่อซ้ำ -> ไม่เจอ (return null)
      const findByNameSpy = vi
        .spyOn(WalletRepository, "findByNameAndUserId")
        .mockResolvedValue(null);

      // Mock 3: อัปเดตข้อมูลลง DB -> สำเร็จ
      const updateSpy = vi
        .spyOn(WalletRepository, "update")
        .mockResolvedValue(updatedWalletFromDb);

      // Act
      const result = await WalletService.updateWallet(
        mockWalletId,
        mockUserId,
        newName,
      );

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(mockWalletId, mockUserId);
      expect(findByNameSpy).toHaveBeenCalledWith(newName, mockUserId);
      expect(updateSpy).toHaveBeenCalledWith(mockWalletId, newName);
      expect(result).toEqual({
        id: "101",
        name: "Investment",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      });
    });

    test("should throw WALLET_NOT_FOUND error when wallet does not exist or user has no access", async () => {
      // Arrange
      const mockWalletId = 999n;
      const mockUserId = 1n;

      // Mock: ค้นหาไม่เจอ
      vi.spyOn(WalletRepository, "findByIdAndUserId").mockResolvedValue(null);

      // Act & Assert
      await expect(
        WalletService.updateWallet(mockWalletId, mockUserId, "New Name"),
      ).rejects.toThrow("WALLET_NOT_FOUND");
    });

    test("should throw WALLET_NAME_EXISTS error when new name is already taken", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;
      const duplicateName = "Savings";

      const existingWallet = {
        id: mockWalletId,
        userId: mockUserId,
        name: "Old Name",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherWalletWithSameName = {
        id: 102n, // เป็นของ Wallet ใบอื่น
        userId: mockUserId,
        name: duplicateName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WalletRepository, "findByIdAndUserId").mockResolvedValue(
        existingWallet,
      );
      // Mock: เจอชื่อนี้ใน DB อยู่แล้ว
      vi.spyOn(WalletRepository, "findByNameAndUserId").mockResolvedValue(
        otherWalletWithSameName,
      );

      // Act & Assert
      await expect(
        WalletService.updateWallet(mockWalletId, mockUserId, duplicateName),
      ).rejects.toThrow("WALLET_NAME_EXISTS");
    });

    test("should throw INTERNAL_SERVER_ERROR when repository fails", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;

      vi.spyOn(WalletRepository, "findByIdAndUserId").mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(
        WalletService.updateWallet(mockWalletId, mockUserId, "New Name"),
      ).rejects.toThrow("INTERNAL_SERVER_ERROR");
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 5: DELETE /api/v1/wallets/:id (deleteWallet)
  // -------------------------------------------------------------------
  describe("deleteWallet()", () => {
    test("should delete wallet successfully when wallet exists and belongs to user", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;
      const existingWallet = {
        id: mockWalletId,
        userId: mockUserId,
        name: "Wallet To Delete",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      // Mock 1: ตรวจสอบพบ Wallet อยู่ใน DB
      const findByIdSpy = vi
        .spyOn(WalletRepository, "findByIdAndUserId")
        .mockResolvedValue(existingWallet);

      // Mock 2: ลบ Wallet ออกจาก DB สำเร็จ
      const deleteSpy = vi
        .spyOn(WalletRepository, "delete")
        .mockResolvedValue(existingWallet);

      // Act
      const result = await WalletService.deleteWallet(mockWalletId, mockUserId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(mockWalletId, mockUserId);
      expect(deleteSpy).toHaveBeenCalledWith(mockWalletId);
      expect(result).toEqual({
        id: "101",
        name: "Wallet To Delete",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    test("should throw WALLET_NOT_FOUND error when wallet does not exist or user has no access", async () => {
      // Arrange
      const mockWalletId = 999n;
      const mockUserId = 1n;

      // Mock: ไม่พบ Wallet ใน DB
      vi.spyOn(WalletRepository, "findByIdAndUserId").mockResolvedValue(null);

      // Act & Assert
      await expect(
        WalletService.deleteWallet(mockWalletId, mockUserId),
      ).rejects.toThrow("WALLET_NOT_FOUND");
    });

    test("should throw INTERNAL_SERVER_ERROR when repository fails", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;

      vi.spyOn(WalletRepository, "findByIdAndUserId").mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(
        WalletService.deleteWallet(mockWalletId, mockUserId),
      ).rejects.toThrow("INTERNAL_SERVER_ERROR");
    });
  });
  // -------------------------------------------------------------------
  // 📁 Sub-Describe 6: GET /api/v1/wallets/:id/balance (getWalletBalance)
  // -------------------------------------------------------------------
  describe("getWalletBalance()", () => {
    test("should calculate and return formatted balance when wallet exists", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;
      const existingWallet = {
        id: mockWalletId,
        userId: mockUserId,
        name: "Main Wallet",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };

      // Mock 1: เช็กสิทธิ์ Ownership -> เจอ Wallet
      const findByIdSpy = vi
        .spyOn(WalletRepository, "findByIdAndUserId")
        .mockResolvedValue(existingWallet);

      // Mock 2: ดึงยอด Income/Expense จาก Repository (15000 - 3500 = 11500)
      const calculateSpy = vi
        .spyOn(WalletRepository, "calculateBalance")
        .mockResolvedValue({ totalIncome: 15000, totalExpense: 3500 });

      // Act: เรียกใช้ getWalletBalance
      const result = await WalletService.getWalletBalance(
        mockWalletId,
        mockUserId,
      );

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(mockWalletId, mockUserId);
      expect(calculateSpy).toHaveBeenCalledWith(mockWalletId);
      // คาดหวัง balance เป็น string ทศนิยม 2 ตำแหน่ง ("11500.00")
      expect(result).toEqual({
        balance: "11500.00",
      });
    });

    test("should throw WALLET_NOT_FOUND error when wallet does not exist or user has no access", async () => {
      // Arrange
      const mockWalletId = 999n;
      const mockUserId = 1n;

      vi.spyOn(WalletRepository, "findByIdAndUserId").mockResolvedValue(null);

      // Act & Assert
      await expect(
        WalletService.getWalletBalance(mockWalletId, mockUserId),
      ).rejects.toThrow("WALLET_NOT_FOUND");
    });

    test("should throw INTERNAL_SERVER_ERROR when repository fails", async () => {
      // Arrange
      const mockWalletId = 101n;
      const mockUserId = 1n;

      vi.spyOn(WalletRepository, "findByIdAndUserId").mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(
        WalletService.getWalletBalance(mockWalletId, mockUserId),
      ).rejects.toThrow("INTERNAL_SERVER_ERROR");
    });
  });
});
