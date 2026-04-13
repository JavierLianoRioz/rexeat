import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";

async function getMenu(slug: string) {
  const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3000/api";
  const res = await fetch(`${apiUrl}/public/menu/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch menu");
  }

  return res.json();
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMenu(slug);

  if (!data) notFound();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
      {/* Header del Local */}
      <header className="relative h-48 w-full">
        {data.organization.logo && (
          <Image
            src={data.organization.logo}
            alt={data.organization.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-end p-6">
          <h1 className="text-2xl font-bold text-white">
            {data.organization.name}
          </h1>
        </div>
      </header>

      {/* Categorías */}
      <div className="p-4 flex flex-col gap-8">
        {data.menu.categories.map((cat: any) => (
          <section key={cat.id}>
            <h2 className="text-xl font-bold mb-4 border-b pb-2 border-orange-100">
              {cat.name.es}
            </h2>
            <div className="flex flex-col gap-4">
              {cat.products.map((prod: any) => (
                <div key={prod.id} className="flex gap-4 items-start">
                  {prod.image && (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={prod.image.url}
                        alt={prod.name.es}
                        fill
                        className="rounded-md object-cover shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{prod.name.es}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {prod.description?.es}
                    </p>
                    <span className="text-orange-600 font-bold mt-1 block">
                      {(prod.price / 100).toFixed(2)}€
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
