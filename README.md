# ArchiGen - AI-Powered Software Architecture Generator

ArchiGen is a full-stack web application that leverages artificial intelligence to generate comprehensive software architecture designs from simple user ideas. Transform your basic software concepts into detailed technical specifications with AI assistance.

## 🚀 Features

**ArchiGen automatically generates:**

- **🏗️ System Architecture** - Core components, architectural patterns, and design decisions
- **⚡ Technology Stack** - Recommended technologies with justifications
- **📊 Visual Diagrams** - Interactive Mermaid diagrams showing system structure
- **💬 AI Chat Assistant** - Get architecture guidance and answer technical questions

## 🛠️ Technology Stack

### Frontend (`front-end/`)

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Material-UI (MUI)** for UI components
- **Tailwind CSS** for styling
- **Mermaid** for diagram visualization
- **React Router** for navigation
- **Axios** for API communication

### Backend (`agent-service/`)

- **FastAPI** (Python) for the REST API
- **Google AI/Generative AI** services for intelligent analysis
- **Pydantic** for data validation and serialization
- **CORS** middleware for cross-origin requests

## 🎯 How It Works

1. **Input**: User provides a simple software idea or concept
2. **AI Analysis**: Google AI services analyze the requirements
3. **Generation Pipeline**:
   - Requirements extraction and prioritization
   - Architectural pattern selection and component design
   - Technology stack recommendation
   - Visual diagram generation
4. **Output**: Comprehensive technical specification with interactive diagrams

## 🚀 Getting Started

### Development Requirements

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Google AI API Key** (for AI services)
- **Asgardeo Organization** (for authentication)

## 🐳 Deployment

ArchiGen supports two deployment modes: **local development** using Docker Compose and **production** using Docker Swarm.

### Architecture Overview

┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│   Frontend   │────▶│  API Gateway  │────▶│ Agent Service  │
│  (Nginx/80)  │     │   (:8002)     │     │   (:8000)      │
└──────────────┘     └───────┬───────┘     └───────┬────────┘
                             │                     │
                     ┌───────▼───────┐     ┌───────▼────────┐
                     │Project Service│     │  Redis Cache   │
                     │   (:8001)     │     │   (:6379)      │
                     └───────┬───────┘     └────────────────┘
                             │
                     ┌───────▼───────┐
                     │  PostgreSQL   │
                     │   (:5432)     │
                     └───────────────┘

| Service | Description |
| --------- | ------------- |
| **Frontend** | React SPA served via Nginx |
| **API Gateway** | Central entry point, routes requests to internal services, handles Asgardeo auth |
| **Agent Service** | AI-powered architecture generation using Google Gemini |
| **Project Service** | CRUD operations for projects, backed by PostgreSQL |
| **Redis Cache** | Caching layer for the agent service |
| **PostgreSQL** | Persistent storage for project data |

### Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2+)
- **Docker Swarm** initialized (for production deployment only)
- A **Google AI API Key** for Gemini
- An **Asgardeo** organization and client ID (for authentication)

### Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in the required values:

   ```dotenv
   # ── Database ──────────────────────────────────────
   PROJECT_DB_USER=db_user
   PROJECT_DB_PASSWORD=db_password
   PROJECT_DB_NAME=project_db
   PROJECT_DB_PORT=5000

   # ── Service Ports ─────────────────────────────────
   AGENT_SERVICE_PORT=8000
   PROJECT_SERVICE_PORT=8001
   FRONTEND_PORT=5173
   API_GATEWAY_PORT=8002

   # ── Redis ─────────────────────────────────────────
   REDIS_CACHE_PORT=6000

   # ── AI Configuration ──────────────────────────────
   MODEL=gemini-3.1-flash-lite
   GOOGLE_API_KEY=your-google-api-key

   # ── Authentication (Asgardeo) ─────────────────────
   ASGARDEO_ORG=your-asgardeo-organization
   ASGARDEO_CLIENT_ID=your-client-id
   ```

> [!IMPORTANT]
> The `.env` file contains secrets and is git-ignored. Never commit it to version control. Each service may also require its own `.env` file (e.g., `agent-service/.env`, `api-gateway/.env`, `frontend/.env.local`).

---

### Local Development (Docker Compose)

The development setup builds all services from source and exposes individual ports for debugging.

1. **Start all services:**

   ```bash
   docker compose up --build
   ```

2. **Access the application:**

   | Service | URL |
   | --------- | ----- |
   | Frontend | <http://localhost:5173> |
   | API Gateway | <http://localhost:8002> |
   | Agent Service | <http://localhost:8000> |
   | Project Service | <http://localhost:8001> |
   | PostgreSQL | `localhost:5000` |
   | Redis | `localhost:6000` |

