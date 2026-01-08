import { useState, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";
import MermaidDiagram from "../components/MermaidDiagram";
import ChatNavbar from "../components/ChatNavbar";

// Mock response data based on the schema
const MOCK_RESPONSE = {
  data: {
    requirements: {
      project_name: "E-Commerce Microservices Platform",
      user_roles: [
        {
          role: "Customer",
          description: "Browses products, manages cart, places orders.",
        },
        {
          role: "Admin",
          description: "Manages inventory, views analytics, handles users.",
        },
        { role: "Vendor", description: "Uploads products, tracks sales." },
      ],
      functional_requirements: [
        {
          id: "FR-01",
          requirement: "User Authentication & Authorization",
          priority: "High",
          justification: "Security foundation.",
        },
        {
          id: "FR-02",
          requirement: "Product Catalog Search",
          priority: "High",
          justification: "Core discovery feature.",
        },
        {
          id: "FR-03",
          requirement: "Order Processing",
          priority: "High",
          justification: "Revenue generation.",
        },
      ],
      non_functional_requirements: [
        {
          category: "Scalability",
          requirement: "Handle 10k concurrent users",
          justification: "Expected peak traffic.",
        },
        {
          category: "Availability",
          requirement: "99.9% Uptime",
          justification: "Business continuity.",
        },
      ],
    },
    architecture: {
      architectural_style: {
        style_name: "Event-Driven Microservices",
        reasoning:
          "Allows independent scaling of catalog and order services, and asynchronous processing for robustness.",
      },
      core_components: [
        {
          name: "API Gateway",
          responsibility: "Request routing, auth termination",
          suggested_pattern: "BFF (Backend for Frontend)",
          pattern_justification: "Optimized responses for different clients.",
        },
        {
          name: "Order Service",
          responsibility: "Order lifecycle management",
          suggested_pattern: "Saga Pattern",
          pattern_justification: "Distributed transactions across services.",
        },
        {
          name: "Inventory Service",
          responsibility: "Stock management",
          suggested_pattern: "CQRS",
          pattern_justification: "High read/write discrepancy management.",
        },
      ],
      data_flow_strategy:
        "Asynchronous messaging via Kafka for inter-service communication; Synchronous REST/gRPC for user-facing actions.",
    },
    tech_stack: {
      Frontend: {
        technology: "Next.js",
        justification: "SSR for SEO and performance.",
      },
      Backend: {
        technology: "Go (Golang)",
        justification: "High concurrency and low latency.",
      },
      Database: {
        technology: "PostgreSQL & Redis",
        justification: "Reliable relational data + fast caching.",
      },
      "Message Broker": {
        technology: "Apache Kafka",
        justification: "High throughput event streaming.",
      },
    },
    mermaid_code: `
    graph TD
        Client[Client Apps] -->Gateway[API Gateway]
        Gateway --> Auth[Auth Service]
        Gateway --> Catalog[Catalog Service]
        Gateway --> Order[Order Service]
        
        Order -->|Order Created| Broker[Kafka/Event Bus]
        Broker --> Inventory[Inventory Service]
        Broker --> Notification[Notification Service]
        
        Catalog --> DB1[(Catalog DB)]
        Order --> DB2[(Order DB)]
        Inventory --> DB3[(Inventory DB)]
    `,
  },
};

const STEPS = [
  "Analyzing requirements",
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

  const handleSend = () => {
    if (!prompt.trim()) return;
    setStatus("loading");
    setCurrentStep(0);
  };

  useEffect(() => {
    if (status === "loading") {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < STEPS.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => setStatus("completed"), 1000); // Finish after last step
            return prev;
          }
        });
      }, 1500); // 1.5s per step
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
    } = MOCK_RESPONSE.data.requirements;
    const { architectural_style, core_components, data_flow_strategy } =
      MOCK_RESPONSE.data.architecture;

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
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
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
                <MermaidDiagram code={MOCK_RESPONSE.data.mermaid_code} />
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
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            Recommended Tech Stack
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(MOCK_RESPONSE.data.tech_stack).map(
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatNavbar />
      {renderContent()}
    </div>
  );
};

export default ChatPage;
