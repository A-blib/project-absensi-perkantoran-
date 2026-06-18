import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  if (user.role !== "admin") {
    redirect("/employee");
  }

  return children;
}
