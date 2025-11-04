# Design Document

## Overview

The Smart Local Marketplace Platform is architected as a distributed microservices system leveraging modern cloud-native technologies. The platform uses a polyglot persistence approach with PostgreSQL for transactional data, MongoDB for product catalogs, Redis for caching, Elasticsearch for search, and Neo4j for recommendation graphs. The frontend consists of a Next.js web application and React Native mobile apps, all communicating through a unified API Gateway. Machine learning models run as separate Python microservices, while blockchain smart contracts handle escrow functionality. The system is designed for horizontal scalability, high availability, and real-time performance.

## Architecture

### High-Level Architecture

The platform follows a microservices architecture pattern with the following layers:

**Presentation Layer:**
- Next.js Web Application (SSR/SSG)
- React Native Mobile Apps (iOS/Android)
- Progressive Web App (PWA)

**API Layer:**
- API Gateway (Node.js/Express with GraphQL)
- REST API endpoints for legacy integrations
- WebSocket server for real-time features

**Service Layer (Microservices):**
- Auth Service: User authentication, authorization, session management
- Product Service: Product CRUD, catalog management, categories
- Order Service: Order processing, cart management, checkout
- Payment Service: Payment processing, escrow, refunds
- Inventory Service: Stock management, multi-location inventory
- Search Service: Elasticsearch integration, indexing, query processing
- Recommendation Service: ML-based product recommendations
- Notification Service: Email, SMS, push notifications
- Chat Service: Real-time messaging, WebSocket connections
- Analytics Service: Event tracking, metrics aggregation, reporting
- Delivery Service: Logistics integration, route optimization, tracking
- Media Service: Image/video upload, processing, CDN integration
- Review Service: Ratings, reviews, moderation

**Data Layer:**
- PostgreSQL: Primary transactional database
- MongoDB: Product catalog, logs, unstructured data
- Redis: Session cache, hot data, rate limiting
- Elasticsearch: Search index, full-text search
- Neo4j: Recommendation graph, user relationships
- InfluxDB: Time-series analytics data

**ML/AI Layer:**
- Recommendation Engine (Python/TensorFlow)
- Image Recognition Service (Python/PyTorch)
- Fraud Detection Service (Python/Scikit-learn)
- NLP Service (Python/spaCy, OpenAI API)
- Price Optimization Service (Python/TensorFlow)

**Blockchain Layer:**
- Ethereum/Polygon Smart Contracts for Escrow
- Web3 integration for crypto payments

**Infrastructure Layer:**
- Docker containers for all services
- Kubernetes for orchestration
- AWS/GCP for cloud infrastructure
- CloudFront/Cloudflare CDN
- RabbitMQ/Kafka for message queuing


### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Next.js Web App]
        MOBILE[React Native Apps]
        PWA[Progressive Web App]
    end
    
    subgraph "CDN Layer"
        CDN[CloudFront/Cloudflare CDN]
    end
    
    subgraph "API Gateway Layer"
        GATEWAY[API Gateway<br/>GraphQL + REST]
        WS[WebSocket Server]
    end
    
    subgraph "Microservices Layer"
        AUTH[Auth Service]
        PRODUCT[Product Service]
        ORDER[Order Service]
        PAYMENT[Payment Service]
        INVENTORY[Inventory Service]
        SEARCH[Search Service]
        RECOMMEND[Recommendation Service]
        NOTIFY[Notification Service]
        CHAT[Chat Service]
        ANALYTICS[Analytics Service]
        DELIVERY[Delivery Service]
        MEDIA[Media Service]
        REVIEW[Review Service]
    end
    
    subgraph "ML/AI Services"
        ML_REC[ML Recommendation]
        ML_IMG[Image Recognition]
        ML_FRAUD[Fraud Detection]
        ML_NLP[NLP Service]
        ML_PRICE[Price Optimization]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        MONGO[(MongoDB)]
        REDIS[(Redis Cache)]
        ELASTIC[(Elasticsearch)]
        NEO4J[(Neo4j)]
        INFLUX[(InfluxDB)]
    end
    
    subgraph "Message Queue"
        QUEUE[RabbitMQ/Kafka]
    end
    
    subgraph "External Services"
        STRIPE[Stripe/PayPal]
        BLOCKCHAIN[Ethereum/Polygon]
        DELIVERY_API[Delivery APIs]
        STORAGE[AWS S3]
        EMAIL[SendGrid]
        SMS[Twilio]
    end
    
    WEB --> CDN
    MOBILE --> CDN
    PWA --> CDN
    CDN --> GATEWAY
    CDN --> WS
    
    GATEWAY --> AUTH
    GATEWAY --> PRODUCT
    GATEWAY --> ORDER
    GATEWAY --> PAYMENT
    GATEWAY --> INVENTORY
    GATEWAY --> SEARCH
    GATEWAY --> RECOMMEND
    GATEWAY --> NOTIFY
    GATEWAY --> ANALYTICS
    GATEWAY --> DELIVERY
    GATEWAY --> MEDIA
    GATEWAY --> REVIEW
    
    WS --> CHAT
    
    AUTH --> POSTGRES
    AUTH --> REDIS
    
    PRODUCT --> MONGO
    PRODUCT --> REDIS
    PRODUCT --> QUEUE
    
    ORDER --> POSTGRES
    ORDER --> QUEUE
    
    PAYMENT --> POSTGRES
    PAYMENT --> STRIPE
    PAYMENT --> BLOCKCHAIN
    
    INVENTORY --> POSTGRES
    INVENTORY --> REDIS
    
    SEARCH --> ELASTIC
    SEARCH --> REDIS
    
    RECOMMEND --> NEO4J
    RECOMMEND --> ML_REC
    
    CHAT --> MONGO
    CHAT --> REDIS
    
    ANALYTICS --> INFLUX
    ANALYTICS --> POSTGRES
    
    DELIVERY --> POSTGRES
    DELIVERY --> DELIVERY_API
    
    MEDIA --> STORAGE
    MEDIA --> CDN
    
    REVIEW --> POSTGRES
    REVIEW --> MONGO
    
    NOTIFY --> EMAIL
    NOTIFY --> SMS
    NOTIFY --> QUEUE
    
    ML_REC --> NEO4J
    ML_IMG --> STORAGE
    ML_FRAUD --> POSTGRES
    ML_NLP --> REDIS
    ML_PRICE --> POSTGRES
    
    QUEUE --> NOTIFY
    QUEUE --> ANALYTICS
    QUEUE --> SEARCH
