import { createFileRoute } from "@tanstack/react-router";
import { StyleForm } from "@/components/desk/style-form";

export const Route = createFileRoute("/style/$code")({
  component: StylePage,
});

function StylePage() {
  const { code } = Route.useParams();
  return <StyleForm key={code} code={code} />;
}
