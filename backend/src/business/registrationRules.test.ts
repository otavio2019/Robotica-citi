import { describe, expect, it } from 'vitest';
import { getAgeInYears, getTjrLevel, validateRegistration } from './registrationRules';
const validPayload = {
  stage: { name: 'TJR — Paraíba', state: 'PB', venue: 'Ginásio', competitionDate: '2026-10-01' },
  institution: { name: 'Escola A', cnpj: '12.345.678/0001-90', inepCode: '25000000', city: 'Patos', isPatos: true },
  responsible: { fullName: 'Maria da Silva', document: '12345678900', inepCode: '25000000', email: 'maria@email.com', phone: '88999999999' },
  team: { name: 'Equipe A', state: 'PB', city: 'Patos', level: 'LEVEL_4' as const, modalities: ['PISTA_RETA'], marketingCompetitorIndex: 0 },
  competitors: [
    { name: 'A', inepCode: '1', birthDate: '2010-01-01', city: 'Patos', email: 'a@email.com', phone: '88999999991' },
    { name: 'B', inepCode: '2', birthDate: '2010-02-02', city: 'Patos', email: 'b@email.com', phone: '88999999992' },
    { name: 'C', inepCode: '3', birthDate: '2010-03-03', city: 'Patos', email: 'c@email.com', phone: '88999999993' },
    { name: 'D', inepCode: '4', birthDate: '2010-04-04', city: 'Patos', email: 'd@email.com', phone: '88999999994' },
  ],
  acceptedDeclaration: true,
  imageUseConsent: true,
};
describe('regras do cadastro TJR', () => {
  it('calcula idade e nível', () => { expect(getAgeInYears('2010-01-01', '2026-10-01')).toBe(16); expect(getTjrLevel(16)).toBe('LEVEL_4'); });
  it('aceita uma inscrição válida com quatro competidores', () => expect(() => validateRegistration(validPayload, 4)).not.toThrow());
  it('aceita equipe de garagem sem INEP em instituição de Patos', () => expect(validateRegistration({ ...validPayload, team: { ...validPayload.team, isGarage: true } }, 4).isGarage).toBe(true));
  it('exige de três a quatro integrantes', () => expect(() => validateRegistration({ ...validPayload, competitors: validPayload.competitors.slice(0, 2) }, 2)).toThrow('entre 3 e 4'));
  it('exige identidade para cada integrante', () => expect(() => validateRegistration(validPayload, 3)).toThrow('identidade'));
  it('exige instituição de Patos, modalidade, imagem e declaração', () => {
    expect(() => validateRegistration({ ...validPayload, institution: { ...validPayload.institution, city: 'Campina Grande', isPatos: false } }, 4)).toThrow('Patos-PB');
    expect(() => validateRegistration({ ...validPayload, team: { ...validPayload.team, modalities: ['SUMO'] } }, 4)).toThrow('modalidade');
    expect(() => validateRegistration({ ...validPayload, imageUseConsent: false }, 4)).toThrow('uso de imagem'); expect(() => validateRegistration({ ...validPayload, team: { ...validPayload.team, modalities: [] } }, 4)).toThrow('modalidade'); expect(() => validateRegistration({ ...validPayload, acceptedDeclaration: false }, 4)).toThrow('aceitar'); });
  it('rejeita nível incompatível e idade acima de 19', () => { expect(() => validateRegistration({ ...validPayload, team: { ...validPayload.team, level: 'LEVEL_1' } }, 4)).toThrow('nível correto'); expect(() => validateRegistration({ ...validPayload, competitors: validPayload.competitors.map((member, i) => i === 0 ? { ...member, birthDate: '2000-01-01' } : member) }, 4)).toThrow('até 19'); });
});
