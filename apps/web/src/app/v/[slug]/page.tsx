import Image from "next/image";
import { notFound } from "next/navigation";
import MenuContent from "./MenuContent";

async function getMenu(slug: string) {
  const apiUrl = "http://localhost:3001/api";
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

  if (!data || !data.menu) notFound();

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20 font-sans">
      <header className="relative h-64 w-full overflow-hidden">
        {data.organization.logo ? (
          <Image
            src={data.organization.logo}
            alt={data.organization.name}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 448px"
          />
        ) : (
          <div className="w-full h-full bg-orange-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {data.organization.name}
          </h1>
          <p className="text-orange-200 text-sm font-medium mt-1 uppercase tracking-widest">
            Menú Digital
          </p>
        </div>
      </header>

      <MenuContent data={data} />

      <footer className="p-8 text-center bg-white border-t border-gray-100 mt-10">
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
          Desarrollado por Rexeat
        </p>
      </footer>
    </div>
  );
}
