import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Amategeko', en: 'Terms of Service' }}>
      <P rw='Ukoresheje IbiheNews wemeye ko: amakuru yacu agomba gusubirwamo uvuga inkomoko; ibyahanuwe ni ibigereranyo, si ukuri kwizewe.' en='By using IbiheNews you agree: our stories may be quoted with attribution; forecasts are estimates, not certainties.' />
        <P rw='Ntugomba kohereza amakuru y’ibihuha, ibitutsi cyangwa ibintu binyuranyije n’amategeko unyuze mu mafishi yacu.' en='You must not submit false reports, insults or illegal content through our forms.' />
    </InfoShell>
  );
}