```

### Communication Patterns

**Synchronous Communication:**
- REST API for simple CRUD operations
- GraphQL for complex queries with nested data
- HTTP/2 for improved performance

**Asynchronous Communication:**
- RabbitMQ for event-driven messaging
- Kafka for high-throughput event streaming
- WebSockets for real-time bidirectional communication

**Data Consistency:**
- Eventual consistency for non-critical operations
- Strong consistency for financial transactions
- Saga pattern for distributed transactions
- Event sourcing for audit trails


## Components and Interfaces

### Frontend Components

#### Web Application (Next.js)

**Core Pages:**
- Homepage with personalized recommendations
- Product listing and search results
- Product detail page with AR preview
- Shopping cart and checkout
- User dashboard (buyer/seller)
- Seller analytics dashboard
- Order tracking and history
- Chat interface
- Profile and settings

**Shared Components:**
- ProductCard: Displays product with image, title, price, rating
- SearchBar: Auto-complete search with filters
- Navigation: Header, footer, mobile menu
- AuthModal: Login/register modal
- CartDrawer: Slide-out cart summary
- ReviewCard: Display review with rating, photos
- ChatWidget: Real-time chat interface
- ARViewer: 3D/AR product visualization
- PaymentForm: Secure payment input
- NotificationBell: Real-time notifications

**State Management:**
- Redux Toolkit for global state
- RTK Query for API caching
- Context API for theme, locale
- Local storage for cart persistence

**Performance Optimizations:**
- Server-side rendering for SEO
- Static generation for product pages
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Service worker for offline support

#### Mobile Application (React Native)

**Core Screens:**
- Home feed with recommendations
- Search and discovery
- Product details with AR
- Cart and checkout
- Orders and tracking
- Chat conversations
- Seller dashboard
- Profile and settings

**Native Features:**
- Biometric authentication
- Push notifications
- Camera integration for AR and image search
- Geolocation for local search
- Mobile wallet integration
- Offline mode with sync

**Navigation:**
- Bottom tab navigation
- Stack navigation for flows
- Deep linking support
- Universal links for sharing


### Backend Microservices

#### API Gateway

**Responsibilities:**
- Route requests to appropriate microservices
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- API versioning
- Logging and monitoring

**Technology Stack:**
- Node.js with Express.js
- Apollo Server for GraphQL
- JWT validation middleware
- Redis for rate limiting
- Helmet.js for security headers

**GraphQL Schema:**
```graphql
type Query {
  products(filters: ProductFilters, pagination: Pagination): ProductConnection
  product(id: ID!): Product
  recommendations(userId: ID!, limit: Int): [Product]
  orders(userId: ID!, status: OrderStatus): [Order]
  user(id: ID!): User
  searchProducts(query: String!, filters: SearchFilters): SearchResults
}

type Mutation {
  register(input: RegisterInput!): AuthPayload
  login(input: LoginInput!): AuthPayload
  createProduct(input: ProductInput!): Product
  updateProduct(id: ID!, input: ProductInput!): Product
  addToCart(productId: ID!, quantity: Int!): Cart
  checkout(input: CheckoutInput!): Order
  createReview(input: ReviewInput!): Review
  sendMessage(input: MessageInput!): Message
}

type Subscription {
  orderUpdated(orderId: ID!): Order
  messageReceived(conversationId: ID!): Message
  inventoryChanged(productId: ID!): Inventory
}
```

#### Auth Service

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- 2FA implementation
- OAuth integration (Google, Facebook)
- Session management
- Password reset flow

**API Endpoints:**
```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh-token
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
POST /auth/enable-2fa
POST /auth/verify-2fa
GET /auth/oauth/google
GET /auth/oauth/facebook
```

**Database Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- buyer, seller, admin
  is_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Product Service

**Responsibilities:**
- Product CRUD operations
- Category management
- Product search and filtering
- Image upload and processing
- Product variants and attributes
- Bulk product operations

**API Endpoints:**
```
GET /products
GET /products/:id
POST /products
PUT /products/:id
DELETE /products/:id
GET /products/:id/variants
POST /products/:id/images
GET /categories
POST /categories
GET /products/seller/:sellerId
POST /products/bulk-upload
```

**MongoDB Schema:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  price: Number,
  currency: String,
  category: {
    id: String,
    name: String,
    path: String
  },
  seller: {
    id: String,
    name: String,
    rating: Number
  },
  images: [{
    url: String,
    thumbnail: String,
    alt: String
  }],
  attributes: {
    brand: String,
    color: String,
    size: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  variants: [{
    id: String,
    name: String,
    price: Number,
    sku: String
  }],
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  seo: {
    slug: String,
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  status: String, // active, inactive, out_of_stock
  arEnabled: Boolean,
  arModelUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```


#### Order Service

**Responsibilities:**
- Order creation and management
- Cart operations
- Order status tracking
- Order history
- Cancellation and refunds

**API Endpoints:**
```
POST /orders
GET /orders/:id
GET /orders/user/:userId
PUT /orders/:id/status
POST /orders/:id/cancel
GET /cart/:userId
POST /cart/add
PUT /cart/update
DELETE /cart/remove
POST /checkout
```

