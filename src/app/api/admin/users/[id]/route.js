import { NextResponse } from "next/server";
import { resetPasswordSchema, updateUserSchema } from "@/lib/validations/users";
import { requireAdminSession } from "@/server/auth/guards";
import {
  deleteUser,
  resetUserPassword,
  updateUser,
} from "@/server/repositories/user-repository";
import {
  AdminAccessPolicyError,
  assertCanDeleteUserAccess,
  assertCanUpdateUserAccess,
} from "@/server/services/admin-access-policy";

function errorStatus(error) {
  return error instanceof AdminAccessPolicyError ? error.status : 500;
}

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    if (body.action === "reset-password") {
      const parsed = resetPasswordSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ message: "Password baru tidak valid." }, { status: 422 });
      }

      const user = await resetUserPassword(id, parsed.data.password, true);
      return NextResponse.json({ user });
    }

    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Data pegawai tidak valid." }, { status: 422 });
    }

    await assertCanUpdateUserAccess(id, parsed.data);
    const user = await updateUser(id, parsed.data);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: errorStatus(error) });
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await assertCanDeleteUserAccess(id, session);
    await deleteUser(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: errorStatus(error) });
  }
}
