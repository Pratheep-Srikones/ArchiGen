import { useState, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Circle,
  Bot,
} from "lucide-react";
import MermaidDiagram from "../components/MermaidDiagram";
import ChatNavbar from "../components/ChatNavbar";
import ChatBot from "../components/ChatBot";
import { getArchitectureResponse } from "@/services/ai";
import type { ProjectData } from "@/types/responses";

// Mock response data based on the schema
const MOCK = {
  data: {
    requirements: {
      project_name: "Gmail Clone",

      user_roles: [
        {
          role: "End User",

          description:
            "Individuals who will use the application to send, receive, organize, and manage emails.",
        },

        {
          role: "Administrator",

          description:
            "Manages user accounts, system settings, and monitors application performance.",
        },
      ],

      functional_requirements: [
        {
          id: "FR001",

          requirement: "User Authentication and Authorization",

          priority: "High",

          justification:
            "Essential for secure access to user data and preventing unauthorized use.",
        },

        {
          id: "FR002",

          requirement: "Email Composing and Sending",

          priority: "High",

          justification:
            "Core functionality of an email client. Users must be able to create and send emails.",
        },

        {
          id: "FR003",

          requirement: "Email Receiving and Displaying",

          priority: "High",

          justification:
            "Core functionality. Users need to see incoming emails.",
        },

        {
          id: "FR004",

          requirement: "Email Inbox Management",

          priority: "High",

          justification:
            "Users need to organize and manage their emails (e.g., marking as read/unread, starring).",
        },

        {
          id: "FR005",

          requirement: "Email Search functionality",

          priority: "High",

          justification:
            "Crucial for users to find specific emails quickly within a potentially large mailbox.",
        },

        {
          id: "FR006",

          requirement: "Folder/Label Creation and Management",

          priority: "Medium",

          justification:
            "Enables users to categorize and organize their emails beyond the basic inbox/sent structure.",
        },

        {
          id: "FR007",

          requirement: "Drafts Saving",

          priority: "Medium",

          justification:
            "Allows users to save emails they are working on but not yet ready to send.",
        },

        {
          id: "FR008",

          requirement: "Spam Filtering",

          priority: "Medium",

          justification:
            "Improves user experience by reducing clutter and potential security threats.",
        },

        {
          id: "FR009",

          requirement: "Attachment Handling (upload/download)",

          priority: "High",

          justification: "Essential for modern email communication.",
        },

        {
          id: "FR010",

          requirement: "User Profile Management",

          priority: "Low",

          justification:
            "Allows users to update their personal information and preferences.",
        },
      ],

      non_functional_requirements: [
        {
          category: "Performance",

          requirement:
            "Emails should be sent and received within 5 seconds under normal network conditions.",

          justification: "Ensures a responsive and efficient user experience.",
        },

        {
          category: "Scalability",

          requirement:
            "The system should be able to handle a growing number of users and emails without significant degradation in performance.",

          justification:
            "Necessary for the long-term viability and growth of the application.",
        },

        {
          category: "Security",

          requirement:
            "All user data, including emails and personal information, must be encrypted both in transit and at rest.",

          justification:
            "Protects sensitive user information from unauthorized access and breaches.",
        },

        {
          category: "Usability",

          requirement:
            "The user interface should be intuitive and easy to navigate, requiring minimal training for new users.",

          justification: "Enhances user adoption and satisfaction.",
        },

        {
          category: "Reliability",

          requirement:
            "The application should have an uptime of at least 99.9%.",

          justification:
            "Ensures consistent availability of the email service.",
        },

        {
          category: "Maintainability",

          requirement:
            "The codebase should be well-structured, documented, and follow coding standards to facilitate future updates and bug fixes.",

          justification:
            "Reduces the cost and effort of ongoing maintenance and development.",
        },
      ],
    },

    architecture: {
      architectural_style: {
        style_name: "Microservices Architecture",

        reasoning:
          "Given the project name 'Gmail Clone' and the diverse functionalities (authentication, email sending/receiving, search, etc.) along with scalability and maintainability NFRs, a microservices architecture is ideal. It allows for independent development, deployment, and scaling of different services (e.g., an authentication service, an email processing service, a search service), enhancing agility and resilience. This aligns well with the 'Gmail Clone' scope, which implies a feature-rich application that can evolve over time.",
      },

      core_components: [
        {
          name: "User Authentication Service",

          responsibility:
            "Handles user registration, login, logout, token generation and validation, and role-based access control (FR001).",

          suggested_pattern: "Command Query Responsibility Segregation (CQRS)",

          pattern_justification:
            "Separates the read (querying user details for login) and write (user registration, password changes) operations, which can have different performance and scaling needs. This aligns with FR001 and general security principles.",
        },

        {
          name: "Email Service",

          responsibility:
            "Manages email composing, sending (FR002), receiving (FR003), storing, and retrieval. Also handles attachment management (FR009) and drafts (FR007).",

          suggested_pattern: "Event Sourcing",

          pattern_justification:
            "Emails are inherently stateful and transactional. Event sourcing can provide an immutable log of all email-related events (sent, received, read, deleted), which aids in auditing, debugging, and rebuilding mailbox states. It also supports scalability for high email volumes.",
        },

        {
          name: "Inbox Management Service",

          responsibility:
            "Handles email organization features like marking as read/unread, starring (FR004), and potentially managing folder/label associations (FR006).",

          suggested_pattern: "Repository Pattern",

          pattern_justification:
            "Provides an abstraction layer over the data storage for emails, allowing the service to focus on managing the metadata and state of emails within a user's mailbox without being tied to a specific database implementation. This facilitates easier updates to storage or querying mechanisms.",
        },

        {
          name: "Search Service",

          responsibility:
            "Provides powerful search capabilities across all emails based on keywords, sender, subject, etc. (FR005).",

          suggested_pattern:
            "Microservice with dedicated search index (e.g., Elasticsearch)",

          pattern_justification:
            "Full-text search is a specialized and resource-intensive operation. Dedicating a service with an optimized search index (like Elasticsearch) allows for high-performance search independent of the primary email storage, meeting FR005's 'crucial' requirement.",
        },

        {
          name: "Spam Filtering Service",

          responsibility:
            "Analyzes incoming emails to identify and flag/quarantine spam (FR008).",

          suggested_pattern: "Observer Pattern",

          pattern_justification:
            "The Spam Filtering Service can 'observe' incoming emails from the Email Service. When a new email arrives, it's processed by the spam filter. The result (e.g., marked as spam, quarantined) can then trigger subsequent actions by the Email Service or Inbox Management Service.",
        },

        {
          name: "User Profile Service",

          responsibility:
            "Manages user profile information and preferences (FR010).",

          suggested_pattern: "CRUD (Create, Read, Update, Delete)",

          pattern_justification:
            "A straightforward pattern suitable for managing relatively static user data. This service will be simpler than others, reflecting the 'Low' priority of FR010.",
        },

        {
          name: "API Gateway",

          responsibility:
            "Single entry point for all client requests, routing them to appropriate microservices. Handles cross-cutting concerns like authentication, rate limiting, and logging.",

          suggested_pattern:
            "Backend for Frontend (BFF) if multiple client types, otherwise standard API Gateway.",

          pattern_justification:
            "Essential in a microservices architecture to provide a unified interface to clients and manage complexity. It also helps in offloading common tasks from individual microservices.",
        },
      ],

      data_flow_strategy:
        "Asynchronous Communication via Message Queues (e.g., Kafka, RabbitMQ) and Synchronous Communication via RESTful APIs or gRPC for direct requests. Asynchronous communication is preferred for inter-service communication where immediate response is not critical (e.g., email processing, spam filtering notifications), aligning with NFRs for performance and scalability. Synchronous communication will be used for direct client-service interactions via the API Gateway and for operations requiring immediate results, like user authentication checks.",
    },

    tech_stack: {
      frontend: {
        technology: "React.js with TypeScript",

        justification:
          "React.js is a popular and robust JavaScript library for building user interfaces, well-suited for complex, dynamic applications like a Gmail clone. TypeScript adds static typing, improving code quality, maintainability, and developer productivity, which is crucial for a large microservices-based project.",
      },

      backend: {
        technology:
          "Node.js (with Express.js) or Go (with Gin/Echo) for most services, Python (with Flask/FastAPI) for Search/Spam Filtering, Java (with Spring Boot) for Auth Service",

        justification:
          "Node.js/Go offers excellent performance for I/O-bound tasks and microservices. Python's rich ecosystem is beneficial for machine learning tasks in Spam Filtering and text processing in Search. Java/Spring Boot is robust for complex authentication logic and enterprise-grade features. This polyglot approach allows leveraging the best tool for each service's specific needs.",
      },

      database: {
        technology:
          "PostgreSQL for User Auth/Profile, MongoDB for Email Service (document storage), Elasticsearch for Search Service, Redis for Caching/Session Management",

        justification:
          "PostgreSQL provides ACID compliance for user data. MongoDB's flexible schema is ideal for evolving email structures and attachments. Elasticsearch is purpose-built for powerful full-text search. Redis offers high-performance caching and session storage, crucial for responsiveness.",
      },

      infrastructure: {
        technology:
          "Kubernetes for Orchestration, Docker for Containerization, Kafka for Message Queuing, Nginx/Envoy for API Gateway, Prometheus/Grafana for Monitoring",

        justification:
          "Kubernetes provides robust container orchestration, auto-scaling, and resilience for microservices. Docker ensures consistent deployment environments. Kafka handles asynchronous event-driven communication between services. Nginx/Envoy acts as an efficient API Gateway. Prometheus and Grafana offer comprehensive monitoring and alerting capabilities.",
      },
    },

    mermaid_code: `graph TD
    Client((Client)) --> API_Gateway
    API_Gateway[API Gateway] --> User_Management_Service
    API_Gateway --> Project_File_Management_Service
    API_Gateway --> Version_Control_Service
    API_Gateway --> Code_Analysis_Service

    User_Management_Service[User Management Service]
    Project_File_Management_Service[Project & File Management Service]
    Real_time_Collaboration_Service[Real-time Collaboration Service]
    Version_Control_Service[Version Control Service]
    Code_Analysis_Service[Code Analysis Service]
    WebSockets_Server[WebSockets Server]

    Client --> WebSockets_Server

    Project_File_Management_Service -- Events --> Real_time_Collaboration_Service
    Real_time_Collaboration_Service -- Broadcasts --> WebSockets_Server
    WebSockets_Server -- Pushes Updates --> Client

    Version_Control_Service -- Events --> Project_File_Management_Service
    Version_Control_Service -- Events --> Real_time_Collaboration_Service

    User_Management_Service -- Authenticates/Authorizes --> API_Gateway

    note for User_Management_Service "API Gateway, CQRS"
    note for Project_File_Management_Service "Repository Pattern"
    note for Real_time_Collaboration_Service "Observer Pattern, Pub/Sub"
    note for Version_Control_Service "Command Pattern, Saga Pattern"
    note for Code_Analysis_Service "Strategy Pattern, Facade Pattern"
    note for API_Gateway "API Gateway"
    note for WebSockets_Server "Pub/Sub"
`,
  },

  message: "Architecture generated successfully",

  error: null,
};

