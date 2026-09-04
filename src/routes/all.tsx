import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/desk/catalog-page";

export const Route = createFileRoute("/all")({ component: AllPage });

function AllPage() {
  return <CatalogPage />;
}
