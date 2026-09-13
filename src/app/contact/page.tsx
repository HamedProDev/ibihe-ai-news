import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Tuvugishe', en: 'Contact' }}>
      <P rw='Ufite inkuru, ifoto cyangwa video? Koresha ifishi “Ohereza amakuru” iri ku ruhande rw’urubuga — itsinda ryacu rizayisuzuma.' en='Have a story, photo or video? Use the “Submit a Tip” form in the site sidebar — our team will review it.' />
        <P rw='Ku bibazo by’ikoranabuhanga n’ibitekerezo, sura porogaramu yacu: github.com/HamedProDev/ibihe-ai-news.' en='For technical questions and feedback, see our code: github.com/HamedProDev/ibihe-ai-news.' />
    </InfoShell>
  );
}
