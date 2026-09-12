import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Yamamaza', en: 'Advertise' }}>
      <P rw='IbiheNews yemera iyamamaza ribonerana ritabangamira abasomyi: nta yamamaza ryihisha mu nkuru, kandi iryamamazwa ryose rirangwa neza.' en='IbiheNews accepts honest advertising that respects readers: no advertorials disguised as news, and every ad is clearly labelled.' />
        <P rw='Kubaza ibiciro n’ahabanza, twandikire unyuze kuri paji yo kutuvugisha.' en='For rates and availability, reach us through the contact page.' />
    </InfoShell>
  );
}
