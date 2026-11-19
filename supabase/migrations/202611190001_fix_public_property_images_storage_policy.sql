-- Registra o hotfix de leitura pública das imagens sem expor user_id ao papel anon.

begin;

drop policy if exists "storage_property_images_read" on storage.objects;
drop policy if exists "storage_property_images_public_read" on storage.objects;
drop policy if exists "storage_property_images_authenticated_read" on storage.objects;

create policy "storage_property_images_public_read"
on storage.objects for select to anon
using (
  bucket_id = 'property-images'
  and exists (
    select 1
    from public.property_images pi
    join public.properties p on p.id = pi.property_id
    where pi.storage_path = name
      and p.is_public
      and p.status = 'disponivel'
  )
);

create policy "storage_property_images_authenticated_read"
on storage.objects for select to authenticated
using (
  bucket_id = 'property-images'
  and exists (
    select 1
    from public.property_images pi
    join public.properties p on p.id = pi.property_id
    where pi.storage_path = name
      and ((p.is_public and p.status = 'disponivel') or p.user_id = (select auth.uid()))
  )
);

commit;
