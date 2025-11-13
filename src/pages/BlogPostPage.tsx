import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft } from 'lucide-react';

const blogPosts = [
  {
    id: '1',
    title: 'The Ultimate Guide to Coastal Living',
    author: 'Emily Hart',
    date: '2025-11-10',
    category: 'Lifestyle',
    imageUrl: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1200',
    readTime: '5 min read',
    content: `
      <p>There's something magical about waking up to the sound of waves and the salty sea breeze. Coastal living offers a unique lifestyle that combines tranquility with adventure, luxury with simplicity.</p>

      <h2>The Benefits of Seaside Living</h2>
      <p>Living by the coast isn't just about the view. Research shows that spending time near water can reduce stress, improve mental health, and promote overall wellbeing. The negative ions in sea air are believed to help your body absorb oxygen more efficiently, leading to better sleep and increased energy levels.</p>

      <h2>Our Coastal Properties</h2>
      <p>At NH&T Estates, we've carefully curated a collection of properties that embody the essence of luxury coastal living. Each home has been selected for its exceptional location, architectural merit, and access to pristine beaches.</p>

      <p>From contemporary architectural masterpieces to charming seaside cottages, our portfolio offers something for every taste. Whether you're seeking a peaceful retreat or an active coastal lifestyle, we have the perfect property for you.</p>

      <h2>Making the Most of Coastal Life</h2>
      <p>To truly embrace coastal living, we recommend establishing morning routines that incorporate the natural environment. Beach walks at sunrise, outdoor yoga sessions, or simply enjoying your morning coffee with an ocean view can set a positive tone for the entire day.</p>

      <p>Water sports and activities are readily available at all our coastal locations. From paddleboarding and kayaking to sailing and surfing, there's no shortage of ways to engage with the sea.</p>
    `,
  },
  {
    id: '2',
    title: 'Maximizing Your Spa Experience',
    author: 'Sophie Martinez',
    date: '2025-11-08',
    category: 'Wellness',
    imageUrl: 'https://images.pexels.com/photos/3865618/pexels-photo-3865618.jpeg?auto=compress&cs=tinysrgb&w=1200',
    readTime: '4 min read',
    content: `
      <p>A spa treatment is more than just a luxury indulgence—it's an investment in your physical and mental wellbeing. To ensure you get the maximum benefit from your spa experience, we've compiled expert advice from our wellness team.</p>

      <h2>Preparation is Key</h2>
      <p>Arrive at least 15 minutes before your scheduled treatment. This gives you time to unwind, complete any necessary paperwork, and transition into a relaxed state of mind. Avoid caffeine for at least two hours before your appointment, as it can interfere with the relaxation process.</p>

      <h2>Communicate with Your Therapist</h2>
      <p>Don't hesitate to communicate your preferences and any concerns with your therapist. Whether you prefer firmer pressure, have sensitive areas, or particular aromatherapy preferences, your therapist can customize the treatment to your needs.</p>

      <h2>Hydration and Aftercare</h2>
      <p>Drink plenty of water before and after your treatment. Massage and spa treatments help release toxins from your muscles, and proper hydration helps flush these out of your system. We provide complimentary herbal teas and infused water in our relaxation areas.</p>

      <p>After your treatment, take time to rest in our relaxation room. Rushing immediately back to your daily activities can diminish the benefits of your spa experience.</p>
    `,
  },
  {
    id: '3',
    title: 'Creating the Perfect Movie Night',
    author: 'James Thompson',
    date: '2025-11-05',
    category: 'Entertainment',
    imageUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',
    readTime: '6 min read',
    content: `
      <p>Our private cinema offers an unparalleled viewing experience, but the magic truly happens when you combine the perfect film selection with thoughtful touches that elevate the entire evening.</p>

      <h2>Choosing the Right Film</h2>
      <p>Consider your audience carefully. For families with children, animated classics or recent releases work wonderfully. For date nights, romantic comedies or visually stunning films create the right atmosphere. Our film library spans every genre and era.</p>

      <h2>Setting the Scene</h2>
      <p>We provide complete control over the lighting, temperature, and sound system. Arrive a few minutes early to adjust these to your preferences. The cinema features Dolby Atmos surround sound—take advantage of it with films known for their exceptional audio design.</p>

      <h2>The Perfect Refreshments</h2>
      <p>While traditional cinema snacks are always available, consider elevating your experience with our gourmet options. Fresh popcorn with truffle butter, artisan chocolates, and premium beverages can transform a good movie night into an unforgettable one.</p>

      <p>For longer viewings or double features, we can arrange for light meals to be served during intermission. Our catering team works with you to create a menu that complements your chosen films.</p>
    `,
  },
];

export default function BlogPostPage() {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-gray-900 mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-blue-900 hover:underline">
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <article>
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="inline-block bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium mb-4">
                {post.category}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {new Date(post.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 font-medium mb-8 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>

            <div
              className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-900 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>

        <div className="bg-white py-16 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-serif text-gray-900 mb-8 text-center">
              More Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {blogPosts
                .filter((p) => p.id !== post.id)
                .slice(0, 2)
                .map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.id}`}
                    className="group"
                  >
                    <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={relatedPost.imageUrl}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <h4 className="text-xl font-serif text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                          {relatedPost.title}
                        </h4>
                        <div className="text-sm text-gray-500">
                          {new Date(relatedPost.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          · {relatedPost.readTime}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
