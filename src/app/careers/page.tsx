import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Akazi', en: 'Careers' }}>
      <P rw='Turashaka abanditsi, abasesenguzi n’abakorerabushake mu bihugu byose dukorera. Abanditsi bacu barashobora kwandika, kugenzura no gukusanya amakuru.' en='We look for writers, analysts and contributors in every country we cover. Our authors can write, verify and gather news.' />
        <P rw='Nta mwanya ufunguye ubu? Ohereza icyitegererezo cy’inyandiko yawe unyuze kuri paji yo kutuvugisha.' en='No open role right now? Send a writing sample through the contact page.' />
    </InfoShell>
  );
}
