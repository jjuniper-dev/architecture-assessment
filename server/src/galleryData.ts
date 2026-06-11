export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  accent?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface GalleryDiagram {
  id: string;
  filename: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export const galleryDiagrams: GalleryDiagram[] = [
  {
    id: 'layered-ntier',
    filename: 'img_3F7q_LayeredArchitecture_20250114_b91X_NTierBaselineDraft.png',
    title: 'Layered (N-Tier) Architecture',
    category: 'Application Structure',
    description: 'Classic separation of presentation, application, domain and data layers. A safe default for line-of-business systems where simplicity and clear boundaries matter more than independent deployability.',
    tags: ['baseline', 'monolith-friendly', 'separation-of-concerns'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'presentation', x: 30, y: 15, w: 460, h: 55, label: 'Presentation Layer\n(Web / Mobile UI)' },
      { id: 'application', x: 30, y: 90, w: 460, h: 55, label: 'Application Layer\n(APIs, Orchestration)' },
      { id: 'domain', x: 30, y: 165, w: 460, h: 55, label: 'Domain Layer\n(Business Rules)' },
      { id: 'data', x: 30, y: 240, w: 460, h: 45, label: 'Data Layer\n(Persistence)' }
    ],
    edges: [
      { from: 'presentation', to: 'application' },
      { from: 'application', to: 'domain' },
      { from: 'domain', to: 'data' }
    ]
  },
  {
    id: 'microservices',
    filename: 'img_a02M_MicroservicesOverview_20250203_k77P_ServiceDecompositionV2.png',
    title: 'Microservices Architecture',
    category: 'Service Decomposition',
    description: 'Independently deployable services behind an API gateway, each owning its own datastore. Good starting point when teams need to scale and ship independently, at the cost of operational complexity.',
    tags: ['scalability', 'team-autonomy', 'polyglot-persistence'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'gateway', x: 200, y: 15, w: 120, h: 45, label: 'API Gateway', accent: true },
      { id: 'users', x: 30, y: 100, w: 130, h: 45, label: 'Users Service' },
      { id: 'orders', x: 195, y: 100, w: 130, h: 45, label: 'Orders Service' },
      { id: 'payments', x: 360, y: 100, w: 130, h: 45, label: 'Payments Service' },
      { id: 'usersDb', x: 30, y: 190, w: 130, h: 45, label: 'Users DB' },
      { id: 'ordersDb', x: 195, y: 190, w: 130, h: 45, label: 'Orders DB' },
      { id: 'paymentsDb', x: 360, y: 190, w: 130, h: 45, label: 'Payments DB' }
    ],
    edges: [
      { from: 'gateway', to: 'users' },
      { from: 'gateway', to: 'orders' },
      { from: 'gateway', to: 'payments' },
      { from: 'users', to: 'usersDb' },
      { from: 'orders', to: 'ordersDb' },
      { from: 'payments', to: 'paymentsDb' }
    ]
  },
  {
    id: 'event-driven',
    filename: 'img_q5Lz_EventDrivenFlow_20250227_t3Hd_AsyncIntegrationSketch.png',
    title: 'Event-Driven Architecture',
    category: 'Integration Pattern',
    description: 'Producers publish events to a broker; consumers subscribe independently. Useful as a starting point for decoupling systems that need to react to changes without synchronous calls.',
    tags: ['async', 'decoupling', 'pub-sub'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'prodA', x: 20, y: 30, w: 140, h: 45, label: 'Order Service\n(Producer)' },
      { id: 'prodB', x: 20, y: 120, w: 140, h: 45, label: 'Inventory Service\n(Producer)' },
      { id: 'bus', x: 200, y: 75, w: 120, h: 55, label: 'Event Bus /\nMessage Broker', accent: true },
      { id: 'conA', x: 360, y: 15, w: 140, h: 45, label: 'Notification Service' },
      { id: 'conB', x: 360, y: 105, w: 140, h: 45, label: 'Analytics Service' },
      { id: 'conC', x: 360, y: 195, w: 140, h: 45, label: 'Audit Log Service' }
    ],
    edges: [
      { from: 'prodA', to: 'bus' },
      { from: 'prodB', to: 'bus' },
      { from: 'bus', to: 'conA' },
      { from: 'bus', to: 'conB' },
      { from: 'bus', to: 'conC' }
    ]
  },
  {
    id: 'api-gateway-bff',
    filename: 'img_p9Vc_ApiGatewayBFF_20250309_m2Qe_FrontendBackendSplit.png',
    title: 'API Gateway / Backend-for-Frontend',
    category: 'Edge & Aggregation',
    description: 'Each client type gets a tailored backend-for-frontend, fronted by a shared API gateway into core services. Useful starting point when web, mobile and partner channels have diverging needs.',
    tags: ['bff', 'edge', 'multi-channel'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'web', x: 20, y: 20, w: 130, h: 45, label: 'Web BFF' },
      { id: 'mobile', x: 20, y: 110, w: 130, h: 45, label: 'Mobile BFF' },
      { id: 'partner', x: 20, y: 200, w: 130, h: 45, label: 'Partner BFF' },
      { id: 'gateway', x: 195, y: 110, w: 130, h: 55, label: 'API Gateway', accent: true },
      { id: 'catalog', x: 370, y: 15, w: 130, h: 45, label: 'Catalog Service' },
      { id: 'order', x: 370, y: 105, w: 130, h: 45, label: 'Order Service' },
      { id: 'account', x: 370, y: 195, w: 130, h: 45, label: 'Account Service' }
    ],
    edges: [
      { from: 'web', to: 'gateway' },
      { from: 'mobile', to: 'gateway' },
      { from: 'partner', to: 'gateway' },
      { from: 'gateway', to: 'catalog' },
      { from: 'gateway', to: 'order' },
      { from: 'gateway', to: 'account' }
    ]
  },
  {
    id: 'hub-and-spoke',
    filename: 'img_x4Tb_HubSpokeIntegration_20250322_r8Wn_LegacySystemBridge.png',
    title: 'Hub-and-Spoke Integration',
    category: 'Integration Pattern',
    description: 'A central integration hub mediates between systems of record. Useful starting point for connecting legacy systems where a full event-driven rebuild is not yet feasible.',
    tags: ['esb', 'legacy-integration', 'centralized'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'hub', x: 200, y: 115, w: 130, h: 60, label: 'Integration Hub\n(ESB)', accent: true },
      { id: 'crm', x: 30, y: 20, w: 120, h: 45, label: 'CRM' },
      { id: 'erp', x: 30, y: 225, w: 120, h: 45, label: 'ERP' },
      { id: 'hr', x: 370, y: 20, w: 120, h: 45, label: 'HR System' },
      { id: 'finance', x: 370, y: 225, w: 120, h: 45, label: 'Finance System' }
    ],
    edges: [
      { from: 'crm', to: 'hub' },
      { from: 'erp', to: 'hub' },
      { from: 'hub', to: 'hr' },
      { from: 'hub', to: 'finance' }
    ]
  },
  {
    id: 'data-mesh',
    filename: 'img_g6Yp_DataMeshDomains_20250405_h1Zv_PlatformCatalogConcept.png',
    title: 'Data Mesh',
    category: 'Data Architecture',
    description: 'Domain teams own and publish their data products through a shared self-serve platform and catalog. Starting point for organizations decentralizing data ownership while keeping discoverability.',
    tags: ['data-mesh', 'domain-ownership', 'self-serve-platform'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'domSales', x: 20, y: 20, w: 160, h: 50, label: 'Domain: Sales\nData Product' },
      { id: 'domHr', x: 20, y: 115, w: 160, h: 50, label: 'Domain: HR\nData Product' },
      { id: 'domFinance', x: 20, y: 210, w: 160, h: 50, label: 'Domain: Finance\nData Product' },
      { id: 'platform', x: 230, y: 115, w: 150, h: 60, label: 'Self-Serve Data\nPlatform + Catalog', accent: true },
      { id: 'consumers', x: 420, y: 115, w: 80, h: 60, label: 'Analytics &\nReporting' }
    ],
    edges: [
      { from: 'domSales', to: 'platform' },
      { from: 'domHr', to: 'platform' },
      { from: 'domFinance', to: 'platform' },
      { from: 'platform', to: 'consumers' }
    ]
  },
  {
    id: 'serverless-faas',
    filename: 'img_d0Rk_ServerlessFunctions_20250418_s7Bm_EventDrivenFaaS.png',
    title: 'Serverless / Event-Driven Functions',
    category: 'Compute Pattern',
    description: 'Managed API gateway routes to single-purpose functions backed by managed data and messaging services. Starting point for low-traffic or bursty workloads where infrastructure management should be minimized.',
    tags: ['serverless', 'faas', 'managed-services'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'client', x: 15, y: 115, w: 100, h: 55, label: 'Client App' },
      { id: 'gateway', x: 155, y: 115, w: 120, h: 55, label: 'API Gateway', accent: true },
      { id: 'fn1', x: 315, y: 20, w: 120, h: 50, label: 'Function:\nCreate Order' },
      { id: 'fn2', x: 315, y: 115, w: 120, h: 50, label: 'Function:\nGet Order' },
      { id: 'fn3', x: 315, y: 210, w: 120, h: 50, label: 'Function:\nNotify' },
      { id: 'db', x: 455, y: 65, w: 60, h: 50, label: 'Data\nStore' },
      { id: 'topic', x: 455, y: 175, w: 60, h: 50, label: 'Pub/Sub\nTopic' }
    ],
    edges: [
      { from: 'client', to: 'gateway' },
      { from: 'gateway', to: 'fn1' },
      { from: 'gateway', to: 'fn2' },
      { from: 'gateway', to: 'fn3' },
      { from: 'fn1', to: 'db' },
      { from: 'fn2', to: 'db' },
      { from: 'fn3', to: 'topic' }
    ]
  },
  {
    id: 'cqrs-event-sourcing',
    filename: 'img_w2Nf_CqrsEventSourcing_20250502_c5Tj_CommandQuerySplit.png',
    title: 'CQRS + Event Sourcing',
    category: 'Data Architecture',
    description: 'Commands write to an event store that projects read models for queries. Starting point when read and write workloads need to scale independently or a full audit trail is required.',
    tags: ['cqrs', 'event-sourcing', 'audit-trail'],
    width: 520,
    height: 300,
    nodes: [
      { id: 'client', x: 15, y: 115, w: 90, h: 55, label: 'Client' },
      { id: 'commandApi', x: 140, y: 30, w: 130, h: 50, label: 'Command API' },
      { id: 'queryApi', x: 140, y: 210, w: 130, h: 50, label: 'Query API' },
      { id: 'eventStore', x: 305, y: 30, w: 130, h: 50, label: 'Event Store', accent: true },
      { id: 'readModel', x: 305, y: 210, w: 130, h: 50, label: 'Read Model\n(Projection)' },
      { id: 'bus', x: 460, y: 115, w: 55, h: 55, label: 'Event\nBus' }
    ],
    edges: [
      { from: 'client', to: 'commandApi' },
      { from: 'client', to: 'queryApi' },
      { from: 'commandApi', to: 'eventStore' },
      { from: 'eventStore', to: 'bus' },
      { from: 'bus', to: 'readModel' },
      { from: 'queryApi', to: 'readModel' }
    ]
  }
];
