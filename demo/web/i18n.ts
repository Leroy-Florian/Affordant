export type Lang = 'fr' | 'en'

const KEY = 'affordant-lang'

export function getLang(): Lang {
  const saved = localStorage.getItem(KEY)
  if (saved === 'fr' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function setLang(lang: Lang): void {
  localStorage.setItem(KEY, lang)
}

export interface Dict {
  dashboardTitle: string
  reactTitle: string
  vanillaTitle: string
  dashLede: string
  colStatus: string
  colService: string
  colKind: string
  open: string
  kindBackend: string
  kindFront: string
  reactLede: string
  vanillaLede: string
  api: string
  owner: string
  controller: string
  response: string
  cancel: string
  order: string
  loading: string
  navDashboard: string
  navReact: string
  navVanilla: string
}

export const T: Record<Lang, Dict> = {
  en: {
    dashboardTitle: 'Dashboard',
    reactTitle: 'React front',
    vanillaTitle: 'Vanilla JS front',
    dashLede:
      'All demo services, wired together. Backends show live status; fronts are pages served here. Click any to open it.',
    colStatus: 'Status',
    colService: 'Service',
    colKind: 'Kind',
    open: 'open ↗',
    kindBackend: 'backend',
    kindFront: 'front',
    reactLede:
      "The Cancel button appears only when the server offers the affordance. Pick an API, toggle the owner, and watch the controller's when flip the link in the live response — and the button with it.",
    vanillaLede:
      'Same contract, no framework: plain affordant calls drive the UI. It reacts as you change the API or the owner toggle.',
    api: 'API',
    owner: 'Authenticated as owner (u1)',
    controller: 'Controller',
    response: 'Response',
    cancel: 'Cancel',
    order: 'Order',
    loading: 'Loading…',
    navDashboard: '← Dashboard',
    navReact: 'React front →',
    navVanilla: 'Vanilla JS front →',
  },
  fr: {
    dashboardTitle: 'Tableau de bord',
    reactTitle: 'Front React',
    vanillaTitle: 'Front Vanilla JS',
    dashLede:
      'Tous les services de la démo, branchés ensemble. Les backends affichent leur statut en direct ; les fronts sont des pages servies ici. Cliquez pour ouvrir.',
    colStatus: 'Statut',
    colService: 'Service',
    colKind: 'Type',
    open: 'ouvrir ↗',
    kindBackend: 'serveur',
    kindFront: 'interface',
    reactLede:
      "Le bouton Annuler n'apparaît que lorsque le serveur propose l'affordance. Choisissez une API, basculez le propriétaire, et regardez le when du contrôleur faire apparaître le lien dans la réponse en direct — et le bouton avec.",
    vanillaLede:
      "Même contrat, sans framework : de simples appels affordant pilotent l'UI. Ça réagit quand vous changez d'API ou de propriétaire.",
    api: 'API',
    owner: 'Authentifié en tant que propriétaire (u1)',
    controller: 'Contrôleur',
    response: 'Réponse',
    cancel: 'Annuler',
    order: 'Commande',
    loading: 'Chargement…',
    navDashboard: '← Tableau de bord',
    navReact: 'Front React →',
    navVanilla: 'Front Vanilla JS →',
  },
}
