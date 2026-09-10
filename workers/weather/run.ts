/**
 * Weather warm-up worker — pre-fills the district cache so pages stay fast.
 *
 * Usage:
 *   node workers/weather/run.ts [District...]
 * Defaults to a small set of key districts; pass names to warm more.
 */
import { getDistrictWeather } from '../../src/lib/weather/client.ts';

async function main(): Promise<void> {
  const districts = process.argv.slice(2);
  const targets = districts.length > 0 ? districts : ['Gasabo', 'Musanze', 'Huye', 'Nyagatare', 'Rubavu', 'Rusizi'];
  for (const d of targets) {
    const wx = await getDistrictWeather(d);
    console.log(
      `[worker:weather] ${wx.district}: available=${wx.available} days=${wx.forecast.length} fetchedAt=${wx.fetchedAt}`,
    );
  }
}

main().catch((err: unknown) => {
  console.error('[worker:weather] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
