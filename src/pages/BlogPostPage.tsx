import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import Seo from '../components/Seo';

const blogPosts = [
  {
    id: '1',
    slug: 'uk-travel-itch-best-trips',
    title: 'The UK Travel Itch: Why the Best Trips Often Feel Like Coming Home',
    author: 'Liam Bennett',
    date: '2026-02-10',
    category: 'Travel',
    imageUrl: '/homepage3.webp',
    readTime: '8 min read',
    content: `
      <p>There's this specific kind of relief, the one that hits when you finally decide to stay in the UK for a getaway. Just you, an over-packed suitcase, and a train journey that lasts exactly long enough for your hustling thoughts to slow down and go on vacation mode.</p>

      <br/>
      <p>Sometimes it isn't about the "bucket list" moments, but the slow burn instead. It's about places that feel real, alive, and a bit scuffed at the edges, rather than polished things with no marks of use. Reality is, the sights are not the point. You do not come here to tick boxes but to wander a random neighborhood without a map, spend too much time in a shop because the sky decided to pour down, and realize the highlight was a ten-minute chat with a stranger at a bus stop.</p>

      <h2>Slowing Down in the Big Cities</h2>
      <p>London and Edinburgh are the most common places on the minds of people who are visiting, but they only click when you stop hustling through the chaos to see everything in one go. The city shows itself when you move at walking speed.</p>

      <br/>
      <p>In London, the magic is not about a red bus or a palace; it's an early morning stroll across Hampstead Heath when your shoe sinks into the wet grass and the skyline is just a gray smudge on the horizon. Or sitting by the Thames in Greenwich, watching the slow tide pull at mossy piers while the world is busy rushing somewhere else.</p>

      <br/>
      <p>I stayed a day in a random corner of South London once. Why? Mostly because I had heard about a bakery that everyone bragged about. It was known to have the most incredible sourdough, and I was not willing to miss it even if it meant waiting in a queue that felt never-ending. It's those tiny, unexpected moments that stay with you long after the souvenirs are lost and the clock keeps ticking.</p>

      <br/>
      <p>Edinburgh has a similar vibe. Beyond the Harry Potter aesthetic of the Old Town, it's a city of routine and rhythm. Sitting in a crowded cafe, listening to the clatter of spoons and chairs, feels more Edinburgh than any viewpoint ever could. Once the rush leaves the chat, the city starts to soften up.</p>

      <h2>The Spots That Actually Stick</h2>
      <p>Away from the big names, there are places that get under your skin. Northumberland is a big one. You have massive, empty beaches where you can wander for miles and feel completely detached from the world, and then out of nowhere, there is a medieval castle sitting on the dunes like it was meant to be. Plus, the stars make you forget how many there are until you are standing right below them in awe.</p>

      <br/>
      <p>The Scottish Borders are all rolling hills and rivers that do not seem to be in any hurry. Norfolk is basically big skies, soft colors, and the kind of seafood that makes you want to pack up and move there immediately. For book lovers, Hay-on-Wye is heaven in disguise. If you are looking for something creative and grounded, Hebden Bridge has an energy you will not find anywhere else. These places are not performing for tourists; they are just existing and thriving.</p>

      <h2>Pubs, Roasts, and the Art of Doing Nothing</h2>
      <p>UK culture is a bunch of unspoken rules. The polite queuing, the sarcasm that comes out the second it starts pouring, it is all part of it. And the pub? That is not a business, it is a communal lounge where you are allowed to just be for three hours. Sunday roasts with far too much gravy, dogs sprawled out under wooden tables, and a quiz night where people get way too competitive over 80s pop trivia -- that is the real magic. When the weather forces you inside, a lazy reset at the <a href="/spa">spa</a> keeps the pace gentle.</p>

      <br/>
      <p>And the food? It is soul food. The top contender is fish and chips eaten out of paper by the sea with enough vinegar to make your eyes water. An English breakfast in a greasy spoon cafe that has not changed its decor since 1992 brings comfort that cannot be described. Cornish pasties, Welsh cakes, Scottish shortbread -- it is simple, appetizing, and exactly what you want on a cloudy Tuesday afternoon.</p>

      <h2>The Beauty of a Wrong Turn</h2>
      <p>The UK is built for the slow route and known for its own pace. It is for scenic train lines and road trips where the accidental detour to a weather-worn arch ends up better than the place you were meant to be at. Staying in a creaky old inn usually gets you better stories with locals than any app.</p>

      <br/>
      <p>UK holidays might not always give you that wow moment right away. Instead, they grow on you. It is the quiet mornings, the little interactions you were not expecting, and the feeling that you did not just visit but actually spent time there. It is a subtle reminder that travel does not have to be dramatic to mean something. Sometimes, a long walk and a viewpoint you were not expecting is all you really need to feel human again. If you want a calm base for slow travel, explore our <a href="/properties">coastal properties</a>.</p>
    `,
  }
];

const toPlainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  const baseTitle = 'NH&T Estates';
  const baseDescription =
    'Stories and insights on luxury coastal living, wellness, and curated experiences.';
  const plainText = post ? toPlainText(post.content) : '';
  const description =
    plainText.length > 160 ? `${plainText.slice(0, 157)}...` : plainText || baseDescription;
  const title = post ? `${post.title} | Journal | ${baseTitle}` : `Journal | ${baseTitle}`;
  const canonicalPath = post ? `/blog/${post.slug}` : '/blog';

  if (!post) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Seo title={title} description={description} canonicalPath={canonicalPath} />
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
      <Seo title={title} description={description} canonicalPath={canonicalPath} />
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
                    to={`/blog/${relatedPost.slug}`}
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