**Database Schema:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  buyer_id UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  delivery_address JSONB,
  estimated_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID NOT NULL,
  seller_id UUID REFERENCES users(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  variant_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE carts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Payment Service

**Responsibilities:**
- Payment processing via Stripe/PayPal
- Escrow management
- Refund processing
- Transaction history
- Crypto payment integration
- Installment plans

**API Endpoints:**
```
POST /payments/process
POST /payments/escrow/create
POST /payments/escrow/release
POST /payments/refund
GET /payments/transaction/:id
GET /payments/user/:userId/history
POST /payments/crypto/create
POST /payments/installment/create
GET /payments/methods/:userId
POST /payments/methods/add
```

**Database Schema:**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  payment_gateway VARCHAR(50) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  escrow_status VARCHAR(50),
  escrow_release_date TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(50) NOT NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  token VARCHAR(255) NOT NULL,
  last_four VARCHAR(4),
  expiry_month INT,
  expiry_year INT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```


#### Inventory Service

**Responsibilities:**
- Real-time stock management
- Multi-location inventory
- Stock alerts
- Inventory forecasting
- POS integration
- Bulk inventory updates

**API Endpoints:**
```
GET /inventory/product/:productId
PUT /inventory/product/:productId
POST /inventory/adjust
GET /inventory/location/:locationId
POST /inventory/bulk-update
GET /inventory/low-stock
GET /inventory/forecast/:productId
POST /inventory/sync-pos
```

**Database Schema:**
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  location_id UUID REFERENCES locations(id),
  quantity INT NOT NULL,
  reserved_quantity INT DEFAULT 0,
  available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  reorder_point INT,
  reorder_quantity INT,
  last_restocked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  coordinates POINT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id),
  type VARCHAR(50) NOT NULL, -- sale, restock, adjustment, return
  quantity INT NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id),
  alert_type VARCHAR(50) NOT NULL,
  threshold INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Search Service

**Responsibilities:**
- Elasticsearch integration
- Product indexing
- Full-text search
- Semantic search
- Auto-complete
- Search analytics

**API Endpoints:**
```
GET /search
GET /search/autocomplete
POST /search/index
PUT /search/reindex
GET /search/suggestions
POST /search/image
POST /search/voice
GET /search/analytics
```

**Elasticsearch Index Mapping:**
```json
{
  "products": {
    "mappings": {
      "properties": {
        "id": { "type": "keyword" },
        "title": {
          "type": "text",
          "analyzer": "standard",
          "fields": {
            "keyword": { "type": "keyword" },
            "autocomplete": {
              "type": "text",
              "analyzer": "autocomplete"
            }
          }
        },
        "description": {
          "type": "text",
          "analyzer": "standard"
        },
        "price": { "type": "float" },
        "category": {
          "type": "nested",
          "properties": {
            "id": { "type": "keyword" },
            "name": { "type": "text" },
            "path": { "type": "keyword" }
          }
        },
        "seller": {
          "type": "object",
          "properties": {
            "id": { "type": "keyword" },
            "name": { "type": "text" },
            "rating": { "type": "float" }
          }
        },
        "location": { "type": "geo_point" },
        "rating": { "type": "float" },
        "reviewCount": { "type": "integer" },
        "inStock": { "type": "boolean" },
        "tags": { "type": "keyword" },
        "imageEmbedding": {
          "type": "dense_vector",
          "dims": 512
        },
        "createdAt": { "type": "date" },
        "updatedAt": { "type": "date" }
      }
    }
  }
}
```

**Search Query Example:**
```javascript
{
  query: {
    bool: {
      must: [
        {
          multi_match: {
            query: searchTerm,
            fields: ['title^3', 'description', 'category.name^2'],
            fuzziness: 'AUTO'
          }
        }
      ],
      filter: [
        { range: { price: { gte: minPrice, lte: maxPrice } } },
        { term: { inStock: true } },
        { geo_distance: {
            distance: `${radius}mi`,
            location: { lat, lon }
          }
        }
      ]
    }
  },
  sort: [
    { _score: 'desc' },
    { rating: 'desc' }
  ],
  aggs: {
    categories: {
      terms: { field: 'category.name' }
    },
    priceRanges: {
      range: {
        field: 'price',
        ranges: [
          { to: 50 },
          { from: 50, to: 100 },
          { from: 100, to: 500 },
          { from: 500 }
        ]
      }
    }
  }
}
```


#### Recommendation Service

**Responsibilities:**
- ML-based product recommendations
- Collaborative filtering
- Content-based filtering
- User behavior analysis
- Trending products
- Personalization

**API Endpoints:**
```
GET /recommendations/user/:userId
GET /recommendations/product/:productId/similar
GET /recommendations/trending
POST /recommendations/track-event
GET /recommendations/cross-sell/:productId
GET /recommendations/upsell/:productId
POST /recommendations/retrain
```

**Neo4j Graph Schema:**
```cypher
// Nodes
CREATE (u:User {id, preferences, demographics})
CREATE (p:Product {id, category, price, attributes})
CREATE (c:Category {id, name, path})

// Relationships
CREATE (u)-[:VIEWED {timestamp, duration}]->(p)
CREATE (u)-[:PURCHASED {timestamp, rating}]->(p)
CREATE (u)-[:SEARCHED {query, timestamp}]->(p)
CREATE (u)-[:ADDED_TO_CART {timestamp}]->(p)
CREATE (p)-[:BELONGS_TO]->(c)
CREATE (p)-[:SIMILAR_TO {score}]->(p2)
CREATE (u)-[:SIMILAR_TO {score}]->(u2)
```

**Recommendation Algorithms:**

1. **Collaborative Filtering:**
```python
def collaborative_filtering(user_id, k=10):
    # Find similar users based on purchase history
    similar_users = find_similar_users(user_id, limit=50)
    
    # Get products purchased by similar users
    candidate_products = get_products_from_users(similar_users)
    
    # Filter out already purchased products
    user_purchases = get_user_purchases(user_id)
    candidates = [p for p in candidate_products if p not in user_purchases]
    
    # Score and rank products
    scored_products = score_products(candidates, similar_users)
    
    return sorted(scored_products, key=lambda x: x.score, reverse=True)[:k]
```

2. **Content-Based Filtering:**
```python
def content_based_filtering(product_id, k=10):
    # Get product features
    product = get_product(product_id)
    features = extract_features(product)
    
    # Find similar products using cosine similarity
    all_products = get_all_products()
    similarities = []
    
    for p in all_products:
        if p.id != product_id:
            p_features = extract_features(p)
            similarity = cosine_similarity(features, p_features)
            similarities.append((p, similarity))
    
    return sorted(similarities, key=lambda x: x[1], reverse=True)[:k]
```

3. **Hybrid Approach:**
```python
def hybrid_recommendations(user_id, k=10):
    # Get recommendations from both methods
    collab_recs = collaborative_filtering(user_id, k=20)
    
    # Get user's recent views
    recent_views = get_recent_views(user_id, limit=5)
    content_recs = []
    for product_id in recent_views:
        content_recs.extend(content_based_filtering(product_id, k=10))
    
    # Combine and weight scores
    combined = {}
    for product, score in collab_recs:
        combined[product.id] = score * 0.6
    
    for product, score in content_recs:
        if product.id in combined:
            combined[product.id] += score * 0.4
        else:
            combined[product.id] = score * 0.4
    
    # Sort and return top k
    sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
    return [get_product(pid) for pid, score in sorted_recs[:k]]
```

#### Chat Service

**Responsibilities:**
- Real-time messaging via WebSocket
- Message persistence
- Conversation management
- Typing indicators
- Read receipts
- Message history

**API Endpoints:**
```
WebSocket /chat/connect
POST /chat/conversations
GET /chat/conversations/:userId
GET /chat/conversations/:id/messages
POST /chat/messages
PUT /chat/messages/:id/read
GET /chat/conversations/:id/typing
```

**MongoDB Schema:**
```javascript
{
  _id: ObjectId,
  participants: [
    { userId: String, role: String, joinedAt: Date }
  ],
  lastMessage: {
    text: String,
    senderId: String,
    timestamp: Date
  },
  unreadCount: {
    userId1: Number,
    userId2: Number
  },
  createdAt: Date,
  updatedAt: Date
}

// Messages Collection
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: String,
  receiverId: String,
  type: String, // text, image, product_link
  content: String,
  metadata: {
    productId: String,
    imageUrl: String
  },
  status: String, // sent, delivered, read
  readAt: Date,
  createdAt: Date
}
```

**WebSocket Event Handlers:**
```javascript
socket.on('join_conversation', (conversationId) => {
  socket.join(conversationId);
  socket.to(conversationId).emit('user_joined');
});

