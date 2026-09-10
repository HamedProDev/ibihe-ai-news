import type { Metadata } from 'next';
import { Database, Eye, FlaskConical, Scale, ShieldCheck, Telescope } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ibisobanuro — Uburyo Ibihe ikora',
  description: 'Uko Ibihe yegeranya amakuru, igenzura inkuru, ibara ibiciro, kandi ihanura mu mucyo.',
};

const SECTIONS = [
  {
    icon: Database,
    titleKiny: '1. Amakuru ava he?',
    titleEn: '1. Where does data come from?',
    bodyKiny:
      'Ibihe yegeranya amakuru mu nkomoko zemewe gusa (urutonde rw’inkomoko rwatangajwe). Buri nkuru ibika: izina ry’inkomoko, URL yayo, igihe cyatangarijwe, n’igihe Ibihe yayifashe. Iyo bishoboka, inkuru imwe ivugwa n’ibitangazamakuru byinshi ihuzwa mu itsinda rimwe.',
    bodyEn:
      'Ibihe ingests only from an allow-listed source registry. Every story keeps: source name, source URL, publication time and fetch time. The same event across outlets is merged into one story cluster.',
  },
  {
    icon: ShieldCheck,
    titleKiny: '2. Inkuru zigenzurwa zite?',
    titleEn: '2. How are stories verified?',
    bodyKiny:
      'Buri nkuru ifite ikimenyetso: Inkuru yizewe, Irakomeje, Inkomoko nyinshi, Isesengura, Ihanura, cyangwa Igitekerezo. Ibihe ntayihimbira amagambo, imibare, cyangwa ibyabaye — ibyo AI yakoze byose biramenyekana kandi bigira inkomoko.',
    bodyEn:
      'Every story carries a label: Verified, Developing, Multi-source, Analysis, Forecast, or Opinion. Ibihe never invents quotes, statistics or events — all AI output is labeled and sourced.',
  },
  {
    icon: Scale,
    titleKiny: '3. Ibiciro by’isoko bisobanurwa bite?',
    titleEn: '3. How are market prices handled?',
    bodyKiny:
      'Buri giciro kigumana ingero y’aho (umufuka, agatebo…), kigira n’agaciro ngenderwaho ka RWF/kg kugira ngo amasoko agereranywe. Iyo ihindura ritazwi, Ibihe isiga ubusa aho guhimba. Amakuru y’urugero (demo) agaragara inyuma y’ikimenyetso kibivuga.',
    bodyEn:
      'Every price keeps its original local unit, plus a normalized RWF/kg value for fair comparison. Unknown conversions stay blank instead of guessed. Demo data always appears behind a clear banner.',
  },
  {
    icon: Eye,
    titleKiny: '4. Ikirere gihuzwa gute n’ubuhinzi?',
    titleEn: '4. How is weather linked to farming?',
    bodyKiny:
      'Ibihe itandukanya ibintu bitatu: Ibyabonwe (byapimwe), Iteganyagihe (ugereranya ufite kutamenya), n’Ibisobanuro bya AI (isesengura rishobora kwibeshya). Nta teganyagihe na rimwe rivugwa nk’ukuri kwizewe.',
    bodyEn:
      'Ibihe separates three things: Observations (measured), Forecasts (estimates with uncertainty), and AI interpretation (analysis that can be wrong). No forecast is ever presented as certainty.',
  },
  {
    icon: Telescope,
    titleKiny: '5. Ihanura rikora rite?',
    titleEn: '5. How do forecasts work?',
    bodyKiny:
      'Ihanura ritangirana n’ubuhinzi gusa — nta hanura rya politiki. Buri ihanura rigira: ikibazo, igihe, amahirwe (%), icyizere, ibimenyetso, ibyizerwa, ibyaryoshya, n’umubare w’icyitegererezo. Icyitegererezo ntikivuga “bizaba” — kivuga “kigereranya amahirwe …%”.',
    bodyEn:
      'Forecasts start with agriculture only — no political forecasts. Each carries: question, horizon, probability (%), confidence, evidence, assumptions, invalidators, and model version. The model never says “will happen” — it says “estimates …% probability”.',
  },
  {
    icon: FlaskConical,
    titleKiny: '6. Ni nde ugenzura niba ihanura ryari ukuri?',
    titleEn: '6. Who checks whether forecasts were right?',
    bodyKiny:
      'Ibihe ubwayo. Ibyahanuwe byose birabikwa; iyo igihe kigeze, bigereranywa n’ibyabaye maze bigahabwa amanota: Byahuye / Byatandukanye. Urupapuro rw’Ibimenyetso rwerekana ukuri ku gicuruzwa, ku gihe, na kuri buri cyitegererezo — atari nimero imwe y’“AI accuracy”.',
    bodyEn:
      'Ibihe itself. All forecasts are stored; at resolution they are compared with outcomes and scored: matched / missed. The Forecasts page shows accuracy by commodity, by horizon and by model version — never one “AI accuracy” number.',
  },
];

export default function ExplainersPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-white text-2xl font-bold mb-1">Ibisobanuro</h1>
      <p className="text-white/50 text-sm mb-6">
        Uburyo Ibihe ikora — mu mucyo. What happened → why it matters → what the data says → what could happen next.
      </p>
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <section key={s.titleEn} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-white text-[15px] font-bold mb-2">
              <s.icon size={16} className="text-[#00c853]" aria-hidden="true" />
              {s.titleKiny}
            </h2>
            <p className="text-white/75 text-sm leading-relaxed mb-2">{s.bodyKiny}</p>
            <p className="text-white/45 text-[13px] leading-relaxed">{s.bodyEn}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
