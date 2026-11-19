"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { removePropertyImageAction, setPropertyCoverAction, uploadPropertyImagesAction } from "@/app/admin/imoveis/actions";
import type { PropertyImage } from "@/types";
import { normalizeImageSource } from "@/lib/images";

export function PropertyImagesManager({ propertyId, images }: { propertyId: string; images: PropertyImage[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function upload(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); startTransition(async () => setMessage((await uploadPropertyImagesAction(propertyId, new FormData(event.currentTarget))).message)); }
  function cover(id: string) { startTransition(async () => setMessage((await setPropertyCoverAction(propertyId, id)).message)); }
  function remove(id: string) { if (!window.confirm("Remover esta imagem do imóvel?")) return; startTransition(async () => setMessage((await removePropertyImageAction(propertyId, id)).message)); }
  const validImages = images.flatMap((image) => {
    const url = normalizeImageSource(image.url);
    return url ? [{ ...image, url }] : [];
  });
  return <section className="surface mt-6 rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-extrabold">Imagens do imóvel</h2><p className="mt-1 text-xs text-[#7a837e]">JPG, PNG ou WebP, até 8 MB por arquivo.</p></div><form onSubmit={upload} className="flex flex-col gap-2 sm:flex-row"><input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="text-xs" /><button disabled={pending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><ImagePlus size={14} /> Enviar imagens</button></form></div>{message && <p role="status" className="mt-4 rounded-xl bg-[#edf6f1] px-4 py-3 text-xs font-bold text-[#315d50]">{message}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{validImages.map((image) => <article key={image.id} className="overflow-hidden rounded-xl border border-[#e1e4e0]"><div className="relative aspect-[4/3] bg-[#e7ece9]"><Image src={image.url} alt="Imagem do imóvel" fill sizes="300px" className="object-cover" unoptimized /></div><div className="flex items-center justify-between p-2"><button onClick={() => cover(image.id)} disabled={pending || image.isCover} className="action"><Star size={13} className={image.isCover ? "fill-current" : ""} /> {image.isCover ? "Capa" : "Definir capa"}</button><button onClick={() => remove(image.id)} disabled={pending} aria-label="Remover imagem" className="action text-[#a54b45]"><Trash2 size={13} /></button></div></article>)}{!validImages.length && <div className="col-span-full rounded-xl border border-dashed border-[#d9deda] py-10 text-center text-xs text-[#7a837e]">Nenhuma imagem válida enviada ao Storage.</div>}</div></section>;
}
