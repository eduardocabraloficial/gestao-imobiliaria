import type { AdminProperty } from "@/types";

export const demoAdminProperties: AdminProperty[] = [
  {
    id: "demo-property-1", code: "AP-1042", slug: "apartamento-3-quartos-jardim-europa-ap-1042", isPublic: true, title: "Apartamento com vista aberta e varanda gourmet", purpose: "venda", propertyType: "Apartamento", description: "Ambientes amplos, varanda gourmet e excelente iluminação natural.", characteristics: ["Varanda gourmet", "Iluminação natural", "Portaria 24 horas"], price: 1180000, condominiumFee: 980, iptu: 420, address: "Alameda das Flores, 120", neighborhood: "Jardim Europa", city: "São Paulo", state: "SP", zipCode: "01400-000", area: 128, bedrooms: 3, suites: 1, bathrooms: 3, parkingSpaces: 2, furnished: false, petsAllowed: true, featured: true, status: "disponivel", imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", images: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-property-2", code: "CA-2081", slug: "casa-contemporanea-alphaville-ca-2081", isPublic: true, title: "Casa contemporânea em condomínio exclusivo", purpose: "venda", propertyType: "Casa", description: "Residência contemporânea com lazer completo e segurança 24 horas.", characteristics: ["Condomínio fechado", "Piscina", "Área gourmet"], price: 1790000, condominiumFee: 1350, iptu: 690, address: "Alameda Safira, 58", neighborhood: "Alphaville", city: "Barueri", state: "SP", zipCode: "06454-000", area: 310, bedrooms: 4, suites: 3, bathrooms: 5, parkingSpaces: 4, furnished: false, petsAllowed: true, featured: true, status: "reservado", imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85", images: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-property-3", code: "AP-7715", slug: "apartamento-mobiliado-moema-ap-7715", isPublic: true, title: "Apartamento mobiliado a poucos passos do parque", purpose: "aluguel", propertyType: "Apartamento", description: "Pronto para morar, mobiliado e em localização privilegiada.", characteristics: ["Mobiliado", "Próximo ao parque", "Aceita pets"], price: 6200, condominiumFee: 1100, iptu: 280, address: "Avenida Pavão, 840", neighborhood: "Moema", city: "São Paulo", state: "SP", zipCode: "04516-000", area: 92, bedrooms: 2, suites: 1, bathrooms: 2, parkingSpaces: 1, furnished: true, petsAllowed: true, featured: false, status: "disponivel", imageUrl: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85", images: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-property-4", code: "ST-3310", slug: "studio-moderno-pinheiros-st-3310", isPublic: false, title: "Studio moderno próximo ao metrô", purpose: "venda", propertyType: "Studio", description: "Planta inteligente em edifício com serviços e rooftop.", characteristics: ["Rooftop", "Próximo ao metrô"], price: 590000, condominiumFee: 540, iptu: 120, address: "Rua dos Pinheiros, 455", neighborhood: "Pinheiros", city: "São Paulo", state: "SP", zipCode: "05422-010", area: 38, bedrooms: 1, suites: 0, bathrooms: 1, parkingSpaces: 0, furnished: false, petsAllowed: true, featured: false, status: "vendido", imageUrl: "", images: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const demoInterestLinks = [
  { id: "demo-interest-1", clientId: "joao-silva", propertyId: "demo-property-1", notes: "Imóvel principal em avaliação." },
  { id: "demo-interest-2", clientId: "maria-santos", propertyId: "demo-property-2", notes: "Aguardando visita." },
  { id: "demo-interest-3", clientId: "carlos-lima", propertyId: "demo-property-4", notes: "Opção para investimento." },
];
