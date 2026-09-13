import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Ubufasha', en: 'Help' }}>
      <P rw='Guhindura ururimi: kanda ku globa hejuru iburyo uhitemo ururimi. N winjiye muri konti, ururimi rwawe rwibikwa.' en='Change language: click the globe at the top right and pick a language. When signed in, your language is remembered.' />
        <P rw='Gushungura amakuru: koresha Igihe, Igihugu n’Icyiciro hejuru y’urutonde rw’amakuru. Kanda “Bika” kugira ngo ubike inkuru kuri mudasobwa yawe.' en='Filter news: use Time, Country and Category above the news list. Click “Save” to keep a story on your device.' />
        <P rw='Incamake ya AI ikorwa buri gitondo mu makuru y’umunsi — soma “Incamake y’umunsi” ku ruhande.' en='The AI summary is built every morning from the day’s news — see “Daily briefing” in the sidebar.' />
    </InfoShell>
  );
}
