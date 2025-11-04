export const generateMetaDescription = (product: any): string => {
  const { name, description, price, category } = product;
  const shortDesc = description.substring(0, 150);
  return `Buy ${name} for $${price}. ${shortDesc}... Shop ${category} at our marketplace.`;
};

export const generateMetaKeywords = (product: any): string[] => {
  const keywords = [
    product.name,
    product.category,
    product.brand,
    ...product.tags,
    'buy online',
    'marketplace',
    'shop'
  ];
  return keywords.filter(Boolean);
};

export const generateStructuredData = (product: any) => {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.FRONTEND_URL}/products/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.seller.name
      }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count
    } : undefined
  };
};

export const generateCanonicalUrl = (slug: string): string => {
  return `${process.env.FRONTEND_URL}/products/${slug}`;
};

export const generateOpenGraphTags = (product: any) => {
  return {
    'og:title': product.name,
    'og:description': generateMetaDescription(product),
    'og:image': product.images[0],
    'og:url': generateCanonicalUrl(product.slug),
    'og:type': 'product',
    'og:price:amount': product.price,
    'og:price:currency': 'USD'
  };
};
