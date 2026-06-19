import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/guards";
import { findUserById } from "@/server/repositories/user-repository";

function noStoreJson(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee") {
    return noStoreJson({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.id?.startsWith("demo-")) {
    return noStoreJson({
      employee: {
        id: session.id,
        name: session.name || "Karyawan",
        email: session.email || "",
        position: "Finance Officer",
      },
    });
  }

  try {
    const user = await findUserById(session.id);

    return noStoreJson({
      employee: {
        id: session.id,
        name: user?.name || session.name || "Karyawan",
        email: user?.email || session.email || "",
        position: user?.position || user?.division || "Employee",
      },
    });
  } catch {
    return noStoreJson({
      employee: {
        id: session.id,
        name: session.name || "Karyawan",
        email: session.email || "",
        position: "Employee",
      },
    });
  }
}