socket.on('send_message', async (data) => {
  const message = await saveMessage(data);
  io.to(data.conversationId).emit('new_message', message);
  
  // Send push notification if receiver is offline
  const receiver = await getUser(data.receiverId);
  if (!receiver.isOnline) {
    sendPushNotification(receiver.id, message);
  }
});

socket.on('typing', (conversationId) => {
  socket.to(conversationId).emit('user_typing', {
    userId: socket.userId,
    conversationId
  });
});

socket.on('read_message', async (messageId) => {
  await markAsRead(messageId);
  const message = await getMessage(messageId);
  io.to(message.conversationId).emit('message_read', {
    messageId,
    readAt: new Date()
  });
});
```


#### Analytics Service

**Responsibilities:**
- Event tracking
- Metrics aggregation
- Dashboard data
- Report generation
- Funnel analysis
- A/B testing

**API Endpoints:**
```
POST /analytics/events
GET /analytics/dashboard/:userId
GET /analytics/products/:productId/metrics
GET /analytics/sellers/:sellerId/performance
GET /analytics/funnel
POST /analytics/reports/generate
GET /analytics/reports/:id
GET /analytics/realtime
```

**InfluxDB Schema:**
```javascript
// Measurement: page_views
{
  time: timestamp,
  tags: {
    userId: string,
    page: string,
    device: string,
    browser: string
  },
  fields: {
    duration: integer,
    scrollDepth: float
  }
}

// Measurement: product_events
{
  time: timestamp,
  tags: {
    userId: string,
    productId: string,
    eventType: string, // view, click, add_to_cart, purchase
    category: string
  },
  fields: {
    price: float,
    quantity: integer
  }
}

// Measurement: search_events
{
  time: timestamp,
  tags: {
    userId: string,
    query: string,
    resultsCount: integer
  },
  fields: {
    clickPosition: integer,
    clickedProductId: string
  }
}
```

**Analytics Queries:**
```javascript
// Daily active users
SELECT COUNT(DISTINCT(userId)) 
FROM page_views 
WHERE time >= now() - 24h

// Conversion funnel
SELECT 
  COUNT(DISTINCT(userId)) as views,
  COUNT(DISTINCT(CASE WHEN eventType='add_to_cart' THEN userId END)) as cart_adds,
  COUNT(DISTINCT(CASE WHEN eventType='purchase' THEN userId END)) as purchases
FROM product_events
WHERE time >= now() - 7d

// Top products by revenue
SELECT 
  productId,
  SUM(price * quantity) as revenue,
  COUNT(*) as sales
FROM product_events
WHERE eventType='purchase' AND time >= now() - 30d
GROUP BY productId
ORDER BY revenue DESC
LIMIT 10
```

#### Delivery Service

**Responsibilities:**
- Delivery cost calculation
- Route optimization
- Tracking integration
- Delivery scheduling
- Courier assignment

**API Endpoints:**
```
POST /delivery/calculate-cost
POST /delivery/create
GET /delivery/:id/track
PUT /delivery/:id/status
POST /delivery/optimize-route
GET /delivery/couriers/available
POST /delivery/schedule
```

**Database Schema:**
```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  courier_id UUID,
  courier_service VARCHAR(100),
  tracking_number VARCHAR(255),
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  scheduled_pickup TIMESTAMP,
  scheduled_delivery TIMESTAMP,
  actual_pickup TIMESTAMP,
  actual_delivery TIMESTAMP,
  delivery_cost DECIMAL(10,2),
  distance_miles DECIMAL(10,2),
  route JSONB,
  signature_url VARCHAR(500),
  photo_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_tracking (
  id UUID PRIMARY KEY,
  delivery_id UUID REFERENCES deliveries(id),
  status VARCHAR(50) NOT NULL,
  location POINT,
  timestamp TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE couriers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  vehicle_type VARCHAR(50),
  current_location POINT,
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2),
  total_deliveries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Route Optimization Algorithm:**
```javascript
function optimizeRoute(deliveries) {
  // Using Traveling Salesman Problem (TSP) approximation
  const locations = deliveries.map(d => ({
    id: d.id,
    lat: d.delivery_address.latitude,
    lng: d.delivery_address.longitude,
    priority: d.priority
  }));
  
  // Start from warehouse/depot
  const depot = { lat: WAREHOUSE_LAT, lng: WAREHOUSE_LNG };
  
  // Nearest neighbor heuristic
  let route = [depot];
  let remaining = [...locations];
  let current = depot;
  
  while (remaining.length > 0) {
    // Find nearest unvisited location
    let nearest = null;
    let minDistance = Infinity;
    
    for (const loc of remaining) {
      const distance = calculateDistance(current, loc);
      const score = distance / (loc.priority || 1); // Factor in priority
      
      if (score < minDistance) {
        minDistance = score;
        nearest = loc;
      }
    }
    
    route.push(nearest);
    remaining = remaining.filter(l => l.id !== nearest.id);
    current = nearest;
  }
  
  // Return to depot
  route.push(depot);
  
  return {
    route,
    totalDistance: calculateTotalDistance(route),
    estimatedTime: estimateTime(route)
  };
}
```


