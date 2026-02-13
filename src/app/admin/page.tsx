import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { ADMIN_AUTH_COOKIE, getAdminSessionValue } from "@/lib/admin-auth";

export default function AdminPage() {
  const session = cookies().get(ADMIN_AUTH_COOKIE)?.value;
  if (session !== getAdminSessionValue()) {
    redirect("/admin/login");
  }

  return <AdminClient />;
}

