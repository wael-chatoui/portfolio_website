import { campaignUrl } from './site';

export function getProducts(english: boolean) {
  return [
    {
      id: 'fluent-flow', name: 'FluentFlow', category: english ? 'French teaching' : 'Enseignement du français',
      description: english ? 'Keep the thread between French lessons: lesson summaries, exercises and vocabulary in one place.' : 'Garder le fil entre deux cours de français : bilans, exercices et vocabulaire dans un même espace.',
      audience: english ? 'For independent French teachers and their students.' : 'Pour les professeurs de français indépendants et leurs élèves.',
      features: english ? ['Lesson summaries from transcripts and teacher notes', 'Practice exercises and vocabulary review', 'Teacher access by request, students by invitation'] : ['Bilans à partir des transcriptions et notes de cours', 'Exercices et révision du vocabulaire', 'Accès professeur sur demande, élèves sur invitation'],
      href: campaignUrl('https://fluent-flow.fr', 'fluent-flow', english ? '/en/teachers' : '/professeurs'),
      cta: english ? 'Discover FluentFlow' : 'Découvrir FluentFlow',
    },
    {
      id: 'fluide', name: 'Fluide', category: english ? 'Training journal' : 'Carnet d’entraînement',
      description: english ? 'Record sets, loads and effort, then review your training by exercise or muscle.' : 'Noter ses séries, charges et efforts, puis suivre sa progression par exercice ou par muscle.',
      audience: english ? 'For people who want to follow their own strength training.' : 'Pour les pratiquants qui veulent suivre leur entraînement en musculation.',
      features: english ? ['Free sessions or a custom programme', 'Repetitions, load, effort and session notes', 'Progress by exercise and muscle group'] : ['Séances libres ou programme personnalisé', 'Répétitions, charge, effort et notes de séance', 'Progression par exercice et groupe musculaire'],
      href: campaignUrl('https://fluide-ppl.vercel.app', 'fluide', '/welcome#exemple'),
      cta: english ? 'Try the demo' : 'Essayer la démo',
    },
    {
      id: 'la-redaction', name: 'La rédaction', category: english ? 'Research and writing' : 'Veille et rédaction',
      description: english ? 'Bring RSS research, saved articles, sourced notes and an editorial calendar into one writing workspace.' : 'Réunir veille RSS, articles enregistrés, notes sourcées et planning éditorial dans un espace de rédaction.',
      audience: english ? 'For independent writers and editorial research.' : 'Pour la rédaction indépendante et la préparation de sujets.',
      features: english ? ['RSS reading and saved articles', 'Notes that keep references separate from your own angle', 'Editorial planning and document exports'] : ['Lecture RSS et articles enregistrés', 'Notes séparant les références de votre propre angle', 'Planning éditorial et exports de documents'],
      href: campaignUrl('https://rss-intern-tool.vercel.app', 'la-redaction', '/demo'),
      cta: english ? 'Try the demo' : 'Essayer la démo',
    },
  ];
}
