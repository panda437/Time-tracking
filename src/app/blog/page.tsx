import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { formatDate } from '@/lib/utils'

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F7F7F7] to-[#EBEBEB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#222222] mb-4">
            Roozi Blog
          </h1>
          <p className="text-xl text-[#767676] max-w-2xl mx-auto">
            Insights on productivity, time management, and building better habits
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                {/* Featured Image */}
                {post.coverImage && (
                  <div className="aspect-video bg-gradient-to-br from-[#FF385C]/10 to-[#E31C5F]/10 flex items-center justify-center">
                    <div className="text-4xl">{post.coverImage}</div>
                  </div>
                )}
                
                {/* Content */}
                <div className="p-6">
                  {/* Date */}
                  <time className="text-sm text-[#767676] font-medium">
                    {formatDate(post.date)}
                  </time>
                  
                  {/* Title */}
                  <h2 className="text-xl font-bold text-[#222222] mt-2 mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  
                  {/* Excerpt */}
                  <p className="text-[#767676] line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                    <span className="text-sm text-[#767676] font-medium">
                      Roozi Team
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
} 