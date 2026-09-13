import { redirect } from 'next/navigation';

/**
 * Backwards compatibility: old /category/<slug> links redirect to the
 * filtered news listing so no bookmarked URL breaks.
 */
export default async function CategoryRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/amakuru?category=${encodeURIComponent(slug)}`);
}
