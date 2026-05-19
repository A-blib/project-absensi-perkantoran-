import {
  countActiveAdmins,
  findUserById,
} from "@/server/repositories/user-repository";

export class AdminAccessPolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = "AdminAccessPolicyError";
    this.status = 400;
  }
}

async function ensureAnotherActiveAdminExists(userId) {
  const remainingActiveAdmins = await countActiveAdmins({ excludeUserId: userId });

  if (remainingActiveAdmins < 1) {
    throw new AdminAccessPolicyError(
      "Minimal harus ada 1 admin aktif. Admin aktif terakhir tidak bisa diubah.",
    );
  }
}

export async function assertCanUpdateUserAccess(userId, updates) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AdminAccessPolicyError("User tidak ditemukan.");
  }

  const isActiveAdmin =
    currentUser.role === "admin" && currentUser.status === "active";
  const willLoseAdminRole =
    updates.role !== undefined && updates.role !== "admin";
  const willBecomeInactive =
    updates.status !== undefined && updates.status !== "active";

  if (isActiveAdmin && (willLoseAdminRole || willBecomeInactive)) {
    await ensureAnotherActiveAdminExists(userId);
  }
}

export async function assertCanDeleteUserAccess(userId, session) {
  if (session?.id === userId) {
    throw new AdminAccessPolicyError(
      "Akun admin yang sedang login tidak bisa dihapus.",
    );
  }

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AdminAccessPolicyError("User tidak ditemukan.");
  }

  if (currentUser.role === "admin" && currentUser.status === "active") {
    await ensureAnotherActiveAdminExists(userId);
  }
}
