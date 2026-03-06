import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Seo from '../components/Seo';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '3',
    slug: 'top-10-best-luxury-hotels-in-the-uk',
    title: 'Top 10 Best Luxury Hotels in the UK',
    excerpt: 'From The Ritz and The Savoy to Gleneagles and The Connaught, explore ten best luxury UK hotels known for heritage, elegance, and exceptional service.',
    content: 'Full article content here...',
    author: 'NH&T Estates',
    date: '2026-03-06',
    category: 'Travel',
    imageUrl: '/homepage2.webp',
    readTime: '7 min read',
  },
  {
    id: '2',
    slug: 'best-places-to-visit-in-cardiff',
    title: 'Visit Cardiff: Best Places to Visit in Cardiff',
    excerpt: "A local-friendly guide to Cardiff's castles, markets, parks, waterfronts, and culture, from iconic landmarks to relaxed city escapes.",
    content: 'Full article content here...',
    author: 'NH&T Estates',
    date: '2026-03-05',
    category: 'Travel',
    imageUrl: '/cardiff.webp',
    readTime: '5 min read',
  },
  {
    id: '1',
    slug: 'uk-travel-itch-best-trips',
    title: 'The UK Travel Itch: Why the Best Trips Often Feel Like Coming Home',
    excerpt: 'A reflective take on UK staycations, from London and Edinburgh slow moments to Northumberland beaches, pubs, and scenic detours.',
    content: 'Full article content here...',
    author: 'Fatima Lotia',
    date: '2026-02-10',
    category: 'Travel',
    imageUrl: '/homepage3.webp',
    readTime: '8 min read',
  }
];

const categories = ['All', 'Lifestyle', 'Wellness', 'Entertainment', 'Sustainability', 'Travel', 'Design'];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <Seo
        title="Journal | NH&T Estates"
        description="Stories and insights on luxury coastal living, wellness, and curated experiences."
        canonicalPath="/blog"
        keywords={[
          'NH&T Estates blog',
          'luxury travel',
          'Cardiff travel',
          'UK staycations',
          'wellness travel',
          'coastal living',
          'lifestyle',
          'entertainment',
          'sustainability',
          'design',
          'hospitality insights',
        ]}
      />
      <section className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-serif text-gray-900 mb-4">
              Our Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stories, tips, and insights from the world of luxury hospitality
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length > 0 && (
            <Link
              to={`/blog/${filteredPosts[0].slug}`}
              className="block mb-16 group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="relative h-96 lg:h-auto overflow-hidden">
                    <img
                      src={filteredPosts[0].imageUrl}
                      alt={filteredPosts[0].title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-blue-900 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Featured
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="inline-block bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                      {filteredPosts[0].category}
                    </div>
                    <h2 className="text-4xl font-serif text-gray-900 mb-4 group-hover:text-blue-900 transition-colors">
                      {filteredPosts[0].title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                      {filteredPosts[0].excerpt}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{filteredPosts[0].author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(filteredPosts[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <span>{filteredPosts[0].readTime}</span>
                    </div>
                    <div className="mt-6 flex items-center text-blue-900 font-medium group-hover:gap-3 transition-all">
                      Read More <ArrowRight className="h-5 w-5 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(1).map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                    {post.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif text-gray-900 mb-3 group-hover:text-blue-900 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">
                No posts found in this category.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