3. **Stop all services:**

   ```bash
   docker compose down
   ```

4. **Reset data (remove volumes):**

   ```bash
   docker compose down -v
   ```

> [!TIP]
> The development compose file uses `Dockerfile.dev` for the frontend (with Vite's HMR dev server) and builds backend services directly from their respective `Dockerfile`s. All services are on a shared `archigen_internal` bridge network.

---

### Production Deployment (Docker Swarm)

The production setup uses pre-built Docker images, an overlay network, and Docker Swarm for orchestration with restart policies and replica management.

#### Docker Images

The production compose file references the following pre-built images:

| Service | Image |
| --------- | ------- |
| Agent Service | `pratheepsri/archigen-agent:0.0.1` |
| Project Service | `pratheepsri/archigen-project:0.0.1` |
| API Gateway | `pratheepsri/archigen-api-gateway:0.0.1` |
| Frontend | Built separately using `frontend/Dockerfile` → Nginx |
| PostgreSQL | `postgres:17-alpine` |
| Redis | `redis:8-alpine` |

#### Initialize Docker Swarm

If Swarm is not already initialized:

```bash
docker swarm init
```

#### Deploy the Stack

Use the provided deployment script:

```bash
chmod +x deploy-single-node.sh
./deploy-single-node.sh
```

This script reads variables from `.env` and deploys the stack as `archigen_prod`:

```bash
# What the script runs:
env $(grep -v '^#' .env | xargs) docker stack deploy \
  --with-registry-auth \
  -c docker-compose.prod.yml \
  archigen_prod
```

#### Monitor the Deployment

```bash
# List all services in the stack
docker stack services archigen_prod

# View logs for a specific service
docker service logs archigen_prod_agent_service

# Check service status and replicas
docker service ps archigen_prod_agent_service
```

#### Update a Service

To update a service image after pushing a new version:

```bash
docker service update --image pratheepsri/archigen-agent:0.0.2 archigen_prod_agent_service
```

#### Remove the Stack

```bash
docker stack rm archigen_prod
```

> [!NOTE]
> **Production configuration details:**
>
> - The `agent_service` is configured with **2 replicas** for load distribution.
> - All other services are constrained to `node.role == manager` for single-node deployments.
> - The API Gateway is the only service with an exposed port (`8002`).
> - Data is persisted via Docker named volumes (`postgres_data`, `redis_data`).
> - An **overlay network** (`archigen_overlay`) handles inter-service communication.

---

### Frontend Production Build

The frontend production `Dockerfile` uses a multi-stage build:

1. **Build stage** — Installs dependencies with `pnpm` and creates an optimized static bundle.
2. **Serve stage** — Copies the build output to an **Nginx Alpine** container.

The custom `nginx.conf` enables SPA routing by falling back to `index.html` for all routes:

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

To build the frontend image independently:

```bash
cd frontend
docker build -t archigen-frontend:latest .
docker run -p 80:80 archigen-frontend:latest
```

---

## 💡 Usage

1. **Generate Architecture**: Enter your software idea in the main interface
2. **Review Results**: Examine the generated requirements, architecture, and tech stack
3. **Visualize**: Interact with the Mermaid diagrams showing your system structure
4. **Refine**: Use the chat assistant to ask questions and get architectural guidance
5. **Edit Diagrams**: Modify the generated Mermaid code to customize your diagrams

## 🎯 Use Cases

ArchiGen is perfect for:

- **🔧 Software Engineers** planning new projects
- **👥 Technical Leads** documenting system designs
- **🎓 Students** learning software architecture patterns
- **🚀 Startups** rapid prototyping system designs
- **💼 Consultants** creating technical proposals

## 🤖 AI-Powered Features

- **Intelligent Requirements Analysis**: Automatically extracts functional and non-functional requirements
- **Pattern Recognition**: Suggests appropriate architectural patterns based on requirements
- **Technology Matching**: Recommends suitable tech stacks for your specific needs
- **Visual Generation**: Creates meaningful system diagrams automatically
- **Interactive Guidance**: Chat assistant for architectural questions and best practices

## 🔧 API Endpoints

### Architecture Generation

- `POST /ai/generate-architecture` - Generate complete architecture from user idea
- `GET /health` - Health check endpoint

### Chat Assistant

- `POST /chat/message` - Send message to AI chat assistant
- `GET /chat/history` - Retrieve chat history

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI/Generative AI for powering the intelligent analysis
- Mermaid.js for diagram visualization
- FastAPI and React communities for excellent frameworks

## 📞 Support

If you have questions or need help:

- Create an issue in this repository
- Contact the maintainers
- Check the documentation in the `/docs` folder

---

**ArchiGen** - Bridging the gap between ideas and technical architecture through AI assistance.
