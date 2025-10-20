# Oplai, the AI-first editor where documents turn into working agents.

> A modern, collaborative platform for creating AI-powered evaluation playbooks and knowledge bases.


**Try now!**: https://oplai.lovable.app/ (Requires simple registration)

---

## 🎯 What is Oplai?

We're creating an AI-native doc editor for AI agent building, so Prompt Engineers and BizOps teams can finally collaborate on operational playbooks.


### ✨ Key Features

- **📖 Smart Playbooks**: Create intelligent knowledge bases with AI-generated questions and answers
- **🤖 AI Assistant**: Interactive chat interface with access to all your playbooks and data
- **👥 Real-time Playbok Management**: Multi-user editing with live presence indicators
- **☁️ Cloud Integration**: Sync with Google Drive, OneDrive, Dropbox, and other cloud providers
- **🔗 API Generation**: Transform playbooks into accessible API endpoints
- **📊 Analytics & Monitoring**: Track progress, completion rates, and performance metrics
- **🎨 Modern UI**: Beautiful, responsive interface built with shadcn-ui components
- **🔐 Secure Authentication**: User management and access control via Supabase

---

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn-ui** - High-quality, accessible React components
- **TipTap** - Rich text editor for collaborative editing
- **React Query** - Data fetching and state management
- **React Router** - Client-side routing

### Backend & Database

- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - User authentication and authorization
- **Supabase Edge Functions** - Serverless functions for AI processing
- **Real-time Subscriptions** - Live collaboration features

### AI & Integrations

- **VibeCoding** - Lovable AI
- **Multiple LLM Providers** - Support for various AI models(ex,Gemini, OpenAI)
- **Google Drive API** - Cloud storage integration
- **RESTful APIs** - Generated endpoints from playbooks

---

## 🏗️ Project Structure

```
oplai-main/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── ui/              # shadcn-ui components
│   │   ├── Auth.tsx         # Authentication components
│   │   ├── AIAssistant.tsx  # AI chat interface
│   │   └── ...
│   ├── pages/               # Route components
│   │   ├── Home.tsx         # Dashboard with stats
│   │   ├── Editor.tsx       # Collaborative editor
│   │   ├── Playbooks.tsx    # Playbook management
│   │   ├── AIAssistant.tsx  # AI chat interface
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and types
│   ├── integrations/        # External service integrations
│   └── assets/              # Static assets
├── supabase/
│   ├── functions/           # Edge functions for AI processing
│   └── migrations/          # Database schema migrations
└── public/                  # Static public assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Supabase account** (for backend services)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd oplai-main
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key
   - Configure any additional API keys for cloud integrations

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 💡 Usage

### Creating Your First Playbook

1. Sign up or log in to the platform
2. Click "Create Playbook" from the dashboard
3. Add content using the rich text editor
4. Generate AI-powered evaluation questions
5. Collaborate with team members in real-time

### AI Assistant

- Access the AI Assistant from the sidebar
- Ask questions about your playbooks
- Get insights and analytics on your data
- Generate summaries and reports

### Cloud Integrations

- Connect your Google Drive, OneDrive, or other cloud storage
- Sync documents automatically
- Import existing knowledge bases

---

## 📊 Features Deep Dive

### Dashboard Analytics

- **Total Playbooks**: Track all knowledge bases
- **Question Statistics**: Monitor evaluation questions and answers
- **Completion Rates**: Visualize progress across all playbooks
- **Recent Activity**: See latest updates and collaborations

### Collaborative Editing

- **Real-time Synchronization**: See changes as they happen
- **User Presence**: View who's currently editing
- **Version History**: Track changes over time
- **Conflict Resolution**: Intelligent merge handling

### AI-Powered Features

- **Question Generation**: Automatic evaluation question creation
- **Intelligent Answers**: AI-powered response generation
- **Content Analysis**: Extract insights from your data
- **Smart Suggestions**: Contextual recommendations

---

## 🤝 Contributing

We welcome contributions to Oplai! This is a Hacktoberfest project.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use existing component patterns
- Add tests for new features
- Update documentation as needed

---

## 👨‍💻 Team & Collaborators

**Project Maintainers:**

- **Gua Tabidze**
- **Levan Parastashvili**

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our community discussions
- **Email**: Contact the maintainers for urgent issues

---

_Built with ❤️ for Hacktoberfest and the developer community_
