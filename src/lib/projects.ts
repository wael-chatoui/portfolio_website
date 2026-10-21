export function getProjects(english: boolean) {
  return [
    {
      id: 'miria', title: 'Miria.ai', tags: ['Next.js', 'TypeScript', 'Supabase', 'AI / LLMs', 'Stripe'], link: 'https://miria.ai', privateCode: true,
      description: english ? 'My work on the AI expert platform: chat, voice, subscriptions and an operations backoffice.' : 'Mon travail sur la plateforme d’experts IA : chat, voix, abonnements et backoffice.',
      problem: english ? 'Connect expert knowledge, customer conversations and recurring subscriptions in one product.' : 'Relier les connaissances des experts, les conversations clients et les abonnements dans un même produit.',
      delivery: english ? 'Chat flows, Stripe subscriptions and CRM workflows built with Next.js, TypeScript and Supabase.' : 'Parcours de chat, abonnements Stripe et workflows CRM développés avec Next.js, TypeScript et Supabase.',
    },
    {
      id: 'leads', title: 'Lead Generation CRM', tags: ['Python', 'Supabase', 'Next.js', 'Gemini AI'], link: undefined, privateCode: true,
      description: english ? 'My internal acquisition tool: Python scrapers, lead scoring and a Next.js opportunity dashboard.' : 'Mon outil interne d’acquisition : scrapers Python, scoring de prospects et suivi des opportunités en Next.js.',
      problem: english ? 'Bring research, qualification and follow-up together instead of managing scattered prospect lists.' : 'Réunir la recherche, la qualification et le suivi au lieu de gérer des listes de prospects dispersées.',
      delivery: english ? 'Google Maps, agency and company scrapers; Gemini scoring; Supabase storage; opportunity dashboard.' : 'Scrapers Google Maps, ESN et PME, scoring Gemini, stockage Supabase et tableau de suivi des opportunités.',
    },
    {
      id: 'attio', title: 'Attio Bridge', tags: ['Chrome Extension', 'Go', 'PostgreSQL', 'CRM'], link: undefined, privateCode: true,
      description: english ? 'A Chrome extension and Go backend that connect LinkedIn company research to the Attio CRM.' : 'Extension Chrome et backend Go pour relier la recherche d’entreprises LinkedIn au CRM Attio.',
      problem: english ? 'Reduce repeated copying between company research in the browser and the CRM.' : 'Réduire les recopies entre la recherche d’entreprises dans le navigateur et le CRM.',
      delivery: english ? 'A browser extension, a Go/PostgreSQL API, duplicate handling and direct links to Attio records.' : 'Extension navigateur, API Go/PostgreSQL, gestion des doublons et liens directs vers les fiches Attio.',
    },
    {
      id: 'nikolife', title: 'Niko’ Life Rent', tags: ['Next.js', 'TypeScript', 'TailwindCSS'], link: 'https://nikolife-rent.com', privateCode: false,
      description: english ? 'A vehicle rental website with a fleet catalogue, pricing and direct customer contact.' : 'Site de location de véhicules : catalogue de la flotte, tarification et contact client direct.',
    },
    {
      id: 'flashscore', title: 'Flashscore Scraper', tags: ['Python', 'Scraping', 'Data Pipeline'], link: 'https://github.com/wael-chatoui/flashscore-scraper', privateCode: false,
      description: english ? 'An automated sports data pipeline: score, odds and statistics extraction with Google Sheets synchronization.' : 'Pipeline automatisé de données sportives : extraction des scores, cotes et statistiques, avec synchronisation Google Sheets.',
    },
    {
      id: 'blackbox', title: 'AI Call / Blackbox', tags: ['Python', 'AI / NLP', 'Voice', 'API'], link: 'https://github.com/wael-chatoui/AI-CALL-Blackbox', privateCode: false,
      description: english ? 'A voice assistant project for handling and qualifying incoming phone calls through AI APIs.' : 'Projet d’assistant vocal pour l’accueil et la qualification d’appels téléphoniques via des APIs IA.',
    },
  ];
}

export function getOtherProjects(english: boolean) {
  return [
    {
      id: 'hackathons', title: 'Hackathons', summary: english ? 'Team projects built under time constraints' : 'Projets en équipe, sous contrainte de temps',
      projects: [
        { title: 'Antalyzr / AI Tinkerers Paris', description: english ? 'AI workflow orchestration at the Paris Vibe-a-thon.' : 'Orchestration de workflows IA au Paris Vibe-a-thon.', tags: ['Mistral AI', 'n8n', 'OpenAI'] },
        { title: 'Fitlens / Specs in the City', description: english ? 'A fitness and coaching experience for Snapchat Spectacles.' : 'Expérience de fitness et coaching pour les lunettes Snapchat Spectacles.', tags: ['Snap Spectacles', 'AR', 'TypeScript'] },
        { title: 'Vigil / CND Défense', description: english ? 'A real-time firewall monitoring dashboard with threat detection.' : 'Dashboard de surveillance firewall en temps réel et détection de menaces.', tags: ['Python', 'React', 'WebSocket'], link: 'https://github.com/hindkh21/HACKATHON_CND_TEAM3' },
        { title: 'HackTheFork', description: english ? 'A full-stack web app built in 24 hours as a team.' : 'Application web full-stack construite en équipe en 24 heures.', tags: ['TypeScript', 'Next.js'], link: 'https://github.com/wael-chatoui/HackTheFork' },
      ],
    },
    {
      id: 'school', title: '42 Paris', summary: english ? 'C, Unix and systems programming' : 'C, Unix et programmation système',
      projects: [
        { title: 'Minishell', description: english ? 'A Unix shell in C: parsing, pipes, redirections and built-ins.' : 'Shell Unix en C : parsing, pipes, redirections et built-ins.', tags: ['C', 'Unix'], link: 'https://github.com/wael-chatoui/42-minishell' },
        { title: 'Philosophers', description: english ? 'Concurrency with POSIX threads and mutexes.' : 'Concurrence avec threads POSIX et mutex.', tags: ['C', 'Threads'], link: 'https://github.com/wael-chatoui/42-philo' },
        { title: 'FdF', description: english ? 'An isometric wireframe renderer using MiniLibX.' : 'Moteur de rendu isométrique en fil de fer avec MiniLibX.', tags: ['C', 'Graphics'], link: 'https://github.com/wael-chatoui/42-FdF' },
      ],
    },
    {
      id: 'private', title: english ? 'Private work' : 'Travaux privés', summary: english ? 'Discuss the scope and my contribution' : 'Échanger sur le périmètre et ma contribution',
      projects: [{ title: 'Glint', description: english ? 'An iOS visual data collection app, with image validation and AI processing.' : 'Application iOS de collecte de données visuelles, validation d’images et traitement IA.', tags: ['Swift', 'SwiftUI', 'Supabase', 'AI'] }],
    },
  ];
}
