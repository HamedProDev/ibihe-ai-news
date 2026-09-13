import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Ibanga', en: 'Privacy Policy' }}>
      <P rw='Dukusanya bike gishoboka: konti yawe (imeri, izina) n’ururimi wahisemo. Inkuru wabitswe zibikwa kuri mudasobwa yawe gusa, ntazohererezwa.' en='We collect as little as possible: your account (email, name) and your chosen language. Saved stories stay on your device only.' />
        <P rw='Ntitugurisha amakuru yawe. Imeri ya newsletter ikoreshwa kohereza amakuru gusa, kandi ushobora kwisiramu igihe cyose.' en='We never sell your data. Newsletter emails are used for the newsletter only, and you can unsubscribe anytime.' />
    </InfoShell>
  );
}