#### Review Service

**Responsibilities:**
- Review creation and management
- Rating aggregation
- Review moderation
- Photo/video uploads
- Helpfulness voting

**API Endpoints:**
```
POST /reviews
GET /reviews/product/:productId
GET /reviews/:id
PUT /reviews/:id
DELETE /reviews/:id
POST /reviews/:id/helpful
POST /reviews/:id/report
GET /reviews/user/:userId
POST /reviews/:id/response
```

**Database Schema:**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'published',
  moderation_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE review_media (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES reviews(id),
  type VARCHAR(20) NOT NULL, -- image, video
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE review_votes (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES reviews(id),
  user_id UUID REFERENCES users(id),
  vote_type VARCHAR(20) NOT NULL, -- helpful, not_helpful
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE TABLE review_responses (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES reviews(id),
  seller_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Rating Aggregation:**
```javascript
async function calculateProductRating(productId) {
  const reviews = await Review.find({ 
    product_id: productId, 
    status: 'published' 
  });
  
  if (reviews.length === 0) return null;
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Calculate rating distribution
  const distribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };
  
  // Calculate weighted rating (Bayesian average)
  const C = 3.5; // Average rating across all products
  const m = 10; // Minimum reviews for confidence
  const R = averageRating;
  const v = reviews.length;
  
  const weightedRating = (v / (v + m)) * R + (m / (v + m)) * C;
  
  return {
    average: averageRating,
    weighted: weightedRating,
    count: reviews.length,
    distribution
  };
}
```

#### Media Service

**Responsibilities:**
- Image/video upload
- Image optimization
- CDN integration
- 3D model storage
- AR asset management

**API Endpoints:**
```
POST /media/upload
POST /media/upload-multiple
GET /media/:id
DELETE /media/:id
POST /media/optimize
POST /media/generate-thumbnail
GET /media/ar-models/:productId
POST /media/ar-models/upload
```

**Image Processing Pipeline:**
```javascript
async function processImage(file) {
  // 1. Validate file
  if (!isValidImage(file)) {
    throw new Error('Invalid image format');
  }
  
  // 2. Upload original to S3
  const originalKey = `originals/${uuid()}.${file.extension}`;
  await s3.upload(originalKey, file.buffer);
  
  // 3. Generate optimized versions
  const sizes = [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 300, height: 300 },
    { name: 'medium', width: 600, height: 600 },
    { name: 'large', width: 1200, height: 1200 }
  ];
  
  const optimized = await Promise.all(
    sizes.map(async (size) => {
      const resized = await sharp(file.buffer)
        .resize(size.width, size.height, { fit: 'inside' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      
      const key = `${size.name}/${uuid()}.jpg`;
      await s3.upload(key, resized);
      
      return {
        size: size.name,
        url: `${CDN_URL}/${key}`,
        width: size.width,
        height: size.height
      };
    })
  );
  
  // 4. Generate image embedding for visual search
  const embedding = await generateImageEmbedding(file.buffer);
  
  return {
    original: `${CDN_URL}/${originalKey}`,
    optimized,
    embedding
  };
}
```

#### Notification Service

**Responsibilities:**
- Email notifications
- SMS notifications
- Push notifications
- Notification preferences
- Template management

**API Endpoints:**
```
POST /notifications/send
POST /notifications/send-bulk
GET /notifications/user/:userId
PUT /notifications/:id/read
GET /notifications/preferences/:userId
PUT /notifications/preferences/:userId
POST /notifications/templates
```

**Database Schema:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- email, sms, push
  title VARCHAR(255),
  content TEXT NOT NULL,
  data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  read_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(255),
  template TEXT NOT NULL,
  variables JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Notification Queue Processing:**
```javascript
// Using RabbitMQ for notification queue
async function processNotificationQueue() {
  const channel = await rabbitmq.createChannel();
  await channel.assertQueue('notifications', { durable: true });
  
  channel.consume('notifications', async (msg) => {
    const notification = JSON.parse(msg.content.toString());
    
    try {
      // Check user preferences
      const prefs = await getNotificationPreferences(
        notification.userId,
        notification.type
      );
      
      // Send via enabled channels
      if (prefs.email_enabled && notification.channel === 'email') {
        await sendEmail(notification);
      }
      
      if (prefs.sms_enabled && notification.channel === 'sms') {
        await sendSMS(notification);
      }
      
      if (prefs.push_enabled && notification.channel === 'push') {
        await sendPushNotification(notification);
      }
      
      // Update notification status
      await updateNotificationStatus(notification.id, 'sent');
      
      channel.ack(msg);
    } catch (error) {
      console.error('Notification failed:', error);
      channel.nack(msg, false, true); // Requeue
    }
  });
}
```


## Data Models

### Core Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : sells
    USERS ||--o{ ORDERS : places
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ CONVERSATIONS : participates
    PRODUCTS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ REVIEWS : receives
    PRODUCTS ||--o{ INVENTORY : tracks
    ORDERS ||--o{ ORDER_ITEMS : includes
    ORDERS ||--|| TRANSACTIONS : pays
    ORDERS ||--|| DELIVERIES : ships
    TRANSACTIONS ||--o{ REFUNDS : generates
    INVENTORY ||--|| LOCATIONS : stored_at
    CONVERSATIONS ||--o{ MESSAGES : contains
    
    USERS {
        uuid id PK
        string email
        string password_hash
        string role
        boolean is_verified
        timestamp created_at
    }
    
    PRODUCTS {
        uuid id PK
        uuid seller_id FK
        string title
        text description
        decimal price
        string category
        jsonb attributes
        boolean ar_enabled
        timestamp created_at
    }
    
    ORDERS {
        uuid id PK
        uuid buyer_id FK
        string status
        decimal total
        jsonb delivery_address
        timestamp created_at
    }
    
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }
    
    INVENTORY {
        uuid id PK
        uuid product_id FK
        uuid location_id FK
        int quantity
        int reserved_quantity
    }
    
    REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        int rating
        text content
        timestamp created_at
    }
    
    TRANSACTIONS {
        uuid id PK
        uuid order_id FK
        decimal amount
        string status
        string escrow_status
        timestamp created_at
    }
    
    DELIVERIES {
        uuid id PK
        uuid order_id FK
        string status
        jsonb route
        timestamp scheduled_delivery
    }
```

### User Profile Model

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'buyer' | 'seller' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    bio?: string;
  };
  addresses: Address[];
  preferences: {
    language: string;
    currency: string;
    notifications: NotificationPreferences;
    theme: 'light' | 'dark';
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    kycVerified: boolean;
    kycDocuments?: string[];
  };
  security: {
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    lastLogin?: Date;
    loginHistory: LoginRecord[];
  };
  seller?: SellerProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface SellerProfile {
  businessName: string;
  businessType: string;
  taxId?: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  subscriptionExpiry: Date;
  rating: number;
  totalSales: number;
  totalRevenue: number;
  payoutMethod: PayoutMethod;
  bankAccount?: BankAccount;
}

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

### Product Model

```typescript
interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: Category;
  subcategory?: string;
  images: ProductImage[];
  attributes: Record<string, any>;
  variants?: ProductVariant[];
  specifications: Specification[];
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
    unit: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  seo: {
    slug: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  ar: {
    enabled: boolean;
    modelUrl?: string;
    modelFormat?: 'gltf' | 'usdz';
    thumbnailUrl?: string;
  };
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  featuredUntil?: Date;
  views: number;
  clicks: number;
  sales: number;
  rating?: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductImage {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  order: number;
  embedding?: number[]; // For visual search
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, string>;
  inventory: number;
  images?: string[];
}

interface Category {
  id: string;
  name: string;
  path: string;
  level: number;
  parentId?: string;
}
```

### Order Model

```typescript
interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    total: number;
    currency: string;
  };
  payment: {
    method: string;
    status: PaymentStatus;
    transactionId: string;
    paidAt?: Date;
  };
  delivery: {
    address: Address;
    method: string;
    estimatedDelivery: Date;
    actualDelivery?: Date;
    trackingNumber?: string;
  };
  timeline: OrderTimeline[];
  notes?: string;
  cancellation?: {
    reason: string;
    cancelledBy: string;
    cancelledAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  id: string;
  productId: string;
  sellerId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'in_escrow';

interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  notes?: string;
  location?: string;
}
```

### Cart Model

```typescript
interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    estimatedTax: number;
    estimatedDelivery: number;
    total: number;
  };
  appliedCoupons: Coupon[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: {
    title: string;
    image: string;
    sellerId: string;
    inStock: boolean;
    maxQuantity: number;
  };
  addedAt: Date;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt: Date;
}
```

### Review Model

```typescript
interface Review {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  media: ReviewMedia[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  response?: SellerResponse;
  status: 'pending' | 'published' | 'rejected';
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface SellerResponse {
  sellerId: string;
  content: string;
  createdAt: Date;
}
```


## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
    path: string;
  };
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Authentication Errors (1xxx)
  UNAUTHORIZED = 'AUTH_1001',
  INVALID_CREDENTIALS = 'AUTH_1002',
  TOKEN_EXPIRED = 'AUTH_1003',
  INVALID_TOKEN = 'AUTH_1004',
  TWO_FACTOR_REQUIRED = 'AUTH_1005',
  
  // Authorization Errors (2xxx)
  FORBIDDEN = 'AUTHZ_2001',
  INSUFFICIENT_PERMISSIONS = 'AUTHZ_2002',
  
  // Validation Errors (3xxx)
  VALIDATION_ERROR = 'VAL_3001',
  INVALID_INPUT = 'VAL_3002',
  MISSING_REQUIRED_FIELD = 'VAL_3003',
  
  // Resource Errors (4xxx)
  NOT_FOUND = 'RES_4001',
  ALREADY_EXISTS = 'RES_4002',
  CONFLICT = 'RES_4003',
  
  // Business Logic Errors (5xxx)
  INSUFFICIENT_STOCK = 'BIZ_5001',
  PRODUCT_UNAVAILABLE = 'BIZ_5002',
  PAYMENT_FAILED = 'BIZ_5003',
  ORDER_CANNOT_BE_CANCELLED = 'BIZ_5004',
  INVALID_COUPON = 'BIZ_5005',
  
  // External Service Errors (6xxx)
  PAYMENT_GATEWAY_ERROR = 'EXT_6001',
  DELIVERY_SERVICE_ERROR = 'EXT_6002',
  EMAIL_SERVICE_ERROR = 'EXT_6003',
  
  // System Errors (9xxx)
  INTERNAL_SERVER_ERROR = 'SYS_9001',
  SERVICE_UNAVAILABLE = 'SYS_9002',
  DATABASE_ERROR = 'SYS_9003',
  RATE_LIMIT_EXCEEDED = 'SYS_9004'
}
```

### Error Handling Middleware

```typescript
// Express error handling middleware
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  // Determine error type and status code
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';
  
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    errorCode = ErrorCode.UNAUTHORIZED;
    message = 'Authentication required';
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    errorCode = ErrorCode.FORBIDDEN;
    message = 'Access denied';
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorCode = ErrorCode.NOT_FOUND;
    message = err.message;
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path
    }
  });
}
```

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors
      if (error instanceof ValidationError || 
          error instanceof UnauthorizedError) {
        throw error;
      }
      
      // Calculate exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
      
      logger.warn({
        message: 'Retrying operation',
        attempt: attempt + 1,
        maxRetries,
        error: error.message
      });
    }
  }
  
  throw lastError!;
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      logger.error('Circuit breaker opened');
    }
  }
}
```

## Testing Strategy

### Unit Testing

**Framework:** Jest with TypeScript

**Coverage Requirements:**
- Minimum 80% code coverage
- 100% coverage for critical paths (payment, auth)

**Example Test:**
```typescript
describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepository>;
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    
    productService = new ProductService(mockRepository);
  });
  
  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        title: 'Test Product',
        price: 99.99,
        sellerId: 'seller-123'
      };
      
      mockRepository.create.mockResolvedValue({
        id: 'product-123',
        ...productData
      });
      
      const result = await productService.createProduct(productData);
      
      expect(result.id).toBe('product-123');
      expect(mockRepository.create).toHaveBeenCalledWith(productData);
    });
    
    it('should throw validation error for invalid price', async () => {
      const productData = {
        title: 'Test Product',
        price: -10,
        sellerId: 'seller-123'
      };
      
      await expect(
        productService.createProduct(productData)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### Integration Testing

**Framework:** Jest with Supertest

**Example Test:**
```typescript
describe('Product API', () => {
  let app: Express;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getTestAuthToken();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  describe('POST /api/products', () => {
    it('should create product for authenticated seller', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Product',
          description: 'Test description',
          price: 99.99,
          category: 'electronics'
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Test Product');
    });
    
    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .post('/api/products')
        .send({
          title: 'Test Product',
          price: 99.99
        })
        .expect(401);
    });
  });
});
```

### End-to-End Testing

**Framework:** Playwright

**Example Test:**
```typescript
test('complete purchase flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'buyer@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Search for product
  await page.fill('[name="search"]', 'laptop');
  await page.press('[name="search"]', 'Enter');
  await page.waitForSelector('.product-card');
  
  // View product details
  await page.click('.product-card:first-child');
  await expect(page).toHaveURL(/\/products\/.+/);
  
  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  await expect(page.locator('.cart-count')).toHaveText('1');
  
  // Checkout
  await page.click('[aria-label="Cart"]');
  await page.click('button:has-text("Checkout")');
  
  // Fill delivery address
  await page.fill('[name="street"]', '123 Main St');
  await page.fill('[name="city"]', 'New York');
  await page.fill('[name="zipCode"]', '10001');
  
  // Enter payment details
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="expiry"]', '12/25');
  await page.fill('[name="cvc"]', '123');
  
  // Complete order
  await page.click('button:has-text("Place Order")');
  
  // Verify order confirmation
  await expect(page).toHaveURL(/\/orders\/.+/);
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

### Load Testing

**Framework:** k6

**Example Test:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

export default function () {
  // Search products
  const searchRes = http.get('https://api.example.com/products?q=laptop');
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
  
  // Get product details
  const productRes = http.get('https://api.example.com/products/123');
  check(productRes, {
    'product status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```


## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Redis
    participant Database
    
    Client->>API Gateway: POST /auth/login
    API Gateway->>Auth Service: Forward credentials
    Auth Service->>Database: Verify credentials
    Database-->>Auth Service: User data
    Auth Service->>Auth Service: Generate JWT
    Auth Service->>Redis: Store session
    Auth Service-->>API Gateway: JWT + Refresh Token
    API Gateway-->>Client: Auth tokens
    
    Client->>API Gateway: GET /products (with JWT)
    API Gateway->>API Gateway: Validate JWT
    API Gateway->>Redis: Check session
    Redis-->>API Gateway: Session valid
    API Gateway->>Product Service: Forward request
    Product Service-->>API Gateway: Products
    API Gateway-->>Client: Response
```

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string;        // User ID
  email: string;
  role: string;
  iat: number;        // Issued at
  exp: number;        // Expiration
  jti: string;        // JWT ID
  sessionId: string;
}

// Token generation
function generateTokens(user: User) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: generateSessionId()
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}
```

### Authorization Middleware

```typescript
// Role-based access control
function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    
    next();
  };
}

// Usage
app.post('/api/products', 
  authenticate,
  authorize('seller', 'admin'),
  createProduct
);
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Global rate limiter
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:global:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Auth endpoint rate limiter (stricter)
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
```

### Input Validation

```typescript
import { z } from 'zod';

// Product validation schema
const productSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(1000000),
  category: z.string(),
  images: z.array(z.string().url()).max(10),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string()
  })
});

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
}

// Usage
app.post('/api/products',
  authenticate,
  validate(productSchema),
  createProduct
);
```

### SQL Injection Prevention

```typescript
// Using parameterized queries with Prisma
async function getProductsByCategory(category: string) {
  // Safe - Prisma handles parameterization
  return await prisma.product.findMany({
    where: {
      category: category
    }
  });
}

// Raw queries with parameters
async function customQuery(userId: string) {
  return await prisma.$queryRaw`
    SELECT * FROM orders 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}
```

### XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

// Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.example.com']
  }
}));
```

### CSRF Protection

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to state-changing operations
app.post('/api/products', csrfProtection, createProduct);
app.put('/api/products/:id', csrfProtection, updateProduct);
app.delete('/api/products/:id', csrfProtection, deleteProduct);
```

### Data Encryption

```typescript
import crypto from 'crypto';

// Encrypt sensitive data
function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt sensitive data
function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Multi-layer caching
class CacheManager {
  constructor(
    private redis: Redis,
    private memoryCache: NodeCache
  ) {}
  
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    const memoryValue = this.memoryCache.get<T>(key);
    if (memoryValue) {
      return memoryValue;
    }
    
    // L2: Redis cache
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue) as T;
      this.memoryCache.set(key, parsed, 60); // Cache for 1 minute
      return parsed;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, value, Math.min(ttl, 300));
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    this.memoryCache.flushAll();
    
    // Clear Redis keys matching pattern
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage
const cache = new CacheManager(redisClient, new NodeCache());

async function getProduct(id: string) {
  const cacheKey = `product:${id}`;
  
  // Try cache first
  const cached = await cache.get<Product>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const product = await prisma.product.findUnique({ where: { id } });
  
  // Cache for 1 hour
  if (product) {
    await cache.set(cacheKey, product, 3600);
  }
  
  return product;
}
```

### Database Query Optimization

```typescript
// Use indexes
await prisma.$executeRaw`
  CREATE INDEX idx_products_category ON products(category);
  CREATE INDEX idx_products_seller ON products(seller_id);
  CREATE INDEX idx_products_location ON products USING GIST(location);
  CREATE INDEX idx_orders_buyer ON orders(buyer_id);
  CREATE INDEX idx_orders_status ON orders(status);
`;

// Efficient pagination with cursor
async function getProducts(cursor?: string, limit: number = 20) {
  return await prisma.product.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}

// Batch loading to avoid N+1 queries
import DataLoader from 'dataloader';

const sellerLoader = new DataLoader(async (sellerIds: string[]) => {
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } }
  });
  
  const sellerMap = new Map(sellers.map(s => [s.id, s]));
  return sellerIds.map(id => sellerMap.get(id) || null);
});

