import { InfoShell, P } from '@/components/info/InfoShell';

export default function Page() {
  return (
    <InfoShell title={{ rw: 'Abo turi bo', en: 'About Us' }}>
      <P rw='IbiheNews ni urubuga rw’amakuru ruri muri Afrika, rukoreshwa na AI n’abantu: AI ifasha gukusanya no gucukumbura amakuru, abanditsi b’abantu bakagenzura ibisohoka.' en='IbiheNews is an African news platform powered by AI and people: AI helps gather and sift the news, human editors verify what gets published.' />
        <P rw='Buri nkuru yerekana inkomoko yayo. Ntitwihimbira amakuru, imibare cyangwa amagambo — ibitaramenyekana tubivuga nk’ibitaramenyekana.' en='Every story shows its sources. We never invent news, statistics or quotes — what is unverified is labelled as unverified.' />
        <P rw='Dukorera mu ndimi esheshatu: Ikinyarwanda, English, Français, Kiswahili, العربية na Hausa.' en='We publish in six languages: Kinyarwanda, English, Français, Kiswahili, العربية and Hausa.' />
    </InfoShell>
  );
}
