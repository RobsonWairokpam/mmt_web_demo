"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";

type ItemImage = { url: string };

type Auction = {
  id: string;
  startingPrice: number;
  minimumIncrement: number;
  currentBid: number | null;
  currentBidderId: string | null;
  status: string;
  startTime: string;
  endTime: string;
  buyNowPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  updatedAt: string;
  itemId: string;
  winnerId: string | null;
};

type Items = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sellingMethod: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  sellerId: string | null;
  itemImages: ItemImage[];
  auction: Auction | null;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR", // change to your currency
    maximumFractionDigits: 0,
  }).format(n);

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SOLD: "bg-gray-200 text-gray-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
};

function FullScreenLoader({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </main>
  );
}

function ItemCard({ item }: { item: Items }) {
  const cover = item.itemImages?.[0]?.url;
  const isAuction = !!item.auction;
  const price = isAuction
    ? (item.auction!.currentBid ?? item.auction!.startingPrice)
    : item.price;

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            statusStyles[item.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {item.status}
        </span>

        {item.itemImages.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            +{item.itemImages.length - 1} photos
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="truncate text-base font-semibold text-gray-900">
          {item.name}
        </h3>

        {item.description && (
          <p className="line-clamp-2 text-sm text-gray-500">
            {item.description}
          </p>
        )}

        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {isAuction
                ? item.auction!.currentBid
                  ? "Current bid"
                  : "Starting price"
                : "Price"}
            </p>
            <p className="text-lg font-bold text-amber-700">{money(price)}</p>
          </div>

          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            {isAuction ? "Auction" : item.sellingMethod}
          </span>
        </div>

        {isAuction && (
          <p className="border-t pt-2 text-xs text-gray-500">
            Ends {new Date(item.auction!.endTime).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-5 w-1/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Items[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // not logged in -> go to login (no ugly text)
  useEffect(() => {
    if (!loading && !user && !loggingOut) router.replace("/login");
  }, [loading, user, loggingOut, router]);

  useEffect(() => {
    if (loading || !user) return;

    api
      .get("/items")
      .then((res) => setItems(res.data.data ?? res.data))
      .catch(console.error)
      .finally(() => setItemsLoading(false));
  }, [loading, user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  if (loggingOut) return <FullScreenLoader text="Logging you out..." />;
  if (loading || !user) return <FullScreenLoader text="Loading..." />;

  const initial = user.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-amber-50 text-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-amber-700">MMT</h1>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white">
              {initial}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Welcome */}
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-2xl font-bold">Welcome back, {user.name} 👋</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {user.isSeller && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Seller
              </span>
            )}
            {user.isAuctioneer && (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                Bidder
              </span>
            )}
          </div>
        </section>

        {/* Items */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Items</h3>
            {!itemsLoading && (
              <span className="text-sm text-gray-500">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {itemsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              No items yet.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
