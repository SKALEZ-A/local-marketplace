import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: SearchPagination;
  aggregations?: string[];
}

export interface SearchFilters {
  category?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;
  inStock?: boolean;
  seller?: string;
  tags?: string[];
  location?: { lat: number; lon: number; radius: string };
  attributes?: Record<string, any>;
}

export interface SearchSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  limit: number;
}

export interface SearchResult {
  hits: any[];
  total: number;
  aggregations?: Record<string, any>;
  suggestions?: string[];
  took: number;
}

export class SearchService {
  private client: Client;
  private indexName: string = 'products';

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
      }
    });

    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 3,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  product_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding', 'product_synonym', 'product_stemmer']
                  },
                  autocomplete_analyzer: {
                    type: 'custom',
                    tokenizer: 'edge_ngram_tokenizer',
                    filter: ['lowercase', 'asciifolding']
                  }
                },
                tokenizer: {
                  edge_ngram_tokenizer: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 10,
                    token_chars: ['letter', 'digit']
                  }
                },
                filter: {
                  product_synonym: {
                    type: 'synonym',
                    synonyms: [
                      'phone, smartphone, mobile',
                      'laptop, notebook, computer',
                      'tv, television'
                    ]
                  },
                  product_stemmer: {
                    type: 'stemmer',
                    language: 'english'
                  }
                }
              }
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: {
                  type: 'text',
                  analyzer: 'product_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    autocomplete: {
                      type: 'text',
                      analyzer: 'autocomplete_analyzer'
                    }
                  }
                },
                description: {
                  type: 'text',
                  analyzer: 'product_analyzer'
                },
                category: {
                  type: 'keyword',
                  fields: {
                    text: { type: 'text' }
                  }
                },
                price: { type: 'float' },
                salePrice: { type: 'float' },
                rating: { type: 'float' },
                reviewCount: { type: 'integer' },
                inStock: { type: 'boolean' },
                quantity: { type: 'integer' },
                seller: {
                  type: 'object',
                  properties: {
                    id: { type: 'keyword' },
                    name: { type: 'text' },
                    rating: { type: 'float' }
                  }
                },
                tags: { type: 'keyword' },
                images: { type: 'keyword' },
                attributes: { type: 'object', enabled: true },
                location: { type: 'geo_point' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                viewCount: { type: 'integer' },
                salesCount: { type: 'integer' },
                isFeatured: { type: 'boolean' },
                isActive: { type: 'boolean' }
              }
            }
          }
        });

        logger.info('Elasticsearch index created successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch index:', error);
    }
  }

  async indexProduct(product: any): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: product.id,
        body: product,
        refresh: true
      });

      logger.debug('Product indexed', { productId: product.id });
    } catch (error) {
      logger.error('Failed to index product:', error);
      throw error;
    }
  }

  async bulkIndexProducts(products: any[]): Promise<void> {
    try {
      const body = products.flatMap((product) => [
        { index: { _index: this.indexName, _id: product.id } },
        product
      ]);

      const response = await this.client.bulk({ body, refresh: true });

      if (response.errors) {
        logger.error('Bulk indexing had errors', { errors: response.items });
      } else {
        logger.info('Bulk indexed products', { count: products.length });
      }
    } catch (error) {
      logger.error('Failed to bulk index products:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: any): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id: productId,
        body: { doc: updates },
        refresh: true
      });

      logger.debug('Product updated in index', { productId });
    } catch (error) {
      logger.error('Failed to update product in index:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: productId,
        refresh: true
      });

      logger.debug('Product deleted from index', { productId });
    } catch (error) {
      logger.error('Failed to delete product from index:', error);
      throw error;
    }
  }

  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    try {
      const { query, filters, sort, pagination, aggregations } = searchQuery;

      const must: any[] = [];
      const filter: any[] = [];

      // Text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description^2', 'tags', 'category.text'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'or'
          }
        });
      }

      // Filters
      if (filters) {
        if (filters.category && filters.category.length > 0) {
          filter.push({ terms: { category: filters.category } });
        }

        if (filters.priceRange) {
          filter.push({
            range: {
              price: {
                gte: filters.priceRange.min,
                lte: filters.priceRange.max
              }
            }
          });
        }

        if (filters.rating) {
          filter.push({ range: { rating: { gte: filters.rating } } });
        }

        if (filters.inStock !== undefined) {
          filter.push({ term: { inStock: filters.inStock } });
        }

        if (filters.seller) {
          filter.push({ term: { 'seller.id': filters.seller } });
        }

        if (filters.tags && filters.tags.length > 0) {
          filter.push({ terms: { tags: filters.tags } });
        }

        if (filters.location) {
          filter.push({
            geo_distance: {
              distance: filters.location.radius,
              location: {
                lat: filters.location.lat,
                lon: filters.location.lon
              }
            }
          });
        }

        if (filters.attributes) {
          Object.entries(filters.attributes).forEach(([key, value]) => {
            filter.push({ term: { [`attributes.${key}`]: value } });
          });
        }
      }

      // Always filter active products
      filter.push({ term: { isActive: true } });

      // Build query
      const esQuery: any = {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter
        }
      };

      // Sorting
      const sortConfig: any[] = [];
      if (sort) {
        sortConfig.push({ [sort.field]: { order: sort.order } });
      } else {
        sortConfig.push({ _score: { order: 'desc' } });
        sortConfig.push({ salesCount: { order: 'desc' } });
      }

      // Pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const from = (page - 1) * limit;

      // Aggregations
      const aggs: any = {};
      if (aggregations) {
        if (aggregations.includes('categories')) {
          aggs.categories = {
            terms: { field: 'category', size: 20 }
          };
        }
        if (aggregations.includes('priceRanges')) {
          aggs.priceRanges = {
            range: {
              field: 'price',
              ranges: [
                { to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 200 },
                { from: 200, to: 500 },
                { from: 500 }
              ]
            }
          };
        }
        if (aggregations.includes('ratings')) {
          aggs.ratings = {
            range: {
              field: 'rating',
              ranges: [
                { from: 4 },
                { from: 3, to: 4 },
                { from: 2, to: 3 },
                { to: 2 }
              ]
            }
          };
        }
        if (aggregations.includes('tags')) {
          aggs.tags = {
            terms: { field: 'tags', size: 30 }
          };
        }
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: esQuery,
          sort: sortConfig,
          from,
          size: limit,
          aggs: Object.keys(aggs).length > 0 ? aggs : undefined,
          highlight: {
            fields: {
              name: {},
              description: {}
            }
          }
        }
      });

      const hits = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
        highlight: hit.highlight
      }));

      return {
        hits,
        total: typeof response.hits.total === 'number' 
          ? response.hits.total 
          : response.hits.total?.value || 0,
        aggregations: response.aggregations,
        took: response.took
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  async autocomplete(query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    'name.autocomplete': {
                      query,
                      operator: 'and'
                    }
                  }
                }
              ],
              filter: [{ term: { isActive: true } }]
            }
          },
          _source: ['name'],
          size: limit
        }
      });

      return response.hits.hits.map((hit: any) => hit._source.name);
    } catch (error) {
      logger.error('Autocomplete failed:', error);
      return [];
    }
  }

  async suggest(query: string): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            product_suggestion: {
              text: query,
              term: {
                field: 'name',
                suggest_mode: 'popular',
                min_word_length: 3
              }
            }
          }
        }
      });

      const suggestions = response.suggest?.product_suggestion?.[0]?.options || [];
      return suggestions.map((option: any) => option.text);
    } catch (error) {
      logger.error('Suggest failed:', error);
      return [];
    }
  }

  async similarProducts(productId: string, limit: number = 10): Promise<any[]> {
    try {
      const product = await this.client.get({
        index: this.indexName,
        id: productId
      });

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  more_like_this: {
                    fields: ['name', 'description', 'tags', 'category'],
                    like: [{ _index: this.indexName, _id: productId }],
                    min_term_freq: 1,
                    max_query_terms: 12
                  }
                }
              ],
              filter: [
                { term: { isActive: true } },
                { term: { category: product._source.category } }
              ],
              must_not: [{ term: { id: productId } }]
            }
          },
          size: limit
        }
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      logger.error('Similar products search failed:', error);
      return [];
    }
  }

  async getTrendingProducts(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              filter: [{ term: { isActive: true } }]
            }
          },
          sort: [
            { viewCount: { order: 'desc' } },
            { salesCount: { order: 'desc' } },
            { rating: { order: 'desc' } }
          ],
          size: limit
        }
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      logger.error('Trending products search failed:', error);
      return [];
    }
  }

  async reindexAll(products: any[]): Promise<void> {
    try {
      // Delete existing index
      await this.client.indices.delete({ index: this.indexName, ignore_unavailable: true });

      // Recreate index
      await this.initializeIndex();

      // Bulk index all products
      await this.bulkIndexProducts(products);

      logger.info('Reindexing completed', { count: products.length });
    } catch (error) {
      logger.error('Reindexing failed:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const stats = await this.client.indices.stats({ index: this.indexName });
      return stats;
    } catch (error) {
      logger.error('Failed to get index stats:', error);
      return null;
    }
  }
}
