/** Reader comment shape returned by /api/comments (public subset). */
export interface Comment {
  id: string;
  articleId: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
  body: string;
  language: string;
  status: 'pending' | 'approved' | 'hidden' | 'spam';
  votesUp: number;
  createdAt: string;
}