// Usage in GraphQL resolver
async function resolveProduct(product: Product) {
  return {
    ...product,
    seller: await sellerLoader.load(product.sellerId)
  };
}
```

### Image Optimization

```typescript
import sharp from 'sharp';

async function optimizeImage(buffer: Buffer) {
  const sizes = [
    { name: 'thumbnail', width: 150 },
    { name: 'small', width: 300 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 }
  ];
  
  const optimized = await Promise.all(
    sizes.map(async (size) => {
      const resized = await sharp(buffer)
        .resize(size.width, null, { 
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 85, 
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
      
      return {
        size: size.name,
        buffer: resized,
        width: size.width
      };
    })
  );
  
  return optimized;
}
```

### API Response Compression

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression ratio
}));
```

### Connection Pooling

```typescript
// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Redis connection pool
const redisPool = new GenericPool({
  create: () => createRedisClient(),
  destroy: (client) => client.quit(),
  max: 10,
  min: 2
});
```


## Deployment Architecture

### Kubernetes Deployment

```yaml
# API Gateway Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: marketplace/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  api-gateway:
    build: ./backend/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@postgres:5432/marketplace
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - rabbitmq
    volumes:
      - ./backend/api-gateway:/app
      - /app/node_modules
  
  auth-service:
    build: ./backend/auth-service
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/marketplace
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  product-service:
    build: ./backend/product-service
    ports:
      - "3002:3002"
    environment:
      - MONGODB_URL=mongodb://mongo:27017/marketplace
      - REDIS_URL=redis://redis:6379
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - mongo
      - redis
      - elasticsearch
  
  order-service:
    build: ./backend/order-service
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/marketplace
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq
  
  payment-service:
    build: ./backend/payment-service
    ports:
      - "3004:3004"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/marketplace
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - postgres
  
  recommendation-service:
    build: ./ml-models/recommendation
    ports:
      - "5000:5000"
    environment:
      - NEO4J_URL=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=password
    depends_on:
      - neo4j
  
  search-service:
    build: ./backend/search-service
    ports:
      - "3005:3005"
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - elasticsearch
  
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=marketplace
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
  
  elasticsearch:
    image: elasticsearch:8.8.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
  
  neo4j:
    image: neo4j:5
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/password
    volumes:
      - neo4j-data:/data
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  postgres-data:
  mongo-data:
  redis-data:
  elasticsearch-data:
  neo4j-data:
  rabbitmq-data:
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/api-gateway:$IMAGE_TAG ./backend/api-gateway
          docker push $ECR_REGISTRY/api-gateway:$IMAGE_TAG
          
          docker build -t $ECR_REGISTRY/auth-service:$IMAGE_TAG ./backend/auth-service
          docker push $ECR_REGISTRY/auth-service:$IMAGE_TAG
          
          docker build -t $ECR_REGISTRY/product-service:$IMAGE_TAG ./backend/product-service
          docker push $ECR_REGISTRY/product-service:$IMAGE_TAG
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=${{ secrets.ECR_REGISTRY }}/api-gateway:${{ github.sha }}
          
          kubectl set image deployment/auth-service \
            auth-service=${{ secrets.ECR_REGISTRY }}/auth-service:${{ github.sha }}
          
          kubectl set image deployment/product-service \
            product-service=${{ secrets.ECR_REGISTRY }}/product-service:${{ github.sha }}
          
          kubectl rollout status deployment/api-gateway
          kubectl rollout status deployment/auth-service
          kubectl rollout status deployment/product-service
```

### Monitoring and Observability

```typescript
// Prometheus metrics
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Active connections
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode
      },
      duration
    );
    
    activeConnections.dec();
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Logging Configuration

```typescript
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    
    // Elasticsearch for production
    ...(process.env.NODE_ENV === 'production' ? [
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL
        },
        index: 'logs'
      })
    ] : [])
  ]
});

