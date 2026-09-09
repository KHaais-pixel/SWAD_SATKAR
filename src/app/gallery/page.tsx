import type { Metadata } from "next";
import { GalleryAlbum } from "@/components/GalleryAlbum";
import { site } from "@/data/site";
import { getGallery } from "@/lib/content";

export const metadata: Metadata = { title: "Gallery", description: `The house, the plates and the rooms at ${site.name}, in albums.`, alternates: { canonical: "/gallery" } };

export default async function GalleryPage() {
  return <GalleryAlbum items={await getGallery()} />;
}
