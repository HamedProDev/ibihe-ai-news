import type { Metadata } from 'next';
import { AskIbihe } from '@/components/ai/AskIbihe';

export const metadata: Metadata = {
  title: 'Baza Ibihe',
  description: 'Baza Ibihe — AI isubiza ishingiye ku makuru, isoko, ikirere n’ihanura bya Ibihe, hamwe n’inkomoko.',
};

export default function AskPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <AskIbihe />
      <p className="text-ink/35 text-xs mt-4 text-center">
        Ibihe isubiza gusa ishingiye ku makuru ifite. Iyo nta bimenyetso bihagije, irabivuga — ntayihimbira ibisubizo.
      </p>
    </main>
  );
}
