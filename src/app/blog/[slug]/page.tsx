import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { formatDate } from '@/lib/utils'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Simple markdown to HTML conversion
  const contentHtml = post.content
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-[#222222] mb-6">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-[#222222] mb-4 mt-8">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-[#222222] mb-3 mt-6">$1</h3>')
    .replace(/^\- (.*$)/gim, '<li class="text-[#767676] mb-2">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-[#767676] leading-relaxed mb-4">')
    .replace(/^(?!<[h|li|p])(.*$)/gim, '<p class="text-[#767676] leading-relaxed mb-4">$1</p>')
    .replace(/<li.*?<\/li>/g, match => `<ul class="list-disc pl-6 mb-4">${match}</ul>`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Blog */}
        <Link 
          href="/blog" 
          className="inline-flex items-center text-[#FF385C] hover:text-[#E31C5F] mb-8 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {/* Article Header */}
        <article className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video bg-gradient-to-br from-[#FF385C]/10 to-[#E31C5F]/10 flex items-center justify-center">
              <div className="text-6xl">{post.coverImage}</div>
            </div>
          )}

          {/* Article Content */}
          <div className="p-8 md:p-12">
            {/* Meta Information */}
            <div className="flex items-center space-x-4 mb-6">
              <time className="text-sm text-[#767676] font-medium">
                {formatDate(post.date)}
              </time>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">R</span>
                </div>
                <span className="text-sm text-[#767676] font-medium">
                  {post.author}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-[#222222] mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-[#767676] mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#FF385C]/10 text-[#FF385C] text-sm font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </article>

        {/* Related Posts */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#222222] mb-6">More from Roozi</h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <p className="text-[#767676] text-center">
              More blog posts coming soon! Stay tuned for more insights on productivity, time management, and building better habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 