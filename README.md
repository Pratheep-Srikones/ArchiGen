# ArchiGen - AI-Powered Software Architecture Generator

ArchiGen is a full-stack web application that leverages artificial intelligence to generate comprehensive software architecture designs from simple user ideas. Transform your basic software concepts into detailed technical specifications with AI assistance.

## 🚀 Features

**ArchiGen automatically generates:**

- **📋 Detailed Requirements** - Functional and non-functional requirements with priorities
- **🏗️ System Architecture** - Core components, architectural patterns, and design decisions
- **⚡ Technology Stack** - Recommended technologies with justifications
- **📊 Visual Diagrams** - Interactive Mermaid diagrams showing system structure
- **💬 AI Chat Assistant** - Get architecture guidance and answer technical questions

## 🛠️ Technology Stack

### Frontend (`web-ui/`)

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

## 📁 Project Structure

```
ArchiGen/
├── agent-service/          # Backend FastAPI service
│   ├── app/
│   │   ├── controllers/    # Business logic
│   │   ├── routers/        # API routes
│   │   ├── schemas/        # Data models
│   │   ├── utils/ai/       # AI service integrations
│   │   ├── data/           # JSON schemas and prompts
│   │   └── main.py         # Application entry point
│   └── requirements.txt    # Python dependencies
├── web-ui/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript definitions
│   └── package.json        # Node.js dependencies
└── README.md
```

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

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Google AI API Key** (for AI services)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Pratheep-Srikones/ArchiGen.git
   cd ArchiGen
   ```

2. **Setup Backend**

   ```bash
   cd agent-service
   pip install -r requirements.txt

   # Configure your Google AI API key
   # Add your API key to environment variables or config
   ```

3. **Setup Frontend**
   ```bash
   cd ../web-ui
   npm install
   ```

### Running the Application

1. **Start the Backend**

   ```bash
   cd agent-service
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the Frontend**

   ```bash
   cd web-ui
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

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
