"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Save } from "lucide-react";
import Link from "next/link";
import { createPropertyAction, updatePropertyAction } from "@/app/admin/imoveis/actions";
import type { AdminProperty, PropertyInput } from "@/types";

export function PropertyForm({ property }: { property?: AdminProperty }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = (name: string) => { const value = String(form.get(name) ?? ""); return value === "" ? null : Number(value); };
    const input: PropertyInput = {
      code: String(form.get("code")), title: String(form.get("title")), purpose: String(form.get("purpose")) as PropertyInput["purpose"],
      propertyType: String(form.get("propertyType")), description: String(form.get("description")), price: Number(form.get("price")) || 0,
      condominiumFee: number("condominiumFee"), iptu: number("iptu"), address: String(form.get("address")), neighborhood: String(form.get("neighborhood")),
      city: String(form.get("city")), state: String(form.get("state")), zipCode: String(form.get("zipCode")), area: number("area"), bedrooms: number("bedrooms"),
      suites: number("suites"), bathrooms: number("bathrooms"), parkingSpaces: number("parkingSpaces"), furnished: form.get("furnished") === "on",
      petsAllowed: form.get("petsAllowed") === "on", featured: form.get("featured") === "on", status: String(form.get("status")) as PropertyInput["status"], imageUrl: String(form.get("imageUrl")),
      isPublic: form.get("isPublic") === "on", characteristics: String(form.get("characteristics") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    };
    setMessage(""); setError("");
    startTransition(async () => {
      const result = property ? await updatePropertyAction(property.id, input) : await createPropertyAction(input);
      if (!result.success) { setError(result.message); return; }
      setMessage(result.message);
      if (!property && result.id && !result.demo) router.push(`/admin/imoveis/${result.id}`); else router.refresh();
    });
  }

  return <form onSubmit={submit} className="space-y-5">
    {message && <Notice text={message} />}{error && <Notice text={error} error />}
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-extrabold">Informações principais</h2><p className="mt-1 text-xs text-[#7a837e]">Identificação, finalidade e valor do imóvel.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field name="code" label="Código" defaultValue={property?.code} required /><div className="sm:col-span-2"><Field name="title" label="Título" defaultValue={property?.title} required /></div><Select name="status" label="Status" defaultValue={property?.status ?? "disponivel"} options={["disponivel", "reservado", "vendido", "alugado", "inativo"]} /><Select name="purpose" label="Finalidade" defaultValue={property?.purpose ?? "venda"} options={["venda", "aluguel"]} /><Field name="propertyType" label="Tipo" defaultValue={property?.propertyType} required /><Field name="price" label="Preço" type="number" defaultValue={property?.price} required /><Field name="condominiumFee" label="Condomínio" type="number" defaultValue={property?.condominiumFee ?? ""} /><Field name="iptu" label="IPTU" type="number" defaultValue={property?.iptu ?? ""} /><div className="sm:col-span-2 lg:col-span-3"><Field name="imageUrl" label="URL da imagem (temporária)" type="url" defaultValue={property?.imageUrl} /></div><div className="sm:col-span-2 lg:col-span-4"><TextArea name="description" label="Descrição" defaultValue={property?.description} /></div></div></section>
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-extrabold">Localização</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="sm:col-span-2"><Field name="address" label="Endereço" defaultValue={property?.address} /></div><Field name="neighborhood" label="Bairro" defaultValue={property?.neighborhood} required /><Field name="city" label="Cidade" defaultValue={property?.city} required /><Field name="state" label="UF" defaultValue={property?.state ?? "SP"} maxLength={2} required /><Field name="zipCode" label="CEP" defaultValue={property?.zipCode} /></div></section>
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-extrabold">Características e publicação</h2></div><div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5"><Field name="area" label="Área (m²)" type="number" defaultValue={property?.area ?? ""} /><Field name="bedrooms" label="Quartos" type="number" defaultValue={property?.bedrooms ?? ""} /><Field name="suites" label="Suítes" type="number" defaultValue={property?.suites ?? ""} /><Field name="bathrooms" label="Banheiros" type="number" defaultValue={property?.bathrooms ?? ""} /><Field name="parkingSpaces" label="Vagas" type="number" defaultValue={property?.parkingSpaces ?? ""} /><div className="sm:col-span-3 lg:col-span-5"><Field name="characteristics" label="Características (separadas por vírgula)" defaultValue={property?.characteristics.join(", ")} /></div></div><div className="mt-5 flex flex-wrap gap-4"><CheckField name="furnished" label="Mobiliado" defaultChecked={property?.furnished} /><CheckField name="petsAllowed" label="Aceita pets" defaultChecked={property?.petsAllowed} /><CheckField name="featured" label="Imóvel em destaque" defaultChecked={property?.featured} /><CheckField name="isPublic" label="Publicar no portal" defaultChecked={property?.isPublic ?? true} /></div></section>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Link href="/admin/imoveis" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe3df] px-4 py-2.5 text-xs font-bold"><ArrowLeft size={14} /> Voltar</Link><button disabled={pending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Save size={14} />{pending ? "Salvando..." : property ? "Salvar alterações" : "Cadastrar imóvel"}</button></div>
  </form>;
}

function Field({ name, label, type = "text", defaultValue, required, maxLength }: { name: string; label: string; type?: string; defaultValue?: string | number; required?: boolean; maxLength?: number }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{label}</span><input name={name} type={type} defaultValue={defaultValue} required={required} maxLength={maxLength} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} className="focus-ring h-10 w-full rounded-xl border border-[#dfe3df] px-3 text-xs outline-none" /></label>; }
function Select({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: string[] }) { return <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{label}</span><select name={name} defaultValue={defaultValue} className="focus-ring h-10 w-full rounded-xl border border-[#dfe3df] bg-white px-3 text-xs capitalize outline-none">{options.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}</select></label>; }
function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) { return <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f7974]">{label}</span><textarea name={name} defaultValue={defaultValue} className="focus-ring min-h-28 w-full resize-y rounded-xl border border-[#dfe3df] p-3 text-xs outline-none" /></label>; }
function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) { return <label className="flex items-center gap-2 rounded-xl border border-[#e1e4e0] px-3 py-2 text-xs font-semibold"><input name={name} type="checkbox" defaultChecked={defaultChecked} className="size-4 accent-[#173f35]" />{label}</label>; }
function Notice({ text, error = false }: { text: string; error?: boolean }) { return <div role={error ? "alert" : "status"} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${error ? "border-[#f0d4d1] bg-[#fff4f3] text-[#a8443f]" : "border-[#cfe1d7] bg-[#edf6f1] text-[#315d50]"}`}><Check size={15} />{text}</div>; }
