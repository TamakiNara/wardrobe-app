import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import PurchaseCandidateForm from "@/components/purchase-candidates/purchase-candidate-form";
import { FormPageHeader } from "@/components/shared/form-page-header";

export const metadata = buildPageMetadata("購入検討登録");

type NewPurchaseCandidatePageSearchParams = Record<
  string,
  string | string[] | undefined
>;

function readSearchParam(
  searchParams: NewPurchaseCandidatePageSearchParams,
  key: string,
): string {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function NewPurchaseCandidatePage({
  searchParams,
}: {
  searchParams: Promise<NewPurchaseCandidatePageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialCategoryId = readSearchParam(resolvedSearchParams, "category");
  const returnTo =
    readSearchParam(resolvedSearchParams, "returnTo") || "/purchase-candidates";
  const returnLabel =
    returnTo === "/purchase-candidates/underwear"
      ? "アンダーウェア購入検討一覧"
      : "購入検討一覧";

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <FormPageHeader
          breadcrumbs={[
            { label: "ホーム", href: "/" },
            { label: returnLabel, href: returnTo },
            { label: "新規作成" },
          ]}
          eyebrow="購入検討管理"
          title="購入検討を追加"
          description="候補の基本情報や購入情報を整理して、新しい購入検討を登録します。"
          actions={
            <Link
              href={returnTo}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              一覧に戻る
            </Link>
          }
        />

        <PurchaseCandidateForm
          mode="create"
          cancelHref={returnTo}
          initialCategoryId={initialCategoryId}
          initialCategoryGroupId={initialCategoryId}
        />
      </div>
    </main>
  );
}
