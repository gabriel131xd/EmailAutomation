# 📧 EmailAutomation

Automação inteligente para **classificação e resposta de e-mails**.  
Permite analisar textos ou arquivos `.txt`/`.pdf`, identificar se são **Produtivos** ou **Improdutivos** e sugerir automaticamente uma resposta educada e objetiva usando **IA**.

---

## 🔑 Principais Finalidades

- ✍️ **Analisar textos digitados** diretamente na interface.  
- 📂 **Upload de arquivos (.txt / .pdf)** com extração automática do conteúdo.  
- 🤖 **Classificação automática**: Produtivo, Improdutivo, Reclamação, Dúvida, Orçamento, etc.  
- 💡 **Sugestão de resposta** com IA (OpenAI GPT).  
- 📊 Exibição da **confiança da classificação**.  
- 📋 Botão para **copiar resposta** em um clique.  

---

## 🛠️ Tecnologias Usadas

### **Backend (API - Flask no Render)**
- Python 3  
- Flask + Flask-CORS  
- Gunicorn (produção)  
- OpenAI (respostas automáticas)  
- HuggingFace Transformers + Torch (classificação)  
- NLTK / spaCy (NLP extra)  
- PyPDF2 (leitura de PDFs)  
- python-dotenv (variáveis de ambiente)

### **Frontend (Interface - React no Vercel)**
- React 18  
- Vite  
- TypeScript  
- TailwindCSS  
- Lucide-React (ícones SVG modernos)

---

## 📂 Estrutura do Projeto


EmailAutoUmation/
│
├── backend/               # API Flask
│   ├── app.py             # Rotas principais
│   ├── classificar.py     # Classificação de e-mails
│   ├── responder.py       # Sugestão de resposta (OpenAI)
│   ├── utils.py           # Utilidades (PDF / TXT)
│   ├── requirements.txt   # Dependências
│   ├── runtime.txt        # Versão do Python
│   └── Procfile           # Start command (Gunicorn)
│
└── frontend/              # Interface React
    ├── public/            # Arquivos públicos
    ├── src/               # Código-fonte
    │   ├── components/    # Componentes (UploadZone, ResultCard, etc.)
    │   ├── lib/           # API e utils
    │   ├── App.tsx        # App principal
    │   └── main.tsx       # Entrada
    ├── package.json       # Dependências
    └── tailwind.config.js # Configuração Tailwind
## 🌍 Deploy Online

🔗 Backend (Render): https://emailautomation-mqp7.onrender.com

🔗 Frontend (Vercel): https://email-automation-mu.vercel.app
```plaintext

1. Clonar o repositório
git clone https://github.com/gabriel131xd/EmailAutomation.git
cd EmailAutomation

2. Rodar o Backend
cd backend
pip install -r requirements.txt
python app.py

3. Rodar o Frontend
cd frontend
npm install
npm run dev





