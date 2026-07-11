import { Link, useParams } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import { blogPosts } from "../data/navigation";

export function BlogPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <span className="pill">Blog</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">İçgörüler & Rehberler</h1>
        <p className="mt-3 text-slate-500">ERP, CRM ve dijital dönüşüm</p>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {blogPosts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.05}>
              <Link to={`/blog/${post.slug}`} className="saas-card group block overflow-hidden !p-0">
                <div className="h-36 bg-gradient-to-br from-blue-600 to-violet-500/70" />
                <div className="p-6">
                  <span className="text-xs font-bold uppercase text-blue-600">{post.category}</span>
                  <h3 className="mt-2 font-bold text-slate-900 group-hover:text-blue-700">{post.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-slate-400">{post.date}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}

export function BlogDetailPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug) || blogPosts[0];

  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <span className="pill">{post.category}</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">{post.title}</h1>
        <p className="mt-3 text-slate-500">{post.date}</p>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-lg text-slate-600">{post.excerpt}</p>
        <p className="mt-6 text-slate-500">
          BACHMAIN platformu ile iş süreçlerinizi dijitalleştirmek artık çok daha kolay.
        </p>
        <Link to="/register" className="mt-8 inline-block font-bold text-blue-600 hover:underline">
          Ücretsiz deneyin →
        </Link>
      </article>
    </div>
  );
}