export default logger;
```

## Scalability Considerations

### Database Sharding Strategy

```typescript
// Shard by user ID for user-related data
function getUserShard(userId: string): string {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const shardNumber = parseInt(hash.substring(0, 8), 16) % NUM_SHARDS;
  return `shard_${shardNumber}`;
}

// Shard by product category for product data
function getProductShard(category: string): string {
  const categoryShards = {
    'electronics': 'shard_0',
    'fashion': 'shard_1',
    'home': 'shard_2',
    'sports': 'shard_3'
  };
  return categoryShards[category] || 'shard_0';
}

// Database connection manager
class ShardedDatabase {
  private connections: Map<string, PrismaClient> = new Map();
  
  getConnection(shardKey: string): PrismaClient {
    if (!this.connections.has(shardKey)) {
      const connection = new PrismaClient({
        datasources: {
          db: {
            url: process.env[`DATABASE_URL_${shardKey.toUpperCase()}`]
          }
        }
      });
      this.connections.set(shardKey, connection);
    }
    return this.connections.get(shardKey)!;
  }
  
  async query(shardKey: string, operation: (client: PrismaClient) => Promise<any>) {
    const client = this.getConnection(shardKey);
    return await operation(client);
  }
}
```

### Read Replicas

```typescript
// Master-slave replication setup
class DatabasePool {
  private master: PrismaClient;
  private replicas: PrismaClient[];
  private currentReplica = 0;
  
