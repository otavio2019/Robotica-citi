// Catálogo fechado compartilhado pelo contrato do cadastro TJR.
export const TJR_MODALITIES = ['SEGUIR_LINHA'] as const;
export type Modality = (typeof TJR_MODALITIES)[number];
export type RegistrationPayload = {
  stage?: { name?: string; state?: string; venue?: string; competitionDate?: string };
  institution?: { name?: string; cnpj?: string; inepCode?: string; city?: string; instagramUrl?: string; isPatos?: boolean };
  responsible?: { fullName?: string; document?: string; inepCode?: string; institutionName?: string; email?: string; phone?: string };
  team?: { name?: string; state?: string; city?: string; modalities?: string[]; isGarage?: boolean; marketingCompetitorIndex?: number | null };
  competitors?: Array<{ name?: string; inepCode?: string; birthDate?: string; city?: string; email?: string; phone?: string }>;
  acceptedDeclaration?: boolean;
  imageUseConsent?: boolean;
};
const required = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
export function getAgeInYears(birthDate: Date | string, referenceDate: Date | string) {
  const birth = new Date(birthDate); const reference = new Date(referenceDate);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime())) throw new Error('Data inválida');
  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) age -= 1;
  return age;
}
export function validateRegistration(payload: RegistrationPayload, documentCount = 0) {
  const stage = payload.stage; const institution = payload.institution; const responsible = payload.responsible;
  const team = payload.team; const competitors = payload.competitors ?? [];
  if (!required(stage?.name) || !required(stage?.state) || !required(stage?.venue) || !stage?.competitionDate) throw new Error('Etapa, estado, local e data da competição são obrigatórios');
  if (Number.isNaN(new Date(stage.competitionDate).getTime())) throw new Error('Data da competição inválida');
  if (!responsible || !required(responsible.fullName) || !required(responsible.document) || !required(responsible.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(responsible.email ?? '') || !required(responsible.phone)) throw new Error('Nome, documento, e-mail e telefone do técnico são obrigatórios');
  const normalizedInstitutionCity = institution?.city?.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!institution || !required(institution.name) || !required(institution.cnpj)) throw new Error('Nome e CNPJ da instituição são obrigatórios');
  if (normalizedInstitutionCity !== 'patos' || institution.isPatos !== true) throw new Error('A instituição deve ser de Patos-PB');
  const hasInstitution = true;
  if (!team || !required(team.name) || !required(team.state) || !required(team.city)) throw new Error('Nome, estado e cidade da equipe são obrigatórios');
  const isGarage = Boolean(team.isGarage || !required(institution?.inepCode));
  if (!isGarage && !required(institution?.inepCode)) throw new Error('Informe o código INEP ou marque equipe de garagem');
  const modalities = team.modalities ?? [];
  if (modalities.length === 0 || modalities.some((modality) => !TJR_MODALITIES.includes(modality as Modality))) throw new Error('Selecione ao menos uma modalidade válida');
  if (new Set(modalities).size !== modalities.length) throw new Error('Não repita modalidades');
  if (competitors.length < 3 || competitors.length > 4) throw new Error('A equipe deve possuir entre 3 e 4 integrantes');
  if (documentCount !== competitors.length) throw new Error('Envie uma identidade para cada competidor');
  if (team.marketingCompetitorIndex !== null && team.marketingCompetitorIndex !== undefined && (!Number.isInteger(team.marketingCompetitorIndex) || team.marketingCompetitorIndex < 0 || team.marketingCompetitorIndex >= competitors.length)) throw new Error('Competidor de marketing inválido');
  const competitionDate = new Date(stage.competitionDate);
  competitors.forEach((competitor) => {
    if (!required(competitor.name) || !required(competitor.birthDate) || !required(competitor.city) || !required(competitor.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(competitor.email ?? '') || !required(competitor.phone)) throw new Error('Nome, nascimento, cidade, e-mail e telefone são obrigatórios para todos os competidores');
    const age = getAgeInYears(competitor.birthDate!, competitionDate);
    if (age < 0 || age > 19) throw new Error('Todos os competidores devem ter até 19 anos na data da competição');
  });
  if (payload.imageUseConsent !== true) throw new Error('É necessário autorizar o uso de imagem');
  if (payload.acceptedDeclaration !== true) throw new Error('É necessário aceitar a declaração da inscrição');
  return { hasInstitution, isGarage };
}
