ai-legal-assist-callaxis/
│
├── src/
│ ├── app.js
│ ├── index.js
│ │
│ ├── config/
│ │ ├── db.js
│ │ ├── env.js
│ │ └── logger.js
│ │
│ ├── routes/
│ │ ├── index.js
│ │ ├── searchRoutes.js
│ │ └── adminRoutes.js
│ │
│ ├── controllers/
│ │ ├── searchController.js
│ │ └── adminController.js
│ │
│ ├── services/
│ │ ├── searchService.js
│ │ ├── aiService.js
│ │ └── indexService.js # background job to index new docs
│ │
│ ├── models/
│ │ ├── DocumentModel.js
│ │ └── CaseModel.js
│ │
│ ├── utils/
│ │ ├── errorHandler.js
│ │ ├── response.js
│ │ └── textCleaner.js
│ │
│ ├── middleware/
│ │ ├── errorMiddleware.js
│ │ ├── validateQuery.js
│ │ └── rateLimiter.js
│ │
│ └── jobs/
│ ├── aiAnalysisJob.js
│ └── indexDocumentsJob.js
│
├── test/
│ ├── search.test.js
│ └── aiService.test.js
│
├── .env
├── .gitignore
├── package.json
├── README.md
└── Dockerfile
