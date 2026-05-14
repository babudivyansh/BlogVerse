import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  image, 
  article = false, 
  author, 
  publishDate, 
  slug,
  noindex = false
}) => {
  const siteName = "BlogVerse";
  const baseUrl = "https://blogverse.info";
  const fullUrl = slug ? `${baseUrl}/blog/${slug}` : baseUrl;
  
  // High-value keywords from competitor analysis
  const defaultDescription = "BlogVerse - The ultimate AI-powered blog platform for technology trends, innovations, and digital advancements. Explore expert app reviews, startup stories, and industry updates.";
  const defaultImage = `${baseUrl}/logo.png`;

  const seoTitle = title ? `${title} | ${siteName}` : `${siteName} - AI-Powered Blog Platform | Tech Trends & Stories`;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;

  // Schema.org Structured Data
  const schemas = [];

  // 1. Organization Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "sameAs": [
      "https://twitter.com/blogverse",
      "https://github.com/blogverse"
    ]
  });

  // 2. WebSite Schema (with SearchAction for sitelinks searchbox)
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "alternateName": ["blogverse", "Blogverse"],
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  });

  // 3. BreadcrumbList Schema
  if (slug) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": title,
          "item": fullUrl
        }
      ]
    });
  }

  // 4. BlogPosting Schema
  if (article) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": seoDescription,
      "image": [seoImage],
      "datePublished": publishDate,
      "author": [{
        "@type": "Person",
        "name": author || "BlogVerse Author",
        "url": baseUrl
      }],
      "publisher": {
        "@type": "Organization",
        "name": siteName,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": fullUrl
      }
    });
  }

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={fullUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
