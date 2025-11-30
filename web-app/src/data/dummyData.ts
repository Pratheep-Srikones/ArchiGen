export const dummyArchitecture = {
  summary:
    "A scalable, cloud-native real-time chat application architecture designed for high concurrency and low latency. The system employs a microservices approach with WebSocket connections for real-time messaging, WebRTC for video calling, and object storage for file management. The architecture supports horizontal scaling to handle up to 10,000 concurrent users with distributed message queuing and load balancing.",
  
  techStack: [
    {
      name: "Node.js with Express (Backend API)",
      reason:
        "Excellent for handling concurrent connections with its non-blocking I/O model. Ideal for real-time applications with WebSocket support.",
    },
    {
      name: "React with TypeScript (Frontend)",
      reason:
        "Component-based architecture for building responsive UI. TypeScript ensures type safety and better developer experience.",
    },
    {
      name: "PostgreSQL (Primary Database)",
      reason:
        "Reliable ACID-compliant database for user data, chat history, and relationships. Strong support for complex queries and transactions.",
    },
    {
      name: "Redis (Caching & Session Storage)",
      reason:
        "In-memory data store for session management, real-time presence tracking, and caching frequently accessed data.",
    },
    {
      name: "WebSocket (Socket.io)",
      reason:
        "Enables bidirectional, real-time communication between clients and servers with fallback support for older browsers.",
    },
    {
      name: "AWS S3 / Cloud Storage",
      reason:
        "Scalable object storage for file sharing with CDN integration for fast global content delivery.",
    },
  ],

  reasoning:
    "The proposed architecture prioritizes scalability, performance, and reliability. By using WebSockets for real-time messaging, we ensure low-latency communication. Redis provides fast session storage and caching, reducing database load. PostgreSQL handles persistent data with ACID guarantees. The microservices pattern allows independent scaling of components based on demand. WebRTC enables peer-to-peer video calls, reducing server bandwidth requirements. Load balancers distribute traffic across multiple servers, while message queues (like RabbitMQ or Kafka) can handle asynchronous tasks and ensure message delivery. This architecture can easily scale horizontally by adding more service instances as user load increases.",

  components: [
    {
      name: "API Gateway",
      description:
        "Single entry point for all client requests. Handles authentication, rate limiting, and routes requests to appropriate microservices.",
      technologies: ["Node.js", "Express", "JWT"],
    },
    {
      name: "Real-Time Messaging Service",
      description:
        "Manages WebSocket connections, broadcasts messages, handles typing indicators, and presence status updates.",
      technologies: ["Socket.io", "Redis Pub/Sub", "Node.js"],
    },
    {
      name: "User Service",
      description:
        "Handles user authentication, profile management, and authorization. Manages user relationships and permissions.",
      technologies: ["Node.js", "PostgreSQL", "bcrypt"],
    },
    {
      name: "File Service",
      description:
        "Manages file uploads, processing, and storage. Generates secure upload URLs and handles file metadata.",
      technologies: ["Node.js", "AWS S3", "Sharp"],
    },
    {
      name: "Video Service",
      description:
        "Facilitates WebRTC signaling for peer-to-peer video connections. Manages call state and TURN/STUN servers.",
      technologies: ["WebRTC", "Socket.io", "Coturn"],
    },
    {
      name: "Notification Service",
      description:
        "Sends push notifications, email alerts, and in-app notifications for messages and calls.",
      technologies: ["FCM", "SendGrid", "Redis Queue"],
    },
    {
      name: "Frontend Application",
      description:
        "Progressive web app providing responsive UI for chat, video calls, and file sharing across devices.",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
    },
    {
      name: "Database Layer",
      description:
        "Persistent storage for users, messages, and metadata with read replicas for scalability.",
      technologies: ["PostgreSQL", "Redis", "Connection Pooling"],
    },
  ],
};