const STEPS = [
  "Analyzing requirements",
  "Analyzing user roles",
  "Designing architecture",
  "Drawing diagram",
  "Suggesting tech stack",
];

const ChatPage = () => {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "completed">(
    "idle"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [architectureData, setArchitectureData] = useState<ProjectData>(
    MOCK.data
  );

  const handleMermaidCodeSave = (newCode: string) => {
    setArchitectureData((prev) => ({
      ...prev,
      mermaid_code: newCode,
    }));
  };
  const handleSend = async () => {
    if (!prompt.trim()) return;
    setStatus("loading");
    setCurrentStep(0);
    try {
      const data = await getArchitectureResponse(prompt);
      setArchitectureData(data.data);
      console.log("Received architecture data:", data);
      console.log("architectureData state:", architectureData);
    } catch (error) {
      console.error("Error generating architecture:", error);
      setStatus("idle");
    }
    setStatus("completed");
  };

  useEffect(() => {
    if (status === "loading") {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < STEPS.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 5000); // 5s per step
      return () => clearInterval(interval);
    }
  }, [status]);

  const renderContent = () => {
    if (status === "idle") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-64px)]">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Describe Your Vision
            </h1>
            <p className="text-gray-500 mb-8 text-center">
              Tell us about the software system you want to build.
            </p>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., I need a scalable e-commerce platform for selling digital art..."
                className="w-full h-40 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 bg-gray-50 mb-4 transition-all"
              />

              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <Sparkles size={16} /> Enhance Prompt
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <ImageIcon size={16} /> Add File
                  </button>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md"
                >
                  Generate Architecture <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (status === "loading") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-64px)]">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Building Your Blueprint
            </h2>
            <div className="space-y-6">
              {STEPS.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 transition-opacity duration-500 ${
                    index > currentStep ? "opacity-40" : "opacity-100"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="text-green-500 w-6 h-6 animate-in zoom-in" />
                  ) : index === currentStep ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Circle className="text-gray-300 w-6 h-6" />
                  )}
                  <span
                    className={`font-medium ${
                      index === currentStep ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {step}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const {
      project_name,
      user_roles,
      functional_requirements,
      non_functional_requirements,
    } = architectureData.requirements;
    const { architectural_style, core_components, data_flow_strategy } =
      architectureData.architecture;

    return (
      <main className="flex-1 container mx-auto p-6 space-y-8 max-w-6xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            Generated Architecture
          </h2>
          <button
            onClick={() => {
              setStatus("idle");
              setPrompt("");
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Start New Project
          </button>
        </div>

        {/* Project Overview */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {project_name}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                User Roles
              </h3>
              <div className="space-y-3">
                {user_roles.map((role, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-800 block">
                        {role.role}
                      </span>
                      <span className="text-sm text-gray-600">
                        {role.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Key Requirements
              </h3>
              <div className="space-y-2">
                {functional_requirements.slice(0, 3).map((req, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-700">{req.requirement}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        req.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {req.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quality Attributes */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Quality Attributes (Non-Functional)
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {non_functional_requirements.map((req, i) => (
              <div
                key={i}
                className="p-4 bg-orange-50 rounded-lg border border-orange-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-orange-900">
                    {req.category}
                  </div>
                </div>
                <p className="text-sm text-orange-800 font-medium mb-1">
                  {req.requirement}
                </p>
                <p className="text-xs text-orange-700 opacity-80">
                  {req.justification}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture & Diagram */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" /> Architectural
                Style
              </h3>
              <div className="mb-4">
                <div className="text-xl font-semibold text-purple-700 mb-2">
                  {architectural_style.style_name}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {architectural_style.reasoning}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Data Flow Strategy
                </h4>
                <p className="text-gray-600 text-sm">{data_flow_strategy}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                System Diagram
              </h3>
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-2">
                <MermaidDiagram
                  code={architectureData.mermaid_code}
                  saveEditedCode={handleMermaidCodeSave}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Core Components */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Core Components
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {core_components.map((comp, i) => (
              <div
                key={i}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50/50"
              >
                <h4 className="font-bold text-gray-800 mb-2">{comp.name}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {comp.responsibility}
                </p>
                <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 p-2 rounded">
                  <span className="font-semibold">Pattern:</span>{" "}
                  {comp.suggested_pattern}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="bg-linear-to-r from-gray-900 to-gray-800 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            Recommended Tech Stack
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(architectureData.tech_stack).map(
              ([category, details]: [string, any], i) => (
                <div key={i} className="space-y-2">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="font-bold text-lg text-blue-300">
                    {details.technology}
                  </div>
                  <div className="text-sm text-gray-400 leading-snug">
                    {details.justification}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </main>
    );
  };

  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatNavbar />
      {renderContent()}

      {/* Mini Assistant Button */}
      <button
        onClick={() => setIsChatBotOpen(true)}
        className="fixed bottom-6 right-6 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2 z-40"
        title="Open Mini Assistant"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">Mini Assistant</span>
      </button>

      {/* ChatBot Sidebar */}
      <ChatBot isOpen={isChatBotOpen} onClose={() => setIsChatBotOpen(false)} />
    </div>
  );
};

export default ChatPage;
