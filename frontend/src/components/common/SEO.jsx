import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  image, 
  article = false, 
  author, 
  publishDate, 
  slug 
}) => {
  const siteName = "BlogVerse";
  const baseUrl = "https://blogverse.info";
  const fullUrl = slug ? `${baseUrl}/blog/${slug}` : baseUrl;
  const defaultDescription = "BlogVerse - A premium platform for deep thoughts and creative stories.";
  const defaultImage = `${baseUrl}/logo.png`;

  const seoTitle = title ? `${title} | ${siteName}` : siteName;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;

  const structuredData = article ? {
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
    }]
  } : {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": baseUrl
  };

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={fullUrl} />

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
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
