import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';
import natural from 'natural';
import _ from 'lodash';

export class ElasticsearchService {
  private client: Client;
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmer;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || ''
      }
    });

    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  async ping() {
    try {
      await this.client.ping();
      logger.info('Elasticsearch connection successful');
      return true;
    } catch (error: any) {
      logger.error('Elasticsearch connection failed:', error);
      throw new AppError('Elasticsearch connection failed', 500);
    }
  }

  async createIndex(indexName: string, mappings: any) {
    try {
      const exists = await this.client.indices.exists({ index: indexName });

      if (exists) {
        logger.info(`Index ${indexName} already exists`);
        return;
      }

      await this.client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 2,
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding', 'stop', 'snowball']
                }
              }
            }
          },
          mappings
        }
      });

      logger.info(`Index ${indexName} created successfully`);
    } catch (error: any) {
      logger.error(`Index creation failed for ${indexName}:`, error);
      throw new AppError(error.message, 500);
    }
  }

  async indexDocument(indexName: string, id: string, document: any) {
    try {
      await this.client.index({
        index: indexName,
        id,
        document,
        refresh: 'wait_for'
      });

      logger.info(`Document indexed: ${id} in ${indexName}`);
    } catch (error: any) {
      logger.error('Document indexing failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async bulkIndex(indexName: string, documents: any[]) {
    try {
      const operations = documents.flatMap(doc => [
        { index: { _index: indexName, _id: doc.id } },
        doc
      ]);

      const response = await this.client.bulk({
        refresh: 'wait_for',
        operations
      });

      if (response.errors) {
        const erroredDocuments = response.items.filter((item: any) => item.index?.error);
        logger.error(`Bulk indexing had errors:`, erroredDocuments);
      }

      logger.info(`Bulk indexed ${documents.length} documents in ${indexName}`);

      return {
        indexed: documents.length - (response.errors ? response.items.filter((item: any) => item.index?.error).length : 0),
        errors: response.errors
      };
    } catch (error: any) {
      logger.error('Bulk indexing failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async updateDocument(indexName: string, id: string, updates: any) {
    try {
      await this.client.update({
        index: indexName,
        id,
        doc: updates,
        refresh: 'wait_for'
      });

      logger.info(`Document updated: ${id} in ${indexName}`);
    } catch (error: any) {
      logger.error('Document update failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async deleteDocument(indexName: string, id: string) {
    try {
      await this.client.delete({
        index: indexName,
        id,
        refresh: 'wait_for'
      });

      logger.info(`Document deleted: ${id} from ${indexName}`);
    } catch (error: any) {
      logger.error('Document deletion failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async search(indexName: string, query: string, options: any = {}) {
    try {
      const {
        from = 0,
        size = 20,
        filters = {},
        sort = [],
        highlight = true
      } = options;

      const searchQuery: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      // Add text search
      if (query) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description^2', 'category', 'tags'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          searchQuery.bool.filter.push({
            terms: { [field]: value }
          });
        } else if (typeof value === 'object' && value !== null) {
          // Range filter
          searchQuery.bool.filter.push({
            range: { [field]: value }
          });
        } else {
          searchQuery.bool.filter.push({
            term: { [field]: value }
          });
        }
      });

      const searchBody: any = {
        query: searchQuery,
        from,
        size,
        sort
      };

      if (highlight) {
        searchBody.highlight = {
          fields: {
            name: {},
            description: {}
          }
        };
      }

      const response = await this.client.search({
        index: indexName,
        body: searchBody
      });

      return {
        total: response.hits.total,
        hits: response.hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          source: hit._source,
          highlight: hit.highlight
        }))
      };
    } catch (error: any) {
      logger.error('Search failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async searchProducts(query: string, options: any = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      rating,
      location,
      from = 0,
      size = 20,
      sortBy = 'relevance'
    } = options;

    const filters: any = {};

    if (category) filters.category = category;
    if (inStock !== undefined) filters.inStock = inStock;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = minPrice;
      if (maxPrice) filters.price.lte = maxPrice;
    }
    if (rating) {
      filters.rating = { gte: rating };
    }
    if (location) {
      filters.location = location;
    }

    const sortOptions: any = [];
    switch (sortBy) {
      case 'price_asc':
        sortOptions.push({ price: 'asc' });
        break;
      case 'price_desc':
        sortOptions.push({ price: 'desc' });
        break;
      case 'rating':
        sortOptions.push({ rating: 'desc' });
        break;
      case 'newest':
        sortOptions.push({ createdAt: 'desc' });
        break;
      default:
        sortOptions.push('_score');
    }

    return await this.search('products', query, {
      from,
      size,
      filters,
      sort: sortOptions
    });
  }

  async searchSellers(query: string, options: any = {}) {
    const {
      verified,
      minRating,
      location,
      from = 0,
      size = 20
    } = options;

    const filters: any = {};

    if (verified !== undefined) filters.verified = verified;
    if (minRating) {
      filters.rating = { gte: minRating };
    }
    if (location) {
      filters.location = location;
    }

    return await this.search('sellers', query, {
      from,
      size,
      filters,
      sort: [{ rating: 'desc' }, '_score']
    });
  }

  async autocomplete(indexName: string, query: string, field: string = 'name', size: number = 10) {
    try {
      const response = await this.client.search({
        index: indexName,
        body: {
          suggest: {
            autocomplete: {
              prefix: query,
              completion: {
                field: `${field}.suggest`,
                size,
                skip_duplicates: true,
                fuzzy: {
                  fuzziness: 'AUTO'
                }
              }
            }
          }
        }
      });

      const suggestions = response.suggest?.autocomplete?.[0]?.options || [];

      return suggestions.map((option: any) => ({
        text: option.text,
        score: option._score,
        source: option._source
      }));
    } catch (error: any) {
      logger.error('Autocomplete failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getSuggestions(query: string, size: number = 5) {
    try {
      const response = await this.client.search({
        index: 'products',
        body: {
          suggest: {
            text: query,
            simple_phrase: {
              phrase: {
                field: 'name',
                size,
                gram_size: 3,
                direct_generator: [
                  {
                    field: 'name',
                    suggest_mode: 'always'
                  }
                ]
              }
            }
          }
        }
      });

      const suggestions = response.suggest?.simple_phrase?.[0]?.options || [];

      return suggestions.map((option: any) => ({
        text: option.text,
        score: option.score
      }));
    } catch (error: any) {
      logger.error('Suggestions retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async aggregateByCategory(indexName: string, query: string = '') {
    try {
      const searchQuery = query
        ? {
            multi_match: {
              query,
              fields: ['name', 'description']
            }
          }
        : { match_all: {} };

      const response = await this.client.search({
        index: indexName,
        body: {
          query: searchQuery,
          size: 0,
          aggs: {
            categories: {
              terms: {
                field: 'category.keyword',
                size: 50
              }
            }
          }
        }
      });

      const buckets = response.aggregations?.categories?.buckets || [];

      return buckets.map((bucket: any) => ({
        category: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error: any) {
      logger.error('Category aggregation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async aggregatePriceRanges(indexName: string, query: string = '') {
    try {
      const searchQuery = query
        ? {
            multi_match: {
              query,
              fields: ['name', 'description']
            }
          }
        : { match_all: {} };

      const response = await this.client.search({
        index: indexName,
        body: {
          query: searchQuery,
          size: 0,
          aggs: {
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { to: 25, key: 'Under $25' },
                  { from: 25, to: 50, key: '$25 - $50' },
                  { from: 50, to: 100, key: '$50 - $100' },
                  { from: 100, to: 200, key: '$100 - $200' },
                  { from: 200, key: 'Over $200' }
                ]
              }
            }
          }
        }
      });

      const buckets = response.aggregations?.price_ranges?.buckets || [];

      return buckets.map((bucket: any) => ({
        range: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error: any) {
      logger.error('Price range aggregation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async moreLikeThis(indexName: string, documentId: string, size: number = 10) {
    try {
      const response = await this.client.search({
        index: indexName,
        body: {
          query: {
            more_like_this: {
              fields: ['name', 'description', 'category', 'tags'],
              like: [
                {
                  _index: indexName,
                  _id: documentId
                }
              ],
              min_term_freq: 1,
              max_query_terms: 12
            }
          },
          size
        }
      });

      return response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }));
    } catch (error: any) {
      logger.error('More like this search failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async geoSearch(indexName: string, lat: number, lon: number, distance: string, query: string = '') {
    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [
            {
              geo_distance: {
                distance,
                location: {
                  lat,
                  lon
                }
              }
            }
          ]
        }
      };

      if (query) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['name', 'description']
          }
        });
      }

      const response = await this.client.search({
        index: indexName,
        body: {
          query: searchQuery,
          sort: [
            {
              _geo_distance: {
                location: {
                  lat,
                  lon
                },
                order: 'asc',
                unit: 'km'
              }
            }
          ]
        }
      });

      return response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        distance: hit.sort?.[0]
      }));
    } catch (error: any) {
      logger.error('Geo search failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async reindex(sourceIndex: string, destIndex: string) {
    try {
      const response = await this.client.reindex({
        body: {
          source: {
            index: sourceIndex
          },
          dest: {
            index: destIndex
          }
        }
      });

      logger.info(`Reindexed from ${sourceIndex} to ${destIndex}`);

      return {
        total: response.total,
        created: response.created,
        updated: response.updated
      };
    } catch (error: any) {
      logger.error('Reindexing failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getIndexStats(indexName: string) {
    try {
      const stats = await this.client.indices.stats({ index: indexName });

      return {
        documentCount: stats._all?.primaries?.docs?.count || 0,
        storeSize: stats._all?.primaries?.store?.size_in_bytes || 0,
        indexingTotal: stats._all?.primaries?.indexing?.index_total || 0,
        searchTotal: stats._all?.primaries?.search?.query_total || 0
      };
    } catch (error: any) {
      logger.error('Index stats retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async deleteIndex(indexName: string) {
    try {
      await this.client.indices.delete({ index: indexName });
      logger.info(`Index ${indexName} deleted`);
    } catch (error: any) {
      logger.error(`Index deletion failed for ${indexName}:`, error);
      throw new AppError(error.message, 500);
    }
  }

  async refreshIndex(indexName: string) {
    try {
      await this.client.indices.refresh({ index: indexName });
      logger.info(`Index ${indexName} refreshed`);
    } catch (error: any) {
      logger.error(`Index refresh failed for ${indexName}:`, error);
      throw new AppError(error.message, 500);
    }
  }

  processQuery(query: string): string {
    // Tokenize and stem the query
    const tokens = this.tokenizer.tokenize(query.toLowerCase());
    const stemmedTokens = tokens?.map(token => this.stemmer.stem(token)) || [];
    return stemmedTokens.join(' ');
  }
}