  constructor() {
    this.master = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_MASTER_URL } }
    });
    
    this.replicas = [
      new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_REPLICA_1_URL } }
      }),
      new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_REPLICA_2_URL } }
      })
    ];
  }
  
  // Write operations go to master
  async write<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    return await operation(this.master);
  }
  
  // Read operations use round-robin across replicas
  async read<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const replica = this.replicas[this.currentReplica];
    this.currentReplica = (this.currentReplica + 1) % this.replicas.length;
    return await operation(replica);
  }
}
```

### Message Queue for Async Processing

```typescript
// RabbitMQ producer
class MessageQueue {
  private channel: Channel;
  
  async publish(queue: string, message: any): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }
  
  async consume(queue: string, handler: (msg: any) => Promise<void>): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.prefetch(1); // Process one message at a time
    
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Message processing failed:', error);
          this.channel.nack(msg, false, true); // Requeue
        }
      }
    });
  }
}

// Usage: Send email asynchronously
await messageQueue.publish('email-queue', {
  to: user.email,
  subject: 'Order Confirmation',
  template: 'order-confirmation',
  data: { orderId, items }
});
```

This comprehensive design document covers all major aspects of the Smart Local Marketplace Platform architecture, from frontend components to backend microservices, data models, security, testing, deployment, and scalability strategies.
